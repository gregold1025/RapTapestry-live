// src/utils/perfMarks.js
// Lightweight load-time instrumentation. performance.mark is ~free and lets
// us read "time to tapestry paint" from any browser via
// performance.getEntriesByType("mark").
export function perfMark(name) {
  try {
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(name);
    }
  } catch (_) {
    /* ignore */
  }
}

/** Mark once the browser has actually painted a frame after this call. */
export function perfMarkAfterPaint(name) {
  if (typeof requestAnimationFrame !== "function") return;
  requestAnimationFrame(() => requestAnimationFrame(() => perfMark(name)));
}
