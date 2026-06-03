import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Shuffle, Film } from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  computeSegmentBounds,
  segmentIndexForFraction,
  renderFormattedVideo,
  downloadRawVideo,
  mimeToExtension,
  SEGMENT_LABELS,
} from '../utils/videoExport';

const FONTS = [
  { id: 'default', name: 'Default', family: '' },
  { id: 'anton', name: 'Anton', family: '"Anton", sans-serif' },
  { id: 'bungee', name: 'Bungee', family: '"Bungee", cursive' },
  { id: 'montserrat', name: 'Montserrat', family: '"Montserrat", sans-serif' },
  { id: 'oswald', name: 'Oswald', family: '"Oswald", sans-serif' },
  { id: 'playfair', name: 'Playfair', family: '"Playfair Display", serif' }
];

const SLIDE_LABELS = ['Hook', 'Beat 1', 'Beat 2', 'Beat 3', 'CTA'];

const SLIDE_STYLES = [
  {
    // Hook — bold gradient accent (normalized to dark)
    bg: 'linear-gradient(180deg, rgba(15,15,15,0.60) 0%, rgba(15,15,15,0.90) 100%)',
    accent: '#fff',
    labelColor: 'rgba(255,255,255,0.6)',
    textSize: 'text-2xl',
    fontClass: 'font-serif',
    align: 'items-center justify-center text-center',
  },
  {
    // Beat 1 — dark cinematic
    bg: 'linear-gradient(180deg, rgba(15,15,15,0.70) 0%, rgba(15,15,15,0.88) 100%)',
    accent: '#f9fafb',
    labelColor: 'rgba(225,48,108,0.9)',
    textSize: 'text-xl',
    fontClass: 'font-sans',
    align: 'items-start justify-end text-left',
  },
  {
    // Beat 2 — center stage clean
    bg: 'linear-gradient(0deg, rgba(15,15,15,0.85) 0%, rgba(15,15,15,0.50) 50%, rgba(15,15,15,0.85) 100%)',
    accent: '#ffffff',
    labelColor: 'rgba(255,255,255,0.5)',
    textSize: 'text-xl',
    fontClass: 'font-serif',
    align: 'items-center justify-center text-center',
  },
  {
    // Beat 3 — editorial bottom
    bg: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(15,15,15,0.90) 100%)',
    accent: '#f9fafb',
    labelColor: 'rgba(225,48,108,0.9)',
    textSize: 'text-xl',
    fontClass: 'font-sans',
    align: 'items-start justify-end text-left',
  },
  {
    // CTA — vibrant gradient (normalized to dark)
    bg: 'linear-gradient(180deg, rgba(15,15,15,0.70) 0%, rgba(15,15,15,0.95) 100%)',
    accent: '#ffffff',
    labelColor: 'rgba(255,255,255,0.7)',
    textSize: 'text-2xl',
    fontClass: 'font-serif font-bold',
    align: 'items-center justify-center text-center',
  },
];

/**
 * Randomly assign photos from the pool to each slide index.
 * Uses Fisher-Yates inspired distribution so slides get varied photos.
 */
function assignPhotosToSlides(photos, slideCount, seed) {
  if (!photos || photos.length === 0) return [];
  if (photos.length === 1) return Array(slideCount).fill(photos[0]);

  // Simple seeded random for deterministic shuffle per seed value
  let s = seed;
  const seededRandom = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  // Create a shuffled pool that covers all slides
  const assigned = [];
  let pool = [];

  for (let i = 0; i < slideCount; i++) {
    if (pool.length === 0) {
      // Refill and shuffle
      pool = [...photos];
      for (let j = pool.length - 1; j > 0; j--) {
        const k = Math.floor(seededRandom() * (j + 1));
        [pool[j], pool[k]] = [pool[k], pool[j]];
      }
    }
    assigned.push(pool.pop());
  }

  return assigned;
}

