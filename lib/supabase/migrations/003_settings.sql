-- Settings page: editable profile + saved preferences.
-- Run once in the Supabase SQL editor, AFTER 002_group_detail.sql.

alter table public.profiles
  add column remind_deadlines boolean not null default true,
  add column show_completed   boolean not null default true,
  add column start_page       text    not null default 'dashboard'
    check (start_page in ('dashboard', 'tasks'));

-- Users may edit only their own profile, and only these columns (never the email).
create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

grant update (full_name, remind_deadlines, show_completed, start_page)
  on public.profiles to authenticated;

-- Lets a member leave a group (used by "Delete my groups and tasks").
create policy "group_members: leave own"
  on public.group_members for delete to authenticated
  using (user_id = auth.uid());