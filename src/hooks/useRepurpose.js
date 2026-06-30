import { useState } from 'react';

/**
 * Calls the serverless /api/repurpose endpoint to extract text from a blog,
 * article, or YouTube link so it can seed the generation prompt.
 */
export function useRepurpose() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState(null);

  const extract = async (url) => {
    if (!url || !url.trim()) {
      setError('Paste a link first.');
      return null;
    }
    setIsExtracting(true);
    setError(null);
    try {
      const resp = await fetch('/api/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || 'Could not read that link.');
      return data; // { kind, title, text, source }
    } catch (err) {
      setError(err.message || 'Could not read that link.');
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return { extract, isExtracting, error, setError };
}
