#!/usr/bin/env python3
"""Fix module-level Arabic strings that lost their quotes during revert."""
import re
import os

ROOT = r"C:\Users\khamis\Documents\land2"
FILES = [
    "src/pages/queues/ApprovalsQueuePage.tsx",
    "src/pages/queues/CollectionQueuePage.tsx",
    "src/pages/queues/MaintenanceQueuePage.tsx",
    "src/pages/queues/ProcurementQueuePage.tsx",
    "src/pages/wizards/PaymentWizardPage.tsx",
    "src/pages/wizards/ProjectWizardPage.tsx",
]

ARABIC = re.compile(r'[\u0600-\u06ff]')

def process_file(filepath):
    fullpath = os.path.join(ROOT, filepath)
    if not os.path.exists(fullpath):
        return f"SKIP: {filepath}"
    
    with open(fullpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix: { label: ArabicText, ... } -> { label: 'ArabicText', ... }
    # This happened when tt('key', 'Arabic') was reverted to just ArabicText without quotes.
    # The pattern in JS objects is: propName: ArabicText with comma/brace after
    # We also need to handle: label: ArabicText,  /  label: ArabicText }
    
    # Find Arabic strings that are bare (no quotes) in object context: : Arabic\n
    # Pattern: after a colon and whitespace, Arabic text that ends with comma or brace
    
    def fix_bare_string(m):
        full = m.group(0)
        # If already quoted, skip
        if full.startswith("'") or full.startswith('"'):
            return full
        return f"'{full}'"
    
    # pattern for: : arabicText,  or  : arabicText }
    # Also: : arabicText\n
    pat = re.compile(r':\s*([\u0600-\u06ff][^,\n}]*)\s*[,}]')
    
    def replacer(m):
        text = m.group(1).rstrip()
        suffix = m.group(0)[len(m.group(0)) - len(m.group(0).lstrip(text)):]
        # Just the text portion
        actual_suffix = m.group(0)[m.start(1) - m.start() + len(text):]
        if not text.startswith("'") and not text.startswith('"'):
            quoted = f"'{text}'"
        else:
            quoted = text
        return f': {quoted}{actual_suffix}'
    
    content = pat.sub(replacer, content)
    
    # Also fix any remaining bare Arabic in object values
    # This catches patterns like:  label: 60+ يوم (قانوني),
    # That contain digits which our regex above might miss
    
    # Pattern: bare arabic text between :  and },
    # We'll find sequences of Arabic + digits + punctuation that look like label values
    
    pat2 = re.compile(r'(\w+):\s*([\u0600-\u06ff\d\s\+\-\(\)]+)\s*[,}]')
    
    def replacer2(m):
        key = m.group(1)
        val = m.group(2).rstrip()
        suffix = m.group(0)[len(f'{key}: ') + len(val):]
        if val and ARABIC.search(val):
            if not val.startswith("'") and not val.startswith('"'):
                return f'{key}: \'{val}\'{suffix}'
        return m.group(0)
    
    content = pat2.sub(replacer2, content)
    
    if content != original:
        with open(fullpath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"DONE: {filepath}"
    else:
        return f"CLEAN: {filepath}"

def main():
    for fp in FILES:
        r = process_file(fp)
        print(f"  {r}")

if __name__ == '__main__':
    main()
