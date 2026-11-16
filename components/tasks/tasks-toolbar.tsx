import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/shared/native-select";
import type { Group } from "@/types";

interface TasksToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  groupId: string;
  onGroupChange: (groupId: string) => void;
  groups: Group[];
}

export function TasksToolbar({ query, onQueryChange, groupId, onGroupChange, groups }: TasksToolbarProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <Input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search tasks"
        aria-label="Search tasks"
        className="h-10 w-full rounded-xl sm:w-60"
      />
      <NativeSelect
        aria-label="Filter by group"
        value={groupId}
        onChange={(e) => onGroupChange(e.target.value)}
        className="h-10 w-full sm:w-52"
      >
        <option value="">All groups</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}