import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage, formatBytes, type CompressionOptions, type CompressionResult } from '@/utils/fileCompress';
import { useLocale } from '@/providers/LocaleContext';

interface PhotoUploadProps {
  value?: string[];
  onChange: (dataUrls: string[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  /** Enable client-side compression (default true for images). */
  compress?: boolean;
  /** Max width/height in pixels when compressing. */
  maxWidthOrHeight?: number;
  /** JPEG/WebP quality 0..1. */
  quality?: number;
}

interface UploadProgress {
  filename: string;
  percent: number;
  result?: CompressionResult;
  error?: string;
}

export function PhotoUpload({
  value = [],
  onChange,
  maxFiles = 10,
  maxSizeMB = 2,
  disabled = false,
  compress = true,
  maxWidthOrHeight = 1600,
  quality = 0.8,
}: PhotoUploadProps) {
  const { t, tt, dir } = useLocale();
  const [error, setError] = useState<string>('');
  const [progressList, setProgressList] = useState<UploadProgress[]>([]);

  const processFiles = useCallback(
    async (acceptedFiles: File[]) => {
      if (value.length + acceptedFiles.length > maxFiles) {
        setError(`الحد الأقصى ${maxFiles} صور`);
        return;
      }
      const oversized = acceptedFiles.find((f) => f.size > maxSizeMB * 1024 * 1024);
      if (oversized) {
        setError(`حجم الملف ${oversized.name} يتجاوز ${maxSizeMB} ميجابايت`);
        return;
      }

      setError('');
      const initial: UploadProgress[] = acceptedFiles.map((f) => ({
        filename: f.name,
        percent: 0,
      }));
      setProgressList(initial);

      const results: string[] = [];
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        try {
          // Indeterminate progress (compressImage is non-streaming, so we tick visually)
          setProgressList((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, percent: 30 } : p))
          );

          const opts: CompressionOptions = compress
            ? { maxWidthOrHeight, quality, mimeType: 'image/jpeg' }
            : {};
          const result = await compressImage(file, opts);

          setProgressList((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, percent: 100, result } : p
            )
          );
          results.push(result.dataUrl);

          if (compress && result.ratio < 1 && result.originalSize !== result.compressedSize) {
            toast.success(
              `تم ضغط ${file.name}: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${Math.round((1 - result.ratio) * 100)}% أصغر)`,
              { duration: 3000 }
            );
          }
        } catch (e: any) {
          setProgressList((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, percent: 100, error: e.message || 'فشل' } : p
            )
          );
        }
      }

      onChange([...value, ...results]);
      // Clear progress after a brief delay so the user sees the success state
      setTimeout(() => setProgressList([]), 1200);
    },
    [value, maxFiles, maxSizeMB, onChange, compress, maxWidthOrHeight, quality]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      void processFiles(acceptedFiles);
    },
    [processFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    disabled: disabled || progressList.length > 0,
  });

  const removePhoto = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-[rgba(83,58,253,0.06)]'
            : 'border-[#e5edf5] hover:border-blue-300 hover:bg-[#f6f9fc]'
        } ${disabled || progressList.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto text-[#64748d] mb-2" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'أفلت الصور هنا' : 'اسحب الصور أو انقر للاختيار'}
        </p>
        <p className="text-xs text-[#64748d] mt-1">
          JPG, PNG, WEBP حتى {maxSizeMB}MB • الحد الأقصى {maxFiles} صور
        </p>
        <p className="text-xs text-[#64748d] mt-1">
          {value.length} / {maxFiles} صور مرفوعة
          {compress && ' • ضغط تلقائي مفعّل'}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-[#ea2261]">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {progressList.length > 0 && (
        <div className="space-y-2">
          {progressList.map((p, i) => (
            <div key={i} className="bg-[#f6f9fc] rounded-lg p-3 border border-[#e5edf5]">
              <div className="flex items-center gap-2 mb-1.5">
                {p.error ? (
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                ) : p.percent >= 100 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Loader2 className="h-4 w-4 text-[#533afd] animate-spin shrink-0" />
                )}
                <span className="text-xs text-gray-700 truncate flex-1">{p.filename}</span>
                <span className="text-xs text-[#64748d]">{p.percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    p.error ? 'bg-red-400' : p.percent >= 100 ? 'bg-green-500' : 'bg-[#533afd]'
                  }`}
                  style={{ width: `${p.percent}%` }}
                />
              </div>
              {p.result && p.result.originalSize !== p.result.compressedSize && (
                <p className="text-[12px] text-[#64748d] mt-1">
                  {formatBytes(p.result.originalSize)} → {formatBytes(p.result.compressedSize)} • {p.result.width}×{p.result.height}
                </p>
              )}
              {p.error && <p className="text-[12px] text-[#ea2261] mt-1">{p.error}</p>}
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((dataUrl, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-[#e5edf5] aspect-square">
              <img
                src={dataUrl}
                alt={`صورة ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="opacity-0 group-hover:opacity-100 bg-[#ea2261] hover:bg-red-600 text-white rounded-full p-1.5 transition-opacity"
                  title={tt('common.delete','حذف')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[12px] px-1.5 py-0.5 rounded">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && !error && progressList.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-[#64748d] justify-center">
          <ImageIcon className="h-3 w-3" />
          لم يتم رفع أي صور بعد
        </div>
      )}
    </div>
  );
}
