import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type * as React from "react";
import { SITE_NAME } from "@/lib/constants";
import { themeStorageKey } from "@/lib/theme";
import type { ThemeBootstrapState } from "@/lib/theme-bootstrap";
import { resolveServerThemeBootstrap } from "@/lib/theme-bootstrap";
import { getCurrentUserSettingsState } from "@/lib/user-settings";
import { NotFoundPage } from "@/pages/not-found-page";
import { AppProviders } from "@/providers/app-providers";
import "../styles.css";

export const Route = createRootRoute({
  component: RootDocument,
  loader: async () => {
    const settingsState = await getCurrentUserSettingsState();

    return {
      settingsState,
      themeBootstrap: resolveServerThemeBootstrap(settingsState),
    };
  },
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
  const loaderData = Route.useLoaderData();
  const themeBootstrap = loaderData?.themeBootstrap ?? {
    serverTheme: null,
    shouldUseServerTheme: false,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript(themeBootstrap),
          }}
        />
      </head>
      <body>
        <div className="root">
          <AppProviders
            initialSettingsState={loaderData?.settingsState ?? null}
          >
            {children ?? <Outlet />}
          </AppProviders>
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

function themeBootstrapScript(themeBootstrap: ThemeBootstrapState) {
  return `
(() => {
  try {
    const serverTheme = ${JSON.stringify(themeBootstrap.serverTheme)};
    const shouldUseServerTheme = ${JSON.stringify(themeBootstrap.shouldUseServerTheme)};
    const theme = shouldUseServerTheme
      ? serverTheme
      : localStorage.getItem(${JSON.stringify(themeStorageKey)}) || "system";
    const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch {}
})();
`;
}
