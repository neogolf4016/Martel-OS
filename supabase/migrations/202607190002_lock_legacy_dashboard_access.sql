-- Production-safe lock-down for the legacy app_state compatibility table.
-- Only the two established Martel Auth accounts may access dashboard data.

begin;

create or replace function public.is_martel_dashboard_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    array[
      'allanmartel@hotmail.com',
      'stefaniemartel@hotmail.com'
    ]::text[]
  );
$$;

revoke all on function public.is_martel_dashboard_user() from public;
grant execute on function public.is_martel_dashboard_user() to authenticated;

alter table public.app_state enable row level security;

drop policy if exists "Authenticated users can read app state" on public.app_state;
drop policy if exists "Authenticated users can insert app state" on public.app_state;
drop policy if exists "Authenticated users can update app state" on public.app_state;
drop policy if exists "Martel users can read app state" on public.app_state;
drop policy if exists "Martel users can insert app state" on public.app_state;
drop policy if exists "Martel users can update app state" on public.app_state;

create policy "Martel users can read app state"
on public.app_state for select to authenticated
using (public.is_martel_dashboard_user());

create policy "Martel users can insert app state"
on public.app_state for insert to authenticated
with check (public.is_martel_dashboard_user());

create policy "Martel users can update app state"
on public.app_state for update to authenticated
using (public.is_martel_dashboard_user())
with check (public.is_martel_dashboard_user());

commit;
