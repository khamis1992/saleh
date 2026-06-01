import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Filter, Eye, Pencil, Trash2, Plus, Star, Phone, Mail, MapPin, Building2, X,
} from 'lucide-react';

interface Vendor {
  id: string;
  vendor_code: string;
  vendor_name: string;
  vendor_type: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  bank_name: string;
  iban: string;
  payment_terms: string;
  rating: number;
  status: string;
}

const initialVendors: Vendor[] = [
  {
    id: 'v1', vendor_code: 'VEN-001', vendor_name: 'شركة مواد البناء المتحدة', vendor_type: 'material_supplier',
    contact_person: 'أحمد الشمري', phone: '0555123456', email: 'ahmed@unitedbm.com',
    address: 'الرياض - حي الصناعية', bank_name: 'البنك الأهلي', iban: 'SA0380000000608010167519',
    payment_terms: 'صافي 30 يوم', rating: 4, status: 'active',
  },
  {
    id: 'v2', vendor_code: 'VEN-002', vendor_name: 'مؤسسة الخليج للمقاولات', vendor_type: 'service_provider',
    contact_person: 'خالد الدوسري', phone: '0566789012', email: 'khalid@gulfcont.com',
    address: 'جدة - شارع الملك عبدالعزيز', bank_name: 'مصرف الراجحي', iban: 'SA6080000160608010167519',
    payment_terms: '50% دفعة مقدمة', rating: 5, status: 'active',
  },
  {
    id: 'v3', vendor_code: 'VEN-003', vendor_name: 'مكتب المهندسون العرب', vendor_type: 'consultant',
    contact_person: 'م. سامي الحربي', phone: '0501234567', email: 'sami@arab-eng.com',
    address: 'الدمام - طريق الملك فهد', bank_name: 'بنك الرياض', iban: 'SA2080000360608010167519',
    payment_terms: 'صافي 45 يوم', rating: 4, status: 'active',
  },
  {
    id: 'v4', vendor_code: 'VEN-004', vendor_name: 'مؤسسة العمران للتكييف', vendor_type: 'maintenance_provider',
    contact_person: 'فهد العمران', phone: '0539876543', email: 'fahd@omran-hvac.com',
    address: 'الرياض - حي المروج', bank_name: 'البنك السعودي الفرنسي', iban: 'SA3580000120608010167519',
    payment_terms: 'صافي 30 يوم', rating: 3, status: 'active',
  },
  {
    id: 'v5', vendor_code: 'VEN-005', vendor_name: 'شركة الكهرباء السعودية', vendor_type: 'utility_provider',
    contact_person: 'خدمة العملاء', phone: '920000222', email: 'cs@se.com.sa',
    address: 'الرياض - طريق الملك سلمان', bank_name: 'البنك الأهلي', iban: 'SA4480000450608010167519',
    payment_terms: 'فاتورة شهرية', rating: 4, status: 'active',
  },
  {
    id: 'v6', vendor_code: 'VEN-006', vendor_name: 'شركة المياه الوطنية', vendor_type: 'utility_provider',
    contact_person: 'خدمة العملاء', phone: '920001744', email: 'cs@nwc.com.sa',
    address: 'الرياض - حي النخيل', bank_name: 'مصرف الراجحي', iban: 'SA5580000550608010167519',
    payment_terms: 'فاتورة شهرية', rating: 3, status: 'active',
  },
  {
    id: 'v7', vendor_code: 'VEN-007', vendor_name: 'مصنع الرياض للحديد', vendor_type: 'material_supplier',
    contact_person: 'نايف السبيعي', phone: '0543217890', email: 'naif@riyadhsteel.com',
    address: 'الرياض - المدينة الصناعية الثانية', bank_name: 'البنك العربي الوطني', iban: 'SA1080000660608010167519',
    payment_terms: 'صافي 60 يوم', rating: 4, status: 'inactive',
  },
  {
    id: 'v8', vendor_code: 'VEN-008', vendor_name: 'شركة الأمان للحراسة', vendor_type: 'other',
    contact_person: 'تركي المطيري', phone: '0512345678', email: 'turki@amansec.com',
    address: 'الدمام - حي الفيصلية', bank_name: 'مصرف الإنماء', iban: 'SA4180000770608010167519',
    payment_terms: 'صافي 15 يوم', rating: 5, status: 'active',
  },
];

const vendorTypeLabels: Record<string, string> = {
  material_supplier: 'مورد مواد',
  service_provider: 'مقدم خدمات',
  consultant: 'استشاري',
  maintenance_provider: 'مزود صيانة',
  utility_provider: 'مزود خدمات عامة',
  other: 'أخرى',
};

