# Shell v2, line queries, loop, Line Staff pane — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, same branch `claude/interface-redesign`).

**Goal:** Greg's 2026-11-05 whiteboard (IMG_9687): lyrics always on the left, Global params OR a single Queries view on the right, stems strip back at the top of Global, header = ABC | title + transport (play, stop, loop, bar·beat) + treble clef | params/queries. Line queries become their own kind again (end-rhyme between lines, drawn on lines only). Query names = the anchor in bold inside ~40 chars of its line. Loop with draggable handles on the tapestry; play always starts at the loop start. Line Staff = the scroll tapestry in a bottom pane under the wrap tapestry, with its own bars (2/4/8) and Freeze/Follow. Global loses the time/stems layout controls (view width + row height + appearance remain).

**Spec:** Greg's message of 2026-11-05 + the sketch (research/annotations not touched).

## Global Constraints
- American spellings. Greybox tokens from Shell.css. No push to remote.
- Keep `timeLayout`/`stemsLayout` params (hidden); main tapestry always wrap.

## Review Focus
1. Clicking a word that is the last word of a line-queried line must not disturb the line query (kinds are independent).
2. Loop end dragged before loop start must be rejected or swapped; handles never leave the song.
3. Staff pane and main tapestry each keep their own layout; closing the pane leaves the main tapestry untouched.
4. Play with loop on from a playhead outside the loop starts at loop start; reaching the end wraps without stopping.
5. Query labels for a run that crosses a line boundary still render (before from the first line, after from the last).

### Task 1: line queries + labels (reducer/context/labels, tests first)
### Task 2: shell v2 (UIState, header, panes, Global panel, combined Queries view)
### Task 3: loop (AudioContext, header button, loop layer, pointToTime)
### Task 4: Line Staff pane (TapestryLayoutProvider timeLayout override, StaffPane)
### Task 5: verify in Chrome, review, docs, memory
