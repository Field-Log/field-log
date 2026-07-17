import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type * as React from "react";
import { SITE_NAME } from "@/lib/constants";
import { NotFoundPage } from "@/pages/not-found-page";
import { AppProviders } from "@/providers/app-providers";
import "../styles.css";

export const Route = createRootRoute({
  component: RootDocument,
  notFoundComponent: RootNotFoundDocument,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      // Launch chromeless (no Safari toolbars) when added to the iOS home
      // screen, so the fixed bottom toolbar is never overlapped by browser
      // chrome. `mobile-web-app-capable` is the standard alias.
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "default",
      },
      {
        name: "apple-mobile-web-app-title",
        content: SITE_NAME,
      },
      {
        title: SITE_NAME,
      },
    ],
  }),
});

function RootDocument({ children }: { children?: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  try {
    const theme = localStorage.getItem("field-log.theme") || "system";
    const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch {}
})();
`,
          }}
        />
      </head>
      <body>
        <div className="root">
          <AppProviders>{children ?? <Outlet />}</AppProviders>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

function RootNotFoundDocument() {
  return (
    <RootDocument>
      <NotFoundPage />
    </RootDocument>
  );
}
