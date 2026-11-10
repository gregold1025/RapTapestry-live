// src/session/loadPlan.js
// Loading a session (Greg 2026-11-09): which song to be on, and when the per-song state applies.

/** A file for another song switches songs first. */
export const loadPlan = (currentSong, session) => ({ switchSong: session.song !== currentSong });

/** The per-song state (queries, mix, loop) applies once the session's song is mounted, and once. */
export const shouldApply = (pending, mountedSong) => !!pending && !pending.applied && pending.song === mountedSong;
