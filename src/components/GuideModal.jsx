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
              <p className="text-xs text-white/50 font-medium">Your AI-powered Instagram factory</p>
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
              Single Post Generation
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              Type a topic in the center column. InstaForge will use AI to write a captivating caption, find relevant hashtags, structure a Reels script, and search for high-quality background images from Pexels.
            </p>
            <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 flex gap-4">
              <ImageIcon className="w-6 h-6 text-insta flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white mb-1">Pick your photos</p>
                <p className="text-xs text-white/50">
                  Click on any photo from the search results to select it. You can select multiple photos to spread them across your carousel slides.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3 uppercase tracking-wider">
              <span className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs">2</span>
              Design & Export
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              Once your text is generated and photos are selected, the Right Column comes alive. It automatically builds a 5-slide Carousel mapping your Reels script across the images.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/[0.04] border border-white/10 p-3 rounded-lg">
                <p className="text-xs font-bold text-white mb-1">Apply Filters</p>
                <p className="text-[11px] text-white/50">Choose from 18 Cloudinary presets to give your photos an Instagram-ready aesthetic.</p>
              </div>
              <div className="bg-white/[0.04] border border-white/10 p-3 rounded-lg">
                <p className="text-xs font-bold text-white mb-1">Change Typography</p>
                <p className="text-[11px] text-white/50">Use the font selector above the carousel to instantly swap the text style on all slides.</p>
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
                    Switch to the <strong>Bulk Upload</strong> tab. Drop an Excel (.xlsx) or CSV file with your planned posts. Ensure you have columns named <code>caption</code>, <code>post content</code>, <code>keyword</code>, and <code>cta</code>.
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Check the "Use AI" box to let InstaForge turn brief topics into full posts, or uncheck it to use your spreadsheet data exactly as-is. Hit Generate and watch it build your entire week's content!
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3 uppercase tracking-wider">
              <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">4</span>
              Important Setup
            </h3>
            <div className="flex items-start gap-3 bg-white/[0.04] p-4 rounded-xl border border-white/10">
              <Settings className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Before you start, click the <strong>Settings</strong> icon in the top right. You'll need to provide your own API keys for:
                </p>
                <ul className="text-xs text-white/50 mt-2 list-disc list-inside space-y-1">
                  <li>An AI Provider (Claude, OpenAI, or Gemini)</li>
                  <li>Pexels (for image search)</li>
                  <li>Cloudinary Cloud Name (for photo filters)</li>
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
