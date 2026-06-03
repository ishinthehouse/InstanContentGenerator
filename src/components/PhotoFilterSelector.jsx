import { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { FILTER_PRESETS, FILTER_CATEGORIES, buildFilterThumbnailUrl, applyFilterToPhoto } from '../utils/cloudinaryFilters';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

export default function PhotoFilterSelector({ photos, onApplyFilter }) {
  const { settings } = useSettings();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedFilterId, setSelectedFilterId] = useState('none');

  // We need a cloud name to do transformations
  if (!settings.cloudinaryName) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-dark">Photo Filters</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Add your Cloudinary Cloud Name in Settings to enable beautiful Instagram-style photo filters.
        </p>
      </div>
    );
  }

  // We only need one base image to preview the filters (the first selected photo)
  const previewPhoto = photos && photos.length > 0 ? photos[0] : null;

  if (!previewPhoto) return null;

  const filteredPresets = activeCategory === 'all' 
    ? FILTER_PRESETS 
    : FILTER_PRESETS.filter(p => p.category === activeCategory);

  const handleSelectFilter = (filter) => {
    setSelectedFilterId(filter.id);
    
    if (filter.id === 'none') {
      // Revert to original photos
      onApplyFilter(photos.map(p => ({
        ...p,
        _filterId: 'none',
        // Strip the cloudinary fetch URL if we already applied one
        src: p._originalSrc || p.src,
      })));
      return;
    }

    // Apply the filter to all photos in the array
    const transformedPhotos = photos.map(photo => {
      // Keep track of the very first original URL before any cloudinary wrappers
      const originalSrc = photo._originalSrc || photo.src;
      
      const filteredPhoto = applyFilterToPhoto(
        { ...photo, src: originalSrc, _originalSrc: originalSrc }, 
        settings.cloudinaryName, 
        filter.transforms
      );
      
      return filteredPhoto;
    });

    onApplyFilter(transformedPhotos);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-insta" />
          <h3 className="text-sm font-semibold text-dark">Enhance & Filter</h3>
        </div>

        {/* Category Pills */}
        <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-dark text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {filteredPresets.map(filter => {
          // Build thumbnail for preview
          // Use the 'small' image size from Pexels for a lighter base image
          const thumbUrl = buildFilterThumbnailUrl(
            settings.cloudinaryName, 
            previewPhoto._originalSrc?.small || previewPhoto.src.small, 
            filter.transforms
          );

          const isSelected = selectedFilterId === filter.id;

          return (
            <div 
              key={filter.id}
              className="flex flex-col items-center gap-2 cursor-pointer snap-start flex-shrink-0 group"
              onClick={() => handleSelectFilter(filter)}
            >
              <div className={`w-20 h-20 rounded-xl overflow-hidden relative transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-insta ring-offset-2 scale-105' 
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}>
                {filter.id === 'none' ? (
                  <img 
                    src={previewPhoto._originalSrc?.small || previewPhoto.src.small} 
                    alt="Original" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <img 
                    src={thumbUrl} 
                    alt={filter.name} 
                    className="w-full h-full object-cover" 
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <div className="text-center">
                <p className={`text-xs font-medium transition-colors ${
                  isSelected ? 'text-insta' : 'text-gray-600 group-hover:text-dark'
                }`}>
                  {filter.name}
                </p>
                <p className="text-[9px] text-gray-400 capitalize">{filter.category}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
