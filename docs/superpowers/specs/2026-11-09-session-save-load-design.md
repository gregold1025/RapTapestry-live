# Session save and load: design

Date: 2026-11-09. Branch: `claude/rhyme-protocol`. Decided with Greg in chat.

## Intent

Someone working in Rap Tapestry can save their whole session for a song to a file, and anyone can
load that file later to get back exactly that state: the queries, the colors, every parameter and
the view. The same mechanism serves a demo: Greg will make a demo session once save and load work,
and the deployed app offers it with one click.

## Goals

- **Two buttons in the header:** **Download** saves the session as a file. **Upload** opens a small
  menu with two choices: **Load demo**, and **Choose file…** (a file picker).
- **What a session holds (Greg: "everything, except restore the playhead to the beginning"):**
  - the song;
  - every query, the focused query, each query's type pills, search radius and options, and the
    focused-query solo;
  - every parameter in the Params context (about 80: colors, sizes, glyph choices, bands, drum
    classes and bands, the Line Staff's and the Rhyme Clock's settings);
  - the stem mix: show, mute, solo for each stem, and the volume;
  - the loop: on or off, start, end;
  - the view: lyrics open, right pane open and which view it shows, which params panel, Line Staff
    open, its bars and mode, Rhyme Clock open, full size or docked, the Global submenus' open
    state, the match list's grouping (by time or by type).
- **Format:** a readable JSON file named after the song and date, e.g.
  `Amen-session-2026-11-09.json`. It starts with a format tag and a version number, so files
  saved today still load after the app changes.
- **One song per file:** loading a file for another song switches to that song first, then
  restores the rest.
- **Replace, not merge:** loading replaces everything listed above. Anything the file does not
  mention returns to its default.
- **Demo:** `public/data/demo-session.json`, fetched by "Load demo". Until Greg makes it, the
  file does not exist, and "Load demo" says so.

## Non-goals

- **No unsaved-changes warning** (Greg: losing a session on reload, song change or loading is
  fine for now).
- No undo history in the file; undo starts fresh after a load.
- No playhead position: playback starts at the beginning, and the Line Staff and the clock start
  in Follow.
- No cloud storage, accounts, links or autosave.
- Passing UI is not saved: hover, open pop-ups and menus, the Drums and Vocals panels' row
  accordions.

## Anti-goals

- A file saved on one deploy must not break on another. Glyphs are stored by name, never by the
  bundler's asset URLs, which change from build to build.
- Loading a bad or foreign file must not half-apply. It is checked first; if it fails, nothing
  changes and the person sees why.

## Constraints

- React and Vite, no backend; static files are served from `public/`.
- Parameters and UI state live above the song (they survive a song switch). Queries, the stem mix,
  the loop and the audio are mounted per song (keyed by song), so they can only be restored after
  the song has loaded.
- Workflow: test first (Vitest), the whole suite, `npm run build`, then a check in Chrome.

## Decided by Claude (Greg may revisit)

- **Header placement:** the two buttons sit at the header's right, before the params and queries
  toggles, in the header toggles' style.
- **File shape:** `{ format: "rap-tapestry-session", version: 1, savedAt, song, params, ui, mix,
  loop, queries }`. Unknown keys are ignored. A file with a newer version than the app loads what
  it recognizes and notes it.
- **Glyph references:** every glyph value is stored as `asset:<folder>/<name>`. A name the app no
  longer has falls back to the default glyph.
- **Query integrity:** queries reference word and line ids of that song. A query whose words no
  longer exist (changed song data) is dropped and counted in the load message.
- **Three local states move into shared state** so a session can reach them: the clock's full
  size (now in ClockPane), the volume (now in the transport), and the match grouping (now in
  QueriesView).
- **Feedback:** a short status line after a load: "Loaded Amen session", with notes on dropped
  queries or an unknown version.
