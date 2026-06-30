import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_SLIDE_COUNT } from '../utils/slideSchema';
import { buildContentPrompt } from '../utils/contentPrompt';
import { generateParsed } from '../utils/aiClient';
import { getSessionId } from '../utils/sessionId';

/** The user's own key for the selected provider, or '' if they haven't set one. */
function userKeyFor(settings) {
  switch (settings.aiProvider) {
    case 'claude': return settings.claudeKey || '';
    case 'openai': return settings.openaiKey || '';
    case 'gemini': return settings.geminiKey || '';
    default: return '';
  }
}

export function useAIGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [error, setError] = useState(null);
  const { settings } = useSettings();

  const generateContent = async (formParams) => {
    const params = { slideCount: DEFAULT_SLIDE_COUNT, ...formParams };

    if (!params.topic) {
      setError('Please enter a topic.');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedData(null);

    const apiKey = userKeyFor(settings);

    try {
      let parsedData;

      if (apiKey) {
        // BYOK — call the selected provider directly from the browser.
        const { promptText, systemPrompt } = buildContentPrompt(params);
        parsedData = await generateParsed({
          provider: settings.aiProvider,
          apiKey,
          systemPrompt,
          promptText,
          maxTokens: 3000,
          allowBrowser: true,
        });
      } else {
        // Hosted — route through the serverless proxy (keys live server-side).
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: settings.aiProvider,
            params,
            sessionId: getSessionId(),
          }),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          // Surface the server's human-friendly message (quota, no key, etc.).
          throw new Error(data.error || 'Generation failed. Please try again.');
        }
        parsedData = data.content;
      }

      setGeneratedData(parsedData);
      return parsedData;
    } catch (err) {
      console.error('AI Generation Error:', err);
      if (err?.status === 429) {
        setError('Rate limit hit, wait a few seconds and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred during AI generation.');
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateContent, generatedData, setGeneratedData, isGenerating, error, setError };
}
