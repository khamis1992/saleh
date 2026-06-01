import { PDFDocument } from 'pdf-lib';

/**
 * Merge multiple PDF files into one
 * @param pdfs Array of PDF file data (as ArrayBuffer or Uint8Array)
 * @returns Merged PDF as Uint8Array
 */
export async function mergePDFs(pdfs: (ArrayBuffer | Uint8Array)[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();

  for (const pdfData of pdfs) {
    const doc = await PDFDocument.load(pdfData);
    const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
    pages.forEach(page => mergedDoc.addPage(page));
  }

  return mergedDoc.save();
}

/**
 * Extract pages from a PDF
 */
export async function extractPDFPages(pdfData: ArrayBuffer | Uint8Array, pageNumbers: number[]): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(pdfData);
  const newDoc = await PDFDocument.create();

  for (const pageNum of pageNumbers) {
    if (pageNum > 0 && pageNum <= sourceDoc.getPageCount()) {
      const [page] = await newDoc.copyPages(sourceDoc, [pageNum - 1]);
      newDoc.addPage(page);
    }
  }

  return newDoc.save();
}

/**
 * Add metadata to a PDF
 */
export async function addPDFMetadata(
  pdfData: ArrayBuffer | Uint8Array,
  metadata: { title?: string; author?: string; subject?: string; keywords?: string[] }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfData);
  if (metadata.title) doc.setTitle(metadata.title);
  if (metadata.author) doc.setAuthor(metadata.author);
  if (metadata.subject) doc.setSubject(metadata.subject);
  if (metadata.keywords) doc.setKeywords(metadata.keywords);
  return doc.save();
}

/**
 * Convert Uint8Array to Blob for download
 */
export function pdfToBlob(data: Uint8Array): Blob {
  return new Blob([data as BlobPart], { type: 'application/pdf' });
}

/**
 * Download a PDF from binary data
 */
export function downloadPDFBlob(data: Uint8Array, filename: string) {
  const blob = pdfToBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
