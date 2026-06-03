import { useState, useCallback, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * Generates content for a single row using the selected AI provider.
 * This is a standalone function (not a hook) so it can be called in a loop.
 */
async function generateForRow(row, settings, slideTextLength = 'medium') {
  const slideTextGuide = {
    short: 'Keep each reels_script field to a single punchy phrase or short sentence (under 10 words). Think bold, minimal, impactful.',
    medium: 'Write 1-2 compelling sentences for each reels_script field (15-25 words). Balance brevity with substance.',
    detailed: 'Write 2-3 rich, engaging sentences for each reels_script field (30-50 words). Go deep, add context, create gravitas.',
  }[slideTextLength] || '';

  const promptText = `
Topic: ${row.postContent || row.caption || ''}
Tone: ${row.tone || 'Inspirational'}
Call to Action Type: ${row.cta || 'None'}
Hashtag Count: 10
Language: English
Content Type: Educational
Slide Text Length: ${slideTextLength}
Pexels search keyword hint: ${row.keyword || ''}

IMPORTANT TEXT LENGTH INSTRUCTION: ${slideTextGuide}

Generate Instagram content for the above topic. Return ONLY a JSON object with this exact shape:
{
  "caption": "string -- the post caption, no hashtags inside it",
  "reels_script": {
    "hook": {
      "label": "string -- short engaging hook label (1-4 words, e.g. 'SECRET REVEALED', 'DID YOU KNOW?')",
      "text": "string -- first 3 seconds, pattern interrupt opener. ${slideTextGuide}"
    },
    "beat_1": {
      "label": "string -- short label for this point",
      "text": "string -- ${slideTextGuide}"
    },
    "beat_2": {
      "label": "string -- short label for this point",
      "text": "string -- ${slideTextGuide}"
    },
    "beat_3": {
      "label": "string -- short label for this point",
      "text": "string -- ${slideTextGuide}"
    },
    "cta": {
      "label": "string -- short call to action label (e.g. 'TAKE ACTION', 'NEXT STEPS')",
      "text": "string -- closing call to action. ${slideTextGuide}"
    }
  },
  "pexels_keywords": ["keyword1", "keyword2", "keyword3"],
  "hashtags": {
    "niche": ["#tag1", "##tag2", ...],
    "broad": ["#tag1", "#tag2", ...]
  },
  "alt_text": "string -- image accessibility description"
}
`;

  const systemPrompt = "You are an Instagram content strategist for urban Indian consumer brands. Return only valid JSON, no preamble, no markdown fences.";

  let rawJson = '';

  if (settings.aiProvider === 'claude') {
    const anthropic = new Anthropic({
      apiKey: settings.claudeKey,
      dangerouslyAllowBrowser: true,
    });
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: promptText }]
    });
    rawJson = msg.content[0].text;
  } else if (settings.aiProvider === 'openai') {
    const openai = new OpenAI({
      apiKey: settings.openaiKey,
      dangerouslyAllowBrowser: true,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: promptText }
      ]
    });
    rawJson = response.choices[0].message.content;
  } else if (settings.aiProvider === 'gemini') {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.geminiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000,
          responseMimeType: "application/json",
        }
      })
    });
    if (!geminiResponse.ok) {
      const errData = await geminiResponse.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${geminiResponse.status} — ${errData?.error?.message || geminiResponse.statusText}`);
    }
    const geminiData = await geminiResponse.json();
    rawJson = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(rawJson);
}

/**
 * Build a content object directly from Excel row data without calling any AI.
 */
function buildFromExcelDirect(row) {
  const keywords = row.keyword
    ? row.keyword.split(',').map(k => k.trim()).filter(Boolean)
    : ['lifestyle', 'brand'];

  return {
    caption: row.caption || row.postContent || '',
    reels_script: {
      hook: row.postContent || row.caption || '',
      beat_1: row.caption || '',
      beat_2: row.postContent || '',
      beat_3: row.keyword || '',
      cta: row.cta || 'Follow for more!',
    },
    pexels_keywords: keywords,
    hashtags: {
      niche: keywords.slice(0, 3).map(k => `#${k.replace(/\s+/g, '')}`),
      broad: ['#instagood', '#trending', '#viral'],
    },
    alt_text: row.postContent || row.caption || 'Instagram post image',
  };
}

/**
 * Normalize a Pexels video response into the shape the app expects
 * (mirrors normalizeVideo in usePexelsSearch.js).
 */
