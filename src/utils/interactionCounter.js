// Shared monotonic counter for interaction stamps across all selection contexts.
// Guarantees unique ordering even for sub-millisecond interactions.
let counter = 0;
export function nextStamp() { return ++counter; }
