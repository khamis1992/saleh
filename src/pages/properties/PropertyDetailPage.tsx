import { useMemo } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WorkflowTimeline } from '@/components/shared/WorkflowTimeline';
import { NextBestAction } from '@/components/shared/NextBestAction';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Pencil, Building2, Home, FileText, Wrench, DollarSign, Calendar, Plus } from 'lucide-react';
import {
  propertyStore, buildingStore, unitStore, leaseStore, maintenanceStore,
  invoiceStore, getUnitNumber, getTenantName, getProjectName,
} from '@/services/stores';

const fmt = (v: number) => formatQAR(v);

const contractStatusLabels: Record<string, string> = {
  draft: 'مسودة', pending_approval: 'بانتظار الموافقة', approved: 'معتمد', pending_signature: 'بانتظار التوقيع',
  active: 'نشط', expiring_soon: 'قارب الانتهاء', renewed: 'مجدد', terminated: 'منتهي', cancelled: 'ملغي', legal: 'قانوني',
};

const unitStatusLabels: Record<string, string> = {
  available: 'متاحة', reserved: 'محجوزة', leased: 'مؤجرة', under_maintenance: 'تحت الصيانة', blocked: 'محظورة', sold: 'مباعة',
};

const unitTypeLabels: Record<string, string> = {
  villa: 'فيلا', apartment: 'شقة', studio: 'استوديو', office: 'مكتب',
  shop: 'محل', warehouse: 'مستودع', room: 'غرفة',
};

const maintenanceStatusLabels: Record<string, string> = {
  submitted: 'مقدم', under_review: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض',
  assigned: 'معين', in_progress: 'قيد التنفيذ', waiting_parts: 'بانتظار القطع',
  completed: 'مكتمل', tenant_confirmed: 'مؤكد من المستأجر', closed: 'مغلق', cancelled: 'ملغي',
};

