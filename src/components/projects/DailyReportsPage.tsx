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
import { Search, Filter, Eye, Trash2, ClipboardList, Users, AlertTriangle, HardHat, TrendingUp, TrendingDown, RotateCcw, Sparkles, CheckCircle2, Clock, Activity, Cloud, ArrowRight, X } from 'lucide-react';
import { projectStore, getProjectName, dailyReportStore } from '@/services/stores';
import type { ProjectDailyReport } from '@/types';

const approvalLabels: Record<string, string> = { draft: 'مسودة', submitted: 'مقدم', approved: 'معتمد', returned: 'مرتجع', rejected: 'مرفوض' };
const approvalConfig: Record<string, { dot: string; chip: string }> = {
  draft:    { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  submitted:{ dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  approved: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  returned: { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  rejected: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};
const weatherIcons: Record<string, string> = { 'مشمس': '☀️', 'غائم': '☁️', 'غائم جزئياً': '⛅', 'ممطر': '🌧️', 'عاصف': '🌪️' };

interface ReportForm { report_number: string; project_id: string; report_date: string; weather_condition: string; manpower_count: number; equipment_on_site: string; work_completed_today: string; planned_work_tomorrow: string; issues_encountered: string; safety_incidents: string; materials_received: string; delay_reason: string; approval_status: ProjectDailyReport['approval_status']; notes: string; }
const emptyForm: ReportForm = { report_number: '', project_id: '', report_date: new Date().toISOString().split('T')[0], weather_condition: 'مشمس', manpower_count: 0, equipment_on_site: '', work_completed_today: '', planned_work_tomorrow: '', issues_encountered: '', safety_incidents: 'لا يوجد', materials_received: '', delay_reason: '', approval_status: 'draft', notes: '' };

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  const a: Record<string, { iconBg: string; iconColor: string }> = { blue:{ iconBg: 'bg-blue-50', iconColor: 'text-blue-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' } }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function ReportRow({ r, onEdit, onDelete }: { r: ProjectDailyReport; onEdit: (r: ProjectDailyReport) => void; onDelete: (id: string) => void }) {
  const ac = approvalConfig[r.approval_status] || approvalConfig.draft;
  const hasIssues = r.issues_encountered || r.safety_incidents !== 'لا يوجد';
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900 font-mono">{r.report_number}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{getProjectName(r.project_id)}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{r.report_date}</td>
      <td className="px-4 py-3"><span className="text-xs">{weatherIcons[r.weather_condition] || '🌤️'} {r.weather_condition}</span></td>
      <td className="px-4 py-3"><span className="flex items-center gap-1 text-xs text-gray-600"><Users className="h-3 w-3" />{r.manpower_count}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600 max-w-[120px] truncate" title={r.equipment_on_site}>{r.equipment_on_site || '—'}</td>
      <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px] truncate" title={r.work_completed_today}>{r.work_completed_today}</td>
      <td className="px-4 py-3">{hasIssues ? <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" />{r.issues_encountered || r.safety_incidents}</span> : <span className="text-xs text-emerald-500">—</span>}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${ac.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${ac.dot}`} />{approvalLabels[r.approval_status]}</span></td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(r)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>عرض / تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(r.id)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyReports({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><ClipboardList className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد تقارير</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function DailyReportsPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const projectName = searchParams.get('projectName') || '';
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReportForm>(emptyForm);

  const reports = useMemo(() => dailyReportStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);

  const filtered = useMemo(() => reports.filter(r => { if (projectId && r.project_id !== projectId) return false; if (statusFilter !== 'all' && r.approval_status !== statusFilter) return false; if (search && !r.report_number.includes(search) && !r.work_completed_today.includes(search)) return false; return true; }), [reports, search, statusFilter, projectId]);

  const approvedCount = reports.filter(r => r.approval_status === 'approved').length;
  const submittedCount = reports.filter(r => r.approval_status === 'submitted').length;
  const totalWorkers = reports.reduce((s, r) => s + (r.manpower_count || 0), 0);

  function handleCreate() { setEditingId(null); setForm({ ...emptyForm, report_date: new Date().toISOString().split('T')[0] }); setDialogOpen(true); }
  function handleEdit(r: ProjectDailyReport) { setEditingId(r.id); setForm({ report_number: r.report_number, project_id: r.project_id, report_date: r.report_date, weather_condition: r.weather_condition, manpower_count: r.manpower_count, equipment_on_site: r.equipment_on_site, work_completed_today: r.work_completed_today, planned_work_tomorrow: r.planned_work_tomorrow, issues_encountered: r.issues_encountered, safety_incidents: r.safety_incidents, materials_received: r.materials_received, delay_reason: r.delay_reason, approval_status: r.approval_status, notes: r.notes }); setDialogOpen(true); }
  function handleSave() {
    if (!form.project_id || !form.report_date) return;
    const data = { ...form, company_id: '', submitted_by: '', approved_by: '', approved_at: form.approval_status === 'approved' ? new Date().toISOString() : '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true };
    if (editingId) dailyReportStore.update(editingId, data as any); else dailyReportStore.create(data as any);
    setDialogOpen(false); setRefresh(r => r + 1);
  }
  const handleDelete = (id: string) => { dailyReportStore.remove(id); setRefresh(r => r + 1); };
  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm"><ClipboardList className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">التقارير اليومية</span><span className="text-[13px] font-bold text-gray-900">{reports.length} تقرير</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500"><span>إجمالي العمال:</span><span className="font-bold text-gray-900 ltr-only tabular-nums">{totalWorkers}</span></div>
          <div className="me-auto" />
          <Button onClick={handleCreate} className="h-8 px-3 gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ إضافة تقرير</span></Button>
        </div>
      </div>

      {projectId && (
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <HardHat className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">المشروع: {decodeURIComponent(projectName)}</span>
            <span className="text-[10px] text-blue-400">({projectId})</span>
          </div>
        </div>
      )}

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي التقارير" value={reports.length} icon={ClipboardList} accent="slate" />
          <KpiCard label="معتمدة" value={approvedCount} icon={CheckCircle2} accent="emerald" />
          <KpiCard label="مقدمة" value={submittedCount} icon={Clock} accent="amber" />
          <KpiCard label="إجمالي العمال" value={totalWorkers} icon={Users} accent="blue" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">التقارير اليومية للمشاريع</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الحالات</SelectItem><SelectItem value="draft">مسودة</SelectItem><SelectItem value="submitted">مقدم</SelectItem><SelectItem value="approved">معتمد</SelectItem><SelectItem value="returned">مرتجع</SelectItem><SelectItem value="rejected">مرفوض</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyReports onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رقم التقرير</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المشروع</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التاريخ</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الطقس</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">العمال</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المعدات</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الأعمال المنجزة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">مشاكل</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map(r => <ReportRow key={r.id} r={r} onEdit={handleEdit} onDelete={handleDelete} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {reports.length} تقرير</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-blue-500" />{editingId ? 'تعديل تقرير يومي' : 'إضافة تقرير يومي جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>رقم التقرير</Label><Input value={form.report_number} onChange={e => setForm({ ...form, report_number: e.target.value })} /></div>
              <div><Label>المشروع</Label><Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}><SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger><SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>التاريخ</Label><Input type="date" value={form.report_date} onChange={e => setForm({ ...form, report_date: e.target.value })} /></div>
              <div><Label>الطقس</Label><Select value={form.weather_condition} onValueChange={v => setForm({ ...form, weather_condition: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="مشمس">☀️ مشمس</SelectItem><SelectItem value="غائم جزئياً">⛅ غائم جزئياً</SelectItem><SelectItem value="غائم">☁️ غائم</SelectItem><SelectItem value="ممطر">🌧️ ممطر</SelectItem><SelectItem value="عاصف">🌪️ عاصف</SelectItem></SelectContent></Select></div>
              <div><Label>عدد العمال</Label><Input type="number" value={form.manpower_count} onChange={e => setForm({ ...form, manpower_count: Number(e.target.value) })} min={0} /></div>
              <div><Label>المعدات</Label><Input value={form.equipment_on_site} onChange={e => setForm({ ...form, equipment_on_site: e.target.value })} /></div>
              <div className="col-span-2"><Label>حالة الاعتماد</Label><Select value={form.approval_status} onValueChange={(v: any) => setForm({ ...form, approval_status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">مسودة</SelectItem><SelectItem value="submitted">مقدم</SelectItem><SelectItem value="approved">معتمد</SelectItem><SelectItem value="returned">مرتجع</SelectItem><SelectItem value="rejected">مرفوض</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>الأعمال المنجزة اليوم</Label><Textarea value={form.work_completed_today} onChange={e => setForm({ ...form, work_completed_today: e.target.value })} rows={2} /></div>
            <div><Label>الأعمال المخطط لها غداً</Label><Textarea value={form.planned_work_tomorrow} onChange={e => setForm({ ...form, planned_work_tomorrow: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>المشاكل المصادفة</Label><Textarea value={form.issues_encountered} onChange={e => setForm({ ...form, issues_encountered: e.target.value })} rows={2} /></div>
              <div><Label>حوادث السلامة</Label><Textarea value={form.safety_incidents} onChange={e => setForm({ ...form, safety_incidents: e.target.value })} rows={2} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>المواد المستلمة</Label><Textarea value={form.materials_received} onChange={e => setForm({ ...form, materials_received: e.target.value })} rows={2} /></div>
              <div><Label>سبب التأخير</Label><Textarea value={form.delay_reason} onChange={e => setForm({ ...form, delay_reason: e.target.value })} rows={2} /></div>
            </div>
            <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}