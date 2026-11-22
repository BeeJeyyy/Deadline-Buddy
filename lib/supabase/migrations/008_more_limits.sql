-- Closes the "slow drip" gaps that 007 leaves open.
-- 007 stops a burst (10,000 requests at once). This stops one account from filling the database a little
-- at a time, and stops free-text fields and device lists from being used to store junk.
--
-- Run once in the Supabase SQL editor, AFTER 007_abuse_limits.sql. It only adds limits.

-- ── 1. Tasks: a total per account and a per-hour rate (on top of 007's per-minute rate) ──
create or replace function public.enforce_task_limits()
returns trigger language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return new; end if;

  if (select count(*) from public.tasks where group_id = new.group_id) >= 500 then
    raise exception 'This group has reached 500 tasks. Delete or finish some before adding more.';
  end if;
  if (select count(*) from public.tasks where created_by = uid) >= 1000 then
    raise exception 'You have reached 1,000 tasks across your groups. Delete finished ones to add more.';
  end if;
  if (select count(*) from public.tasks where created_by = uid and created_at > now() - interval '1 hour') >= 200 then
    raise exception 'You are adding tasks too quickly. Try again in a little while.';
  end if;
  if (select count(*) from public.tasks where created_by = uid and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'You are adding tasks too quickly. Wait a minute and try again.';
  end if;
  return new;
end;
$$;

-- ── 2. Profile text can't be used to store huge strings (NOT VALID: old rows are never rejected) ──
alter table public.profiles
  add constraint profiles_full_name_length check (full_name is null or char_length(full_name) <= 200) not valid,
  add constraint profiles_timezone_length  check (char_length(timezone) <= 64) not valid;

-- ── 3. At most 10 notification devices per account ──
-- Applies to everyone, including the server (which saves devices with the service role).
create function public.enforce_push_subscription_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Re-saving a device that already exists is fine.
  if exists (select 1 from public.push_subscriptions where endpoint = new.endpoint) then return new; end if;

  if (select count(*) from public.push_subscriptions where user_id = new.user_id) >= 10 then
    raise exception 'You already turned notifications on for 10 devices. Turn some off first.';
  end if;
  return new;
end;
$$;

create trigger push_subscriptions_enforce_limit
  before insert on public.push_subscriptions
  for each row execute function public.enforce_push_subscription_limit();