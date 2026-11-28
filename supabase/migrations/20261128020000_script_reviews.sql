-- Admin review history for managed-client scripts.
-- Server-only, like human_reviews: customers must never see internal notes.
create table if not exists public.script_reviews (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  script_id uuid not null references public.scripts (id) on delete cascade,
  decision text not null check (decision in ('approve', 'changes_requested')),
  note text,
  admin text not null,
  created_at timestamptz not null default now()
);

create index if not exists script_reviews_post_id_idx on public.script_reviews (post_id, created_at);
create index if not exists script_reviews_script_id_idx on public.script_reviews (script_id, created_at);

alter table public.script_reviews enable row level security;
revoke all on table public.script_reviews from public, anon, authenticated;
grant select, insert, update, delete on table public.script_reviews to service_role;

create or replace function public.review_script(
  p_script_id uuid,
  p_decision text,
  p_note text,
  p_admin text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_script public.scripts%rowtype;
  v_post public.posts%rowtype;
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
begin
  if p_script_id is null or p_decision not in ('approve', 'changes_requested') or p_admin is null or btrim(p_admin) = '' then
    return jsonb_build_object('outcome', 'bad_input');
  end if;

  select s.* into v_script
  from public.scripts s
  where s.id = p_script_id
  for update;
  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  select p.* into v_post
  from public.posts p
  where p.id = v_script.post_id
  for update;
  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if exists (
    select 1 from public.scripts newer
    where newer.post_id = v_script.post_id
      and (newer.version > v_script.version or (newer.version = v_script.version and newer.created_at > v_script.created_at))
  ) then
    return jsonb_build_object('outcome', 'not_latest');
  end if;

  if v_post.status is distinct from 'script_review' then
    return jsonb_build_object('outcome', 'not_in_review');
  end if;

  if p_decision = 'approve' then
    if v_script.qa_status is distinct from 'passed' or nullif(btrim(coalesce(v_script.spoken_text, '')), '') is null then
      return jsonb_build_object('outcome', 'not_ready');
    end if;

    update public.posts set status = 'approved', status_reason = null where id = v_post.id;
    insert into public.script_reviews (post_id, script_id, decision, note, admin)
    values (v_post.id, v_script.id, 'approve', v_note, p_admin);
    return jsonb_build_object('outcome', 'approved');
  end if;

  insert into public.script_reviews (post_id, script_id, decision, note, admin)
  values (v_post.id, v_script.id, 'changes_requested', v_note, p_admin);
  return jsonb_build_object('outcome', 'changes_requested');
end;
$$;

revoke execute on function public.review_script(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.review_script(uuid, text, text, text) to service_role;
