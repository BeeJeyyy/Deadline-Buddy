/* Push notifications are switched off for now. If this browser still has the old notification worker,
   this version removes it and any saved notification subscription, then does nothing else.
   You can delete this file once you are sure no browser still has the old one. */

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const subscription = await self.registration.pushManager.getSubscription();
        if (subscription) await subscription.unsubscribe();
      } catch {
        // Nothing to clean up.
      }
      await self.registration.unregister();
    })(),
  );
});