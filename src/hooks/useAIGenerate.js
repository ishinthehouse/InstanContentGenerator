import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { DEFAULT_SLIDE_COUNT, MIN_SLIDE_COUNT, MAX_SLIDE_COUNT } from '../utils/slideSchema';

export function useAIGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [error, setError] = useState(null);
  const { settings } = useSettings();

  const generateContent = async ({ topic, tone, ctaType, hashtagCount, language, contentType, slideTextLength = 'medium', slideCount = DEFAULT_SLIDE_COUNT }) => {
    // Validate API key for selected provider
    if (settings.aiProvider === 'claude' && !settings.claudeKey) {
      setError('Please add your Claude API key in settings.');
      return null;
    }
    
    if (settings.aiProvider === 'openai' && !settings.openaiKey) {
      setError('Please add your OpenAI API key in settings.');
      return null;
    }

    if (settings.aiProvider === 'gemini' && !settings.geminiKey) {
      setError('Please add your Gemini API key in settings.');
      return null;
    }

    if (!topic) {
      setError('Please enter a topic.');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedData(null);

    const slideTextGuide = {
      short: 'Keep each slide text to a single punchy phrase or short sentence (under 10 words). Think bold, minimal, impactful.',
      medium: 'Write 1-2 compelling sentences for each slide text (15-25 words). Balance brevity with substance.',
      detailed: 'Write 2-3 rich, engaging sentences for each slide text (30-50 words). Go deep, add context, create gravitas.',
    }[slideTextLength] || '';

    // Clamp the requested slide count into the supported range.
    const count = Math.max(MIN_SLIDE_COUNT, Math.min(MAX_SLIDE_COUNT, Number(slideCount) || DEFAULT_SLIDE_COUNT));
    const beatCount = count - 2; // first slide is the hook, last is the CTA

    const promptText = `
Topic: ${topic}
Tone: ${tone}
Call to Action Type: ${ctaType}
Hashtag Count: ${hashtagCount}
Language: ${language}
Content Type: ${contentType}
Slide Text Length: ${slideTextLength}
Number of slides: ${count}

IMPORTANT TEXT LENGTH INSTRUCTION: ${slideTextGuide}

Generate Instagram carousel/reel content for the above topic. The carousel must have EXACTLY ${count} slides in order:
- Slide 1: role "hook" — a pattern-interrupt opener for the first 3 seconds.
- Slides 2-${count - 1}: role "beat" — ${beatCount} distinct supporting points that build the narrative.
- Slide ${count}: role "cta" — the closing call to action.

Return ONLY a JSON object with this exact shape (no markdown, no commentary):
{
  "caption": "string -- the post caption, no hashtags inside it",
  "slides": [
    {
      "role": "hook | beat | cta",
      "label": "string -- short engaging label, 1-4 words (e.g. 'DID YOU KNOW?', 'KEY INSIGHT', 'TAKE ACTION')",
      "text": "string -- the slide copy. ${slideTextGuide}"
    }
    -- repeat for all ${count} slides, first role 'hook', last role 'cta', the rest 'beat'
  ],
  "pexels_keywords": ["keyword1", "keyword2", "keyword3"],
  "hashtags": {
    "niche": ["#tag1", "#tag2", ...],
    "broad": ["#tag1", "#tag2", ...]
  },
  "alt_text": "string -- image accessibility description"
}
`;

    const systemPrompt = "You are an Instagram content strategist for urban Indian consumer brands. Return only valid JSON, no preamble, no markdown fences.";

    try {
      let rawJson = '';

      if (settings.aiProvider === 'claude') {
        const anthropic = new Anthropic({
          apiKey: settings.claudeKey,
          dangerouslyAllowBrowser: true,
        });

        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 3000, // headroom for up to 10 detailed slides
          system: systemPrompt,
          messages: [
            { role: "user", content: promptText }
          ]
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
        // Gemini via REST API — no SDK needed
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.geminiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [{
              parts: [{ text: promptText }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 2000,
              responseMimeType: "application/json",
            }
          })
        });

        if (!geminiResponse.ok) {
          const errData = await geminiResponse.json().catch(() => ({}));
          const errMsg = errData?.error?.message || geminiResponse.statusText;
          if (geminiResponse.status === 400 && errMsg.includes('API key')) {
            throw new Error('Invalid Gemini API key. Please check your key in settings.');
          }
          throw new Error(`Gemini API error: ${geminiResponse.status} — ${errMsg}`);
        }

        const geminiData = await geminiResponse.json();
        rawJson = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!rawJson) {
          throw new Error('Gemini returned an empty response. Try again.');
        }
      }

      // Cleanup rawJson just in case the AI added markdown fences despite instructions
      rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(rawJson);
      setGeneratedData(parsedData);
      return parsedData;

    } catch (err) {
      console.error("AI Generation Error:", err);
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
