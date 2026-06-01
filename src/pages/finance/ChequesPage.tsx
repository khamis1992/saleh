import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { chequeStore, getTenantName } from '@/services/stores';

const statusLabels: Record<string, string> = {
  received: 'مستلم',
  deposited: 'مودع',
  cleared: 'مصرف',
  bounced: 'مرتجع',
  cancelled: 'ملغي',
  returned: 'معاد',
};

const bankNames = [
  'الراجحي', 'الأهلي', 'الرياض', 'ساب', 'الإنماء', 'البلاد', 'الجزيرة', 'العربي',
];

const emptyForm = {
  cheque_number: '',
  bank_name: '',
  cheque_date: '',
  amount: 0,
  tenant_id: '',
  contract_id: '',
  status: 'received',
  notes: '',
};

export default function ChequesPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const cheques = useMemo(() => chequeStore.getAll(), [refresh]);

  const fmt = (v: number) =>
    formatQAR(v);

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ar-SA');
  };

  const filtered = cheques.filter((c: any) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.cheque_number.includes(search) && !c.bank_name.includes(search)) return false;
    return true;
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      cheque_number: c.cheque_number,
      bank_name: c.bank_name,
      cheque_date: c.cheque_date || '',
      amount: c.amount,
      tenant_id: c.tenant_id || '',
      contract_id: c.contract_id || '',
      status: c.status,
      notes: c.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.cheque_number || !form.bank_name) return;
    const data: any = {
      company_id: '',
      cheque_number: form.cheque_number,
      bank_name: form.bank_name,
      cheque_date: form.cheque_date,
      amount: Number(form.amount),
      tenant_id: form.tenant_id,
      contract_id: form.contract_id,
      status: form.status,
      notes: form.notes,
    };
    if (editId) {
      chequeStore.update(editId, data);
    } else {
      chequeStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <PageHeader
        title="الشيكات"
        description="إدارة الشيكات المستلمة من المستأجرين"
        createLabel="إضافة شيك"
        onCreate={openCreate}
      />
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الشيك أو البنك..."
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
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الشيك</TableHead>
                  <TableHead>البنك</TableHead>
                  <TableHead>تاريخ الشيك</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>المستأجر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      لا توجد شيكات
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.cheque_number}</TableCell>
                    <TableCell>{c.bank_name}</TableCell>
                    <TableCell>{formatDate(c.cheque_date)}</TableCell>
                    <TableCell className="font-mono">{fmt(c.amount)}</TableCell>
                    <TableCell>{getTenantName(c.tenant_id)}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} label={statusLabels[c.status] || c.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              chequeStore.remove(c.id);
                              setRefresh(r => r + 1);
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل شيك' : 'إضافة شيك'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">رقم الشيك *</label>
                <Input
                  value={form.cheque_number}
                  onChange={e => setForm(f => ({ ...f, cheque_number: e.target.value }))}
                  placeholder="مثال: CHQ-2026001"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">البنك *</label>
                <Select value={form.bank_name} onValueChange={v => setForm(f => ({ ...f, bank_name: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر البنك" /></SelectTrigger>
                  <SelectContent>
                    {bankNames.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">تاريخ الشيك</label>
                <Input
                  type="date"
                  value={form.cheque_date}
                  onChange={e => setForm(f => ({ ...f, cheque_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">المبلغ</label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">المستأجر</label>
              <Input
                value={form.tenant_id}
                onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value }))}
                placeholder="معرف المستأجر"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">العقد</label>
              <Input
                value={form.contract_id}
                onChange={e => setForm(f => ({ ...f, contract_id: e.target.value }))}
                placeholder="معرف العقد"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات</label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="ملاحظات"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>{editId ? 'تحديث' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}