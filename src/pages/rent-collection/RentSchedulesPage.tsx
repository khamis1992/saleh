import { useState, useMemo } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { rentScheduleStore, getContractNumber, getTenantName, leaseStore } from '@/services/stores';

const statusLabels: Record<string, string> = {
  upcoming: 'قادم',
  due: 'مستحق',
  partially_paid: 'مدفوع جزئياً',
  paid: 'مدفوع',
  overdue: 'متأخر',
  cancelled: 'ملغي',
};

export default function RentSchedulesPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);

  const schedules = useMemo(() => rentScheduleStore.getAll(), [refresh]);
  const leases = useMemo(() => leaseStore.getAll(), [refresh]);

  const fmt = (v: number) =>
    formatQAR(v);

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ar-SA');
  };

  const filtered = schedules.filter((s: any) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (contractFilter !== 'all' && s.contract_id !== contractFilter) return false;
    if (search) {
      const contractNum = getContractNumber(s.contract_id);
      if (!contractNum.includes(search)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <PageHeader
        title="جداول الدفع"
        description="إدارة جداول دفعات الإيجار حسب العقود"
      />
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم العقد..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
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
            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="العقد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العقود</SelectItem>
                {leases.map((l: any) => (
                  <SelectItem key={l.id} value={l.id}>{l.contract_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العقد</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>بداية الفترة</TableHead>
                  <TableHead>نهاية الفترة</TableHead>
                  <TableHead>قيمة الإيجار</TableHead>
                  <TableHead>إجمالي المبلغ</TableHead>
                  <TableHead>المدفوع</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      لا توجد جداول دفع
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {getContractNumber(s.contract_id)}
                    </TableCell>
                    <TableCell>{formatDate(s.due_date)}</TableCell>
                    <TableCell>{formatDate(s.period_start)}</TableCell>
                    <TableCell>{formatDate(s.period_end)}</TableCell>
                    <TableCell className="font-mono">{fmt(s.rent_amount)}</TableCell>
                    <TableCell className="font-mono">{fmt(s.total_due)}</TableCell>
                    <TableCell className="font-mono">{fmt(s.paid_amount)}</TableCell>
                    <TableCell className="font-mono">{fmt(s.balance)}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} label={statusLabels[s.status] || s.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
