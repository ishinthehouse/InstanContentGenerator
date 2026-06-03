/**
 * Reel video export helpers.
 *
 * Renders a Pexels video clip with its timed caption overlay composited on top
 * (the "formatted video"), recorded to a downloadable file via MediaRecorder.
 * Pexels' video CDN serves permissive CORS headers, so drawing frames to a
 * canvas does NOT taint it and captureStream/MediaRecorder work directly.
 *
 * The segment timing model is shared with the live preview so what you see is
 * what gets exported: each caption's on-screen time is proportional to its
 * length (a base + character count), so 2-3 sentence beats stay up longer and
 * stay readable. Timings always sum to one full loop of the clip.
 */

/** Relative time weights per segment — longer text gets proportionally longer. */
export function computeSegmentBounds(segments) {
  if (!segments || segments.length === 0) return [1];
  const weights = segments.map((s) => 18 + (s.text || '').trim().length);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const bounds = [];
  let acc = 0;
  for (const w of weights) {
    acc += w;
    bounds.push(acc / total);
  }
  return bounds; // strictly increasing cumulative fractions ending at 1
}

/** Which segment is on screen at a given fraction [0,1) of the loop. */
export function segmentIndexForFraction(bounds, frac) {
  for (let i = 0; i < bounds.length; i++) {
    if (frac < bounds[i]) return i;
  }
  return bounds.length - 1;
}

// ---------------------------------------------------------------------------
// Hook labels shown before each caption beat
// ---------------------------------------------------------------------------
export const SEGMENT_LABELS = [
  { text: 'HOOK',             color: '#FF6B6B' },
  { text: 'DID YOU KNOW?',    color: '#4ECDC4' },
  { text: 'KEY INSIGHT',      color: '#FFE66D' },
  { text: "HERE'S THE THING", color: '#7ED6A8' },
  { text: 'TAKE ACTION',      color: '#FF8A5C' },
];

// ---------------------------------------------------------------------------
// Absolute timing model — each segment gets enough time to be readable
// ---------------------------------------------------------------------------
const LABEL_DURATION = 1.2;      // seconds to show the hook label
const WORD_REVEAL_RATE = 0.12;   // seconds per word during reveal phase
const MIN_HOLD = 2.5;            // minimum seconds to hold the full text
const HOLD_PER_WORD = 0.14;      // additional hold time scaling per word

/** Compute absolute second-based timings for each segment. */
export function computeAbsoluteTimings(segments) {
  return segments.map((seg) => {
    const words = (seg.text || '').trim().split(/\s+/).filter(Boolean);
    const wc = words.length || 1;
    const revealTime = wc * WORD_REVEAL_RATE;
    const holdTime = Math.max(MIN_HOLD, wc * HOLD_PER_WORD);
    const total = LABEL_DURATION + revealTime + holdTime;
    return { labelTime: LABEL_DURATION, revealTime, holdTime, total, wordCount: wc };
  });
}

/**
 * Given elapsed seconds, determine which segment + phase we're in.
 * Returns { segIndex, phase: 'label'|'reveal'|'hold', phaseProgress, wordFraction }
 */
export function getCurrentPhase(elapsed, timings, segments) {
  let cum = 0;
  for (let i = 0; i < timings.length; i++) {
    const t = timings[i];
    const segStart = cum;
    cum += t.total;
    if (elapsed < cum) {
      const e = elapsed - segStart;
      if (e < t.labelTime) {
        return { segIndex: i, phase: 'label', phaseProgress: e / t.labelTime, wordFraction: 0 };
      }
      const revElapsed = e - t.labelTime;
      if (revElapsed < t.revealTime) {
        return { segIndex: i, phase: 'reveal', phaseProgress: revElapsed / t.revealTime, wordFraction: revElapsed / t.revealTime };
      }
      return { segIndex: i, phase: 'hold', phaseProgress: 1, wordFraction: 1 };
    }
  }
  return { segIndex: Math.max(0, timings.length - 1), phase: 'hold', phaseProgress: 1, wordFraction: 1 };
}

