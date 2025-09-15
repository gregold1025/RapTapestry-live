import { useEffect } from "react";

/**
 * Fits text so exactly nLines are visible in the container.
 * - containerRef: ref to the scrolling box that holds the lines
 * - options:
 *    nLines: number of visible lines to fit (required)
 *    lineHeight: unitless line-height for the text (default 1.2)
 *    minPx / maxPx: clamps for sanity
 *    verticalPaddingPx: total vertical padding/borders inside the container
 *    scale: manual multiplier (1.0 = computed size; 0.9 smaller; 1.1 larger)
 */
export function useFitTextToLines(
  containerRef,
  {
    nLines,
    lineHeight = 1.2,
    minPx = 12,
    maxPx = 52,
    verticalPaddingPx = 0,
    scale = 1.0,
  }
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !nLines) return;

    const compute = () => {
      const h = el.clientHeight - verticalPaddingPx;
      if (h <= 0) return;
      const raw = h / (nLines * lineHeight);
      const sized = Math.max(minPx, Math.min(maxPx, raw * scale));
      el.style.setProperty("--lyrics-fs", `${sized}px`);
      el.style.setProperty("--lyrics-lh", `${lineHeight}`);
    };

    compute();

    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [
    containerRef,
    nLines,
    lineHeight,
    minPx,
    maxPx,
    verticalPaddingPx,
    scale,
  ]);
}
