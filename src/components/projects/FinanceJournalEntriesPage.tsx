import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Eye, Pencil, Trash2, Plus, Download, Check, Lock, FileText, X, TrendingUp, TrendingDown, RotateCcw, Sparkles, Activity, CheckCircle2, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { validateJournalEntry, logAudit, exportToCSV } from '@/utils/exportUtils';
import { createStore } from '@/services/dataService';

interface JournalEntryLine { id: string; account_id: string; debit: number; credit: number; description: string; }
interface JournalEntry { id: string; entry_number: string; entry_date: string; description: string; source_module: string; status: 'draft' | 'posted' | 'reversed'; total_debit: number; total_credit: number; lines: JournalEntryLine[]; }

const seedEntries: JournalEntry[] = [
  { id: '1', entry_number: 'JRN-2026-001', entry_date: '2026-01-10', description: 'استلام دفعة إيجار - أحمد العمري', source_module: 'إيجارات', total_debit: 60000, total_credit: 60000, status: 'posted', lines: [] },
  { id: '2', entry_number: 'JRN-2026-002', entry_date: '2026-01-15', description: 'دفع مستخلص مقاول - شركة البناء المتقدمة', source_module: 'مقاولين', total_debit: 850000, total_credit: 850000, status: 'posted', lines: [] },
  { id: '3', entry_number: 'JRN-2026-003', entry_date: '2026-02-01', description: 'شراء مواد بناء - حديد وأسمنت', source_module: 'مشتريات', total_debit: 120000, total_credit: 120000, status: 'posted', lines: [] },
  { id: '4', entry_number: 'JRN-2026-004', entry_date: '2026-03-01', description: 'إصدار فواتير إيجار شهر مارس', source_module: 'إيجارات', total_debit: 165600, total_credit: 165600, status: 'draft', lines: [] },
  { id: '5', entry_number: 'JRN-2026-005', entry_date: '2026-03-15', description: 'صيانة وحدة A-101 - سباكة', source_module: 'صيانة', total_debit: 2500, total_credit: 2500, status: 'posted', lines: [] },
];

const entryStore = createStore<JournalEntry>({ key: 'erp_journal_entries', seed: seedEntries });