// Canvas equivalents of the on-screen SLIDE_STYLES (gradient + text placement)
const CANVAS_STYLES = [
  { stops: [[0, 'rgba(15,15,15,0.60)'], [1, 'rgba(15,15,15,0.90)']], color: '#ffffff', hAlign: 'center', vAlign: 'middle', weight: 700, family: 'serif' },
  { stops: [[0, 'rgba(15,15,15,0.70)'], [1, 'rgba(15,15,15,0.88)']], color: '#f9fafb', hAlign: 'left', vAlign: 'bottom', weight: 600, family: 'sans' },
  { stops: [[0, 'rgba(15,15,15,0.85)'], [0.5, 'rgba(15,15,15,0.50)'], [1, 'rgba(15,15,15,0.85)']], color: '#ffffff', hAlign: 'center', vAlign: 'middle', weight: 700, family: 'serif' },
  { stops: [[0, 'rgba(0,0,0,0.20)'], [1, 'rgba(15,15,15,0.90)']], color: '#f9fafb', hAlign: 'left', vAlign: 'bottom', weight: 600, family: 'sans' },
  { stops: [[0, 'rgba(15,15,15,0.70)'], [1, 'rgba(15,15,15,0.95)']], color: '#ffffff', hAlign: 'center', vAlign: 'middle', weight: 800, family: 'serif' },
];

const FAMILY_FALLBACK = {
  serif: '"Playfair Display", serif',
  sans: '"DM Sans", sans-serif',
};

function adaptiveFontPx(text, size) {
  const len = (text || '').length;
  if (len <= 30) return size * 0.082;
  if (len <= 60) return size * 0.07;
  if (len <= 120) return size * 0.058;
  if (len <= 200) return size * 0.05;
  return size * 0.044;
}

