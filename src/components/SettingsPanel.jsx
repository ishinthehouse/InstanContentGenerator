import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings, clearKeys } = useSettings();

  const handleBlur = (e) => {
    const { name, value } = e.target;
    updateSettings({ [name]: value });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateSettings({ [name]: value });
  };

  // Render the API key input for the selected provider
  const renderApiKeyInput = () => {
    switch (settings.aiProvider) {
      case 'claude':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Claude API Key <span className="text-gray-400">(optional)</span></label>
            <input 
              type="password" 
              name="claudeKey"
              defaultValue={settings.claudeKey}
              onBlur={handleBlur}
              placeholder="sk-ant-..."
              className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta"
            />
          </div>
        );
      case 'openai':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">OpenAI API Key <span className="text-gray-400">(optional)</span></label>
            <input 
              type="password" 
              name="openaiKey"
              defaultValue={settings.openaiKey}
              onBlur={handleBlur}
              placeholder="sk-..."
              className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta"
            />
          </div>
        );
      case 'gemini':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Gemini API Key <span className="text-gray-400">(optional)</span></label>
            <input 
              type="password" 
              name="geminiKey"
              defaultValue={settings.geminiKey}
              onBlur={handleBlur}
              placeholder="AIza..."
              className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 text-dark transition-colors"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 shadow-xl rounded-xl p-5 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-dark">Settings</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-dark">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">AI Provider</label>
              <select 
                name="aiProvider"
                value={settings.aiProvider}
                onChange={handleChange}
                className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta"
              >
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini (Google)</option>
              </select>
            </div>

            {renderApiKeyInput()}

            <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 border border-gray-100 rounded-md p-2">
              Leave the key blank to use the free hosted generator (daily limit).
              Add your own key for unlimited generations and bulk processing.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pexels API Key</label>
              <input 
                type="password" 
                name="pexelsKey"
                defaultValue={settings.pexelsKey}
                onBlur={handleBlur}
                className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cloudinary Cloud Name (Optional)</label>
              <input 
                type="text" 
                name="cloudinaryName"
                defaultValue={settings.cloudinaryName}
                onBlur={handleBlur}
                placeholder="your_cloud_name"
                className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta"
              />
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Default Handle</label>
              <input 
                type="text" 
                name="defaultHandle"
                value={settings.defaultHandle}
                onChange={handleChange}
                className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Default Tone</label>
              <select 
                name="defaultTone"
                value={settings.defaultTone}
                onChange={handleChange}
                className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:border-insta focus:ring-1 focus:ring-insta"
              >
                <option value="Inspirational">Inspirational</option>
                <option value="Playful">Playful</option>
                <option value="Educational">Educational</option>
                <option value="Bold &amp; punchy">Bold &amp; punchy</option>
                <option value="Warm &amp; personal">Warm &amp; personal</option>
                <option value="Minimal &amp; clean">Minimal &amp; clean</option>
              </select>
            </div>

            <button 
              onClick={clearKeys}
              className="w-full text-xs text-red-500 mt-2 hover:bg-red-50 py-2 rounded transition-colors"
            >
              Clear saved keys
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
