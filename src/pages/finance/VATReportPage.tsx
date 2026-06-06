import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calculator, Download, FileText, TrendingUp } from 'lucide-react';
import { invoiceStore, receiptStore, propertyStore } from '@/services/stores';
import { computeVATBreakdown, VAT_CONFIGS, formatVATRate, getVATCountries, type Country, type TransactionType } from '@/utils/vat';
import { toast } from 'sonner';

const today = () => new Date().toISOString().split('T')[0];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default function VATReportPage() {
  const { dir } = useLocale();
  const [country, setCountry] = useState<Country>('AE');
  const [from, setFrom] = useState(daysAgo(90));
  const [to, setTo] = useState(today());
  const config = VAT_CONFIGS[country];

  const breakdown = useMemo(() => {
    const receipts = receiptStore.getAll();
    const inRange = receipts.filter(r => r.payment_date >= from && r.payment_date <= to);
    const items = inRange.map(r => ({
      amount: r.amount,
      type: 'rent' as TransactionType,
      description: r.receipt_number,
    }));
    return computeVATBreakdown(items, country, false);
  }, [country, from, to]);

  const propertyCount = propertyStore.getAll().length;
  const invoiceCount = invoiceStore.getAll().filter(i => i.invoice_date >= from && i.invoice_date <= to).length;

  const handleExport = () => {
    toast.success('تم تصدير تقرير الضريبة (PDF)');
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="تقرير ضريبة القيمة المضافة"
        description={`حساب وتتبع ضريبة القيمة المضافة لـ ${config.label} بمعدل ${formatVATRate(country)}`}
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>الدولة</Label>
              <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(VAT_CONFIGS) as Country[]).map(c => (
                    <SelectItem key={c} value={c}>
                      {VAT_CONFIGS[c].label} ({formatVATRate(c)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>من تاريخ</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>إلى تاريخ</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1.5" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleExport} className="w-full gap-2 bg-[#533afd] hover:bg-[#533afd]">
                <Download className="h-4 w-4" />
                تصدير PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VAT Status Banner */}
      <Card className={`mb-6 ${config.rate === 0 ? 'bg-[#f6f9fc]' : 'bg-[rgba(83,58,253,0.06)] border-blue-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Calculator className={`h-8 w-8 ${config.rate === 0 ? 'text-[#64748d]' : 'text-[#533afd]'}`} />
              <div>
                <h3 className="font-bold text-lg">{config.label}</h3>
                <p className="text-sm text-[#64748d]">
                  {config.rate === 0
                    ? 'لا توجد ضريبة قيمة مضافة مطبقة في هذه الدولة'
                    : `معدل الضريبة: ${formatVATRate(country)} • ${config.appliesToRent ? 'تشمل الإيجار' : 'معفى من الإيجار'}`}
                </p>
              </div>
            </div>
            <Badge className={config.rate === 0 ? 'bg-gray-200 text-gray-700' : 'bg-[#533afd] text-white text-base px-3 py-1'}>
              {formatVATRate(country)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#64748d]">إجمالي المبيعات (قبل الضريبة)</p>
            <p className="text-2xl font-bold text-[#061b31] mt-1">{formatQARInt(breakdown.totalBase)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#64748d]">ضريبة القيمة المضافة</p>
            <p className="text-2xl font-bold text-[#533afd] mt-1">{formatQARInt(breakdown.totalVAT)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#64748d]">إجمالي شامل الضريبة</p>
            <p className="text-2xl font-bold text-[#061b31] mt-1">{formatQARInt(breakdown.totalGross)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#64748d]">معدل فعلي</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {(breakdown.effectiveRate * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="breakdown">التفصيل حسب النوع</TabsTrigger>
          <TabsTrigger value="summary">ملخص الفواتير</TabsTrigger>
          <TabsTrigger value="rates">معدلات الدول</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                تفصيل الضريبة حسب نوع المعاملة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3">نوع المعاملة</th>
                    <th className="text-right p-3">العدد</th>
                    <th className="text-right p-3">المبلغ الأساسي</th>
                    <th className="text-right p-3">الضريبة</th>
                    <th className="text-right p-3">{tt('common.total', 'الإجمالي')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(breakdown.byType) as TransactionType[]).map(type => {
                    const row = breakdown.byType[type];
                    const typeLabels: Record<TransactionType, string> = {
                      rent: 'إيجار',
                      sale: 'بيع',
                      service: 'خدمات',
                      other: 'أخرى',
                    };
                    if (row.count === 0) return null;
                    return (
                      <tr key={type} className="border-b hover:bg-[#f6f9fc]">
                        <td className="p-3 font-medium">{typeLabels[type]}</td>
                        <td className="p-3">{row.count}</td>
                        <td className="p-3">{formatQAR(row.base)}</td>
                        <td className="p-3 text-[#533afd] font-semibold">{formatQAR(row.vat)}</td>
                        <td className="p-3 font-bold">{formatQAR(row.base + row.vat)}</td>
                      </tr>
                    );
                  })}
                  {breakdown.totalBase === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#64748d]">
                        لا توجد معاملات في هذه الفترة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                ملخص الفترة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[rgba(83,58,253,0.06)] rounded-lg">
                  <p className="text-sm text-[#64748d]">عدد العقارات</p>
                  <p className="text-2xl font-bold">{propertyCount}</p>
                </div>
                <div className="p-4 bg-[rgba(83,58,253,0.06)] rounded-lg">
                  <p className="text-sm text-[#64748d]">عدد الفواتير</p>
                  <p className="text-2xl font-bold">{invoiceCount}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-[#64748d]">متوسط قيمة الفاتورة</p>
                  <p className="text-2xl font-bold">
                    {invoiceCount > 0 ? formatQARInt(breakdown.totalBase / invoiceCount) : formatQARInt(0)}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <strong>ملاحظة:</strong> هذا تقرير محاسبي. للإيداع الرسمي لدى الهيئة الضريبية في {config.label}، يلزم تكامل مع نظام الفاتورة الإلكترونية (مثل ZATCA للسعودية).
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle>معدلات ضريبة القيمة المضافة في دول الخليج</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3">الدولة</th>
                    <th className="text-right p-3">المعدل</th>
                    <th className="text-right p-3">تشمل الإيجار؟</th>
                    <th className="text-right p-3">تشمل البيع؟</th>
                  </tr>
                </thead>
                <tbody>
                  {getVATCountries().length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-[#64748d]">لا توجد دول مفعلة</td></tr>
                  )}
                  {(Object.keys(VAT_CONFIGS) as Country[]).map(c => (
                    <tr key={c} className="border-b hover:bg-[#f6f9fc]">
                      <td className="p-3 font-medium">{VAT_CONFIGS[c].label}</td>
                      <td className="p-3">
                        <Badge variant={c === country ? 'default' : 'outline'}>
                          {formatVATRate(c)}
                        </Badge>
                      </td>
                      <td className="p-3">{VAT_CONFIGS[c].appliesToRent ? 'نعم' : 'لا'}</td>
                      <td className="p-3">{VAT_CONFIGS[c].appliesToSale ? 'نعم' : 'لا'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
