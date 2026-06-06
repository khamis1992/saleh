import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ocrProcessingStore, ocrTemplateStore } from '@/services/stores';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import {
  FileText, CheckCircle2, Activity, BarChart3,
  Scan, Upload, Layers,
} from 'lucide-react';
import type { OcrProcessing, OcrTemplate, OcrEngine } from '@/types/phase8';

// ── Labels & Badges ──────────────────────────────────────────

const ENGINE_LABELS: Record<OcrEngine, string> = {
  tesseract: 'Tesseract OCR',
  google_vision: 'Google Vision',
  azure_form: 'Azure Form Recognizer',
  adobe: 'Adobe PDF Services',
  docparser: 'Docparser',
};

const ENGINE_COLORS: Record<string, string> = {
  tesseract: 'bg-gray-100 text-gray-700',
  google_vision: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  azure_form: 'bg-violet-100 text-violet-700',
  adobe: 'bg-red-100 text-[#ea2261]',
  docparser: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS: Record<string, string> = {
  uploaded: 'مُحمَّل',
  queued: 'في الطابور',
  processing: 'قيد المعالجة',
  completed: t.maintenance.statuses.completed || tt('maintenance.statuses.completed','مكتمل'),
  failed: 'فشل',
};

const STATUS_VARIANTS: Record<string, string> = {
  uploaded: 'bg-sky-100 text-sky-700',
  queued: 'bg-amber-100 text-[#9b6829]',
  processing: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-[#ea2261]',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  contract: 'عقد',
  invoice: 'فاتورة',
  receipt: 'إيصال',
  id_card: 'بطاقة هوية',
  passport: 'جواز سفر',
  title_deed: 'صك ملكية',
  cr_certificate: 'سجل تجاري',
  custom: t.leases.frequencies.custom || tt('leases.frequencies.custom','مخصص'),
};

// ── Component ────────────────────────────────────────────────

export default function OcrDocumentAiPage() {
  const { dir } = useLocale();
  const [processings, setProcessings] = useState<OcrProcessing[]>(() => ocrProcessingStore.getAll());
  const [templates, setTemplates] = useState<OcrTemplate[]>(() => ocrTemplateStore.getAll());

  // Scan new form
  const [scanFile, setScanFile] = useState('');
  const [scanEngine, setScanEngine] = useState<OcrEngine>('tesseract');
  const [scanLanguage, setScanLanguage] = useState('ara');

  const refresh = () => {
    setProcessings(ocrProcessingStore.getAll());
    setTemplates(ocrTemplateStore.getAll());
  };

  const stats = useMemo(() => {
    const totalDocs = processings.length;
    const completed = processings.filter(p => p.status === 'completed').length;
    const processing = processings.filter(p => p.status === 'processing' || p.status === 'queued').length;
    const completedDocs = processings.filter(p => p.status === 'completed');
    const avgConfidence = completedDocs.length > 0
      ? completedDocs.reduce((s, p) => s + p.confidence, 0) / completedDocs.length
      : 0;
    return { totalDocs, completed, processing, avgConfidence };
  }, [processings]);

  const handleScanNew = () => {
    if (!scanFile.trim()) {
      toast.error('يرجى إدخال اسم الملف');
      return;
    }
    const newRecord: OcrProcessing = {
      id: '',
      company_id: 'comp-1',
      file_name: scanFile,
      file_url: `/uploads/ocr/${scanFile}`,
      file_type: scanFile.endsWith('.pdf') ? 'pdf' : 'image',
      page_count: 1,
      engine: scanEngine,
      language: scanLanguage,
      status: 'queued',
      result_text: '',
      confidence: 0,
      extracted_fields_json: '{}',
      processing_time_ms: 0,
      created_at: new Date().toISOString().split('T')[0],
      completed_at: '',
    };
    ocrProcessingStore.create(newRecord);
    refresh();
    toast.success(`تم رفع ${scanFile} للمعالجة`);
    setScanFile('');
  };

  // Helper to parse fields count from fields_definition_json
  const getFieldsCount = (json: string): number => {
    try {
      const fields = JSON.parse(json);
      return Array.isArray(fields) ? fields.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="مستندات الذكاء الاصطناعي — OCR & Document AI"
        description="استخراج النصوص والبيانات من المستندات باستخدام تقنيات التعرف الضوئي على الأحرف"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="إجمالي المستندات"
          value={stats.totalDocs}
          icon={<FileText className="h-5 w-5" />}
          color="blue"
        />
        <KpiCard
          label={t.maintenance.statuses.completed || tt('maintenance.statuses.completed','مكتمل')}
          value={stats.completed}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="green"
        />
        <KpiCard
          label="قيد المعالجة"
          value={stats.processing}
          icon={<Activity className="h-5 w-5" />}
          color="amber"
        />
        <KpiCard
          label="متوسط الدقة"
          value={`${stats.avgConfidence.toFixed(1)}%`}
          icon={<BarChart3 className="h-5 w-5" />}
          color="blue"
        />
      </div>

      <Tabs defaultValue="processing" dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="processing">المعالجة ({processings.length})</TabsTrigger>
          <TabsTrigger value="templates">النماذج ({templates.length})</TabsTrigger>
          <TabsTrigger value="scan">مسح جديد</TabsTrigger>
        </TabsList>

        {/* Processing Tab */}
        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-[#533afd]" />
                سجل المعالجة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الملف</TableHead>
                    <TableHead className="text-right">المحرك</TableHead>
                    <TableHead className="text-right">اللغة</TableHead>
                    <TableHead className="text-right">{tt('legal.status', 'الحالة')}</TableHead>
                    <TableHead className="text-right">نسبة الدقة</TableHead>
                    <TableHead className="text-right">وقت المعالجة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processings.map(proc => (
                    <TableRow key={proc.id}>
                      <TableCell className="text-xs font-medium">{proc.file_name}</TableCell>
                      <TableCell>
                        <Badge className={ENGINE_COLORS[proc.engine] || 'bg-gray-100'}>
                          {ENGINE_LABELS[proc.engine] || proc.engine}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{proc.language}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_VARIANTS[proc.status] || 'bg-gray-100'}>
                          {STATUS_LABELS[proc.status] || proc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {proc.status === 'completed' ? (
                          <span className={proc.confidence >= 90 ? 'text-emerald-600 font-bold' : proc.confidence >= 80 ? 'text-[#9b6829]' : 'text-[#ea2261]'}>
                            {proc.confidence.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {proc.processing_time_ms > 0
                          ? `${(proc.processing_time_ms / 1000).toFixed(1)} ثانية`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => {
              const fieldsCount = getFieldsCount(tpl.fields_definition_json);
              return (
                <Card key={tpl.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Layers className="h-4 w-4 text-violet-600" />
                          {tpl.template_name}
                        </CardTitle>
                        <p className="text-xs text-[#64748d] mt-1">
                          {DOC_TYPE_LABELS[tpl.document_type] || tpl.document_type}
                        </p>
                      </div>
                      <Badge className={tpl.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-[#64748d]'}>
                        {tpl.is_active ? t.leases.statuses.active || tt('leases.statuses.active','نشط') : t.common.inactive || tt('common.inactive','غير نشط')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                        <p className="text-xs text-[#64748d]">{tt('equipment.equipmentType', 'النوع')}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {DOC_TYPE_LABELS[tpl.document_type] || tpl.document_type}
                        </Badge>
                      </div>
                      <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                        <p className="text-xs text-[#64748d]">عدد الحقول</p>
                        <p className="text-lg font-bold text-violet-600">{fieldsCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t text-xs text-[#64748d]">
                      <span>تاريخ الإنشاء: {formatDate(tpl.created_at)}</span>
                      <span>آخر تحديث: {formatDate(tpl.updated_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Scan New Tab */}
        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#533afd]" />
                مسح مستند جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-lg space-y-4">
                {/* File upload mock */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#e5edf5] rounded-lg cursor-pointer hover:border-blue-400 bg-[#f6f9fc] transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Scan className="h-10 w-10 text-[#64748d] mb-2" />
                      <p className="text-sm text-[#64748d]">اسحب وأفلت الملف هنا أو اضغط للاختيار</p>
                      <p className="text-xs text-[#64748d] mt-1">PDF, JPG, PNG, TIFF (max 50MB)</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>اسم الملف</Label>
                  <Input
                    value={scanFile}
                    onChange={e => setScanFile(e.target.value)}
                    placeholder="مثال: عقد_إيجار.pdf"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>محرك OCR</Label>
                    <Select value={scanEngine} onValueChange={(v) => setScanEngine(v as OcrEngine)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tesseract">Tesseract OCR</SelectItem>
                        <SelectItem value="google_vision">Google Vision</SelectItem>
                        <SelectItem value="azure_form">Azure Form Recognizer</SelectItem>
                        <SelectItem value="adobe">Adobe PDF Services</SelectItem>
                        <SelectItem value="docparser">Docparser</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>اللغة</Label>
                    <Select value={scanLanguage} onValueChange={setScanLanguage}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ara">العربية</SelectItem>
                        <SelectItem value="ara+eng">العربية + الإنجليزية</SelectItem>
                        <SelectItem value="eng">الإنجليزية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="w-full bg-[#533afd] hover:bg-[#533afd]"
                  onClick={handleScanNew}
                >
                  <Scan className="h-4 w-4 ml-2" />
                  بدء المسح والمعالجة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
