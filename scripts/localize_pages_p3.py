#!/usr/bin/env python3
"""
Third pass (fixed): Revert module-scope tt() calls back to plain strings,
and catch remaining bare Arabic in JSX.
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

ARABIC_RE = re.compile(r'[\u0600-\u06ff\u0750-\u077f]')

def has_arabic(s):
    return bool(ARABIC_RE.search(s))

def make_key(text):
    h = hashlib.md5(text.encode('utf-8')).hexdigest()[:6]
    return f"k{h}"

def process_file(filepath):
    fullpath = os.path.join(ROOT, filepath)
    if not os.path.exists(fullpath):
        return f"SKIP: {filepath}"
    
    with open(fullpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # --- FIX 1: Revert module-scope tt() calls ---
    func_pos = content.find('export default function')
    if func_pos > 0:
        pre = content[:func_pos]
        post = content[func_pos:]
        
        # Find tt('xxx', 'Arabic') and replace with just the Arabic fallback
        # Use a non-greedy approach
        def revert(m):
            # m.group(0) is the full match like: tt('k123456', 'Arabic text')
            # Extract the second single-quoted string (the fallback)
            s = m.group(0)
            # Find the last ' in tt('key',  followed by ', ' and the fallback
            idx = s.find("', '")
            if idx > 0:
                fallback = s[idx+4:-2]  # strip ", ' and ')
                return fallback
            return s
        
        pre = re.sub(r"tt\('k[a-f0-9]+', '[^']+'\)", revert, pre)
        content = pre + post
    
    # --- FIX 2: Catch remaining bare Arabic in JSX text nodes ---
    lines = content.split('\n')
    new_lines = []
    
    for line in lines:
        s = line.strip()
        if not s or not ('<' in s and '>' in s):
            new_lines.append(line)
            continue
        
        # Find >non-brace-Arabic<  in JSX
        def replace(m):
            inner = m.group(1)
            if not has_arabic(inner):
                return m.group(0)
            trimmed = inner.strip()
            if not trimmed or len(trimmed) < 2:
                return m.group(0)
            # Already wrapped?
            if trimmed.startswith('{tt('):
                return m.group(0)
            # Inside attribute already?
            pos_in_line = m.start()
            before = line[:pos_in_line+1]
            if before.rstrip().endswith('='):
                return m.group(0)
            
            lead = inner[:len(inner) - len(inner.lstrip())]
            trail = inner[len(inner.rstrip()):]
            key = make_key(trimmed)
            return f'>{lead}{{tt(\'{key}\', \'{trimmed}\')}}{trail}<'
        
        line = re.sub(r'>([^<{]*[\u0600-\u06ff][^<{]*)<', replace, line)
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    # --- FIX 3: Any remaining bare attribute strings with Arabic ---
    attrs = ['title', 'label', 'description', 'placeholder', 'subtitle', 'sublabel', 'desc', 'completeLabel']
    for attr in attrs:
        # Match attr="Arabic text"
        pat = re.compile(rf'({attr})="([^"]*[\u0600-\u06ff][^"]*)"')
        def repl(m, a=attr):
            text = m.group(2)
            if '{' in text:
                return m.group(0)
            key = make_key(text)
            return f'{a}={{tt(\'{key}\', \'{text}\')}}'
        content = pat.sub(repl, content)
    
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
        if r.startswith('DONE'):
            total += 1
        print(f"  {r}")
    print(f"\nPass 3: {total}/{len(FILES)} files modified")

if __name__ == '__main__':
    main()
