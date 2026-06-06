import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Building2, Calculator, FileText, TrendingUp, TrendingDown, Send, Eye,
  CheckCircle2, Clock, AlertTriangle,
} from 'lucide-react';
import { uaeCtPeriodStore, companyStore } from '@/services/stores';
import {
  computeCorporateTax, computeFilingDeadline, checkFilingReadiness,
  nextPeriodLabel, computePeriodStart, computePeriodEnd,
} from '@/utils/uaeCorporateTax';
import { formatQAR } from '@/lib/format';

const STATUS_VARIANTS: Record<string, string> = {
  open: 'bg-gray-100 text-gray-700',
  calculating: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  ready: 'bg-amber-100 text-[#9b6829]',
  submitted: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  paid: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS_AR: Record<string, string> = {
  open: 'مفتوح', calculating: 'قيد الاحتساب', ready: 'جاهز للإيداع',
  submitted: 'مُقدم', paid: 'تم السداد',
};

const FTA_URL = 'https://eservices.tax.gov.ae';

export default function UaeCorporateTaxPage() {
  const { dir } = useLocale();
  const [periods, setPeriods] = useState(() => uaeCtPeriodStore.getAll());
  const [activePeriod, setActivePeriod] = useState<string>('all');
  const company = companyStore.getAll()[0];

  const refresh = () => setPeriods(uaeCtPeriodStore.getAll());
  const active = periods.find(p => p.id === activePeriod) || periods[0];

  const handleAddPeriod = () => {
    const last = periods.find(p => p.status === 'open');
    if (last) { toast.error('توجد فترة مفتوحة بالفعل — أغلقها أولاً'); return; }
    const label = nextPeriodLabel(periods[0]?.period_label || `FY ${new Date().getFullYear() - 1}`);
    uaeCtPeriodStore.create({
      company_id: 'comp-1', period_label: label,
      period_start: computePeriodStart(label), period_end: computePeriodEnd(label),
      entity_type: 'mainland', status: 'open',
      revenue: 0, qualifying_income: 0, exempt_income: 0, deductible_expenses: 0, non_deductible_expenses: 0,
      transfer_pricing_adjustment: 0, taxable_income: 0,
      small_business_relief: false, qualifying_free_zone_relief: false,
      applicable_rate: 0.09, tax_due: 0,
      filed_at: '', fta_reference: '', notes: '',
    });
    refresh();
    toast.success('تم إنشاء فترة مالية جديدة');
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="ضريبة الشركات — الإمارات (9%)"
        description="احتساب وتقديم إقرار ضريبة الشركات عبر FTA EmaraTax — حسب المرسوم بقانون اتحادي رقم 47 لسنة 2022"
      />

      <Card className="mb-6 bg-[rgba(83,58,253,0.06)] border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-[#533afd]" />
              <div>
                <h3 className="font-bold text-lg">{company.name_ar}</h3>
                <p className="text-sm text-[#64748d]">الرقم الضريبي: {company.tax_number}</p>
              </div>
            </div>
            <Badge className="bg-[#533afd] text-white text-base px-3 py-1">9٪</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Label>الفترة المالية:</Label>
          <Select value={activePeriod} onValueChange={setActivePeriod}>
            <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفترات</SelectItem>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.period_label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddPeriod} className="gap-2 bg-[#533afd] hover:bg-[#533afd]">
          + فترة مالية جديدة
        </Button>
      </div>

      {active && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={TrendingUp} label="الإيرادات" value={formatQAR(active.revenue)} color="emerald" />
            <StatCard icon={TrendingDown} label="المصروفات المقتطعة" value={formatQAR(active.deductible_expenses)} color="amber" />
            <StatCard icon={Calculator} label="الدخل الخاضع للضريبة" value={formatQAR(active.taxable_income)} color="blue" />
            <StatCard icon={FileText} label="الضريبة المستحقة" value={formatQAR(active.tax_due)} color={active.tax_due > 0 ? 'red' : 'gray'} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" /> تفاصيل {active.period_label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Field label="نوع الكيان" value={active.entity_type === 'mainland' ? 'بر رئيسي' : active.entity_type === 'free_zone_qualifying' ? 'منطقة حرة — مؤهل' : active.entity_type === 'free_zone_non_qualifying' ? 'منطقة حرة — غير مؤهل' : 'شخص طبيعي'} />
                <Field label="بداية الفترة" value={active.period_start} />
                <Field label="نهاية الفترة" value={active.period_end} />
                <Field label="آخر موعد للإيداع" value={active.status === 'paid' ? 'تم الإيداع' : computeFilingDeadline(active.period_end)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Field label="إعفاء المنشآت الصغيرة" value={active.small_business_relief ? 'نعم' : active.revenue > 3_000_000 ? 'غير مؤهل (الإيرادات > 3M)' : 'لا'} />
                <Field label="نسبة الضريبة" value={`${(active.applicable_rate * 100).toFixed(0)}%`} />
                <Field label="حالة الإقرار" value={STATUS_LABELS_AR[active.status]} />
                <Field label="مرجع FTA" value={active.fta_reference || '—'} />
              </div>
              {active.status !== 'paid' && (
                <div className="flex gap-2 pt-2">
                  {active.status === 'ready' && (
                    <Button onClick={() => { uaeCtPeriodStore.update(active.id, { status: 'submitted', filed_at: new Date().toISOString() }); refresh(); toast.success('تم تقديم الإقرار لـ FTA'); }}
                      className="gap-2 bg-[#533afd] hover:bg-[#533afd]">
                      <Send className="h-4 w-4" /> تقديم لـ EmaraTax
                    </Button>
                  )}
                  {active.status === 'submitted' && (
                    <Button onClick={() => { uaeCtPeriodStore.update(active.id, { status: 'paid' }); refresh(); toast.success('تم تحديث الحالة إلى مدفوع'); }}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> تأكيد السداد
                    </Button>
                  )}
                </div>
              )}
              {active.notes && (
                <div className="p-2 bg-[#f6f9fc] rounded text-sm text-[#64748d]">{active.notes}</div>
              )}
            </CardContent>
          </Card>

          {active.status === 'open' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> إدخال البيانات المالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  {(['revenue', 'qualifying_income', 'exempt_income', 'deductible_expenses', 'non_deductible_expenses', 'transfer_pricing_adjustment'] as const).map(field => {
                    const labels: Record<string, string> = {
                      revenue: 'الإيرادات', qualifying_income: 'الدخل المؤهل (QFZP)',
                      exempt_income: 'الدخل المعفى', deductible_expenses: 'المصروفات المقتطعة',
                      non_deductible_expenses: 'المصروفات غير المقتطعة', transfer_pricing_adjustment: 'تسوية التسعير التحويلي',
                    };
                    return (
                      <div key={field}>
                        <Label>{labels[field]}</Label>
                        <Input type="number" value={(active as any)[field] || '0'} onChange={e => {
                          uaeCtPeriodStore.update(active.id, { [field]: parseFloat(e.target.value) || 0 } as any);
                          setTimeout(() => { const p = uaeCtPeriodStore.getById(active.id); if (p) setActivePeriod(p.id); refresh(); }, 50);
                        }} className="mt-1.5 h-9" />
                      </div>
                    );
                  })}
                </div>
                <Button onClick={() => {
                  const p = uaeCtPeriodStore.getById(active.id);
                  if (!p) { toast.error('خطأ في تحميل الفترة'); return; }
                  const comp = computeCorporateTax({
                    entityType: p.entity_type, revenue: p.revenue, qualifyingIncome: p.qualifying_income,
                    nonQualifyingIncome: p.revenue - p.qualifying_income - p.exempt_income,
                    exemptIncome: p.exempt_income, deductibleExpenses: p.deductible_expenses,
                    nonDeductibleExpenses: p.non_deductible_expenses,
                    transferPricingAdjustment: p.transfer_pricing_adjustment,
                    claimSmallBusinessRelief: true,
                  });
                  uaeCtPeriodStore.update(active.id, {
                    taxable_income: comp.taxableIncome, tax_due: comp.baseTax, status: 'ready',
                  });
                  refresh();
                  toast.success(`تم احتساب الضريبة: ${formatQAR(comp.baseTax)}`);
                }} className="mt-4 bg-[#533afd] hover:bg-[#533afd] gap-2">
                  <Calculator className="h-4 w-4" /> احتساب الضريبة
                </Button>
              </CardContent>
            </Card>
          )}

          {active.status !== 'open' && active.status !== 'calculating' && (
            <Card>
              <CardHeader><CardTitle>حساب الضريبة التفصيلي</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {(() => {
                    const comp = computeCorporateTax({
                      entityType: active.entity_type, revenue: active.revenue,
                      qualifyingIncome: active.qualifying_income,
                      nonQualifyingIncome: active.revenue - active.qualifying_income - active.exempt_income,
                      exemptIncome: active.exempt_income, deductibleExpenses: active.deductible_expenses,
                      nonDeductibleExpenses: active.non_deductible_expenses,
                      transferPricingAdjustment: active.transfer_pricing_adjustment,
                      claimSmallBusinessRelief: true,
                    });
                    return (
                      <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <p className="font-semibold">الدخل الخاضع للضريبة</p>
                          <p className="text-2xl font-bold text-[#533afd]">{formatQAR(comp.taxableIncome)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold">الضريبة المستحقة</p>
                          <p className="text-2xl font-bold text-[#ea2261]">{formatQAR(comp.baseTax)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold">المعدل الفعلي</p>
                          <p className="text-2xl font-bold text-[#061b31]">{(comp.effectiveRate * 100).toFixed(2)}%</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {periods.length > 1 && (
        <Card className="mt-4">
          <CardHeader><CardTitle>جميع الفترات</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الفترة</TableHead><TableHead>الإيرادات</TableHead>
                  <TableHead>الضريبة</TableHead><TableHead>{tt('legal.status', 'الحالة')}</TableHead><TableHead>تاريخ الإيداع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold">{p.period_label}</TableCell>
                    <TableCell>{formatQAR(p.revenue)}</TableCell>
                    <TableCell className="text-[#ea2261] font-semibold">{formatQAR(p.tax_due)}</TableCell>
                    <TableCell><Badge className={STATUS_VARIANTS[p.status]}>{STATUS_LABELS_AR[p.status]}</Badge></TableCell>
                    <TableCell className="text-[12px]">{p.filed_at || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <AlertTriangle className="h-4 w-4 inline mr-1 text-[#9b6829]" />
        <strong>تنبيه:</strong> هذا نموذج محاكاة لاحتساب ضريبة الشركات. الإيداع الفعلي يتم عبر FTA EmaraTax
        (<a href={FTA_URL} className="text-[#533afd] underline" target="_blank" rel="noreferrer">eservices.tax.gov.ae</a>).
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-[rgba(83,58,253,0.06)] text-[#533afd]', amber: 'bg-amber-50 text-[#9b6829]',
    red: 'bg-red-50 text-[#ea2261]', gray: 'bg-[#f6f9fc] text-[#64748d]', violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${colors[color] || colors.blue} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748d]">{label}</p>
            <p className="text-2xl font-bold text-[#061b31]">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-[#64748d]">{label}</p>
      <p className="text-[13px] font-semibold">{value}</p>
    </div>
  );
}
