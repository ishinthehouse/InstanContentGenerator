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
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mt-6 md:mt-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-dark">Reels Script</h3>
        <button
          onClick={handleCopy}
          className="text-xs flex items-center gap-1 text-gray-500 hover:text-dark transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="space-y-4 text-sm text-dark font-sans bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
        {rows.map((r) => (
          <div key={r.key}>
            <span
              className={`font-bold text-xs uppercase tracking-wide block mb-1 ${
                r.accent ? 'text-insta' : 'text-gray-400'
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
