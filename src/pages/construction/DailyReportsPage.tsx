import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, MoreHorizontal, Eye, Trash2, ClipboardList, Cloud, Users, AlertTriangle, HardHat } from 'lucide-react';
import { projectStore, getProjectName, dailyReportStore } from '@/services/stores';
import { createStore } from '@/services/dataService';
import type { ProjectDailyReport } from '@/types';

// ============================================================
// SEED DATA
// ============================================================
export const seedDailyReports: ProjectDailyReport[] = [
  {
    id: 'dr-1', company_id: '', report_number: 'DR-2025-001', project_id: 'prj-1',
    report_date: '2025-01-15',
    weather_condition: 'مشمس', manpower_count: 45, equipment_on_site: 'حفارين - خلاطة - رافعة',
    work_completed_today: 'صب الخرسانة للطابق الأرضي - تركيب حديد التسليح للطابق الأول',
    planned_work_tomorrow: 'استكمال صب الطابق الأول - بدء أعمال الطوب',
    issues_encountered: 'تأخر توريد حديد التسليح ساعتين',
    safety_incidents: 'لا يوجد',
    materials_received: 'حديد تسليح 20 طن - أسمنت 500 كيس',
    delay_reason: '',
    submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-01-16',
    notes: 'سير العمل جيد', created_at: '2025-01-15', updated_at: '2025-01-16', is_active: true,
  },
  {
    id: 'dr-2', company_id: '', report_number: 'DR-2025-002', project_id: 'prj-1',
    report_date: '2025-01-16',
    weather_condition: 'غائم جزئياً', manpower_count: 42, equipment_on_site: 'حفارين - خلاطة - رافعة - مضخة خرسانة',
    work_completed_today: 'صب الطابق الأول - بدء تركيب الطوب في الطابق الأرضي',
    planned_work_tomorrow: 'استكمال تركيب الطوب - تجهيز أعمال الكهرباء',
    issues_encountered: '',
    safety_incidents: 'لا يوجد',
    materials_received: 'طوب أحمر 5000 حبة',
    delay_reason: '',
    submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-01-17',
    notes: '', created_at: '2025-01-16', updated_at: '2025-01-17', is_active: true,
  },
  {
    id: 'dr-3', company_id: '', report_number: 'DR-2025-003', project_id: 'prj-2',
    report_date: '2025-05-20',
    weather_condition: 'مشمس', manpower_count: 60, equipment_on_site: 'رافعتين برجيتين - خلاطة - مضخة - مولد كهرباء',
    work_completed_today: 'صب الطابق الخامس - تركيب قوالب الطابق السادس',
    planned_work_tomorrow: 'صب الطابق السادس - بدء تمديدات الكهرباء في الطابق الرابع',
    issues_encountered: 'عطل بسيط في المضخة - تم الإصلاح خلال ساعة',
    safety_incidents: 'لا يوجد',
    materials_received: 'خرسانة جاهزة 200 م³ - حديد تسليح 30 طن',
    delay_reason: '',
    submitted_by: '', approval_status: 'submitted', approved_by: '', approved_at: '',
    notes: 'بانتظار موافقة المهندس', created_at: '2025-05-20', updated_at: '2025-05-20', is_active: true,
  },
  {
    id: 'dr-4', company_id: '', report_number: 'DR-2025-004', project_id: 'prj-3',
    report_date: '2025-06-10',
    weather_condition: 'ممطر - تم إيقاف العمل جزئياً', manpower_count: 25, equipment_on_site: 'حفار - خلاطة صغيرة',
    work_completed_today: 'أعمال حفر الأساسات - تم إنجاز 60% من الحفر',
    planned_work_tomorrow: 'استكمال الحفر - تجهيز حديد الأساسات',
    issues_encountered: 'تأخر العمل بسبب الأمطار - توقف 3 ساعات',
    safety_incidents: 'لا يوجد',
    materials_received: '',
    delay_reason: 'سوء الأحوال الجوية',
    submitted_by: '', approval_status: 'draft', approved_by: '', approved_at: '',
    notes: 'مسودة - سيتم إكمالها', created_at: '2025-06-10', updated_at: '2025-06-10', is_active: true,
  },
];

// In-memory store — use shared store from stores.ts
const reportStore = dailyReportStore;

