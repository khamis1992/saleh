import { useState, useEffect } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Shield, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { roleStore, type RoleWithPermissions } from '@/services/stores';

// Define all available modules and their permission actions
const PERMISSION_MODULES: { module: string; label: string; permissions: { code: string; label: string }[] }[] = [
  { module: 'dashboard', label: 'لوحة التحكم', permissions: [{ code: 'dashboard.view', label: 'عرض' }] },
  { module: 'projects', label: 'المشاريع', permissions: [{ code: 'projects.view', label: 'عرض' }, { code: 'projects.edit', label: 'تعديل' }] },
  { module: 'lands', label: 'الأراضي', permissions: [{ code: 'lands.view', label: 'عرض' }, { code: 'lands.edit', label: 'تعديل' }] },
  { module: 'contractors', label: 'المقاولين', permissions: [{ code: 'contractors.view', label: 'عرض' }, { code: 'contractors.edit', label: 'تعديل' }] },
  { module: 'properties', label: 'العقارات', permissions: [{ code: 'properties.view', label: 'عرض' }, { code: 'properties.edit', label: 'تعديل' }] },
  { module: 'units', label: 'الوحدات', permissions: [{ code: 'units.view', label: 'عرض' }, { code: 'units.edit', label: 'تعديل' }] },
  { module: 'tenants', label: 'المستأجرين', permissions: [{ code: 'tenants.view', label: 'عرض' }, { code: 'tenants.edit', label: 'تعديل' }] },
  { module: 'leases', label: 'عقود الإيجار', permissions: [{ code: 'leases.view', label: 'عرض' }, { code: 'leases.edit', label: 'تعديل' }] },
  { module: 'invoices', label: 'الفواتير', permissions: [{ code: 'invoices.view', label: 'عرض' }, { code: 'invoices.edit', label: 'تعديل' }] },
  { module: 'receipts', label: 'سندات القبض', permissions: [{ code: 'receipts.view', label: 'عرض' }, { code: 'receipts.edit', label: 'تعديل' }] },
  { module: 'schedules', label: 'جدول الدفعات', permissions: [{ code: 'schedules.view', label: 'عرض' }, { code: 'schedules.edit', label: 'تعديل' }] },
  { module: 'maintenance', label: 'الصيانة', permissions: [{ code: 'maintenance.view', label: 'عرض' }, { code: 'maintenance.edit', label: 'تعديل' }] },
  { module: 'inspections', label: 'المعاينات', permissions: [{ code: 'inspections.view', label: 'عرض' }, { code: 'inspections.edit', label: 'تعديل' }] },
  { module: 'workorders', label: 'أوامر العمل', permissions: [{ code: 'workorders.view', label: 'عرض' }, { code: 'workorders.edit', label: 'تعديل' }] },
  { module: 'preventive', label: 'الصيانة الوقائية', permissions: [{ code: 'preventive.view', label: 'عرض' }, { code: 'preventive.edit', label: 'تعديل' }] },
  { module: 'construction', label: 'الإنشاءات', permissions: [{ code: 'construction.view', label: 'عرض' }, { code: 'construction.edit', label: 'تعديل' }] },
  { module: 'daily', label: 'التقارير اليومية', permissions: [{ code: 'daily.view', label: 'عرض' }, { code: 'daily.edit', label: 'تعديل' }] },
  { module: 'procurement', label: 'المشتريات', permissions: [{ code: 'procurement.view', label: 'عرض' }, { code: 'procurement.edit', label: 'تعديل' }] },
  { module: 'inventory', label: 'المخزون', permissions: [{ code: 'inventory.view', label: 'عرض' }, { code: 'inventory.edit', label: 'تعديل' }] },
  { module: 'warehouses', label: 'المستودعات', permissions: [{ code: 'warehouses.view', label: 'عرض' }, { code: 'warehouses.edit', label: 'تعديل' }] },
  { module: 'equipment', label: 'المعدات', permissions: [{ code: 'equipment.view', label: 'عرض' }, { code: 'equipment.edit', label: 'تعديل' }] },
  { module: 'finance', label: 'المالية', permissions: [{ code: 'finance.view', label: 'عرض' }, { code: 'finance.edit', label: 'تعديل' }] },
  { module: 'accounts', label: 'الحسابات', permissions: [{ code: 'accounts.view', label: 'عرض' }, { code: 'accounts.edit', label: 'تعديل' }] },
  { module: 'journal', label: 'القيود اليومية', permissions: [{ code: 'journal.view', label: 'عرض' }, { code: 'journal.edit', label: 'تعديل' }] },
  { module: 'costcenters', label: 'مراكز التكلفة', permissions: [{ code: 'costcenters.view', label: 'عرض' }, { code: 'costcenters.edit', label: 'تعديل' }] },
  { module: 'banks', label: 'الحسابات البنكية', permissions: [{ code: 'banks.view', label: 'عرض' }, { code: 'banks.edit', label: 'تعديل' }] },
  { module: 'cheques', label: 'الشيكات', permissions: [{ code: 'cheques.view', label: 'عرض' }, { code: 'cheques.edit', label: 'تعديل' }] },
  { module: 'budgets', label: 'الميزانيات', permissions: [{ code: 'budgets.view', label: 'عرض' }, { code: 'budgets.edit', label: 'تعديل' }] },
  { module: 'employees', label: 'الموظفين', permissions: [{ code: 'employees.view', label: 'عرض' }, { code: 'employees.edit', label: 'تعديل' }] },
  { module: 'attendance', label: 'الحضور', permissions: [{ code: 'attendance.view', label: 'عرض' }, { code: 'attendance.edit', label: 'تعديل' }] },
  { module: 'payroll', label: 'الرواتب', permissions: [{ code: 'payroll.view', label: 'عرض' }, { code: 'payroll.edit', label: 'تعديل' }] },
  { module: 'leaves', label: 'الإجازات', permissions: [{ code: 'leaves.view', label: 'عرض' }, { code: 'leaves.edit', label: 'تعديل' }] },
  { module: 'reports', label: 'التقارير', permissions: [{ code: 'reports.view', label: 'عرض' }] },
];

