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
import { Search, Filter, MoreHorizontal, Eye, Trash2, TrendingUp, ArrowUp, ArrowDown, HardHat } from 'lucide-react';
import { projectStore, getProjectName } from '@/services/stores';
import { createStore } from '@/services/dataService';
import type { ProjectProgressUpdate } from '@/types';

// ============================================================
// SEED DATA
// ============================================================
export const seedProgressUpdates: ProjectProgressUpdate[] = [
  {
    id: 'pu-1', company_id: '', project_id: 'prj-1', phase_id: 'phase-1',
    update_date: '2025-01-20', previous_progress: 40, new_progress: 50, progress_change: 10,
    description: 'استكمال صب الهيكل الخرساني للطابقين الأول والثاني - بدء أعمال الطوب واللياسة',
    issues: '',
    photos_count: 5,
    submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-01-21',
    created_at: '2025-01-20', updated_at: '2025-01-21', is_active: true,
  },
  {
    id: 'pu-2', company_id: '', project_id: 'prj-1', phase_id: 'phase-2',
    update_date: '2025-03-15', previous_progress: 65, new_progress: 75, progress_change: 10,
    description: 'الانتهاء من تمديدات الكهرباء والسباكة - بدء أعمال التشطيبات الداخلية',
    issues: 'تأخر توريد السيراميك أسبوع',
    photos_count: 8,
    submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-03-16',
    created_at: '2025-03-15', updated_at: '2025-03-16', is_active: true,
  },
  {
    id: 'pu-3', company_id: '', project_id: 'prj-2', phase_id: 'phase-3',
    update_date: '2025-04-10', previous_progress: 30, new_progress: 45, progress_change: 15,
    description: 'صب الأعمدة والجسور للطوابق 3-5 - تجهيز حديد الطوابق 6-7',
    issues: '',
    photos_count: 12,
    submitted_by: '', approval_status: 'pending', approved_by: '', approved_at: '',
    created_at: '2025-04-10', updated_at: '2025-04-10', is_active: true,
  },
  {
    id: 'pu-4', company_id: '', project_id: 'prj-3', phase_id: 'phase-4',
    update_date: '2025-07-01', previous_progress: 20, new_progress: 32, progress_change: 12,
    description: 'استكمال صب الأساسات - بدء تركيب الهيكل المعدني',
    issues: 'تحديات في منسوب المياه الجوفية - تم تركيب مضخات إضافية',
    photos_count: 6,
    submitted_by: '', approval_status: 'returned', approved_by: '', approved_at: '',
    created_at: '2025-07-01', updated_at: '2025-07-05', is_active: true,
  },
];

// Project phases lookup (simulated - in real app these would come from a store)
const phaseNames: Record<string, string> = {
  'phase-1': 'المرحلة الأولى - الهيكل الخرساني',
  'phase-2': 'المرحلة الثانية - التشطيبات',
  'phase-3': 'المرحلة الثالثة - الهيكل الإنشائي',
  'phase-4': 'المرحلة الرابعة - الأساسات',
};

// In-memory store
const progressStore = createStore<ProjectProgressUpdate>({ key: 'erp_progress_updates', seed: seedProgressUpdates });

const approvalLabels: Record<string, string> = {
  pending: 'معلق',
  approved: 'معتمد',
  rejected: 'مرفوض',
  returned: 'مرتجع',
};

interface ProgressForm {
  project_id: string;
  phase_id: string;
  update_date: string;
  previous_progress: number;
  new_progress: number;
  description: string;
  issues: string;
  approval_status: ProjectProgressUpdate['approval_status'];
}

const emptyProgressForm: ProgressForm = {
  project_id: '',
  phase_id: '',
  update_date: new Date().toISOString().split('T')[0],
  previous_progress: 0,
  new_progress: 0,
  description: '',
  issues: '',
  approval_status: 'pending',
};

