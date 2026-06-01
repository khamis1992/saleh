import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { maintenanceStore, getPropertyName, getUnitNumber, getTenantName } from '@/services/stores';

const categoryLabels: Record<string, string> = {
  ac: 'تكييف',
  electrical: 'كهرباء',
  plumbing: 'سباكة',
  water_leakage: 'تسرب مياه',
  door_window: 'أبواب ونوافذ',
  painting: 'دهانات',
  elevator: 'مصعد',
  fire_alarm: 'إنذار حريق',
  pest_control: 'مكافحة حشرات',
  cleaning: 'تنظيف',
  landscaping: 'تنسيق حدائق',
  general: 'عام',
};

const priorityLabels: Record<string, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  emergency: 'طارئة',
};

const statusLabels: Record<string, string> = {
  submitted: 'مقدم',
  under_review: 'تحت المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  assigned: 'معين',
  in_progress: 'قيد التنفيذ',
  waiting_parts: 'بانتظار قطع',
  completed: 'مكتمل',
  tenant_confirmed: 'مؤكد من المستأجر',
  closed: 'مغلق',
  cancelled: 'ملغي',
};

export default function MaintenanceReport() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [refresh] = useState(0);

  const requests = useMemo(() => maintenanceStore.getAll(), [refresh]);

  const filtered = useMemo(() => {
    return requests
      .filter((r) => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
        if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
        if (search) {
          const propName = getPropertyName(r.property_id);
          const unitNum = getUnitNumber(r.unit_id);
          const tenantName = getTenantName(r.tenant_id);
          if (!r.request_number.includes(search) && !propName.includes(search) && !unitNum.includes(search) && !tenantName.includes(search))
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = { emergency: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
      });
  }, [requests, search, statusFilter, priorityFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = requests.length;
    const open = requests.filter((r) => !['completed', 'closed', 'cancelled', 'rejected'].includes(r.status)).length;
    const emergency = requests.filter((r) => r.priority === 'emergency').length;
    const completed = requests.filter((r) => r.status === 'completed' || r.status === 'closed').length;
    return { total, open, emergency, completed };
  }, [requests]);

  return (
    <div dir="rtl">
      <PageHeader title="تقرير الصيانة" description="تقرير طلبات الصيانة" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">طلبات مفتوحة</p>
            <p className="text-2xl font-bold text-amber-600">{stats.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">طلبات طارئة</p>
            <p className="text-2xl font-bold text-red-600">{stats.emergency}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">طلبات مكتملة</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                {Object.entries(priorityLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الطلب</TableHead>
                <TableHead className="text-right">العقار</TableHead>
                <TableHead className="text-right">الوحدة</TableHead>
                <TableHead className="text-right">المستأجر</TableHead>
                <TableHead className="text-right">الفئة</TableHead>
                <TableHead className="text-right">الأولوية</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد طلبات صيانة مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.request_number}</TableCell>
                    <TableCell>{getPropertyName(r.property_id)}</TableCell>
                    <TableCell>{getUnitNumber(r.unit_id)}</TableCell>
                    <TableCell>{getTenantName(r.tenant_id)}</TableCell>
                    <TableCell>{categoryLabels[r.category] || r.category}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.priority} label={priorityLabels[r.priority] || r.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} label={statusLabels[r.status] || r.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
