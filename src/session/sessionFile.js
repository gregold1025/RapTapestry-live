// src/session/sessionFile.js
// The session file (Greg 2026-11-09): one song's whole session as readable JSON, so it can be
// saved, loaded and shipped as a demo. Glyphs are stored by name ("asset:<folder>/<name>"), never
// by the bundler's URLs, which change between builds; Sets are stored as { $set: [...] }.
export const SESSION_FORMAT = "rap-tapestry-session";
export const SESSION_VERSION = 1;

const ASSET = "asset:";
const pad = (n) => String(n).padStart(2, "0");

/** "<song>-session-<YYYY-MM-DD>.json", the date in local time. */
export function sessionFileName(song, date) {
  return `${song}-session-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

/** A deep copy fit for JSON: Sets as { $set }, glyph URLs as asset references. */
export function toFileValue(value, assetNameOf) {
  if (value instanceof Set) return { $set: [...value].map((v) => toFileValue(v, assetNameOf)) };
  if (Array.isArray(value)) return value.map((v) => toFileValue(v, assetNameOf));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toFileValue(v, assetNameOf)]));
  if (typeof value === "string") { const name = assetNameOf?.(value); return name ? ASSET + name : value; }
  return value;
}

/** The inverse of toFileValue; a glyph this build does not have becomes null. */
export function fromFileValue(value, assetUrlOf) {
  if (Array.isArray(value)) return value.map((v) => fromFileValue(v, assetUrlOf));
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 1 && keys[0] === "$set" && Array.isArray(value.$set)) return new Set(value.$set.map((v) => fromFileValue(v, assetUrlOf)));
    return Object.fromEntries(keys.map((k) => [k, fromFileValue(value[k], assetUrlOf)]));
  }
  if (typeof value === "string" && value.startsWith(ASSET)) return assetUrlOf?.(value.slice(ASSET.length)) ?? null;
  return value;
}

/** The file's text for a session: { song, params, ui, mix, loop, queries }. */
export function buildSessionFile({ song, params, ui, mix, loop, queries }, { now, assetNameOf }) {
  const body = toFileValue({ params, ui, mix, loop, queries }, assetNameOf);
  return JSON.stringify({ format: SESSION_FORMAT, version: SESSION_VERSION, savedAt: now.toISOString(), song, ...body }, null, 2);
}

const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/** Read a session file: { ok, session, notes } or { ok: false, error }; nothing partial. */
export function parseSessionFile(text, { assetUrlOf }) {
  let raw;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: "This is not a session file (it is not JSON)." }; }
  if (!isObj(raw) || raw.format !== SESSION_FORMAT) return { ok: false, error: "This is not a session file (no Rap Tapestry session tag)." };
  if (typeof raw.song !== "string" || !raw.song) return { ok: false, error: "This session file does not name its song." };
  const notes = [];
  if (typeof raw.version === "number" && raw.version > SESSION_VERSION) notes.push(`saved by a newer version (${raw.version}); loaded what this version knows`);
  const part = (k, empty) => (isObj(raw[k]) ? fromFileValue(raw[k], assetUrlOf) : empty);
  return {
    ok: true,
    notes,
    session: { song: raw.song, params: part("params", {}), ui: part("ui", {}), mix: part("mix", {}), loop: part("loop", null), queries: part("queries", null) },
  };
}
