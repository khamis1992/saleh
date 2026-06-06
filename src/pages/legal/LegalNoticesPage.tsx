import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Filter, Pencil, Trash2, Plus, X, Gavel, Scale, FileText,
  AlertTriangle, Clock, DollarSign, TrendingUp, Download, ExternalLink,
  Mail, Send, Calendar, Eye, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2,
  Printer,
} from 'lucide-react';
import { createStore, generateId } from '@/services/dataService';
import { tenantStore, leaseStore, invoiceStore } from '@/services/stores';
import { formatQAR, formatQARInt } from '@/lib/format';
import { KpiCard } from '@/components/shared/DesignSystem';

interface LegalNotice {
  id: string;
  notice_number: string;
  tenant_id: string;
  contract_id: string;
  unit_id: string;
  notice_type: string;
  due_amount: number;
  notice_date: string;
  follow_up_date: string;
  delivery_method: string;
  delivery_status: string;
  document_url: string;
  template_id: string;
  status: string;
  notes: string;
}

const seedNotices: LegalNotice[] = [
  {
    id: 'ln-1', notice_number: 'LGL-2026-001', tenant_id: 'tnt-1', contract_id: 'lse-4',
    unit_id: 'unit-5', notice_type: 'final_warning', due_amount: 36000,
    notice_date: '2026-02-15', follow_up_date: '2026-03-01', delivery_method: 'registered_mail',
    delivery_status: 'delivered', document_url: '', template_id: 'tmpl-final-warning',
    status: 'sent', notes: 'إنذار نهائي قبل الإجراءات القانونية',
  },
  {
    id: 'ln-2', notice_number: 'LGL-2026-002', tenant_id: 'tnt-2', contract_id: 'lse-2',
    unit_id: 'unit-2', notice_type: 'friendly_reminder', due_amount: 57600,
    notice_date: '2026-04-01', follow_up_date: '2026-04-15', delivery_method: 'email',
    delivery_status: 'read', document_url: '', template_id: 'tmpl-friendly',
    status: 'acknowledged', notes: 'تم التواصل مع المستأجر وحل الموضوع',
  },
  {
    id: 'ln-3', notice_number: 'LGL-2026-003', tenant_id: 'tnt-3', contract_id: 'lse-3',
    unit_id: 'unit-6', notice_type: 'first_warning', due_amount: 15000,
    notice_date: '2026-05-10', follow_up_date: '2026-05-25', delivery_method: '',
    delivery_status: 'pending', document_url: '', template_id: '',
    status: 'draft', notes: 'مسودة قيد المراجعة القانونية',
  },
  {
    id: 'ln-4', notice_number: 'LGL-2026-004', tenant_id: 'tnt-1', contract_id: 'lse-1',
    unit_id: 'unit-1', notice_type: 'lease_violation', due_amount: 0,
    notice_date: '2026-03-20', follow_up_date: '', delivery_method: 'hand_delivery',
    delivery_status: 'delivered', document_url: '', template_id: 'tmpl-violation',
    status: 'closed', notes: 'تم حل المشكلة ودياً مع المستأجر',
  },
];

const legalNoticeStore = createStore<LegalNotice>({ key: 'erp_legal_notices', seed: seedNotices });

const noticeTypeLabels: Record<string, string> = {
  friendly_reminder: 'تذكير ودي',
  first_warning: 'إنذار أول',
  final_warning: 'إنذار نهائي',
  bounced_cheque: 'شيك مرتجع',
  lease_violation: 'مخالفة عقد',
  unauthorized_occupancy: 'إشغال غير مصرح',
  property_damage: 'تلفيات عقار',
  eviction: 'إخلاء',
  contract_termination: 'فسخ عقد',
  final_notice_before_legal: 'إشعار أخير قبل القانوني',
};

const noticeStatusLabels: Record<string, string> = {
  draft: 'مسودة',
  generated: 'تم الإنشاء',
  sent: 'تم الإرسال',
  acknowledged: 'تم الاستلام',
  closed: 'مغلق',
};

const deliveryMethodLabels: Record<string, string> = {
  registered_mail: 'بريد مسجل',
  email: 'بريد إلكتروني',
  hand_delivery: 'تسليم يدوي',
  sms: 'رسالة نصية',
  courier: 'مندوب',
};

