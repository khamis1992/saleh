// Translation audit script — finds hardcoded Arabic strings in pages that should use the t() function
// Usage: node scripts/audit-translations.mjs
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src/pages');
const ARABIC_RE = /[\u0600-\u06FF]/g;

let totalPages = 0;
let pagesWithHardcoded = 0;
const report = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      audit(full);
    }
  }
}

function audit(file) {
  totalPages++;
  const src = fs.readFileSync(file, 'utf-8');
  // Skip if file is tiny
  if (src.length < 500) return;
  // Skip if doesn't use useLocale at all (might be pure data display)
  const usesLocale = src.includes('useLocale');
  // Find lines with Arabic chars in JSX strings (between > and <)
  const lines = src.split('\n');
  const issues = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for hardcoded Arabic in JSX (not in comment, not in import)
    if (line.match(/>\s*[^<{]*[\u0600-\u06FF]/)) {
      const matches = line.match(ARABIC_RE);
      if (matches && matches.length >= 2) {
        issues.push({ line: i + 1, text: line.trim().slice(0, 100) });
      }
    }
  }
  if (issues.length > 0) {
    pagesWithHardcoded++;
    report.push({
      file: path.relative('.', file).replace(/\\/g, '/'),
      usesLocale,
      issueCount: issues.length,
      sample: issues.slice(0, 3),
    });
  }
}

walk(ROOT);
console.log(`\n=== Translation Audit ===\n`);
console.log(`Total pages:        ${totalPages}`);
console.log(`Pages with hardcoded Arabic strings: ${pagesWithHardcoded}`);
console.log(`Pages using useLocale(): ${report.filter(r => r.usesLocale).length}/${report.length}\n`);

if (report.length > 0) {
  console.log('Top offenders (sorted by issue count):');
  report
    .sort((a, b) => b.issueCount - a.issueCount)
    .slice(0, 20)
    .forEach(r => {
      console.log(`\n  ${r.file}`);
      console.log(`    ${r.issueCount} hardcoded strings${r.usesLocale ? '' : ' ⚠️  does NOT use useLocale'}`);
      r.sample.forEach(s => console.log(`    line ${s.line}: ${s.text}`));
    });
  console.log(`\n... and ${Math.max(0, report.length - 20)} more files`);
}
