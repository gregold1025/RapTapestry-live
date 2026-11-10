// src/components/Shell/SessionButtons.jsx
// The header's session buttons (Greg 2026-11-09): Download saves the session for this song as a
// JSON file; Upload opens a menu: "Load demo" (public/data/demo-session.json) or "Choose file…".
// A short status line under them says what happened.
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "../../session/SessionContext";
import { demoText } from "../../session/demo";

const DEMO_URL = `${import.meta.env.BASE_URL}data/demo-session.json`;

const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 16V5M7 9.5l5-5 5 5M5 19.5h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function SessionButtons({ initialOpen = false }) {
  const { saveSession, loadSessionText, status, setStatus } = useSession();
  const [open, setOpen] = useState(initialOpen);
  const wrap = useRef(null);
  const file = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onDown); };
  }, [open]);

  useEffect(() => {
    if (!status) return undefined;
    const t = setTimeout(() => setStatus(null), status.error ? 8000 : 4000);
    return () => clearTimeout(t);
  }, [status, setStatus]);

  const loadDemo = async () => {
    setOpen(false);
    try {
      const res = await fetch(DEMO_URL, { cache: "no-store" });
      const text = demoText({ ok: res.ok, contentType: res.headers.get("content-type"), text: await res.text() });
      if (text == null) { setStatus({ text: "No demo session yet.", error: true }); return; }
      loadSessionText(text);
    } catch {
      setStatus({ text: "No demo session yet.", error: true });
    }
  };
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";   // choosing the same file again still loads it
    if (f) loadSessionText(await f.text());
  };

  return (
    <div className="rt-session" ref={wrap}>
      <button type="button" className="rt-tog" onClick={saveSession} title="Save this session" aria-label="Save this session"><IconDownload /></button>
      <button type="button" className={`rt-tog ${open ? "is-active" : ""}`} aria-pressed={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)} title="Load a session" aria-label="Load a session"><IconUpload /></button>
      {open && (
        <div className="rt-session-menu" role="menu">
          <button type="button" role="menuitem" onClick={loadDemo}>Load demo</button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); file.current?.click(); }}>Choose file…</button>
        </div>
      )}
      <input ref={file} type="file" accept=".json,application/json" hidden onChange={onFile} />
      {status && <div className={`rt-session-status${status.error ? " is-error" : ""}`} role="status">{status.text}</div>}
    </div>
  );
}
