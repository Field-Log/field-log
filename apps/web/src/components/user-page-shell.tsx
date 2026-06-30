import type * as React from "react";
import { AppShell } from "@/components/app-shell";

export function UserPageShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <AppShell sidebarContent={null} title={title}>
      <section className="mx-auto w-full max-w-5xl px-4 py-6 min-[881px]:px-6">
        {children}
      </section>
    </AppShell>
  );
}
