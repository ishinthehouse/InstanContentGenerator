# CHANGES

A running log of the InstaForge "next-level" revamp. Newest phase on top.
Each phase is built on its own `feature/*` branch and merged deliberately —
**never push straight to `main`** (the repo auto-deploys to Vercel on push).

---

## Master plan (sequence)

1. **Phase 1 — Slide schema migration** ✅ `feature/slide-schema-migration`
2. **Phase 2 — Backend proxy** ✅ `feature/backend-proxy` (stacked on Phase 1)
3. **Phase 3 — Visual redesign** ✅ `feature/visual-redesign` (stacked on Phase 2)
4. Phase 4 — Layout engine + brand kit (IndexedDB-backed assets)
5. Phase 5 — Scoped editor upgrades (inline `contentEditable` text editing)
6. Phase 6 — Export upgrades (multi aspect-ratio, off-main-thread video)

> **Branch stacking:** each phase branches off the previous one (not `main`),
> since none are merged yet and each builds on the last. Merge in order:
> Phase 1 → `main`, then Phase 2, then Phase 3.

---

## Phase 3 — Visual redesign (dark glassmorphic workspace)

**Branch:** `feature/visual-redesign` (stacked on `feature/backend-proxy`)
**Goal:** turn the flat light form into a premium dark, glassmorphic **3-column
design workspace** (Plan / Produce / Polish) — without touching app logic or the
pixel-exact, html2canvas-captured output surfaces.

### Theme foundation (centralized, low-churn)
- `index.html` — added **Outfit** + **Sora** UI fonts (slide fonts unchanged).
- `tailwind.config.js` — added `font-ui`/`font-display`, a `midnight` surface
  scale, `royal`/`vivid` accents, `bg-brand-gradient` (indigo→pink) +
  `bg-glow-radial`, and `shadow-glow`/`shadow-panel` utilities.
- `src/index.css` — deep-midnight body with layered radial accents,
  `color-scheme: dark` (native controls render dark), readable `option` color,
  and reusable `@layer components` classes so each component stays terse:
  `.glass-panel`, `.glass-panel-strong`, `.glass-input`, `.glass-select`,
  `.btn-primary`, `.btn-ghost`, `.chip`, `.section-title`, `.field-label`.

### Layout
- `src/App.jsx` — rebuilt the shell: sticky glass header with a gradient logo
  mark, and a responsive **3-column grid** (`xl:grid-cols-[plan|produce|polish]`,
  stacks to one column below `xl`). Plan = inputs + media selection (TopicForm /
  BulkUpload + PhotoGrid); Produce = the live preview canvas (sticky); Polish =
  filters + export + Reels script. Friendly empty states fill each region.

### Component re-skins (chrome only)
- TopicForm, SettingsPanel, PhotoGrid, PhotoFilterSelector, ExportButtons,
  ReelsScript, BulkUpload, GuideModal, and the **controls** of CarouselPreview
  (header, font pills, dots, secondary button) all moved to the dark glass system.

### "Learn to use" guide (content refresh)
- Rewrote the GuideModal copy to match the app after Phases 1–3: the Plan /
  Produce / Polish column names, the Repurpose-a-link input, variable 3–10 slide
  count, Photos-or-Videos + reel export, and — most importantly — corrected the
  Setup section from "you'll need your own API keys" to "single posts work out of
  the box via the free hosted generator; add your own key for unlimited + bulk."

### Intentionally NOT restyled (correctness)
- The `#post-preview` Instagram mock (PostPreview) and the `carousel-slide-*`
  cards (SlideCard / VideoReelSlide) keep their realistic light styling — they're
  the html2canvas/MediaRecorder capture targets, so changing them would change
  exported output. Only their surrounding labels/controls were updated.
- No new dependencies (CSS-only transitions; Framer Motion was never installed).

### Verification
- `npm run build` ✅ — all custom utilities/`@apply` resolve.
- `npm run lint` — 11 errors, **all pre-existing** (unused imports + two known
  setState-in-effect rules); none introduced by this phase.
- **Live visual QA** via dev server + screenshots: single-post empty state, bulk
  mode, Settings popover, and the mobile stacked layout — all dark, cohesive, and
  legible (desktop 3-column and 375px mobile both verified).

### Manual QA still recommended before merge
- Generate real content (needs keys) and confirm the **light** PostPreview mock
  and carousel slides still render/export correctly against the dark workspace,
  and that the font/shuffle/download controls look right populated.

---

## Phase 2 — Backend proxy (server-side keys, quota, URL repurposing)