function normalizeVideo(video) {
  const mp4s = (video.video_files || []).filter(
    (f) => f.file_type === 'video/mp4' && f.link
  );
  const hd = mp4s.find((f) => f.quality === 'hd');
  const sd = mp4s.find((f) => f.quality === 'sd');
  const chosen = hd || sd || mp4s[0];
  const thumbnail = video.image || video.video_pictures?.[0]?.picture || '';

  return {
    id: video.id,
    duration: video.duration,
    videoUrl: chosen?.link || '',
    thumbnail,
    src: {
      original: thumbnail,
      large2x: thumbnail,
      large: thumbnail,
      medium: thumbnail,
      small: thumbnail,
      portrait: thumbnail,
      landscape: thumbnail,
      tiny: thumbnail,
    },
    photographer: video.user?.name || '',
    photographer_url: video.user?.url || '',
    _isVideo: true,
  };
}

/**
 * Fetch photos from Pexels for given keywords.
 */
async function fetchPexelsPhotos(keywords, pexelsKey) {
  if (!pexelsKey || !keywords || keywords.length === 0) return [];

  try {
    const keyword = keywords[0]; // Use first keyword for efficiency
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=3&orientation=square`;
    const response = await fetch(url, {
      headers: { 'Authorization': pexelsKey },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.photos || [];
  } catch {
    return [];
  }
}

/**
 * Fetch videos from Pexels for given keywords.
 * Returns 1 video per row by default for speed during bulk operations.
 */
async function fetchPexelsVideos(keywords, pexelsKey) {
  if (!pexelsKey || !keywords || keywords.length === 0) return [];

  try {
    const keyword = keywords[0];
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(keyword)}&per_page=1&orientation=portrait`;
    const response = await fetch(url, {
      headers: { 'Authorization': pexelsKey },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.videos || []).map(normalizeVideo).filter((v) => v.videoUrl);
  } catch {
    return [];
  }
}

export function useBulkGenerate() {
  const { settings } = useSettings();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [bulkError, setBulkError] = useState(null);
  const abortRef = useRef(false);

  const processBulk = useCallback(async (rows, useAI = true, slideTextLength = 'medium', mediaMode = 'photos') => {
    // Validate
    if (useAI) {
      if (settings.aiProvider === 'claude' && !settings.claudeKey) {
        setBulkError('Please add your Claude API key in settings.');
        return;
      }
      if (settings.aiProvider === 'openai' && !settings.openaiKey) {
        setBulkError('Please add your OpenAI API key in settings.');
        return;
      }
      if (settings.aiProvider === 'gemini' && !settings.geminiKey) {
        setBulkError('Please add your Gemini API key in settings.');
        return;
      }
    }

    setIsProcessing(true);
    setBulkError(null);
    setResults([]);
    setProgress({ current: 0, total: rows.length });
    abortRef.current = false;

    const newResults = [];

    for (let i = 0; i < rows.length; i++) {
      if (abortRef.current) break;

      const row = rows[i];
      try {
        let content;
        if (useAI) {
          content = await generateForRow(row, settings, slideTextLength);
        } else {
          content = buildFromExcelDirect(row);
        }

        // Fetch media (photos or videos based on mediaMode)
        const mediaKeywords = content.pexels_keywords || (row.keyword ? [row.keyword] : []);
        const photos = mediaMode === 'videos'
          ? await fetchPexelsVideos(mediaKeywords, settings.pexelsKey)
          : await fetchPexelsPhotos(mediaKeywords, settings.pexelsKey);

        newResults.push({
          id: Date.now().toString() + '-' + i,
          rowIndex: i,
          row,
          content,
          photos,
          error: null,
        });
      } catch (err) {
        console.error(`Bulk row ${i + 1} error:`, err);
        newResults.push({
          id: Date.now().toString() + '-' + i,
          rowIndex: i,
          row,
          content: null,
          photos: [],
          error: err.message || 'Failed to generate',
        });
      }

      setProgress({ current: i + 1, total: rows.length });
      setResults([...newResults]);

      // Rate limit delay between AI calls
      if (useAI && i < rows.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setIsProcessing(false);
  }, [settings]);

  const cancelBulk = useCallback(() => {
    abortRef.current = true;
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setProgress({ current: 0, total: 0 });
    setBulkError(null);
  }, []);

  return {
    processBulk,
    cancelBulk,
    clearResults,
    isProcessing,
    progress,
    results,
    bulkError,
  };
}
