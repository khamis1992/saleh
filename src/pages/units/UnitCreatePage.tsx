import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Save } from 'lucide-react';
import { unitStore, propertyStore, buildingStore, getPropertyName, getBuildingName } from '@/services/stores';
import type { Unit, UnitType, UnitStatus } from '@/types';

const unitTypeLabels: Record<UnitType, string> = {
  villa: 'فيلا', apartment: 'شقة', studio: 'استوديو', office: 'مكتب', shop: 'محل', warehouse: 'مستودع', room: 'غرفة',
};

const unitStatusLabels: Record<UnitStatus, string> = {
  available: 'متاحة', reserved: 'محجوزة', leased: 'مؤجرة', under_maintenance: 'تحت الصيانة', blocked: 'محظورة', sold: 'مباعة',
};

export default function UnitCreatePage() {
  const { t } = useLocale();
  const navigate = useNavigate();

  const properties = useMemo(() => propertyStore.getAll(), []);
  const buildings = useMemo(() => buildingStore.getAll(), []);

  const [form, setForm] = useState<Partial<Unit>>({
    company_id: '',
    property_id: '',
    building_id: '',
    floor_id: '',
    unit_code: '',
    unit_number: '',
    unit_type: 'apartment',
    area_sqm: 0,
    bedrooms: 0,
    bathrooms: 0,
    parking_number: '',
    electricity_meter: '',
    water_meter: '',
    furnished_status: 'غير مفروشة',
    expected_monthly_rent: 0,
    market_monthly_rent: 0,
    actual_rent: 0,
    security_deposit_required: 0,
    condition: 'جيدة',
    status: 'available' as UnitStatus,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!form.property_id || !form.unit_number) {
      toast.error('يرجى اختيار العقار وإدخال رقم الوحدة');
      return;
    }
    setSaving(true);
    try {
      const count = unitStore.getAll().length;
      const code = `UNIT-${String(count + 1).padStart(3, '0')}`;
      unitStore.create({
        ...form,
        unit_code: form.unit_code || code,
        company_id: '',
      } as Omit<Unit, 'id'>);
      toast.success('تم إنشاء الوحدة بنجاح');
      navigate('/units');
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // Filter buildings by selected property
  const filteredBuildings = useMemo(() => {
    if (!form.property_id) return buildings;
    return buildings.filter(b => b.property_id === form.property_id);
  }, [form.property_id, buildings]);

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <PageHeader
        title="إضافة وحدة جديدة"
        description="أدخل بيانات الوحدة السكنية أو التجارية الجديدة"
      />

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/units')} className="text-xs text-gray-500">
          <ArrowRight className="h-4 w-4 ml-1" />{t.common.back}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>معلومات الوحدة</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Property (Auto-filled from lease creation; dropdown otherwise) */}
          <div className="space-y-2">
            <Label>العقار *</Label>
            <Select value={form.property_id || ''} onValueChange={(v) => { setForm({ ...form, property_id: v, building_id: '' }); }}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue placeholder="اختر العقار" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Building */}
          <div className="space-y-2">
            <Label>المبنى</Label>
            <Select value={form.building_id || ''} onValueChange={(v) => setForm({ ...form, building_id: v })}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue placeholder="اختر المبنى" />
              </SelectTrigger>
              <SelectContent>
                {filteredBuildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.building_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.units.code}</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="تلقائي"
              value={form.unit_code || ''}
              onChange={(e) => setForm({ ...form, unit_code: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.units.number} *</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="A-101"
              value={form.unit_number || ''}
              onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.units.type}</Label>
            <Select value={form.unit_type || 'apartment'} onValueChange={(v) => setForm({ ...form, unit_type: v as UnitType })}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(unitTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.units.area} (م²)</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.area_sqm || ''}
              onChange={(e) => setForm({ ...form, area_sqm: Number(e.target.value) })}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.units.bedrooms}</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.bedrooms || ''}
              onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label>الحمامات</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.bathrooms || ''}
              onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label>رقم المواقف</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="P-001"
              value={form.parking_number || ''}
              onChange={(e) => setForm({ ...form, parking_number: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>عداد الكهرباء</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="رقم العداد"
              value={form.electricity_meter || ''}
              onChange={(e) => setForm({ ...form, electricity_meter: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>عداد المياه</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="رقم العداد"
              value={form.water_meter || ''}
              onChange={(e) => setForm({ ...form, water_meter: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>حالة التأثيث</Label>
            <Select value={form.furnished_status || 'غير مفروشة'} onValueChange={(v) => setForm({ ...form, furnished_status: v })}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="غير مفروشة">غير مفروشة</SelectItem>
                <SelectItem value="نصف مفروشة">نصف مفروشة</SelectItem>
                <SelectItem value="مفروشة بالكامل">مفروشة بالكامل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>الإيجار المتوقع</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.expected_monthly_rent || ''}
              onChange={(e) => setForm({ ...form, expected_monthly_rent: Number(e.target.value) })}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label>الإيجار السوقي</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.market_monthly_rent || ''}
              onChange={(e) => setForm({ ...form, market_monthly_rent: Number(e.target.value) })}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label>التأمين المطلوب</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.security_deposit_required || ''}
              onChange={(e) => setForm({ ...form, security_deposit_required: Number(e.target.value) })}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label>الحالة</Label>
            <Select value={form.status || 'available'} onValueChange={(v) => setForm({ ...form, status: v as UnitStatus })}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(unitStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label>حالة الوحدة</Label>
            <Select value={form.condition || 'جيدة'} onValueChange={(v) => setForm({ ...form, condition: v })}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ممتازة">ممتازة</SelectItem>
                <SelectItem value="جيدة">جيدة</SelectItem>
                <SelectItem value="تحتاج صيانة">تحتاج صيانة</SelectItem>
                <SelectItem value="سيئة">سيئة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end mt-6">
        <Button variant="outline" onClick={() => navigate('/units')} className="h-9 text-sm rounded-lg border-gray-200">
          {t.common.cancel}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4"
        >
          <Save className="h-4 w-4" />
          {saving ? 'جارٍ الحفظ...' : t.common.save}
        </Button>
      </div>
    </div>
  );
}
