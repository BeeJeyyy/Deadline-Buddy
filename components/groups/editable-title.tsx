"use client";

import { useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAX_TITLE_LENGTH = 120;

interface EditableTitleProps {
  title: string;
  /** Only the group owner can rename; everyone else just sees the text. */
  canEdit: boolean;
  onSave: (title: string) => void;
  className?: string;
}

/**
 * A task title the group owner can rename in place: click the pencil (or double-click the title),
 * type, then press Enter or click away to save. Escape cancels.
 * The pencil shows when the parent row or card has the `group` class and is hovered or focused.
 */
export function EditableTitle({ title, canEdit, onSave, className }: EditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const finished = useRef(false); // stops Enter + blur from saving twice

  if (!canEdit) return <span className={className}>{title}</span>;

  const start = () => {
    finished.current = false;
    setDraft(title);
    setEditing(true);
  };

  const finish = (save: boolean) => {
    if (finished.current) return;
    finished.current = true;
    setEditing(false);
    const next = draft.trim();
    if (save && next && next !== title) onSave(next);
  };

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        maxLength={MAX_TITLE_LENGTH}
        aria-label="Task title"
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            finish(true);
          } else if (e.key === "Escape") {
            finish(false);
          }
        }}
        className="h-8 rounded-md px-2 text-sm"
      />
    );
  }

  return (
    <span className="flex min-w-0 items-start gap-1">
      <span className={cn(className, "min-w-0 flex-1")} onDoubleClick={start}>
        {title}
      </span>
      <button
        type="button"
        onClick={start}
        aria-label={`Rename “${title}”`}
        title="Rename task"
        className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
      >
        <Pencil className="size-3.5" />
      </button>
    </span>
  );
}