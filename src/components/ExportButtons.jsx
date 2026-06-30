import { useState } from 'react';
import { Copy, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { copyToClipboard } from '../utils/copyText';
import { downloadPostImage } from '../utils/exportImage';

export default function ExportButtons({ content, topic, onRegenerateCaption, onRegeneratePhotos, isGenerating, isSearching }) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!content) return null;

  const handleCopyCaption = () => {
    copyToClipboard(content.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyAll = () => {
    const allTags = [...(content.hashtags?.niche || []), ...(content.hashtags?.broad || [])].join(' ');
    copyToClipboard(`${content.caption}\n\n.\n.\n.\n${allTags}`);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await downloadPostImage('post-preview', topic || 'instaforge');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="glass-panel p-5">
      <h3 className="section-title mb-4">Export Options</h3>

      <div className="space-y-3">
        <button onClick={handleCopyCaption} className="btn-ghost">
          <Copy className="w-4 h-4" />
          {copiedCaption ? 'Copied!' : 'Copy caption only'}
        </button>

        <button onClick={handleCopyAll} className="btn-ghost">
          <Copy className="w-4 h-4" />
          {copiedAll ? 'Copied!' : 'Copy caption + tags'}
        </button>

        <button onClick={handleDownload} disabled={isExporting} className="btn-primary">
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Download post image'}
        </button>

        <div className="pt-4 border-t border-white/10 mt-4 space-y-3">
          <button onClick={onRegenerateCaption} disabled={isGenerating} className="btn-ghost">
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate text
          </button>

          <button onClick={onRegeneratePhotos} disabled={isSearching} className="btn-ghost">
            <ImageIcon className="w-4 h-4" />
            Find new photos
          </button>
        </div>
      </div>
    </div>
  );
}