const statusConfig: Record<string, { dot: string; chip: string }> = {
  draft:    { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  posted:   { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  reversed: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};
const fmt = formatQAR;

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  const a: Record<string, { iconBg: string; iconColor: string }> = { emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, blue:{ iconBg: 'bg-blue-50', iconColor: 'text-blue-600' }, slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' } }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

export default function FinanceJournalEntriesPage() {
  const [refresh, setRefresh] = useState(0); const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false); const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<JournalEntry>>({ entry_number: '', entry_date: '', description: '', source_module: '', status: 'draft', total_debit: 0, total_credit: 0, lines: [] });
  const [lines, setLines] = useState<{ account_id: string; debit: number; credit: number; description: string }[]>([{ account_id: '', debit: 0, credit: 0, description: '' }, { account_id: '', debit: 0, credit: 0, description: '' }]);

  const entries = useMemo(() => entryStore.getAll(), [refresh]);
  const filtered = useMemo(() => entries.filter(e => { if (search && !e.entry_number.includes(search) && !e.description.includes(search)) return false; return true; }), [entries, search]);
  const validation = useMemo(() => validateJournalEntry(lines), [lines]);

  const handleCopyCode = (code: string) => { navigator.clipboard.writeText(code).then(() => toast.success('تم نسخ رقم القيد')); };
  function handleCreate() { setEditingId(null); setForm({ entry_number: `JRN-${new Date().getFullYear()}-${String(entries.length + 1).padStart(3, '0')}`, entry_date: new Date().toISOString().split('T')[0], description: '', source_module: '', status: 'draft' }); setLines([{ account_id: '', debit: 0, credit: 0, description: '' }, { account_id: '', debit: 0, credit: 0, description: '' }]); setDialogOpen(true); }
  function handleEdit(entry: JournalEntry) { if (entry.status === 'posted') { toast.error('لا يمكن تعديل قيد مرحل'); return; } setEditingId(entry.id); setForm({ ...entry }); setLines((entry.lines && entry.lines.length > 0) ? entry.lines.map(l => ({ account_id: l.account_id, debit: l.debit, credit: l.credit, description: l.description })) : [{ account_id: '', debit: 0, credit: 0, description: '' }, { account_id: '', debit: 0, credit: 0, description: '' }]); setDialogOpen(true); }
  function addLine() { setLines([...lines, { account_id: '', debit: 0, credit: 0, description: '' }]); }
  function removeLine(idx: number) { if (lines.length <= 2) return; setLines(lines.filter((_, i) => i !== idx)); }
  function updateLine(idx: number, field: string, value: string | number) { const u = [...lines]; u[idx] = { ...u[idx], [field]: value }; setLines(u); }
  function handleSave() { if (!validation.valid) { toast.error(validation.error || 'خطأ في القيد'); return; } const je = { ...form, total_debit: validation.totalDebit, total_credit: validation.totalCredit, lines: lines.map((l, i) => ({ id: String(i + 1), ...l })) }; if (editingId) entryStore.update(editingId, je as any); else entryStore.create(je as any); setRefresh(r => r + 1); setDialogOpen(false); toast.success(editingId ? 'تم تعديل القيد' : 'تم إنشاء القيد'); }
  const handleExport = () => { const sl: Record<string, string> = { draft: 'مسودة', posted: 'مرحّل', reversed: 'معكوس' }; exportToCSV(filtered.map(e => ({ 'رقم القيد': e.entry_number, 'التاريخ': e.entry_date, 'الوصف': e.description, 'المصدر': e.source_module, 'مدين': e.total_debit, 'دائن': e.total_credit, 'الحالة': sl[e.status] || e.status })), [{ key: 'رقم القيد', label: 'رقم القيد' }, { key: 'التاريخ', label: 'التاريخ' }, { key: 'الوصف', label: 'الوصف' }, { key: 'المصدر', label: 'المصدر' }, { key: 'مدين', label: 'مدين' }, { key: 'دائن', label: 'دائن' }, { key: 'الحالة', label: 'الحالة' }], 'القيود_اليومية.csv'); };
  function handlePost(id: string) { const entry = entryStore.getById(id); if (!entry || entry.status === 'posted') { toast.error('القيد مرحل بالفعل'); return; } entryStore.update(id, { status: 'posted' } as any); logAudit('post', 'journal_entries', id, 'draft', 'posted'); setRefresh(r => r + 1); toast.success('تم ترحيل القيد'); }
  const handleDelete = () => { if (!deleteTarget) return; if (deleteTarget.status === 'posted') { toast.error('لا يمكن حذف قيد مرحل'); setDeleteTarget(null); return; } entryStore.remove(deleteTarget.id); toast.success(`تم حذف ${deleteTarget.entry_number}`); setDeleteTarget(null); setRefresh(r => r + 1); };

  const totalPosted = entries.filter(e => e.status === 'posted').length;
  const totalDraft = entries.filter(e => e.status === 'draft').length;

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm"><FileText className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">قيود اليومية</span><span className="text-[13px] font-bold text-gray-900">{entries.length} قيد</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="me-auto" />
          <Button onClick={handleExport} disabled={filtered.length === 0} className="h-8 px-3 gap-1.5 text-[11px] font-bold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"><Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">CSV</span></Button>
          <Button onClick={handleCreate} className="h-8 px-3 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><Plus className="h-3.5 w-3.5" /><span>قيد جديد</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي القيود" value={entries.length} icon={FileText} accent="slate" />
          <KpiCard label="مرحلة" value={totalPosted} icon={CheckCircle2} accent="emerald" />
          <KpiCard label="مسودات" value={totalDraft} icon={Clock} accent="amber" />
          <KpiCard label="إجمالي المبالغ" value={fmt(entries.reduce((s, e) => s + e.total_debit, 0))} icon={DollarSign} accent="blue" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">قيود اليومية</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setSearch('')} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><FileText className="h-8 w-8 text-gray-300" /></div>
            <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد قيود يومية</p></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رقم القيد</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التاريخ</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الوصف</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المصدر</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">مدين</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">دائن</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[120px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map(e => {
                  const sc = statusConfig[e.status] || statusConfig.draft;
                  return (
                    <tr key={e.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${e.status === 'posted' ? 'opacity-75' : ''}`}>
                      <td className="px-4 py-3"><Tooltip><TooltipTrigger asChild><button onClick={ev => { ev.stopPropagation(); handleCopyCode(e.entry_number); }} className="font-mono text-xs text-emerald-600 hover:text-emerald-700 transition-colors">{e.entry_number}</button></TooltipTrigger><TooltipContent>اضغط للنسخ</TooltipContent></Tooltip></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{e.entry_date}</td>
                      <td className="px-4 py-3 text-xs text-gray-800 max-w-[200px] truncate">{e.description}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{e.source_module}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(e.total_debit)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(e.total_credit)}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${sc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{e.status === 'posted' ? 'مرحل' : e.status === 'reversed' ? 'معكوس' : 'مسودة'}</span></td>
                      <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {e.status === 'posted' ? (
                            <Tooltip><TooltipTrigger asChild><span className="h-7 w-7 rounded-md text-gray-300 flex items-center justify-center"><Lock className="h-3.5 w-3.5" /></span></TooltipTrigger><TooltipContent>قيد مرحل</TooltipContent></Tooltip>
                          ) : (
                            <>
                              <Tooltip><TooltipTrigger asChild><button onClick={() => handleEdit(e)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
                              <Tooltip><TooltipTrigger asChild><button onClick={() => handlePost(e.id)} className="h-7 w-7 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center"><Check className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>ترحيل</TooltipContent></Tooltip>
                              <Tooltip><TooltipTrigger asChild><button onClick={() => { if (e.status === 'posted') { toast.error('لا يمكن حذف قيد مرحل'); return; } setDeleteTarget(e); }} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {entries.length} قيد</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف القيد <strong className="text-gray-900">{deleteTarget.entry_number}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editingId ? 'تعديل قيد يومية' : 'قيد يومية جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>رقم القيد</Label><Input value={form.entry_number} onChange={e => setForm({ ...form, entry_number: e.target.value })} /></div>
              <div><Label>التاريخ</Label><Input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} /></div>
              <div className="col-span-2"><Label>البيان</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>المصدر</Label><Select value={form.source_module} onValueChange={v => setForm({ ...form, source_module: v })}><SelectTrigger><SelectValue placeholder="اختر المصدر" /></SelectTrigger><SelectContent><SelectItem value="إيجارات">إيجارات</SelectItem><SelectItem value="مقاولين">مقاولين</SelectItem><SelectItem value="مشتريات">مشتريات</SelectItem><SelectItem value="صيانة">صيانة</SelectItem><SelectItem value="عام">عام</SelectItem></SelectContent></Select></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label className="font-semibold">بنود القيد</Label><Button variant="outline" size="sm" onClick={addLine}>+ إضافة بند</Button></div>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted"><tr><th className="text-right p-2">رقم الحساب</th><th className="text-right p-2">البيان</th><th className="text-center p-2 w-32">مدين</th><th className="text-center p-2 w-32">دائن</th><th className="w-10"></th></tr></thead>
                  <tbody>{lines.map((line, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-1"><Input className="h-8 text-sm" value={line.account_id} onChange={e => updateLine(i, 'account_id', e.target.value)} /></td>
                      <td className="p-1"><Input className="h-8 text-sm" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} /></td>
                      <td className="p-1"><Input className="h-8 text-sm text-center" type="number" min={0} value={line.debit || ''} onChange={e => updateLine(i, 'debit', Number(e.target.value))} /></td>
                      <td className="p-1"><Input className="h-8 text-sm text-center" type="number" min={0} value={line.credit || ''} onChange={e => updateLine(i, 'credit', Number(e.target.value))} /></td>
                      <td className="p-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => removeLine(i)} disabled={lines.length <= 2}>✕</Button></td>
                    </tr>
                  ))}</tbody>
                  <tfoot className="bg-muted/50 font-bold">
                    <tr><td colSpan={2} className="p-2 text-right">المجموع</td><td className="p-2 text-center">{fmt(validation.totalDebit)}</td><td className="p-2 text-center">{fmt(validation.totalCredit)}</td><td></td></tr>
                    <tr><td colSpan={2} className="p-2 text-right">الفرق</td><td colSpan={2} className={`p-2 text-center ${validation.valid ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(Math.abs(validation.totalDebit - validation.totalCredit))}{!validation.valid && <span className="mr-2 text-xs">({validation.error})</span>}</td><td></td></tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSave} disabled={!validation.valid} className="bg-emerald-500 hover:bg-emerald-600 text-white">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}