const deliveryStatusLabels: Record<string, string> = {
  pending: 'قيد التوصيل',
  delivered: 'تم التسليم',
  read: 'تم الاطلاع',
  failed: 'فشل التوصيل',
  returned: 'مرتجع',
};

const templateLabels: Record<string, string> = {
  'tmpl-friendly': 'قالب تذكير ودي',
  'tmpl-first-warning': 'قالب إنذار أول',
  'tmpl-final-warning': 'قالب إنذار نهائي',
  'tmpl-violation': 'قالب مخالفة عقد',
  'tmpl-eviction': 'قالب إخلاء',
};

const noticeToCaseType: Record<string, string> = {
  first_warning: 'unpaid_rent',
  final_warning: 'unpaid_rent',
  friendly_reminder: 'unpaid_rent',
  bounced_cheque: 'bounced_cheque',
  lease_violation: 'breach_of_contract',
  eviction: 'eviction',
  contract_termination: 'breach_of_contract',
  property_damage: 'property_damage',
  unauthorized_occupancy: 'unauthorized_sublet',
  final_notice_before_legal: 'unpaid_rent',
};

function getTenantName(id: string): string {
  try {
    const raw = localStorage.getItem('erp_tenants');
    if (raw) {
      const tenants: Record<string, string>[] = JSON.parse(raw);
      const t = tenants.find((x: Record<string, string>) => x.id === id);
      if (t) return t.full_name || t.company_name || '';
    }
  } catch {}
  return id;
}

const PAGE_SIZE = 8;

type SortField = 'notice_number' | 'tenant_name' | 'notice_type' | 'due_amount' | 'notice_date' | 'status';
type SortDir = 'asc' | 'desc';

