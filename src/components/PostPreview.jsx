import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function PostPreview({ content, photo }) {
  const { settings } = useSettings();
  
  if (!content || !photo) return null;

  const handle = settings.defaultHandle || '@yourbrand';
  
  // Format hashtags
  const nicheTags = content.hashtags?.niche || [];
  const broadTags = content.hashtags?.broad || [];
  const allTags = [...nicheTags, ...broadTags].join(' ');

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-semibold text-dark mb-3 w-full max-w-[400px]">Post Preview</h3>
      
      {/* Container for html2canvas to capture */}
      <div 
        id="post-preview" 
        className="bg-white border border-gray-200 rounded-lg w-full max-w-[400px] overflow-hidden"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-insta p-[2px]">
              <div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden">
                <img 
                  src={`https://ui-avatars.com/api/?name=${handle.replace('@','')}&background=random`} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-sm font-semibold text-dark">{handle}</span>
          </div>
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </div>

        {/* Image */}
        <div className="w-full aspect-square bg-gray-100">
          <img 
            src={photo.src.large2x} 
            alt={content.alt_text || 'Post image'} 
            className="w-full h-full object-cover"
            crossOrigin="anonymous" // Important for html2canvas
          />
        </div>

        {/* Action Icons */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Heart className="w-6 h-6 text-dark" />
              <MessageCircle className="w-6 h-6 text-dark" />
              <Send className="w-6 h-6 text-dark" />
            </div>
            <Bookmark className="w-6 h-6 text-dark" />
          </div>

          {/* Likes (Mock) */}
          <div className="text-sm font-semibold text-dark mb-1">
            842 likes
          </div>

          {/* Caption */}
          <div className="text-sm text-dark mb-2 font-serif leading-relaxed">
            <span className="font-sans font-semibold mr-2">{handle}</span>
            {content.caption}
          </div>

          {/* Hashtags */}
          <div className="text-sm text-gray-500 mb-2 font-sans break-words">
            {allTags}
          </div>

          {/* Timestamp */}
          <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
            Just now
          </div>
        </div>
      </div>
      
      {/* Attribution */}
      <div className="text-xs text-gray-400 mt-3">
        {photo._isVideo ? 'Video' : 'Photo'} by {photo.photographer} on Pexels
      </div>
    </div>
  );
}
