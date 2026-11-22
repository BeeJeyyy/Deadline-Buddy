import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarSkeleton } from "@/components/dashboard/sidebar-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Someone opened an invite link while signed out and has just signed in: finish joining the group.
  const pendingInvite = (await cookies()).get("pending_invite")?.value;
  if (pendingInvite) redirect(`/join/${encodeURIComponent(pendingInvite)}/accept`);

  // The frame renders straight away. The sidebar fills in when its data arrives, and each page shows its
  // own skeleton (its loading.tsx) the same way.
  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarSkeleton />}>
        <DashboardSidebar />
      </Suspense>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}