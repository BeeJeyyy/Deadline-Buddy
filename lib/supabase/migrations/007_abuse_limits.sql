-- Abuse protection that lives in the database, so it can't be skipped.
-- Anyone can call your Supabase API directly (the anon key is public), which bypasses the website and
-- any captcha on it. These limits stop someone with an account from creating thousands of groups,
-- tasks or members, or from storing huge text.
--
-- Run once in the Supabase SQL editor, AFTER 006_notifications.sql.
-- It never changes who is allowed to do what; it only adds limits. Raise or lower the numbers as you like.

-- ── 1. Who created each task (needed to rate-limit people) ──────────
alter table public.tasks
  add column created_by uuid default auth.uid() references public.profiles (id) on delete set null;

create index tasks_created_by_created_at_idx on public.tasks (created_by, created_at);
create index groups_created_by_created_at_idx on public.groups (created_by, created_at);
create index group_members_user_id_joined_at_idx on public.group_members (user_id, joined_at);

-- ── 2. Text limits (NOT VALID: they apply to new and edited rows, and never reject your old data) ──
alter table public.groups
  add constraint groups_name_length check (char_length(btrim(name)) between 1 and 60) not valid;

alter table public.tasks
  add constraint tasks_title_length check (char_length(btrim(title)) between 1 and 120) not valid;

-- ── 3. Limits on how much one account can create ────────────────────
-- Signed-out callers (auth.uid() is null: the SQL editor, the service role) are not limited.
-- security definer so the counts are exact even when row level security hides other people's rows.

create function public.enforce_group_limits()
returns trigger language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return new; end if;

  if (select count(*) from public.groups where created_by = uid) >= 20 then
    raise exception 'You can own up to 20 groups. Delete one you no longer need first.';
  end if;
  if (select count(*) from public.groups where created_by = uid and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'You are creating groups too quickly. Wait a minute and try again.';
  end if;
  return new;
end;
$$;

create trigger groups_enforce_limits
  before insert on public.groups
  for each row execute function public.enforce_group_limits();


create function public.enforce_task_limits()
returns trigger language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return new; end if;

  if (select count(*) from public.tasks where group_id = new.group_id) >= 500 then
    raise exception 'This group has reached 500 tasks. Delete or finish some before adding more.';
  end if;
  if (select count(*) from public.tasks where created_by = uid and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'You are adding tasks too quickly. Wait a minute and try again.';
  end if;
  return new;
end;
$$;

create trigger tasks_enforce_limits
  before insert on public.tasks
  for each row execute function public.enforce_task_limits();


create function public.enforce_member_limits()
returns trigger language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return new; end if;

  if (select count(*) from public.group_members where group_id = new.group_id) >= 50 then
    raise exception 'This group is full (50 members).';
  end if;
  if (select count(*) from public.group_members where user_id = new.user_id) >= 100 then
    raise exception 'You can be in up to 100 groups. Leave one first.';
  end if;
  if (select count(*) from public.group_members where user_id = uid and joined_at > now() - interval '1 minute') >= 10 then
    raise exception 'You are joining groups too quickly. Wait a minute and try again.';
  end if;
  return new;
end;
$$;

create trigger group_members_enforce_limits
  before insert on public.group_members
  for each row execute function public.enforce_member_limits();