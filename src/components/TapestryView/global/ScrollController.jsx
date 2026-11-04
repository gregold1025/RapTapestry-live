// src/components/TapestryView/global/ScrollController.jsx
// The scroll time layout's window, ported from the Line Staff prototype:
// the content (one row as wide as the song) is translated so the playhead
// sits two thirds across the view while following; when following and
// playing, only what the playhead has passed is revealed; dragging freezes
// the window and scrubs it; a plain click on the background plays from there.
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useAudioEngine } from "../../../contexts/AudioContext";
import { followScroll, clampScroll, revealInset } from "../../../utils/scrollWindow";
import { isBackgroundTarget } from "./scrollTarget";
import "../TapestryView.css";

export default function ScrollController({ containerRef, contentRef }) {
  const { layout } = useTapestryLayout();
  const { subscribePlayhead, getPlayheadTime, seekAll, playAll, isPlaying } = useAudioEngine();
  const [follow, setFollow] = useState(true);
  const [where, setWhere] = useState("");
  const needleRef = useRef(null);

  // Everything the per-frame update reads lives in refs: no re-render per tick.
  const st = useRef({ scrollX: 0, follow: true, playing: false, layout: null, drag: null, justDragged: false });
  st.current.layout = layout;
  st.current.follow = follow;
  st.current.playing = isPlaying;

  const frame = useCallback((t) => {
    const S = st.current;
    const lay = S.layout;
    const content = contentRef.current;
    if (!lay || !lay.singleRow || !content) return;
    const viewW = lay.viewWidth, contentW = lay.width;
    const xP = lay.timeToPixels(t).x;
    const outside = xP < S.scrollX || xP > S.scrollX + viewW;
    if (S.follow && (S.playing || outside)) S.scrollX = followScroll(xP, viewW, contentW);
    else S.scrollX = clampScroll(S.scrollX, viewW, contentW);
    content.style.transform = `translateX(${(-S.scrollX).toFixed(2)}px)`;
    const inset = revealInset({ follow: S.follow, playing: S.playing, xPlayhead: xP, contentWidth: contentW });
    content.style.clipPath = inset > 0 ? `inset(0 ${inset.toFixed(1)}px 0 0)` : "none";
    const needle = needleRef.current;
    if (needle) {
      const X = xP - S.scrollX;
      const show = X >= 0 && X <= viewW && (S.playing || t > 0);
      needle.style.display = show ? "block" : "none";
      needle.style.left = `${X.toFixed(1)}px`;
    }
    const u = S.scrollX / lay.pxPerBar;
    const lo = Math.floor(u) + 1, hi = Math.min(Math.ceil(u + lay.barsPerRow), Math.ceil(contentW / lay.pxPerBar));
    const label = `bars ${lo}${hi > lo ? `–${hi}` : ""}${S.follow && S.playing ? " · following" : S.follow ? "" : " · frozen"}`;
    setWhere((prev) => (prev === label ? prev : label));
  }, [contentRef]);

  useEffect(() => subscribePlayhead(frame), [subscribePlayhead, frame]);
  useEffect(() => { frame(getPlayheadTime()); }, [layout, follow, isPlaying, frame, getPlayheadTime]);

  // Leaving the scroll layout: the content wrapper is React's again, so undo
  // the transform and reveal clip written here.
  useEffect(() => {
    const content = contentRef.current;
    return () => { if (content) { content.style.transform = ""; content.style.clipPath = ""; } };
  }, [contentRef]);

  // Drag to scrub (freezes), click on the background to play from there.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onDown = (e) => {
      if (e.button !== 0) return;
      st.current.drag = { x: e.clientX, scrollX: st.current.scrollX, moved: false };
    };
    const onMove = (e) => {
      const S = st.current, d = S.drag;
      if (!d) return;
      if (!d.moved && Math.abs(e.clientX - d.x) > 4) {
        d.moved = true; el.style.cursor = "grabbing";
        if (S.follow) setFollow(false);
        S.follow = false;
      }
      if (!d.moved) return;
      S.scrollX = clampScroll(d.scrollX - (e.clientX - d.x), S.layout.viewWidth, S.layout.width);
      frame(getPlayheadTime());
    };
    const onUp = (e) => {
      const S = st.current, d = S.drag;
      if (!d) return;
      S.drag = null; el.style.cursor = "";
      if (d.moved) { S.justDragged = true; setTimeout(() => { S.justDragged = false; }, 0); }
    };
    // A plain click on the background plays from there (glyph clicks are the
    // glyphs' own: this native listener runs before React's root handler, so
    // their stopPropagation cannot reach it).
    const onClick = (e) => {
      const S = st.current;
      if (S.justDragged) { e.stopPropagation(); e.preventDefault(); return; }
      if (!S.layout?.singleRow || !isBackgroundTarget(e.target)) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left + S.scrollX;
      seekAll(S.layout.xToTime(x));
      if (!S.playing) playAll();
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick);
    };
  }, [containerRef, frame, getPlayheadTime, seekAll, playAll]);

  return (
    <>
      <div ref={needleRef} className="scroll-needle" aria-hidden="true" />
      <div className="scroll-toolbar">
        <span className="scroll-where">{where}</span>
        <button
          type="button"
          className={`scroll-follow ${follow ? "is-on" : ""}`}
          onClick={(e) => { e.stopPropagation(); setFollow((f) => !f); }}
          title={follow
            ? "Following the playhead: the window scrolls and content appears as it is played. Click to freeze it where it is."
            : "Frozen: the window stays put and shows everything in it. Click to follow the playhead again."}
        >
          {follow ? "Freeze" : "Follow"}
        </button>
      </div>
    </>
  );
}
