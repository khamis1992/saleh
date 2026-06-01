import { formatQARInt } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { propertyStore, leaseStore, invoiceStore } from '@/services/stores';
import { exportToCSV } from '@/utils/exportUtils';
import {
  Calculator, TrendingUp, Building2, Download, DollarSign, Percent,
  BarChart3, Landmark, Calendar, HardHat,
} from 'lucide-react';

export default function PropertyValuationPage() {
  const { t } = useLocale();
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [marketValueInput, setMarketValueInput] = useState('');
  const [refresh] = useState(0);

  const properties = useMemo(() => propertyStore.getAll(), [refresh]);
  const leases = useMemo(() => leaseStore.getAll(), [refresh]);
  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);

  const selected = useMemo(() => {
    if (!selectedPropertyId) return null;
    return properties.find(p => p.id === selectedPropertyId) || null;
  }, [selectedPropertyId, properties]);

  // Annual rent income from active leases on this property
  const annualRentIncome = useMemo(() => {
    if (!selected) return 0;
    const propLeases = leases.filter(l =>
      l.property_id === selected.id && l.status === 'active'
    );
    return propLeases.reduce((sum, l) => {
      switch (l.payment_frequency) {
        case 'monthly': return sum + l.rent_amount * 12;
        case 'quarterly': return sum + l.rent_amount * 4;
        case 'semi_annual': return sum + l.rent_amount * 2;
        default: return sum + l.rent_amount; // annual
      }
    }, 0);
  }, [selected, leases]);

  // Annual operating expenses estimate (~30% of rental income for maintenance, admin, etc.)
  const annualExpenses = useMemo(() => {
    return Math.round(annualRentIncome * 0.30);
  }, [annualRentIncome]);

  const netOperatingIncome = useMemo(() => annualRentIncome - annualExpenses, [annualRentIncome, annualExpenses]);

  // ROI = Annual Rent / Total Asset Value
  const roi = useMemo(() => {
    if (!selected || selected.total_asset_value === 0) return 0;
    return ((annualRentIncome / selected.total_asset_value) * 100);
  }, [selected, annualRentIncome]);

  // Cap Rate = NOI / Property Value
  const capRate = useMemo(() => {
    const value = marketValueInput ? parseFloat(marketValueInput) : (selected?.total_asset_value || 1);
    if (value === 0) return 0;
    return ((netOperatingIncome / value) * 100);
  }, [netOperatingIncome, marketValueInput, selected]);

  // Gross Rent Multiplier = Property Value / Annual Rent
  const grm = useMemo(() => {
    const value = marketValueInput ? parseFloat(marketValueInput) : (selected?.total_asset_value || 1);
    if (annualRentIncome === 0) return 0;
    return value / annualRentIncome;
  }, [annualRentIncome, marketValueInput, selected]);

  // Depreciation schedule
  const depreciationSchedule = useMemo(() => {
    if (!selected || selected.useful_life_years === 0) return [];
    const annualDep = selected.total_asset_value / selected.useful_life_years;
    const schedule = [];
    const startYear = new Date().getFullYear();
    for (let year = 0; year < selected.useful_life_years; year++) {
      const accumulated = annualDep * (year + 1);
      const bookValue = selected.total_asset_value - accumulated;
      schedule.push({
        year: startYear + year,
        yearNum: year + 1,
        annualDepreciation: Math.round(annualDep),
        accumulatedDepreciation: Math.round(accumulated),
        bookValueEnd: Math.round(Math.max(0, bookValue)),
      });
    }
    return schedule;
  }, [selected]);

  // Market value comparison
  const marketComparison = useMemo(() => {
    if (!selected) return null;
    const marketVal = marketValueInput ? parseFloat(marketValueInput) : 0;
    const bookVal = selected.total_asset_value;
    if (marketVal <= 0) return null;
    const diff = marketVal - bookVal;
    const diffPct = ((diff / bookVal) * 100);
    return { marketVal, bookVal, diff, diffPct };
  }, [selected, marketValueInput]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const pctFmt = (v: number) => `${v.toFixed(2)}%`;

  const handleExportROI = () => {
    if (!selected) return;
    const data = [{
      propertyName: selected.property_name,
      assetValue: selected.total_asset_value,
      landCost: selected.land_cost,
      constructionCost: selected.construction_cost,
      annualRentIncome,
      annualExpenses,
      netOperatingIncome,
      roiPct: roi.toFixed(2),
      capRatePct: capRate.toFixed(2),
      grm: grm.toFixed(2),
      marketValue: marketValueInput || selected.total_asset_value,
    }];
    exportToCSV(data, [
      { key: 'propertyName', label: 'العقار' },
      { key: 'assetValue', label: 'القيمة الدفترية' },
      { key: 'landCost', label: 'تكلفة الأرض' },
      { key: 'constructionCost', label: 'تكلفة الإنشاء' },
      { key: 'annualRentIncome', label: 'الدخل السنوي' },
      { key: 'annualExpenses', label: 'المصروفات السنوية' },
      { key: 'netOperatingIncome', label: 'صافي الدخل التشغيلي' },
      { key: 'roiPct', label: 'العائد على الاستثمار %' },
      { key: 'capRatePct', label: 'معدل الرسملة %' },
      { key: 'grm', label: 'مضاعف الإيجار الإجمالي' },
      { key: 'marketValue', label: 'القيمة السوقية' },
    ], 'تقييم_العقار.csv');
  };

  const handleExportDepreciation = () => {
    if (!selected || depreciationSchedule.length === 0) return;
    const data = depreciationSchedule.map(d => ({
      year: d.year,
      annualDepreciation: d.annualDepreciation,
      accumulatedDepreciation: d.accumulatedDepreciation,
      bookValueEnd: d.bookValueEnd,
    }));
    exportToCSV(data, [
      { key: 'year', label: 'السنة' },
      { key: 'annualDepreciation', label: 'الإهلاك السنوي' },
      { key: 'accumulatedDepreciation', label: 'الإهلاك المتراكم' },
      { key: 'bookValueEnd', label: 'القيمة الدفترية' },
    ], 'جدول_الإهلاك.csv');
  };

  return (
    <div dir="rtl" className="space-y-6">
      <PageHeader
        title="تقييم العقارات والعائد على الاستثمار"
        description="حساب العائد على الاستثمار، معدل الرسملة، وجدول الإهلاك للعقارات"
      />

      {/* Property Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-md">
              <Label className="mb-2 block text-sm font-medium">اختر العقار</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر عقاراً لعرض التقييم..." />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.property_name} ({p.property_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selected && (
              <Button variant="outline" onClick={handleExportROI}>
                <Download className="h-4 w-4 ml-2" />
                تصدير التقييم
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <>
          {/* Asset Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">القيمة الدفترية</span>
                </div>
                <p className="text-xl font-bold">{fmt(selected.total_asset_value)}</p>
                <p className="text-xs text-muted-foreground mt-1">{selected.property_name}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">تكلفة الأرض</span>
                </div>
                <p className="text-xl font-bold">{fmt(selected.land_cost)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <HardHat className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">تكلفة الإنشاء</span>
                </div>
                <p className="text-xl font-bold">{fmt(selected.construction_cost)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">الإهلاك السنوي</span>
                </div>
                <p className="text-xl font-bold">{fmt(selected.annual_depreciation || (selected.total_asset_value / selected.useful_life_years))}</p>
                <p className="text-xs text-muted-foreground mt-1">{selected.depreciation_method === 'straight_line' ? 'القسط الثابت' : selected.depreciation_method} | {selected.useful_life_years} سنة</p>
              </CardContent>
            </Card>
          </div>

          {/* ROI & Cap Rate Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">العائد على الاستثمار (ROI)</span>
                </div>
                <p className="text-3xl font-bold text-blue-700">{pctFmt(roi)}</p>
                <p className="text-xs text-blue-600 mt-2">
                  الدخل السنوي ({fmt(annualRentIncome)}) ÷ القيمة الدفترية ({fmt(selected.total_asset_value)})
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">معدل الرسملة (Cap Rate)</span>
                </div>
                <p className="text-3xl font-bold text-green-700">{pctFmt(capRate)}</p>
                <p className="text-xs text-green-600 mt-2">
                  صافي الدخل التشغيلي ({fmt(netOperatingIncome)}) ÷ قيمة العقار ({fmt(marketValueInput ? parseFloat(marketValueInput) : selected.total_asset_value)})
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">مضاعف الإيجار (GRM)</span>
                </div>
                <p className="text-3xl font-bold text-purple-700">{grm.toFixed(2)}x</p>
                <p className="text-xs text-purple-600 mt-2">
                  قيمة العقار ÷ الدخل السنوي — الأقل أفضل
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Income & Expense Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  تحليل الدخل
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الدخل السنوي من الإيجارات</span>
                    <span className="font-bold text-green-600">{fmt(annualRentIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المصروفات التشغيلية (تقديري ~30%)</span>
                    <span className="font-bold text-red-600">- {fmt(annualExpenses)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg">
                    <span>صافي الدخل التشغيلي (NOI)</span>
                    <span className="font-bold text-green-700">{fmt(netOperatingIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الإهلاك السنوي</span>
                    <span className="font-bold text-amber-600">- {fmt(selected.annual_depreciation || Math.round(selected.total_asset_value / selected.useful_life_years))}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span>صافي الربح بعد الإهلاك</span>
                    <span className={`font-bold ${netOperatingIncome - (selected.annual_depreciation || Math.round(selected.total_asset_value / selected.useful_life_years)) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {fmt(netOperatingIncome - (selected.annual_depreciation || Math.round(selected.total_asset_value / selected.useful_life_years)))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  مقارنة القيمة السوقية
                </h3>
                <div className="mb-4">
                  <Label className="mb-1 block text-sm">القيمة السوقية المقدرة</Label>
                  <Input
                    type="number"
                    placeholder="أدخل القيمة السوقية المقدرة..."
                    value={marketValueInput}
                    onChange={e => setMarketValueInput(e.target.value)}
                    className="text-left"
                  />
                </div>
                {marketComparison ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">القيمة الدفترية</span>
                      <span className="font-bold">{fmt(marketComparison.bookVal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">القيمة السوقية</span>
                      <span className="font-bold">{fmt(marketComparison.marketVal)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span>الفرق</span>
                      <span className={`font-bold text-lg ${marketComparison.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {marketComparison.diff >= 0 ? '+' : ''}{fmt(marketComparison.diff)}
                        {' '}({marketComparison.diffPct >= 0 ? '+' : ''}{pctFmt(marketComparison.diffPct)})
                      </span>
                    </div>
                    <div className={`p-3 rounded-lg text-sm ${marketComparison.diff >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {marketComparison.diff >= 0
                        ? 'القيمة السوقية أعلى من القيمة الدفترية — ربح رأسمالي محتمل'
                        : 'القيمة السوقية أقل من القيمة الدفترية — خسارة رأسمالية محتملة'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    أدخل القيمة السوقية لمقارنتها بالقيمة الدفترية
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics Summary */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-indigo-500" />
                ملخص المؤشرات المالية
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'العائد على الاستثمار', value: pctFmt(roi), color: 'text-blue-600' },
                  { label: 'معدل الرسملة', value: pctFmt(capRate), color: 'text-green-600' },
                  { label: 'مضاعف الإيجار (GRM)', value: `${grm.toFixed(2)}x`, color: 'text-purple-600' },
                  { label: 'نسبة الإشغال', value: pctFmt(annualRentIncome > 0 ? 100 : 0), color: 'text-amber-600' },
                  { label: 'هامش صافي الدخل', value: pctFmt(annualRentIncome > 0 ? (netOperatingIncome / annualRentIncome) * 100 : 0), color: 'text-teal-600' },
                  { label: 'العمر المتبقي', value: `${selected.useful_life_years} سنة`, color: 'text-gray-600' },
                ].map((m, i) => (
                  <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                    <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Depreciation Schedule */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  جدول الإهلاك — القسط الثابت على {selected.useful_life_years} سنة
                </h3>
                <Button variant="outline" size="sm" onClick={handleExportDepreciation}>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">السنة</TableHead>
                      <TableHead className="text-right">رقم السنة</TableHead>
                      <TableHead className="text-right">الإهلاك السنوي</TableHead>
                      <TableHead className="text-right">الإهلاك المتراكم</TableHead>
                      <TableHead className="text-right">القيمة الدفترية آخر السنة</TableHead>
                      <TableHead className="text-right">نسبة الإهلاك</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depreciationSchedule.slice(0, 15).map(d => (
                      <TableRow key={d.year} className={d.bookValueEnd <= 0 ? 'bg-gray-50' : ''}>
                        <TableCell className="font-medium">{d.year}</TableCell>
                        <TableCell>{d.yearNum}</TableCell>
                        <TableCell className="text-amber-600">{fmt(d.annualDepreciation)}</TableCell>
                        <TableCell className="text-red-600">{fmt(d.accumulatedDepreciation)}</TableCell>
                        <TableCell className={d.bookValueEnd <= 0 ? 'text-gray-400' : 'font-bold'}>{fmt(d.bookValueEnd)}</TableCell>
                        <TableCell>{pctFmt((d.accumulatedDepreciation / selected.total_asset_value) * 100)}</TableCell>
                      </TableRow>
                    ))}
                    {depreciationSchedule.length > 15 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                          ... {depreciationSchedule.length - 15} سنة إضافية (التصدير يشمل الجدول الكامل)
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Active Leases Summary */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                العقود النشطة على هذا العقار
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم العقد</TableHead>
                      <TableHead className="text-right">الإيجار السنوي</TableHead>
                      <TableHead className="text-right">تاريخ البداية</TableHead>
                      <TableHead className="text-right">تاريخ النهاية</TableHead>
                      <TableHead className="text-right">طريقة الدفع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leases.filter(l => l.property_id === selected.id && l.status === 'active').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                          لا توجد عقود نشطة على هذا العقار
                        </TableCell>
                      </TableRow>
                    ) : (
                      leases.filter(l => l.property_id === selected.id && l.status === 'active').map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.contract_number}</TableCell>
                          <TableCell className="text-green-600 font-bold">{fmt(l.rent_amount)}</TableCell>
                          <TableCell>{l.start_date}</TableCell>
                          <TableCell>{l.end_date}</TableCell>
                          <TableCell>
                            {l.payment_frequency === 'annual' ? 'سنوي' :
                             l.payment_frequency === 'monthly' ? 'شهري' :
                             l.payment_frequency === 'quarterly' ? 'ربع سنوي' :
                             l.payment_frequency === 'semi_annual' ? 'نصف سنوي' : l.payment_frequency}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              نشط
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selected && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calculator className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg text-muted-foreground">اختر عقاراً من القائمة أعلاه لعرض تحليل التقييم والعائد على الاستثمار</p>
            <p className="text-sm text-muted-foreground mt-1">يشمل: حساب ROI، معدل الرسملة، جدول الإهلاك، ومقارنة القيمة السوقية</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}