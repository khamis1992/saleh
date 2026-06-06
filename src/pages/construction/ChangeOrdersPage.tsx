import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter, MoreHorizontal, Pencil, Trash2, FileEdit, TrendingDown, TrendingUp } from 'lucide-react';
import { createStore } from '@/services/dataService';
import { projectStore, getProjectName } from '@/services/stores';

// ============================================================
// TYPES & SEED DATA
// ============================================================
export interface ChangeOrder {
  id: string;
  company_id: string;
  change_order_number: string;
  project_id: string;
  contract_id: string;
  description: string;
  reason: string;
  original_amount: number;
  new_amount: number;
  variance: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
}

export const seedChangeOrders: ChangeOrder[] = [
  { id: 'co-1', company_id: '', change_order_number: 'CO-2026-001', project_id: 'prj-1', contract_id: 'ctr-1', description: 'تعديل أعمال الحفر بسبب وجود صخور', reason: 'ظروف موقع غير متوقعة', original_amount: 850000, new_amount: 1050000, variance: 200000, status: 'approved', created_at: '2026-02-01' },
  { id: 'co-2', company_id: '', change_order_number: 'CO-2026-002', project_id: 'prj-2', contract_id: 'ctr-2', description: 'إضافة مصعد إضافي للمبنى', reason: 'تغيير في المواصفات', original_amount: 1200000, new_amount: 1350000, variance: 150000, status: 'submitted', created_at: '2026-03-15' },
  { id: 'co-3', company_id: '', change_order_number: 'CO-2026-003', project_id: 'prj-1', contract_id: 'ctr-1', description: 'تخفيض أعمال التشطيبات', reason: 'توفير في التكاليف', original_amount: 500000, new_amount: 420000, variance: -80000, status: 'draft', created_at: '2026-04-10' },
  { id: 'co-4', company_id: '', change_order_number: 'CO-2026-004', project_id: 'prj-3', contract_id: 'ctr-3', description: 'استبدال مواد العزل الحراري', reason: 'عدم توفر المواد المحددة', original_amount: 320000, new_amount: 380000, variance: 60000, status: 'rejected', created_at: '2026-05-01' },
];

// In-memory store
const changeOrderStore = createStore<ChangeOrder>({ key: 'erp_change_orders', seed: seedChangeOrders });

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'مقدم',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

const emptyForm = {
  change_order_number: '',
  project_id: '',
  contract_id: '',
  description: '',
  reason: '',
  original_amount: 0,
  new_amount: 0,
  variance: 0,
  status: 'draft' as string,
};

export default function ChangeOrdersPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const orders = useMemo(() => changeOrderStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);

  const filtered = orders.filter((o: ChangeOrder) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search && !o.change_order_number.includes(search) && !o.description.includes(search) && !getProjectName(o.project_id).includes(search)) return false;
    return true;
  });

  const fmt = (v: number) =>
    formatQAR(v);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, change_order_number: `CO-${new Date().getFullYear()}-${String(Date.now() % 1000).padStart(3, '0')}` });
    setModalOpen(true);
  };

  const openEdit = (o: ChangeOrder) => {
    setEditId(o.id);
    setForm({
      change_order_number: o.change_order_number,
      project_id: o.project_id,
      contract_id: o.contract_id,
      description: o.description,
      reason: o.reason,
      original_amount: o.original_amount,
      new_amount: o.new_amount,
      variance: o.new_amount - o.original_amount,
      status: o.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.change_order_number || !form.project_id) return;
    const variance = Number(form.new_amount) - Number(form.original_amount);
    const data: any = {
      company_id: '',
      change_order_number: form.change_order_number,
      project_id: form.project_id,
      contract_id: form.contract_id,
      description: form.description,
      reason: form.reason,
      original_amount: Number(form.original_amount),
      new_amount: Number(form.new_amount),
      variance,
      status: form.status,
      created_at: new Date().toISOString().split('T')[0],
    };
    if (editId) {
      changeOrderStore.update(editId, data);
    } else {
      changeOrderStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  const recalcVariance = (original: number, newVal: number) => {
    return newVal - original;
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <PageHeader
        title="أوامر التغيير"
        description={`إدارة أوامر التغيير في عقود المقاولين (${orders.length} أمر)`}
        createLabel="أمر تغيير جديد"
        onCreate={openCreate}
      />
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الأمر أو الوصف..."
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
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="submitted">مقدم</SelectItem>
                <SelectItem value="approved">معتمد</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الأمر</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ الأصلي</TableHead>
                  <TableHead>المبلغ الجديد</TableHead>
                  <TableHead>الفرق</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      لا توجد أوامر تغيير
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((o: ChangeOrder) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium font-mono text-sm">{o.change_order_number}</TableCell>
                    <TableCell className="text-sm">{getProjectName(o.project_id) || o.project_id}</TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate">{o.description}</TableCell>
                    <TableCell className="font-mono text-sm">{fmt(o.original_amount)}</TableCell>
                    <TableCell className="font-mono text-sm">{fmt(o.new_amount)}</TableCell>
                    <TableCell>
                      <span className={`font-mono text-sm flex items-center gap-1 ${o.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {o.variance >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {fmt(Math.abs(o.variance))}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{o.reason}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} label={statusLabels[o.status] || o.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => openEdit(o)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              changeOrderStore.remove(o.id);
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
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل أمر تغيير' : 'أمر تغيير جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">رقم أمر التغيير *</label>
                <Input value={form.change_order_number} onChange={e => setForm(f => ({ ...f, change_order_number: e.target.value }))} placeholder="CO-2026-001" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">المشروع *</label>
                <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">رقم العقد</label>
              <Input value={form.contract_id} onChange={e => setForm(f => ({ ...f, contract_id: e.target.value }))} placeholder="معرف العقد" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الوصف</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف أمر التغيير..." rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">السبب</label>
              <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="سبب التغيير..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">المبلغ الأصلي</label>
                <Input type="number" value={form.original_amount} onChange={e => setForm(f => ({ ...f, original_amount: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">المبلغ الجديد</label>
                <Input type="number" value={form.new_amount} onChange={e => setForm(f => ({ ...f, new_amount: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الفرق</label>
              <Input
                type="number"
                value={Number(form.new_amount) - Number(form.original_amount)}
                readOnly
                className={`bg-muted font-bold ${Number(form.new_amount) - Number(form.original_amount) >= 0 ? 'text-red-600' : 'text-green-600'}`}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="submitted">مقدم</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
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