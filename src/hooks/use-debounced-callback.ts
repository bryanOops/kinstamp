"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * A `run` that calls the latest `callback` once `delay` ms have passed without another call,
 * and a `cancel` that drops the pending call. Pending calls are dropped on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): readonly [run: (...args: Args) => void, cancel: () => void] {
  const latest = useRef(callback);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const run = useCallback(
    (...args: Args) => {
      cancel();
      timer.current = setTimeout(() => {
        timer.current = null;
        latest.current(...args);
      }, delay);
    },
    [cancel, delay],
  );

  return [run, cancel] as const;
}
