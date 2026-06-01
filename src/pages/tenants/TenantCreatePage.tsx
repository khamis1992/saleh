import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Save } from 'lucide-react';
import { tenantStore } from '@/services/stores';
import type { Tenant, TenantType } from '@/types';

const tenantTypeLabels: Record<TenantType, string> = {
  individual: 'فرد',
  company: 'شركة',
  government: 'جهة حكومية',
};

const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  blacklisted: 'محظور',
};

export default function TenantCreatePage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const existingTenant = useMemo(() => {
    if (!id) return null;
    return tenantStore.getById(id) || null;
  }, [id]);

  const [form, setForm] = useState<Partial<Tenant>>({
    company_id: '',
    tenant_code: '',
    tenant_type: 'individual' as TenantType,
    full_name: '',
    company_name: '',
    national_id: '',
    passport_number: '',
    cr_number: '',
    nationality: '',
    phone: '',
    email: '',
    employer: '',
    authorized_person: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
    status: 'active',
  });

  const [saving, setSaving] = useState(false);

  // Load existing tenant into form when editing
  useEffect(() => {
    if (existingTenant) {
      setForm({ ...existingTenant });
    }
  }, [existingTenant]);

  const updateField = (field: keyof Tenant, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!form.full_name || !form.full_name.trim()) {
      toast.error('يرجى إدخال الاسم الكامل');
      return;
    }
    if (!form.phone || !form.phone.trim()) {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }
    if (!form.tenant_type) {
      toast.error('يرجى اختيار نوع المستأجر');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        // Edit mode — update existing
        tenantStore.update(id, {
          ...form,
          company_id: '',
        });
        toast.success('تم تحديث بيانات المستأجر بنجاح');
      } else {
        // Create mode — generate code and insert
        const count = tenantStore.getAll().length;
        const year = new Date().getFullYear();
        const tenantCode = `TEN-${year}-${String(count + 1).padStart(4, '0')}`;
        tenantStore.create({
          ...form,
          tenant_code: form.tenant_code || tenantCode,
          company_id: '',
        } as Omit<Tenant, 'id'>);
        toast.success('تم إنشاء المستأجر بنجاح');
      }
      navigate('/tenants');
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tenants')} className="text-xs text-gray-500">
          <ArrowRight className="h-4 w-4 ml-1" />{t.common.back}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? t.tenants.edit : t.tenants.create}
        </h1>
      </div>

      {/* Tenant Type & Core Info Card */}
      <Card className="mb-4">
        <CardHeader><CardTitle>نوع المستأجر والمعلومات الأساسية</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tenant Type */}
          <div className="space-y-2">
            <Label>النوع *</Label>
            <Select
              value={form.tenant_type || 'individual'}
              onValueChange={(v) => updateField('tenant_type', v as TenantType)}
            >
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tenantTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tenant Code */}
          <div className="space-y-2">
            <Label>{t.tenants.code}</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder={isEdit ? form.tenant_code : 'تلقائي'}
              value={form.tenant_code || ''}
              onChange={(e) => updateField('tenant_code', e.target.value)}
              disabled={!isEdit}
            />
            {!isEdit && (
              <p className="text-[10px] text-gray-400">يتم توليده تلقائياً عند الحفظ</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label>{t.tenants.name} *</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="الاسم الكامل"
              value={form.full_name || ''}
              onChange={(e) => updateField('full_name', e.target.value)}
            />
          </div>

          {/* Company Name — conditional: only for company */}
          {form.tenant_type === 'company' && (
            <div className="space-y-2">
              <Label>اسم الشركة *</Label>
              <Input
                className="h-9 text-sm rounded-lg border-gray-200"
                placeholder="اسم الشركة التجاري"
                value={form.company_name || ''}
                onChange={(e) => updateField('company_name', e.target.value)}
              />
            </div>
          )}

          {/* CR Number — conditional: only for company */}
          {form.tenant_type === 'company' && (
            <div className="space-y-2">
              <Label>رقم السجل التجاري</Label>
              <Input
                className="h-9 text-sm rounded-lg border-gray-200"
                placeholder="رقم السجل التجاري"
                value={form.cr_number || ''}
                onChange={(e) => updateField('cr_number', e.target.value)}
              />
            </div>
          )}

          {/* Employer — conditional: only for individual */}
          {form.tenant_type === 'individual' && (
            <div className="space-y-2">
              <Label>جهة العمل</Label>
              <Input
                className="h-9 text-sm rounded-lg border-gray-200"
                placeholder="جهة العمل"
                value={form.employer || ''}
                onChange={(e) => updateField('employer', e.target.value)}
              />
            </div>
          )}

          {/* Phone */}
          <div className="space-y-2">
            <Label>{t.tenants.phone} *</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="05xxxxxxxx"
              value={form.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>{t.tenants.email}</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="email@example.com"
              value={form.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>{t.tenants.status}</Label>
            <Select
              value={form.status || 'active'}
              onValueChange={(v) => updateField('status', v)}
            >
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Identity & Nationality Card */}
      <Card className="mb-4">
        <CardHeader><CardTitle>الهوية والجنسية</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* National ID */}
          <div className="space-y-2">
            <Label>{t.tenants.nationalId}</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="رقم الهوية الوطنية"
              value={form.national_id || ''}
              onChange={(e) => updateField('national_id', e.target.value)}
            />
          </div>

          {/* Passport Number */}
          <div className="space-y-2">
            <Label>رقم الجواز</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="رقم الجواز"
              value={form.passport_number || ''}
              onChange={(e) => updateField('passport_number', e.target.value)}
            />
          </div>

          {/* Nationality */}
          <div className="space-y-2">
            <Label>الجنسية</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="الجنسية"
              value={form.nationality || ''}
              onChange={(e) => updateField('nationality', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Additional Info Card */}
      <Card className="mb-4">
        <CardHeader><CardTitle>معلومات الاتصال والإدارة</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Authorized Person */}
          <div className="space-y-2">
            <Label>الشخص المسؤول</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="اسم الشخص المسؤول"
              value={form.authorized_person || ''}
              onChange={(e) => updateField('authorized_person', e.target.value)}
            />
          </div>

          {/* Emergency Contact Name */}
          <div className="space-y-2">
            <Label>اسم جهة اتصال الطوارئ</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="اسم جهة اتصال الطوارئ"
              value={form.emergency_contact_name || ''}
              onChange={(e) => updateField('emergency_contact_name', e.target.value)}
            />
          </div>

          {/* Emergency Contact Phone */}
          <div className="space-y-2">
            <Label>هاتف الطوارئ</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="رقم هاتف الطوارئ"
              value={form.emergency_contact_phone || ''}
              onChange={(e) => updateField('emergency_contact_phone', e.target.value)}
            />
          </div>

          {/* Address */}
          <div className="space-y-2 lg:col-span-3">
            <Label>العنوان</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="العنوان الكامل"
              value={form.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end mt-6">
        <Button
          variant="outline"
          onClick={() => navigate('/tenants')}
          className="h-9 text-sm rounded-lg border-gray-200"
        >
          {t.common.cancel}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4"
        >
          <Save className="h-4 w-4" />
          {saving ? 'جارٍ الحفظ...' : t.common.save}
        </Button>
      </div>
    </div>
  );
}
