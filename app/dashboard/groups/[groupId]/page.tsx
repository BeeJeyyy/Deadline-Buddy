import { GroupView } from "@/components/groups/group-view";
import { getGroupDetail } from "@/lib/data/group";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { group, members, tasks, currentUserId, showCompleted } = await getGroupDetail(groupId);

  return (
    <GroupView
      key={group.id} // resets local state when navigating from one group to another
      group={group}
      members={members}
      initialTasks={tasks}
      currentUserId={currentUserId}
      showCompleted={showCompleted}
      nowIso={new Date().toISOString()}
    />
  );
}