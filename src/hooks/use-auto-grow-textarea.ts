"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Keeps a textarea as tall as its `value`, from one line up to `maxRows`, after which it scrolls
 * inside. Measured in a layout effect so the height is right before paint, including when the
 * value is cleared programmatically after a save.
 */
export function useAutoGrowTextarea(value: string, maxRows: number): RefObject<HTMLTextAreaElement | null> {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const styles = getComputedStyle(el);
    const chrome =
      parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom) + parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
    const max = parseFloat(styles.lineHeight) * maxRows + chrome;
    // Collapse first so a shorter value shrinks the box instead of keeping the old scrollHeight.
    el.style.height = "0px";
    const needed = el.scrollHeight + parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
    el.style.height = `${Math.min(needed, max)}px`;
    el.style.overflowY = needed > max ? "auto" : "hidden";
  }, [value, maxRows]);

  return ref;
}
