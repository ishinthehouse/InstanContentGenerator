import { useState, useEffect } from 'react';
import { AlignLeft, Camera, Film, Layers, Link2, Loader2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useRepurpose } from '../hooks/useRepurpose';
import { MIN_SLIDE_COUNT, MAX_SLIDE_COUNT, DEFAULT_SLIDE_COUNT } from '../utils/slideSchema';

const SLIDE_COUNT_OPTIONS = Array.from(
  { length: MAX_SLIDE_COUNT - MIN_SLIDE_COUNT + 1 },
  (_, i) => MIN_SLIDE_COUNT + i
);

export default function TopicForm({ onSubmit, isGenerating, mediaMode = 'photos', onMediaModeChange }) {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    topic: '',
    tone: 'Inspirational',
    ctaType: 'None',
    hashtagCount: '10',
    language: 'English',
    contentType: 'Educational',
    slideTextLength: 'medium',
    slideCount: String(DEFAULT_SLIDE_COUNT),
  });

  // Update default tone when settings change, if the user hasn't overridden it yet
  // For simplicity, we just use the initial state, but let's sync it.
  useEffect(() => {
    if (settings.defaultTone) {
      setFormData(prev => ({ ...prev, tone: settings.defaultTone }));
    }
  }, [settings.defaultTone]);

  const { extract, isExtracting, error: repurposeError, setError: setRepurposeError } = useRepurpose();
  const [repurposeUrl, setRepurposeUrl] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRepurpose = async () => {
    setRepurposeError(null);
    const result = await extract(repurposeUrl);
    if (result?.text) {
      // Seed the topic with the extracted text so it flows through normal generation.
      setFormData(prev => ({ ...prev, topic: result.text }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">Media Source</label>
        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
          <button
            type="button"
            onClick={() => onMediaModeChange && onMediaModeChange('photos')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              mediaMode === 'photos'
                ? 'bg-insta text-white shadow-sm'
                : 'text-gray-500 hover:text-dark'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Photos
          </button>
          <button
            type="button"
            onClick={() => onMediaModeChange && onMediaModeChange('videos')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              mediaMode === 'videos'
                ? 'bg-insta text-white shadow-sm'
                : 'text-gray-500 hover:text-dark'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Videos
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
          <Link2 className="w-3 h-3" />
          Repurpose a link <span className="text-gray-400 font-normal">(blog, article, or YouTube — optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={repurposeUrl}
            onChange={(e) => setRepurposeUrl(e.target.value)}
            placeholder="https://example.com/post"
            className="flex-1 min-w-0 border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta"
          />
          <button
            type="button"
            onClick={handleRepurpose}
            disabled={isExtracting || !repurposeUrl.trim()}
            className="flex items-center gap-1.5 px-4 rounded-lg text-sm font-semibold bg-gray-100 text-dark hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {isExtracting ? 'Reading...' : 'Extract'}
          </button>
        </div>
        {repurposeError && (
          <p className="text-xs text-red-500 mt-1.5">{repurposeError}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-dark mb-2">What is this post about?</label>
        <textarea
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          placeholder="e.g. Morning hydration routine with functional health drinks..."
          rows={3}
          required
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta resize-none"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tone</label>
          <select name="tone" value={formData.tone} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta">
            <option value="Inspirational">Inspirational</option>
            <option value="Playful">Playful</option>
            <option value="Educational">Educational</option>
            <option value="Bold & punchy">Bold & punchy</option>
            <option value="Warm & personal">Warm & personal</option>
            <option value="Minimal & clean">Minimal & clean</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Content Type</label>
          <select name="contentType" value={formData.contentType} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta">
            <option value="Product post">Product post</option>
            <option value="Educational">Educational</option>
            <option value="Behind the scenes">Behind the scenes</option>
            <option value="Motivational">Motivational</option>
            <option value="Promotional offer">Promotional offer</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">CTA Type</label>
          <select name="ctaType" value={formData.ctaType} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta">
            <option value="Save this post">Save this post</option>
            <option value="Tag a friend">Tag a friend</option>
            <option value="Comment below">Comment below</option>
            <option value="Link in bio">Link in bio</option>
            <option value="None">None</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
          <select name="language" value={formData.language} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta">
            <option value="English">English</option>
            <option value="Hinglish">Hinglish</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hashtags</label>
          <select name="hashtagCount" value={formData.hashtagCount} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
            <AlignLeft className="w-3 h-3" />
            Slide Text
          </label>
          <select name="slideTextLength" value={formData.slideTextLength} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta">
            <option value="short">Short — punchy lines</option>
            <option value="medium">Medium — 1-2 sentences</option>
            <option value="detailed">Detailed — 2-3 sentences</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Slides
          </label>
          <select name="slideCount" value={formData.slideCount} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta">
            {SLIDE_COUNT_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {n} slides{n === DEFAULT_SLIDE_COUNT ? ' (default)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isGenerating}
        className="w-full bg-dark text-white font-medium py-3 px-4 rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
      >
        {isGenerating ? (
          <>
            <span className="animate-pulse mr-2">Writing your caption and script...</span>
          </>
        ) : (
          "Generate Content"
        )}
      </button>
    </form>
  );
}