export default function RolesPage() {
  const { t } = useLocale();
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);

  useEffect(() => {
    setRoles(roleStore.getAll());
  }, []);

  const openPermissionsDialog = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setTempPermissions([...role.permissions]);
    setDialogOpen(true);
  };

  const togglePermission = (code: string) => {
    setTempPermissions(prev =>
      prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]
    );
  };

  const toggleAllModule = (module: string, codes: string[]) => {
    const allSelected = codes.every(c => tempPermissions.includes(c));
    if (allSelected) {
      setTempPermissions(prev => prev.filter(p => !codes.includes(p)));
    } else {
      setTempPermissions(prev => [...new Set([...prev, ...codes])]);
    }
  };

  const handleSavePermissions = () => {
    if (!editingRole) return;
    roleStore.update(editingRole.id, { permissions: tempPermissions });
    setRoles(roleStore.getAll());
    setDialogOpen(false);
    toast.success('تم حفظ الصلاحيات بنجاح');
  };

  return (
    <div className="bg-gray-50 min-h-full" dir="rtl">

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.settings.roles}</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة الأدوار والصلاحيات في النظام</p>
        </div>
        <Button className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4">
          <Plus className="h-4 w-4" />إضافة دور
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold text-gray-500">الدور</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">الاسم بالإنجليزية</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">الوصف</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">الصلاحيات</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">نوع الدور</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 w-[100px]">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.name_ar}</TableCell>
                <TableCell className="text-sm text-gray-500">{r.description}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {r.permissions.includes('*') ? 'كافة الصلاحيات' : `${r.permissions.length} صلاحية`}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.is_system_role ? (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 rounded-full">دور نظام</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 rounded-full">قابل للتعديل</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-sm text-[#3B82F6] hover:bg-blue-50"
                    onClick={() => openPermissionsDialog(r)}
                  >
                    تعديل الصلاحيات
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Permission Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              تعديل صلاحيات: {editingRole?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Select All / Deselect All */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs rounded-lg border-gray-200 text-[#3B82F6]"
                onClick={() => {
                  const allCodes = PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.code));
                  setTempPermissions(allCodes);
                }}
              >
                تحديد الكل
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs rounded-lg border-gray-200 text-gray-500"
                onClick={() => setTempPermissions([])}
              >
                إلغاء الكل
              </Button>
            </div>

            {/* Module permissions */}
            {PERMISSION_MODULES.map(mod => (
              <div key={mod.module} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                  <Label
                    className="text-sm font-semibold text-gray-700 cursor-pointer"
                    onClick={() => toggleAllModule(mod.module, mod.permissions.map(p => p.code))}
                  >
                    {mod.label}
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] text-gray-400 hover:text-[#3B82F6]"
                    onClick={() => toggleAllModule(mod.module, mod.permissions.map(p => p.code))}
                  >
                    {mod.permissions.every(p => tempPermissions.includes(p.code)) ? 'إلغاء الكل' : 'تحديد الكل'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {mod.permissions.map(perm => (
                    <label
                      key={perm.code}
                      className="flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      <Checkbox
                        checked={tempPermissions.includes(perm.code)}
                        onCheckedChange={() => togglePermission(perm.code)}
                        className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                      />
                      <span className="text-xs text-gray-600">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="gap-1 text-sm h-9 rounded-lg border-gray-200"
            >
              <X className="h-4 w-4" />إلغاء
            </Button>
            <Button
              onClick={handleSavePermissions}
              className="gap-1 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg"
            >
              <Save className="h-4 w-4" />حفظ الصلاحيات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
