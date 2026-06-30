import type * as React from "react";
import { PageFooter } from "@/components/page-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";

type AppShellProps = {
  children: React.ReactNode;
  defaultSidebarOpen?: boolean;
  headerActions?: React.ReactNode;
  meta?: React.ReactNode;
  onSidebarOpenChange?: (open: boolean) => void;
  sidebarContent?: React.ReactNode;
  sidebarOpen?: boolean;
  title: string;
};

export function AppShell({
  children,
  defaultSidebarOpen = true,
  headerActions,
  meta,
  onSidebarOpenChange,
  sidebarContent,
  sidebarOpen,
  title,
}: AppShellProps) {
  return (
    <SidebarProvider
      defaultOpen={defaultSidebarOpen}
      onOpenChange={onSidebarOpenChange}
      open={sidebarOpen}
      style={
        {
          "--sidebar-width": "18rem",
        } as React.CSSProperties
      }
    >
      <Sidebar className="border-sidebar-border">
        <SidebarHeader className="items-end border-b border-sidebar-border md:hidden">
          <SidebarTrigger aria-label="Close sidebar" />
        </SidebarHeader>
        <SidebarContent className="scrollbar-none px-2 py-3">
          {sidebarContent}
        </SidebarContent>
        <SidebarFooter className="gap-8 border-t border-sidebar-border px-3 pt-4 pb-3">
          <ThemeToggle />
          <UserMenu />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="flex min-h-svh flex-col bg-background text-foreground">
          <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-background/90 px-3.5 py-2.5 backdrop-blur min-[881px]:px-5 min-[881px]:py-3.5">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <h1 className="m-0 text-[16px] font-bold tracking-[0.5px] min-[881px]:text-lg">
              {title}
            </h1>
            {meta ? (
              <span className="text-xs text-muted-foreground min-[881px]:text-sm">
                {meta}
              </span>
            ) : null}
            <div className="hidden flex-1 min-[881px]:block" />
            {headerActions}
          </header>
          <div className="flex-1">{children}</div>
          <PageFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
