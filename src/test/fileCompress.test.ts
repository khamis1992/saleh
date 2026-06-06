// File compression utility tests
// Verifies formatBytes + the non-image passthrough path of compressImage.
// Full image compression is exercised manually in PhotoUpload/FileUpload.
import { describe, it, expect } from 'vitest';
import { formatBytes, compressImage } from '@/utils/fileCompress';

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats KB', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats MB', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });
});

describe('compressImage', () => {
  it('passes through non-image files unchanged', async () => {
    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    const result = await compressImage(file);
    expect(result.originalSize).toBe(file.size);
    expect(result.compressedSize).toBe(file.size);
    expect(result.ratio).toBe(1);
    expect(result.dataUrl.startsWith('data:text/plain')).toBe(true);
  });
});
