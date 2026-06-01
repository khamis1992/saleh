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
import { Search, Filter, Banknote } from 'lucide-react';
import { createStore, generateId } from '@/services/dataService';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';

interface LegalCase {
  id: string;
  case_number: string;
  tenant_id: string;
  contract_id: string;
  unit_id: string;
  case_type: string;
  claim_amount: number;
  lawyer_name: string;
  court_name: string;
  filing_date: string;
  hearing_date: string;
  judgment_date: string;
  status: string;
  notes: string;
}

const seedCases: LegalCase[] = [
  {
    id: 'lc-1', case_number: 'CASE-2026-001', tenant_id: 'tnt-1', contract_id: 'lse-4',
    unit_id: 'unit-5', case_type: 'eviction', claim_amount: 45000,
    lawyer_name: 'مكتب المحامي سعد المحيسن', court_name: 'المحكمة العامة بالرياض',
    filing_date: '2026-03-01', hearing_date: '2026-04-15', judgment_date: '',
    status: 'hearing_scheduled', notes: 'جلسة الاستماع الأولى',
  },
  {
    id: 'lc-2', case_number: 'CASE-2026-002', tenant_id: 'tnt-5', contract_id: 'lse-5',
    unit_id: 'unit-3', case_type: 'unpaid_rent', claim_amount: 78000,
    lawyer_name: 'شركة المحامون العرب', court_name: 'محكمة التنفيذ بالرياض',
    filing_date: '2026-01-10', hearing_date: '2026-02-20', judgment_date: '2026-05-01',
    status: 'judgment_issued', notes: 'تم إصدار حكم لصالح المؤجر',
  },
  {
    id: 'lc-3', case_number: 'CASE-2026-003', tenant_id: 'tnt-4', contract_id: 'lse-4',
    unit_id: 'unit-5', case_type: 'property_damage', claim_amount: 35000,
    lawyer_name: 'مكتب المحامي سعد المحيسن', court_name: 'المحكمة العامة بالرياض',
    filing_date: '2026-05-15', hearing_date: '2026-06-04', judgment_date: '',
    status: 'filed', notes: 'دعوى تعويض عن تلفيات في العقار — جلسة قريبة',
  },
  {
    id: 'lc-4', case_number: 'CASE-2026-004', tenant_id: 'tnt-1', contract_id: 'lse-1',
    unit_id: 'unit-1', case_type: 'breach_of_contract', claim_amount: 25000,
    lawyer_name: 'شركة المحامون العرب', court_name: 'محكمة التنفيذ بالرياض',
    filing_date: '2026-05-20', hearing_date: '2026-06-07', judgment_date: '',
    status: 'hearing_scheduled', notes: 'خرق بنود العقد — جلسة استماع',
  },
];

const legalCaseStore = createStore<LegalCase>({ key: 'erp_legal_cases', seed: seedCases });

const caseTypeLabels: Record<string, string> = {
  unpaid_rent: 'إيجار غير مدفوع',
  eviction: 'إخلاء',
  property_damage: 'تلفيات عقار',
  breach_of_contract: 'خرق العقد',
  bounced_cheque: 'شيك مرتجع',
  unauthorized_sublet: 'تأجير من الباطن',
  other: 'أخرى',
};

