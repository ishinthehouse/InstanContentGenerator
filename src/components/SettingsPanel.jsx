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
            <label className="field-label">Claude API Key <span className="text-white/40">(optional)</span></label>
            <input 
              type="password" 
              name="claudeKey"
              defaultValue={settings.claudeKey}
              onBlur={handleBlur}
              placeholder="sk-ant-..."
              className="glass-input p-2"
            />
          </div>
        );
      case 'openai':
        return (
          <div>
            <label className="field-label">OpenAI API Key <span className="text-white/40">(optional)</span></label>
            <input 
              type="password" 
              name="openaiKey"
              defaultValue={settings.openaiKey}
              onBlur={handleBlur}
              placeholder="sk-..."
              className="glass-input p-2"
            />
          </div>
        );
      case 'gemini':
        return (
          <div>
            <label className="field-label">Gemini API Key <span className="text-white/40">(optional)</span></label>
            <input 
              type="password" 
              name="geminiKey"
              defaultValue={settings.geminiKey}
              onBlur={handleBlur}
              placeholder="AIza..."
              className="glass-input p-2"
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
        className="p-2 bg-white/[0.06] border border-white/10 rounded-full hover:bg-white/[0.12] text-white transition-colors"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-midnight-800/95 backdrop-blur-xl border border-white/10 shadow-panel rounded-2xl p-5 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="section-title">Settings</h3>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="field-label">AI Provider</label>
              <select 
                name="aiProvider"
                value={settings.aiProvider}
                onChange={handleChange}
                className="glass-input p-2"
              >
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini (Google)</option>
              </select>
            </div>

            {renderApiKeyInput()}

            <p className="text-[11px] text-white/50 leading-relaxed bg-white/[0.04] border border-white/10 rounded-lg p-2.5">
              Leave the key blank to use the free hosted generator (daily limit).
              Add your own key for unlimited generations and bulk processing.
            </p>

            <div>
              <label className="field-label">Pexels API Key</label>
              <input 
                type="password" 
                name="pexelsKey"
                defaultValue={settings.pexelsKey}
                onBlur={handleBlur}
                className="glass-input p-2"
              />
            </div>

            <div>
              <label className="field-label">Cloudinary Cloud Name (Optional)</label>
              <input 
                type="text" 
                name="cloudinaryName"
                defaultValue={settings.cloudinaryName}
                onBlur={handleBlur}
                placeholder="your_cloud_name"
                className="glass-input p-2"
              />
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <label className="field-label">Default Handle</label>
              <input 
                type="text" 
                name="defaultHandle"
                value={settings.defaultHandle}
                onChange={handleChange}
                className="glass-input p-2"
              />
            </div>

            <div>
              <label className="field-label">Default Tone</label>
              <select 
                name="defaultTone"
                value={settings.defaultTone}
                onChange={handleChange}
                className="glass-input p-2"
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
              className="w-full text-xs text-red-300 mt-2 hover:bg-red-500/10 py-2 rounded-lg transition-colors"
            >
              Clear saved keys
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
