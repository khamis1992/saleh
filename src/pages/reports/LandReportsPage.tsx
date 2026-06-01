import { useState, useMemo } from 'react';
import { formatQARInt, formatThousand } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download } from 'lucide-react';
import { landStore } from '@/services/stores';
import { exportToCSV } from '@/utils/exportUtils';

const statusLabels: Record<string, string> = {
  available: 'متاحة', under_study: 'تحت الدراسة', under_design: 'تحت التصميم',
  under_approvals: 'تحت الاعتمادات', under_construction: 'تحت الإنشاء',
  developed: 'مطورة', sold: 'مباعة', archived: 'مؤرشفة',
};

export default function LandReportsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh] = useState(0);
  const lands = useMemo(() => landStore.getAll(), [refresh]);

  const filtered = useMemo(() => lands.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search && !l.land_name.includes(search) && !l.land_code.includes(search) && !l.municipality.includes(search)) return false;
    return true;
  }), [lands, search, statusFilter]);

  const fmt = (v: number) => formatQARInt(v);

  const stats = useMemo(() => ({
    total: lands.length, totalValue: lands.reduce((s, l) => s + l.current_estimated_value, 0),
    totalCost: lands.reduce((s, l) => s + l.total_acquisition_cost, 0),
    totalArea: lands.reduce((s, l) => s + l.area_sqm, 0),
  }), [lands]);

  const handleExport = () => {
    exportToCSV(filtered.map((l) => ({ ...l, status: statusLabels[l.status] || l.status })),
      [{ key: 'land_code', label: 'كود الأرض' }, { key: 'land_name', label: 'اسم الأرض' }, { key: 'municipality', label: 'البلدية' },
       { key: 'area_sqm', label: 'المساحة (م٢)' }, { key: 'total_acquisition_cost', label: 'إجمالي تكلفة الشراء' },
       { key: 'current_estimated_value', label: 'القيمة المقدرة الحالية' }, { key: 'status', label: 'الحالة' }], 'سجل_الأراضي.csv');
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">سجل الأراضي</h1>
          <p className="text-xs text-gray-500 mt-0.5">تقرير شامل بجميع الأراضي المسجلة</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0} className="h-9 rounded-lg text-sm">
          <Download className="h-4 w-4 ml-2" />تصدير CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">عدد الأراضي</p><p className="text-xl font-bold">{stats.total}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">إجمالي المساحة (م٢)</p><p className="text-xl font-bold">{formatThousand(stats.totalArea)}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">إجمالي تكلفة الشراء</p><p className="text-xl font-bold">{fmt(stats.totalCost)}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">إجمالي القيمة المقدرة</p><p className="text-xl font-bold">{fmt(stats.totalValue)}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث برقم الأرض أو الاسم أو البلدية..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200" />
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
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">كود الأرض</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">اسم الأرض</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">البلدية</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">المساحة (م٢)</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">إجمالي تكلفة الشراء</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">القيمة المقدرة الحالية</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-8">لا توجد أراضي مطابقة للبحث</TableCell></TableRow>
            ) : filtered.map((land) => (
              <TableRow key={land.id}>
                <TableCell className="font-mono">{land.land_code}</TableCell>
                <TableCell className="font-medium">{land.land_name}</TableCell>
                <TableCell>{land.municipality}</TableCell>
                <TableCell>{formatThousand(land.area_sqm)}</TableCell>
                <TableCell>{fmt(land.total_acquisition_cost)}</TableCell>
                <TableCell>{fmt(land.current_estimated_value)}</TableCell>
                <TableCell><StatusBadge status={land.status} label={statusLabels[land.status] || land.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
