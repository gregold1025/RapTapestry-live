// src/utils/matchLabel.js
// One wording for a match everywhere it is named (lyrics hover, tapestry and Line Staff
// tooltips, the Queries list): the identity, its tags in parentheses, and the form when it is
// not a whole word. "loosened (family+additive) mosaic"; an anchor is "query".
// The names themselves live in src/engine/rhymeTypes.js (RHYME_TYPES) and are temporary.

/** "(family, additive)" or "" */
export function tagsText(tags) {
  return tags?.length ? `(${tags.join(", ")})` : "";
}

/** @param v { type, tags?, form?, isAnchor? } a visual entry or a match */
export function matchLabel(v) {
  if (!v) return null;
  if (v.isAnchor || v.type === "anchor") return "query";
  const parts = [v.type];
  const t = tagsText(v.tags);
  if (t) parts.push(t);
  if (v.form && v.form !== "word") parts.push(v.form);
  return parts.join(" ");
}
