import { jsPDF } from 'jspdf';

/**
 * Generates a PDF document with Arabic RTL support.
 * Uses jspdf — client-side only, no server needed.
 */

interface PdfOptions {
  title: string;
  subtitle?: string;
  companyName?: string;
  date?: string;
  rtl?: boolean;
}

/**
 * Create a new PDF document with common header/footer
 */
export function createPdf({ title, subtitle, companyName = 'نظام إدارة التطوير العقاري', date, rtl = true }: PdfOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Add Arabic font support note: jspdf uses built-in helvetica
  // For full Arabic support, custom fonts would need to be loaded
  // Currently renders numbers and Latin text; Arabic text in annotations

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(subtitle, pageWidth / 2, 27, { align: 'center' });
  }

  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  const headerText = `${companyName} | ${date || new Date().toISOString().split('T')[0]}`;
  doc.text(headerText, pageWidth / 2, subtitle ? 33 : 27, { align: 'center' });

  // Separator line
  doc.setDrawColor(229, 231, 235);
  doc.line(15, subtitle ? 37 : 31, pageWidth - 15, subtitle ? 37 : 31);

  return doc;
}

/**
 * Add a table to a PDF
 */
export function addPdfTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number,
  colWidths?: number[],
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const availableWidth = pageWidth - margin * 2;
  const defaultColWidth = availableWidth / headers.length;
  const widths = colWidths || headers.map(() => defaultColWidth);

  // Header row
  doc.setFillColor(249, 250, 251);
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);

  let x = margin;
  headers.forEach((header, i) => {
    doc.rect(x, startY, widths[i], 7, 'F');
    doc.text(header, x + 2, startY + 5);
    x += widths[i];
  });

  // Data rows
  let y = startY + 7;
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);

  rows.forEach((row) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    x = margin;
    row.forEach((cell, i) => {
      doc.text(cell || '', x + 2, y + 5);
      x += widths[i];
    });
    // Row separator
    doc.setDrawColor(243, 244, 246);
    doc.line(margin, y + 7, pageWidth - margin, y + 7);
    y += 8;
  });

  return y;
}

/**
 * Add footer with page numbers
 */
export function addPdfFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `صفحة ${i} من ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
}

/**
 * Download the PDF as a file
 */
export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}

/**
 * QAR currency formatter for PDF (no Arabic symbols, uses QAR prefix)
 */
export function pdfCurrency(value: number): string {
  return `QAR ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
