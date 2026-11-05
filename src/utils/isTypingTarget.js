// src/utils/isTypingTarget.js
// True when a key press belongs to a text field (so global shortcuts like
// Space, Cmd-Z and S / D / B stay out of the way). Sliders, checkboxes and
// buttons are not typing.
export function isTypingTarget(el) {
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "textarea" || tag === "select" || el.isContentEditable) return true;
  if (tag !== "input") return false;
  const type = (el.getAttribute?.("type") || "text").toLowerCase();
  return !["range", "checkbox", "radio", "button", "color", "submit"].includes(type);
}
