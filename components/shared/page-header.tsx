import { SidebarTrigger } from "@/components/ui/sidebar";

interface PageHeaderProps {
  title: string;
  /** Optional actions shown on the right (buttons, etc.). */
  children?: React.ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:min-h-[70px] sm:px-7">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <SidebarTrigger className="-ml-1 lg:hidden" />
        <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}