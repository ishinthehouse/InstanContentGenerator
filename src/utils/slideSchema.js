/**
 * Canonical slide schema + backward-compatibility layer.
 *
 * The app historically modeled a carousel as a fixed `reels_script` object with
 * exactly five named fields (hook, beat_1, beat_2, beat_3, cta), each either a
 * plain string or a `{ label, text }` object. That hardcoded shape blocked
 * variable slide counts and a real layout engine.
 *
 * This module introduces one canonical representation — a `slides[]` array — and
 * a normalizer that upgrades ANY historical shape into it:
 *   • new content that already has `slides`           → validated/filled
 *   • legacy `reels_script` (object or string fields) → converted
 *   • an array of bare strings                        → converted
 *
 * Every consumer (preview, video export, bulk zip, script list) reads `slides`
 * via this module, so the fixed-5 assumption lives in exactly one place.
 *
 * A slide:
 *   {
 *     id:         string   - stable key
 *     role:       'hook' | 'beat' | 'cta'
 *     layoutId:   string   - layout template id (LayoutSelector, later phase)
 *     label:      string|null - short hook label (e.g. "DID YOU KNOW?")
 *     text:       string   - the slide copy
 *     styleIndex: number   - 0..STYLE_COUNT-1, selects the visual/canvas style
 *   }
 */

// Number of distinct visual styles available (SLIDE_STYLES / CANVAS_STYLES length).
export const STYLE_COUNT = 5;

// Allowed range for the variable slide count exposed in the form.
export const DEFAULT_SLIDE_COUNT = 5;
export const MIN_SLIDE_COUNT = 3;
export const MAX_SLIDE_COUNT = 10;

// Legacy fixed-field order → semantic role.
const LEGACY_FIELDS = [
  { key: 'hook', role: 'hook' },
  { key: 'beat_1', role: 'beat' },
  { key: 'beat_2', role: 'beat' },
  { key: 'beat_3', role: 'beat' },
  { key: 'cta', role: 'cta' },
];

// Default layout per role. The LayoutSelector (later phase) will let users
// override these per slide; for now they drive nothing visual but are carried
// through so the rest of the pipeline is layout-aware from day one.
const DEFAULT_LAYOUT = {
  hook: 'minimal-cover',
  beat: 'editorial',
  cta: 'cta',
};

// Human label fallback per role, used for filenames / the script list.
const ROLE_LABEL = {
  hook: 'Hook',
  beat: 'Beat',
  cta: 'CTA',
};

/** Read the text out of a string-or-{label,text} value. */
export const getText = (val) =>
  val && typeof val === 'object' ? val.text ?? '' : val ?? '';

/** Read the label out of a {label,text} value (null for bare strings). */
export const getLabel = (val) =>
  val && typeof val === 'object' ? val.label ?? null : null;

/**
 * Assign a visual style index from role + position so the default 5-slide case
 * is pixel-identical to the legacy layout (hook=0, beats=1,2,3, cta=4) and any
 * larger count cycles the middle styles while keeping cover/cta bookends.
 */
export function styleIndexFor(role, beatOrdinal = 0) {
  if (role === 'hook') return 0;
  if (role === 'cta') return STYLE_COUNT - 1;
  // beats cycle through the interior styles (1..STYLE_COUNT-2)
  const interior = Math.max(1, STYLE_COUNT - 2);
  return 1 + (beatOrdinal % interior);
}

/** Clamp/normalize a raw styleIndex into the valid range. */
function safeStyleIndex(raw, fallbackRole, fallbackOrdinal) {
  if (Number.isInteger(raw)) {
    return ((raw % STYLE_COUNT) + STYLE_COUNT) % STYLE_COUNT;
  }
  return styleIndexFor(fallbackRole, fallbackOrdinal);
}

/** Infer a role from slide position when one isn't provided. */
function roleForPosition(i, total) {
  if (i === 0) return 'hook';
  if (i === total - 1) return 'cta';
  return 'beat';
}

/** Coerce an already-canonical-ish slide (object or bare string) into shape. */
function coerceSlide(slide, i, total, beatOrdinal) {
  const isObj = slide && typeof slide === 'object';
  const role = (isObj && slide.role) || roleForPosition(i, total);
  const text = isObj ? getText(slide.text ?? slide) : getText(slide);
  const label = isObj ? slide.label ?? getLabel(slide.text) : null;

  return {
    id: (isObj && slide.id) || `s-${i}`,
    role,
    layoutId: (isObj && slide.layoutId) || DEFAULT_LAYOUT[role] || DEFAULT_LAYOUT.beat,
    label: label ?? null,
    text,
    styleIndex: safeStyleIndex(isObj ? slide.styleIndex : undefined, role, beatOrdinal),
  };
}

/**
 * Normalize any content object into a canonical `slides[]` array.
 * Returns [] when there is nothing renderable (callers already guard on length).
 */
export function normalizeSlides(content) {
  if (!content) return [];

  // 1. Already canonical (new AI responses, future saved content).
  if (Array.isArray(content.slides) && content.slides.length > 0) {
    let beatOrdinal = 0;
    return content.slides.map((s, i) => {
      const role =
        (s && typeof s === 'object' && s.role) || roleForPosition(i, content.slides.length);
      const ord = role === 'beat' ? beatOrdinal++ : 0;
      return coerceSlide(s, i, content.slides.length, ord);
    });
  }

  // 2. Legacy fixed `reels_script` (object or string fields).
  const script = content.reels_script;
  if (script && typeof script === 'object') {
    let beatOrdinal = 0;
    const slides = [];
    LEGACY_FIELDS.forEach(({ key, role }) => {
      const raw = script[key];
      if (raw === undefined) return; // preserve absent fields as absent
      const ord = role === 'beat' ? beatOrdinal++ : 0;
      slides.push({
        id: `s-${key}`,
        role,
        layoutId: DEFAULT_LAYOUT[role],
        label: getLabel(raw),
        text: getText(raw),
        styleIndex: styleIndexFor(role, ord),
      });
    });
    return slides;
  }

  return [];
}

/** Convenience: return content with a canonical `slides` array attached. */
export function normalizeContent(content) {
  if (!content) return content;
  return { ...content, slides: normalizeSlides(content) };
}

/**
 * Build the ordered, non-empty caption segments the video exporter consumes.
 * Shape per item: { text, label, styleIndex } — identical to the old inline
 * scriptSegments arrays, so videoExport.js needs no change.
 */
export function slidesToSegments(slides) {
  return (slides || [])
    .map((s) => ({ text: s.text, label: s.label, styleIndex: s.styleIndex }))
    .filter((s) => s.text && String(s.text).trim());
}

/** Short display/file label for a slide (e.g. "Hook", "Beat 2", "CTA"). */
export function slideDisplayLabel(slide, beatOrdinal) {
  if (!slide) return '';
  if (slide.role === 'beat') return `Beat ${(beatOrdinal ?? 0) + 1}`;
  return ROLE_LABEL[slide.role] || 'Slide';
}

/** Filesystem-safe slug for a slide (e.g. "hook", "beat-2", "cta"). */
export function slideSlug(slide, beatOrdinal) {
  if (!slide) return 'slide';
  if (slide.role === 'beat') return `beat-${(beatOrdinal ?? 0) + 1}`;
  return slide.role || 'slide';
}
