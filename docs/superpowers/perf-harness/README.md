# Perf harness (load / song-switch timing, A/B between builds)

The app emits `performance.mark`s (`src/utils/perfMarks.js`):
`song-fetch-start:<song>`, `song-data-loaded:<song>`, `lyrics-committed`,
`lyrics-painted`, `tapestry-svg-committed`, `tapestry-svg-painted`.
The KPI is **song-data-loaded -> tapestry-svg-painted** (and, for a song
switch, select change -> tapestry-svg-painted).

## Measuring (production build, alternating variants)

Alternating A/B in one page is the only reliable way on a busy machine;
back-to-back single runs vary 2x.

```bash
# 1. build the working tree into dist/
npm run build
# 2. build any comparison commit into dist/<name>/ from a worktree
git worktree add /tmp/wt-base <commit>
ln -s "$PWD/node_modules" /tmp/wt-base/node_modules
cat > /tmp/wt-base/vite.variant.config.js <<CFG
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], publicDir: false, base: '/legacy/',
  build: { outDir: '$PWD/dist/legacy', emptyOutDir: true } })
CFG
(cd /tmp/wt-base && npx vite build --config vite.variant.config.js)
# 3. serve dist/ and open the harness
cp docs/superpowers/perf-harness/harness.html dist/
npx vite preview --port 4173      # then open http://localhost:4173/harness.html
```

In the harness page's console (or via chrome-devtools-mcp `evaluate_script`):

```js
await runAB(['legacy/', ''], 3)   // variants are dist sub-paths; '' = root build
```

Each run loads the variant in a 1400x880 iframe, waits for the Amen paint,
switches to 93Til via the header select, waits again, and returns per-phase
ms plus SVG node counts. Take medians across runs.

## Traces

`analyze_trace.py trace.json.gz [t0_ms t1_ms]` bins main-thread self time by
category, lists long tasks and user-timing marks, and separates
chrome-devtools-mcp **debugger overhead** (`v8::Debugger::AsyncTask*`,
`V8Console::runTask`, `AsyncStackTrace::capture`) which inflates React dev
mode traces by seconds. Prefer production traces; dev-mode traces are only
useful for proportions.
