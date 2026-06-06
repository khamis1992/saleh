#!/usr/bin/env python3
"""
Conservative localization transformer for center/queue/wizard pages.
Only replaces: dir="rtl", attribute strings (title/label/description/placeholder etc.),
standalone JSX text nodes, and adds import + destructure.
"""
import re
import os

ROOT = r"C:\Users\khamis\Documents\land2"
FILES = [
    "src/pages/centers/ExecutiveCenterPage.tsx",
    "src/pages/centers/ConstructionCenterPage.tsx",
    "src/pages/centers/PropertyCenterPage.tsx",
    "src/pages/centers/FinanceCenterPage.tsx",
    "src/pages/centers/MaintenanceCenterPage.tsx",
    "src/pages/centers/ProcurementCenterPage.tsx",
    "src/pages/queues/ApprovalsQueuePage.tsx",
    "src/pages/queues/CollectionQueuePage.tsx",
    "src/pages/queues/ConstructionQueuePage.tsx",
    "src/pages/queues/MaintenanceQueuePage.tsx",
    "src/pages/queues/ProcurementQueuePage.tsx",
    "src/pages/wizards/ClaimWizardPage.tsx",
    "src/pages/wizards/ConversionWizardPage.tsx",
    "src/pages/wizards/LeaseWizardPage.tsx",
    "src/pages/wizards/MaintenanceWizardPage.tsx",
    "src/pages/wizards/PaymentWizardPage.tsx",
    "src/pages/wizards/ProjectWizardPage.tsx",
]

ARABIC = re.compile(r'[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\uFB50-\uFDFF\uFE70-\uFEFF]')

# Attribute names that contain UI text
ATTRS = ['title', 'label', 'description', 'placeholder', 'subtitle', 'sublabel',
         'desc', 'completeLabel', 'headerTitle', 'headerDescription', 'name']

# Strings that are NOT UI text (data keys, class names, etc.)
SKIP_CONTEXTS = [
    'localStorage.', 'navigate(', 'erp_', 'className', "key:", "type:",
    "bucket:", "color:", "value:", "status:", "bg-", "text-",
    "console.", "toast.", ".create(", '.getItem(', '.setItem(',
    'JSON.parse', 'JSON.stringify', 'import ', 'from ',
    'const ', 'let ', 'var ', 'function ', '=>', 'useLocale',
    'CATEGORY_LABELS',
]

def has_arabic(s):
    return bool(ARABIC.search(s))

def make_key(text):
    import hashlib
    h = hashlib.md5(text.encode('utf-8')).hexdigest()[:6]
    return f"k{h}"

def process_file(filepath):
    fullpath = os.path.join(ROOT, filepath)
    if not os.path.exists(fullpath):
        return f"SKIP: {filepath}"
    
    with open(fullpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # --- 1. Add import ---
    if "import { useLocale } from '@/providers/LocaleContext'" not in content:
        lines = content.split('\n')
        last_import = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import = i
        if last_import >= 0:
            lines.insert(last_import + 1, "import { useLocale } from '@/providers/LocaleContext';")
            content = '\n'.join(lines)
    
    # --- 2. Add destructure ---
    if 'const { t, tt, dir } = useLocale()' not in content:
        m = re.search(r'(export default function \w+\(\)\s*\{)', content)
        if m:
            pos = m.end()
            content = content[:pos] + "\n  const { t, tt, dir } = useLocale();" + content[pos:]
    
    # --- 3. Replace dir="rtl" ---
    content = content.replace('dir="rtl"', 'dir={dir}')
    
    # --- 4. Replace attribute strings ---
    for attr in ATTRS:
        pat = re.compile(rf'({attr})="([^"]*)"')
        
        def repl(m, a=attr):
            text = m.group(2)
            if not has_arabic(text):
                return m.group(0)
            # Check if already in braces
            pos = m.start()
            before = content[:pos]
            # Look back to see if this is already inside {tt( ... )}
            if before.rstrip().endswith('{tt('):
                return m.group(0)
            key = make_key(text)
            return f'{a}={{tt(\'{key}\', \'{text}\')}}'
        
        content = pat.sub(repl, content)
    
    # --- 5. Replace standalone Arabic text nodes ---
    # Pattern: >Arabic text<  (text between JSX tags)
    # We need to be very careful here. Only replace leaf-level text nodes.
    
    def should_skip_text(tag_name, full_text):
        """Skip if this looks like data/config rather than UI text."""
        if any(c in full_text for c in SKIP_CONTEXTS):
            return True
        return False
    
    # Find all: >text< or > text <  where text contains Arabic
    text_pat = re.compile(r'>([^<{]*[\u0600-\u06ff][^<{]*)<')
    
    lines = content.split('\n')
    new_lines = []
    skip_next = 0
    
    for i, line in enumerate(lines):
        if skip_next > 0:
            skip_next -= 1
            new_lines.append(line)
            continue
        
        # Skip lines that are clearly data/setup, not JSX UI
        stripped = line.strip()
        if not stripped:
            new_lines.append(line)
            continue
        
        # Skip import lines, console, toast, localStorage, etc.
        if any(p in stripped for p in ['import ', 'console.', 'toast.', 'localStorage.', 'const ', 'let ', 'function ', '=>', 'JSON.']):
            new_lines.append(line)
            continue
        
        # Process text nodes within the line
        def replace_text_in_line(m):
            inner = m.group(1)
            if not has_arabic(inner):
                return m.group(0)
            trimmed = inner.strip()
            if not trimmed or len(trimmed) < 2:
                return m.group(0)
            
            # Determine padding
            lead = inner[:len(inner) - len(inner.lstrip())]
            trail = inner[len(inner.rstrip()):]
            
            key = make_key(trimmed)
            return f'>{lead}{{tt(\'{key}\', \'{trimmed}\')}}{trail}<'
        
        new_line = text_pat.sub(replace_text_in_line, line)
        new_lines.append(new_line)
    
    content = '\n'.join(new_lines)
    
    # Write
    if content != original:
        with open(fullpath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"DONE: {filepath}"
    else:
        return f"SKIP: {filepath} (no changes)"

def main():
    total = 0
    for fp in FILES:
        r = process_file(fp)
        print(f"  {r}")
        if r.startswith('DONE'):
            total += 1
    print(f"\nDone: {total}/{len(FILES)} files modified")

if __name__ == '__main__':
    main()
