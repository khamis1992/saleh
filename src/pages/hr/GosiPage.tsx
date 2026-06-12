import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Users, Send, FileText, Calculator, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { gosiFilingStore, gosiContributionStore, companyStore } from '@/services/stores';
import { calculateGosi, computeGosiTotals, gosiPeriodLabel } from '@/utils/gosi';
import type { GosiFiling, GosiFilingStatus, GosiContribution } from '@/types';

const STATUS_VARIANTS: Record<GosiFilingStatus, string> = {
  draft: 'bg-gray-100 text-gray-700', submitted: 'bg-amber-100 text-[#9b6829]',
  acknowledged: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-[#ea2261]',
};
const STATUS_LABELS: Record<GosiFilingStatus, string> = {
  draft: t.hr.draft || tt('hr.draft','مسودة'), submitted: 'مُقدَّم', acknowledged: 'مؤكد', rejected: t.hr.rejected || tt('hr.rejected','مرفوض'),
};

export default function GosiPage() {
  const { dir } = useLocale();
  const [filings, setFilings] = useState(() => gosiFilingStore.getAll());
  const [contributions, setContributions] = useState(() => gosiContributionStore.getAll());
  const company = companyStore.getAll()[0];
  const refresh = () => { setFilings(gosiFilingStore.getAll()); setContributions(gosiContributionStore.getAll()); };

  const totals = useMemo(() => computeGosiTotals(contributions), [contributions]);

  const handleGenerate = () => {
    const month = new Date().toISOString().slice(0, 7);
    const label = gosiPeriodLabel(month);
    const totalContribs = computeGosiTotals(contributions);
    gosiFilingStore.create({
      company_id: 'comp-1', period_month: month, period_label: label,
      subscriber_type: 'saudi', generated_at: new Date().toISOString(), submitted_at: '',
      status: 'draft', total_contributions: totalContribs.total_contributions,
      total_employee_share: totalContribs.total_employee_share,
      total_employer_share: totalContribs.total_employer_share,
      total_saned: totalContribs.total_saned,
      gosi_reference: '', rejection_reason: '', notes: '',
    });
    refresh();
    toast.success(`تم إنشاء إيداع GOSI جديد — ${label}`);
  };

  const handleSubmit = (f: GosiFiling) => {
    gosiFilingStore.update(f.id, { status: 'submitted', submitted_at: new Date().toISOString() } as any);
    refresh();
    toast.success('تم تقديم الإيداع لـ GOSI Online');
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader title="التأمينات الاجتماعية — GOSI (السعودية)" description="إدارة مساهمات التأمينات الاجتماعية وتقديم الإيداعات الشهرية عبر GOSI Online" />

      <Card className="mb-6 bg-violet-50 border-violet-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-violet-600" />
              <div>
                <h3 className="font-bold text-lg">{company.name_ar}</h3>
                <p className="text-sm text-[#64748d]">السجل التجاري: {company.cr_number}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-violet-600 text-white">SA</Badge>
              <Badge className="bg-violet-600 text-white text-base px-3 py-1">GOSI</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard icon={Users} label="المشتركون" value={String(totals.employee_count)} color="violet" />
        <KPICard icon={Calculator} label="حصة الموظف" value={`SAR ${totals.total_employee_share.toFixed(0)}`} color="blue" />
        <KPICard icon={Shield} label="حصة صاحب العمل" value={`SAR ${totals.total_employer_share.toFixed(0)}`} color="emerald" />
        <KPICard icon={FileText} label="عدد الإيداعات" value={String(filings.length)} color="amber" />
      </div>

      <Tabs defaultValue="filings" dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="filings">الإيداعات ({filings.length})</TabsTrigger>
          <TabsTrigger value="subscribers">المشتركون ({contributions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="filings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> الإيداعات الشهرية</CardTitle>
              <Button onClick={handleGenerate} className="gap-2 bg-[#533afd] hover:bg-[#533afd]">+ إيداع جديد</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفترة</TableHead><TableHead>{tt('equipment.equipmentType', 'النوع')}</TableHead>
                    <TableHead>إجمالي الاشتراكات</TableHead><TableHead>حصة الموظف</TableHead>
                    <TableHead>حصة صاحب العمل</TableHead><TableHead>مخاطر مهنية</TableHead>
                    <TableHead>{tt('legal.status', 'الحالة')}</TableHead><TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filings.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-semibold text-xs">{f.period_label}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline">{f.subscriber_type === 'saudi' ? 'سعودي' : 'غير سعودي'}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{f.total_contributions.toFixed(2)} SAR</TableCell>
                      <TableCell className="text-xs">{f.total_employee_share.toFixed(2)} SAR</TableCell>
                      <TableCell className="text-xs">{f.total_employer_share.toFixed(2)} SAR</TableCell>
                      <TableCell className="text-xs">{f.total_saned.toFixed(2)} SAR</TableCell>
                      <TableCell><Badge className={STATUS_VARIANTS[f.status]}>{STATUS_LABELS[f.status]}</Badge></TableCell>
                      <TableCell>
                        {f.status === 'draft' && (
                          <Button variant="ghost" size="sm" onClick={() => handleSubmit(f)} className="text-xs text-[#533afd] h-7">
                            <Send className="h-3 w-3 ml-1" /> تقديم
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> تفاصيل المشتركين</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tt('tenants.name', 'الاسم')}</TableHead><TableHead>{tt('hr.nationality', 'الجنسية')}</TableHead><TableHead>{tt('hr.salary', 'الراتب')}</TableHead>
                    <TableHead>أجر الاشتراك</TableHead><TableHead>حصة الموظف</TableHead><TableHead>حصة صاحب العمل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map(c => {
                    const calc = calculateGosi({
                      subscriber_type: c.subscriber_type, basic_salary: c.basic_salary,
                      housing_allowance: c.housing_allowance, gross_salary: c.gross_salary,
                    });
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-semibold text-xs">{c.subscriber_name}</TableCell>
                        <TableCell className="text-xs">{c.nationality}</TableCell>
                        <TableCell className="text-xs">{c.gross_salary.toFixed(0)} SAR</TableCell>
                        <TableCell className="text-xs font-semibold">{calc.contributory_wage.toFixed(0)} SAR {calc.is_capped && <span className="text-xs text-[#9b6829]">(الحد الأقصى)</span>}</TableCell>
                        <TableCell className="text-xs">{calc.total_employee_share.toFixed(2)} SAR</TableCell>
                        <TableCell className="text-xs">{calc.total_employer_share.toFixed(2)} SAR</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-3 p-3 bg-[#f6f9fc] rounded-lg text-xs text-[#64748d]">
                <p><strong>ملاحظة:</strong> الحد الأقصى لأجر الاشتراك = 9,000 SAR. حصة السعودة (فرع 1) = 9% موظف + 9% صاحب عمل + 2% مخاطر مهنية.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <AlertTriangle className="h-4 w-4 inline mr-1 text-[#9b6829]" />
        <strong>تنبيه:</strong> التقديم الفعلي لمساهمات GOSI يتم عبر GOSI Online
        (<a href="https://www.gosi.gov.sa" className="text-[#533afd] underline" target="_blank" rel="noreferrer">www.gosi.gov.sa</a>).
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colors: Record<string, string> = { violet: 'bg-violet-50 text-violet-600', blue: 'bg-[rgba(83,58,253,0.06)] text-[#533afd]', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-[#9b6829]' };
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
