import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('instaforge_settings');
    return saved ? JSON.parse(saved) : {
      pexelsKey: '',
      claudeKey: '',
      openaiKey: '',
      geminiKey: '',
      cloudinaryName: '',
      aiProvider: 'claude', // 'claude', 'openai', or 'gemini'
      defaultHandle: '@yourbrand',
      defaultTone: 'Inspirational',
    };
  });

  useEffect(() => {
    localStorage.setItem('instaforge_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const clearKeys = () => {
    setSettings(prev => ({
      ...prev,
      pexelsKey: '',
      claudeKey: '',
      openaiKey: '',
      geminiKey: '',
      cloudinaryName: '',
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, clearKeys }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
