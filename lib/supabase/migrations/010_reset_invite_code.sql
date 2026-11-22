-- "Reset invite link": lets a group's admin (owner) replace the group's invite code.
-- The old link stops working at once; people who already joined stay in the group.
-- Run once in the Supabase SQL editor, AFTER 009_close_bypasses.sql.

-- Security definer because groups has no UPDATE policy; this function is the only way to change the code,
-- and it checks that the caller owns the group.
create function public.reset_invite_code(gid uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text := replace(gen_random_uuid()::text, '-', '');  -- same format as the column default
begin
  if auth.uid() is null or not public.is_group_owner(gid) then
    raise exception 'Only the group owner can reset the invite link.';
  end if;

  update public.groups set invite_code = new_code where id = gid;
  return new_code;
end;
$$;

revoke all on function public.reset_invite_code(uuid) from public, anon;
grant execute on function public.reset_invite_code(uuid) to authenticated;