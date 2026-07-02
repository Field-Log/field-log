import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { NotFoundPage } from "@/pages/not-found-page";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createTanStackRouter({
    defaultNotFoundComponent: NotFoundPage,
    routeTree,
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
