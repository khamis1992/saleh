import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Users, FileText, Download, Send, Eye, CheckCircle2, XCircle,
  Clock, AlertTriangle, DollarSign, Briefcase, Building2,
} from 'lucide-react';
import { wpsFileStore, wpsSalaryItemStore, companyStore } from '@/services/stores';
import { buildSifFile, computeWpsTotals, wpsPeriodLabel, defaultWpsSalaryDate, UAE_BANK_CODES } from '@/utils/wps';
import { formatQAR } from '@/lib/format';
import type { WpsFile, WpsFileStatus } from '@/types';

const STATUS_VARIANTS: Record<WpsFileStatus, string> = {
  draft: 'bg-gray-100 text-gray-700', validated: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  submitted: 'bg-amber-100 text-[#9b6829]', acknowledged: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-[#ea2261]',
};
const STATUS_LABELS: Record<WpsFileStatus, string> = {
  draft: t.hr.draft || tt('hr.draft','مسودة'), validated: 'تم التحقق', submitted: 'مُقدَّم', acknowledged: 'مؤكد', rejected: t.hr.rejected || tt('hr.rejected','مرفوض'),
};

export default function WpsPage() {
  const { dir } = useLocale();
  const [files, setFiles] = useState(() => wpsFileStore.getAll());
  const [items, setItems] = useState(() => wpsSalaryItemStore.getAll());
  const [previewFile, setPreviewFile] = useState<WpsFile | null>(null);
  const company = companyStore.getAll()[0];
  const refresh = () => { setFiles(wpsFileStore.getAll()); setItems(wpsSalaryItemStore.getAll()); };

  const totals = useMemo(() => computeWpsTotals(items), [items]);

  const handleGenerate = () => {
    const month = new Date().toISOString().slice(0, 7);
    const label = wpsPeriodLabel(month);
    const file: WpsFile = {
      id: '', company_id: 'comp-1', file_name: `WPS-${month}.sif`,
      mol_id: 'MOL-78912', period_month: month, period_label: label,
      generated_at: new Date().toISOString(), submitted_at: '',
      status: 'draft', sif_content: '',
      employee_count: totals.employee_count, total_net: totals.total_net,
      total_basic: totals.total_basic, total_allowances: totals.total_allowances, total_deductions: totals.total_deductions,
      rejection_reason: '', mol_reference: '', notes: '',
    };
    wpsFileStore.create(file);
    refresh();
    toast.success('تم إنشاء ملف WPS جديد');
  };

  const handleSubmit = (file: WpsFile) => {
    wpsFileStore.update(file.id, { status: 'submitted', submitted_at: new Date().toISOString() } as any);
    refresh();
    toast.success(`تم تقديم ${file.file_name} لـ MOHRE`);
  };

  const handlePreviewSIF = (file: WpsFile) => {
    const sifContent = buildSifContent(file, items);
    setPreviewFile({ ...file, sif_content: sifContent });
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader title="نظام حماية الأجور — WPS (الإمارات)" description="إنشاء وتقديم ملفات نظام حماية الأجور (Salary Information File) لـ MOHRE" />

      <Card className="mb-6 bg-[rgba(83,58,253,0.06)] border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-[#533afd]" />
              <div><h3 className="font-bold text-lg">{company.name_ar}</h3><p className="text-sm text-[#64748d]">MOL-ID: MOL-78912</p></div>
            </div>
            <Badge className="bg-emerald-600 text-white text-base px-3 py-1">WPS 3.0</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard icon={Users} label="عدد الموظفين" value={String(totals.employee_count)} color="blue" />
        <KPICard icon={DollarSign} label="إجمالي الرواتب" value={formatQAR(totals.total_net)} color="emerald" />
        <KPICard icon={Briefcase} label="إجمالي الأساسي" value={formatQAR(totals.total_basic)} color="violet" />
        <KPICard icon={FileText} label="عدد الملفات" value={String(files.length)} color="amber" />
      </div>

      <Tabs defaultValue="files" dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="files">ملفات WPS ({files.length})</TabsTrigger>
          <TabsTrigger value="employees">الموظفون ({items.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> الملفات</CardTitle>
              <Button onClick={handleGenerate} className="gap-2 bg-[#533afd] hover:bg-[#533afd]">+ إنشاء ملف جديد</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الملف</TableHead><TableHead>الفترة</TableHead><TableHead>الموظفون</TableHead>
                    <TableHead>{tt('common.total', 'الإجمالي')}</TableHead><TableHead>{tt('legal.status', 'الحالة')}</TableHead><TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-[12px] font-semibold">{f.file_name}</TableCell>
                      <TableCell className="text-[12px]">{f.period_label}</TableCell>
                      <TableCell className="text-[12px]">{f.employee_count}</TableCell>
                      <TableCell className="text-[12px] font-semibold">{formatQAR(f.total_net)}</TableCell>
                      <TableCell><Badge className={STATUS_VARIANTS[f.status]}>{STATUS_LABELS[f.status]}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handlePreviewSIF(f)} className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                          {f.status === 'draft' && (
                            <Button variant="ghost" size="sm" onClick={() => handleSubmit(f)} className="text-[12px] text-[#533afd] h-7"><Send className="h-3 w-3 ml-1" /> تقديم</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> الموظفين</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tt('tenants.name', 'الاسم')}</TableHead><TableHead>رقم العمل</TableHead><TableHead>البنك</TableHead>
                    <TableHead>الأساسي</TableHead><TableHead>{tt('hr.allowances', 'البدلات')}</TableHead><TableHead>الصافي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-[12px]">{item.employee_name}</TableCell>
                      <TableCell className="text-[12px] font-mono">{item.labor_id}</TableCell>
                      <TableCell className="text-[12px]">{UAE_BANK_CODES.find(b => b.code === item.bank_code)?.name_ar || item.bank_code}</TableCell>
                      <TableCell className="text-[12px]">{formatQAR(item.basic_salary)}</TableCell>
                      <TableCell className="text-[12px]">{formatQAR(item.housing_allowance + item.transport_allowance + item.other_allowances)}</TableCell>
                      <TableCell className="text-[12px] font-bold text-emerald-600">{formatQAR(item.net_salary)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {previewFile && (
        <Dialog open onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir={dir}>
            <DialogHeader><DialogTitle>معاينة ملف SIF — {previewFile.file_name}</DialogTitle></DialogHeader>
            <pre className="bg-gray-900 text-green-400 p-3 rounded text-[12px] font-mono overflow-x-auto" dir="ltr">
              {previewFile.sif_content}
            </pre>
            <DialogFooter><Button onClick={() => setPreviewFile(null)}>إغلاق</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <AlertTriangle className="h-4 w-4 inline mr-1 text-[#9b6829]" />
        <strong>تنبيه:</strong> التقديم الفعلي لملفات WPS يتم عبر MOHRE
        (<a href="https://www.wps.mohre.gov.ae" className="text-[#533afd] underline" target="_blank" rel="noreferrer">wps.mohre.gov.ae</a>).
      </div>
    </div>
  );
}

function buildSifContent(file: WpsFile, items: any[]): string {
  const header = `SAL|3.0|${file.mol_id}|REAL ESTATE DEVELOPMENT CO.|${file.mol_id}|${file.period_month}|NBF|${file.submitted_at || file.generated_at}|${file.total_net.toFixed(2)}|${file.employee_count}|${file.generated_at}`;
  const rows = items.map(i =>
    `${i.employee_id}|${i.employee_name}|${i.labor_id}|${i.bank_code}|${i.iban}|${i.basic_salary.toFixed(2)}|${i.housing_allowance.toFixed(2)}|${i.transport_allowance.toFixed(2)}|${i.other_allowances.toFixed(2)}|${i.overtime.toFixed(2)}|${i.deductions.toFixed(2)}|${i.net_salary.toFixed(2)}|${i.days_worked}|${i.leave_days}`
  );
  return header + '\n' + rows.join('\n') + '\n';
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
