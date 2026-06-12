import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Filter, Pencil, Trash2, Plus, X, Gavel, Scale, FileText,
  AlertTriangle, Clock, DollarSign, TrendingUp, TrendingDown, Download,
  ExternalLink, Calendar, Eye, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2,
  Printer, RotateCcw, Sparkles, Users, Award, ArrowRight, Send,
} from 'lucide-react';
import { createStore, generateId } from '@/services/dataService';
import { tenantStore, leaseStore, invoiceStore } from '@/services/stores';
import { formatQAR, formatQARInt } from '@/lib/format';

const fmt = formatQAR;
const fmtInt = formatQARInt;
const PAGE_SIZE = 8;
type SortField = 'notice_number' | 'tenant_name' | 'notice_type' | 'due_amount' | 'notice_date' | 'status';
type SortDir = 'asc' | 'desc';

// ... interfaces, seed data, labels, configs ...
interface LegalNotice {
  id: string; notice_number: string; tenant_id: string; contract_id: string; unit_id: string;
  notice_type: string; due_amount: number; notice_date: string; follow_up_date: string;
  delivery_method: string; delivery_status: string; document_url: string; template_id: string;
  status: string; notes: string;
}

const seedNotices: LegalNotice[] = [
  { id: 'ln-1', notice_number: 'LGL-2026-001', tenant_id: 'tnt-1', contract_id: 'lse-4', unit_id: 'unit-5', notice_type: 'final_warning', due_amount: 36000, notice_date: '2026-02-15', follow_up_date: '2026-03-01', delivery_method: 'registered_mail', delivery_status: 'delivered', document_url: '', template_id: 'tmpl-final-warning', status: 'sent', notes: 'إنذار نهائي قبل الإجراءات القانونية' },
  { id: 'ln-2', notice_number: 'LGL-2026-002', tenant_id: 'tnt-2', contract_id: 'lse-2', unit_id: 'unit-2', notice_type: 'friendly_reminder', due_amount: 57600, notice_date: '2026-04-01', follow_up_date: '2026-04-15', delivery_method: 'email', delivery_status: 'read', document_url: '', template_id: 'tmpl-friendly', status: 'acknowledged', notes: 'تم التواصل مع المستأجر وحل الموضوع' },
  { id: 'ln-3', notice_number: 'LGL-2026-003', tenant_id: 'tnt-3', contract_id: 'lse-3', unit_id: 'unit-6', notice_type: 'first_warning', due_amount: 15000, notice_date: '2026-05-10', follow_up_date: '2026-05-25', delivery_method: '', delivery_status: 'pending', document_url: '', template_id: '', status: 'draft', notes: 'مسودة قيد المراجعة القانونية' },
  { id: 'ln-4', notice_number: 'LGL-2026-004', tenant_id: 'tnt-1', contract_id: 'lse-1', unit_id: 'unit-1', notice_type: 'lease_violation', due_amount: 0, notice_date: '2026-03-20', follow_up_date: '', delivery_method: 'hand_delivery', delivery_status: 'delivered', document_url: '', template_id: 'tmpl-violation', status: 'closed', notes: 'تم حل المشكلة ودياً مع المستأجر' },
];

const legalNoticeStore = createStore<LegalNotice>({ key: 'erp_legal_notices', seed: seedNotices });

const noticeTypeLabels: Record<string, string> = {
  friendly_reminder: 'تذكير ودي', first_warning: 'إنذار أول', final_warning: 'إنذار نهائي',
  bounced_cheque: 'شيك مرتجع', lease_violation: 'مخالفة عقد',
  unauthorized_occupancy: 'إشغال غير مصرح', property_damage: 'تلفيات عقار',
  eviction: 'إخلاء', contract_termination: 'فسخ عقد', final_notice_before_legal: 'إشعار أخير قبل القانوني',
};

