-- Invite link preview: lets someone who is NOT signed in see a group before joining it.
-- Run once in the Supabase SQL editor, AFTER 003_settings.sql.
--
-- Anyone who has a group's invite link can see: the group name, member names (no emails),
-- and the tasks (title, status, priority, due date, who it's assigned to). The invite code is the key,
-- so share the link only with people you want to see this.

create or replace function public.get_invite_preview(code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'group', jsonb_build_object('id', g.id, 'name', g.name),
    'members', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', p.id, 'name', coalesce(nullif(trim(p.full_name), ''), 'Member'))
        order by m.joined_at
      )
      from public.group_members m
      join public.profiles p on p.id = m.user_id
      where m.group_id = g.id
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'title', t.title,
          'assigneeId', t.assignee_id,
          'dueDate', t.due_date,
          'status', t.status,
          'priority', t.priority
        )
        order by t.created_at
      )
      from public.tasks t
      where t.group_id = g.id
    ), '[]'::jsonb)
  )
  from public.groups g
  where g.invite_code = code;
$$;

revoke all on function public.get_invite_preview(text) from public;
grant execute on function public.get_invite_preview(text) to anon, authenticated;