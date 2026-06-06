// File compression utilities for upload component
// Compresses images client-side before storing as base64 in localStorage

export interface CompressionOptions {
  maxWidthOrHeight?: number;
  quality?: number; // 0..1 for JPEG/WebP
  mimeType?: string;
}

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  ratio: number; // compressedSize / originalSize
}

/**
 * Read a File into an HTMLImageElement.
 */
function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read image'));
    };
    img.src = url;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Compress an image File using a canvas. Returns a smaller Blob + data URL.
 * - Resizes down to maxWidthOrHeight while preserving aspect ratio.
 * - Re-encodes as JPEG/WebP at the given quality.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxWidthOrHeight = 1600, quality = 0.8, mimeType = 'image/jpeg' } = options;

  if (!file.type.startsWith('image/')) {
    // Non-image — return as-is via data URL
    const dataUrl = await blobToDataUrl(file);
    return {
      blob: file,
      dataUrl,
      originalSize: file.size,
      compressedSize: file.size,
      width: 0,
      height: 0,
      ratio: 1,
    };
  }

  const img = await readImage(file);
  const ratio = Math.min(1, maxWidthOrHeight / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas blob failed'))),
      mimeType,
      quality
    );
  });

  const dataUrl = await blobToDataUrl(blob);

  return {
    blob,
    dataUrl,
    originalSize: file.size,
    compressedSize: blob.size,
    width: w,
    height: h,
    ratio: blob.size / file.size,
  };
}

/**
 * Format a byte count for display (Arabic-friendly).
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Build a tiny placeholder data URL used for previews while compressing.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return blobToDataUrl(file);
}
