import { Check, Play } from 'lucide-react';

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

export default function PhotoGrid({ photos, selectedPhotoIds, onToggleSelect, isSearching, mediaMode = 'photos' }) {
  const isVideosMode = mediaMode === 'videos';
  if (isSearching) {
    return (
      <div className="glass-panel p-4">
        <h3 className="section-title mb-3">
          {isVideosMode ? 'Finding videos...' : 'Finding photos...'}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="aspect-square bg-white/[0.04] animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return null;
  }

  const selectedCount = selectedPhotoIds?.length || 0;

  return (
    <div className="glass-panel p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="section-title">
            {isVideosMode ? 'Select Videos' : 'Select Photos'}
          </h3>
          {selectedCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold text-white bg-insta rounded-full min-w-[20px]">
              {selectedCount}
            </span>
          )}
        </div>
        <span className="text-xs text-white/50">
          {selectedCount === 0 ? 'Tap to select' : `${selectedCount} selected · tap to toggle`}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => {
          const selIndex = selectedPhotoIds?.indexOf(photo.id) ?? -1;
          const isSelected = selIndex !== -1;
          const isVideo = !!photo._isVideo;
          const thumbSrc = isVideo ? photo.thumbnail : photo.src.medium;
          return (
            <div
              key={photo.id}
              onClick={() => onToggleSelect(photo)}
              className="relative aspect-square cursor-pointer group rounded-md overflow-hidden"
            >
              <img
                src={thumbSrc}
                alt={photo.alt || (isVideo ? 'Pexels video' : 'Pexels photo')}
                className={`w-full h-full object-cover transition-transform duration-300 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}
              />
              {/* Overlay for selection */}
              <div className={`absolute inset-0 transition-opacity ${isSelected ? 'bg-insta/20' : 'bg-black/0 group-hover:bg-black/10'}`} />

              {/* Video play button + duration */}
              {isVideo && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs rounded px-1.5 py-0.5 pointer-events-none">
                    {formatDuration(photo.duration)}
                  </div>
                </>
              )}
              
              {/* Photographer credit (hover) */}
              <div className={`absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] truncate transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {photo.photographer}
              </div>

              {/* Selection Badge with order number */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-insta text-white w-6 h-6 rounded-full shadow-md flex items-center justify-center">
                  {selectedCount === 1 ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span className="text-[10px] font-bold">{selIndex + 1}</span>
                  )}
                </div>
              )}

              {/* Unselected hover indicator */}
              {!isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
