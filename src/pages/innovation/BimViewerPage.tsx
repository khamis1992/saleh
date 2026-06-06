import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { bimModelStore, bimClashStore, getProjectName } from '@/services/stores';
import { formatDate, formatThousand, formatDecimal } from '@/lib/format';
import {
  Boxes, AlertTriangle, CheckCircle2, Eye, Building2,
  Layers, HardDrive, FileWarning,
} from 'lucide-react';
import type { BimModel, BimClash } from '@/types/phase8';

// ── Labels & Badges ──────────────────────────────────────────

const DISCIPLINE_LABELS: Record<string, string> = {
  architectural: 'معماري',
  structural: 'إنشائي',
  mep: 'كهروميكانيكي',
  civil: 'مدني',
  interior: 'داخلي',
  landscape: 'تنسيق مواقع',
  coordination: 'تنسيقي',
};

const DISCIPLINE_COLORS: Record<string, string> = {
  architectural: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  structural: 'bg-gray-200 text-gray-700',
  mep: 'bg-amber-100 text-[#9b6829]',
  civil: 'bg-emerald-100 text-emerald-700',
  interior: 'bg-violet-100 text-violet-700',
  landscape: 'bg-green-100 text-green-700',
  coordination: 'bg-rose-100 text-rose-700',
};

const MODEL_STATUS_LABELS: Record<string, string> = {
  uploaded: 'مُحمَّل',
  processing: 'قيد المعالجة',
  ready: 'جاهز',
  error: 'خطأ',
  archived: 'مؤرشف',
};

const MODEL_STATUS_VARIANTS: Record<string, string> = {
  uploaded: 'bg-sky-100 text-sky-700',
  processing: 'bg-amber-100 text-[#9b6829]',
  ready: 'bg-emerald-100 text-emerald-700',
  error: 'bg-red-100 text-[#ea2261]',
  archived: 'bg-gray-300 text-[#64748d]',
};

const CLASH_TYPE_LABELS: Record<string, string> = {
  hard: 'تعارض صلب',
  clearance: 'خلوص غير كافٍ',
  duplicate: 'عنصر مكرر',
};

const CLASH_TYPE_COLORS: Record<string, string> = {
  hard: 'bg-red-100 text-[#ea2261]',
  clearance: 'bg-amber-100 text-[#9b6829]',
  duplicate: 'bg-violet-100 text-violet-700',
};

const CLASH_STATUS_LABELS: Record<string, string> = {
  new: 'جديد',
  active: t.leases.statuses.active || tt('leases.statuses.active','نشط'),
  reviewed: 'تمت مراجعته',
  approved: t.hr.approved || tt('hr.approved','معتمد'),
  resolved: 'تم الحل',
};

const CLASH_STATUS_VARIANTS: Record<string, string> = {
  new: 'bg-sky-100 text-sky-700',
  active: 'bg-amber-100 text-[#9b6829]',
  reviewed: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  approved: 'bg-emerald-100 text-emerald-700',
  resolved: 'bg-green-100 text-green-700',
};

// ── Component ────────────────────────────────────────────────

