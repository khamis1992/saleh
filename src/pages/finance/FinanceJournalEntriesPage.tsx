import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Filter, Eye, Pencil, Trash2, Plus, Download, Check, Lock, FileText, X } from 'lucide-react';
import { validateJournalEntry, logAudit, exportToCSV } from '@/utils/exportUtils';
import { createStore } from '@/services/dataService';

interface JournalEntryLine {
  id: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string;
}

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  source_module: string;
  status: 'draft' | 'posted' | 'reversed';
  total_debit: number;
  total_credit: number;
  lines: JournalEntryLine[];
}

const seedEntries: JournalEntry[] = [
  { id: '1', entry_number: 'JRN-2026-001', entry_date: '2026-01-10', description: 'استلام دفعة إيجار - أحمد العمري', source_module: 'إيجارات', total_debit: 60000, total_credit: 60000, status: 'posted', lines: [] },
  { id: '2', entry_number: 'JRN-2026-002', entry_date: '2026-01-15', description: 'دفع مستخلص مقاول - شركة البناء المتقدمة', source_module: 'مقاولين', total_debit: 850000, total_credit: 850000, status: 'posted', lines: [] },
  { id: '3', entry_number: 'JRN-2026-003', entry_date: '2026-02-01', description: 'شراء مواد بناء - حديد وأسمنت', source_module: 'مشتريات', total_debit: 120000, total_credit: 120000, status: 'posted', lines: [] },
  { id: '4', entry_number: 'JRN-2026-004', entry_date: '2026-03-01', description: 'إصدار فواتير إيجار شهر مارس', source_module: 'إيجارات', total_debit: 165600, total_credit: 165600, status: 'draft', lines: [] },
  { id: '5', entry_number: 'JRN-2026-005', entry_date: '2026-03-15', description: 'صيانة وحدة A-101 - سباكة', source_module: 'صيانة', total_debit: 2500, total_credit: 2500, status: 'posted', lines: [] },
];

const entryStore = createStore<JournalEntry>({ key: 'erp_journal_entries', seed: seedEntries });

