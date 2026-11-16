import { SidebarTrigger } from "@/components/ui/sidebar";

interface PageHeaderProps {
  title: string;
  /** Optional actions shown on the right (buttons, etc.). */
  children?: React.ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="flex h-[70px] items-center justify-between gap-3 border-b px-7">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
      </div>
      {children}
    </header>
  );
}