export default function ProgressUpdatesPage() {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const projectName = searchParams.get('projectName') || '';
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgressForm>(emptyProgressForm);

  const updates = useMemo(() => progressStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);

  const filtered = useMemo(() => updates.filter((u) => {
    if (projectId && u.project_id !== projectId) return false;
    if (statusFilter !== 'all' && u.approval_status !== statusFilter) return false;
    if (search && !u.description.includes(search) && !u.project_id.includes(search)) return false;
    return true;
  }), [updates, search, statusFilter, projectId]);

  function getPhaseName(id: string) {
    return phaseNames[id] || id;
  }

  function handleCreate() {
    setEditingId(null);
    setForm({ ...emptyProgressForm, update_date: new Date().toISOString().split('T')[0] });
    setDialogOpen(true);
  }

  function handleEdit(pu: ProjectProgressUpdate) {
    setEditingId(pu.id);
    setForm({
      project_id: pu.project_id,
      phase_id: pu.phase_id,
      update_date: pu.update_date,
      previous_progress: pu.previous_progress,
      new_progress: pu.new_progress,
      description: pu.description,
      issues: pu.issues,
      approval_status: pu.approval_status,
    });
    setDialogOpen(true);
  }

  // Auto-fill previous_progress when project changes based on last update
  function handleProjectChange(projectId: string) {
    const projectUpdates = updates.filter(u => u.project_id === projectId).sort((a, b) => b.update_date.localeCompare(a.update_date));
    const previousProgress = projectUpdates.length > 0 ? projectUpdates[0].new_progress : 0;
    setForm(prev => ({ ...prev, project_id: projectId, previous_progress: previousProgress }));
  }

  function handleSave() {
    if (!form.project_id || !form.phase_id) return;
    const progressChange = Math.max(0, form.new_progress - form.previous_progress);
    const fullData = {
      ...form,
      progress_change: progressChange,
      photos_count: 0,
      company_id: '',
      submitted_by: '',
      approved_by: '',
      approved_at: form.approval_status === 'approved' ? new Date().toISOString() : '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };
    if (editingId) {
      progressStore.update(editingId, fullData as any);
    } else {
      progressStore.create(fullData as any);
    }
    setDialogOpen(false);
    setRefresh(r => r + 1);
  }

  function handleDelete(id: string) {
    progressStore.remove(id);
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
        title="تحديثات تقدم المشاريع"
        description="متابعة تحديثات نسبة الإنجاز في المشاريع والمراحل"
        createLabel="إضافة تحديث تقدم"
        onCreate={handleCreate}
      />

      <Card>
        <CardContent className="p-4">
          {/* Search & Filter */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث في الوصف..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="حالة الاعتماد" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
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
                <TableHead>المشروع</TableHead>
                <TableHead>المرحلة</TableHead>
                <TableHead>تاريخ التحديث</TableHead>
                <TableHead>التقدم السابق</TableHead>
                <TableHead>التقدم الجديد</TableHead>
                <TableHead>نسبة التغيير</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>مشاكل</TableHead>
                <TableHead>حالة الاعتماد</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pu) => (
                <TableRow key={pu.id}>
                  <TableCell className="font-medium">{getProjectName(pu.project_id)}</TableCell>
                  <TableCell>{getPhaseName(pu.phase_id)}</TableCell>
                  <TableCell>{pu.update_date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-muted rounded-full h-2"><div className="bg-gray-400 h-2 rounded-full" style={{width: `${pu.previous_progress}%`}} /></div>
                      <span className="text-xs">{pu.previous_progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{width: `${pu.new_progress}%`}} /></div>
                      <span className="text-xs font-semibold">{pu.new_progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`flex items-center gap-1 text-xs font-medium ${pu.progress_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pu.progress_change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      +{pu.progress_change}%
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={pu.description}>{pu.description}</TableCell>
                  <TableCell>
                    {pu.issues ? (
                      <span className="text-amber-600 text-xs">{pu.issues.length > 30 ? pu.issues.substring(0, 30) + '...' : pu.issues}</span>
                    ) : (
                      <span className="text-green-600 text-xs">لا يوجد</span>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={pu.approval_status} label={approvalLabels[pu.approval_status] || pu.approval_status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleEdit(pu)}><Eye className="h-4 w-4 ml-2" />عرض / تعديل</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(pu.id)}><Trash2 className="h-4 w-4 ml-2" />{t.common.delete}</DropdownMenuItem>
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
              <TrendingUp className="h-5 w-5" />
              {editingId ? 'تعديل تحديث تقدم' : 'إضافة تحديث تقدم جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المشروع</Label>
                <Select value={form.project_id} onValueChange={handleProjectChange}>
                  <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المرحلة</Label>
                <Select value={form.phase_id} onValueChange={(v) => setForm({ ...form, phase_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(phaseNames).map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>تاريخ التحديث</Label>
                <Input type="date" value={form.update_date} onChange={(e) => setForm({ ...form, update_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>حالة الاعتماد</Label>
                <Select value={form.approval_status} onValueChange={(v: any) => setForm({ ...form, approval_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="approved">معتمد</SelectItem>
                    <SelectItem value="returned">مرتجع</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">مقارنة التقدم</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm w-28">التقدم السابق</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div className="bg-gray-400 h-3 rounded-full transition-all" style={{ width: `${form.previous_progress}%` }} />
                  </div>
                  <span className="text-sm font-mono w-14 text-right">{form.previous_progress}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm w-28">التقدم الجديد</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${form.new_progress}%` }} />
                  </div>
                  <span className="text-sm font-mono font-semibold w-14 text-right">{form.new_progress}%</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>نسبة التغيير</span>
                <span className={`font-bold ${form.new_progress >= form.previous_progress ? 'text-green-600' : 'text-red-600'}`}>
                  {form.new_progress - form.previous_progress > 0 ? '+' : ''}{form.new_progress - form.previous_progress}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التقدم السابق (%)</Label>
                <Input type="number" value={form.previous_progress} onChange={(e) => setForm({ ...form, previous_progress: Number(e.target.value) })} min={0} max={100} />
              </div>
              <div className="space-y-2">
                <Label>التقدم الجديد (%)</Label>
                <Input type="number" value={form.new_progress} onChange={(e) => setForm({ ...form, new_progress: Number(e.target.value) })} min={0} max={100} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>وصف التحديث</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="وصف الأعمال المنجزة في هذا التحديث..." />
            </div>

            <div className="space-y-2">
              <Label>المشاكل والمعوقات</Label>
              <Textarea value={form.issues} onChange={(e) => setForm({ ...form, issues: e.target.value })} rows={2} placeholder="أي مشاكل أو معوقات تواجه التقدم..." />
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
