import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Play, Square, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Sparkles, FileText, AlignLeft, Download, FolderArchive, Film, Image } from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportBulkAsZip, exportBulkVideosAsZip } from '../utils/bulkExport';

// Expected column names (case-insensitive, flexible matching)
const COLUMN_MAP = {
  caption: ['caption', 'title', 'heading'],
  postContent: ['post content', 'postcontent', 'content', 'body', 'text', 'description'],
  keyword: ['keyword', 'keywords', 'tags', 'pexels keyword', 'search'],
  cta: ['cta', 'call to action', 'calltoaction', 'action'],
};

function matchColumn(header) {
  const h = header.toLowerCase().trim();
  for (const [key, aliases] of Object.entries(COLUMN_MAP)) {
    if (aliases.includes(h)) return key;
  }
  return null;
}

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (jsonData.length === 0) {
          reject(new Error('The file appears to be empty.'));
          return;
        }

        // Map headers
        const rawHeaders = Object.keys(jsonData[0]);
        const columnMapping = {};
        const unmappedHeaders = [];

        for (const header of rawHeaders) {
          const mapped = matchColumn(header);
          if (mapped) {
            columnMapping[header] = mapped;
          } else {
            unmappedHeaders.push(header);
          }
        }

        // Transform rows using the mapping
        const rows = jsonData.map(row => {
          const mapped = {};
          for (const [rawHeader, mappedKey] of Object.entries(columnMapping)) {
            mapped[mappedKey] = String(row[rawHeader] || '').trim();
          }
          return mapped;
        }).filter(row => row.caption || row.postContent); // Skip empty rows

        resolve({ rows, rawHeaders, columnMapping, unmappedHeaders, totalRaw: jsonData.length });
      } catch (err) {
        reject(new Error('Failed to parse file. Make sure it\'s a valid Excel or CSV file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

export default function BulkUpload({ onProcessBulk, isProcessing, progress, results, bulkError, onCancel, onClearResults, onSelectResult }) {
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [mediaMode, setMediaMode] = useState('photos'); // 'photos' | 'videos'
  const [slideTextLength, setSlideTextLength] = useState('medium');
  const [expandedResult, setExpandedResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zipExport, setZipExport] = useState({ active: false, done: 0, total: 0 });
  const [videoZipExport, setVideoZipExport] = useState({ active: false, done: 0, total: 0, clipProgress: 0 });
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setParseError(null);
    setParsedData(null);
    setFileName(file.name);

    try {
      const data = await parseFile(file);
      setParsedData(data);
    } catch (err) {
      setParseError(err.message);
    }
  };

  const handleFileInput = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleGenerate = () => {
    if (!parsedData?.rows) return;
    onProcessBulk(parsedData.rows, useAI, slideTextLength, mediaMode);
  };

  const handleClear = () => {
    setParsedData(null);
    setParseError(null);
    setFileName('');
    onClearResults();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const successCount = results.filter(r => r.content && !r.error).length;
  const errorCount = results.filter(r => r.error).length;
  const hasExportableResults = results.some(r => r.content && !r.error && r.photos?.length > 0);
  const hasVideoResults = results.some(r => r.content && !r.error && r.photos?.length > 0 && r.photos[0]?._isVideo);
  const hasPhotoResults = results.some(r => r.content && !r.error && r.photos?.length > 0 && !r.photos[0]?._isVideo);

  const handleDownloadZip = async () => {
    const exportable = results.filter(r => r.content && !r.error && r.photos?.length > 0);
    const totalSlides = exportable.length * 5;
    setZipExport({ active: true, done: 0, total: totalSlides });
    try {
      await exportBulkAsZip(results, (done, total) => {
        setZipExport({ active: true, done, total });
      });
    } catch (err) {
      console.error('ZIP export failed:', err);
    } finally {
      setZipExport({ active: false, done: 0, total: 0 });
    }
  };

  const handleDownloadVideoZip = async () => {
    if (videoZipExport.active) return;
    setVideoZipExport({ active: true, done: 0, total: 0, clipProgress: 0 });
    try {
      await exportBulkVideosAsZip(results, (done, total, clipProgress) => {
        setVideoZipExport({ active: true, done, total, clipProgress });
      });
    } catch (err) {
      console.error('Video ZIP export failed:', err);
    } finally {
      setVideoZipExport({ active: false, done: 0, total: 0, clipProgress: 0 });
    }
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-insta" />
          <h3 className="section-title">Bulk Upload</h3>
        </div>
        {(parsedData || results.length > 0) && !isProcessing && (
          <button
            onClick={handleClear}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Drop Zone */}
      {!parsedData && results.length === 0 && (
        <>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-insta bg-insta/15'
                : 'border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragging ? 'text-insta' : 'text-white/30'}`} />
            <p className="text-sm text-white/70 font-medium">
              Drop your Excel file here or <span className="text-insta">browse</span>
            </p>
            <p className="text-xs text-white/40 mt-1">.xlsx, .xls, or .csv</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Expected format hint */}
          <div className="mt-4 p-3 bg-white/[0.04] rounded-lg border border-white/10">
            <p className="text-[11px] font-semibold text-white/50 mb-2">Expected columns:</p>
            <div className="flex flex-wrap gap-1.5">
              {['caption', 'post content', 'keyword', 'cta'].map(col => (
                <span key={col} className="px-2 py-0.5 bg-white/[0.04] border border-white/10 rounded text-[10px] font-mono text-white/70">
                  {col}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Parse Error */}
      {parseError && (
        <div className="mt-3 p-3 bg-red-500/10 text-red-300 text-xs rounded-lg border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Parsed Preview */}
      {parsedData && !isProcessing && results.length === 0 && (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{fileName}</p>
              <p className="text-xs text-white/50">{parsedData.rows.length} valid rows found</p>
            </div>
            <button onClick={handleClear} className="text-white/40 hover:text-white/70">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Column mapping preview */}
          <div className="text-xs space-y-1">
            <p className="font-medium text-white/50">Column mapping:</p>
            {Object.entries(parsedData.columnMapping).map(([raw, mapped]) => (
              <div key={raw} className="flex items-center gap-2 text-white/70">
                <span className="font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">{raw}</span>
                <span className="text-white/30">→</span>
                <span className="font-semibold text-white">{mapped}</span>
              </div>
            ))}
            {parsedData.unmappedHeaders.length > 0 && (
              <p className="text-white/40 mt-1">
                Ignored: {parsedData.unmappedHeaders.join(', ')}
              </p>
            )}
          </div>

          {/* Row preview table */}
          <div className="overflow-x-auto border border-white/10 rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10">
                  <th className="text-left py-2 px-3 font-semibold text-white/50">#</th>
                  {['caption', 'postContent', 'keyword', 'cta'].filter(k => parsedData.rows.some(r => r[k])).map(k => (
                    <th key={k} className="text-left py-2 px-3 font-semibold text-white/50 max-w-[120px]">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-white/10 last:border-0">
                    <td className="py-2 px-3 text-white/40">{i + 1}</td>
                    {['caption', 'postContent', 'keyword', 'cta'].filter(k => parsedData.rows.some(r => r[k])).map(k => (
                      <td key={k} className="py-2 px-3 max-w-[120px] truncate text-white/80">{row[k] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.rows.length > 5 && (
              <div className="text-center py-2 text-[10px] text-white/40 bg-white/[0.04]">
                ...and {parsedData.rows.length - 5} more rows
              </div>
            )}
          </div>

          {/* AI toggle checkbox */}
          <div className="p-3 bg-gradient-to-r from-vivid/10 to-royal/10 rounded-lg border border-white/10">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 text-insta focus:ring-insta"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-sm font-semibold text-white">Use AI to generate content</span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {useAI
                    ? 'AI will generate full captions, reels scripts, and hashtags based on your Excel data.'
                    : 'Posts will use your Excel data as-is — captions, keywords, and CTAs directly from the file.'}
                </p>
              </div>
            </label>
          </div>

          {/* Media Mode Toggle — Photos vs Videos */}
          <div className="p-3 bg-white/[0.04] border border-white/10 rounded-lg">
            <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
              {mediaMode === 'videos' ? <Film className="w-3.5 h-3.5 text-purple-500" /> : <Image className="w-3.5 h-3.5 text-purple-500" />}
              Media type to fetch from Pexels
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMediaMode('photos')}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-all ${
                  mediaMode === 'photos'
                    ? 'border-insta bg-insta/15 shadow-sm'
                    : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <Image className={`w-5 h-5 ${mediaMode === 'photos' ? 'text-insta' : 'text-white/40'}`} />
                <span className={`text-xs font-bold ${mediaMode === 'photos' ? 'text-insta' : 'text-white'}`}>Photos</span>
                <span className="text-[10px] text-white/50">Carousel slides (PNG)</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaMode('videos')}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-all ${
                  mediaMode === 'videos'
                    ? 'border-insta bg-insta/15 shadow-sm'
                    : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <Film className={`w-5 h-5 ${mediaMode === 'videos' ? 'text-insta' : 'text-white/40'}`} />
                <span className={`text-xs font-bold ${mediaMode === 'videos' ? 'text-insta' : 'text-white'}`}>Videos</span>
                <span className="text-[10px] text-white/50">Rendered reels</span>
              </button>
            </div>
          </div>

          {/* Slide Text Length — only relevant when using AI */}
          {useAI && (
            <div className="p-4 bg-white/[0.04] border border-white/10 rounded-lg space-y-3">
              <div className="flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-white/40" />
                <p className="text-xs font-semibold text-white">How long should each carousel slide be?</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'short',    label: 'Short',    desc: 'Punchy one-liner', lines: '~1 line' },
                  { value: 'medium',   label: 'Medium',   desc: '1–2 sentences',   lines: '~2 lines' },
                  { value: 'detailed', label: 'Detailed', desc: '2–3 sentences',    lines: '~4 lines' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSlideTextLength(opt.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-all ${
                      slideTextLength === opt.value
                        ? 'border-insta bg-insta/15 shadow-sm'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className={`text-xs font-bold ${
                      slideTextLength === opt.value ? 'text-insta' : 'text-white'
                    }`}>{opt.label}</span>
                    <span className="text-[10px] text-white/50 leading-tight">{opt.desc}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full mt-0.5 ${
                      slideTextLength === opt.value
                        ? 'bg-insta/10 text-insta'
                        : 'bg-white/[0.06] text-white/40'
                    }`}>{opt.lines}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Error */}
          {bulkError && (
            <div className="p-3 bg-red-500/10 text-red-300 text-xs rounded-lg border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{bulkError}</span>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 via-insta to-orange-400 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-insta/25 transition-all"
          >
            {useAI ? <Sparkles className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {useAI
              ? `Generate ${parsedData.rows.length} posts with AI`
              : `Create ${parsedData.rows.length} posts from Excel`}
          </button>
        </div>
      )}

      {/* Processing state */}
      {isProcessing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">
              Processing {progress.current} of {progress.total}...
            </p>
            <button
              onClick={onCancel}
              className="flex items-center gap-1 text-xs text-red-300 hover:text-red-300 transition-colors"
            >
              <Square className="w-3 h-3" />
              Stop
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-insta to-orange-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>

          {/* Live results */}
          {results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, i) => (
                <ResultRow key={result.id} result={result} index={i} isExpanded={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed results */}
      {!isProcessing && results.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                Bulk generation complete
              </p>
              <p className="text-xs text-white/50">
                {successCount} succeeded{errorCount > 0 ? `, ${errorCount} failed` : ''}
              </p>
            </div>
          </div>

          {/* Result list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, i) => (
              <ResultRow
                key={result.id}
                result={result}
                index={i}
                isExpanded={expandedResult === result.id}
                onToggle={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                onSelect={() => onSelectResult(result)}
              />
            ))}
          </div>

          {/* Download ZIP — Photo slides */}
          {hasExportableResults && hasPhotoResults && (
            <div className="space-y-2">
              {zipExport.active ? (
                /* Progress state */
                <div className="p-4 bg-gradient-to-r from-vivid/10 to-royal/10 border border-white/10 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-insta border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-white">Building ZIP…</span>
                    </div>
                    <span className="text-xs text-white/50 font-mono">
                      {zipExport.done} / {zipExport.total} slides
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 via-insta to-orange-400 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${zipExport.total > 0 ? (zipExport.done / zipExport.total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/40">
                    Rendering each slide off-screen — this may take a moment for large batches.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleDownloadZip}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 via-insta to-orange-400 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-insta/25 transition-all active:scale-[0.98]"
                >
                  <FolderArchive className="w-4 h-4" />
                  Download all {successCount} posts as ZIP
                </button>
              )}
            </div>
          )}

          {/* Download ZIP — Rendered Videos */}
          {hasExportableResults && hasVideoResults && (
            <div className="space-y-2">
              {videoZipExport.active ? (
                <div className="p-4 bg-gradient-to-r from-royal/10 to-vivid/10 border border-white/10 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-white">Rendering videos…</span>
                    </div>
                    <span className="text-xs text-white/50 font-mono">
                      {videoZipExport.done} / {videoZipExport.total} clips
                    </span>
                  </div>
                  {/* Overall progress */}
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 via-insta to-orange-400 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${videoZipExport.total > 0 ? (videoZipExport.done / videoZipExport.total) * 100 : 0}%` }}
                    />
                  </div>
                  {/* Current clip render progress */}
                  {videoZipExport.done < videoZipExport.total && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40 whitespace-nowrap">Current clip:</span>
                      <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-purple-400 rounded-full transition-all duration-200 ease-out"
                          style={{ width: `${Math.round((videoZipExport.clipProgress || 0) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">
                        {Math.round((videoZipExport.clipProgress || 0) * 100)}%
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-white/40">
                    Each video is rendered with caption overlays — this is CPU-intensive and may take a few minutes.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleDownloadVideoZip}
                  disabled={zipExport.active}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Film className="w-4 h-4" />
                  Download all videos as ZIP
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({ result, index, isExpanded, onToggle, onSelect }) {
  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${
      result.error ? 'border-red-500/20 bg-red-500/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20'
    }`}>
      <div
        onClick={onToggle}
        className="flex items-center gap-3 p-3 cursor-pointer"
      >
        <span className="text-xs text-white/40 font-mono w-6 text-center">{index + 1}</span>
        {result.error ? (
          <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white truncate font-medium">
            {result.content?.caption || result.row?.caption || result.error || 'No content'}
          </p>
        </div>
        {onToggle && (
          isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </div>

      {isExpanded && result.content && (
        <div className="border-t border-white/10 p-3 space-y-3">
          {/* Caption preview */}
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Caption</p>
            <p className="text-xs text-white/80 leading-relaxed line-clamp-3">{result.content.caption}</p>
          </div>

          {/* Photos thumbnails */}
          {result.photos && result.photos.length > 0 && (
            <div className="flex gap-1.5">
              {result.photos.slice(0, 3).map(photo => (
                <img
                  key={photo.id}
                  src={photo.src.tiny}
                  alt=""
                  className="w-12 h-12 rounded object-cover"
                />
              ))}
            </div>
          )}

          {/* Hashtags */}
          {result.content.hashtags && (
            <div className="text-[10px] text-white/40 truncate">
              {[...(result.content.hashtags.niche || []), ...(result.content.hashtags.broad || [])].slice(0, 6).join(' ')}
            </div>
          )}

          {/* View button */}
          {onSelect && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="w-full py-2 text-xs font-semibold text-insta bg-insta/15 rounded-md hover:bg-insta/25 transition-colors"
            >
              View full post →
            </button>
          )}
        </div>
      )}

      {isExpanded && result.error && (
        <div className="border-t border-red-500/20 p-3">
          <p className="text-xs text-red-300">{result.error}</p>
          <p className="text-[10px] text-white/40 mt-1">
            Row data: {JSON.stringify(result.row).slice(0, 100)}...
          </p>
        </div>
      )}
    </div>
  );
}
