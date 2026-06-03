import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { renderFormattedVideo, mimeToExtension } from './videoExport';

const SLIDE_LABELS = ['Hook', 'Beat 1', 'Beat 2', 'Beat 3', 'CTA'];

const SLIDE_STYLES = [
  {
    bg: 'linear-gradient(180deg, rgba(15,15,15,0.60) 0%, rgba(15,15,15,0.90) 100%)',
    accent: '#fff',
    fontStyle: 'italic',
    fontWeight: '700',
    fontSize: '28px',
    align: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  {
    bg: 'linear-gradient(180deg, rgba(15,15,15,0.70) 0%, rgba(15,15,15,0.88) 100%)',
    accent: '#f9fafb',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: '22px',
    align: 'left',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  {
    bg: 'linear-gradient(0deg, rgba(15,15,15,0.85) 0%, rgba(15,15,15,0.50) 50%, rgba(15,15,15,0.85) 100%)',
    accent: '#ffffff',
    fontStyle: 'italic',
    fontWeight: '600',
    fontSize: '22px',
    align: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  {
    bg: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(15,15,15,0.90) 100%)',
    accent: '#f9fafb',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: '22px',
    align: 'left',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  {
    bg: 'linear-gradient(180deg, rgba(15,15,15,0.70) 0%, rgba(15,15,15,0.95) 100%)',
    accent: '#ffffff',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: '26px',
    align: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
];

/** Adaptive font size based on text length (mirrors CarouselPreview logic) */
function getAdaptiveFontSize(text) {
  const len = (text || '').length;
  if (len <= 30) return '28px';
  if (len <= 60) return '22px';
  if (len <= 120) return '18px';
  if (len <= 200) return '15px';
  return '13px';
}

/** Assign photos from pool to 5 slides (round-robin if fewer than 5 photos) */
function assignPhotos(photos, count) {
  if (!photos || photos.length === 0) return [];
  return Array.from({ length: count }, (_, i) => photos[i % photos.length]);
}

/**
 * Render a single slide off-screen and capture it as a PNG Blob.
 * @param {string} photoUrl - full-res Pexels photo URL
 * @param {string} text     - slide text
 * @param {object} style    - one of SLIDE_STYLES entries
 */
async function captureSlide(photoUrl, text, style) {
  const SIZE = 900; // px — square slide output resolution

  // 1. Create the off-screen container
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: ${SIZE}px;
    height: ${SIZE}px;
    overflow: hidden;
    border-radius: 0;
  `;

  // 2. Background image
  const img = document.createElement('img');
  img.src = photoUrl;
  img.crossOrigin = 'anonymous';
  img.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  `;

  // 3. Gradient overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    inset: 0;
    background: ${style.bg};
  `;

  // 4. Text layer
  const fontSize = getAdaptiveFontSize(text);
  const textLayer = document.createElement('div');
  textLayer.style.cssText = `
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: ${style.justifyContent};
    align-items: ${style.alignItems};
    padding: 56px;
    z-index: 10;
  `;

  const p = document.createElement('p');
  p.style.cssText = `
    color: ${style.accent};
    font-size: ${fontSize};
    font-style: ${style.fontStyle};
    font-weight: ${style.fontWeight};
    line-height: 1.45;
    max-width: 85%;
    text-align: ${style.textAlign};
    text-shadow: 0 2px 12px rgba(0,0,0,0.6);
    font-family: Georgia, 'Times New Roman', serif;
    margin: 0;
  `;
  p.textContent = text;

  textLayer.appendChild(p);
  wrapper.appendChild(img);
  wrapper.appendChild(overlay);
  wrapper.appendChild(textLayer);
  document.body.appendChild(wrapper);

  // 5. Wait for image to load
  await new Promise((resolve) => {
    if (img.complete) return resolve();
    img.onload = resolve;
    img.onerror = resolve;
    setTimeout(resolve, 4000); // timeout safety
  });

  // 6. Capture
  const canvas = await html2canvas(wrapper, {
    scale: 1,
    width: SIZE,
    height: SIZE,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#0f0f0f',
    logging: false,
  });

  document.body.removeChild(wrapper);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Export all bulk results as a ZIP file.
 * Structure: instaforge-bulk-export.zip
 *   ├── post-01-<slug>/
 *   │    ├── slide-1-hook.png
 *   │    ├── slide-2-beat1.png
 *   │    ├── ...
 *   │    └── content.txt
 *   ├── post-02-<slug>/
 *   └── ...
 *
 * @param {Array}    results        - bulk results array from useBulkGenerate
 * @param {Function} onProgress     - (current, total) => void
 */
export async function exportBulkAsZip(results, onProgress) {
  const zip = new JSZip();

  const successfulResults = results.filter(r => r.content && !r.error && r.photos?.length > 0);
  const totalSlides = successfulResults.length * 5;
  let doneSlides = 0;

  for (let ri = 0; ri < successfulResults.length; ri++) {
    const result = successfulResults[ri];
    const { content, photos, row } = result;
    const script = content.reels_script;

    const getText = (val) => typeof val === 'object' && val !== null ? val.text : val;
    const getLabel = (val) => typeof val === 'object' && val !== null ? val.label : null;

    const slides = [
      { text: getText(script.hook),  label: SLIDE_LABELS[0], slug: 'hook'  },
      { text: getText(script.beat_1), label: SLIDE_LABELS[1], slug: 'beat-1' },
      { text: getText(script.beat_2), label: SLIDE_LABELS[2], slug: 'beat-2' },
      { text: getText(script.beat_3), label: SLIDE_LABELS[3], slug: 'beat-3' },
      { text: getText(script.cta),   label: SLIDE_LABELS[4], slug: 'cta'   },
    ];

    const assignedPhotos = assignPhotos(photos, slides.length);

    // Create a safe folder name from the topic / caption
    const topicRaw = row?.postContent || row?.caption || content.caption || `post-${ri + 1}`;
    const folderSlug = topicRaw
      .slice(0, 40)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const folderName = `post-${String(ri + 1).padStart(2, '0')}-${folderSlug}`;
    const folder = zip.folder(folderName);

    // Render and add each slide
    for (let si = 0; si < slides.length; si++) {
      const slide = slides[si];
      const photo = assignedPhotos[si];
      const photoUrl = photo?.src?.large2x || photo?.src?.large || photo?.src?.medium;

      if (!photoUrl) { doneSlides++; continue; }

      try {
        const blob = await captureSlide(photoUrl, slide.text, SLIDE_STYLES[si]);
        if (blob) {
          folder.file(`slide-${si + 1}-${slide.slug}.png`, blob);
        }
      } catch (err) {
        console.warn(`Failed to capture slide ${si + 1} for post ${ri + 1}:`, err);
      }

      doneSlides++;
      onProgress?.(doneSlides, totalSlides);
    }

    // Add a text summary file for the post
    const allHashtags = [
      ...(content.hashtags?.niche || []),
      ...(content.hashtags?.broad || []),
    ].join(' ');

    const contentTxt = [
      `INSTAFORGE — Post ${ri + 1}`,
      '='.repeat(40),
      '',
      'CAPTION',
      content.caption || '',
      '',
      'REELS SCRIPT',
      `Hook:   ${script.hook}`,
      `Beat 1: ${script.beat_1}`,
      `Beat 2: ${script.beat_2}`,
      `Beat 3: ${script.beat_3}`,
      `CTA:    ${script.cta}`,
      '',
      'HASHTAGS',
      allHashtags,
      '',
      'ALT TEXT',
      content.alt_text || '',
    ].join('\n');

    folder.file('content.txt', contentTxt);
  }

  // Generate and trigger download
  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `instaforge-bulk-${Date.now()}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Distribute ordered segments across `count` bins as evenly as possible.
 * (Same logic as CarouselPreview.distributeSegments.)
 */
function distributeSegments(segments, count) {
  if (!segments || segments.length === 0) return Array.from({ length: Math.max(1, count) }, () => []);
  if (count <= 1) return [segments];
  if (count >= segments.length) {
    return Array.from({ length: count }, (_, i) => [segments[i % segments.length]]);
  }

  const groups = Array.from({ length: count }, () => []);
  const base = Math.floor(segments.length / count);
  const extra = segments.length % count;
  let idx = 0;
  for (let g = 0; g < count; g++) {
    const take = base + (g < extra ? 1 : 0);
    for (let k = 0; k < take; k++) groups[g].push(segments[idx++]);
  }
  return groups;
}

/**
 * Export all bulk results that contain video media as rendered reels in a ZIP.
 *
 * Structure: instaforge-bulk-videos.zip
 *   ├── post-01-<slug>/
 *   │    ├── reel-1.webm (or .mp4)
 *   │    └── content.txt
 *   ├── post-02-<slug>/
 *   └── ...
 *
 * Each video is rendered with its timed caption overlay via renderFormattedVideo.
 * Falls back to the raw source clip if canvas recording fails.
 *
 * @param {Array}    results    - bulk results array from useBulkGenerate
 * @param {Function} onProgress - (currentVideo, totalVideos, videoRenderProgress) => void
 */
export async function exportBulkVideosAsZip(results, onProgress) {
  const zip = new JSZip();

  const videoResults = results.filter(
    (r) => r.content && !r.error && r.photos?.length > 0 && r.photos[0]?._isVideo
  );

  // Count total video clips across all results
  const totalClips = videoResults.reduce((sum, r) => sum + r.photos.length, 0);
  let doneClips = 0;

  for (let ri = 0; ri < videoResults.length; ri++) {
    const result = videoResults[ri];
    const { content, photos, row } = result;
    const script = content.reels_script;

    const getText = (val) => typeof val === 'object' && val !== null ? val.text : val;
    const getLabel = (val) => typeof val === 'object' && val !== null ? val.label : null;

    // Build ordered non-empty script segments
    const scriptSegments = [
      { text: getText(script?.hook), label: getLabel(script?.hook), styleIndex: 0 },
      { text: getText(script?.beat_1), label: getLabel(script?.beat_1), styleIndex: 1 },
      { text: getText(script?.beat_2), label: getLabel(script?.beat_2), styleIndex: 2 },
      { text: getText(script?.beat_3), label: getLabel(script?.beat_3), styleIndex: 3 },
      { text: getText(script?.cta), label: getLabel(script?.cta), styleIndex: 4 },
    ].filter((s) => s.text && String(s.text).trim());

    // Distribute segments across the video clips for this row
    const videoGroups = distributeSegments(scriptSegments, photos.length);

    // Create a safe folder name
    const topicRaw = row?.postContent || row?.caption || content.caption || `post-${ri + 1}`;
    const folderSlug = topicRaw
      .slice(0, 40)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const folderName = `post-${String(ri + 1).padStart(2, '0')}-${folderSlug}`;
    const folder = zip.folder(folderName);

    // Render each video clip
    for (let vi = 0; vi < photos.length; vi++) {
      const video = photos[vi];
      if (!video?.videoUrl) { doneClips++; continue; }

      try {
        const { blob, mimeType } = await renderFormattedVideo({
          video,
          segments: videoGroups[vi] || [],
          customFontFamily: null,
          onProgress: (p) => onProgress?.(doneClips + 1, totalClips, p),
        });

        const ext = mimeToExtension(mimeType);
        folder.file(`reel-${vi + 1}.${ext}`, blob);
      } catch (err) {
        console.warn(`Video render failed for post ${ri + 1}, clip ${vi + 1}:`, err);
        // Fallback: fetch raw video blob and add to zip
        try {
          const resp = await fetch(video.videoUrl);
          if (resp.ok) {
            const rawBlob = await resp.blob();
            folder.file(`reel-${vi + 1}-raw.mp4`, rawBlob);
          }
        } catch (fetchErr) {
          console.warn(`Raw video fetch also failed:`, fetchErr);
        }
      }

      doneClips++;
      onProgress?.(doneClips, totalClips, 1);
    }

    // Add content.txt summary
    const allHashtags = [
      ...(content.hashtags?.niche || []),
      ...(content.hashtags?.broad || []),
    ].join(' ');

    const contentTxt = [
      `INSTAFORGE — Post ${ri + 1} (Video)`,
      '='.repeat(40),
      '',
      'CAPTION',
      content.caption || '',
      '',
      'REELS SCRIPT',
      `Hook:   ${script?.hook || ''}`,
      `Beat 1: ${script?.beat_1 || ''}`,
      `Beat 2: ${script?.beat_2 || ''}`,
      `Beat 3: ${script?.beat_3 || ''}`,
      `CTA:    ${script?.cta || ''}`,
      '',
      'HASHTAGS',
      allHashtags,
      '',
      'ALT TEXT',
      content.alt_text || '',
    ].join('\n');

    folder.file('content.txt', contentTxt);
  }

  // Generate and trigger download
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `instaforge-bulk-videos-${Date.now()}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
