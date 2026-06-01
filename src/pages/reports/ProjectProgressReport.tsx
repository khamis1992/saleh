import { useState, useMemo } from 'react';
import { formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download } from 'lucide-react';
import { projectStore } from '@/services/stores';
import { exportToCSV } from '@/utils/exportUtils';

const projectTypeLabels: Record<string, string> = {
  single_villa: 'فيلا مفردة', villa_compound: 'مجمع فلل', residential_building: 'عمارة سكنية',
  commercial_building: 'عمارة تجارية', mixed_use: 'متعدد الاستخدام', staff_accommodation: 'سكن موظفين',
  warehouse: 'مستودع', office_building: 'مبنى مكاتب', retail_complex: 'مجمع تجاري',
};

const statusLabels: Record<string, string> = {
  idea: 'فكرة', feasibility: 'دراسة جدوى', design: 'تصميم', approvals: 'اعتمادات',
  tendering: 'طرح مناقصة', construction: 'تحت الإنشاء', testing: 'اختبار', handover: 'تسليم',
  completed: 'مكتمل', converted: 'محول', on_hold: 'معلق', cancelled: 'ملغي',
};

export default function ProjectProgressReport() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh] = useState(0);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);

  const filtered = useMemo(() => projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.project_name.includes(search) && !p.project_code.includes(search)) return false;
    return true;
  }), [projects, search, statusFilter]);

  const fmt = (v: number) => formatQARInt(v);

  const stats = useMemo(() => ({
    total: projects.length,
    activeProjects: projects.filter((p) => p.status === 'construction' || p.status === 'testing').length,
    avgCompletion: projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.completion_percentage, 0) / projects.length) : 0,
    totalBudget: projects.reduce((s, p) => s + p.approved_budget, 0),
    totalActual: projects.reduce((s, p) => s + p.actual_cost, 0),
  }), [projects]);

  const handleExport = () => {
    exportToCSV(filtered.map((p) => ({ ...p, project_type: projectTypeLabels[p.project_type] || p.project_type, status: statusLabels[p.status] || p.status })),
      [{ key: 'project_code', label: 'رمز المشروع' }, { key: 'project_name', label: 'اسم المشروع' }, { key: 'project_type', label: 'النوع' },
       { key: 'planned_end_date', label: 'تاريخ النهاية المخطط' }, { key: 'completion_percentage', label: 'نسبة الإنجاز' },
       { key: 'approved_budget', label: 'الميزانية' }, { key: 'actual_cost', label: 'التكلفة الفعلية' }, { key: 'status', label: 'الحالة' }], 'تقدم_المشاريع.csv');
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">تقدم المشاريع</h1>
          <p className="text-xs text-gray-500 mt-0.5">تقرير متابعة تقدم المشاريع والميزانية مقابل الفعلي</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0} className="h-9 rounded-lg text-sm">
          <Download className="h-4 w-4 ml-2" />تصدير CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">عدد المشاريع</p><p className="text-xl font-bold">{stats.total}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">مشاريع نشطة</p><p className="text-xl font-bold">{stats.activeProjects}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">متوسط الإنجاز</p><p className="text-xl font-bold">{stats.avgCompletion}%</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">إجمالي الميزانية</p><p className="text-xl font-bold">{fmt(stats.totalBudget)}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">الانحراف الكلي</p><p className="text-xl font-bold">{fmt(stats.totalActual - stats.totalBudget)}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث برمز المشروع أو الاسم..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200"><Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">رمز المشروع</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">اسم المشروع</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">النوع</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">تاريخ النهاية المخطط</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">نسبة الإنجاز</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">الميزانية</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">التكلفة الفعلية</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">الانحراف</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-gray-500 py-8">لا توجد مشاريع مطابقة للبحث</TableCell></TableRow>
            ) : filtered.map((p) => {
              const variance = p.approved_budget - p.actual_cost;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.project_code}</TableCell>
                  <TableCell className="font-medium">{p.project_name}</TableCell>
                  <TableCell>{projectTypeLabels[p.project_type] || p.project_type}</TableCell>
                  <TableCell>{p.planned_end_date}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><div className="w-16 bg-gray-200 rounded-full h-2"><div className="bg-[#3B82F6] h-2 rounded-full" style={{ width: `${p.completion_percentage}%` }} /></div><span className="text-sm">{p.completion_percentage}%</span></div></TableCell>
                  <TableCell>{fmt(p.approved_budget)}</TableCell>
                  <TableCell>{fmt(p.actual_cost)}</TableCell>
                  <TableCell className={variance < 0 ? 'text-red-600' : 'text-green-600'}>{fmt(variance)}</TableCell>
                  <TableCell><StatusBadge status={p.status} label={statusLabels[p.status] || p.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
