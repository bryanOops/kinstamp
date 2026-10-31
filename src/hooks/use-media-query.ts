"use client";

import { useSyncExternalStore } from "react";

/** Whether a CSS media query matches, kept in sync with the window. `serverFallback` is used while rendering on the server. */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
    () => serverFallback,
  );
}
