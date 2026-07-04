import * as React from "react";
import { compactMediaQuery, TWO_PANE_MIN_WIDTH } from "@/lib/breakpoints";

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(compactMediaQuery);
    const onChange = () => {
      setIsMobile(window.innerWidth < TWO_PANE_MIN_WIDTH);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < TWO_PANE_MIN_WIDTH);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