**Branch:** `feature/backend-proxy` (stacked on `feature/slide-schema-migration`)
**Goal:** stop shipping AI provider keys to the browser, cap hosted-generation
cost, and replace the flaky public CORS proxy with a real server-side URL
extractor — without breaking the existing BYOK (bring-your-own-key) flow.

### Why
Keys lived in `localStorage` and were used with `dangerouslyAllowBrowser: true`,
so anyone on the live, ad-funded site could pull a key from devtools. The
"repurpose a link" idea also needed a server fetch (browsers can't fetch
arbitrary cross-origin pages; the old `corsProxy.js` routed users through
`api.allorigins.win`).

### How requests route now
- **User has their own key** (Settings) → browser calls the provider directly
  (unchanged BYOK behavior, now deduplicated through shared modules).
- **No user key** → request goes to `/api/generate`, which uses a server-side key
  and enforces a daily quota. Keys never reach the browser.
- **Bulk generation stays BYOK-only** (it can fan out into many calls); it still
  prompts for a key in Settings. Hosted bulk is a deliberate later follow-up.

### New shared modules (isomorphic — used by client AND serverless)
- `src/utils/contentPrompt.js` — single source of truth for the generation
  prompt + `clampSlideCount`. Client and server can no longer drift.
- `src/utils/aiClient.js` — `callAIProvider` / `parseContentJson` / `generateParsed`
  for all three providers; `allowBrowser` gates the Anthropic browser flag.
- `src/utils/sessionId.js` — stable, non-secret per-browser id for quota keying.

### New serverless functions (Vercel `/api`)
- `api/generate.js` — hosted generation. Resolves the provider key from env
  (`CLAUDE_API_KEY`/`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`,
  `DEFAULT_AI_PROVIDER`), enforces quota, returns parsed `{ content }`.
- `api/repurpose.js` — fetches a blog/article/YouTube URL server-side and returns
  extracted text.
- `api/_lib/quota.js` — best-effort daily limiter (`DAILY_GENERATION_LIMIT`,
  default 40) keyed by session+IP. **In-memory → per-instance; swap for Vercel
  KV/Upstash for durable limits** (call sites unchanged).
- `api/_lib/extract.js` — dependency-free HTML→text extraction (title, og tags,
  paragraphs) + YouTube oEmbed. No new npm packages.

### Modified files
- `src/hooks/useAIGenerate.js` — rewritten to use the shared modules; BYOK calls
  the provider directly, otherwise POSTs to `/api/generate` (surfaces quota /
  no-key errors from the server).
- `src/hooks/useRepurpose.js` (new) — client hook for `/api/repurpose`.
- `src/components/TopicForm.jsx` — compact "Repurpose a link" input above the
  topic box; on extract it fills the topic so it flows through normal generation.
- `src/components/SettingsPanel.jsx` — keys marked **optional**; banner explains
  the free hosted generator vs BYOK (unlimited + bulk).
- `eslint.config.js` — added a Node-globals override for `api/**`.
- `.gitignore` — ignore `.env*` (keep `.env.example`) and `.vercel`.
- `contentPrompt.js` import of `slideSchema` uses an explicit `.js` extension so
  the isomorphic module resolves in raw Node too.

### New config / docs
- `vercel.json` — `maxDuration` 60s (`generate`) / 30s (`repurpose`); AI calls
  exceed the 10s default.
- `.env.example` — documents every server env var. No real keys committed.

### Deployment notes (for when this reaches Vercel)
- Set the env vars above in the Vercel project. With **none** set, the hosted
  endpoint returns a clear "add your own key" message and BYOK still works.
- **Local dev:** `npm run dev` (Vite) does NOT run `/api/*`. To exercise the
  hosted path locally use `vercel dev`. Plain `npm run dev` still fully works for
  BYOK users.

