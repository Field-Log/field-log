import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type * as React from "react";
import { NotFoundPage } from "@/components/not-found-page";
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
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Machined Pen Archive",
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
        <AppProviders>{children ?? <Outlet />}</AppProviders>
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
