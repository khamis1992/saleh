// Tenant Portal — Profile (view + edit personal info)

import { useState, useMemo, useEffect } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { tenantStore } from '@/services/stores';
import { generateId } from '@/services/dataService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  User, Mail, Phone, MapPin, Shield, Briefcase, Save, Edit, CheckCircle2,
  Building, Hash, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

export default function TenantProfilePage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const tenantId = session?.tenantId;
  const tenant = useMemo(() => (tenantId ? tenantStore.getById(tenantId) : null), [tenantId]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (tenant) setForm(tenant);
  }, [tenant]);

  const handleSave = () => {
    if (!tenantId) return;
    tenantStore.update(tenantId, form);
    toast.success('تم تحديث البيانات بنجاح');
    setEditing(false);
  };

  if (!tenant) return <div className="text-center py-12 text-[#64748d]">لم يتم العثور على البيانات</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">الملف الشخصي</h1>
          <p className="text-xs text-[#64748d] mt-0.5">بياناتك الشخصية والتواصل</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="h-10 text-xs bg-[#533afd] hover:bg-blue-700">
            <Edit className="h-4 w-4 ml-1" />
            تعديل البيانات
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(false); setForm(tenant); }} className="h-10 text-xs">
              إلغاء
            </Button>
            <Button onClick={handleSave} className="h-10 text-xs bg-[#533afd] hover:bg-blue-700">
              <Save className="h-4 w-4 ml-1" />
              حفظ التغييرات
            </Button>
          </div>
        )}
      </div>

      {/* Profile card */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px]">
              {(tenant.full_name || tenant.company_name).charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#061b31]">{tenant.full_name || tenant.company_name}</h2>
              <p className="text-xs text-[#64748d] mt-0.5 flex items-center gap-2">
                <Hash className="h-3 w-3" />
                {tenant.tenant_code}
                {tenant.tenant_type === 'company' && <span className="px-1.5 py-0.5 bg-[rgba(83,58,253,0.06)] text-[#533afd] text-xs rounded">{tt('tenants.types.company', 'شركة')}</span>}
                {tenant.tenant_type === 'government' && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded">{tt('tenants.types.government', 'جهة حكومية')}</span>}
                {tenant.tenant_type === 'individual' && <span className="px-1.5 py-0.5 bg-violet-50 text-violet-700 text-xs rounded">{tt('tenants.types.individual', 'فرد')}</span>}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              tenant.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {tenant.status === 'active' ? '● نشط' : '○ غير نشط'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
            <User className="h-4 w-4 text-[#533afd]" />
            المعلومات الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">{tt('hr.fullName', 'الاسم الكامل')}</Label>
            {editing ? (
              <Input value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1 h-10 text-[13px]" />
            ) : (
              <p className="mt-1 text-[13px] font-semibold text-[#061b31]">{tenant.full_name || '—'}</p>
            )}
          </div>
          {tenant.tenant_type === 'company' && (
            <div>
              <Label className="text-xs">اسم الشركة</Label>
              {editing ? (
                <Input value={form.company_name || ''} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="mt-1 h-10 text-[13px]" />
              ) : (
                <p className="mt-1 text-[13px] font-semibold text-[#061b31]">{tenant.company_name || '—'}</p>
              )}
            </div>
          )}
          {tenant.tenant_type === 'company' && (
            <div>
              <Label className="text-xs">السجل التجاري</Label>
              {editing ? (
                <Input value={form.cr_number || ''} onChange={(e) => setForm({ ...form, cr_number: e.target.value })} className="mt-1 h-10 text-[13px]" dir="ltr" />
              ) : (
                <p className="mt-1 text-[13px] font-semibold text-[#061b31]" dir="ltr">{tenant.cr_number || '—'}</p>
              )}
            </div>
          )}
          <div>
            <Label className="text-xs">رقم الهوية / الجواز</Label>
            {editing ? (
              <Input value={form.national_id || form.passport_number || ''} onChange={(e) => setForm({ ...form, national_id: e.target.value })} className="mt-1 h-10 text-[13px]" dir="ltr" />
            ) : (
              <p className="mt-1 text-[13px] font-semibold text-[#061b31]" dir="ltr">
                {tenant.national_id || tenant.passport_number || '—'}
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs">{tt('hr.nationality', 'الجنسية')}</Label>
            {editing ? (
              <Input value={form.nationality || ''} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="mt-1 h-10 text-[13px]" />
            ) : (
              <p className="mt-1 text-[13px] font-semibold text-[#061b31]">{tenant.nationality || '—'}</p>
            )}
          </div>
          {tenant.tenant_type !== 'individual' && (
            <>
              <div>
                <Label className="text-xs">جهة العمل</Label>
                {editing ? (
                  <Input value={form.employer || ''} onChange={(e) => setForm({ ...form, employer: e.target.value })} className="mt-1 h-10 text-[13px]" />
                ) : (
                  <p className="mt-1 text-[13px] font-semibold text-[#061b31]">{tenant.employer || '—'}</p>
                )}
              </div>
              <div>
                <Label className="text-xs">المخول بالتوقيع</Label>
                {editing ? (
                  <Input value={form.authorized_person || ''} onChange={(e) => setForm({ ...form, authorized_person: e.target.value })} className="mt-1 h-10 text-[13px]" />
                ) : (
                  <p className="mt-1 text-[13px] font-semibold text-[#061b31]">{tenant.authorized_person || '—'}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
            <Phone className="h-4 w-4 text-emerald-600" />
            معلومات التواصل
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">{tt('hr.phone', 'رقم الجوال')}</Label>
            {editing ? (
              <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-10 text-[13px]" dir="ltr" />
            ) : (
              <p className="mt-1 text-[13px] font-semibold text-[#061b31]" dir="ltr">{tenant.phone || '—'}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">{tt('hr.email', 'البريد الإلكتروني')}</Label>
            {editing ? (
              <Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-10 text-[13px]" dir="ltr" />
            ) : (
              <p className="mt-1 text-[13px] font-semibold text-[#061b31]" dir="ltr">{tenant.email || '—'}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">{tt('properties.address', 'العنوان')}</Label>
            {editing ? (
              <Textarea value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 text-[13px]" />
            ) : (
              <p className="mt-1 text-[13px] font-semibold text-[#061b31]">{tenant.address || '—'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#ea2261]" />
            جهة اتصال للطوارئ
          </CardTitle>
          <CardDescription className="text-xs">سيتم الاتصال بهم في حالة الطوارئ</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">{tt('tenants.name', 'الاسم')}</Label>
            {editing ? (
              <Input value={form.emergency_contact_name || ''} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} className="mt-1 h-10 text-[13px]" />
            ) : (
              <p className="mt-1 text-[13px] font-semibold text-[#061b31]">{tenant.emergency_contact_name || '—'}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">{tt('hr.phone', 'رقم الجوال')}</Label>
            {editing ? (
              <Input value={form.emergency_contact_phone || ''} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} className="mt-1 h-10 text-[13px]" dir="ltr" />
            ) : (
              <p className="mt-1 text-[13px] font-semibold text-[#061b31]" dir="ltr">{tenant.emergency_contact_phone || '—'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <Shield className="h-4 w-4 text-[#9b6829] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#9b6829]">
          لتغيير البريد الإلكتروني أو رقم الجوال، يرجى التواصل مع إدارة العقار لتأكيد التغيير.
        </p>
      </div>
    </div>
  );
}
