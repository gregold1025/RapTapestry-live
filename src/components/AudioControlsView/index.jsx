// src/components/AudioControlsView/index.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { PlayPauseButton } from "./UIElements/PlayPauseButton";
import { StopButton } from "./UIElements/StopButton";
import { ScrubSlider } from "./UIElements/ScrubSlider";
import { VolumeControl } from "./UIElements/VolumeControl";
import "./AudioControlsView.css";

/**
 * Props:
 *  - boundsRef?: React.RefObject<HTMLElement>  // pass the left-pane ref so we can confine dragging
 */
function fmtTime(sec = 0) {
  if (!isFinite(sec)) return "0:00";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function AudioControlsView({ boundsRef }) {
  const {
    audioRefs,
    isPlaying,
    duration,
    playAll,
    pauseAll,
    stopAll,
    seekAll,
  } = useAudioEngine();

  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1.0);

  // ── Floating/minimize state ──────────────────────────────────────────────────
  const panelRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [boundsRect, setBoundsRect] = useState(null);
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0 });

  const refreshBounds = useCallback(() => {
    const node = boundsRef?.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    setBoundsRect({
      left: r.left + window.scrollX,
      top: r.top + window.scrollY,
      right: r.right + window.scrollX,
      bottom: r.bottom + window.scrollY,
      width: r.width,
      height: r.height,
    });
  }, [boundsRef]);

  useLayoutEffect(() => {
    refreshBounds();
    const onResize = () => refreshBounds();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [refreshBounds]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !boundsRect) return;
    const w = panel.offsetWidth || 360;
    const h = panel.offsetHeight || 120;
    const x = Math.max(boundsRect.left + 12, boundsRect.right - w - 12);
    const y = Math.max(boundsRect.top + 12, boundsRect.bottom - h - 12);
    setPos({ x, y });
  }, [boundsRect]);

  const clampToBounds = (x, y) => {
    const panel = panelRef.current;
    if (!panel || !boundsRect) return { x, y };
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;

    const minX = boundsRect.left + 4;
    const maxX = boundsRect.right - w - 4;
    const minY = boundsRect.top + 4;
    const maxY = boundsRect.bottom - h - 4;

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

  const startDrag = (clientX, clientY) => {
    setDragging(true);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      x: pos.x,
      y: pos.y,
    };
  };
  const moveDrag = (clientX, clientY) => {
    if (!dragging) return;
    const dx = clientX - dragStartRef.current.mouseX;
    const dy = clientY - dragStartRef.current.mouseY;
    const next = clampToBounds(
      dragStartRef.current.x + dx,
      dragStartRef.current.y + dy
    );
    setPos(next);
  };
  const endDrag = () => setDragging(false);

  // Mouse dragging
  const onMouseDown = (e) => {
    const isHandle = minimized
      ? e.currentTarget === panelRef.current // whole bar is handle in minimized
      : !!e.target.closest?.("[data-drag-handle='true']");
    if (!isHandle) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };
  useEffect(() => {
    const onMove = (e) => moveDrag(e.clientX, e.clientY);
    const onUp = () => endDrag();
    if (dragging) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  // Touch dragging
  const onTouchStart = (e) => {
    const isHandle = minimized
      ? e.currentTarget === panelRef.current
      : !!e.target.closest?.("[data-drag-handle='true']");
    if (!isHandle) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  };
  const onTouchMove = (e) => {
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  };
  const onTouchEnd = endDrag;

  // ── Time & volume ───────────────────────────────────────────────────────────
  useEffect(() => {
    let rafId;
    const update = () => {
      const t = audioRefs.current.vocals?.currentTime || 0;
      setCurrentTime(t);
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [audioRefs]);

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    Object.values(audioRefs.current).forEach((a) => {
      a.volume = newVol;
    });
  };

  // ── Spacebar play/pause ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (isTyping) return;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        isPlaying ? pauseAll() : playAll();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPlaying, playAll, pauseAll]);

  return (
    <div
      ref={panelRef}
      className={`audio-controls-float ${minimized ? "is-min" : ""} ${
        dragging ? "is-drag" : ""
      }`}
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label="Audio transport"
    >
      {minimized ? (
        <div className="ac-min-row">
          <div className="ac-min-group" aria-label="Transport mini">
            <button
              className="ac-min-btn"
              onClick={() => (isPlaying ? pauseAll() : playAll())}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>

            <button
              className="ac-min-btn"
              onClick={stopAll}
              title="Stop"
              aria-label="Stop"
            >
              ⏹
            </button>

            <ScrubSlider
              value={currentTime}
              max={duration || 0}
              onChange={seekAll}
              variant="mini"
              ariaLabel="Scrub"
            />

            <button
              className="ac-min-btn ac-min-expand"
              onClick={(e) => {
                e.stopPropagation();
                setMinimized(false);
              }}
              title="Expand controls"
              aria-label="Expand controls"
            >
              ▢
            </button>
          </div>
        </div>
      ) : (
        // ── Full panel ────────────────────────────────────────────────────────
        <>
          <div className="ac-header" data-drag-handle="true" title="Drag me">
            <span className="ac-title">Transport</span>
            <button
              className="ac-min-btn"
              onClick={() => setMinimized(true)}
              aria-label="Minimize controls"
              title="Minimize"
            >
              —
            </button>
          </div>

          <div className="audio-controls">
            <div className="ac-transport">
              <PlayPauseButton
                isPlaying={isPlaying}
                onClick={() => (isPlaying ? pauseAll() : playAll())}
              />
              <StopButton onClick={stopAll} />
            </div>

            <div className="ac-scrub-row">
              <ScrubSlider
                value={currentTime}
                max={duration || 0}
                onChange={seekAll}
              />
            </div>

            <div className="ac-time-row">
              <span className="ac-time ac-time-current">
                {fmtTime(currentTime)}
              </span>
              <span className="ac-time ac-time-total">{fmtTime(duration)}</span>
            </div>

            <div className="ac-volume">
              <VolumeControl
                volume={volume}
                onVolumeChange={handleVolumeChange}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
