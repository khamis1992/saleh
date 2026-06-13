import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Filter, Pencil, Trash2, RotateCcw, Sparkles, Activity, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, X, Building2, DollarSign } from 'lucide-react';
import { costCenterStore } from '@/services/stores';

const typeLabels: Record<string, string> = { project: 'مشروع', property: 'عقار', department: 'قسم', unit: 'وحدة', other: 'أخرى' };
const typeConfig: Record<string, { dot: string; chip: string }> = {
  project: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  property:{ dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  department:{ dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  unit:   { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  other:  { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};
const emptyForm = { cost_center_code: '', cost_center_name: '', type: 'project' as string, linked_entity: '', status: 'active' as string };

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  const a: Record<string, { iconBg: string; iconColor: string }> = { blue:{ iconBg: 'bg-blue-50', iconColor: 'text-blue-600' }, emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' } }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function CCRow({ cc, onEdit, onDelete }: { cc: any; onEdit: (c: any) => void; onDelete: (c: any) => void }) {
  const tc = typeConfig[cc.type] || typeConfig.other;
  const isActive = cc.status === 'active';
  const getLink = (c: any): string => { if (c.linked_project_id) return `مشروع: ${c.linked_project_id}`; if (c.linked_property_id) return `عقار: ${c.linked_property_id}`; if (c.linked_department_id) return `قسم: ${c.linked_department_id}`; return '—'; };
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900 font-mono">{cc.cost_center_code}</span></td>
      <td className="px-4 py-3"><div><div className="text-sm font-bold text-gray-900">{cc.cost_center_name}</div><div className="text-[11px] text-gray-400">{getLink(cc)}</div></div></td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${tc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${tc.dot}`} />{typeLabels[cc.type]}</span></td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'}`}><span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />{isActive ? 'نشط' : 'غير نشط'}</span></td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(cc)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(cc)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyCC({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Building2 className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد مراكز تكلفة</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function CostCentersPage() {
  const { dir } = useLocale();
  const [search, setSearch] = useState(''); const [typeFilter, setTypeFilter] = useState('all'); const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const centers = useMemo(() => costCenterStore.getAll(), [refresh]);
  const filtered = centers.filter((cc: any) => { if (typeFilter !== 'all' && cc.type !== typeFilter) return false; if (search && !cc.cost_center_name.includes(search) && !cc.cost_center_code.includes(search)) return false; return true; });
  const activeCenters = centers.filter((cc: any) => cc.status === 'active').length;
  const projectCenters = centers.filter((cc: any) => cc.type === 'project').length;
  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (cc: any) => { setEditId(cc.id); let le = ''; if (cc.linked_project_id) le = cc.linked_project_id; else if (cc.linked_property_id) le = cc.linked_property_id; else if (cc.linked_department_id) le = cc.linked_department_id; setForm({ cost_center_code: cc.cost_center_code, cost_center_name: cc.cost_center_name, type: cc.type, linked_entity: le, status: cc.status }); setModalOpen(true); };
  const handleSave = () => {
    if (!form.cost_center_code || !form.cost_center_name) return;
    const data: any = { company_id: '', cost_center_code: form.cost_center_code, cost_center_name: form.cost_center_name, type: form.type, linked_project_id: form.type === 'project' ? form.linked_entity : '', linked_property_id: form.type === 'property' ? form.linked_entity : '', linked_department_id: form.type === 'department' ? form.linked_entity : '', status: form.status };
    if (editId) costCenterStore.update(editId, data); else costCenterStore.create(data);
    setModalOpen(false); setRefresh(r => r + 1);
  };
  const handleDelete = () => { if (!deleteTarget) return; costCenterStore.remove(deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null); setRefresh(r => r + 1); };
  const resetFilters = () => { setSearch(''); setTypeFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm"><Building2 className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">مراكز التكلفة</span><span className="text-[13px] font-bold text-gray-900">{centers.length} مركز</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="me-auto" />
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ إضافة مركز</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي المراكز" value={centers.length} icon={Building2} accent="slate" />
          <KpiCard label="نشطة" value={activeCenters} icon={CheckCircle2} accent="emerald" />
          <KpiCard label="مشاريع" value={projectCenters} icon={TrendingUp} accent="blue" />
          <KpiCard label="عقارات" value={centers.filter(c => c.type === 'property').length} icon={DollarSign} accent="amber" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">مراكز التكلفة</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="النوع" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الأنواع</SelectItem>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyCC onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">كود المركز</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الاسم / الكيان</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">النوع</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map((cc: any) => <CCRow key={cc.id} cc={cc} onEdit={openEdit} onDelete={setDeleteTarget} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {centers.length} مركز</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف مركز التكلفة <strong className="text-gray-900">{deleteTarget.cost_center_name}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل مركز تكلفة' : 'إضافة مركز تكلفة'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>كود المركز *</Label><Input value={form.cost_center_code} onChange={e => setForm(f => ({ ...f, cost_center_code: e.target.value }))} /></div>
            <div><Label>اسم المركز *</Label><Input value={form.cost_center_name} onChange={e => setForm(f => ({ ...f, cost_center_name: e.target.value }))} /></div>
            <div><Label>النوع</Label><Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>الكيان المرتبط</Label><Input value={form.linked_entity} onChange={e => setForm(f => ({ ...f, linked_entity: e.target.value }))} /></div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="inactive">غير نشط</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}