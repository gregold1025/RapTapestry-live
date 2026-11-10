// src/session/demo.js
// The demo session (Greg 2026-11-09) lives in public/data/demo-session.json. Until it exists, a dev
// server or a host may answer with the app's own page (200, HTML): that means "no demo yet".

/** The demo file's text, or null when there is none. */
export function demoText({ ok, contentType, text }) {
  if (!ok) return null;
  if (/html/i.test(contentType ?? "")) return null;
  return /^\s*\{/.test(text ?? "") ? text : null;
}
