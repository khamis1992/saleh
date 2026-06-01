import { useState, useMemo } from 'react';
import { formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { leaseStore, tenantStore, unitStore, getTenantName, getUnitNumber } from '@/services/stores';

const paymentFrequencyLabels: Record<string, string> = {
  monthly: 'شهري',
  quarterly: 'ربع سنوي',
  semi_annual: 'نصف سنوي',
  annual: 'سنوي',
  custom: 'مخصص',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  pending_approval: 'بانتظار الموافقة',
  approved: 'معتمد',
  pending_signature: 'بانتظار التوقيع',
  active: 'نشط',
  expiring_soon: 'قريب الانتهاء',
  renewed: 'مجدد',
  terminated: 'منتهي',
  cancelled: 'ملغي',
  legal: 'قضائي',
};

export default function RentRollReport() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh] = useState(0);

  const leases = useMemo(() => leaseStore.getAll(), [refresh]);

  const filtered = useMemo(() => {
    return leases.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      const tenantName = getTenantName(l.tenant_id);
      const unitNumber = getUnitNumber(l.unit_id);
      if (search && !l.contract_number.includes(search) && !tenantName.includes(search) && !unitNumber.includes(search))
        return false;
      return true;
    });
  }, [leases, search, statusFilter]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const stats = useMemo(() => {
    const activeLeases = leases.filter((l) => l.status === 'active').length;
    const totalRent = leases.reduce((s, l) => s + l.rent_amount, 0);
    const expiringSoon = leases.filter((l) => l.status === 'expiring_soon').length;
    return { total: leases.length, active: activeLeases, totalRent, expiringSoon };
  }, [leases]);

  return (
    <div dir="rtl">
      <PageHeader title="سجل الإيجارات" description="تقرير العقود الإيجارية النشطة" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي العقود</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">العقود النشطة</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">قريبة الانتهاء</p>
            <p className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي الإيجارات السنوية</p>
            <p className="text-2xl font-bold">{fmt(stats.totalRent)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم العقد أو المستأجر أو الوحدة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم العقد</TableHead>
                <TableHead className="text-right">المستأجر</TableHead>
                <TableHead className="text-right">رقم الوحدة</TableHead>
                <TableHead className="text-right">قيمة الإيجار</TableHead>
                <TableHead className="text-right">دورية الدفع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا توجد عقود مطابقة للبحث
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono">{l.contract_number}</TableCell>
                    <TableCell className="font-medium">{getTenantName(l.tenant_id)}</TableCell>
                    <TableCell>{getUnitNumber(l.unit_id)}</TableCell>
                    <TableCell>{fmt(l.rent_amount)}</TableCell>
                    <TableCell>{paymentFrequencyLabels[l.payment_frequency] || l.payment_frequency}</TableCell>
                    <TableCell>
                      <StatusBadge status={l.status} label={statusLabels[l.status] || l.status} />
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
