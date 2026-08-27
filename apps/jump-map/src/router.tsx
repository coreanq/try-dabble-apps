import { createRouter } from "@tanstack/react-router";

import { homeRoute } from "@/routes/home";
import { rootRoute } from "@/routes/root";

const routeTree = rootRoute.addChildren([homeRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  // Static assets (og images, the manifest) come from the assets binding;
  // anything else the SPA fallback hands us belongs at the cabinet, where
  // ?lang= is read.
  defaultNotFoundComponent: () => {
    if (typeof window !== "undefined") window.location.replace("/");
    return null;
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
