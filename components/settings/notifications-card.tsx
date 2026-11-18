"use client";

import { useEffect, useState, useTransition } from "react";
import { BellOff, Send, Smartphone, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { updatePreferences } from "@/app/dashboard/settings/actions";
import {
  removePushSubscription,
  savePushSubscription,
  sendTestNotification,
} from "@/app/dashboard/settings/notification-actions";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Preferences } from "@/types";
import { SettingRow } from "./setting-row";
import { SettingsCard } from "./settings-card";

type PushStatus = "checking" | "on" | "off" | "blocked" | "unsupported" | "needs-install" | "not-configured";
type NotifyPreferences = Pick<
  Preferences,
  "notifyDueToday" | "notifyDueTomorrow" | "notifyOverdue" | "reminderHour"
>;

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** 5 AM to 10 PM; a reminder outside those hours is more annoying than helpful. */
const REMINDER_HOURS = Array.from({ length: 18 }, (_, i) => i + 5);
const formatHour = (hour: number) => `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? "AM" : "PM"}`;

/** Browsers want the public key as bytes, but we store it as a base64url string. */
function keyToBytes(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob((base64Url + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

const STATUS_DESCRIPTION: Record<PushStatus, string> = {
  checking: "Checking this device…",
  on: "This device gets a daily summary of your deadlines, even when the site is closed.",
  off: "Turn on to get one daily summary of what is overdue and due soon.",
  blocked: "Blocked by your browser. See the note below to allow it.",
  unsupported: "This browser can’t receive push notifications.",
  "needs-install": "Install Deadline Buddy on your home screen first.",
  "not-configured": "Not set up on the server yet.",
};

const NOTICES: Partial<Record<PushStatus, { title: string; body: string }>> = {
  blocked: {
    title: "Notifications are blocked for this site",
    body: "Allow them in your browser or phone settings (tap the lock icon next to the address), then reload this page.",
  },
  unsupported: {
    title: "This browser doesn’t support push notifications",
    body: "Try the latest Chrome, Edge, Firefox or Safari. Notifications won’t work in private windows.",
  },
  "needs-install": {
    title: "Add Deadline Buddy to your home screen",
    body: "On iPhone and iPad, notifications only work from the home screen. Tap Share, choose “Add to Home Screen”, open Deadline Buddy from there, then come back and turn this on.",
  },
  "not-configured": {
    title: "Push notifications aren’t set up yet",
    body: "The server is missing its notification keys (VAPID). See the setup notes, then restart the app.",
  },
};

export function NotificationsCard({ initial }: { initial: NotifyPreferences }) {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [busy, setBusy] = useState(false);
  const [timezone, setTimezone] = useState("");
  const [preferences, setPreferences] = useState(initial);
  const [testing, startTesting] = useTransition();
  const [, startSaving] = useTransition();

  // Work out what this browser can do and whether this device is already subscribed.
  useEffect(() => {
    let cancelled = false;

    async function check() {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        const ios =
          /iphone|ipad|ipod/i.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        const installed =
          window.matchMedia("(display-mode: standalone)").matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone === true;
        return ios && !installed ? "needs-install" : "unsupported";
      }
      if (!VAPID_PUBLIC_KEY) return "not-configured";
      if (Notification.permission === "denied") return "blocked";

      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      return subscription && Notification.permission === "granted" ? "on" : "off";
    }

    check()
      .then((result) => !cancelled && setStatus(result))
      .catch(() => !cancelled && setStatus("unsupported"));

    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY!),
        }));

      const result = await savePushSubscription(
        subscription.toJSON(),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.userAgent,
      );
      if (!result.ok) {
        await subscription.unsubscribe();
        setStatus("off");
        toast.error(result.error);
        return;
      }

      setStatus("on");
      toast.success("Notifications are on for this device");
    } catch {
      setStatus("off");
      toast.error("Couldn’t turn on notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("off");
      toast.success("Notifications are off for this device");
    } catch {
      toast.error("Couldn’t turn off notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Update the screen first, save in the background, and undo if saving fails.
  const save = (changes: Partial<NotifyPreferences>) => {
    const previous = preferences;
    setPreferences({ ...preferences, ...changes });

    startSaving(async () => {
      const result = await updatePreferences(changes);
      if (!result.ok) {
        setPreferences(previous);
        toast.error("Couldn’t save your preference. Try again.");
      }
    });
  };

  const sendTest = () =>
    startTesting(async () => {
      const result = await sendTestNotification();
      if (result.ok) toast.success("Sent! Check your notification drawer.");
      else toast.error(result.error);
    });

  const notice = NOTICES[status];
  const canToggle = status === "on" || status === "off";

  return (
    <SettingsCard
      title="Notifications"
      description="Get your deadlines in your phone’s notification drawer, even when Deadline Buddy is closed."
    >
      <div className="space-y-4">
        <div className="divide-y">
          <SettingRow title="Push notifications on this device" description={STATUS_DESCRIPTION[status]}>
            <Switch
              checked={status === "on"}
              onCheckedChange={(checked) => (checked ? enable() : disable())}
              disabled={!canToggle || busy}
              aria-label="Push notifications on this device"
            />
          </SettingRow>

          {status === "on" && (
            <>
              <SettingRow title="Overdue tasks" description="Include tasks that are already past their due date.">
                <Switch
                  checked={preferences.notifyOverdue}
                  onCheckedChange={(checked) => save({ notifyOverdue: checked })}
                  aria-label="Notify about overdue tasks"
                />
              </SettingRow>

              <SettingRow title="Due today" description="Include tasks that are due today.">
                <Switch
                  checked={preferences.notifyDueToday}
                  onCheckedChange={(checked) => save({ notifyDueToday: checked })}
                  aria-label="Notify about tasks due today"
                />
              </SettingRow>

              <SettingRow title="Due tomorrow" description="A heads-up the day before.">
                <Switch
                  checked={preferences.notifyDueTomorrow}
                  onCheckedChange={(checked) => save({ notifyDueTomorrow: checked })}
                  aria-label="Notify about tasks due tomorrow"
                />
              </SettingRow>

              <SettingRow
                stackOnMobile
                title="Daily reminder time"
                description={`Sent once a day, after this time${timezone ? ` in your timezone (${timezone})` : ""}.`}
              >
                <NativeSelect
                  aria-label="Daily reminder time"
                  value={preferences.reminderHour}
                  onChange={(e) => save({ reminderHour: Number(e.target.value) })}
                  className="w-full sm:w-44"
                >
                  {REMINDER_HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      {formatHour(hour)}
                    </option>
                  ))}
                </NativeSelect>
              </SettingRow>

              <SettingRow
                stackOnMobile
                title="Try it out"
                description="Sends a sample notification to every device you turned this on for."
              >
                <Button variant="outline" onClick={sendTest} disabled={testing} className="w-full rounded-xl sm:w-auto">
                  <Send />
                  {testing ? "Sending…" : "Send test"}
                </Button>
              </SettingRow>
            </>
          )}
        </div>

        {notice && (
          <div role="note" className="flex gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
            {status === "needs-install" ? (
              <Smartphone className="mt-0.5 size-4 shrink-0" />
            ) : status === "blocked" ? (
              <BellOff className="mt-0.5 size-4 shrink-0" />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">{notice.title}</p>
              <p className="text-muted-foreground">{notice.body}</p>
            </div>
          </div>
        )}
      </div>
    </SettingsCard>
  );
}