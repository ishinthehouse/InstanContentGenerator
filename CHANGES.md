# CHANGES

A running log of the InstaForge "next-level" revamp. Newest phase on top.
Each phase is built on its own `feature/*` branch and merged deliberately —
**never push straight to `main`** (the repo auto-deploys to Vercel on push).

---

## Master plan (sequence)

1. **Phase 1 — Slide schema migration** ✅ (this branch)
2. Phase 2 — Backend proxy (server-side API keys, quotas, real URL repurposing)
3. Phase 3 — Visual redesign (dark glassmorphic chrome, 3-column Plan/Produce/Polish)
4. Phase 4 — Layout engine + brand kit (IndexedDB-backed assets)
5. Phase 5 — Scoped editor upgrades (inline `contentEditable` text editing)
6. Phase 6 — Export upgrades (multi aspect-ratio, off-main-thread video)

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
