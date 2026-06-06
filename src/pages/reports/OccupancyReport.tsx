import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { propertyStore, unitStore } from '@/services/stores';
import { exportToCSV } from '@/utils/exportUtils';

export default function OccupancyReport() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [refresh] = useState(0);

  const properties = useMemo(() => propertyStore.getAll(), [refresh]);
  const units = useMemo(() => unitStore.getAll(), [refresh]);

  const reportData = useMemo(() => {
    return properties
      .map((prop) => {
        const propUnits = units.filter((u) => u.property_id === prop.id);
        const totalUnits = propUnits.length;
        const leasedUnits = propUnits.filter((u) => u.status === 'leased').length;
        const availableUnits = propUnits.filter((u) => u.status === 'available').length;
        const occupancy = totalUnits > 0 ? Math.round((leasedUnits / totalUnits) * 100) : 0;
        return { id: prop.id, property_name: prop.property_name, property_code: prop.property_code, total_units: totalUnits, available: availableUnits, leased: leasedUnits, occupancy };
      })
      .filter((d) => { if (search && !d.property_name.includes(search) && !d.property_code.includes(search)) return false; return true; });
  }, [properties, units, search]);

  const stats = useMemo(() => {
    const totalUnits = units.length;
    const leasedUnits = units.filter((u) => u.status === 'leased').length;
    const availableUnits = units.filter((u) => u.status === 'available').length;
    const overallOccupancy = totalUnits > 0 ? Math.round((leasedUnits / totalUnits) * 100) : 0;
    return { totalUnits, leasedUnits, availableUnits, overallOccupancy };
  }, [units]);

  const handleExport = () => {
    const data = reportData.map((d) => ({
      'كود العقار': d.property_code,
      'اسم العقار': d.property_name,
      'إجمالي الوحدات': d.total_units,
      'متاحة': d.available,
      'مؤجرة': d.leased,
      'نسبة الإشغال': `${d.occupancy}%`,
    }));
    exportToCSV(data, [
      { key: 'كود العقار', label: 'كود العقار' },
      { key: 'اسم العقار', label: 'اسم العقار' },
      { key: 'إجمالي الوحدات', label: 'إجمالي الوحدات' },
      { key: 'متاحة', label: 'متاحة' },
      { key: 'مؤجرة', label: 'مؤجرة' },
      { key: 'نسبة الإشغال', label: 'نسبة الإشغال' },
    ], 'تقرير_الإشغال.csv');
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">تقرير الإشغال</h1>
          <p className="text-xs text-gray-500 mt-0.5">نسبة الإشغال حسب العقار</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={reportData.length === 0} className="h-9 rounded-lg text-sm">
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">إجمالي الوحدات</p><p className="text-xl font-bold">{stats.totalUnits}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">الوحدات المؤجرة</p><p className="text-xl font-bold text-green-600">{stats.leasedUnits}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">الوحدات المتاحة</p><p className="text-xl font-bold text-blue-600">{stats.availableUnits}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500">نسبة الإشغال الإجمالية</p><p className="text-xl font-bold">{stats.overallOccupancy}%</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="بحث باسم العقار..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">اسم العقار</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">إجمالي الوحدات</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">متاحة</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">مؤجرة</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] text-right">نسبة الإشغال</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">لا توجد بيانات</TableCell></TableRow>
            ) : (
              reportData.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.property_name}</TableCell>
                  <TableCell>{d.total_units}</TableCell>
                  <TableCell>{d.available}</TableCell>
                  <TableCell>{d.leased}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${d.occupancy >= 80 ? 'bg-green-500' : d.occupancy >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${d.occupancy}%` }} />
                      </div>
                      <span className="text-sm font-medium">{d.occupancy}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
