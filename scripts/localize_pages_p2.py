#!/usr/bin/env python3
"""
Second pass: Replace Arabic strings inside JavaScript object literals (label/title/desc/sublabel/etc.)
and other patterns missed by the first pass.
"""
import re
import os
import hashlib

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

def has_arabic(s):
    return bool(ARABIC.search(s))

def make_key(text):
    h = hashlib.md5(text.encode('utf-8')).hexdigest()[:6]
    return f"k{h}"

# Property names that commonly hold Arabic UI text in JS objects
UI_PROPS = ['title', 'label', 'desc', 'description', 'subtitle', 'sublabel', 'name']

def process_file(filepath):
    fullpath = os.path.join(ROOT, filepath)
    if not os.path.exists(fullpath):
        return f"SKIP: {filepath}"
    
    with open(fullpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # --- Pattern 1: Object literal props with Arabic ---
    # Match:  propName: 'Arabic text',  or  propName: "Arabic text",
    for prop in UI_PROPS:
        # Single-quoted
        pat = re.compile(rf"({prop}):\s*'([^']*[\u0600-\u06ff][^']*)'")
        
        def make_obj_repl(m, p=prop):
            text = m.group(2)
            if not has_arabic(text):
                return m.group(0)
            key = make_key(text)
            return f"{p}: tt('{key}', '{text}')"
        
        content = pat.sub(make_obj_repl, content)
    
    # --- Pattern 2: SelectItem children with Arabic ---
    # <SelectItem value="x">Arabic</SelectItem>
    pat = re.compile(r'(<SelectItem[^>]*>)([^<]*[\u0600-\u06ff][^<]*)(</SelectItem>)')
    
    def make_sel_repl(m):
        prefix = m.group(1)
        text = m.group(2)
        suffix = m.group(3)
        trimmed = text.strip()
        if not trimmed or not has_arabic(trimmed):
            return m.group(0)
        # Preserve whitespace
        lead = text[:len(text) - len(text.lstrip())]
        trail = text[len(text.rstrip()):]
        key = make_key(trimmed)
        return f'{prefix}{lead}{{tt(\'{key}\', \'{trimmed}\')}}{trail}{suffix}'
    
    content = pat.sub(make_sel_repl, content)
    
    # --- Pattern 3: Validation error messages ---
    #   validate: () => 'Arabic message'
    #   or just 'Arabic message' in validation context
    pat = re.compile(r"(validate:\s*\(\)\s*=>\s*)'([^']*[\u0600-\u06ff][^']*)'")
    
    def make_val_repl(m):
        prefix = m.group(1)
        text = m.group(2)
        key = make_key(text)
        return f"{prefix}tt('{key}', '{text}')"
    
    content = pat.sub(make_val_repl, content)
    
    # --- Pattern 4: Toast messages ---
    # toast.success('Arabic'), toast.error('Arabic')
    pat = re.compile(r"(toast\.(?:success|error|info|warning)\()'([^']*[\u0600-\u06ff][^']*)'")
    
    def make_toast_repl(m):
        prefix = m.group(1)
        text = m.group(2)
        key = make_key(text)
        return f"{prefix}tt('{key}', '{text}')"
    
    content = pat.sub(make_toast_repl, content)
    
    # Check if anything changed
    if content != original:
        with open(fullpath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"DONE: {filepath}"
    else:
        return f"CLEAN: {filepath}"

def main():
    total = 0
    for fp in FILES:
        r = process_file(fp)
        print(f"  {r}")
        if r.startswith('DONE'):
            total += 1
    print(f"\nDone: {total}/{len(FILES)} files modified in second pass")

if __name__ == '__main__':
    main()