const noticeStatusLabels: Record<string, string> = { draft: 'مسودة', generated: 'تم الإنشاء', sent: 'تم الإرسال', acknowledged: 'تم الاستلام', closed: 'مغلق' };
const deliveryMethodLabels: Record<string, string> = { registered_mail: 'بريد مسجل', email: 'بريد إلكتروني', hand_delivery: 'تسليم يدوي', sms: 'رسالة نصية', courier: 'مندوب' };
const deliveryStatusLabels: Record<string, string> = { pending: 'قيد التوصيل', delivered: 'تم التسليم', read: 'تم الاطلاع', failed: 'فشل التوصيل', returned: 'مرتجع' };
const templateLabels: Record<string, string> = { 'tmpl-friendly': 'قالب تذكير ودي', 'tmpl-first-warning': 'قالب إنذار أول', 'tmpl-final-warning': 'قالب إنذار نهائي', 'tmpl-violation': 'قالب مخالفة عقد', 'tmpl-eviction': 'قالب إخلاء' };
const noticeToCaseType: Record<string, string> = { first_warning: 'unpaid_rent', final_warning: 'unpaid_rent', friendly_reminder: 'unpaid_rent', bounced_cheque: 'bounced_cheque', lease_violation: 'breach_of_contract', eviction: 'eviction', contract_termination: 'breach_of_contract', property_damage: 'property_damage', unauthorized_occupancy: 'unauthorized_sublet', final_notice_before_legal: 'unpaid_rent' };