/**
 * Split the ordered script segments across `count` videos as evenly as possible,
 * preserving order. With a single video, that video carries the whole script.
 * If there are more videos than segments, segments cycle so every video shows text.
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

function getAdaptiveTextClass(text) {
  const len = (text || '').length;
  if (len <= 30) return { sizeClass: 'text-2xl', lineClass: 'leading-snug' };
  if (len <= 60) return { sizeClass: 'text-xl', lineClass: 'leading-snug' };
  if (len <= 120) return { sizeClass: 'text-lg', lineClass: 'leading-relaxed' };
  if (len <= 200) return { sizeClass: 'text-base', lineClass: 'leading-relaxed' };
  return { sizeClass: 'text-sm', lineClass: 'leading-relaxed' };
}

/** Photo slide — one static caption over a still image (unchanged photo behavior). */
function SlideCard({ photo, text, style, slideIndex, isActive, customFontFamily }) {
  const { sizeClass, lineClass } = getAdaptiveTextClass(text);

  return (
    <div
      id={`carousel-slide-${slideIndex}`}
      className={`relative w-full aspect-square rounded-xl overflow-hidden flex-shrink-0 transition-all duration-500 ${
        isActive ? 'scale-100 opacity-100 carousel-slide-active' : 'scale-95 opacity-40'
      }`}
      style={{ scrollSnapAlign: 'center' }}
    >
      {/* Background Photo */}
      <img
        src={photo.src.large2x}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        crossOrigin="anonymous"
      />

      {/* Color Overlay */}
      <div className="absolute inset-0" style={{ background: style.bg }} />

      {/* Text Content */}
      <div className={`absolute inset-0 flex flex-col ${style.align} p-8 md:p-10 z-10`}>
        <p
          className={`${sizeClass} ${lineClass} ${customFontFamily ? '' : style.fontClass} max-w-[90%] drop-shadow-lg`}
          style={{ color: style.accent, fontFamily: customFontFamily || undefined }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/**
 * Video reel slide — the video loops while its assigned caption segments cycle
 * on top with animated hook labels and word-by-word text reveal.
 *
 * Timing: each segment gets a fixed ~6 s window (independent of clip length):
 *   1. Hook label phase  (~1.2 s) — colored pill animates in
 *   2. Word-reveal phase (~2 s)   — words appear one-by-one with staggered delays
 *   3. Hold phase        (~2.8 s) — full text stays on screen
 *
 * During export the component falls back to a static poster + forced segment.
 */
const SEGMENT_DURATION_MS = 6000; // total ms per segment in live preview
const LABEL_PHASE_MS      = 1200; // ms for the hook label
const REVEAL_WORD_MS      = 120;  // ms per word during reveal

function VideoReelSlide({ video, segments, slideIndex, isActive, customFontFamily, exportMode, forcedSegmentIndex }) {
  const [autoIndex, setAutoIndex] = useState(0);
  const [phase, setPhase] = useState('label'); // 'label' | 'reveal' | 'hold'
  const segCount = Math.max(1, segments.length);

  // Cycle segments on a fixed timer so each beat has adequate reading time,
  // independent of the video clip length.
  useEffect(() => {
    if (forcedSegmentIndex != null || segCount <= 1) return;
    const id = setInterval(() => {
      setAutoIndex((prev) => (prev + 1) % segCount);
    }, SEGMENT_DURATION_MS);
    return () => clearInterval(id);
  }, [segCount, forcedSegmentIndex]);

  // Phase cycling: label → reveal → hold within each segment
  const activeIndex = forcedSegmentIndex != null
    ? Math.min(Math.max(0, forcedSegmentIndex), segCount - 1)
    : Math.min(autoIndex, segCount - 1);

  const seg = segments[activeIndex] || segments[0] || { text: '', styleIndex: 0 };
  const words = useMemo(() => (seg.text || '').split(/\s+/).filter(Boolean), [seg.text]);

  useEffect(() => {
    if (exportMode) { setPhase('hold'); return; }
    // Label phase
    setPhase('label');
    const labelTimer = setTimeout(() => {
      setPhase('reveal');
    }, LABEL_PHASE_MS);
    // After reveal finishes, switch to hold
    const revealMs = words.length * REVEAL_WORD_MS + 300; // +300 for last word to settle
    const holdTimer = setTimeout(() => {
      setPhase('hold');
    }, LABEL_PHASE_MS + revealMs);
    return () => { clearTimeout(labelTimer); clearTimeout(holdTimer); };
  }, [activeIndex, exportMode, words.length]);

  const style = SLIDE_STYLES[seg.styleIndex] ?? SLIDE_STYLES[0];
  const { sizeClass, lineClass } = getAdaptiveTextClass(seg.text);
  const baseLabel = SEGMENT_LABELS[seg.styleIndex] || SEGMENT_LABELS[0];
  const hookLabel = {
    text: seg.label || baseLabel.text,
    color: baseLabel.color
  };

  return (
    <div
      id={`carousel-slide-${slideIndex}`}
      className={`relative w-full aspect-square rounded-xl overflow-hidden flex-shrink-0 transition-all duration-500 ${
        isActive ? 'scale-100 opacity-100 carousel-slide-active' : 'scale-95 opacity-40'
      }`}
      style={{ scrollSnapAlign: 'center' }}
    >
      {/* Poster image — shows while the video loads and is the html2canvas fallback */}
      <img
        src={video.thumbnail}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        crossOrigin="anonymous"
      />

      {/* Looping video — hidden during export so the capture uses the poster */}
      {!exportMode && (
        <video
          src={video.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          poster={video.thumbnail}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Color Overlay (fades between beat styles) */}
      <div className="absolute inset-0 transition-[background] duration-500" style={{ background: style.bg }} />

      {/* Content Layer */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 md:p-10 z-10`}>
        {phase === 'label' && !exportMode ? (
          /* Hook Label — colored pill */
          <div
            key={`label-${activeIndex}`}
            className="reel-hook-label"
          >
            <span
              className="inline-block px-5 py-2.5 rounded-full text-white font-black text-sm md:text-base tracking-wide shadow-lg"
              style={{ backgroundColor: hookLabel.color }}
            >
              {hookLabel.text}
            </span>
          </div>
        ) : (
          /* Caption text — word-by-word reveal or full hold */
          <p
            key={`text-${activeIndex}`}
            className={`${
              phase === 'reveal' && !exportMode ? '' : 'reel-text-enter'
            } ${sizeClass} ${lineClass} ${
              customFontFamily ? '' : style.fontClass
            } max-w-[90%] drop-shadow-lg ${style.align.includes('text-center') ? 'text-center' : 'text-left'}`}
            style={{ color: style.accent, fontFamily: customFontFamily || undefined }}
          >
            {phase === 'reveal' && !exportMode
              ? words.map((word, i) => (
                  <span
                    key={i}
                    className="reel-word inline-block mr-[0.3em]"
                    style={{ animationDelay: `${i * REVEAL_WORD_MS}ms` }}
                  >
                    {word}
                  </span>
                ))
              : seg.text}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CarouselPreview({ content, photos }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeFont, setActiveFont] = useState('default');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState(false);
  const [exportTarget, setExportTarget] = useState(null); // { slide, seg } during video export
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());
  const [videoExport, setVideoExport] = useState(null); // { current, total, progress } while rendering video
  const scrollRef = useRef(null);

  const script = content?.reels_script;
  const photoList = photos || [];
  const isVideoMode = !!photoList[0]?._isVideo;

  const getText = (val) => typeof val === 'object' && val !== null ? val.text : val;
  const getLabel = (val) => typeof val === 'object' && val !== null ? val.label : null;

  // Photo carousel beats (unchanged — always 5 fixed slides)
  const slides = [
    { text: getText(script?.hook), label: SLIDE_LABELS[0] },
    { text: getText(script?.beat_1), label: SLIDE_LABELS[1] },
    { text: getText(script?.beat_2), label: SLIDE_LABELS[2] },
    { text: getText(script?.beat_3), label: SLIDE_LABELS[3] },
    { text: getText(script?.cta), label: SLIDE_LABELS[4] },
  ];

  // Ordered, non-empty script segments used as the timed reel captions for videos
  const scriptSegments = useMemo(
    () =>
      [
        { text: getText(script?.hook), label: getLabel(script?.hook), styleIndex: 0 },
        { text: getText(script?.beat_1), label: getLabel(script?.beat_1), styleIndex: 1 },
        { text: getText(script?.beat_2), label: getLabel(script?.beat_2), styleIndex: 2 },
        { text: getText(script?.beat_3), label: getLabel(script?.beat_3), styleIndex: 3 },
        { text: getText(script?.cta), label: getLabel(script?.cta), styleIndex: 4 },
      ].filter((s) => s.text && String(s.text).trim()),
    [script?.hook, script?.beat_1, script?.beat_2, script?.beat_3, script?.cta]
  );

  // Divide the script across the selected videos (whole script if just one)
  const videoGroups = useMemo(
    () => distributeSegments(scriptSegments, photoList.length),
    [scriptSegments, photoList.length]
  );

  // Assign photos to slides — memoized by photos array identity, filter, and seed
  const photoKey = photoList.map((p) => `${p.id}-${p._filterId || 'none'}`).join(',');
  const slidePhotos = useMemo(
    () => assignPhotosToSlides(photoList, slides.length, shuffleSeed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photoKey, slides.length, shuffleSeed]
  );

  // Videos render one slide per clip; photos keep the fixed 5-slide carousel
  const slideCount = isVideoMode ? photoList.length : slides.length;

  const goTo = useCallback((index) => {
    const clamped = Math.max(0, Math.min(index, slideCount - 1));
    setActiveSlide(clamped);
    if (scrollRef.current) {
      const slideEl = scrollRef.current.children[clamped];
      if (slideEl) {
        slideEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [slideCount]);

  // All hooks are declared above this guard so hook order stays stable
  if (!script || photoList.length === 0) return null;

  const handleReshuffle = () => {
    setShuffleSeed(Date.now());
  };

  const handleDownloadAll = async () => {
    setIsExporting(true);
    setExportMode(true);
    // Wait for React to swap <video> tags for static posters before capture
    await new Promise((r) => setTimeout(r, 100));
    try {
      for (let i = 0; i < slideCount; i++) {
        // A photo slide is one frame; a video clip exports one frame per caption beat
        const segCount = isVideoMode ? Math.max(1, (videoGroups[i] || []).length) : 1;

        for (let j = 0; j < segCount; j++) {
          if (isVideoMode) {
            setExportTarget({ slide: i, seg: j });
            // Let the forced caption render before capturing
            await new Promise((r) => setTimeout(r, 150));
          }

          const el = document.getElementById(`carousel-slide-${i}`);
          if (!el) continue;

          // Temporarily remove visual dimming for non-active slides during capture
          const wasDimmed = !el.classList.contains('carousel-slide-active');
          if (wasDimmed) {
            el.style.opacity = '1';
            el.style.transform = 'scale(1)';
          }

          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
          });

          // Restore dimming
          if (wasDimmed) {
            el.style.opacity = '';
            el.style.transform = '';
          }

          const namePart = isVideoMode
            ? `clip-${i + 1}${segCount > 1 ? `-part-${j + 1}` : ''}`
            : `slide-${i + 1}-${SLIDE_LABELS[i].toLowerCase().replace(/\s+/g, '-')}`;

          const link = document.createElement('a');
          link.download = `instaforge-${namePart}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();

          // Small delay between downloads so browser doesn't block them
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch (err) {
      console.error('Failed to export slides:', err);
    } finally {
      setIsExporting(false);
      setExportMode(false);
      setExportTarget(null);
    }
  };

  // Download each selected clip as a "formatted video" — the clip with its timed
  // caption overlay baked in, recorded via canvas + MediaRecorder. Falls back to
  // the raw source file if recording isn't possible.
  const handleDownloadVideo = async () => {
    if (videoExport) return;
    const total = photoList.length;
    for (let i = 0; i < total; i++) {
      const video = photoList[i];
      if (!video?.videoUrl) continue;
      setVideoExport({ current: i + 1, total, progress: 0 });
      try {
        const { blob, mimeType } = await renderFormattedVideo({
          video,
          segments: videoGroups[i] || [],
          customFontFamily,
          onProgress: (p) => setVideoExport({ current: i + 1, total, progress: p }),
        });
        const ext = mimeToExtension(mimeType);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `instaforge-reel-${i + 1}.${ext}`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } catch (err) {
        console.error('Formatted video render failed, downloading raw clip instead:', err);
        await downloadRawVideo(video, `instaforge-clip-${i + 1}.mp4`);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    setVideoExport(null);
  };

  const headerTitle = isVideoMode
    ? (photos.length > 1 ? 'Video Carousel' : 'Reel Preview')
    : 'Carousel Slides';

  const customFontFamily = FONTS.find((f) => f.id === activeFont)?.family;
  // Clamp for display in case selection shrank (e.g. deselecting videos) and left a stale index
  const currentSlide = Math.min(activeSlide, slideCount - 1);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-dark">{headerTitle}</h3>
          {photos.length > 1 && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
              {photos.length} {isVideoMode ? 'videos' : 'photos'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {photos.length > 1 && !isVideoMode && (
            <button
              onClick={handleReshuffle}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-insta transition-colors"
              title="Reshuffle photo assignments"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Shuffle
            </button>
          )}
          {slideCount > 1 && (
            <span className="text-xs text-gray-400 font-medium">
              {currentSlide + 1} / {slideCount}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 overflow-x-auto scrollbar-hide pb-1">
        <div className="flex gap-2">
          {FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => setActiveFont(font.id)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeFont === font.id
                  ? 'bg-insta text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span style={{ fontFamily: font.family || undefined }}>{font.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Slide Viewer */}
      <div className="relative group">
        {/* Slides Container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
          onScroll={(e) => {
            const container = e.target;
            const slideWidth = container.children[0]?.offsetWidth || 1;
            const newIndex = Math.round(container.scrollLeft / (slideWidth + 12)); // 12 = gap-3
            if (newIndex !== currentSlide && newIndex >= 0 && newIndex < slideCount) {
              setActiveSlide(newIndex);
            }
          }}
        >
          {isVideoMode
            ? photos.map((video, i) => (
                <div key={`v-${i}-${video.id}`} className="w-full flex-shrink-0 snap-center">
                  <VideoReelSlide
                    video={video}
                    segments={videoGroups[i] || []}
                    slideIndex={i}
                    isActive={i === currentSlide}
                    customFontFamily={customFontFamily}
                    exportMode={exportMode}
                    forcedSegmentIndex={
                      exportTarget && exportTarget.slide === i ? exportTarget.seg : null
                    }
                  />
                </div>
              ))
            : slides.map((slide, i) => (
                <div key={`${i}-${slidePhotos[i]?.id}`} className="w-full flex-shrink-0 snap-center">
                  <SlideCard
                    photo={slidePhotos[i]}
                    text={slide.text}
                    style={SLIDE_STYLES[i]}
                    slideIndex={i}
                    isActive={i === currentSlide}
                    customFontFamily={customFontFamily}
                  />
                </div>
              ))}
        </div>

        {/* Navigation Arrows */}
        {currentSlide > 0 && (
          <button
            onClick={() => goTo(currentSlide - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-20"
          >
            <ChevronLeft className="w-5 h-5 text-dark" />
          </button>
        )}
        {currentSlide < slideCount - 1 && (
          <button
            onClick={() => goTo(currentSlide + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-20"
          >
            <ChevronRight className="w-5 h-5 text-dark" />
          </button>
        )}
      </div>

      {/* Dot Navigation */}
      {slideCount > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentSlide ? 'w-6 h-2 bg-insta' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Download All Button */}
      {isVideoMode ? (
        <div className="mt-4 space-y-2">
          {/* Primary — formatted video with captions baked in */}
          <button
            onClick={handleDownloadVideo}
            disabled={!!videoExport || isExporting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 via-insta to-orange-400 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-insta/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Film className="w-4 h-4" />
            {videoExport
              ? `Rendering video ${videoExport.total > 1 ? `${videoExport.current}/${videoExport.total} ` : ''}${Math.round(videoExport.progress * 100)}%`
              : photoList.length > 1
              ? 'Download videos'
              : 'Download video'}
          </button>
          {/* Secondary — static caption frames (PNG) */}
          <button
            onClick={handleDownloadAll}
            disabled={isExporting || !!videoExport}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Exporting frames...' : 'Download caption frames (PNG)'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleDownloadAll}
          disabled={isExporting}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 via-insta to-orange-400 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-insta/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Download all slides'}
        </button>
      )}
    </div>
  );
}
