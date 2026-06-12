import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, Eye, Pencil, Trash2, Plus, Receipt, X, Zap, TrendingUp,
  TrendingDown, RotateCcw, Sparkles, Users, AlertTriangle, DollarSign,
  CalendarDays, CreditCard, ArrowRight, Activity, Clock, CheckCircle2,
  Ban, FileText,
} from 'lucide-react';
import { invoiceStore, tenantStore, unitStore, rentScheduleStore } from '@/services/stores';
import type { RentalInvoice, RentSchedule } from '@/types';

const fmt = formatQAR;
const fmtInt = formatQARInt;

const invoiceStatusConfig: Record<string, { dot: string; chip: string }> = {
  paid:            { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  partially_paid:  { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  issued:          { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  overdue:         { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  draft:           { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  cancelled:       { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};

function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    teal:   { iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
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
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
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

function InvoiceCard({ inv, onDelete, getTenantName, getUnitNumber }: {
  inv: RentalInvoice; onDelete: (i: RentalInvoice) => void;
  getTenantName: (id: string) => string; getUnitNumber: (id: string) => string;
}) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const statCfg = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
  const isOverdue = inv.status === 'overdue';
  const isPaid = inv.status === 'paid';

  return (
    <div onClick={() => navigate(`/rent-collection/invoices/${inv.id}`)}
      className="group relative bg-white rounded-xl border border-gray-100 p-5 cursor-pointer transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${isOverdue ? 'bg-rose-500' : isPaid ? 'bg-emerald-500' : 'bg-teal-500'}`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100 flex items-center justify-center shrink-0">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{inv.invoice_number}</div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">{getTenantName(inv.tenant_id)}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${statCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statCfg.dot}`} />
          {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partially_paid' ? 'مدفوعة جزئياً' : inv.status === 'issued' ? 'مصدرة' : inv.status === 'overdue' ? 'متأخرة' : inv.status === 'draft' ? 'مسودة' : inv.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><Users className="h-3 w-3 text-gray-400" />{getTenantName(inv.tenant_id)}</span>
        <span className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-gray-400" />وحدة {getUnitNumber(inv.unit_id)}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-gray-400" />{inv.invoice_date}</span>
        {inv.due_date && <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-gray-400" />استحقاق: {inv.due_date}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">الإجمالي</div>
          <div className="text-sm font-bold text-gray-900 ltr-only tabular-nums">{fmt(inv.total)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">الرصيد</div>
          <div className={`text-sm font-bold ltr-only tabular-nums ${inv.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(inv.balance)}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => navigate(`/rent-collection/invoices/${inv.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => navigate(`/rent-collection/invoices/${inv.id}/edit`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(inv)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1" />
        <button onClick={() => navigate(`/rent-collection/invoices/${inv.id}`)} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-teal-600 transition-colors">
          التفاصيل <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function InvoiceRow({ inv, onDelete, getTenantName, getUnitNumber }: {
  inv: RentalInvoice; onDelete: (i: RentalInvoice) => void;
  getTenantName: (id: string) => string; getUnitNumber: (id: string) => string;
}) {
  const navigate = useNavigate();
  const statCfg = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <Tooltip><TooltipTrigger asChild>
          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(inv.invoice_number).then(() => toast.success('تم نسخ رقم الفاتورة')); }}
            className="font-mono text-xs text-teal-600 hover:text-teal-700 transition-colors">{inv.invoice_number}</button>
        </TooltipTrigger><TooltipContent>اضغط للنسخ</TooltipContent></Tooltip>
      </td>
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{getTenantName(inv.tenant_id)}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{getUnitNumber(inv.unit_id)}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{inv.invoice_date}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{inv.due_date}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(inv.total)}</td>
      <td className="px-4 py-3 text-xs font-mono text-emerald-600 ltr-only tabular-nums">{fmt(inv.paid_amount)}</td>
      <td className={`px-4 py-3 text-xs font-mono ltr-only tabular-nums ${inv.balance > 0 ? 'text-rose-600 font-bold' : 'text-gray-700'}`}>{fmt(inv.balance)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${statCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statCfg.dot}`} />
          {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partially_paid' ? 'مدفوعة جزئياً' : inv.status === 'issued' ? 'مصدرة' : inv.status === 'overdue' ? 'متأخرة' : inv.status === 'draft' ? 'مسودة' : inv.status}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => navigate(`/rent-collection/invoices/${inv.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>عرض</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => navigate(`/rent-collection/invoices/${inv.id}/edit`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(inv)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyInvoices({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <Receipt className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد فواتير</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function LeasingCollectionsPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<RentalInvoice[]>(() => invoiceStore.getAll());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<RentalInvoice | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const refresh = () => setInvoices(invoiceStore.getAll());

  const getTenantName = (tenantId: string) => {
    const t = tenantStore.getById(tenantId);
    return t?.full_name || t?.company_name || '—';
  };
  const getUnitNumber = (unitId: string) => {
    return unitStore.getById(unitId)?.unit_number || '—';
  };

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      const tenantName = getTenantName(i.tenant_id);
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (search && !tenantName.includes(search) && !i.invoice_number.includes(search)) return false;
      return true;
    });
  }, [invoices, search, statusFilter]);

  // KPIs
  const totalInvoiced = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid' || i.status === 'partially_paid').reduce((s, i) => s + (i.paid_amount || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.balance || 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  const handleDelete = () => {
    if (!deleteTarget) return;
    invoiceStore.remove(deleteTarget.id);
    refresh();
    toast.success(`تم حذف الفاتورة ${deleteTarget.invoice_number} بنجاح`);
    setDeleteTarget(null);
  };

  const generateInvoices = () => {
    const schedules = rentScheduleStore.getAll().filter((s: RentSchedule) => s.status === 'due' || s.status === 'upcoming');
    const allInvoices = invoiceStore.getAll();
    let generated = 0;
    const maxInvNum = allInvoices.reduce((max, i) => {
      const m = i.invoice_number?.match(/INV-(\d+)-(\d+)/);
      if (m) { const n = parseInt(m[2]); return n > max ? n : max; }
      return max;
    }, 0);
    let nextNum = maxInvNum + 1;
    for (const sch of schedules) {
      const exists = allInvoices.some((inv: RentalInvoice) => inv.contract_id === sch.contract_id && inv.invoice_date === sch.due_date);
      if (exists) continue;
      const leasesRaw = localStorage.getItem('erp_leases');
      const leases: any[] = leasesRaw ? JSON.parse(leasesRaw) : [];
      const lease = leases.find((l: any) => l.id === sch.contract_id);
      if (!lease) continue;
      const year = new Date(sch.due_date).getFullYear();
      invoiceStore.create({
        company_id: '', invoice_number: `INV-${year}-${String(nextNum).padStart(3, '0')}`,
        tenant_id: lease.tenant_id, contract_id: sch.contract_id, unit_id: lease.unit_id,
        invoice_date: sch.due_date, due_date: sch.due_date, rent_amount: sch.rent_amount,
        service_charges: sch.service_charges || 0, maintenance_charges: 0, penalties: sch.late_fee || 0,
        discounts: 0, tax: 0, total: sch.total_due, paid_amount: sch.paid_amount || 0, balance: sch.balance, status: 'issued',
      } as any);
      const schedulesRaw = localStorage.getItem('erp_rent_schedules');
      if (schedulesRaw) {
        const allScheds: any[] = JSON.parse(schedulesRaw);
        const idx = allScheds.findIndex((s: any) => s.id === sch.id);
        if (idx !== -1) { allScheds[idx].status = 'due'; localStorage.setItem('erp_rent_schedules', JSON.stringify(allScheds)); }
      }
      nextNum++; generated++;
    }
    refresh();
    if (generated > 0) toast.success(`تم إنشاء ${generated} فاتورة جديدة`);
    else toast.info('لا توجد فواتير جديدة لإنشائها');
  };

  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal-600">التحصيل</span>
              <span className="text-[13px] font-bold text-gray-900">{invoices.length} فاتورة</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في الفواتير..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>نسبة التحصيل:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{collectionRate}%</span>
          </div>
          <div className="me-auto" />
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: Sparkles },
              { key: 'grid', label: 'بطاقات', icon: Receipt },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                <v.icon className="h-3 w-3" /><span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={generateInvoices}
            className="h-8 px-3 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Zap className="h-3.5 w-3.5" /><span>إنشاء فواتير</span>
          </Button>
          <Button onClick={() => navigate('/rent-collection/invoices/create')}
            className="h-8 px-3 gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" /><span>فاتورة جديدة</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الفواتير" value={invoices.length} sub={`${filtered.length} معروض`} icon={Receipt} accent="slate" />
          <KpiCard label="المتحصل" value={fmtInt(totalPaid)} sub={`${collectionRate}% نسبة التحصيل`} icon={CheckCircle2} trend={{ val: collectionRate, dir: collectionRate >= 50 ? 'up' : 'down' }} accent="emerald" />
          <KpiCard label="متأخرات" value={fmtInt(totalOverdue)} sub={`${overdueCount} فاتورة متأخرة`} icon={AlertTriangle} trend={{ val: overdueCount, dir: 'down' }} accent="rose" />
          <KpiCard label="إجمالي الفواتير" value={fmtInt(totalInvoiced)} sub="القيمة الإجمالية" icon={DollarSign} accent="teal" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">{t.rentCollection.title}</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="partially_paid">مدفوعة جزئياً</SelectItem>
                <SelectItem value="issued">مصدرة</SelectItem>
                <SelectItem value="overdue">متأخرة</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyInvoices onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(inv => <InvoiceCard key={inv.id} inv={inv} onDelete={setDeleteTarget} getTenantName={getTenantName} getUnitNumber={getUnitNumber} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رقم الفاتورة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المستأجر</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الوحدة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">تاريخ الفاتورة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">تاريخ الاستحقاق</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الإجمالي</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المدفوع</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الرصيد</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[100px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => <InvoiceRow key={inv.id} inv={inv} onDelete={setDeleteTarget} getTenantName={getTenantName} getUnitNumber={getUnitNumber} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {invoices.length} فاتورة</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div>
              <div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div>
            </div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف الفاتورة <strong className="text-gray-900">{deleteTarget.invoice_number}</strong>؟</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}