const noticeTypeConfig: Record<string, { dot: string; chip: string }> = {
  friendly_reminder:       { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  first_warning:           { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  final_warning:           { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  bounced_cheque:          { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
  lease_violation:         { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  unauthorized_occupancy:  { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  property_damage:         { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  eviction:                { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  contract_termination:    { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  final_notice_before_legal: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};

const statusConfig: Record<string, { dot: string; chip: string }> = {
  draft:         { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  generated:     { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  sent:          { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  acknowledged:  { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  closed:        { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
};

function getTenantName(id: string): string {
  try {
    const raw = localStorage.getItem('erp_tenants');
    if (raw) { const t = JSON.parse(raw).find((x: any) => x.id === id); if (t) return t.full_name || t.company_name || ''; }
  } catch {}
  return id;
}

function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const a: Record<string, { iconBg: string; iconColor: string }> = {
    blue: { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' }, emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
  }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
        {trend && <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{trend.dir === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(trend.val)}%</div>}
      </div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function NoticeRow({ n, onEdit, onDelete, onPrint, onEscalate, getVerbs }: {
  n: LegalNotice; onEdit: (n: LegalNotice) => void; onDelete: (n: LegalNotice) => void;
  onPrint: (n: LegalNotice) => void; onEscalate: (n: LegalNotice) => void; getVerbs: any;
}) {
  const navigate = useNavigate();
  const tc = noticeTypeConfig[n.notice_type] || noticeTypeConfig.friendly_reminder;
  const sc = statusConfig[n.status] || statusConfig.draft;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="font-mono text-xs text-blue-600">{n.notice_number}</span></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5"><span className="text-sm font-bold text-gray-900">{getTenantName(n.tenant_id)}</span>
          <button onClick={() => navigate(`/tenants-leases?tenant=${n.tenant_id}`)} className="text-gray-300 hover:text-blue-500"><ExternalLink className="h-3 w-3" /></button>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${tc.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${tc.dot}`} />{noticeTypeLabels[n.notice_type] || n.notice_type}
        </span>
      </td>
      <td className="px-4 py-3"><span className={`text-xs font-mono ltr-only tabular-nums ${n.due_amount > 0 ? 'text-rose-600 font-bold' : 'text-gray-400'}`}>{fmt(n.due_amount)}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{n.notice_date}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{n.follow_up_date || '—'}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${sc.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{noticeStatusLabels[n.status] || n.status}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(n)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onPrint(n)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Printer className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>طباعة</TooltipContent></Tooltip>
          {n.status !== 'closed' && (
            <Tooltip><TooltipTrigger asChild><button onClick={() => onEscalate(n)} className="h-7 w-7 rounded-md text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors flex items-center justify-center"><Gavel className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تصعيد إلى قضية</TooltipContent></Tooltip>
          )}
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(n)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyNotices({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Scale className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد إشعارات</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function LegalNoticesPage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<LegalNotice[]>(() => legalNoticeStore.getAll());
  const [search, setSearch] = useState(''); const [typeFilter, setTypeFilter] = useState('all'); const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false); const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LegalNotice | null>(null);
  const [page, setPage] = useState(1); const [sortField, setSortField] = useState<SortField>('notice_date'); const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [form, setForm] = useState<Partial<LegalNotice>>({ notice_number: '', tenant_id: '', contract_id: '', unit_id: '', notice_type: 'friendly_reminder', due_amount: 0, notice_date: '', follow_up_date: '', delivery_method: '', delivery_status: 'pending', document_url: '', template_id: '', status: 'draft', notes: '' });

  const refresh = () => setNotices(legalNoticeStore.getAll());

  const filtered = useMemo(() => {
    let r = notices.filter(n => {
      if (typeFilter !== 'all' && n.notice_type !== typeFilter) return false;
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      if (search && !n.notice_number.includes(search) && !getTenantName(n.tenant_id).includes(search)) return false;
      return true;
    });
    r = [...r].sort((a, b) => {
      let va: any, vb: any;
      switch (sortField) {
        case 'notice_number': va = a.notice_number; vb = b.notice_number; break;
        case 'tenant_name': va = getTenantName(a.tenant_id); vb = getTenantName(b.tenant_id); break;
        case 'notice_type': va = noticeTypeLabels[a.notice_type] || a.notice_type; vb = noticeTypeLabels[b.notice_type] || b.notice_type; break;
        case 'due_amount': va = a.due_amount; vb = b.due_amount; break;
        case 'notice_date': va = a.notice_date; vb = b.notice_date; break;
        case 'status': va = a.status; vb = b.status; break;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb, 'ar') : vb.localeCompare(va, 'ar');
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return r;
  }, [notices, search, typeFilter, statusFilter, sortField, sortDir]);

  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter, sortField, sortDir]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const kpis = useMemo(() => ({ total: notices.length, draft: notices.filter(n => n.status === 'draft').length, sent: notices.filter(n => n.status === 'sent').length, closed: notices.filter(n => n.status === 'closed').length, totalDue: notices.reduce((s, n) => s + n.due_amount, 0) }), [notices]);

  const handleSort = (f: SortField) => { if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(f); setSortDir('asc'); } };
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 inline mr-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 inline mr-1" /> : <ArrowDown className="h-3 w-3 inline mr-1" />;
  };

  const openCreate = () => {
    setEditingId(null); const count = notices.length + 1;
    setForm({ notice_number: `LGL-2026-${String(count).padStart(3, '0')}`, tenant_id: '', contract_id: '', unit_id: '', notice_type: 'friendly_reminder', due_amount: 0, notice_date: new Date().toISOString().split('T')[0], follow_up_date: '', delivery_method: '', delivery_status: 'pending', document_url: '', template_id: '', status: 'draft', notes: '' });
    setShowModal(true);
  };
  const openEdit = (n: LegalNotice) => { setEditingId(n.id); setForm({ ...n }); setShowModal(true); };
  function handleTenantSelect(tenantId: string) {
    const u = { ...form, tenant_id: tenantId };
    const leases = leaseStore.getAll();
    const tl = leases.filter((l: any) => l.tenant_id === tenantId && l.status === 'active');
    if (tl.length > 0) { u.contract_id = tl[0].id; u.unit_id = tl[0].unit_id || ''; } else { const al = leases.find((l: any) => l.tenant_id === tenantId); if (al) { u.contract_id = al.id; u.unit_id = al.unit_id || ''; } }
    const invs = invoiceStore.getAll().filter((i: any) => i.tenant_id === tenantId && i.status !== 'paid' && i.balance > 0);
    const totalDue = invs.reduce((s: number, i: any) => s + (i.balance || 0), 0);
    if (totalDue > 0) u.due_amount = totalDue;
    if (u.notice_date) { const nd = new Date(u.notice_date); nd.setDate(nd.getDate() + 14); u.follow_up_date = nd.toISOString().split('T')[0]; }
    setForm(u);
  }
  const save = () => {
    if (!form.notice_number || !form.tenant_id) return;
    const data = { ...form };
    if (data.template_id === '__none__') data.template_id = '';
    if (data.delivery_method === '__none__') data.delivery_method = '';
    if (editingId) { legalNoticeStore.update(editingId, data); toast.success('تم تحديث الإشعار'); } else { legalNoticeStore.create(data as any); toast.success('تم إنشاء الإشعار'); }
    refresh(); setShowModal(false);
  };
  const handleDelete = () => { if (!deleteTarget) return; legalNoticeStore.remove(deleteTarget.id); toast.success(`تم حذف ${deleteTarget.notice_number}`); setDeleteTarget(null); refresh(); };
  const escalateToCase = (notice: LegalNotice) => {
    const caseType = noticeToCaseType[notice.notice_type] || 'unpaid_rent';
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem('erp_legal_cases');
    const existingCases: any[] = raw ? JSON.parse(raw) : [];
    const count = existingCases.length + 1;
    existingCases.push({ id: generateId(), case_number: `CASE-2026-${String(count).padStart(3, '0')}`, tenant_id: notice.tenant_id, contract_id: notice.contract_id, unit_id: notice.unit_id, case_type: caseType, claim_amount: notice.due_amount, lawyer_name: '', court_name: '', filing_date: today, hearing_date: '', judgment_date: '', status: 'under_review', notes: `تم التصعيد من الإشعار ${notice.notice_number} - ${notice.notes || ''}` });
    localStorage.setItem('erp_legal_cases', JSON.stringify(existingCases));
    legalNoticeStore.update(notice.id, { status: 'closed' } as any); refresh();
    toast.success(`تم تصعيد ${notice.notice_number} إلى قضية`);
  };
  const handleExportCSV = () => {
    const headers = ['رقم الإشعار', 'المستأجر', 'نوع الإشعار', 'المبلغ', 'تاريخ الإشعار', 'تاريخ المتابعة', 'طريقة التوصيل', 'حالة التوصيل', 'الحالة'];
    const rows = filtered.map(n => [n.notice_number, getTenantName(n.tenant_id), noticeTypeLabels[n.notice_type] || n.notice_type, n.due_amount, n.notice_date, n.follow_up_date || '', deliveryMethodLabels[n.delivery_method] || '', deliveryStatusLabels[n.delivery_status] || '', noticeStatusLabels[n.status] || n.status]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `الإشعارات_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); toast.success('تم التصدير');
  };
  const handlePrint = (notice: LegalNotice) => {
    const win = window.open('', '_blank', 'width=800,height=600'); if (!win) return;
    win.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>${notice.notice_number}</title><style>body{font-family:Tahoma,sans-serif;padding:40px;color:#1e293b;}h1{font-size:24px;color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:10px;}.field{margin:12px 0;}.label{font-weight:bold;color:#64748b;font-size:13px;}.value{font-size:15px;margin-top:2px;}.note{margin-top:30px;padding:15px;background:#f8fafc;border-radius:8px;border-right:3px solid #3b82f6;}</style></head><body><h1>إشعار قانوني - ${notice.notice_number}</h1><div class="field"><div class="label">المستأجر</div><div class="value">${getTenantName(notice.tenant_id)}</div></div><div class="field"><div class="label">نوع الإشعار</div><div class="value">${noticeTypeLabels[notice.notice_type] || notice.notice_type}</div></div><div class="field"><div class="label">المبلغ المستحق</div><div class="value">${fmt(notice.due_amount)}</div></div><div class="field"><div class="label">التاريخ</div><div class="value">${notice.notice_date}</div></div><div class="note"><strong>ملاحظات:</strong> ${notice.notes || 'لا توجد'}</div></body></html>`);
    win.document.close(); setTimeout(() => win.print(), 500);
  };
  const resetFilters = () => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm"><Scale className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">الإشعارات القانونية</span><span className="text-[13px] font-bold text-gray-900">{kpis.total} إشعار</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="بحث برقم الإشعار أو اسم المستأجر..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500"><span>إجمالي المطالبات:</span><span className="font-bold text-gray-900 ltr-only tabular-nums">{fmtInt(kpis.totalDue)}</span></div>
          <div className="me-auto" />
          <Button onClick={handleExportCSV} className="h-8 px-3 gap-1.5 text-[11px] font-bold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"><Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">تصدير CSV</span></Button>
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><Plus className="h-3.5 w-3.5" /><span>إشعار جديد</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="الإشعارات" value={kpis.total} sub={`${kpis.draft} مسودة · ${kpis.sent} مرسلة`} icon={Scale} accent="slate" />
          <KpiCard label="المبالغ المستحقة" value={fmtInt(kpis.totalDue)} sub="إجمالي المطالبات" icon={DollarSign} accent="blue" />
          <KpiCard label="قيد الانتظار" value={kpis.draft} sub="إشعارات مسودة" icon={Clock} accent="amber" />
          <KpiCard label="مغلقة" value={kpis.closed} sub="تم التصعيد أو الحل" icon={CheckCircle2} accent="emerald" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">الإشعارات القانونية</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="النوع" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الأنواع</SelectItem>{Object.entries(noticeTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الحالات</SelectItem>{Object.entries(noticeStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyNotices onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('notice_number')}>رقم الإشعار<SortIcon field="notice_number" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('tenant_name')}>المستأجر<SortIcon field="tenant_name" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('notice_type')}>النوع<SortIcon field="notice_type" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('due_amount')}>المبلغ<SortIcon field="due_amount" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('notice_date')}>التاريخ<SortIcon field="notice_date" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المتابعة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('status')}>الحالة<SortIcon field="status" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[140px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>{paged.map(n => <NoticeRow key={n.id} n={n} onEdit={openEdit} onDelete={setDeleteTarget} onPrint={handlePrint} onEscalate={escalateToCase} getVerbs={null} />)}</tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[12px] text-gray-500">صفحة {page} من {totalPages} ({filtered.length} إشعار)</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2 border-gray-200" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                    <span key={p}>{idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-300 mx-0.5">…</span>}
                      <Button variant={p === page ? 'default' : 'outline'} size="sm" className={`h-7 w-7 text-xs p-0 ${p === page ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-gray-200'}`} onClick={() => setPage(p)}>{p}</Button>
                    </span>
                  ))}
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2 border-gray-200" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {kpis.total} إشعار</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف الإشعار <strong className="text-gray-900">{deleteTarget.notice_number}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editingId ? 'تعديل إشعار قانوني' : 'إشعار قانوني جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>رقم الإشعار *</Label><Input value={form.notice_number} onChange={e => setForm({ ...form, notice_number: e.target.value })} /></div>
              <div><Label>قالب الإشعار</Label><Select value={form.template_id || '__none__'} onValueChange={v => setForm({ ...form, template_id: v })}><SelectTrigger><SelectValue placeholder="اختر قالباً" /></SelectTrigger><SelectContent><SelectItem value="__none__">بدون قالب</SelectItem>{Object.entries(templateLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>المستأجر *</Label><Select value={form.tenant_id} onValueChange={handleTenantSelect}><SelectTrigger><SelectValue placeholder="اختر المستأجر" /></SelectTrigger><SelectContent>{tenantStore.getAll().map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name || t.company_name || t.id}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>العقد</Label><Input value={form.contract_id} onChange={e => setForm({ ...form, contract_id: e.target.value })} /></div><div><Label>الوحدة</Label><Input value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>نوع الإشعار</Label><Select value={form.notice_type} onValueChange={v => setForm({ ...form, notice_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(noticeTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div><div><Label>المبلغ المستحق</Label><Input type="number" value={form.due_amount} onChange={e => setForm({ ...form, due_amount: Number(e.target.value) })} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>تاريخ الإشعار</Label><Input type="date" value={form.notice_date} onChange={e => setForm({ ...form, notice_date: e.target.value })} /></div><div><Label>تاريخ المتابعة</Label><Input type="date" value={form.follow_up_date || ''} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>طريقة التوصيل</Label><Select value={form.delivery_method || '__none__'} onValueChange={v => setForm({ ...form, delivery_method: v })}><SelectTrigger><SelectValue placeholder="اختر طريقة" /></SelectTrigger><SelectContent><SelectItem value="__none__">غير محدد</SelectItem>{Object.entries(deliveryMethodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div><div><Label>حالة التوصيل</Label><Select value={form.delivery_status || ''} onValueChange={v => setForm({ ...form, delivery_status: v })}><SelectTrigger><SelectValue placeholder="حالة التوصيل" /></SelectTrigger><SelectContent>{Object.entries(deliveryStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>رابط المستند</Label><Input value={form.document_url || ''} onChange={e => setForm({ ...form, document_url: e.target.value })} /></div><div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(noticeStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label>ملاحظات</Label><Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setShowModal(false)}>إلغاء</Button><Button onClick={save} className="bg-blue-500 hover:bg-blue-600 text-white">{editingId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}