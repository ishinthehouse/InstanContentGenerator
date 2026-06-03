import { Clock, Trash2 } from 'lucide-react';

export default function HistorySidebar({ history, onRestore, onClear }) {
  if (!history || history.length === 0) {
    return (
      <div className="w-full h-full bg-white border-r border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-dark flex items-center gap-2 mb-6">
          <Clock className="w-4 h-4" />
          Session History
        </h2>
        <div className="text-sm text-gray-400 text-center mt-10">
          No history yet. Start generating!
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 pb-2">
        <h2 className="text-sm font-semibold text-dark flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Session History
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.map((post) => (
          <div 
            key={post.id} 
            onClick={() => onRestore(post)}
            className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all group"
          >
            {post.photo && (
              <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                <img src={post.photo.src.medium} alt="thumbnail" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-dark font-serif line-clamp-2 leading-tight">
                {post.content.caption}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={onClear}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-500 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear History
        </button>
      </div>
    </div>
  );
}
