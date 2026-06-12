import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter, Eye, Trash2, TrendingUp, ArrowUp, ArrowDown, RotateCcw, Sparkles, Activity, CheckCircle2, Clock, AlertTriangle, HardHat, CalendarDays, ArrowRight, TrendingDown, X } from 'lucide-react';
import { projectStore, getProjectName } from '@/services/stores';
import { createStore } from '@/services/dataService';
import type { ProjectProgressUpdate } from '@/types';

const seedProgressUpdates: ProjectProgressUpdate[] = [
  { id: 'pu-1', company_id: '', project_id: 'prj-1', phase_id: 'phase-1', update_date: '2025-01-20', previous_progress: 40, new_progress: 50, progress_change: 10, description: 'استكمال صب الهيكل الخرساني للطابقين الأول والثاني - بدء أعمال الطوب واللياسة', issues: '', photos_count: 5, submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-01-21', created_at: '2025-01-20', updated_at: '2025-01-21', is_active: true },
  { id: 'pu-2', company_id: '', project_id: 'prj-1', phase_id: 'phase-2', update_date: '2025-03-15', previous_progress: 65, new_progress: 75, progress_change: 10, description: 'الانتهاء من تمديدات الكهرباء والسباكة - بدء أعمال التشطيبات الداخلية', issues: 'تأخر توريد السيراميك أسبوع', photos_count: 8, submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-03-16', created_at: '2025-03-15', updated_at: '2025-03-16', is_active: true },
  { id: 'pu-3', company_id: '', project_id: 'prj-2', phase_id: 'phase-3', update_date: '2025-04-10', previous_progress: 30, new_progress: 45, progress_change: 15, description: 'صب الأعمدة والجسور للطوابق 3-5 - تجهيز حديد الطوابق 6-7', issues: '', photos_count: 12, submitted_by: '', approval_status: 'pending', approved_by: '', approved_at: '', created_at: '2025-04-10', updated_at: '2025-04-10', is_active: true },
  { id: 'pu-4', company_id: '', project_id: 'prj-3', phase_id: 'phase-4', update_date: '2025-07-01', previous_progress: 20, new_progress: 32, progress_change: 12, description: 'استكمال صب الأساسات - بدء تركيب الهيكل المعدني', issues: 'تحديات في منسوب المياه الجوفية - تم تركيب مضخات إضافية', photos_count: 6, submitted_by: '', approval_status: 'returned', approved_by: '', approved_at: '', created_at: '2025-07-01', updated_at: '2025-07-05', is_active: true },
];

const progressStore = createStore<ProjectProgressUpdate>({ key: 'erp_progress_updates', seed: seedProgressUpdates });

const phaseNames: Record<string, string> = { 'phase-1': 'المرحلة الأولى - الهيكل الخرساني', 'phase-2': 'المرحلة الثانية - التشطيبات', 'phase-3': 'المرحلة الثالثة - الهيكل الإنشائي', 'phase-4': 'المرحلة الرابعة - الأساسات' };
const approvalLabels: Record<string, string> = { pending: 'معلق', approved: 'معتمد', rejected: 'مرفوض', returned: 'مرتجع' };
const approvalConfig: Record<string, { dot: string; chip: string }> = {
  pending:  { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  approved: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  rejected: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  returned: { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
};
interface ProgressForm { project_id: string; phase_id: string; update_date: string; previous_progress: number; new_progress: number; description: string; issues: string; approval_status: ProjectProgressUpdate['approval_status']; }
const emptyForm: ProgressForm = { project_id: '', phase_id: '', update_date: new Date().toISOString().split('T')[0], previous_progress: 0, new_progress: 0, description: '', issues: '', approval_status: 'pending' };

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

function ProgressRow({ pu, onEdit, onDelete }: { pu: ProjectProgressUpdate; onEdit: (p: ProjectProgressUpdate) => void; onDelete: (id: string) => void }) {
  const ac = approvalConfig[pu.approval_status] || approvalConfig.pending;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{getProjectName(pu.project_id)}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{phaseNames[pu.phase_id] || pu.phase_id}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{pu.update_date}</td>
      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gray-300 rounded-full" style={{ width: `${pu.previous_progress}%` }} /></div><span className="text-[11px] text-gray-500 ltr-only tabular-nums">{pu.previous_progress}%</span></div></td>
      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${pu.new_progress}%` }} /></div><span className="text-[11px] font-bold text-gray-800 ltr-only tabular-nums">{pu.new_progress}%</span></div></td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-[11px] font-bold ${pu.progress_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{pu.progress_change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{pu.progress_change >= 0 ? '+' : ''}{pu.progress_change}%</span></td>
      <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px] truncate" title={pu.description}>{pu.description}</td>
      <td className="px-4 py-3">{pu.issues ? <span className="text-xs text-amber-600 font-medium max-w-[100px] truncate block" title={pu.issues}>{pu.issues}</span> : <span className="text-xs text-emerald-500">—</span>}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${ac.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${ac.dot}`} />{approvalLabels[pu.approval_status]}</span></td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(pu)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>عرض / تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(pu.id)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyProgress({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><TrendingUp className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد تحديثات تقدم</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function ProgressUpdatesPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const projectName = searchParams.get('projectName') || '';
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgressForm>(emptyForm);

  const updates = useMemo(() => progressStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);

  const filtered = useMemo(() => updates.filter(u => { if (projectId && u.project_id !== projectId) return false; if (statusFilter !== 'all' && u.approval_status !== statusFilter) return false; if (search && !u.description.includes(search)) return false; return true; }), [updates, search, statusFilter, projectId]);

  const approvedCount = updates.filter(u => u.approval_status === 'approved').length;
  const pendingCount = updates.filter(u => u.approval_status === 'pending').length;
  const avgProgress = updates.length > 0 ? Math.round(updates.reduce((s, u) => s + u.progress_change, 0) / updates.length) : 0;

  function handleCreate() { setEditingId(null); setForm({ ...emptyForm, update_date: new Date().toISOString().split('T')[0] }); setDialogOpen(true); }
  function handleEdit(pu: ProjectProgressUpdate) { setEditingId(pu.id); setForm({ project_id: pu.project_id, phase_id: pu.phase_id, update_date: pu.update_date, previous_progress: pu.previous_progress, new_progress: pu.new_progress, description: pu.description, issues: pu.issues, approval_status: pu.approval_status }); setDialogOpen(true); }
  function handleProjectChange(pid: string) { const pu = updates.filter(u => u.project_id === pid).sort((a, b) => b.update_date.localeCompare(a.update_date)); setForm(prev => ({ ...prev, project_id: pid, previous_progress: pu.length > 0 ? pu[0].new_progress : 0 })); }
  function handleSave() {
    if (!form.project_id || !form.phase_id) return;
    const pc = Math.max(0, form.new_progress - form.previous_progress);
    const data = { ...form, progress_change: pc, photos_count: 0, company_id: '', submitted_by: '', approved_by: '', approved_at: form.approval_status === 'approved' ? new Date().toISOString() : '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true };
    if (editingId) progressStore.update(editingId, data as any); else progressStore.create(data as any);
    setDialogOpen(false); setRefresh(r => r + 1);
  }
  const handleDelete = (id: string) => { progressStore.remove(id); setRefresh(r => r + 1); };
  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm"><TrendingUp className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">التقدم</span><span className="text-[13px] font-bold text-gray-900">{updates.length} تحديث</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في الوصف..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500"><span>متوسط التغيير:</span><span className="font-bold text-emerald-600 ltr-only tabular-nums">+{avgProgress}%</span></div>
          <div className="me-auto" />
          <Button onClick={handleCreate} className="h-8 px-3 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ إضافة تحديث</span></Button>
        </div>
      </div>

      {projectId && (
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <HardHat className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700 font-medium">المشروع: {decodeURIComponent(projectName)}</span>
            <span className="text-[10px] text-emerald-400">({projectId})</span>
          </div>
        </div>
      )}

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي التحديثات" value={updates.length} icon={Activity} accent="slate" />
          <KpiCard label="معتمدة" value={approvedCount} icon={CheckCircle2} accent="emerald" />
          <KpiCard label="معلقة" value={pendingCount} icon={Clock} accent="amber" />
          <KpiCard label="متوسط التغيير" value={`+${avgProgress}%`} icon={TrendingUp} accent="blue" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">تحديثات تقدم المشاريع</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="حالة الاعتماد" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الحالات</SelectItem><SelectItem value="pending">معلق</SelectItem><SelectItem value="approved">معتمد</SelectItem><SelectItem value="returned">مرتجع</SelectItem><SelectItem value="rejected">مرفوض</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyProgress onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المشروع</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المرحلة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التاريخ</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التقدم السابق</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التقدم الجديد</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التغيير</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الوصف</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">مشاكل</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map(pu => <ProgressRow key={pu.id} pu={pu} onEdit={handleEdit} onDelete={handleDelete} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {updates.length} تحديث</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" />{editingId ? 'تعديل تحديث تقدم' : 'إضافة تحديث تقدم جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>المشروع</Label><Select value={form.project_id} onValueChange={handleProjectChange}><SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger><SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>المرحلة</Label><Select value={form.phase_id} onValueChange={v => setForm({ ...form, phase_id: v })}><SelectTrigger><SelectValue placeholder="اختر المرحلة" /></SelectTrigger><SelectContent>{Object.entries(phaseNames).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>تاريخ التحديث</Label><Input type="date" value={form.update_date} onChange={e => setForm({ ...form, update_date: e.target.value })} /></div>
              <div><Label>حالة الاعتماد</Label><Select value={form.approval_status} onValueChange={(v: any) => setForm({ ...form, approval_status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">معلق</SelectItem><SelectItem value="approved">معتمد</SelectItem><SelectItem value="returned">مرتجع</SelectItem><SelectItem value="rejected">مرفوض</SelectItem></SelectContent></Select></div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-bold text-sm">مقارنة التقدم</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3"><span className="text-xs w-24">التقدم السابق</span><div className="flex-1 bg-gray-200 rounded-full h-2.5"><div className="bg-gray-400 h-2.5 rounded-full" style={{ width: `${form.previous_progress}%` }} /></div><span className="text-xs font-mono w-12 text-right">{form.previous_progress}%</span></div>
                <div className="flex items-center gap-3"><span className="text-xs w-24">التقدم الجديد</span><div className="flex-1 bg-gray-200 rounded-full h-2.5"><div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-full" style={{ width: `${form.new_progress}%` }} /></div><span className="text-xs font-mono font-bold w-12 text-right">{form.new_progress}%</span></div>
              </div>
              <div className="flex justify-between text-xs"><span>نسبة التغيير</span><span className={`font-bold ${form.new_progress >= form.previous_progress ? 'text-emerald-600' : 'text-rose-600'}`}>{form.new_progress - form.previous_progress > 0 ? '+' : ''}{form.new_progress - form.previous_progress}%</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>التقدم السابق (%)</Label><Input type="number" value={form.previous_progress} onChange={e => setForm({ ...form, previous_progress: Number(e.target.value) })} min={0} max={100} /></div>
              <div><Label>التقدم الجديد (%)</Label><Input type="number" value={form.new_progress} onChange={e => setForm({ ...form, new_progress: Number(e.target.value) })} min={0} max={100} /></div>
            </div>
            <div><Label>وصف التحديث</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div><Label>المشاكل والمعوقات</Label><Textarea value={form.issues} onChange={e => setForm({ ...form, issues: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}