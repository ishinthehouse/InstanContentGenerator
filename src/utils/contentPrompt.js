/**
 * Shared prompt builder for content generation.
 *
 * Pure string logic with no browser/node-specific APIs, so it is imported by
 * BOTH the client hook (BYOK path) and the serverless function (hosted path).
 * Keeping it here means the two paths can never drift out of sync.
 */

import { DEFAULT_SLIDE_COUNT, MIN_SLIDE_COUNT, MAX_SLIDE_COUNT } from './slideSchema.js';

export const SYSTEM_PROMPT =
  'You are an Instagram content strategist for urban Indian consumer brands. Return only valid JSON, no preamble, no markdown fences.';

const SLIDE_TEXT_GUIDE = {
  short: 'Keep each slide text to a single punchy phrase or short sentence (under 10 words). Think bold, minimal, impactful.',
  medium: 'Write 1-2 compelling sentences for each slide text (15-25 words). Balance brevity with substance.',
  detailed: 'Write 2-3 rich, engaging sentences for each slide text (30-50 words). Go deep, add context, create gravitas.',
};

/** Clamp a requested slide count into the supported range. */
export function clampSlideCount(slideCount) {
  return Math.max(
    MIN_SLIDE_COUNT,
    Math.min(MAX_SLIDE_COUNT, Number(slideCount) || DEFAULT_SLIDE_COUNT)
  );
}

/**
 * Build the user prompt for a generation request.
 * @returns {{ promptText: string, systemPrompt: string, count: number }}
 */
export function buildContentPrompt({
  topic,
  tone = 'Inspirational',
  ctaType = 'None',
  hashtagCount = '10',
  language = 'English',
  contentType = 'Educational',
  slideTextLength = 'medium',
  slideCount = DEFAULT_SLIDE_COUNT,
}) {
  const slideTextGuide = SLIDE_TEXT_GUIDE[slideTextLength] || '';
  const count = clampSlideCount(slideCount);
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

  return { promptText, systemPrompt: SYSTEM_PROMPT, count };
}
