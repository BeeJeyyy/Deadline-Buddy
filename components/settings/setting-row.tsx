interface SettingRowProps {
  title: string;
  description: string;
  /** The control on the right: a switch, select, or button. */
  children: React.ReactNode;
}

/** One labelled setting. Wrap several in a `divide-y` container. */
export function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}