### Verification
- `npm run build` ✅ · `npm run lint` — 11 errors, all pre-existing (no new
  errors from Phase 2; added a Node override so `api/` doesn't trip `no-undef`).
- `node --check` on all four `api/` files ✅.
- Phase 2 unit test (`25 passed, 0 failed`): prompt building + slide-count clamp,
  JSON fence-stripping, quota allow-then-block at the limit + per-key isolation,
  and URL extraction (article via mocked HTML, YouTube via mocked oEmbed, invalid
  URL + non-HTML rejection).

### Manual QA still recommended before merge
- On a Vercel preview with env keys set: generate with **no** key in Settings
  (hosted path) and **with** a key (BYOK) — both should work.
- Exceed `DAILY_GENERATION_LIMIT` and confirm the friendly 429 message.
- Repurpose a real blog URL and a YouTube URL; confirm the topic box fills.

---

## Phase 1 — Slide schema migration

**Branch:** `feature/slide-schema-migration`
**Goal:** replace the hardcoded 5-field `reels_script` shape with a canonical,
variable-length `slides[]` array so later phases (layout engine, brand kit,
variable carousels) build on a flexible foundation. Backward compatible with all
existing content shapes; default 5-slide output is pixel-identical to before.

### Why
The whole app assumed exactly five beats (`hook`, `beat_1..3`, `cta`), each a
string or `{label,text}` object. That blocked variable slide counts and a real
layout engine, and the assumption was duplicated across the preview, the bulk
exporter, and the video exporter.

### New file
- **`src/utils/slideSchema.js`** — the single source of truth for slide shape.
  - Canonical slide: `{ id, role, layoutId, label, text, styleIndex }`.
  - `normalizeSlides(content)` upgrades **any** shape into `slides[]`:
    - new `slides` array (objects or bare strings),
    - legacy `reels_script` (object **or** string fields),
    - returns `[]` when nothing is renderable.
  - `slidesToSegments(slides)` → `{text,label,styleIndex}[]` for the video
    exporter (same shape it already consumed, so `videoExport.js` is untouched).
  - `styleIndexFor(role, ordinal)` keeps the default 5-slide visual mapping
    exact (`hook=0`, beats `1,2,3`, `cta=4`) and cycles interior styles for
    larger counts so every `styleIndex` stays in `[0, STYLE_COUNT)`.
  - Exposes `MIN/MAX/DEFAULT_SLIDE_COUNT` (3 / 10 / 5).

### Modified files
- **`src/hooks/useAIGenerate.js`**
  - Prompt now requests a `slides` array of **exactly N** slides (first `hook`,
    last `cta`, middle `beat`) instead of the fixed `reels_script` object.
  - New `slideCount` param (clamped 3–10, default 5).
  - Claude `max_tokens` 1500 → 3000 (headroom for 10 detailed slides).
- **`src/components/TopicForm.jsx`**
  - Added a **"Slides" (3–10)** selector; `slideCount` flows through `onSubmit`.
- **`src/components/CarouselPreview.jsx`**
  - Reads `normalizeSlides(content)`; maps over the variable slide list instead
    of 5 hardcoded fields. Styles now indexed by `slide.styleIndex`.
  - Export filenames derive from per-slide slugs (`hook`, `beat-1`, … `cta`).
  - Removed two dead imports (`computeSegmentBounds`, `segmentIndexForFraction`).
- **`src/utils/bulkExport.js`**
  - Photo + video zip exporters now normalize each result and handle variable
    slide counts (progress bar sizes off real counts, not `× 5`).
  - `content.txt` script section is generated from the slide list.
- **`src/components/ReelsScript.jsx`**
  - Rewritten to render from `normalizeSlides(content)` (variable count).
  - **Bug fix:** previously rendered `{script.hook}` directly while the AI
    returns `hook` as a `{label,text}` **object** — rendering an object as a
    React child throws. Now reads `.text` via the normalizer.
- **`src/App.jsx`**
  - Passes `content={currentContent}` to `<ReelsScript>` (was `reels_script`).

### Compatibility notes
- **Bulk generation** still emits the legacy `reels_script` shape from the AI
  and the no-AI direct path; the normalizer converts both, so the bulk pipeline
  is unchanged in behavior. (Variable counts for bulk = a later follow-up.)
- `videoExport.js` needed **no changes** — it consumes segment `styleIndex`
  values, which the normalizer guarantees stay in range.

### Verification
- `npm run build` ✅ (clean; warnings are pre-existing SDK/browser externals).
- `npm run lint` — 12 errors, **all pre-existing** (baseline on `main` was 14;
  this branch reduced it). No new lint errors in any touched file.
- Normalizer unit test (`24 passed, 0 failed`) covering: legacy object fields,
  legacy string fields, new 3/5/10-slide arrays, bare-string arrays,
  empty-segment filtering, null/empty content, and the exact default-5
  styleIndex mapping `[0,1,2,3,4]`.

### Manual QA still recommended before merge
- Generate single posts at 3, 5, and 10 slides (photos **and** videos).
- Confirm "Download all slides", "Download video", and bulk zip exports.
- Confirm the Reels Script panel renders text (not `[object Object]`).