export default function BimViewerPage() {
  const { dir } = useLocale();
  const [models, setModels] = useState<BimModel[]>(() => bimModelStore.getAll());
  const [clashes, setClashes] = useState<BimClash[]>(() => bimClashStore.getAll());

  const refresh = () => {
    setModels(bimModelStore.getAll());
    setClashes(bimClashStore.getAll());
  };

  const stats = useMemo(() => {
    const totalModels = models.length;
    const activeClashes = clashes.filter(c => c.status === 'active' || c.status === 'new').length;
    const resolvedClashes = clashes.filter(c => c.status === 'resolved').length;
    const reviewedClashes = clashes.filter(c => c.status === 'reviewed').length;
    return { totalModels, activeClashes, resolvedClashes, reviewedClashes };
  }, [models, clashes]);

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="عارض نماذج BIM — إدارة النماذج الثلاثية الأبعاد"
        description="استعراض وإدارة نماذج BIM والتنسيق بين التخصصات واكتشاف التعارضات"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="إجمالي النماذج"
          value={stats.totalModels}
          icon={<Boxes className="h-5 w-5" />}
          color="blue"
        />
        <KpiCard
          label="التعارضات النشطة"
          value={stats.activeClashes}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
        />
        <KpiCard
          label="تم حلها"
          value={stats.resolvedClashes}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="green"
        />
        <KpiCard
          label={t.maintenance.statuses.under_review || tt('maintenance.statuses.under_review','قيد المراجعة')}
          value={stats.reviewedClashes}
          icon={<Eye className="h-5 w-5" />}
          color="amber"
        />
      </div>

      <Tabs defaultValue="models" dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="models">النماذج ({models.length})</TabsTrigger>
          <TabsTrigger value="clashes">اكتشاف التعارضات ({clashes.length})</TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map(model => (
              <Card key={model.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#533afd]" />
                        <span className="truncate">{model.model_name}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#64748d]">المؤلف:</span>
                        <span className="text-xs font-medium">{model.author}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#64748d]">المشروع:</span>
                        <span className="text-xs font-medium">{getProjectName(model.project_id) || model.project_id}</span>
                      </div>
                    </div>
                    <Badge className={DISCIPLINE_COLORS[model.discipline] || 'bg-gray-100 text-gray-700'}>
                      {DISCIPLINE_LABELS[model.discipline] || model.discipline}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                      <p className="text-xs text-[#64748d]">مستوى التفصيل</p>
                      <Badge variant="secondary" className="mt-1 font-mono text-xs">{model.lod}</Badge>
                    </div>
                    <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                      <p className="text-xs text-[#64748d]">العناصر</p>
                      <p className="text-sm font-bold">{formatThousand(model.element_count)}</p>
                    </div>
                    <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                      <p className="text-xs text-[#64748d]">الطوابق</p>
                      <p className="text-sm font-bold">{model.floor_count}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div className="bg-[#f6f9fc] rounded p-1.5 text-center">
                      <span className="text-[#64748d]">{tt('documents.version', 'الإصدار')}</span>
                      <p className="font-semibold">{model.version}</p>
                    </div>
                    <div className="bg-[#f6f9fc] rounded p-1.5 text-center">
                      <span className="text-[#64748d]">الحجم</span>
                      <p className="font-semibold">{formatDecimal(model.file_size_mb)} MB</p>
                    </div>
                    <div className="bg-[#f6f9fc] rounded p-1.5 text-center">
                      <span className="text-[#64748d]">تاريخ الرفع</span>
                      <p className="font-semibold">{formatDate(model.uploaded_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1 text-xs text-[#64748d]">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{formatDate(model.last_viewed_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-mono bg-gray-100">
                        {model.file_format.toUpperCase()}
                      </Badge>
                      <Badge className={MODEL_STATUS_VARIANTS[model.status] || 'bg-gray-100 text-gray-700'}>
                        {MODEL_STATUS_LABELS[model.status] || model.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Clash Detection Tab */}
        <TabsContent value="clashes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#9b6829]" />
                تقرير التعارضات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نوع التعارض</TableHead>
                    <TableHead className="text-right">{tt('legal.status', 'الحالة')}</TableHead>
                    <TableHead className="text-right">المسافة (مم)</TableHead>
                    <TableHead className="text-right">المسؤول</TableHead>
                    <TableHead className="text-right">{tt('maintenance.description', 'الوصف')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clashes.map(clash => (
                    <TableRow key={clash.id}>
                      <TableCell>
                        <Badge className={CLASH_TYPE_COLORS[clash.clash_type] || 'bg-gray-100'}>
                          {CLASH_TYPE_LABELS[clash.clash_type] || clash.clash_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={CLASH_STATUS_VARIANTS[clash.status] || 'bg-gray-100'}>
                          {CLASH_STATUS_LABELS[clash.status] || clash.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{(clash.distance_mm ?? 0).toFixed(0)}</TableCell>
                      <TableCell className="text-xs">{clash.assigned_to}</TableCell>
                      <TableCell className="text-xs max-w-[250px] truncate">{clash.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
