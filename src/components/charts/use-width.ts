"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Width of the chart's container, so the SVG draws at real size: text stays 11–12 px
 * on a phone instead of shrinking with a fixed viewBox. Defaults to `fallback` on the server.
 */
export function useWidth<T extends HTMLElement>(fallback = 720) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, Math.max(280, width)] as const;
}
