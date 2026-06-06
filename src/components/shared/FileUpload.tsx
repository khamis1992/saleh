import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle, Loader2, CheckCircle2, FileArchive, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { compressImage, formatBytes, type CompressionOptions } from '@/utils/fileCompress';
import { useLocale } from '@/providers/LocaleContext';

export interface UploadedFile {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width?: number;
  height?: number;
  /** 'compressed' if image was resized/re-encoded, 'passthrough' otherwise */
  kind: 'compressed' | 'passthrough';
}

interface FileUploadProps {
  value?: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  /** Compress images automatically before storing */
  compress?: boolean;
  /** Custom accept map (defaults to common docs + images) */
  accept?: Record<string, string[]>;
  /** Title text (Arabic) */
  title?: string;
  /** Subtitle hint text (Arabic) */
  hint?: string;
}

interface FileProgress {
  filename: string;
  percent: number;
  result?: UploadedFile;
  error?: string;
}

const DEFAULT_ACCEPT: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
};

function pickIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return FileImage;
  if (['zip', 'rar', '7z'].includes(ext)) return FileArchive;
  return FileText;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('فشلت قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

export function FileUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxSizeMB = 10,
  disabled = false,
  compress = true,
  accept = DEFAULT_ACCEPT,
  title = 'اسحب الملفات وأفلتها هنا',
  hint = 'PDF، صور، Word، Excel — حتى 10MB لكل ملف',
}: FileUploadProps) {
  const { t, tt, dir } = useLocale();
  const [error, setError] = useState<string>('');
  const [progressList, setProgressList] = useState<FileProgress[]>([]);

  const processFiles = useCallback(
    async (acceptedFiles: File[]) => {
      if (value.length + acceptedFiles.length > maxFiles) {
        setError(`الحد الأقصى ${maxFiles} ملفات`);
        return;
      }
      const oversized = acceptedFiles.find((f) => f.size > maxSizeMB * 1024 * 1024);
      if (oversized) {
        setError(`حجم الملف ${oversized.name} يتجاوز ${maxSizeMB} ميجابايت`);
        return;
      }

      setError('');
      const initial: FileProgress[] = acceptedFiles.map((f) => ({
        filename: f.name,
        percent: 0,
      }));
      setProgressList(initial);

      const results: UploadedFile[] = [];
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        try {
          setProgressList((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, percent: 30 } : p))
          );

          const isImage = file.type.startsWith('image/');
          let dataUrl: string;
          let compressedSize: number;
          let width: number | undefined;
          let height: number | undefined;
          let kind: 'compressed' | 'passthrough';

          if (isImage && compress) {
            const opts: CompressionOptions = {
              maxWidthOrHeight: 2000,
              quality: 0.85,
              mimeType: 'image/jpeg',
            };
            const result = await compressImage(file, opts);
            dataUrl = result.dataUrl;
            compressedSize = result.compressedSize;
            width = result.width;
            height = result.height;
            kind = 'compressed';
          } else {
            dataUrl = await fileToDataUrl(file);
            compressedSize = file.size;
            kind = 'passthrough';
          }

          setProgressList((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? {
                    ...p,
                    percent: 100,
                    result: {
                      file,
                      dataUrl,
                      originalSize: file.size,
                      compressedSize,
                      width,
                      height,
                      kind,
                    },
                  }
                : p
            )
          );
          results.push({ file, dataUrl, originalSize: file.size, compressedSize, width, height, kind });

          if (kind === 'compressed' && file.size !== compressedSize) {
            toast.success(
              `تم ضغط ${file.name}: ${formatBytes(file.size)} → ${formatBytes(compressedSize)}`,
              { duration: 2500 }
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
      setTimeout(() => setProgressList([]), 1200);
    },
    [value, maxFiles, maxSizeMB, onChange, compress]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      void processFiles(acceptedFiles);
    },
    [processFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    disabled: disabled || progressList.length > 0,
  });

  const removeFile = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
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
        <p className="text-sm font-medium text-gray-700">{isDragActive ? 'أفلت الملفات هنا' : title}</p>
        <p className="text-xs text-[#64748d] mt-1">{hint}</p>
        <p className="text-xs text-[#64748d] mt-1">
          {value.length} / {maxFiles} ملفات
          {compress && ' • ضغط تلقائي للصور'}
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
          {progressList.map((p, i) => {
            const Icon = pickIcon(p.filename);
            return (
              <div key={i} className="bg-[#f6f9fc] rounded-lg p-3 border border-[#e5edf5]">
                <div className="flex items-center gap-2 mb-1.5">
                  {p.error ? (
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  ) : p.percent >= 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-[#533afd] animate-spin shrink-0" />
                  )}
                  <Icon className="h-4 w-4 text-[#64748d] shrink-0" />
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
                {p.result && p.result.kind === 'compressed' && p.result.originalSize !== p.result.compressedSize && (
                  <p className="text-[12px] text-[#64748d] mt-1">
                    {formatBytes(p.result.originalSize)} → {formatBytes(p.result.compressedSize)}
                    {p.result.width && p.result.height && ` • ${p.result.width}×${p.result.height}`}
                  </p>
                )}
                {p.error && <p className="text-[12px] text-[#ea2261] mt-1">{p.error}</p>}
              </div>
            );
          })}
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((f, i) => {
            const Icon = pickIcon(f.file.name);
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-white border border-[#e5edf5] rounded-lg"
              >
                <div className="h-9 w-9 rounded-lg bg-[rgba(83,58,253,0.06)] flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[#533afd]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#273951] truncate">{f.file.name}</p>
                  <p className="text-xs text-[#64748d]">
                    {formatBytes(f.compressedSize)}
                    {f.kind === 'compressed' && f.originalSize !== f.compressedSize && (
                      <span className="text-green-600 mr-1">
                        (وفّرت {Math.round((1 - f.compressedSize / f.originalSize) * 100)}%)
                      </span>
                    )}
                    {f.width && f.height && ` • ${f.width}×${f.height}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(i)}
                  className="h-8 w-8 text-[#64748d] hover:text-[#ea2261]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
