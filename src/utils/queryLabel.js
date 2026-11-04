// src/utils/queryLabel.js
// A query's name: its anchor words inside the surrounding line, trimmed to
// about `chars` characters, so "raise" reads as "…ace, raise me a big…".
// Returns { before, anchor, after }; the view bolds `anchor`.

const ELLIPSIS = "…";

export function trimBefore(text, n) {
  if (text.length <= n) return text;
  const cut = text.slice(text.length - n);
  if (text[text.length - n - 1] === " ") return ELLIPSIS + cut;   // cut lands on a word boundary
  const sp = cut.indexOf(" ");
  return ELLIPSIS + (sp >= 0 ? cut.slice(sp + 1) : cut);
}

export function trimAfter(text, n) {
  if (text.length <= n) return text;
  const cut = text.slice(0, n);
  if (text[n] === " ") return cut + ELLIPSIS;
  const sp = cut.lastIndexOf(" ");
  return (sp >= 0 ? cut.slice(0, sp) : cut) + ELLIPSIS;
}

function wordsOfLine(song, li) {
  return song?.lines?.[li]?.words ?? [];
}

export function queryLabel(q, song, chars = 40) {
  if (!q || !song) return { before: "", anchor: "", after: "" };
  const ids = q.anchorIds ?? [];
  const words = ids.map((id) => song.byId?.get(id)).filter(Boolean);
  if (!words.length) return { before: "", anchor: ids.join(" "), after: "" };
  const first = words[0], last = words[words.length - 1];
  const anchor = words.map((w) => w.text).join(" ");

  const beforeWords = wordsOfLine(song, first.li).slice(0, first.wi).map((w) => w.text);
  const afterWords = q.kind === "line" ? [] : wordsOfLine(song, last.li).slice(last.wi + 1).map((w) => w.text);
  let before = beforeWords.length ? beforeWords.join(" ") + " " : "";
  let after = afterWords.length ? " " + afterWords.join(" ") : "";

  const room = Math.max(0, chars - anchor.length);
  if (q.kind === "line") return { before: trimBefore(before, Math.max(room, 8)), anchor, after: "" };
  const half = Math.floor(room / 2);
  // give unused room on one side to the other
  const bWant = Math.min(before.length, Math.max(half, room - after.length));
  const aWant = Math.min(after.length, Math.max(half, room - before.length));
  before = trimBefore(before, bWant);
  after = trimAfter(after, aWant);
  return { before, anchor, after };
}