export default function FinanceJournalEntriesPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<JournalEntry>>({
    entry_number: '', entry_date: '', description: '', source_module: '', status: 'draft',
    total_debit: 0, total_credit: 0, lines: [],
  });
  const [lines, setLines] = useState<{ account_id: string; debit: number; credit: number; description: string }[]>([
    { account_id: '', debit: 0, credit: 0, description: '' },
    { account_id: '', debit: 0, credit: 0, description: '' },
  ]);

  const entries = useMemo(() => {
    const data = entryStore.getAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);
  const fmt = (v: number) => formatQAR(v);

  const filtered = useMemo(() => entries.filter((e) => {
    if (search && !e.entry_number.includes(search) && !e.description.includes(search)) return false;
    return true;
  }), [entries, search]);

  const validation = useMemo(() => {
    return validateJournalEntry(lines);
  }, [lines]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ رقم القيد');
    });
  };

  function handleCreate() {
    setEditingId(null);
    setForm({
      entry_number: `JRN-${new Date().getFullYear()}-${String(entries.length + 1).padStart(3, '0')}`,
      entry_date: new Date().toISOString().split('T')[0],
      description: '', source_module: '', status: 'draft',
    });
    setLines([
      { account_id: '', debit: 0, credit: 0, description: '' },
      { account_id: '', debit: 0, credit: 0, description: '' },
    ]);
    setDialogOpen(true);
  }

  function handleEdit(entry: JournalEntry) {
    if (entry.status === 'posted') {
      toast.error('لا يمكن تعديل قيد مرحل');
      return;
    }
    setEditingId(entry.id);
    setForm({ ...entry });
    setLines((entry.lines && entry.lines.length > 0) ? entry.lines.map(l => ({
      account_id: l.account_id, debit: l.debit, credit: l.credit, description: l.description,
    })) : [
      { account_id: '', debit: 0, credit: 0, description: '' },
      { account_id: '', debit: 0, credit: 0, description: '' },
    ]);
    setDialogOpen(true);
  }

  function addLine() {
    setLines([...lines, { account_id: '', debit: 0, credit: 0, description: '' }]);
  }

  function removeLine(idx: number) {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: string, value: string | number) {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  }

  function handleSave() {
    if (!validation.valid) {
      toast.error(validation.error || 'خطأ في القيد');
      return;
    }

    const totalDebit = validation.totalDebit;
    const totalCredit = validation.totalCredit;

    const fullEntry = {
      ...form,
      total_debit: totalDebit,
      total_credit: totalCredit,
      lines: lines.map((l, i) => ({ id: String(i + 1), ...l })),
    };

    if (editingId) {
      entryStore.update(editingId, fullEntry as any);
      toast.success('تم تعديل القيد بنجاح');
    } else {
      entryStore.create(fullEntry as Omit<JournalEntry, 'id'>);
      toast.success('تم إنشاء القيد بنجاح');
    }
    setRefresh(r => r + 1);
    setDialogOpen(false);
  }

  const handleExport = () => {
    const statusLabels: Record<string, string> = {
      draft: 'مسودة', posted: 'مرحّل', reversed: 'معكوس',
    };
    const data = filtered.map((e) => ({
      'رقم القيد': e.entry_number,
      'التاريخ': e.entry_date,
      'الوصف': e.description,
      'المصدر': e.source_module,
      'إجمالي مدين': e.total_debit,
      'إجمالي دائن': e.total_credit,
      'الحالة': statusLabels[e.status] || e.status,
    }));
    exportToCSV(data, [
      { key: 'رقم القيد', label: 'رقم القيد' },
      { key: 'التاريخ', label: 'التاريخ' },
      { key: 'الوصف', label: 'الوصف' },
      { key: 'المصدر', label: 'المصدر' },
      { key: 'إجمالي مدين', label: 'إجمالي مدين' },
      { key: 'إجمالي دائن', label: 'إجمالي دائن' },
      { key: 'الحالة', label: 'الحالة' },
    ], 'القيود_اليومية.csv');
  };

  function handlePost(id: string) {
    const entry = entryStore.getById(id);
    if (!entry) return;
    if (entry.status === 'posted') {
      toast.error('القيد مرحل بالفعل');
      return;
    }
    const postLines = entry.lines && entry.lines.length > 0
      ? entry.lines
      : [{ account_id: '', debit: entry.total_debit, credit: entry.total_credit, description: '' }];
    const v = validateJournalEntry(postLines as any);
    if (!v.valid) {
      toast.error('لا يمكن ترحيل القيد: ' + (v.error || ''));
      return;
    }
    entryStore.update(id, { status: 'posted' } as any);
    logAudit('post', 'journal_entries', id, 'draft', 'posted');
    setRefresh(r => r + 1);
    toast.success('تم ترحيل القيد بنجاح');
  }

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.status === 'posted') {
      toast.error('لا يمكن حذف قيد مرحل');
      setDeleteTarget(null);
      return;
    }
    entryStore.remove(deleteTarget.id);
    toast.success(`تم حذف القيد ${deleteTarget.entry_number} بنجاح`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  };

  const confirmDelete = (entry: JournalEntry) => {
    if (entry.status === 'posted') {
      toast.error('لا يمكن حذف قيد مرحل');
      return;
    }
    setDeleteTarget(entry);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.finance.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} قيد — {t.finance.journalEntries}
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          قيد جديد
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t.common.search + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="h-9 w-9 rounded-lg"
            title="تصدير CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
          {search && (
            <span className="text-xs text-gray-400">{filtered.length} نتيجة</span>
          )}
        </div>
      </div>

      {/* Table Card */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow >
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.finance.entryNumber}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.finance.entryDate}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.finance.description}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.finance.source}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.finance.totalDebit}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.finance.totalCredit}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.common.status}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[130px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <FileText className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد قيود يومية</p>
                        <p className="text-xs text-gray-400">لم يتم العثور على أي نتائج</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearch('')}
                          className="h-8 text-xs rounded-lg mt-1"
                        >
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((e: any) => (
                  <TableRow
                    key={e.id}
                    className={` ${e.status === 'posted' ? 'opacity-75' : ''}`}
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); handleCopyCode(e.entry_number); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {e.entry_number}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{e.entry_date}</TableCell>
                    <TableCell className="text-sm text-gray-800">{e.description}</TableCell>
                    <TableCell className="text-sm text-gray-600">{e.source_module}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-700">{fmt(e.total_debit)}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-700">{fmt(e.total_credit)}</TableCell>
                    <TableCell><StatusBadge status={e.status} label={e.status === 'posted' ? 'مرحل' : e.status === 'reversed' ? 'معكوس' : 'مسودة'} /></TableCell>
                    <TableCell onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {e.status === 'posted' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400" disabled>
                                <Lock className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>قيد مرحل - لا يمكن التعديل</TooltipContent>
                          </Tooltip>
                        ) : (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => handleEdit(e)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>تعديل</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50" onClick={() => handlePost(e.id)}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>ترحيل</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => confirmDelete(e)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>حذف</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 0 && (
            <div className="py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-gray-500">عرض {filtered.length} من {entries.length} قيد</span>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف القيد <strong>{deleteTarget?.entry_number}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل قيد يومية' : 'قيد يومية جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم القيد</Label>
                <Input value={form.entry_number} onChange={(e) => setForm({ ...form, entry_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ القيد</Label>
                <Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>البيان</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>المصدر</Label>
                <Select value={form.source_module} onValueChange={(v) => setForm({ ...form, source_module: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر المصدر" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="إيجارات">إيجارات</SelectItem>
                    <SelectItem value="مقاولين">مقاولين</SelectItem>
                    <SelectItem value="مشتريات">مشتريات</SelectItem>
                    <SelectItem value="صيانة">صيانة</SelectItem>
                    <SelectItem value="عام">عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">بنود القيد</Label>
                <Button variant="outline" size="sm" onClick={addLine}>+ إضافة بند</Button>
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right p-2">رقم الحساب</th>
                      <th className="text-right p-2">البيان</th>
                      <th className="text-center p-2 w-32">مدين (ر.ق)</th>
                      <th className="text-center p-2 w-32">دائن (ر.ق)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-1">
                          <Input className="h-8 text-sm" value={line.account_id} onChange={(e) => updateLine(i, 'account_id', e.target.value)} placeholder="حساب" />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm" value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)} placeholder="بيان" />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm text-center" type="number" min={0} value={line.debit || ''} onChange={(e) => updateLine(i, 'debit', Number(e.target.value))} />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm text-center" type="number" min={0} value={line.credit || ''} onChange={(e) => updateLine(i, 'credit', Number(e.target.value))} />
                        </td>
                        <td className="p-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => removeLine(i)} disabled={lines.length <= 2}>✕</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 font-bold">
                    <tr>
                      <td colSpan={2} className="p-2 text-right">المجموع</td>
                      <td className="p-2 text-center">{fmt(validation.totalDebit)}</td>
                      <td className="p-2 text-center">{fmt(validation.totalCredit)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="p-2 text-right">الفرق</td>
                      <td colSpan={2} className={`p-2 text-center ${validation.valid ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(Math.abs(validation.totalDebit - validation.totalCredit))}
                        {!validation.valid && <span className="mr-2 text-xs">({validation.error})</span>}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleSave} disabled={!validation.valid}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}