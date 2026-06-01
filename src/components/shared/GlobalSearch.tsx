import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Map, HardHat, Building2, DoorOpen, UserRound, FileText, Receipt, Banknote, Wrench, Users, ShoppingCart, Scale, ChevronLeft } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchResult {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  subtitle?: string;
  status?: string;
  link: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  land: Map, project: HardHat, property: Building2, unit: DoorOpen, tenant: UserRound,
  lease: FileText, invoice: Receipt, receipt: Banknote, maintenance: Wrench, contractor: Users,
  po: ShoppingCart, legal: Scale,
};

const TYPE_LABELS: Record<string, string> = {
  land: 'أرض', project: 'مشروع', property: 'عقار', unit: 'وحدة', tenant: 'مستأجر',
  lease: 'عقد', invoice: 'فاتورة', receipt: 'سند قبض', maintenance: 'صيانة', contractor: 'مقاول',
  po: 'أمر شراء', legal: 'قضية',
};

function safeGet(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function buildIndex(): SearchResult[] {
  const out: SearchResult[] = [];
  for (const l of safeGet('erp_lands')) {
    out.push({ id: l.id, type: 'land', typeLabel: TYPE_LABELS.land, title: l.land_name || l.land_code || l.id, subtitle: l.municipality, status: l.status, link: `/lands/${l.id}` });
  }
  for (const p of safeGet('erp_projects')) {
    out.push({ id: p.id, type: 'project', typeLabel: TYPE_LABELS.project, title: p.project_name || p.project_code || p.id, subtitle: p.municipality, status: p.status, link: `/projects/${p.id}` });
  }
  for (const p of safeGet('erp_properties')) {
    out.push({ id: p.id, type: 'property', typeLabel: TYPE_LABELS.property, title: p.property_name || p.property_code || p.id, subtitle: p.municipality, status: p.status, link: `/properties/${p.id}` });
  }
  for (const u of safeGet('erp_units')) {
    out.push({ id: u.id, type: 'unit', typeLabel: TYPE_LABELS.unit, title: u.unit_code || u.id, subtitle: u.unit_type, status: u.status, link: `/units/${u.id}` });
  }
  for (const t of safeGet('erp_tenants')) {
    out.push({ id: t.id, type: 'tenant', typeLabel: TYPE_LABELS.tenant, title: t.name || t.id, subtitle: t.phone || t.email, status: t.status, link: `/tenants/${t.id}` });
  }
  for (const c of safeGet('erp_contractors')) {
    out.push({ id: c.id, type: 'contractor', typeLabel: TYPE_LABELS.contractor, title: c.name || c.id, subtitle: c.trade, status: c.status, link: `/contractors/${c.id}` });
  }
  for (const l of safeGet('erp_leases')) {
    out.push({ id: l.id, type: 'lease', typeLabel: TYPE_LABELS.lease, title: l.contract_number || l.id, subtitle: l.tenant_name, status: l.status, link: `/leases/${l.id}` });
  }
  for (const i of safeGet('erp_invoices')) {
    out.push({ id: i.id, type: 'invoice', typeLabel: TYPE_LABELS.invoice, title: i.invoice_number || i.id, subtitle: i.tenant_name, status: i.status, link: `/rent-collection/invoices` });
  }
  for (const r of safeGet('erp_maintenance')) {
    out.push({ id: r.id, type: 'maintenance', typeLabel: TYPE_LABELS.maintenance, title: r.request_number || r.id, subtitle: r.title, status: r.status, link: `/maintenance/requests/${r.id}` });
  }
  return out;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [q, setQ] = useState('');
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const index = useMemo(() => (open ? buildIndex() : []), [open]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const term = q.trim().toLowerCase();
    return index
      .filter(r => {
        const hay = `${r.title} ${r.subtitle || ''} ${r.typeLabel} ${r.status || ''}`.toLowerCase();
        return hay.includes(term);
      })
      .slice(0, 30);
  }, [q, index]);

  const grouped = useMemo(() => {
    const m: Array<[string, SearchResult[]]> = [];
    const seen = new Set<string>();
    for (const r of results) {
      if (seen.has(r.type)) continue;
      seen.add(r.type);
      m.push([r.type, results.filter(x => x.type === r.type)]);
    }
    return m;
  }, [results]);

  // Reset state when opened/closed
  useEffect(() => {
    if (open) {
      setQ('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [q]);

  const onSelect = (r: SearchResult) => {
    onClose();
    setTimeout(() => navigate(r.link), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      onSelect(results[activeIdx]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ابحث في الأراضي، المشاريع، العقارات، الوحدات، المستأجرين..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {q.trim() === '' && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>ابدأ بكتابة كلمة للبحث في كل وحدات النظام</p>
              <p className="text-xs mt-1 opacity-70">أو اضغط <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px]">Ctrl+K</kbd> للفتح</p>
            </div>
          )}
          {q.trim() !== '' && results.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              لا توجد نتائج لـ "{q}"
            </div>
          )}
          {grouped.map((entry) => {
            const type = entry[0];
            const items = entry[1];
            const Icon = TYPE_ICONS[type] || FileText;
            return (
              <div key={type} className="py-2">
                <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Icon className="h-3 w-3" />
                  {TYPE_LABELS[type] || type} ({items.length})
                </div>
                {items.map((r) => {
                  const flatIdx = results.indexOf(r);
                  const active = flatIdx === activeIdx;
                  const ItemIcon = TYPE_ICONS[r.type] || FileText;
                  return (
                    <button
                      key={r.id}
                      onClick={() => onSelect(r)}
                      onMouseEnter={() => setActiveIdx(flatIdx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors',
                        active ? 'bg-blue-50' : 'hover:bg-gray-50',
                      )}
                    >
                      <div className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                        active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        <ItemIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                        {r.subtitle && <p className="text-[11px] text-muted-foreground truncate">{r.subtitle}</p>}
                      </div>
                      {r.status && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                          {r.status}
                        </span>
                      )}
                      <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-gray-200">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-white border border-gray-200">↓</kbd> للتنقل</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-gray-200">Enter</kbd> للفتح</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-gray-200">Esc</kbd> للإغلاق</span>
          </div>
          <span>{results.length} نتيجة</span>
        </div>
      </div>
    </div>
  );
}
