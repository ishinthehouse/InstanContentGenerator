import { useState, useCallback } from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';
import { SettingsProvider } from './context/SettingsContext';
import SettingsPanel from './components/SettingsPanel';
import TopicForm from './components/TopicForm';
import PhotoGrid from './components/PhotoGrid';
import PostPreview from './components/PostPreview';
import ReelsScript from './components/ReelsScript';
import CarouselPreview from './components/CarouselPreview';
import ExportButtons from './components/ExportButtons';
import BulkUpload from './components/BulkUpload';
import PhotoFilterSelector from './components/PhotoFilterSelector';
import GuideModal from './components/GuideModal';
import { useAIGenerate } from './hooks/useAIGenerate';
import { usePexelsSearch } from './hooks/usePexelsSearch';
import { useBulkGenerate } from './hooks/useBulkGenerate';

function MainApp() {
  const { generateContent, isGenerating, error: aiError } = useAIGenerate();
  const { searchPhotos, photos, isSearching, error: pexelsError, setPhotos } = usePexelsSearch();
  const { processBulk, cancelBulk, clearResults, isProcessing, progress, results, bulkError } = useBulkGenerate();

  // Mode toggle
  const [mode, setMode] = useState('single'); // 'single' | 'bulk'
  const [mediaMode, setMediaMode] = useState('photos'); // 'photos' | 'videos'

  // UI state
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Active state
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentContent, setCurrentContent] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]); // array of photo objects
  
  // Last used form data to allow regeneration
  const [lastFormData, setLastFormData] = useState(null);

  // Derived: first selected photo (used for PostPreview backward compat)
  const primaryPhoto = selectedPhotos.length > 0 ? selectedPhotos[0] : null;

  const handleMediaModeChange = useCallback((nextMode) => {
    if (nextMode === mediaMode) return;
    setMediaMode(nextMode);
    setPhotos([]);
    setSelectedPhotos([]);
  }, [mediaMode, setPhotos]);

  const handleTogglePhoto = useCallback((photo) => {
    setSelectedPhotos(prev => {
      const exists = prev.find(p => p.id === photo.id);
      if (exists) {
        // Deselect
        return prev.filter(p => p.id !== photo.id);
      } else {
        // Add to selection
        return [...prev, photo];
      }
    });
  }, []);

  const handleGenerate = async (formData) => {
    setCurrentTopic(formData.topic);
    setLastFormData(formData);
    
    // 1. Generate text via AI
    const content = await generateContent(formData);
    if (!content) return;
    
    setCurrentContent(content);
    setSelectedPhotos([]);
    
    // 2. Fetch Pexels media using keywords
    if (content.pexels_keywords && content.pexels_keywords.length > 0) {
      await searchPhotos(content.pexels_keywords, mediaMode);
    }
  };

  const handleRegenerateCaption = async () => {
    if (!lastFormData) return;
    const content = await generateContent(lastFormData);
    if (content) {
      setCurrentContent(content);
      // Don't rerun pexels search, keep existing photos and selection
    }
  };

  const handleRegeneratePhotos = async () => {
    if (currentContent?.pexels_keywords) {
      await searchPhotos(currentContent.pexels_keywords, mediaMode);
      setSelectedPhotos([]);
    }
  };



  // Handle selecting a result from bulk upload
  const handleSelectBulkResult = (result) => {
    if (result.content) {
      setCurrentContent(result.content);
      setCurrentTopic(result.row?.postContent || result.row?.caption || 'Bulk post');
      if (result.photos && result.photos.length > 0) {
        setSelectedPhotos(result.photos);
      } else {
        setSelectedPhotos([]);
      }
    }
  };

  const hasSelection = selectedPhotos.length > 0;

  const showPreview = currentContent && (primaryPhoto || hasSelection);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-midnight-900/70 border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-royal">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white m-0 tracking-tight font-display leading-none">InstaForge</h1>
              <p className="text-[11px] text-white/45 hidden sm:block mt-0.5">AI social-media design workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white/70 text-xs font-semibold rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Learn to use</span>
            </button>
            <SettingsPanel />
          </div>
        </div>
      </header>

      {/* Workspace */}
      <main className="flex-1 px-4 md:px-6 py-6">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-[minmax(360px,400px)_minmax(0,1fr)_minmax(320px,360px)] gap-6 items-start">

          {/* ───── Plan: inputs & media selection ───── */}
          <section className="space-y-5 min-w-0">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setMode('single')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'single'
                    ? 'bg-brand-gradient text-white shadow-glow'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                Single Post
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'bulk'
                    ? 'bg-brand-gradient text-white shadow-glow'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                Bulk Upload
              </button>
            </div>

            {mode === 'single' ? (
              <>
                <TopicForm
                  onSubmit={handleGenerate}
                  isGenerating={isGenerating}
                  mediaMode={mediaMode}
                  onMediaModeChange={handleMediaModeChange}
                />

                {aiError && (
                  <div className="p-4 bg-red-500/10 text-red-300 text-sm rounded-xl border border-red-500/20 flex justify-between items-center gap-3">
                    <span>{aiError}</span>
                    <button onClick={() => lastFormData && handleGenerate(lastFormData)} className="text-xs font-semibold hover:underline whitespace-nowrap">
                      Try again
                    </button>
                  </div>
                )}

                {pexelsError && (
                  <div className="p-4 bg-red-500/10 text-red-300 text-sm rounded-xl border border-red-500/20 flex justify-between items-center gap-3">
                    <span>{pexelsError}</span>
                    <button onClick={handleRegeneratePhotos} className="text-xs font-semibold hover:underline whitespace-nowrap">
                      Try again
                    </button>
                  </div>
                )}

                {(isSearching || (photos && photos.length > 0)) && (
                  <PhotoGrid
                    photos={photos}
                    selectedPhotoIds={selectedPhotos.map(p => p.id)}
                    onToggleSelect={handleTogglePhoto}
                    isSearching={isSearching}
                    mediaMode={mediaMode}
                  />
                )}
              </>
            ) : (
              <BulkUpload
                onProcessBulk={processBulk}
                isProcessing={isProcessing}
                progress={progress}
                results={results}
                bulkError={bulkError}
                onCancel={cancelBulk}
                onClearResults={clearResults}
                onSelectResult={handleSelectBulkResult}
              />
            )}
          </section>

          {/* ───── Produce: live preview canvas ───── */}
          <section className="min-w-0 xl:sticky xl:top-24">
            {showPreview ? (
              <div className="space-y-6">
                {currentContent && primaryPhoto && (
                  <PostPreview content={currentContent} photo={primaryPhoto} />
                )}
                {currentContent && hasSelection && (
                  <CarouselPreview content={currentContent} photos={selectedPhotos} />
                )}
              </div>
            ) : (
              <div className="glass-panel min-h-[420px] flex flex-col items-center justify-center text-center px-6 py-12">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white/30" />
                </div>
                <p className="text-sm font-medium text-white/70">
                  {isGenerating ? 'Crafting your content…' : 'Your post preview will appear here'}
                </p>
                <p className="text-xs text-white/35 mt-1 max-w-[240px]">
                  {mode === 'single'
                    ? 'Describe a topic and pick media to see a live carousel.'
                    : 'Select a generated result to preview it here.'}
                </p>
              </div>
            )}
          </section>

          {/* ───── Polish: design controls & export ───── */}
          <section className="space-y-5 min-w-0">
            {hasSelection && mode === 'single' && mediaMode === 'photos' && (
              <PhotoFilterSelector
                photos={selectedPhotos}
                onApplyFilter={setSelectedPhotos}
              />
            )}

            {currentContent ? (
              <>
                <ExportButtons
                  content={currentContent}
                  topic={currentTopic}
                  onRegenerateCaption={handleRegenerateCaption}
                  onRegeneratePhotos={handleRegeneratePhotos}
                  isGenerating={isGenerating}
                  isSearching={isSearching}
                />
                <ReelsScript content={currentContent} />
              </>
            ) : (
              <div className="glass-panel p-6 text-center">
                <p className="text-xs text-white/40">
                  Design controls, export options, and your Reels script will show up here once content is generated.
                </p>
              </div>
            )}
          </section>

        </div>
      </main>

      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <MainApp />
    </SettingsProvider>
  );
}
