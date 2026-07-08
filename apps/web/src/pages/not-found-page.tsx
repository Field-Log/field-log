import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-card px-6 py-8 text-center text-card-foreground shadow-sm">
        <p className="text-[12px] font-semibold tracking-[1px] text-muted-foreground uppercase">
          Not found
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-[0.5px]">
          Page unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This page does not exist or is no longer available.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link to="/" />}>
          Return to archive
        </Button>
      </section>
    </main>
  );
}
