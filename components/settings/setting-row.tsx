interface SettingRowProps {
  title: string;
  description: string;
  /** The control on the right: a switch, select, or button. */
  children: React.ReactNode;
  /** On phones, put the control under the text instead of beside it (use for selects and buttons). */
  stackOnMobile?: boolean;
}

/** One labelled setting. Wrap several in a `divide-y` container. */
export function SettingRow({ title, description, children, stackOnMobile }: SettingRowProps) {
  return (
    <div
      className={`flex justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:items-center sm:gap-6 ${
        stackOnMobile ? "flex-col items-stretch sm:flex-row" : "items-center"
      }`}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className={stackOnMobile ? "sm:shrink-0" : "shrink-0"}>{children}</div>
    </div>
  );
}