import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search, Filter, Eye, Pencil, Trash2, Plus, Star, Phone, Mail, MapPin, Building2, X,
  TrendingUp, TrendingDown, Clock, RotateCcw, Sparkles, Users, Award, AlertTriangle,
  DollarSign, Banknote, CreditCard, ArrowRight, Package,
} from 'lucide-react';

interface Vendor {
  id: string; vendor_code: string; vendor_name: string; vendor_type: string;
  contact_person: string; phone: string; email: string; address: string;
  bank_name: string; iban: string; payment_terms: string; rating: number; status: string;
}

const initialVendors: Vendor[] = [
  { id: 'v1', vendor_code: 'VEN-001', vendor_name: 'شركة مواد البناء المتحدة', vendor_type: 'material_supplier', contact_person: 'أحمد الشمري', phone: '0555123456', email: 'ahmed@unitedbm.com', address: 'الرياض - حي الصناعية', bank_name: 'البنك الأهلي', iban: 'SA0380000000608010167519', payment_terms: 'صافي 30 يوم', rating: 4, status: 'active' },
  { id: 'v2', vendor_code: 'VEN-002', vendor_name: 'مؤسسة الخليج للمقاولات', vendor_type: 'service_provider', contact_person: 'خالد الدوسري', phone: '0566789012', email: 'khalid@gulfcont.com', address: 'جدة - شارع الملك عبدالعزيز', bank_name: 'مصرف الراجحي', iban: 'SA6080000160608010167519', payment_terms: '50% دفعة مقدمة', rating: 5, status: 'active' },
  { id: 'v3', vendor_code: 'VEN-003', vendor_name: 'مكتب المهندسون العرب', vendor_type: 'consultant', contact_person: 'م. سامي الحربي', phone: '0501234567', email: 'sami@arab-eng.com', address: 'الدمام - طريق الملك فهد', bank_name: 'بنك الرياض', iban: 'SA2080000360608010167519', payment_terms: 'صافي 45 يوم', rating: 4, status: 'active' },
  { id: 'v4', vendor_code: 'VEN-004', vendor_name: 'مؤسسة العمران للتكييف', vendor_type: 'maintenance_provider', contact_person: 'فهد العمران', phone: '0539876543', email: 'fahd@omran-hvac.com', address: 'الرياض - حي المروج', bank_name: 'البنك السعودي الفرنسي', iban: 'SA3580000120608010167519', payment_terms: 'صافي 30 يوم', rating: 3, status: 'active' },
  { id: 'v5', vendor_code: 'VEN-005', vendor_name: 'شركة الكهرباء السعودية', vendor_type: 'utility_provider', contact_person: 'خدمة العملاء', phone: '920000222', email: 'cs@se.com.sa', address: 'الرياض - طريق الملك سلمان', bank_name: 'البنك الأهلي', iban: 'SA4480000450608010167519', payment_terms: 'فاتورة شهرية', rating: 4, status: 'active' },
  { id: 'v6', vendor_code: 'VEN-006', vendor_name: 'شركة المياه الوطنية', vendor_type: 'utility_provider', contact_person: 'خدمة العملاء', phone: '920001744', email: 'cs@nwc.com.sa', address: 'الرياض - حي النخيل', bank_name: 'مصرف الراجحي', iban: 'SA5580000550608010167519', payment_terms: 'فاتورة شهرية', rating: 3, status: 'active' },
  { id: 'v7', vendor_code: 'VEN-007', vendor_name: 'مصنع الرياض للحديد', vendor_type: 'material_supplier', contact_person: 'نايف السبيعي', phone: '0543217890', email: 'naif@riyadhsteel.com', address: 'الرياض - المدينة الصناعية الثانية', bank_name: 'البنك العربي الوطني', iban: 'SA1080000660608010167519', payment_terms: 'صافي 60 يوم', rating: 4, status: 'inactive' },
  { id: 'v8', vendor_code: 'VEN-008', vendor_name: 'شركة الأمان للحراسة', vendor_type: 'other', contact_person: 'تركي المطيري', phone: '0512345678', email: 'turki@amansec.com', address: 'الدمام - حي الفيصلية', bank_name: 'مصرف الإنماء', iban: 'SA4180000770608010167519', payment_terms: 'صافي 15 يوم', rating: 5, status: 'active' },
];

const vendorTypeLabels: Record<string, string> = {
  material_supplier: 'مورد مواد', service_provider: 'مقدم خدمات', consultant: 'استشاري',
  maintenance_provider: 'مزود صيانة', utility_provider: 'مزود خدمات عامة', other: 'أخرى',
};

