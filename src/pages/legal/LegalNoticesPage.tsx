import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Search, Filter, Gavel } from 'lucide-react';
import { createStore, generateId } from '@/services/dataService';
import { tenantStore, leaseStore, invoiceStore } from '@/services/stores';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';

interface LegalNotice {
  id: string;
  notice_number: string;
  tenant_id: string;
  contract_id: string;
  unit_id: string;
  notice_type: string;
  due_amount: number;
  notice_date: string;
  status: string;
  notes: string;
}

const seedNotices: LegalNotice[] = [
  {
    id: 'ln-1', notice_number: 'LGL-2026-001', tenant_id: 'tnt-1', contract_id: 'lse-4',
    unit_id: 'unit-5', notice_type: 'final_warning', due_amount: 36000,
    notice_date: '2026-02-15', status: 'sent', notes: 'إنذار نهائي قبل الإجراءات القانونية',
  },
  {
    id: 'ln-2', notice_number: 'LGL-2026-002', tenant_id: 'tnt-2', contract_id: 'lse-2',
    unit_id: 'unit-2', notice_type: 'friendly_reminder', due_amount: 57600,
    notice_date: '2026-04-01', status: 'acknowledged', notes: 'تم التواصل مع المستأجر وحل الموضوع',
  },
  {
    id: 'ln-3', notice_number: 'LGL-2026-003', tenant_id: 'tnt-3', contract_id: 'lse-3',
    unit_id: 'unit-6', notice_type: 'first_warning', due_amount: 15000,
    notice_date: '2026-05-10', status: 'draft', notes: 'مسودة قيد المراجعة القانونية',
  },
  {
    id: 'ln-4', notice_number: 'LGL-2026-004', tenant_id: 'tnt-1', contract_id: 'lse-1',
    unit_id: 'unit-1', notice_type: 'lease_violation', due_amount: 0,
    notice_date: '2026-03-20', status: 'closed', notes: 'تم حل المشكلة ودياً مع المستأجر',
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

// Mapping from notice_type to case_type
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

export default function LegalNoticesPage() {
  const { t } = useLocale();
  const [notices, setNotices] = useState<LegalNotice[]>(() => legalNoticeStore.getAll());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<LegalNotice>>({
    notice_number: '', tenant_id: '', contract_id: '', unit_id: '',
    notice_type: 'friendly_reminder', due_amount: 0, notice_date: '', status: 'draft', notes: '',
  });

  const refresh = () => setNotices(legalNoticeStore.getAll());

  const filtered = useMemo(() => {
    return notices.filter((n) => {
      if (typeFilter !== 'all' && n.notice_type !== typeFilter) return false;
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      if (search && !n.notice_number.includes(search) && !getTenantName(n.tenant_id).includes(search)) return false;
      return true;
    });
  }, [notices, search, typeFilter, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    const count = notices.length + 1;
    setForm({
      notice_number: `LGL-2026-${String(count).padStart(3, '0')}`,
      tenant_id: '', contract_id: '', unit_id: '',
      notice_type: 'friendly_reminder', due_amount: 0, notice_date: new Date().toISOString().split('T')[0],
      status: 'draft', notes: '',
    });
    setShowModal(true);
  };

  // --- Wire: auto-fill when selecting tenant ---
  function handleTenantSelect(tenantId: string) {
    const updated = { ...form, tenant_id: tenantId };

    // Find tenant's active lease
    const leases = leaseStore.getAll();
    const tenantLeases = leases.filter((l: any) => l.tenant_id === tenantId && l.status === 'active');

    if (tenantLeases.length > 0) {
      const lease = tenantLeases[0];
      updated.contract_id = lease.id;
      updated.unit_id = lease.unit_id || '';

      // Find overdue invoices for this tenant
      const invoices = invoiceStore.getAll();
      const overdueInvoices = invoices.filter((i: any) =>
        i.tenant_id === tenantId && i.status !== 'paid' && i.balance > 0
      );
      const totalDue = overdueInvoices.reduce((s: number, i: any) => s + (i.balance || 0), 0);
      if (totalDue > 0) {
        updated.due_amount = totalDue;
      }
    } else {
      // Try to find any lease
      const anyLease = leases.find((l: any) => l.tenant_id === tenantId);
      if (anyLease) {
        updated.contract_id = anyLease.id;
        updated.unit_id = anyLease.unit_id || '';
      }

      // Still check invoices
      const invoices = invoiceStore.getAll();
      const overdueInvoices = invoices.filter((i: any) =>
        i.tenant_id === tenantId && i.status !== 'paid' && i.balance > 0
      );
      const totalDue = overdueInvoices.reduce((s: number, i: any) => s + (i.balance || 0), 0);
      if (totalDue > 0) {
        updated.due_amount = totalDue;
      }
    }

    setForm(updated);
  }

  const openEdit = (n: LegalNotice) => {
    setEditingId(n.id);
    setForm({ ...n });
    setShowModal(true);
  };

  const save = () => {
    if (!form.notice_number || !form.tenant_id) return;
    if (editingId) {
      legalNoticeStore.update(editingId, form);
    } else {
      legalNoticeStore.create(form as Omit<LegalNotice, 'id'>);
    }
    refresh();
    setShowModal(false);
  };

  const deleteNotice = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
      legalNoticeStore.remove(id);
      refresh();
    }
  };

  // Escalate notice to a legal case
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

    // Update notice status to closed
    legalNoticeStore.update(notice.id, { status: 'closed' } as Partial<LegalNotice>);

    refresh();
    toast.success(`تم تصعيد الإشعار ${notice.notice_number} إلى قضية قانونية ${newCase.case_number}`);
  };

  const fmt = (v: number) => formatQAR(v);

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الإشعارات القانونية</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة الإشعارات والإنذارات القانونية للمستأجرين</p>
        </div>
        <button onClick={openCreate} className="h-9 flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg px-4">
          + إشعار جديد
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder={t.common.search + '...'} value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="نوع الإشعار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {Object.entries(noticeTypeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(noticeStatusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-bold text-[#64748B]">رقم الإشعار</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">المستأجر</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">نوع الإشعار</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">المبلغ المستحق</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">تاريخ الإشعار</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">الحالة</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد إشعارات
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono font-medium">{n.notice_number}</TableCell>
                  <TableCell>{getTenantName(n.tenant_id)}</TableCell>
                  <TableCell>{noticeTypeLabels[n.notice_type] || n.notice_type}</TableCell>
                  <TableCell className="font-mono">{fmt(n.due_amount)}</TableCell>
                  <TableCell>{n.notice_date}</TableCell>
                  <TableCell>
                    <StatusBadge status={n.status} label={noticeStatusLabels[n.status] || n.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(n)}>
                        <span className="text-xs">✎</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => escalateToCase(n)}
                        title="تصعيد إلى قضية قانونية"
                      >
                        <Gavel className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteNotice(n.id)}>
                        <span className="text-xs">✕</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </Table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل إشعار قانوني' : 'إشعار قانوني جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>رقم الإشعار</Label>
              <Input value={form.notice_number} onChange={(e) => setForm({ ...form, notice_number: e.target.value })} />
            </div>
            <div>
              <Label>المستأجر *</Label>
              <Select value={form.tenant_id} onValueChange={handleTenantSelect}>
                <SelectTrigger><SelectValue placeholder="اختر المستأجر" /></SelectTrigger>
                <SelectContent>
                  {tenantStore.getAll().map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name || t.company_name || t.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>العقد</Label>
              <Input value={form.contract_id} onChange={(e) => setForm({ ...form, contract_id: e.target.value })} placeholder="lse-..." />
            </div>
            <div>
              <Label>الوحدة</Label>
              <Input value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })} placeholder="unit-..." />
            </div>
            <div>
              <Label>نوع الإشعار</Label>
              <Select value={form.notice_type} onValueChange={(v) => setForm({ ...form, notice_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(noticeTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المبلغ المستحق</Label>
              <Input type="number" value={form.due_amount} onChange={(e) => setForm({ ...form, due_amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>تاريخ الإشعار</Label>
              <Input type="date" value={form.notice_date} onChange={(e) => setForm({ ...form, notice_date: e.target.value })} />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(noticeStatusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>ملاحظات</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button onClick={save}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