const caseStatusLabels: Record<string, string> = {
  under_review: 'قيد المراجعة',
  notice_sent: 'تم الإشعار',
  filed: 'مقيدة',
  hearing_scheduled: 'محدد للجلسة',
  judgment_issued: 'تم الحكم',
  enforcement: 'تنفيذ',
  closed: 'مقفلة',
  cancelled: 'ملغاة',
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

export default function LegalCasesPage() {
  const { t } = useLocale();
  const [cases, setCases] = useState<LegalCase[]>(() => legalCaseStore.getAll());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<LegalCase>>({
    case_number: '', tenant_id: '', contract_id: '', unit_id: '',
    case_type: 'unpaid_rent', claim_amount: 0, lawyer_name: '', court_name: '',
    filing_date: '', hearing_date: '', judgment_date: '', status: 'under_review', notes: '',
  });

  const refresh = () => setCases(legalCaseStore.getAll());

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (typeFilter !== 'all' && c.case_type !== typeFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search && !c.case_number.includes(search) && !getTenantName(c.tenant_id).includes(search) && !c.court_name.includes(search)) return false;
      return true;
    });
  }, [cases, search, typeFilter, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    const count = cases.length + 1;
    setForm({
      case_number: `CASE-2026-${String(count).padStart(3, '0')}`,
      tenant_id: '', contract_id: '', unit_id: '',
      case_type: 'unpaid_rent', claim_amount: 0, lawyer_name: '', court_name: '',
      filing_date: new Date().toISOString().split('T')[0], hearing_date: '', judgment_date: '',
      status: 'under_review', notes: '',
    });
    setShowModal(true);
  };

  const openEdit = (c: LegalCase) => {
    setEditingId(c.id);
    setForm({ ...c });
    setShowModal(true);
  };

  const save = () => {
    if (!form.case_number || !form.tenant_id) return;
    if (editingId) {
      legalCaseStore.update(editingId, form);
    } else {
      legalCaseStore.create(form as Omit<LegalCase, 'id'>);
    }
    refresh();
    setShowModal(false);
  };

  const deleteCase = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه القضية؟')) {
      legalCaseStore.remove(id);
      refresh();
    }
  };

  // Settle/recover case — create accounting journal entry
  const settleCase = (c: LegalCase) => {
    if (c.status !== 'judgment_issued' && c.status !== 'closed') {
      toast.error('لا يمكن التسوية إلا للقضايا الصادر فيها حكم أو المنتهية');
      return;
    }
    if (c.claim_amount <= 0) {
      toast.error('المبلغ المطالب به يجب أن يكون أكبر من صفر');
      return;
    }

    const entryId = generateId();
    const today = new Date().toISOString().split('T')[0];

    // Create journal entry: Debit Cash/Bank, Credit Tenant Receivables
    const journalEntry = {
      id: entryId,
      company_id: '',
      entry_number: `JRN-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      entry_date: today,
      description: `استرداد قضية قانونية ${c.case_number} - ${getTenantName(c.tenant_id)}`,
      source_module: 'قانوني',
      source_record_id: c.id,
      status: 'posted' as const,
      total_debit: c.claim_amount,
      total_credit: c.claim_amount,
      created_by: '',
      posted_by: '',
      posted_at: today,
    };

    // Lines: Debit Cash (acc-1), Credit Tenant Receivables (acc-3)
    const journalLines = [
      {
        id: generateId(),
        journal_entry_id: entryId,
        account_id: 'acc-1',
        cost_center_id: '',
        debit: c.claim_amount,
        credit: 0,
        description: `استرداد نقدي من القضية ${c.case_number}`,
      },
      {
        id: generateId(),
        journal_entry_id: entryId,
        account_id: 'acc-3',
        cost_center_id: '',
        debit: 0,
        credit: c.claim_amount,
        description: `تسوية ذمم المستأجر ${getTenantName(c.tenant_id)}`,
      },
    ];

    // Save to journal stores
    const jeRaw = localStorage.getItem('erp_journal_entries');
    const jelRaw = localStorage.getItem('erp_journal_entry_lines');
    const entries = jeRaw ? JSON.parse(jeRaw) : [];
    const lines = jelRaw ? JSON.parse(jelRaw) : [];

    entries.push(journalEntry);
    lines.push(...journalLines);

    localStorage.setItem('erp_journal_entries', JSON.stringify(entries));
    localStorage.setItem('erp_journal_entry_lines', JSON.stringify(lines));

    // Update case status to closed
    legalCaseStore.update(c.id, { status: 'closed' } as Partial<LegalCase>);
    refresh();

    toast.success(`تم تسوية القضية ${c.case_number} وإثبات استرداد ${fmt(c.claim_amount)}`);
  };

  const fmt = (v: number) => formatQAR(v);

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">القضايا القانونية</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة القضايا والدعاوى القانونية</p>
        </div>
        <button onClick={openCreate} className="h-9 flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg px-4">
          + قضية جديدة
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder={t.common.search + '...'} value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="نوع القضية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {Object.entries(caseTypeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(caseStatusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-bold text-[#64748B]">رقم القضية</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">المستأجر</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">النوع</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">المبلغ المطالب</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">المحامي</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">المحكمة</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">تاريخ القيد</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">تاريخ الجلسة</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B]">الحالة</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    لا توجد قضايا
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.case_number}</TableCell>
                  <TableCell>{getTenantName(c.tenant_id)}</TableCell>
                  <TableCell>{caseTypeLabels[c.case_type] || c.case_type}</TableCell>
                  <TableCell className="font-mono">{fmt(c.claim_amount)}</TableCell>
                  <TableCell>{c.lawyer_name}</TableCell>
                  <TableCell>{c.court_name}</TableCell>
                  <TableCell>{c.filing_date}</TableCell>
                  <TableCell>{c.hearing_date || '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} label={caseStatusLabels[c.status] || c.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                        <span className="text-xs">✎</span>
                      </Button>
                      {(c.status === 'judgment_issued') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => settleCase(c)}
                          title="تسوية واسترداد"
                        >
                          <Banknote className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteCase(c.id)}>
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
            <DialogTitle>{editingId ? 'تعديل قضية' : 'قضية قانونية جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>رقم القضية</Label>
              <Input value={form.case_number} onChange={(e) => setForm({ ...form, case_number: e.target.value })} />
            </div>
            <div>
              <Label>المستأجر *</Label>
              <Input value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })} placeholder="tnt-..." />
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
              <Label>نوع القضية</Label>
              <Select value={form.case_type} onValueChange={(v) => setForm({ ...form, case_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(caseTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المبلغ المطالب به</Label>
              <Input type="number" value={form.claim_amount} onChange={(e) => setForm({ ...form, claim_amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>المحامي</Label>
              <Input value={form.lawyer_name} onChange={(e) => setForm({ ...form, lawyer_name: e.target.value })} />
            </div>
            <div>
              <Label>المحكمة</Label>
              <Input value={form.court_name} onChange={(e) => setForm({ ...form, court_name: e.target.value })} />
            </div>
            <div>
              <Label>تاريخ القيد</Label>
              <Input type="date" value={form.filing_date} onChange={(e) => setForm({ ...form, filing_date: e.target.value })} />
            </div>
            <div>
              <Label>تاريخ الجلسة</Label>
              <Input type="date" value={form.hearing_date} onChange={(e) => setForm({ ...form, hearing_date: e.target.value })} />
            </div>
            <div>
              <Label>تاريخ الحكم</Label>
              <Input type="date" value={form.judgment_date} onChange={(e) => setForm({ ...form, judgment_date: e.target.value })} />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(caseStatusLabels).map(([k, v]) => (
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