const vendorTypeConfig: Record<string, { dot: string; chip: string }> = {
  material_supplier:    { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  service_provider:     { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  consultant:           { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  maintenance_provider: { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  utility_provider:     { dot: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' },
  other:                { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    cyan:   { iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    violet: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  };
  const a = accentMap[accent] || accentMap.slate;
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${a.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {trend.dir === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend.val)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Vendor Card ── */
function VendorCard({ v, onDelete, onView, onEdit }: {
  v: Vendor; onDelete: (v: Vendor) => void; onView: (v: Vendor) => void; onEdit: (v: Vendor) => void;
}) {
  const typeCfg = vendorTypeConfig[v.vendor_type] || vendorTypeConfig.other;
  const isActive = v.status === 'active';
  const stars = Math.round(v.rating || 0);

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${isActive ? 'bg-cyan-500' : 'bg-gray-300'}`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{v.vendor_name}</div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{v.vendor_code}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${typeCfg.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${typeCfg.dot}`} />
            {vendorTypeLabels[v.vendor_type] || v.vendor_type}
          </span>
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${
            isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {isActive ? 'نشط' : 'غير نشط'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><Users className="h-3 w-3 text-gray-400" />{v.contact_person}</span>
        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-gray-400" />{v.phone}</span>
        <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-gray-400" />{v.email}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">التقييم</div>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`h-3.5 w-3.5 ${i <= stars ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
            ))}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">شروط الدفع</div>
          <div className="text-xs font-bold text-gray-800 truncate">{v.payment_terms}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => onView(v)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onEdit(v)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(v)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Vendor List Row ── */
function VendorListRow({ v, onDelete, onView, onEdit }: {
  v: Vendor; onDelete: (v: Vendor) => void; onView: (v: Vendor) => void; onEdit: (v: Vendor) => void;
}) {
  const typeCfg = vendorTypeConfig[v.vendor_type] || vendorTypeConfig.other;
  const isActive = v.status === 'active';
  const stars = Math.round(v.rating || 0);

  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm">
      <div className="h-10 w-10 rounded-lg bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100 flex items-center justify-center shrink-0">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{v.vendor_name}</div>
          <div className="text-[11px] text-gray-400 font-mono">{v.vendor_code}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 h-6 px-2 rounded text-[10px] font-bold ${typeCfg.chip}`}>
            <span className={`h-1 w-1 rounded-full ${typeCfg.dot}`} />
            {vendorTypeLabels[v.vendor_type] || v.vendor_type}
          </span>
        </div>
        <div className="text-xs text-gray-600 truncate">{v.contact_person}</div>
        <div className="text-xs text-gray-600 ltr-only" dir="ltr">{v.phone}</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`h-3 w-3 ${i <= stars ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
            ))}
          </div>
          <span className={`inline-flex items-center gap-1 h-6 px-2 rounded text-[10px] font-bold ${
            isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'
          }`}>
            <span className={`h-1 w-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {isActive ? 'نشط' : 'غير نشط'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => onView(v)} className="h-8 w-8 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-4 w-4" /></button>
        <button onClick={() => onEdit(v)} className="h-8 w-8 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => onDelete(v)} className="h-8 w-8 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyVendors({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <Building2 className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا يوجد موردون</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1">
        <RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ProcurementVendorsPage() {
  const { t, dir } = useLocale();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [form, setForm] = useState<Partial<Vendor>>({
    vendor_code: '', vendor_name: '', vendor_type: 'material_supplier',
    contact_person: '', phone: '', email: '', address: '',
    bank_name: '', iban: '', payment_terms: 'صافي 30 يوم', rating: 3, status: 'active',
  });

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (typeFilter !== 'all' && v.vendor_type !== typeFilter) return false;
      if (search && !v.vendor_name.includes(search) && !v.vendor_code.includes(search) && !v.contact_person.includes(search)) return false;
      return true;
    });
  }, [vendors, search, typeFilter]);

  const activeCount = vendors.filter(v => v.status === 'active').length;
  const avgRating = Math.round((vendors.reduce((s, v) => s + v.rating, 0) / Math.max(1, vendors.length)) * 10) / 10;
  const materialSuppliers = vendors.filter(v => v.vendor_type === 'material_supplier').length;

  const openCreate = () => {
    setEditingId(null);
    setForm({
      vendor_code: `VEN-${String(vendors.length + 1).padStart(3, '0')}`,
      vendor_name: '', vendor_type: 'material_supplier',
      contact_person: '', phone: '', email: '', address: '',
      bank_name: '', iban: '', payment_terms: 'صافي 30 يوم', rating: 3, status: 'active',
    });
    setShowModal(true);
  };

  const openEdit = (v: Vendor) => {
    setEditingId(v.id);
    setForm({ ...v });
    setShowModal(true);
  };

  const saveVendor = () => {
    if (!form.vendor_name || !form.vendor_code) return;
    if (editingId) {
      setVendors((prev) => prev.map((v) => (v.id === editingId ? { ...v, ...form } as Vendor : v)));
      toast.success('تم تعديل المورد بنجاح');
    } else {
      setVendors((prev) => [...prev, { id: Date.now().toString(36), ...form } as Vendor]);
      toast.success('تم إضافة المورد بنجاح');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setVendors((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    toast.success(`تم حذف المورد ${deleteTarget.vendor_name} بنجاح`);
    setDeleteTarget(null);
  };

  const resetFilters = () => { setSearch(''); setTypeFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-600">الموردون</span>
              <span className="text-[13px] font-bold text-gray-900">{vendors.length} مورد</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block" />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في الموردين..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>موردو مواد:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{materialSuppliers}</span>
          </div>

          <div className="me-auto" />

          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: Users },
              { key: 'grid', label: 'بطاقات', icon: Sparkles },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}>
                <v.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          <Button onClick={openCreate}
            className="h-8 px-3 gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>إضافة مورد</span>
          </Button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الموردين" value={vendors.length} sub={`${filtered.length} معروض`} icon={Building2} accent="slate" />
          <KpiCard label="نشطون" value={activeCount} sub={`${vendors.length - activeCount} غير نشط`} icon={Award} trend={{ val: Math.round((activeCount / Math.max(1, vendors.length)) * 100), dir: 'up' }} accent="emerald" />
          <KpiCard label="موردو مواد" value={materialSuppliers} sub="أكبر فئة" icon={Package} accent="cyan" />
          <KpiCard label="متوسط التقييم" value={avgRating} sub="من 5 نجوم" icon={Star} accent="amber" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">الموردون</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}
                className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                <RotateCcw className="h-3.5 w-3.5" /> إعادة
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(vendorTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyVendors onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(v => (
              <VendorCard key={v.id} v={v} onDelete={setDeleteTarget} onView={setViewVendor} onEdit={openEdit} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(v => (
              <VendorListRow key={v.id} v={v} onDelete={setDeleteTarget} onView={setViewVendor} onEdit={openEdit} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {vendors.length} مورد</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            مفلتر محلياً
          </span>
        </div>
      </div>

      {/* ── Delete Dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3>
                <p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف المورد <strong className="text-gray-900">{deleteTarget.vendor_name}</strong> ({deleteTarget.vendor_code})؟</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Detail Dialog ── */}
      <Dialog open={!!viewVendor} onOpenChange={() => setViewVendor(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader><DialogTitle>تفاصيل المورد — {viewVendor?.vendor_code}</DialogTitle></DialogHeader>
          {viewVendor && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">الاسم: </span><span className="font-medium">{viewVendor.vendor_name}</span></div>
              <div><span className="text-gray-500">النوع: </span><span className="font-medium">{vendorTypeLabels[viewVendor.vendor_type] || viewVendor.vendor_type}</span></div>
              <div><span className="text-gray-500">جهة الاتصال: </span><span className="font-medium">{viewVendor.contact_person}</span></div>
              <div><span className="text-gray-500">الهاتف: </span><span className="font-medium" dir="ltr">{viewVendor.phone}</span></div>
              <div className="col-span-2"><span className="text-gray-500">البريد: </span><span className="font-medium">{viewVendor.email}</span></div>
              <div className="col-span-2"><span className="text-gray-500">العنوان: </span><span className="font-medium">{viewVendor.address}</span></div>
              <div><span className="text-gray-500">البنك: </span><span className="font-medium">{viewVendor.bank_name}</span></div>
              <div><span className="text-gray-500">الآيبان: </span><span className="font-medium font-mono text-xs" dir="ltr">{viewVendor.iban}</span></div>
              <div><span className="text-gray-500">شروط الدفع: </span><span className="font-medium">{viewVendor.payment_terms}</span></div>
              <div>
                <span className="text-gray-500">التقييم: </span>
                <span className="inline-flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`h-4 w-4 ${i <= Math.round(viewVendor.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </span>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewVendor(null)}>إغلاق</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create/Edit Modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editingId ? 'تعديل مورد' : 'إضافة مورد جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>كود المورد</Label><Input value={form.vendor_code} onChange={(e) => setForm({ ...form, vendor_code: e.target.value })} /></div>
            <div><Label>اسم المورد *</Label><Input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} /></div>
            <div><Label>نوع المورد</Label><Select value={form.vendor_type} onValueChange={(v) => setForm({ ...form, vendor_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(vendorTypeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>التقييم</Label><Select value={String(form.rating)} onValueChange={(v) => setForm({ ...form, rating: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map((r) => (<SelectItem key={r} value={String(r)}>{r}/5</SelectItem>))}</SelectContent></Select></div>
            <div><Label>جهة الاتصال</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
            <div><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" /></div>
            <div className="col-span-2"><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" /></div>
            <div className="col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>البنك</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
            <div><Label>الآيبان</Label><Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} dir="ltr" /></div>
            <div><Label>شروط الدفع</Label><Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} /></div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="inactive">غير نشط</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button onClick={saveVendor}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}