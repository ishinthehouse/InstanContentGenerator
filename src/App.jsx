import { useState, useEffect, useCallback } from 'react';
import { PanelLeft, HelpCircle } from 'lucide-react';
import { SettingsProvider } from './context/SettingsContext';
import SettingsPanel from './components/SettingsPanel';
import TopicForm from './components/TopicForm';
import PhotoGrid from './components/PhotoGrid';
import PostPreview from './components/PostPreview';
import ReelsScript from './components/ReelsScript';
import CarouselPreview from './components/CarouselPreview';
import ExportButtons from './components/ExportButtons';
import HistorySidebar from './components/HistorySidebar';
import BulkUpload from './components/BulkUpload';
import PhotoFilterSelector from './components/PhotoFilterSelector';
import GuideModal from './components/GuideModal';
import { useAIGenerate } from './hooks/useAIGenerate';
import { usePexelsSearch } from './hooks/usePexelsSearch';
import { usePostHistory } from './hooks/usePostHistory';
import { useBulkGenerate } from './hooks/useBulkGenerate';

function MainApp() {
  const { generateContent, isGenerating, error: aiError } = useAIGenerate();
  const { searchPhotos, photos, isSearching, error: pexelsError, setPhotos } = usePexelsSearch();
  const { history, addToHistory, clearHistory } = usePostHistory();
  const { processBulk, cancelBulk, clearResults, isProcessing, progress, results, bulkError } = useBulkGenerate();

  // Mode toggle
  const [mode, setMode] = useState('single'); // 'single' | 'bulk'
  const [mediaMode, setMediaMode] = useState('photos'); // 'photos' | 'videos'

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  // Add to history when both content and at least one photo are selected
  useEffect(() => {
    if (currentContent && primaryPhoto) {
      addToHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        topic: currentTopic,
        content: currentContent,
        photo: primaryPhoto,
        photos: selectedPhotos,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhotos]); // Intentionally only trigger on photo selection changes

  const handleRestoreFromHistory = (post) => {
    setCurrentTopic(post.topic);
    setCurrentContent(post.content);
    // Restore multi-select if available, otherwise wrap single photo
    if (post.photos && post.photos.length > 0) {
      setSelectedPhotos(post.photos);
    } else if (post.photo) {
      setSelectedPhotos([post.photo]);
    }
    setMode('single');
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

  return (
    <div className="flex h-screen bg-[#f9fafb] overflow-hidden">
      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        <div className="w-64 h-full">
          <HistorySidebar history={history} onRestore={handleRestoreFromHistory} onClear={clearHistory} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex p-2 -ml-2 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-dark m-0 tracking-tight">InstaForge</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Automated Instagram Content Creation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 text-xs font-semibold rounded-full border border-purple-100 hover:shadow-md transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Learn to use</span>
            </button>
            <SettingsPanel />
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 xl:gap-10">
            
            {/* Center Column: Inputs & Search */}
            <div className="flex-1 min-w-0">
              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setMode('single')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    mode === 'single'
                      ? 'bg-white text-dark shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Single Post
                </button>
                <button
                  onClick={() => setMode('bulk')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    mode === 'bulk'
                      ? 'bg-white text-dark shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
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
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex justify-between items-center">
                      <span>{aiError}</span>
                      <button onClick={() => lastFormData && handleGenerate(lastFormData)} className="text-xs font-semibold hover:underline">
                        Try again
                      </button>
                    </div>
                  )}

                  {pexelsError && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex justify-between items-center">
                      <span>{pexelsError}</span>
                      <button onClick={handleRegeneratePhotos} className="text-xs font-semibold hover:underline">
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

                  {hasSelection && mode === 'single' && mediaMode === 'photos' && (
                    <PhotoFilterSelector
                      photos={selectedPhotos}
                      onApplyFilter={setSelectedPhotos}
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
            </div>

            {/* Right Column: Previews & Export */}
            <div className="w-full lg:w-[400px] xl:w-[420px] flex-shrink-0">
              {currentContent && primaryPhoto && (
                <PostPreview content={currentContent} photo={primaryPhoto} />
              )}

              {currentContent && hasSelection && (
                <CarouselPreview content={currentContent} photos={selectedPhotos} />
              )}
              
              {!currentContent && !hasSelection && !isGenerating && (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
                  Generated post preview will appear here
                </div>
              )}

              {currentContent && (
                <>
                  <ExportButtons 
                    content={currentContent} 
                    topic={currentTopic}
                    onRegenerateCaption={handleRegenerateCaption}
                    onRegeneratePhotos={handleRegeneratePhotos}
                    isGenerating={isGenerating}
                    isSearching={isSearching}
                  />
                  <ReelsScript script={currentContent.reels_script} />
                </>
              )}
            </div>
            
          </div>
        </main>
        
        {/* Mobile History Bottom Sheet (Simplified version for mobile layout constraint) */}
        <div className="md:hidden border-t border-gray-200 bg-white h-48 overflow-y-auto">
          <HistorySidebar history={history} onRestore={handleRestoreFromHistory} onClear={clearHistory} />
        </div>
      </div>
      
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
