import { RefreshCw } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const TRIGGER_DISTANCE = 72; // px of pull needed to fire a refresh
const MAX_PULL = 96; // clamp so the indicator never runs away

type PullToRefreshProps = {
  children: React.ReactNode;
  onRefresh: () => void;
  refreshing: boolean;
};

/**
 * Compact-only pull-to-refresh for the document-scrolled archive. It only
 * engages when the page is already scrolled to the top and the finger drags
 * down, so it never fights normal scrolling. The indicator follows the pull and
 * spins while `refreshing`; it is hidden at `md`+ where the wrapper collapses to
 * `display: contents` and adds no box. Untested on a real touch device — verify
 * the feel on-device.
 */
export function PullToRefresh({
  children,
  onRefresh,
  refreshing,
}: PullToRefreshProps) {
  const [pull, setPull] = React.useState(0);
  const startYRef = React.useRef<number | null>(null);

  const reset = () => {
    setPull(0);
    startYRef.current = null;
  };

  return (
    <div
      className="relative md:contents"
      onTouchEnd={() => {
        if (pull >= TRIGGER_DISTANCE && !refreshing) onRefresh();
        reset();
      }}
      onTouchMove={(event) => {
        if (startYRef.current === null || refreshing) return;
        const touch = event.touches[0];
        if (!touch) return;
        const delta = touch.clientY - startYRef.current;
        // Cancel the gesture the moment the page starts scrolling or the pull
        // reverses; otherwise track it with resistance.
        if (delta <= 0 || window.scrollY > 0) {
          setPull(0);
          return;
        }
        setPull(Math.min(delta * 0.5, MAX_PULL));
      }}
      onTouchStart={(event) => {
        if (refreshing || window.scrollY > 0) return;
        startYRef.current = event.touches[0]?.clientY ?? null;
      }}
    >
      <div
        aria-hidden={!(refreshing || pull > 0)}
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center md:hidden"
        style={{
          opacity: refreshing || pull > 8 ? 1 : 0,
          transform: `translateY(${refreshing ? 8 : pull - 32}px)`,
          transition:
            startYRef.current === null
              ? "transform 200ms ease-out, opacity 200ms ease-out"
              : "none",
        }}
      >
        <span className="mt-2 flex size-9 items-center justify-center rounded-full border border-border bg-card shadow-md">
          <RefreshCw
            className={cn(
              "size-4 text-muted-foreground",
              refreshing && "animate-spin",
            )}
            style={
              refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }
            }
          />
        </span>
      </div>
      {children}
    </div>
  );
}
