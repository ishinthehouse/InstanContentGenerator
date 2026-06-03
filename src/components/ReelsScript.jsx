import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/copyText';

export default function ReelsScript({ script }) {
  const [copied, setCopied] = useState(false);

  if (!script) return null;

  const handleCopy = () => {
    const text = `HOOK: ${script.hook}\n\nBEAT 1: ${script.beat_1}\n\nBEAT 2: ${script.beat_2}\n\nBEAT 3: ${script.beat_3}\n\nCTA: ${script.cta}`;
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
        <div>
          <span className="font-bold text-insta text-xs uppercase tracking-wide block mb-1">Hook</span>
          <p>{script.hook}</p>
        </div>
        <div>
          <span className="font-bold text-gray-400 text-xs uppercase tracking-wide block mb-1">Beat 1</span>
          <p>{script.beat_1}</p>
        </div>
        <div>
          <span className="font-bold text-gray-400 text-xs uppercase tracking-wide block mb-1">Beat 2</span>
          <p>{script.beat_2}</p>
        </div>
        <div>
          <span className="font-bold text-gray-400 text-xs uppercase tracking-wide block mb-1">Beat 3</span>
          <p>{script.beat_3}</p>
        </div>
        <div>
          <span className="font-bold text-insta text-xs uppercase tracking-wide block mb-1">CTA</span>
          <p>{script.cta}</p>
        </div>
      </div>
    </div>
  );
}
