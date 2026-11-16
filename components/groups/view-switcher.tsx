import { cn } from "@/lib/utils";

const VIEWS = [
  { value: "board", label: "Board" },
  { value: "list", label: "List" },
  { value: "team", label: "Team" },
] as const;

export type GroupViewKey = (typeof VIEWS)[number]["value"];

interface ViewSwitcherProps {
  value: GroupViewKey;
  onChange: (value: GroupViewKey) => void;
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <div role="tablist" aria-label="Group views" className="inline-flex rounded-xl border p-1">
      {VIEWS.map((view) => {
        const active = view.value === value;
        return (
          <button
            key={view.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(view.value)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}