export default function PropertyDetailPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();

  const property = useMemo(() => propertyStore.getById(id || ''), [id]);

  const buildings = useMemo(() => {
    if (!id) return [];
    return buildingStore.getAll().filter(b => b.property_id === id);
  }, [id]);

  const units = useMemo(() => {
    if (!id) return [];
    return unitStore.getAll().filter(u => u.property_id === id);
  }, [id]);

  const propertyLeases = useMemo(() => {
    if (!id) return [];
    return leaseStore.getAll().filter(l => l.property_id === id);
  }, [id]);

  const propertyMaintenance = useMemo(() => {
    if (!id) return [];
    return maintenanceStore.getAll().filter(m => m.property_id === id);
  }, [id]);

  const financialSummary = useMemo(() => {
    if (!property) return { totalAssetValue: 0, depreciation: 0, monthlyRent: 0, annualRent: 0 };
    const totalAssetValue = property.land_cost + property.construction_cost + property.other_capitalized_cost;
    const depreciation = property.annual_depreciation;
    const monthlyRent = units.filter(u => u.status === 'leased').reduce((s, u) => s + (u.actual_rent || u.expected_monthly_rent), 0);
    const annualRent = monthlyRent * 12;
    return { totalAssetValue, depreciation, monthlyRent, annualRent };
  }, [property, units]);

  const unitStats = useMemo(() => {
    const total = units.length;
    const leased = units.filter(u => u.status === 'leased').length;
    const available = units.filter(u => u.status === 'available').length;
    const maintenance = units.filter(u => u.status === 'under_maintenance').length;
    const occupancyRate = total > 0 ? Math.round((leased / total) * 100) : 0;
    return { total, leased, available, maintenance, occupancyRate };
  }, [units]);

  if (!property) return <div className="text-center py-12">العقار غير موجود</div>;

  return (
    <div dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/properties')}><ArrowRight className="h-4 w-4 ml-2" />{t.common.back}</Button>
        <div className="flex-1"><h1 className="text-2xl font-bold">{property.property_code} - {property.property_name}</h1></div>
        <Button variant="outline"><Pencil className="h-4 w-4 ml-2" />{t.common.edit}</Button>
      </div>

      {/* Workflow timeline + Quick actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">دورة حياة العقار</p>
        <WorkflowTimeline
          steps={(() => {
            const propUnits = unitStore.getAll().filter((u: any) => u.property_id === property.id);
            const leased = propUnits.filter((u: any) => u.status === 'leased').length;
            const total = propUnits.length;
            const occupancy = total > 0 ? Math.round((leased / total) * 100) : 0;
            return [
              { key: 'ready', label: 'جاهز للتأجير', status: 'completed' as const },
              { key: 'leasing', label: `إشغال ${occupancy}%`, status: occupancy >= 80 ? 'completed' as const : occupancy >= 50 ? 'current' as const : 'pending' as const },
              { key: 'ops', label: 'تشغيل مستقر', status: occupancy === 100 ? 'completed' as const : 'current' as const },
            ];
          })()}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-2">إجراءات سريعة:</span>
        <Button variant="outline" size="sm" onClick={() => navigate('/units/create')} className="h-8 text-xs gap-1">
          <Plus className="h-3.5 w-3.5" /> إضافة وحدة
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/wizards/lease')} className="h-8 text-xs gap-1">
          <FileText className="h-3.5 w-3.5" /> عقد جديد
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/reports/occupancy')} className="h-8 text-xs gap-1">
          <Building2 className="h-3.5 w-3.5" /> تقرير الإشغال
        </Button>
      </div>

      <Tabs dir="rtl" defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="buildings">المباني</TabsTrigger>
          <TabsTrigger value="units">الوحدات</TabsTrigger>
          <TabsTrigger value="leases">عقود الإيجار</TabsTrigger>
          <TabsTrigger value="maintenance">الصيانة</TabsTrigger>
          <TabsTrigger value="financial">المالية</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">قيمة الأصل</div><div className="text-xl font-bold">{fmt(property.total_asset_value)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">عدد الوحدات</div><div className="text-xl font-bold">{unitStats.total}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">الوحدات المؤجرة</div><div className="text-xl font-bold">{unitStats.leased}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">نسبة الإشغال</div><div className="text-xl font-bold">{unitStats.occupancyRate}%</div></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">الإهلاك السنوي</div><div className="text-xl font-bold">{fmt(property.annual_depreciation)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">الإيجار الشهري</div><div className="text-xl font-bold text-green-600">{fmt(financialSummary.monthlyRent)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">الإيجار السنوي</div><div className="text-xl font-bold text-green-600">{fmt(financialSummary.annualRent)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">المباني</div><div className="text-xl font-bold">{buildings.length}</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>تفاصيل العقار</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">النوع: </span>{property.property_type === 'residential_building' ? 'عمارة سكنية' : property.property_type === 'commercial_building' ? 'مبنى تجاري' : property.property_type === 'villa_compound' ? 'مجمع فلل' : property.property_type === 'retail_complex' ? 'مجمع تجاري' : property.property_type}</div>
              <div><span className="text-muted-foreground">العنوان: </span>{property.address}</div>
              <div><span className="text-muted-foreground">المشروع: </span>{getProjectName(property.project_id)}</div>
              <div><span className="text-muted-foreground">تاريخ الإكمال: </span>{property.completion_date}</div>
              <div><span className="text-muted-foreground">تاريخ التسليم: </span>{property.handover_date || '-'}</div>
              <div><span className="text-muted-foreground">العمر الإنتاجي: </span>{property.useful_life_years} سنة</div>
              <div><span className="text-muted-foreground">طريقة الإهلاك: </span>{property.depreciation_method === 'straight_line' ? 'القسط الثابت' : property.depreciation_method}</div>
              <div><span className="text-muted-foreground">الحالة: </span><StatusBadge status={property.status} label={property.status === 'partially_leased' ? 'مؤجر جزئياً' : property.status === 'fully_leased' ? 'مؤجر بالكامل' : property.status === 'ready_for_leasing' ? 'جاهز للتأجير' : property.status === 'under_construction' ? 'تحت الإنشاء' : property.status} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buildings">
          {buildings.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">لا توجد مبانٍ لهذا العقار</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildings.map(b => {
                const buildingUnits = units.filter(u => u.building_id === b.id);
                return (
                  <Card key={b.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold">{b.building_name}</span>
                        <Badge variant="outline">{b.building_code}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>عدد الطوابق: {b.number_of_floors}</div>
                        <div>عدد الوحدات: {b.number_of_units}</div>
                        <div>مواقف السيارات: {b.parking_spaces}</div>
                        <div>المصاعد: {b.elevator_count}</div>
                        <div>تاريخ الإكمال: {b.completion_date}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="units">
          {units.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">لا توجد وحدات</p>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الوحدة</TableHead><TableHead>النوع</TableHead><TableHead>المساحة</TableHead>
                    <TableHead>غرف النوم</TableHead><TableHead>الإيجار الشهري</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map(u => (
                    <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/units/${u.id}`)}>
                      <TableCell className="font-medium">{u.unit_number}</TableCell>
                      <TableCell>{unitTypeLabels[u.unit_type] || u.unit_type}</TableCell>
                      <TableCell>{u.area_sqm} م²</TableCell>
                      <TableCell>{u.bedrooms}</TableCell>
                      <TableCell>{fmt(u.expected_monthly_rent)}</TableCell>
                      <TableCell><StatusBadge status={u.status} label={unitStatusLabels[u.status] || u.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="leases">
          {propertyLeases.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">لا توجد عقود إيجار</p>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم العقد</TableHead><TableHead>المستأجر</TableHead><TableHead>الوحدة</TableHead>
                    <TableHead>تاريخ البداية</TableHead><TableHead>تاريخ النهاية</TableHead>
                    <TableHead>قيمة الإيجار</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyLeases.map(l => (
                    <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/leases/${l.id}`)}>
                      <TableCell className="font-medium">{l.contract_number}</TableCell>
                      <TableCell>{getTenantName(l.tenant_id)}</TableCell>
                      <TableCell>{getUnitNumber(l.unit_id)}</TableCell>
                      <TableCell>{l.start_date}</TableCell>
                      <TableCell>{l.end_date}</TableCell>
                      <TableCell>{fmt(l.rent_amount)}</TableCell>
                      <TableCell><StatusBadge status={l.status} label={contractStatusLabels[l.status] || l.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance">
          {propertyMaintenance.length === 0 ? (
            <div className="text-center py-12"><Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">لا يوجد تاريخ صيانة</p></div>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead><TableHead>الوحدة</TableHead><TableHead>المستأجر</TableHead>
                    <TableHead>الفئة</TableHead><TableHead>الأولوية</TableHead><TableHead>الوصف</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyMaintenance.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.request_number}</TableCell>
                      <TableCell>{getUnitNumber(m.unit_id)}</TableCell>
                      <TableCell>{getTenantName(m.tenant_id)}</TableCell>
                      <TableCell>{m.category === 'plumbing' ? 'سباكة' : m.category === 'ac' ? 'تكييف' : m.category === 'electrical' ? 'كهرباء' : m.category}</TableCell>
                      <TableCell><Badge variant={m.priority === 'emergency' ? 'destructive' : 'outline'}>{m.priority === 'emergency' ? 'طارئ' : m.priority === 'high' ? 'عالي' : 'متوسط'}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate">{m.description}</TableCell>
                      <TableCell><StatusBadge status={m.status} label={maintenanceStatusLabels[m.status] || m.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="financial">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">تكلفة الأرض</div><div className="text-xl font-bold">{fmt(property.land_cost)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">تكلفة الإنشاء</div><div className="text-xl font-bold">{fmt(property.construction_cost)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">تكاليف أخرى</div><div className="text-xl font-bold">{fmt(property.other_capitalized_cost)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">إجمالي قيمة الأصل</div><div className="text-xl font-bold">{fmt(property.total_asset_value)}</div></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>تفاصيل الإهلاك</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">قيمة الأصل</span><span>{fmt(property.total_asset_value)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">العمر الإنتاجي</span><span>{property.useful_life_years} سنة</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">طريقة الإهلاك</span><span>{property.depreciation_method === 'straight_line' ? 'القسط الثابت' : property.depreciation_method}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">الإهلاك السنوي</span><span className="font-bold text-amber-600">{fmt(property.annual_depreciation)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">الإهلاك الشهري</span><span>{fmt(Math.round(property.annual_depreciation / 12))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">صافي القيمة الدفترية (بعد سنة أولى)</span><span>{fmt(property.total_asset_value - property.annual_depreciation)}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>الإيرادات</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">الإيجار الشهري الإجمالي</span><span className="font-bold text-green-600">{fmt(financialSummary.monthlyRent)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">الإيجار السنوي الإجمالي</span><span className="font-bold text-green-600">{fmt(financialSummary.annualRent)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">نسبة الإشغال</span><span>{unitStats.occupancyRate}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">الوحدات المؤجرة</span><span>{unitStats.leased} / {unitStats.total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">الوحدات المتاحة</span><span>{unitStats.available}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">الوحدات تحت الصيانة</span><span>{unitStats.maintenance}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">قسم المستندات قيد التطوير</p>
            <p className="text-sm text-muted-foreground mt-1">سيتم إضافة رفع وعرض المستندات قريباً</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