export default function VendorsPage() {
  const { t } = useLocale();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Vendor>>({
    vendor_code: '', vendor_name: '', vendor_type: 'material_supplier',
    contact_person: '', phone: '', email: '', address: '',
    bank_name: '', iban: '', payment_terms: 'صافي 30 يوم', rating: 3, status: 'active',
  });

  const data = useMemo(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return vendors;
  }, [vendors]);

  const filtered = useMemo(() => {
    return data.filter((v) => {
      if (typeFilter !== 'all' && v.vendor_type !== typeFilter) return false;
      if (search && !v.vendor_name.includes(search) && !v.vendor_code.includes(search) && !v.contact_person.includes(search)) return false;
      return true;
    });
  }, [data, search, typeFilter]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ الكود');
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      vendor_code: `VEN-${String(vendors.length + 1).padStart(3, '0')}`,
      vendor_name: '', vendor_type: 'material_supplier',
      contact_person: '', phone: '', email: '', address: '',
      bank_name: '', iban: '', payment_terms: 'صافي 30 يوم', rating: 3, status: 'active',
    });
    setShowModal(true);
  };

  const openEdit = (v: Vendor) => {
    setEditingId(v.id);
    setForm({ ...v });
    setShowModal(true);
  };

  const saveVendor = () => {
    if (!form.vendor_name || !form.vendor_code) return;
    if (editingId) {
      setVendors((prev) => prev.map((v) => (v.id === editingId ? { ...v, ...form } as Vendor : v)));
      toast.success('تم تعديل المورد بنجاح');
    } else {
      const newVendor: Vendor = { id: Date.now().toString(36), ...form } as Vendor;
      setVendors((prev) => [...prev, newVendor]);
      toast.success('تم إضافة المورد بنجاح');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setVendors((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    toast.success(`تم حذف المورد ${deleteTarget.vendor_name} بنجاح`);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الموردون</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} مورد — إدارة الموردين ومقدمي الخدمات
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          إضافة مورد
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t.common.search + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="نوع المورد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {Object.entries(vendorTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || typeFilter !== 'all') && (
            <span className="text-xs text-gray-400">{filtered.length} نتيجة</span>
          )}
        </div>
      </div>

      {/* Table Card */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow >
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الكود</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">اسم المورد</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">النوع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">جهة الاتصال</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الهاتف</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">التقييم</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الحالة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[100px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <Building2 className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا يوجد موردون</p>
                        <p className="text-xs text-gray-400">لم يتم العثور على أي نتائج</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSearch(''); setTypeFilter('all'); }}
                          className="h-8 text-xs rounded-lg mt-1"
                        >
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((v) => (
                  <TableRow
                    key={v.id}
                    className=""
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(v.vendor_code); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {v.vendor_code}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-800">{v.vendor_name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{vendorTypeLabels[v.vendor_type] || v.vendor_type}</TableCell>
                    <TableCell className="text-sm text-gray-600">{v.contact_person}</TableCell>
                    <TableCell className="text-sm text-gray-600" dir="ltr">{v.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm">{v.rating}/5</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} label={v.status === 'active' ? 'نشط' : 'غير نشط'} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => setViewVendor(v)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => openEdit(v)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تعديل</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(v)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>حذف</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 0 && (
            <div className="py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-gray-500">عرض {filtered.length} من {vendors.length} مورد</span>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المورد <strong>{deleteTarget?.vendor_name}</strong> ({deleteTarget?.vendor_code})؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل مورد' : 'إضافة مورد جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>كود المورد</Label>
              <Input value={form.vendor_code} onChange={(e) => setForm({ ...form, vendor_code: e.target.value })} />
            </div>
            <div>
              <Label>اسم المورد *</Label>
              <Input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} />
            </div>
            <div>
              <Label>نوع المورد</Label>
              <Select value={form.vendor_type} onValueChange={(v) => setForm({ ...form, vendor_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(vendorTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>التقييم</Label>
              <Select value={String(form.rating)} onValueChange={(v) => setForm({ ...form, rating: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <SelectItem key={r} value={String(r)}>{r}/5</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>جهة الاتصال</Label>
              <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
            </div>
            <div>
              <Label>الهاتف</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
            </div>
            <div className="col-span-2">
              <Label>البريد الإلكتروني</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" />
            </div>
            <div className="col-span-2">
              <Label>العنوان</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>البنك</Label>
              <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
            </div>
            <div>
              <Label>الآيبان</Label>
              <Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} dir="ltr" />
            </div>
            <div>
              <Label>شروط الدفع</Label>
              <Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button onClick={saveVendor}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