export default function LegalNoticesPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<LegalNotice[]>(() => legalNoticeStore.getAll());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LegalNotice | null>(null);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('notice_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<LegalNotice>>({
    notice_number: '', tenant_id: '', contract_id: '', unit_id: '',
    notice_type: 'friendly_reminder', due_amount: 0, notice_date: '',
    follow_up_date: '', delivery_method: '', delivery_status: 'pending',
    document_url: '', template_id: '', status: 'draft', notes: '',
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const refresh = () => setNotices(legalNoticeStore.getAll());

  const filtered = useMemo(() => {
    let result = notices.filter((n) => {
      if (typeFilter !== 'all' && n.notice_type !== typeFilter) return false;
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      if (search && !n.notice_number.includes(search) && !getTenantName(n.tenant_id).includes(search)) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      let va: any, vb: any;
      switch (sortField) {
        case 'notice_number': va = a.notice_number; vb = b.notice_number; break;
        case 'tenant_name': va = getTenantName(a.tenant_id); vb = getTenantName(b.tenant_id); break;
        case 'notice_type': va = noticeTypeLabels[a.notice_type] || a.notice_type; vb = noticeTypeLabels[b.notice_type] || b.notice_type; break;
        case 'due_amount': va = a.due_amount; vb = b.due_amount; break;
        case 'notice_date': va = a.notice_date; vb = b.notice_date; break;
        case 'status': va = a.status; vb = b.status; break;
        default: return 0;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb, 'ar') : vb.localeCompare(va, 'ar');
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return result;
  }, [notices, search, typeFilter, statusFilter, sortField, sortDir]);

  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fmt = (v: number) => formatQAR(v);
  const fmtInt = (v: number) => formatQARInt(v);

  // KPIs
  const kpis = useMemo(() => ({
    total: notices.length,
    draft: notices.filter(n => n.status === 'draft').length,
    sent: notices.filter(n => n.status === 'sent').length,
    closed: notices.filter(n => n.status === 'closed').length,
    totalDue: notices.reduce((s, n) => s + n.due_amount, 0),
    escalated: notices.filter(n => n.status === 'closed').length,
  }), [notices]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 inline ml-1" /> : <ArrowDown className="h-3 w-3 inline ml-1" />;
  };

  const openCreate = () => {
    setEditingId(null);
    const count = notices.length + 1;
    setForm({
      notice_number: `LGL-2026-${String(count).padStart(3, '0')}`,
      tenant_id: '', contract_id: '', unit_id: '',
      notice_type: 'friendly_reminder', due_amount: 0,
      notice_date: new Date().toISOString().split('T')[0],
      follow_up_date: '', delivery_method: '', delivery_status: 'pending',
      document_url: '', template_id: '', status: 'draft', notes: '',
    });
    setShowModal(true);
  };

  const openEdit = (n: LegalNotice) => {
    setEditingId(n.id);
    setForm({ ...n });
    setShowModal(true);
  };

  function handleTenantSelect(tenantId: string) {
    const updated = { ...form, tenant_id: tenantId };
    const leases = leaseStore.getAll();
    const tenantLeases = leases.filter((l: any) => l.tenant_id === tenantId && l.status === 'active');
    if (tenantLeases.length > 0) {
      const lease = tenantLeases[0];
      updated.contract_id = lease.id;
      updated.unit_id = lease.unit_id || '';
    } else {
      const anyLease = leases.find((l: any) => l.tenant_id === tenantId);
      if (anyLease) { updated.contract_id = anyLease.id; updated.unit_id = anyLease.unit_id || ''; }
    }
    // Auto-fill due amount from overdue invoices
    const invoices = invoiceStore.getAll();
    const overdueInvoices = invoices.filter((i: any) => i.tenant_id === tenantId && i.status !== 'paid' && i.balance > 0);
    const totalDue = overdueInvoices.reduce((s: number, i: any) => s + (i.balance || 0), 0);
    if (totalDue > 0) updated.due_amount = totalDue;
    // Auto-set follow-up date (14 days after notice date)
    if (updated.notice_date) {
      const nd = new Date(updated.notice_date);
      nd.setDate(nd.getDate() + 14);
      updated.follow_up_date = nd.toISOString().split('T')[0];
    }
    setForm(updated);
  }

  const save = () => {
    if (!form.notice_number || !form.tenant_id) return;
    const data = { ...form };
    if (data.template_id === '__none__') data.template_id = '';
    if (data.delivery_method === '__none__') data.delivery_method = '';
    if (editingId) {
      legalNoticeStore.update(editingId, data);
      toast.success('تم تحديث الإشعار بنجاح');
    } else {
      legalNoticeStore.create(data as Omit<LegalNotice, 'id'>);
      toast.success('تم إنشاء الإشعار بنجاح');
    }
    refresh();
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    legalNoticeStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.notice_number}`);
    setDeleteTarget(null);
    refresh();
  };

  const escalateToCase = (notice: LegalNotice) => {
    const caseType = noticeToCaseType[notice.notice_type] || 'unpaid_rent';
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem('erp_legal_cases');
    const existingCases: Record<string, any>[] = raw ? JSON.parse(raw) : [];
    const count = existingCases.length + 1;

    const newCase = {
      id: generateId(),
      case_number: `CASE-2026-${String(count).padStart(3, '0')}`,
      tenant_id: notice.tenant_id,
      contract_id: notice.contract_id,
      unit_id: notice.unit_id,
      case_type: caseType,
      claim_amount: notice.due_amount,
      lawyer_name: '',
      court_name: '',
      filing_date: today,
      hearing_date: '',
      judgment_date: '',
      status: 'under_review',
      notes: `تم التصعيد من الإشعار ${notice.notice_number} - ${notice.notes || ''}`,
    };

    existingCases.push(newCase);
    localStorage.setItem('erp_legal_cases', JSON.stringify(existingCases));
    legalNoticeStore.update(notice.id, { status: 'closed' } as Partial<LegalNotice>);
    refresh();
    toast.success(`تم تصعيد ${notice.notice_number} إلى قضية ${newCase.case_number}`);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['رقم الإشعار', 'المستأجر', 'نوع الإشعار', 'المبلغ', 'تاريخ الإشعار', 'تاريخ المتابعة', 'طريقة التوصيل', 'حالة التوصيل', 'الحالة'];
    const rows = filtered.map(n => [
      n.notice_number, getTenantName(n.tenant_id), noticeTypeLabels[n.notice_type] || n.notice_type,
      n.due_amount, n.notice_date, n.follow_up_date || '',
      deliveryMethodLabels[n.delivery_method] || n.delivery_method || '',
      deliveryStatusLabels[n.delivery_status] || n.delivery_status || '',
      noticeStatusLabels[n.status] || n.status,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `الإشعارات_القانونية_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('تم تصدير الملف بنجاح');
  };

  // Print notice
  const handlePrint = (notice: LegalNotice) => {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    const content = `
      <html dir="rtl"><head><meta charset="utf-8"><title>${notice.notice_number}</title>
      <style>body{font-family:Tahoma,sans-serif;padding:40px;color:#1e293b;}
      h1{font-size:24px;color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:10px;}
      .field{margin:12px 0;}.label{font-weight:bold;color:#64748b;font-size:13px;}.value{font-size:15px;margin-top:2px;}
      .note{margin-top:30px;padding:15px;background:#f8fafc;border-radius:8px;border-right:3px solid #3b82f6;}
      </style></head><body>
      <h1>إشعار قانوني - ${notice.notice_number}</h1>
      <div class="field"><div class="label">المستأجر</div><div class="value">${getTenantName(notice.tenant_id)}</div></div>
      <div class="field"><div class="label">نوع الإشعار</div><div class="value">${noticeTypeLabels[notice.notice_type] || notice.notice_type}</div></div>
      <div class="field"><div class="label">المبلغ المستحق</div><div class="value">${fmt(notice.due_amount)}</div></div>
      <div class="field"><div class="label">التاريخ</div><div class="value">${notice.notice_date}</div></div>
      <div class="note"><strong>ملاحظات:</strong> ${notice.notes || 'لا توجد'}</div>
      </body></html>`;
    win.document.write(content);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="الإشعارات" value={kpis.total} subtitle={`${kpis.draft} مسودة · ${kpis.sent} مرسلة`} icon={Scale} moduleOverride="legal" />
        <KpiCard title="المبالغ المستحقة" value={fmtInt(kpis.totalDue)} subtitle="إجمالي المطالبات" icon={DollarSign} moduleOverride="legal" />
        <KpiCard title="قيد الانتظار" value={kpis.draft} subtitle="إشعارات مسودة" icon={Clock} moduleOverride="legal" />
        <KpiCard title="مغلقة" value={kpis.closed} subtitle="تم التصعيد أو الحل" icon={CheckCircle2} moduleOverride="legal" />
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الإشعارات القانونية</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة الإشعارات والإنذارات القانونية للمستأجرين</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 h-9 text-sm rounded-lg">
            <Download className="h-4 w-4" /> تصدير CSV
          </Button>
          <Button onClick={openCreate} className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20">
            <Plus className="h-4 w-4" /> إشعار جديد
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث برقم الإشعار أو اسم المستأجر..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300" />
            {search && <button onClick={() => setSearch('')} className="absolute left-3 top-2.5"><X className="h-4 w-4 text-gray-300 hover:text-gray-500" /></button>}
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200"><Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="نوع الإشعار" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {Object.entries(noticeTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200"><Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(noticeStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          {search && <span className="text-xs text-gray-400">{filtered.length} نتيجة</span>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-full bg-gray-100 animate-pulse rounded" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('notice_number')}>رقم الإشعار<SortIcon field="notice_number" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('tenant_name')}>المستأجر<SortIcon field="tenant_name" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('notice_type')}>نوع الإشعار<SortIcon field="notice_type" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('due_amount')}>المبلغ<SortIcon field="due_amount" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('notice_date')}>التاريخ<SortIcon field="notice_date" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المتابعة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('status')}>الحالة<SortIcon field="status" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[140px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-500">لا توجد إشعارات</p>
                    <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p>
                  </TableCell>
                </TableRow>
              ) : paged.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono text-xs text-blue-600 ltr-only">{n.notice_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getTenantName(n.tenant_id)}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => navigate(`/tenants-leases?tenant=${n.tenant_id}`)} className="text-gray-300 hover:text-blue-500">
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>عرض المستأجر</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-normal ${
                      n.notice_type === 'final_warning' || n.notice_type === 'eviction' ? 'border-red-200 bg-red-50 text-red-700' :
                      n.notice_type === 'first_warning' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                      'border-gray-200 bg-gray-50 text-gray-600'
                    }`}>
                      {noticeTypeLabels[n.notice_type] || n.notice_type}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-mono text-sm ltr-only ${n.due_amount > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(n.due_amount)}</TableCell>
                  <TableCell className="text-xs text-gray-500">{n.notice_date}</TableCell>
                  <TableCell className="text-xs text-gray-500">{n.follow_up_date || '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      n.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                      n.status === 'sent' ? 'bg-blue-50 text-blue-600' :
                      n.status === 'acknowledged' ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {noticeStatusLabels[n.status] || n.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => openEdit(n)}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => handlePrint(n)}><Printer className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>طباعة</TooltipContent></Tooltip>
                      {n.status !== 'closed' && (
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-violet-600 hover:bg-violet-50" onClick={() => escalateToCase(n)}><Gavel className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>تصعيد إلى قضية</TooltipContent></Tooltip>
                      )}
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(n)}><Trash2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between px-4">
              <span className="text-xs text-gray-500">صفحة {page} من {totalPages} ({filtered.length} إشعار)</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-300 mx-0.5">…</span>}
                    <Button variant={p === page ? 'default' : 'outline'} size="sm" className={`h-7 w-7 text-xs p-0 ${p === page ? 'bg-[#533afd] hover:bg-[#4434d4]' : ''}`} onClick={() => setPage(p)}>{p}</Button>
                  </span>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل إشعار قانوني' : 'إشعار قانوني جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>رقم الإشعار *</Label><Input value={form.notice_number} onChange={e => setForm({ ...form, notice_number: e.target.value })} /></div>
              <div><Label>قالب الإشعار</Label>
                <Select value={form.template_id || '__none__'} onValueChange={v => setForm({ ...form, template_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر قالباً" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">بدون قالب</SelectItem>
                    {Object.entries(templateLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>المستأجر *</Label>
              <Select value={form.tenant_id} onValueChange={handleTenantSelect}>
                <SelectTrigger><SelectValue placeholder="اختر المستأجر" /></SelectTrigger>
                <SelectContent>
                  {tenantStore.getAll().map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name || t.company_name || t.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>العقد</Label><Input value={form.contract_id} onChange={e => setForm({ ...form, contract_id: e.target.value })} placeholder="تلقائي من المستأجر" /></div>
              <div><Label>الوحدة</Label><Input value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })} placeholder="تلقائي من العقد" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>نوع الإشعار</Label>
                <Select value={form.notice_type} onValueChange={v => setForm({ ...form, notice_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(noticeTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>المبلغ المستحق</Label><Input type="number" value={form.due_amount} onChange={e => setForm({ ...form, due_amount: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>تاريخ الإشعار</Label><Input type="date" value={form.notice_date} onChange={e => setForm({ ...form, notice_date: e.target.value })} /></div>
              <div><Label>تاريخ المتابعة</Label><Input type="date" value={form.follow_up_date || ''} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>طريقة التوصيل</Label>
                <Select value={form.delivery_method || '__none__'} onValueChange={v => setForm({ ...form, delivery_method: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر طريقة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">غير محدد</SelectItem>
                    {Object.entries(deliveryMethodLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>حالة التوصيل</Label>
                <Select value={form.delivery_status || ''} onValueChange={v => setForm({ ...form, delivery_status: v })}>
                  <SelectTrigger><SelectValue placeholder="حالة التوصيل" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(deliveryStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>رابط المستند</Label><Input value={form.document_url || ''} onChange={e => setForm({ ...form, document_url: e.target.value })} placeholder="رابط PDF أو ملف" /></div>
              <div><Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(noticeStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>ملاحظات</Label><Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات إضافية..." rows={2} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>إلغاء</Button>
            <Button onClick={save} className="bg-[#533afd] hover:bg-[#4434d4]">{editingId ? 'تحديث' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف الإشعار <strong>{deleteTarget?.notice_number}</strong> للمستأجر <strong>{deleteTarget ? getTenantName(deleteTarget.tenant_id) : ''}</strong>؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
