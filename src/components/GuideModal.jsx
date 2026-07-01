import { X, Sparkles, Image as ImageIcon, FileSpreadsheet, Download, Settings } from 'lucide-react';

export default function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-midnight-800/95 backdrop-blur-xl border border-white/10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-panel overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white shadow-glow-royal">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Welcome to InstaForge</h2>
              <p className="text-xs text-white/50 font-medium">Your AI social-media design workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-white/50 hover:text-white hover:bg-white/[0.12] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          <section>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3 uppercase tracking-wider">
              <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs">1</span>
              Plan — describe your post
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              In the <strong>Plan</strong> column on the left, describe a topic (or paste a blog, article, or YouTube link to <strong>repurpose</strong> it into a post). Pick a tone, choose <strong>Photos or Videos</strong>, and set how many slides you want (<strong>3–10</strong>). InstaForge's AI writes the caption, hashtags, and a slide-by-slide script, then pulls matching media from Pexels.
            </p>
            <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 flex gap-4">
              <ImageIcon className="w-6 h-6 text-insta flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white mb-1">Pick your media</p>
                <p className="text-xs text-white/50">
                  Tap any photo or video in the results to select it. Select several and they spread across your carousel slides (or reel clips).
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3 uppercase tracking-wider">
              <span className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs">2</span>
              Produce & Polish
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              The center <strong>Produce</strong> column shows a live carousel (or animated video reel) that maps your script across the media. Fine-tune it with the controls above the carousel and in the <strong>Polish</strong> column on the right.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/[0.04] border border-white/10 p-3 rounded-lg">
                <p className="text-xs font-bold text-white mb-1">Fonts & filters</p>
                <p className="text-[11px] text-white/50">Swap the slide typography instantly, shuffle media, and apply Cloudinary photo filters (add a cloud name in Settings).</p>
              </div>
              <div className="bg-white/[0.04] border border-white/10 p-3 rounded-lg">
                <p className="text-xs font-bold text-white mb-1">Export anywhere</p>
                <p className="text-[11px] text-white/50">Download slides as PNGs or rendered reels (MP4/WebM) with captions baked in, and copy your caption + hashtags in one click.</p>
              </div>
            </div>
            <button className="mt-4 w-full py-2.5 bg-white/[0.06] border border-white/10 text-white/80 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-default">
              <Download className="w-4 h-4" /> Download all slides
            </button>
          </section>

          <section>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3 uppercase tracking-wider">
              <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center text-xs">3</span>
              Bulk Upload Workflow
            </h3>
            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white mb-2">Have a content calendar?</p>
                  <p className="text-xs text-white/70 leading-relaxed mb-3">
                    Switch to the <strong>Bulk Upload</strong> tab and drop an Excel (.xlsx) or CSV file with your planned posts. Use columns named <code>caption</code>, <code>post content</code>, <code>keyword</code>, and <code>cta</code>.
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Keep <strong>Use AI</strong> on to turn brief topics into full posts, or turn it off to use your spreadsheet data as-is. Generate, then download the whole batch as a ZIP of slides or reels. <span className="text-white/50">Bulk uses AI in a loop, so it needs your own API key (see Setup).</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3 uppercase tracking-wider">
              <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">4</span>
              Setup — mostly optional
            </h3>
            <div className="flex items-start gap-3 bg-white/[0.04] p-4 rounded-xl border border-white/10">
              <Settings className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Open <strong>Settings</strong> (gear, top right). Single posts work out of the box — leave the AI key blank to use the <strong>free hosted generator</strong> (daily limit). Add keys for more:
                </p>
                <ul className="text-xs text-white/50 mt-2 list-disc list-inside space-y-1">
                  <li><strong className="text-white/70">AI Provider key</strong> (Claude, OpenAI, or Gemini) — unlimited generations + bulk</li>
                  <li><strong className="text-white/70">Pexels key</strong> — required to search photos &amp; videos</li>
                  <li><strong className="text-white/70">Cloudinary cloud name</strong> — optional, enables photo filters</li>
                </ul>
              </div>
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.03]">
          <button
            onClick={onClose}
            className="btn-primary py-3 font-bold"
          >
            Got it, let's go!
          </button>
        </div>
      </div>
    </div>
  );
}
