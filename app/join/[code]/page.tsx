import Link from "next/link";
import { redirect } from "next/navigation";

import { InvitePreview, type InvitePreviewData } from "@/components/join/invite-preview";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

/**
 * Opened from an invite link.
 * - Signed in: joins the group right away and opens it.
 * - Signed out: shows a read-only preview of the group first, and asks them to sign in with Google
 *   only when they click something.
 */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: groupId, error } = await supabase.rpc("join_group", { code });
    if (!error && groupId) redirect(`/dashboard/groups/${groupId}`);
    return <InvalidInvite signedIn />;
  }

  const { data: preview } = await supabase.rpc("get_invite_preview", { code });
  if (!preview) return <InvalidInvite signedIn={false} />;

  return <InvitePreview code={code} preview={preview as InvitePreviewData} />;
}

function InvalidInvite({ signedIn }: { signedIn: boolean }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold">This invite link isn’t valid</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        It may have been mistyped or the group no longer exists. Ask your groupmate for a new link.
      </p>
      <Button nativeButton={false} render={<Link href={signedIn ? "/dashboard" : "/"} />}>
        {signedIn ? "Back to dashboard" : "Go to Deadline Buddy"}
      </Button>
    </main>
  );
}