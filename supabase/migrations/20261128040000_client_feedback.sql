-- Client-facing decisions and requests.
-- Customers never write content tables directly. They submit an auditable request
-- through the security-definer function below; the admin team then acts on it.

create table if not exists public.client_feedback (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  script_id uuid references public.scripts (id) on delete cascade,
  customer_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('plan_approved', 'plan_change', 'script_approved', 'script_change', 'profile_change')),
  message text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists client_feedback_brand_created_idx on public.client_feedback (brand_id, created_at desc);
create index if not exists client_feedback_open_idx on public.client_feedback (brand_id, status, created_at desc);

alter table public.client_feedback enable row level security;
revoke all on table public.client_feedback from public, anon, authenticated;
grant all on table public.client_feedback to service_role;

comment on table public.client_feedback is 'Customer approvals and change requests. Read by the admin team through the service role only.';

create or replace function public.customer_submit_feedback(
  p_brand_id uuid,
  p_post_id uuid default null,
  p_script_id uuid default null,
  p_kind text default null,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_message text := nullif(left(btrim(coalesce(p_message, '')), 1000), '');
  v_post public.posts%rowtype;
  v_script public.scripts%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('outcome', 'not_authenticated');
  end if;
  if p_brand_id is null or p_kind is null or p_kind not in
      ('plan_approved', 'plan_change', 'script_approved', 'script_change', 'profile_change') then
    return jsonb_build_object('outcome', 'bad_input');
  end if;
  if not exists (select 1 from public.brands b where b.id = p_brand_id and b.owner_id = v_user) then
    return jsonb_build_object('outcome', 'not_allowed');
  end if;
  if p_kind in ('plan_change', 'script_change') and v_message is null then
    return jsonb_build_object('outcome', 'message_required');
  end if;

  if p_post_id is not null then
    select * into v_post from public.posts where id = p_post_id and brand_id = p_brand_id;
    if not found then
      return jsonb_build_object('outcome', 'not_allowed');
    end if;
  end if;

  if p_script_id is not null then
    select s.* into v_script
    from public.scripts s
    join public.posts p on p.id = s.post_id
    where s.id = p_script_id and p.brand_id = p_brand_id;
    if not found then
      return jsonb_build_object('outcome', 'not_allowed');
    end if;
  end if;

  if p_kind in ('plan_change', 'script_change', 'script_approved') and p_post_id is null then
    return jsonb_build_object('outcome', 'bad_input');
  end if;
  if p_kind in ('script_change', 'script_approved') and (p_script_id is null or v_script.post_id is distinct from p_post_id) then
    return jsonb_build_object('outcome', 'bad_input');
  end if;

  if p_kind = 'script_approved' then
    if p_post_id is null or p_script_id is null or v_post.status is distinct from 'script_review'
       or exists (select 1 from public.scripts newer where newer.post_id = v_script.post_id and newer.version > v_script.version) then
      return jsonb_build_object('outcome', 'not_allowed');
    end if;
    if v_script.qa_status is distinct from 'passed' then
      return jsonb_build_object('outcome', 'not_allowed');
    end if;
    update public.posts set status = 'approved', status_reason = null where id = v_post.id;
    update public.scripts set approved_at = coalesce(approved_at, now()) where id = v_script.id;
  end if;

  insert into public.client_feedback (brand_id, post_id, script_id, customer_id, kind, message)
  values (p_brand_id, p_post_id, p_script_id, v_user, p_kind, v_message);
  return jsonb_build_object('outcome', 'saved');
end;
$$;

revoke execute on function public.customer_submit_feedback(uuid, uuid, uuid, text, text) from public, anon;
grant execute on function public.customer_submit_feedback(uuid, uuid, uuid, text, text) to authenticated, service_role;
