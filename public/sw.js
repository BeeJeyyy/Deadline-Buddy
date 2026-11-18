/* Deadline Buddy service worker: shows deadline reminders in the notification drawer, even when the
   site is closed, and opens the right page when one is tapped. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Deadline Buddy", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      tag: data.tag || "deadline-buddy",
      renotify: true,
      data: { url: data.url || "/dashboard/tasks" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/dashboard", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          await client.focus();
          try {
            if ("navigate" in client) await client.navigate(target);
          } catch {
            // Some browsers can't navigate an existing window; falling through to openWindow is fine.
            await self.clients.openWindow(target);
          }
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});