function drawCover(ctx, media, w, h) {
  const mw = media.videoWidth || media.width;
  const mh = media.videoHeight || media.height;
  if (!mw || !mh) return;
  const scale = Math.max(w / mw, h / mh);
  const dw = mw * scale;
  const dh = mh * scale;
  ctx.drawImage(media, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function drawOverlay(ctx, w, h, styleIndex) {
  const style = CANVAS_STYLES[styleIndex] || CANVAS_STYLES[0];
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [pos, color] of style.stops) grad.addColorStop(pos, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function wrapLines(ctx, text, maxWidth) {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(ctx, w, h, text, styleIndex, customFontFamily) {
  const style = CANVAS_STYLES[styleIndex] || CANVAS_STYLES[0];
  const fontPx = adaptiveFontPx(text, w);
  const family = customFontFamily || FAMILY_FALLBACK[style.family];
  ctx.font = `${style.weight} ${fontPx}px ${family}`;
  ctx.fillStyle = style.color;
  ctx.textBaseline = 'top';

  const padding = w * 0.085;
  const maxWidth = style.hAlign === 'center' ? w * 0.84 : w - padding * 2;
  const lines = wrapLines(ctx, text, maxWidth);
  const lineHeight = fontPx * 1.25;
  const blockH = lines.length * lineHeight;

  let blockTop;
  if (style.vAlign === 'bottom') blockTop = h - padding - blockH;
  else blockTop = (h - blockH) / 2; // middle

  ctx.textAlign = style.hAlign === 'center' ? 'center' : 'left';
  const x = style.hAlign === 'center' ? w / 2 : padding;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = fontPx * 0.18;
  ctx.shadowOffsetY = fontPx * 0.04;
  lines.forEach((ln, i) => {
    ctx.fillText(ln, x, blockTop + i * lineHeight);
  });
  ctx.restore();
}

/**
 * Draw text with only a fraction of words visible (word-by-word reveal).
 * wordFraction: 0 = no words, 1 = all words.
 */
function drawTextPartial(ctx, w, h, text, styleIndex, customFontFamily, wordFraction) {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const visibleCount = Math.ceil(words.length * Math.min(1, Math.max(0, wordFraction)));
  if (visibleCount === 0) return;
  const visibleText = words.slice(0, visibleCount).join(' ');
  drawText(ctx, w, h, visibleText, styleIndex, customFontFamily);
}

/**
 * Draw the colored hook label (e.g. "HOOK", "KEY INSIGHT") with a pill background.
 * progress: 0→1 over the label duration. Scale-in at start, fade-out at end.
 */
function drawHookLabel(ctx, w, h, segIndex, progress, customText = null) {
  const baseLabel = SEGMENT_LABELS[segIndex % SEGMENT_LABELS.length] || SEGMENT_LABELS[0];
  const labelText = customText || baseLabel.text;
  const labelColor = baseLabel.color;
  const fontSize = w * 0.048;

  // Scale in during first 20%, hold, fade out during last 25%
  const opacity = progress < 0.15 ? progress / 0.15
    : progress > 0.75 ? (1 - progress) / 0.25
    : 1;
  const scale = progress < 0.15 ? 0.7 + 0.3 * (progress / 0.15) : 1;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

  ctx.font = `900 ${fontSize}px "DM Sans", "Inter", sans-serif`;
  const textW = ctx.measureText(label.text).width;
  const pillW = textW + fontSize * 1.6;
  const pillH = fontSize * 2.4;
  const cx = w / 2;
  const cy = h / 2;

  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  // Pill background
  const px = cx - pillW / 2;
  const py = cy - pillH / 2;
  const r = pillH / 2;
  ctx.beginPath();
  ctx.moveTo(px + r, py);
  ctx.lineTo(px + pillW - r, py);
  ctx.arcTo(px + pillW, py, px + pillW, py + r, r);
  ctx.lineTo(px + pillW, py + pillH - r);
  ctx.arcTo(px + pillW, py + pillH, px + pillW - r, py + pillH, r);
  ctx.lineTo(px + r, py + pillH);
  ctx.arcTo(px, py + pillH, px, py + pillH - r, r);
  ctx.lineTo(px, py + r);
  ctx.arcTo(px, py, px + r, py, r);
  ctx.closePath();
  ctx.fillStyle = labelColor;
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Label text
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, cx, cy + 1);

  ctx.restore();
}

function pickMimeType() {
  const candidates = [
    'video/mp4;codecs=avc1,opus',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

export function mimeToExtension(mime) {
  return mime.includes('mp4') ? 'mp4' : 'webm';
}

function loadVideoElement(url) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.crossOrigin = 'anonymous';
    v.muted = true;
    v.playsInline = true;
    v.loop = true;  // loop so longer text recordings keep a background
    v.preload = 'auto';
    v.src = url;
    const onReady = () => resolve(v);
    v.addEventListener('loadeddata', onReady, { once: true });
    v.addEventListener('error', () => reject(new Error('Video failed to load for export')), { once: true });
    setTimeout(() => reject(new Error('Video load timed out')), 20000);
  });
}

/**
 * Render one clip + its caption overlay into a video Blob.
 *
 * Uses absolute timing so every caption beat is readable:
 *   1. Hook label phase  — colored pill animates in
 *   2. Word-reveal phase — text appears word-by-word
 *   3. Hold phase        — full text stays on screen
 *
 * The source video loops automatically so the background stays lively even
 * when the text needs more time than one clip length.
 */
export async function renderFormattedVideo({ video, segments, customFontFamily, size = 1080, fps = 30, onProgress }) {
  const mimeType = pickMimeType();
  if (!mimeType) throw new Error('MediaRecorder is not supported in this browser');

  const vid = await loadVideoElement(video.videoUrl);
  // Make sure custom fonts are ready so they render on the canvas
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Compute absolute per-segment timings based on word count
  const timings = computeAbsoluteTimings(segments);
  const totalTextTime = timings.reduce((s, t) => s + t.total, 0);
  // Recording runs for as long as the text needs, capped at 2 min
  const recordDuration = Math.min(Math.max(totalTextTime, 4), 120);

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((res) => { recorder.onstop = res; });

  try {
    vid.currentTime = 0;
    await vid.play();
  } catch {
    /* play may resolve late; drawing still proceeds */
  }

  recorder.start(1000);
  const start = performance.now();

  await new Promise((resolve) => {
    const draw = () => {
      const elapsed = (performance.now() - start) / 1000;

      // 1. Draw the looping video background
      drawCover(ctx, vid, size, size);

      // 2. Determine which segment + phase from absolute timing
      const state = getCurrentPhase(elapsed, timings, segments);
      const seg = segments[state.segIndex] || segments[0] || { text: '', styleIndex: 0 };

      // 3. Draw gradient overlay
      drawOverlay(ctx, size, size, seg.styleIndex);

      // 4. Draw based on current phase
      if (state.phase === 'label') {
        // Animated hook label pill
        drawHookLabel(ctx, size, size, seg.styleIndex, state.phaseProgress, seg.label);
      } else if (state.phase === 'reveal') {
        // Word-by-word text reveal
        drawTextPartial(ctx, size, size, seg.text, seg.styleIndex, customFontFamily, state.wordFraction);
      } else {
        // Hold — full text visible
        if (seg.text) drawText(ctx, size, size, seg.text, seg.styleIndex, customFontFamily);
      }

      if (onProgress) onProgress(Math.min(elapsed / recordDuration, 1));
      if (elapsed >= recordDuration) { resolve(); return; }
      requestAnimationFrame(draw);
    };
    draw();
  });

  recorder.stop();
  await stopped;
  vid.pause();
  vid.removeAttribute('src');
  vid.load();

  return { blob: new Blob(chunks, { type: mimeType }), mimeType };
}

/** Robust raw download of the source mp4 — used as a fallback if recording fails. */
export async function downloadRawVideo(video, filename) {
  try {
    const resp = await fetch(video.videoUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch {
    // Last resort: open in a new tab so the user can save manually
    window.open(video.videoUrl, '_blank', 'noopener');
  }
}
