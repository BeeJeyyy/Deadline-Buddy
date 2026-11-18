import "server-only";

import * as webpush from "web-push";

export interface PushPayload {
  title: string;
  body: string;
  /** Page to open when the notification is tapped. */
  url: string;
  /** A newer notification with the same tag replaces the older one in the drawer. */
  tag?: string;
}

export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** "sent", "gone" (the phone or browser dropped the subscription, so delete it) or "failed". */
export type PushOutcome = "sent" | "gone" | "failed";

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT,
  );
}

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export async function sendPush(subscription: StoredSubscription, payload: PushPayload): Promise<PushOutcome> {
  configure();

  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 12, urgency: "normal" }, // drop it if the phone has been offline for 12 hours
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    return status === 404 || status === 410 ? "gone" : "failed";
  }
}