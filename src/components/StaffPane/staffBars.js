// The Line Staff's bars-in-view drop-down (Greg 2026-11-09: a drop-down, like the clock's rings).
export const STAFF_BARS_MENU = [2, 4, 8].map((n) => ({ value: String(n), label: `${n} bars` }));
/** A <select> hands back strings: "4" -> 4. */
export const barsFromMenu = (v) => Number(v);
