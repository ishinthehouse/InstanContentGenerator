/**
 * Cloudinary filter presets for Instagram-style photo enhancements.
 * Uses Cloudinary's fetch delivery type to transform external (Pexels) URLs on-the-fly.
 *
 * Fetch URL format:
 *   https://res.cloudinary.com/{cloud_name}/image/fetch/{transformations}/{source_url}
 */

export const FILTER_PRESETS = [
  {
    id: 'none',
    name: 'Original',
    category: 'basic',
    transforms: '',
    description: 'No filter applied',
  },
  {
    id: 'enhance',
    name: 'Auto Enhance',
    category: 'basic',
    transforms: 'e_improve,e_auto_brightness,e_auto_contrast',
    description: 'AI-powered auto enhancement',
  },
  {
    id: 'warm_glow',
    name: 'Warm Glow',
    category: 'warm',
    transforms: 'e_art:audrey',
    description: 'Warm golden tones — great for lifestyle & food',
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    category: 'warm',
    transforms: 'e_art:sizzle',
    description: 'Vibrant warm orange tones',
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    category: 'warm',
    transforms: 'e_brightness:10,e_vibrance:30,e_warmth:40',
    description: 'Soft golden warmth like sunset light',
  },
  {
    id: 'cool_breeze',
    name: 'Cool Breeze',
    category: 'cool',
    transforms: 'e_art:frost',
    description: 'Cool blue-tinted tones — great for tech & minimalist',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    category: 'cool',
    transforms: 'e_art:quartz',
    description: 'Crystalline cool with subtle pastel tones',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    category: 'retro',
    transforms: 'e_art:daguerre',
    description: 'Classic film-era warmth with grain',
  },
  {
    id: 'retro_fade',
    name: 'Retro Fade',
    category: 'retro',
    transforms: 'e_art:hairspray',
    description: 'Faded retro look with lifted blacks',
  },
  {
    id: 'vivid_pop',
    name: 'Vivid Pop',
    category: 'bold',
    transforms: 'e_vibrance:60,e_saturation:30,e_contrast:15',
    description: 'Pumped-up colors — great for food & fashion',
  },
  {
    id: 'bold_contrast',
    name: 'Bold',
    category: 'bold',
    transforms: 'e_art:red_rock',
    description: 'High contrast dramatic look',
  },
  {
    id: 'moody_dark',
    name: 'Moody',
    category: 'dark',
    transforms: 'e_art:incognito',
    description: 'Dark cinematic mood — great for luxury & fashion',
  },
  {
    id: 'noir',
    name: 'Noir',
    category: 'dark',
    transforms: 'e_grayscale,e_contrast:30,e_brightness:-5',
    description: 'Classic black & white with deep contrast',
  },
  {
    id: 'soft_dream',
    name: 'Soft Dream',
    category: 'soft',
    transforms: 'e_art:linen',
    description: 'Soft dreamy pastel tones',
  },
  {
    id: 'clean_bright',
    name: 'Clean',
    category: 'soft',
    transforms: 'e_brightness:15,e_contrast:10,e_sharpen:80',
    description: 'Clean and bright — great for product photos',
  },
  {
    id: 'spring',
    name: 'Spring',
    category: 'soft',
    transforms: 'e_art:primavera',
    description: 'Fresh spring-like pastel greens',
  },
  {
    id: 'peacock',
    name: 'Peacock',
    category: 'bold',
    transforms: 'e_art:peacock',
    description: 'Rich jewel-toned blues and greens',
  },
  {
    id: 'eucalyptus',
    name: 'Botanical',
    category: 'soft',
    transforms: 'e_art:eucalyptus',
    description: 'Muted green botanical tones',
  },
];

export const FILTER_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'basic', name: 'Basic' },
  { id: 'warm', name: 'Warm' },
  { id: 'cool', name: 'Cool' },
  { id: 'retro', name: 'Retro' },
  { id: 'bold', name: 'Bold' },
  { id: 'dark', name: 'Dark' },
  { id: 'soft', name: 'Soft' },
];

/**
 * Build a Cloudinary fetch URL with transformations applied.
 * @param {string} cloudName - Your Cloudinary cloud name
 * @param {string} sourceUrl - The original image URL (e.g. from Pexels)
 * @param {string} transforms - Cloudinary transformation string (e.g. 'e_art:audrey')
 * @returns {string} Transformed URL via Cloudinary fetch, or original URL if no transforms/cloudName
 */
export function buildFilteredUrl(cloudName, sourceUrl, transforms) {
  if (!transforms || !cloudName || !sourceUrl) return sourceUrl;
  // Use f_auto for optimal format and q_auto for quality
  const fullTransforms = `${transforms},f_auto,q_auto`;
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${fullTransforms}/${sourceUrl}`;
}

/**
 * Build a small thumbnail URL for filter preview.
 * Uses aggressive size reduction for fast loading of preview thumbnails.
 */
export function buildFilterThumbnailUrl(cloudName, sourceUrl, transforms) {
  if (!cloudName || !sourceUrl) return sourceUrl;
  const sizePart = 'w_100,h_100,c_fill';
  const fullTransforms = transforms
    ? `${sizePart},${transforms},f_auto,q_60`
    : `${sizePart},f_auto,q_60`;
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${fullTransforms}/${sourceUrl}`;
}

/**
 * Apply a filter to a photo object by rewriting its src URLs.
 * Returns a new photo object with filtered URLs (doesn't mutate the original).
 */
export function applyFilterToPhoto(photo, cloudName, transforms) {
  if (photo._isVideo) return photo;
  if (!transforms || !cloudName) return photo;

  return {
    ...photo,
    src: {
      ...photo.src,
      original: buildFilteredUrl(cloudName, photo.src.original, transforms),
      large2x: buildFilteredUrl(cloudName, photo.src.large2x, transforms),
      large: buildFilteredUrl(cloudName, photo.src.large, transforms),
      medium: buildFilteredUrl(cloudName, photo.src.medium, transforms),
      small: buildFilteredUrl(cloudName, photo.src.small, transforms),
      portrait: buildFilteredUrl(cloudName, photo.src.portrait, transforms),
      landscape: buildFilteredUrl(cloudName, photo.src.landscape, transforms),
      tiny: buildFilteredUrl(cloudName, photo.src.tiny, transforms),
    },
    _filterId: transforms, // Track which filter is applied
  };
}