const approvalLabels: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'مقدم',
  approved: 'معتمد',
  returned: 'مرتجع',
  rejected: 'مرفوض',
};

const weatherIcons: Record<string, string> = {
  'مشمس': '☀️',
  'غائم': '☁️',
  'غائم جزئياً': '⛅',
  'ممطر': '🌧️',
  'عاصف': '🌪️',
};

interface ReportForm {
  report_number: string;
  project_id: string;
  report_date: string;
  weather_condition: string;
  manpower_count: number;
  equipment_on_site: string;
  work_completed_today: string;
  planned_work_tomorrow: string;
  issues_encountered: string;
  safety_incidents: string;
  materials_received: string;
  delay_reason: string;
  approval_status: ProjectDailyReport['approval_status'];
  notes: string;
}

const emptyReportForm: ReportForm = {
  report_number: '',
  project_id: '',
  report_date: new Date().toISOString().split('T')[0],
  weather_condition: 'مشمس',
  manpower_count: 0,
  equipment_on_site: '',
  work_completed_today: '',
  planned_work_tomorrow: '',
  issues_encountered: '',
  safety_incidents: 'لا يوجد',
  materials_received: '',
  delay_reason: '',
  approval_status: 'draft',
  notes: '',
};

export default function DailyReportsPage() {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const projectName = searchParams.get('projectName') || '';
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReportForm>(emptyReportForm);

  const reports = useMemo(() => reportStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);

  const filtered = useMemo(() => reports.filter((r) => {
    if (projectId && r.project_id !== projectId) return false;
    if (statusFilter !== 'all' && r.approval_status !== statusFilter) return false;
    if (search && !r.report_number.includes(search) && !r.work_completed_today.includes(search)) return false;
    return true;
  }), [reports, search, statusFilter, projectId]);

  function handleCreate() {
    setEditingId(null);
    setForm({ ...emptyReportForm, report_date: new Date().toISOString().split('T')[0] });
    setDialogOpen(true);
  }

  function handleEdit(r: ProjectDailyReport) {
    setEditingId(r.id);
    setForm({
      report_number: r.report_number,
      project_id: r.project_id,
      report_date: r.report_date,
      weather_condition: r.weather_condition,
      manpower_count: r.manpower_count,
      equipment_on_site: r.equipment_on_site,
      work_completed_today: r.work_completed_today,
      planned_work_tomorrow: r.planned_work_tomorrow,
      issues_encountered: r.issues_encountered,
      safety_incidents: r.safety_incidents,
      materials_received: r.materials_received,
      delay_reason: r.delay_reason,
      approval_status: r.approval_status,
      notes: r.notes,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.project_id || !form.report_date) return;
    const fullData = {
      ...form,
      company_id: '',
      submitted_by: '',
      approved_by: '',
      approved_at: form.approval_status === 'approved' ? new Date().toISOString() : '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };
    if (editingId) {
      reportStore.update(editingId, fullData as any);
    } else {
      reportStore.create(fullData as any);
    }
    setDialogOpen(false);
    setRefresh(r => r + 1);
  }

  function handleDelete(id: string) {
    reportStore.remove(id);
    setRefresh(r => r + 1);
  }

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {projectId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
          <HardHat className="h-4 w-4 text-indigo-600" />
          <span className="text-xs text-indigo-700 font-medium">المشروع: {decodeURIComponent(projectName)}</span>
          <span className="text-[10px] text-indigo-400">({projectId})</span>
        </div>
      )}
      <PageHeader
        title="التقارير اليومية"
        description="التقارير اليومية للمشاريع - سير العمل والملاحظات"
        createLabel="إضافة تقرير يومي"
        onCreate={handleCreate}
      />

      <Card>
        <CardContent className="p-4">
          {/* Search & Filter */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث برقم التقرير أو الأعمال..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="حالة الاعتماد" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="submitted">مقدم</SelectItem>
                <SelectItem value="approved">معتمد</SelectItem>
                <SelectItem value="returned">مرتجع</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم التقرير</TableHead>
                <TableHead>المشروع</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الطقس</TableHead>
                <TableHead>العمال</TableHead>
                <TableHead>المعدات</TableHead>
                <TableHead>الأعمال المنجزة</TableHead>
                <TableHead>مشاكل / حوادث</TableHead>
                <TableHead>حالة الاعتماد</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.report_number}</TableCell>
                  <TableCell>{getProjectName(r.project_id)}</TableCell>
                  <TableCell>{r.report_date}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <span>{(weatherIcons as any)[r.weather_condition] || '🌤️'}</span>
                      {r.weather_condition}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.manpower_count}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={r.equipment_on_site}>{r.equipment_on_site}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={r.work_completed_today}>{r.work_completed_today}</TableCell>
                  <TableCell>
                    {r.issues_encountered || r.safety_incidents !== 'لا يوجد' ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {r.issues_encountered || r.safety_incidents}
                      </span>
                    ) : (
                      <span className="text-green-600 text-xs">لا يوجد</span>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={r.approval_status} label={approvalLabels[r.approval_status] || r.approval_status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleEdit(r)}><Eye className="h-4 w-4 ml-2" />عرض / تعديل</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 ml-2" />{t.common.delete}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">{t.common.noResults}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {editingId ? 'تعديل تقرير يومي' : 'إضافة تقرير يومي جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم التقرير</Label>
                <Input value={form.report_number} onChange={(e) => setForm({ ...form, report_number: e.target.value })} placeholder="DR-2025-..." />
              </div>
              <div className="space-y-2">
                <Label>المشروع</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>تاريخ التقرير</Label>
                <Input type="date" value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>حالة الطقس</Label>
                <Select value={form.weather_condition} onValueChange={(v) => setForm({ ...form, weather_condition: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر حالة الطقس" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="مشمس">☀️ مشمس</SelectItem>
                    <SelectItem value="غائم جزئياً">⛅ غائم جزئياً</SelectItem>
                    <SelectItem value="غائم">☁️ غائم</SelectItem>
                    <SelectItem value="ممطر">🌧️ ممطر</SelectItem>
                    <SelectItem value="عاصف">🌪️ عاصف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>عدد العمال</Label>
                <Input type="number" value={form.manpower_count} onChange={(e) => setForm({ ...form, manpower_count: Number(e.target.value) })} min={0} />
              </div>
              <div className="space-y-2">
                <Label>المعدات في الموقع</Label>
                <Input value={form.equipment_on_site} onChange={(e) => setForm({ ...form, equipment_on_site: e.target.value })} placeholder="حفار - رافعة - خلاطة..." />
              </div>
              <div className="space-y-2">
                <Label>حالة الاعتماد</Label>
                <Select value={form.approval_status} onValueChange={(v: any) => setForm({ ...form, approval_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="submitted">مقدم</SelectItem>
                    <SelectItem value="approved">معتمد</SelectItem>
                    <SelectItem value="returned">مرتجع</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الأعمال المنجزة اليوم</Label>
              <Textarea value={form.work_completed_today} onChange={(e) => setForm({ ...form, work_completed_today: e.target.value })} rows={2} placeholder="ما تم إنجازه اليوم..." />
            </div>
            <div className="space-y-2">
              <Label>الأعمال المخطط لها غداً</Label>
              <Textarea value={form.planned_work_tomorrow} onChange={(e) => setForm({ ...form, planned_work_tomorrow: e.target.value })} rows={2} placeholder="الأعمال المخطط تنفيذها غداً..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المشاكل المصادفة</Label>
                <Textarea value={form.issues_encountered} onChange={(e) => setForm({ ...form, issues_encountered: e.target.value })} rows={2} placeholder="أي مشاكل أو معوقات..." />
              </div>
              <div className="space-y-2">
                <Label>حوادث السلامة</Label>
                <Textarea value={form.safety_incidents} onChange={(e) => setForm({ ...form, safety_incidents: e.target.value })} rows={2} placeholder="لا يوجد" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المواد المستلمة</Label>
                <Textarea value={form.materials_received} onChange={(e) => setForm({ ...form, materials_received: e.target.value })} rows={2} placeholder="المواد التي تم استلامها اليوم..." />
              </div>
              <div className="space-y-2">
                <Label>سبب التأخير (إن وجد)</Label>
                <Textarea value={form.delay_reason} onChange={(e) => setForm({ ...form, delay_reason: e.target.value })} rows={2} placeholder="أسباب التأخير..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="ملاحظات إضافية..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleSave}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
