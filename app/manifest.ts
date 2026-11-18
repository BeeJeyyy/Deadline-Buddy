import type { MetadataRoute } from "next";

/** Lets people install Deadline Buddy on their home screen (needed for notifications on iPhone). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Deadline Buddy",
    short_name: "Deadline Buddy",
    description: "Track group project tasks and deadlines together.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}