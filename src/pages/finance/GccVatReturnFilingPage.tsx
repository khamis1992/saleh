import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, FileText, TrendingUp, TrendingDown, Calculator, Globe, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { gccVatReturnStore, companyStore } from '@/services/stores';
import { formatQAR } from '@/lib/format';
import type { GccVatReturn, GccVatReturnStatus } from '@/types';

const STATUS_VARIANTS: Record<GccVatReturnStatus, string> = {
  draft: 'bg-gray-100 text-gray-700', ready: 'bg-amber-100 text-[#9b6829]',
  submitted: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]', accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-[#ea2261]',
};
const STATUS_LABELS: Record<GccVatReturnStatus, string> = {
  draft: t.hr.draft || tt('hr.draft','مسودة'), ready: 'جاهز', submitted: 'مُقدَّم', accepted: 'مقبول', rejected: t.hr.rejected || tt('hr.rejected','مرفوض'),
};

const COUNTRY_LABELS: Record<string, string> = { AE: 'الإمارات 5%', SA: 'السعودية 15%', BH: 'البحرين 10%', OM: 'عُمان 5%' };

export default function GccVatReturnFilingPage() {
  const { dir } = useLocale();
  const [returns, setReturns] = useState(() => gccVatReturnStore.getAll());
  const [country, setCountry] = useState<string>('all');
  const company = companyStore.getAll()[0];
  const refresh = () => setReturns(gccVatReturnStore.getAll());

  const filtered = useMemo(() => {
    return returns.filter(r => country === 'all' || r.country === country).sort((a, b) => b.period_end.localeCompare(a.period_end));
  }, [returns, country]);

  const kpis = useMemo(() => {
    const totalVat = filtered.filter(r => r.status === 'submitted' || r.status === 'accepted')
      .reduce((s, r) => s + r.vat_payable, 0);
    return { totalReturns: filtered.length, totalVatPayable: totalVat, draftCount: filtered.filter(r => r.status === 'draft').length };
  }, [filtered]);

  const handleSubmit = (r: GccVatReturn) => {
    gccVatReturnStore.update(r.id, { status: 'submitted', filed_at: new Date().toISOString().split('T')[0] } as any);
    refresh();
    toast.success(`تم تقديم إقرار ${r.period_label} لـ ${COUNTRY_LABELS[r.country]}`);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader title="إقرار ضريبة القيمة المضافة — دول الخليج" description="تقديم وإدارة إقرارات ضريبة القيمة المضافة الربعية لدول مجلس التعاون (FTA)" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard icon={FileText} label="إجمالي الإقرارات" value={String(kpis.totalReturns)} color="blue" />
        <KPICard icon={Calculator} label="ضريبة مستحقة" value={formatQAR(kpis.totalVatPayable)} color="violet" />
        <KPICard icon={Clock} label="مسودات" value={String(kpis.draftCount)} color="amber" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Label>الدولة:</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الدول</SelectItem>
            {(Object.keys(COUNTRY_LABELS)).map(c => (
              <SelectItem key={c} value={c}>{COUNTRY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> الإقرارات الضريبية</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الفترة</TableHead><TableHead>الدولة</TableHead>
                <TableHead>مبيعات خاضعة</TableHead><TableHead>مشتريات</TableHead>
                <TableHead>ضريبة الإخراج</TableHead><TableHead>ضريبة الإدخال</TableHead>
                <TableHead>مستحق</TableHead><TableHead>{tt('legal.status', 'الحالة')}</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-[12px]">{r.period_label}</TableCell>
                  <TableCell><Badge variant="outline">{COUNTRY_LABELS[r.country]}</Badge></TableCell>
                  <TableCell className="text-[12px]">{formatQAR(r.standard_rated_sales)}</TableCell>
                  <TableCell className="text-[12px]">{formatQAR(r.standard_rated_purchases)}</TableCell>
                  <TableCell className="text-[12px] text-[#533afd] font-semibold">{formatQAR(r.total_output_vat)}</TableCell>
                  <TableCell className="text-[12px] text-emerald-600 font-semibold">{formatQAR(r.total_input_vat)}</TableCell>
                  <TableCell className="text-[12px] font-bold text-violet-600">{formatQAR(r.vat_payable)}</TableCell>
                  <TableCell><Badge className={STATUS_VARIANTS[r.status]}>{STATUS_LABELS[r.status]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(r.status === 'ready' || r.status === 'draft') && (
                        <Button variant="ghost" size="sm" onClick={() => handleSubmit(r)} className="text-[12px] text-[#533afd] h-7">
                          <Send className="h-3 w-3 ml-1" /> تقديم
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="p-8 text-center text-[#64748d]">لا توجد إقرارات</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <AlertTriangle className="h-4 w-4 inline mr-1 text-[#9b6829]" />
        <strong>تنبيه:</strong> التقديم الفعلي لإقرارات VAT يتم عبر البوابة الإلكترونية لهيئة الضرائب في الدولة المعنية (FTA للإمارات، ZATCA للسعودية).
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colors: Record<string, string> = { blue: 'bg-[rgba(83,58,253,0.06)] text-[#533afd]', violet: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-[#9b6829]', emerald: 'bg-emerald-50 text-emerald-600' };
  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${colors[color] || colors.blue} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
          </div>
          <div><p className="text-xs text-[#64748d]">{label}</p><p className="text-2xl font-bold text-[#061b31]">{value}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}
