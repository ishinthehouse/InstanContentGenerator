/**
 * Dependency-free content extraction for the "repurpose a link" feature.
 *
 * Server-side fetch (no browser CORS limits, unlike the old public proxy) plus
 * lightweight HTML→text extraction. Good enough to feed the generation prompt;
 * a heavier readability lib (jsdom + @mozilla/readability) is a later upgrade if
 * extraction quality ever needs it.
 */

const UA =
  'Mozilla/5.0 (compatible; InstaForgeBot/1.0; +https://instaforge.app)';

/** Pull a tag's text content (first match), tags stripped. */
function tagText(html, tag) {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? stripTags(m[1]) : '';
}

/** Read a meta tag's content attr by name or property. */
function metaContent(html, key) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${key}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const m = html.match(re);
  if (m) return decodeEntities(m[1]);
  // attribute order can be reversed (content before name/property)
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${key}["']`,
    'i'
  );
  const m2 = html.match(re2);
  return m2 ? decodeEntities(m2[1]) : '';
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Concatenate visible paragraph text, longest-first, capped. */
function paragraphText(html, maxChars) {
  const paras = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const t = stripTags(m[1]);
    if (t.length >= 40) paras.push(t); // skip nav/boilerplate fragments
  }
  let out = '';
  for (const p of paras) {
    if (out.length + p.length + 1 > maxChars) break;
    out += (out ? '\n' : '') + p;
  }
  return out;
}

function isYouTube(u) {
  return /(?:youtube\.com|youtu\.be)/i.test(u);
}

/** YouTube: title + author via the public oEmbed endpoint (no key). */
async function extractYouTube(url) {
  const o = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(o, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Could not read this YouTube link (${res.status}).`);
  const data = await res.json();
  const title = data.title || '';
  const author = data.author_name || '';
  const text = [title, author ? `by ${author}` : ''].filter(Boolean).join(' — ');
  return { kind: 'youtube', title, text, source: url };
}

/**
 * Fetch a URL and return extracted text suitable for prompting.
 * @returns {{ kind: string, title: string, text: string, source: string }}
 */
export async function extractFromUrl(rawUrl, { maxChars = 4000 } = {}) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Please enter a valid URL (including https://).');
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error('Only http(s) links are supported.');
  }

  if (isYouTube(url.href)) {
    return extractYouTube(url.href);
  }

  const res = await fetch(url.href, {
    headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Could not fetch the link (HTTP ${res.status}).`);

  const ctype = res.headers.get('content-type') || '';
  if (!/text\/html|application\/xhtml/i.test(ctype)) {
    throw new Error('That link is not a readable web page.');
  }

  const html = await res.text();
  const title = tagText(html, 'title') || metaContent(html, 'og:title');
  const desc = metaContent(html, 'og:description') || metaContent(html, 'description');
  const body = paragraphText(html, maxChars);

  const text = [title, desc, body].filter(Boolean).join('\n\n').slice(0, maxChars).trim();
  if (!text) throw new Error('Could not extract readable text from that link.');

  return { kind: 'article', title, text, source: url.href };
}
