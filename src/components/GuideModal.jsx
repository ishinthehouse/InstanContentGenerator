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
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-insta to-orange-400 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark">Welcome to InstaForge</h2>
              <p className="text-xs text-gray-500 font-medium">Your AI-powered Instagram factory</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-dark hover:bg-gray-100 shadow-sm transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          <section>
            <h3 className="text-sm font-bold text-dark flex items-center gap-2 mb-3 uppercase tracking-wider">
              <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs">1</span>
              Single Post Generation
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Type a topic in the center column. InstaForge will use AI to write a captivating caption, find relevant hashtags, structure a Reels script, and search for high-quality background images from Pexels.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-4">
              <ImageIcon className="w-6 h-6 text-insta flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-dark mb-1">Pick your photos</p>
                <p className="text-xs text-gray-500">
                  Click on any photo from the search results to select it. You can select multiple photos to spread them across your carousel slides.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-dark flex items-center gap-2 mb-3 uppercase tracking-wider">
              <span className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs">2</span>
              Design & Export
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Once your text is generated and photos are selected, the Right Column comes alive. It automatically builds a 5-slide Carousel mapping your Reels script across the images.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                <p className="text-xs font-bold text-dark mb-1">Apply Filters</p>
                <p className="text-[11px] text-gray-500">Choose from 18 Cloudinary presets to give your photos an Instagram-ready aesthetic.</p>
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                <p className="text-xs font-bold text-dark mb-1">Change Typography</p>
                <p className="text-[11px] text-gray-500">Use the font selector above the carousel to instantly swap the text style on all slides.</p>
              </div>
            </div>
            <button className="mt-4 w-full py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-default">
              <Download className="w-4 h-4" /> Download all slides
            </button>
          </section>

          <section>
            <h3 className="text-sm font-bold text-dark flex items-center gap-2 mb-3 uppercase tracking-wider">
              <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center text-xs">3</span>
              Bulk Upload Workflow
            </h3>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-dark mb-2">Have a content calendar?</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    Switch to the <strong>Bulk Upload</strong> tab. Drop an Excel (.xlsx) or CSV file with your planned posts. Ensure you have columns named <code>caption</code>, <code>post content</code>, <code>keyword</code>, and <code>cta</code>.
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Check the "Use AI" box to let InstaForge turn brief topics into full posts, or uncheck it to use your spreadsheet data exactly as-is. Hit Generate and watch it build your entire week's content!
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-dark flex items-center gap-2 mb-3 uppercase tracking-wider">
              <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">4</span>
              Important Setup
            </h3>
            <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <Settings className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Before you start, click the <strong>Settings</strong> icon in the top right. You'll need to provide your own API keys for:
                </p>
                <ul className="text-xs text-gray-500 mt-2 list-disc list-inside space-y-1">
                  <li>An AI Provider (Claude, OpenAI, or Gemini)</li>
                  <li>Pexels (for image search)</li>
                  <li>Cloudinary Cloud Name (for photo filters)</li>
                </ul>
              </div>
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-dark text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
          >
            Got it, let's go!
          </button>
        </div>
      </div>
    </div>
  );
}
