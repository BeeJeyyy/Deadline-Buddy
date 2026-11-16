import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
  /** Small number shown after the label, e.g. a task count. */
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  /** Accessible name for the whole control. */
  label: string;
  /** "tabs" switches between views; "options" picks one setting value. */
  kind?: "tabs" | "options";
  className?: string;
}

/** The pill-style switch used for Board/List/Team, task tabs, and the theme picker. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  kind = "tabs",
  className,
}: SegmentedControlProps<T>) {
  const isTabs = kind === "tabs";

  return (
    <div
      role={isTabs ? "tablist" : "radiogroup"}
      aria-label={label}
      className={cn("inline-flex rounded-xl border p-1", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role={isTabs ? "tab" : "radio"}
            aria-selected={isTabs ? active : undefined}
            aria-checked={isTabs ? undefined : active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {option.count !== undefined && <span className="ml-1.5 text-xs opacity-70">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}