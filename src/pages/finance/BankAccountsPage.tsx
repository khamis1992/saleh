import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MoneyDisplay } from '@/components/shared/Phase3Components';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { bankAccountStore } from '@/services/stores';

const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  closed: 'مغلق',
};

const currencyLabels: Record<string, string> = {
  SAR: 'ريال سعودي',
  USD: 'دولار أمريكي',
  EUR: 'يورو',
};

const emptyForm = {
  bank_name: '',
  account_name: '',
  account_number: '',
  iban: '',
  currency: 'QAR' as string,
  opening_balance: 0,
  current_balance: 0,
  status: 'active' as string,
};

export default function BankAccountsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const accounts = useMemo(() => bankAccountStore.getAll(), [refresh]);

  const filtered = accounts.filter((acc: any) => {
    if (statusFilter !== 'all' && acc.status !== statusFilter) return false;
    if (search && !acc.bank_name.includes(search) && !acc.account_name.includes(search) && !acc.account_number.includes(search)) return false;
    return true;
  });

  const fmt = (v: number) =>
    formatQAR(v);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (acc: any) => {
    setEditId(acc.id);
    setForm({
      bank_name: acc.bank_name,
      account_name: acc.account_name,
      account_number: acc.account_number,
      iban: acc.iban,
      currency: acc.currency,
      opening_balance: acc.opening_balance,
      current_balance: acc.current_balance,
      status: acc.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.bank_name || !form.account_name || !form.account_number) return;
    const data: any = {
      company_id: '',
      bank_name: form.bank_name,
      account_name: form.account_name,
      account_number: form.account_number,
      iban: form.iban,
      currency: form.currency,
      opening_balance: Number(form.opening_balance),
      current_balance: Number(form.current_balance),
      status: form.status,
    };
    if (editId) {
      bankAccountStore.update(editId, data);
    } else {
      bankAccountStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <PageHeader
        title="الحسابات البنكية"
        description={`إدارة الحسابات البنكية (${accounts.length} حساب)`}
        createLabel="إضافة حساب بنكي"
        onCreate={openCreate}
      />
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث باسم البنك أو الحساب..."
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
                  <TableHead>البنك</TableHead>
                  <TableHead>اسم الحساب</TableHead>
                  <TableHead>رقم الحساب</TableHead>
                  <TableHead>رقم الحساب الدولي (IBAN)</TableHead>
                  <TableHead>العملة</TableHead>
                  <TableHead>الرصيد الافتتاحي</TableHead>
                  <TableHead>الرصيد الحالي</TableHead>
                  <TableHead>الفرق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      لا توجد حسابات بنكية
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((acc: any) => {
                  const diff = acc.current_balance - acc.opening_balance;
                  const isPositive = diff >= 0;
                  return (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium">{acc.bank_name}</TableCell>
                      <TableCell>{acc.account_name}</TableCell>
                      <TableCell className="font-mono text-sm">{acc.account_number}</TableCell>
                      <TableCell className="font-mono text-xs" dir="ltr">{acc.iban}</TableCell>
                      <TableCell>{currencyLabels[acc.currency] || acc.currency}</TableCell>
                      <TableCell className="font-mono">{fmt(acc.opening_balance)}</TableCell>
                      <TableCell className="font-mono">{fmt(acc.current_balance)}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center gap-1 font-mono text-sm',
                          isPositive ? 'text-green-600' : 'text-red-600'
                        )}>
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isPositive ? '+' : ''}{fmt(Math.abs(diff))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={acc.status} label={statusLabels[acc.status] || acc.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => openEdit(acc)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                bankAccountStore.remove(acc.id);
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">اسم البنك *</label>
                <Input
                  value={form.bank_name}
                  onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                  placeholder="مثال: مصرف الراجحي"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">اسم الحساب *</label>
                <Input
                  value={form.account_name}
                  onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
                  placeholder="مثال: الحساب الجاري"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">رقم الحساب *</label>
                <Input
                  value={form.account_number}
                  onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                  placeholder="رقم الحساب"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">رقم الحساب الدولي (IBAN)</label>
                <Input
                  value={form.iban}
                  onChange={e => setForm(f => ({ ...f, iban: e.target.value }))}
                  placeholder="SA..."
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">العملة</label>
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(currencyLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v} ({k})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">الرصيد الافتتاحي</label>
                <Input
                  type="number"
                  value={form.opening_balance}
                  onChange={e => setForm(f => ({ ...f, opening_balance: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الرصيد الحالي</label>
                <Input
                  type="number"
                  value={form.current_balance}
                  onChange={e => setForm(f => ({ ...f, current_balance: Number(e.target.value) }))}
                />
              </div>
            </div>
            {/* Balance difference display */}
            <div className="bg-muted rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span>الفرق بين الرصيدين</span>
                <span className={cn(
                  'font-mono font-bold',
                  (Number(form.current_balance) - Number(form.opening_balance)) >= 0
                    ? 'text-green-600' : 'text-red-600'
                )}>
                  {fmt(Number(form.current_balance) - Number(form.opening_balance))}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="closed">مغلق</SelectItem>
                </SelectContent>
              </Select>
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