-- Profile photos: show each person's Google photo instead of just their initials.
-- Run once in the Supabase SQL editor, AFTER 010_reset_invite_code.sql.
--
-- The photo address is copied from the Google sign-in data into the profile, so groupmates can see it
-- (people can't read each other's sign-in data, but they can read a groupmate's profile).
-- Users can NOT edit this column themselves: it is only ever filled in from the Google sign-in.

alter table public.profiles add column avatar_url text;

-- 1) Fill it in for everyone who has already signed in (only well-formed https addresses are kept)
update public.profiles p
set avatar_url = picked.url
from (
  select u.id, coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture') as url
  from auth.users u
) picked
where picked.id = p.id
  and picked.url like 'https://%'
  and char_length(picked.url) <= 500;

alter table public.profiles
  add constraint profiles_avatar_url_check
  check (avatar_url is null or (avatar_url like 'https://%' and char_length(avatar_url) <= 500)) not valid;

-- 2) Keep it in step with Google. Runs when someone signs up and whenever their sign-in data changes.
create function public.sync_profile_avatar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  url text := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
begin
  if url like 'https://%' and char_length(url) <= 500 then
    update public.profiles set avatar_url = url where id = new.id and avatar_url is distinct from url;
  end if;
  return null;
end;
$$;

-- "...created_avatar" sorts after "...created", so the profile row exists by the time this runs.
create trigger on_auth_user_created_avatar
  after insert on auth.users
  for each row execute function public.sync_profile_avatar();

create trigger on_auth_user_avatar_changed
  after update of raw_user_meta_data on auth.users
  for each row
  when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function public.sync_profile_avatar();