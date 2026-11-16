"use client";

import { useEffect, useState } from "react";

/**
 * Starts from the server's timestamp so server and client markup match,
 * then switches to the visitor's own clock (correct timezone for "overdue").
 */
export function useNow(serverIso: string): Date {
  const [now, setNow] = useState(() => new Date(serverIso));
  useEffect(() => setNow(new Date()), []);
  return now;
}