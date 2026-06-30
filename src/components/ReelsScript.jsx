import { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/copyText';
import { normalizeSlides, slideDisplayLabel } from '../utils/slideSchema';

export default function ReelsScript({ content }) {
  const [copied, setCopied] = useState(false);

  // Variable-length slide list — works for any slide count and content shape.
  const slides = useMemo(() => normalizeSlides(content), [content]);

  // Precompute display labels (Hook / Beat 1 / Beat 2 / ... / CTA).
  const rows = useMemo(() => {
    let beat = 0;
    return slides.map((s) => ({
      key: s.id,
      label: slideDisplayLabel(s, s.role === 'beat' ? beat++ : 0),
      text: s.text,
      accent: s.role === 'hook' || s.role === 'cta',
    }));
  }, [slides]);

  if (rows.length === 0) return null;

  const handleCopy = () => {
    const text = rows.map((r) => `${r.label.toUpperCase()}: ${r.text}`).join('\n\n');
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="section-title">Reels Script</h3>
        <button
          onClick={handleCopy}
          className="text-xs flex items-center gap-1 text-white/50 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="space-y-4 text-sm text-white/85 font-sans bg-white/[0.03] p-4 rounded-xl border border-white/10">
        {rows.map((r) => (
          <div key={r.key}>
            <span
              className={`font-bold text-xs uppercase tracking-wide block mb-1 ${
                r.accent ? 'text-insta' : 'text-white/40'
              }`}
            >
              {r.label}
            </span>
            <p>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
