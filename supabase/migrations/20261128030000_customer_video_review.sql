-- Phase 6: customer video review.
-- Customers can decide only on their own delivered post videos. The decision
-- is recorded privately and the customer-facing status never exposes internal
-- render/provider details.

create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  customer_id uuid not null references auth.users (id) on delete cascade,
  decision text not null check (decision in ('approve', 'redo', 'skip')),
  reason text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists customer_reviews_video_id_idx on public.customer_reviews (video_id, created_at desc);
create index if not exists customer_reviews_customer_id_idx on public.customer_reviews (customer_id, created_at desc);

alter table public.customer_reviews enable row level security;
revoke all on table public.customer_reviews from public, anon, authenticated;
grant select, insert, update, delete on table public.customer_reviews to service_role;

-- post_id is safe for the customer's own rows and lets the dashboard connect
-- a finished video to its content-plan title. Storage paths remain private.
grant select (post_id) on public.videos to authenticated;

comment on table public.customer_reviews is 'Customer video decisions. Server-only audit trail; the client never receives internal QA details.';

create or replace function public.customer_review_video(
  p_video_id uuid,
  p_decision text,
  p_reason text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_video public.videos%rowtype;
  v_reason text := nullif(left(btrim(coalesce(p_reason, '')), 80), '');
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
begin
  if v_user is null then
    return jsonb_build_object('outcome', 'not_authenticated');
  end if;
  if p_video_id is null or p_decision is null or p_decision not in ('approve', 'redo', 'skip') then
    return jsonb_build_object('outcome', 'bad_input');
  end if;
  if p_decision = 'redo' and (v_reason is null or v_reason not in
      ('wrong_words', 'does_not_look_like_me', 'wrong_topic', 'captions', 'music', 'other')) then
    return jsonb_build_object('outcome', 'bad_input');
  end if;
  if p_decision <> 'redo' and v_reason is not null then
    return jsonb_build_object('outcome', 'bad_input');
  end if;

  perform pg_advisory_xact_lock(hashtext('customer_video_review'), hashtext(p_video_id::text));

  select * into v_video
  from public.videos
  where id = p_video_id
  for update;

  if not found or v_video.kind is distinct from 'post' or v_video.status is distinct from 'ready'
     or v_video.final_path is null
     or not exists (
       select 1 from public.brands b
       where b.id = v_video.brand_id and b.owner_id = v_user
     ) then
    return jsonb_build_object('outcome', 'not_allowed');
  end if;

  if exists (select 1 from public.customer_reviews where video_id = v_video.id) then
    return jsonb_build_object('outcome', 'already_reviewed');
  end if;

  insert into public.customer_reviews (video_id, post_id, customer_id, decision, reason, note)
  values (v_video.id, v_video.post_id, v_user, p_decision, v_reason, v_note);

  if p_decision = 'approve' then
    insert into public.qa_reports (video_id, script_id, gate, passed, issues)
    values (v_video.id, v_video.script_id, 'customer', true, '[]'::jsonb);
    return jsonb_build_object('outcome', 'approved');
  end if;

  if p_decision = 'skip' then
    update public.videos
    set status = 'skipped', counts_toward_plan = false
    where id = v_video.id;
    update public.posts
    set status = 'skipped', status_reason = null
    where id = v_video.post_id;
    insert into public.qa_reports (video_id, script_id, gate, passed, issues)
    values (
      v_video.id,
      v_video.script_id,
      'customer',
      true,
      jsonb_build_array(jsonb_build_object('code', 'customer_skipped', 'detail', 'Customer skipped this video.'))
    );
    return jsonb_build_object('outcome', 'skipped');
  end if;

  update public.videos
  set status = 'failed', counts_toward_plan = false,
      error = 'Customer requested a new version (' || v_reason || ').'
  where id = v_video.id;
  update public.posts
  set status = 'approved', status_reason = 'We''re preparing another version.'
  where id = v_video.post_id;
  insert into public.qa_reports (video_id, script_id, gate, passed, issues)
  values (
    v_video.id,
    v_video.script_id,
    'customer',
    false,
    jsonb_build_array(jsonb_build_object('code', 'customer_redo_' || v_reason, 'detail', coalesce(v_note, v_reason)))
  );
  return jsonb_build_object('outcome', 'redo_requested');
end;
$$;

revoke execute on function public.customer_review_video(uuid, text, text, text) from public, anon;
grant execute on function public.customer_review_video(uuid, text, text, text) to authenticated, service_role;

create or replace function public.customer_reviewed_video_ids()
returns table(video_id uuid)
language sql
security definer
set search_path = ''
as $$
  select cr.video_id
  from public.customer_reviews cr
  where cr.customer_id = auth.uid()
  order by cr.created_at desc;
$$;

revoke execute on function public.customer_reviewed_video_ids() from public, anon;
grant execute on function public.customer_reviewed_video_ids() to authenticated, service_role;
