"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/**
 * A small spinner that shows inside a <Link> while its page is loading, so a tap gets an
 * instant response even before the new page's skeleton appears. Must be rendered inside the Link.
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Loader2 className="ml-auto animate-spin text-muted-foreground" aria-hidden="true" />;
}