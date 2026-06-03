import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

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

export function usePexelsSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const { settings } = useSettings();

  const searchPhotos = async (keywords, mediaMode = 'photos') => {
    if (!settings.pexelsKey) {
      setError('Please add your Pexels API key in settings.');
      return;
    }

    if (!keywords || keywords.length === 0) {
      setError('No keywords provided for media search.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setPhotos([]);

    try {
      const fetchPromises = keywords.map(async (keyword) => {
        const url =
          mediaMode === 'videos'
            ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(keyword)}&per_page=9&orientation=portrait`
            : `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=9&orientation=square`;

        const response = await fetch(url, {
          headers: {
            'Authorization': settings.pexelsKey,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid Pexels API key. Please check your key in settings.');
          }
          if (response.status === 429) {
            throw new Error('Pexels rate limit reached. Please wait a moment and try again.');
          }
          throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
        }

        const pexelsData = await response.json();

        if (pexelsData.error) {
          throw new Error(`Pexels API Error: ${pexelsData.error}`);
        }

        if (mediaMode === 'videos') {
          return (pexelsData.videos || []).map(normalizeVideo).filter((v) => v.videoUrl);
        }
        return pexelsData.photos || [];
      });

      const results = await Promise.all(fetchPromises);

      const allItems = results.flat();
      const uniqueItems = [];
      const seenIds = new Set();

      for (const item of allItems) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueItems.push(item);
        }
      }

      setPhotos(uniqueItems.slice(0, 9));
    } catch (err) {
      console.error('Pexels search error:', err);
      setError(err.message || 'An unexpected error occurred while fetching media.');
    } finally {
      setIsSearching(false);
    }
  };

  return { searchPhotos, photos, isSearching, error, setPhotos, setError };
}
