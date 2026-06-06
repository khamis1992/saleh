import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Save, Map, Landmark, MapPin } from 'lucide-react';
import { landStore, getAllowedStatusTransitions } from '@/services/stores';
import LocationPicker from '@/components/maps/LocationPicker';
import type { Land, LandStatus } from '@/types';

export default function LandCreatePage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState<Partial<Land>>({
    land_code: '', land_name: '', plot_number: '', zone: '', municipality: '',
    area_sqm: 0, gps_lat: 0, gps_lng: 0, acquisition_date: '', acquisition_price: 0,
    broker_commission: 0, registration_fees: 0, legal_fees: 0, other_costs: 0,
    title_deed_number: '', seller_name: '', status: 'available', notes: '',
  });

  useEffect(() => {
    if (id && isEdit) {
      const existing = landStore.getById(id);
      if (existing) {
        const { id: _, company_id: __, total_acquisition_cost: ___, current_estimated_value: ____, created_at: _____, updated_at: ______, ...rest } = existing;
        setForm(rest as any);
      }
    }
  }, [id, isEdit]);

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    const total = (form.acquisition_price || 0) + (form.broker_commission || 0) +
      (form.registration_fees || 0) + (form.legal_fees || 0) + (form.other_costs || 0);

    if (isEdit && id) {
      landStore.update(id, { ...form, total_acquisition_cost: total, updated_at: new Date().toISOString() } as any);
      toast.success(`تم تحديث ${form.land_name || 'الأرض'} بنجاح`);
    } else {
      landStore.create({
        ...form,
        company_id: '', total_acquisition_cost: total, current_estimated_value: form.acquisition_price || 0,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      } as any);
      toast.success(`تم إضافة ${form.land_name || 'الأرض'} بنجاح`);
    }
    navigate('/lands');
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/lands')} className="text-xs text-gray-500">
            <ArrowRight className="h-4 w-4 ml-1" />{t.common.back}
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isEdit ? t.lands.edit : t.lands.create}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{isEdit ? 'تعديل بيانات الأرض' : 'إضافة أرض جديدة إلى السجل'}</p>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4">
          <Save className="h-4 w-4" />{t.common.save}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Map className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">معلومات الأرض الأساسية</h2>
              <p className="text-xs text-gray-400 mt-0.5">البيانات الأساسية لقطعة الأرض</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.lands.code}</Label><Input value={form.land_code || ''} onChange={e => update('land_code', e.target.value)} placeholder="LAND-2026-001" className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.lands.name}</Label><Input value={form.land_name || ''} onChange={e => update('land_name', e.target.value)} placeholder="اسم الأرض" className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.lands.plotNumber}</Label><Input value={form.plot_number || ''} onChange={e => update('plot_number', e.target.value)} placeholder="P-0000" className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">المنطقة</Label>
              <Select value={form.zone || ''} onValueChange={v => update('zone', v)}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue placeholder="اختر المنطقة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="سكني">سكني</SelectItem><SelectItem value="تجاري">تجاري</SelectItem>
                  <SelectItem value="صناعي">صناعي</SelectItem><SelectItem value="زراعي">زراعي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.lands.municipality}</Label><Input value={form.municipality || ''} onChange={e => update('municipality', e.target.value)} placeholder="البلدية" className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.lands.area} (م²)</Label><Input type="number" value={form.area_sqm || ''} onChange={e => update('area_sqm', Number(e.target.value))} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.lands.status}</Label>
              <Select value={form.status || 'available'} onValueChange={v => update('status', v)}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(getAllowedStatusTransitions('land', form.status || 'available').length > 0
                    ? getAllowedStatusTransitions('land', form.status || 'available')
                    : ['available', 'under_study', 'under_design', 'under_approvals', 'under_construction', 'developed', 'sold']
                  ).map(s => (
                    <SelectItem key={s} value={s}>
                      {{ available: 'متاحة', under_study: 'تحت الدراسة', under_design: 'تحت التصميم',
                         under_approvals: 'تحت الاعتمادات', under_construction: 'تحت الإنشاء',
                         developed: 'مطورة', sold: 'مباعة' }[s] || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── LOCATION MAP PICKER ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">الموقع الجغرافي</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                انقر على الخريطة لتحديد موقع الأرض — يمكنك سحب العلامة لتعديلها لاحقاً
              </p>
            </div>
          </div>

          {/* Interactive Map */}
          <LocationPicker
            lat={form.gps_lat || 0}
            lng={form.gps_lng || 0}
            onLocationChange={(lat, lng) => {
              update('gps_lat', lat);
              update('gps_lng', lng);
            }}
            height="320px"
          />

          {/* Manual coordinate entry (compact, below map) */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-gray-400">خط العرض (Latitude)</Label>
              <Input
                type="number"
                step="any"
                value={form.gps_lat || ''}
                onChange={e => update('gps_lat', Number(e.target.value))}
                placeholder="25.2854"
                className="h-8 text-xs rounded-lg border-gray-200 font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-gray-400">خط الطول (Longitude)</Label>
              <Input
                type="number"
                step="any"
                value={form.gps_lng || ''}
                onChange={e => update('gps_lng', Number(e.target.value))}
                placeholder="51.5310"
                className="h-8 text-xs rounded-lg border-gray-200 font-mono"
              />
            </div>
          </div>

          {(form.gps_lat && form.gps_lat !== 0) && (
            <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              تم تحديد الموقع — سيظهر على خريطة الأراضي الرئيسية
            </p>
          )}
        </div>

        {/* Financial Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">المعلومات المالية</h2>
              <p className="text-xs text-gray-400 mt-0.5">تكاليف الشراء والرسوم المرتبطة</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">تاريخ الشراء</Label><Input type="date" value={form.acquisition_date || ''} onChange={e => update('acquisition_date', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">سعر الشراء</Label><Input type="number" value={form.acquisition_price || ''} onChange={e => update('acquisition_price', Number(e.target.value))} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">عمولة الوسيط</Label><Input type="number" value={form.broker_commission || ''} onChange={e => update('broker_commission', Number(e.target.value))} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">رسوم التسجيل</Label><Input type="number" value={form.registration_fees || ''} onChange={e => update('registration_fees', Number(e.target.value))} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">رسوم قانونية</Label><Input type="number" value={form.legal_fees || ''} onChange={e => update('legal_fees', Number(e.target.value))} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">تكاليف أخرى</Label><Input type="number" value={form.other_costs || ''} onChange={e => update('other_costs', Number(e.target.value))} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          </div>
        </div>

        {/* Ownership Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">معلومات الملكية</h2>
              <p className="text-xs text-gray-400 mt-0.5">بيانات الصك والبائع</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">رقم صك الملكية</Label><Input value={form.title_deed_number || ''} onChange={e => update('title_deed_number', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">اسم البائع</Label><Input value={form.seller_name || ''} onChange={e => update('seller_name', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5 md:col-span-2"><Label className="text-xs font-medium text-gray-500">{t.common.notes}</Label><Textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} rows={3} className="text-sm rounded-lg border-gray-200" /></div>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/lands')} className="h-9 text-sm rounded-lg">{t.common.cancel}</Button>
          <Button onClick={handleSave} className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4"><Save className="h-4 w-4" />{t.common.save}</Button>
        </div>
      </div>
    </div>
  );
}
