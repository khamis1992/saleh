import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Plus, X, Save, Info, MousePointerClick, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { KpiCard } from '@/components/shared/KpiCard';
import { Chart } from '@/components/shared/Chart';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface Risk {
  id: string;
  project_id: string;
  project_name: string;
  title: string;
  description?: string;
  category: 'financial' | 'schedule' | 'scope' | 'quality' | 'safety' | 'external';
  likelihood: 1 | 2 | 3 | 4 | 5; // 1=rare, 5=almost certain
  impact: 1 | 2 | 3 | 4 | 5;
  mitigation: string;
  owner: string;
  status: 'open' | 'mitigating' | 'closed';
  created_at: string;
}

const seedRisks: Risk[] = [
  { id: 'rk-1', project_id: 'prj-1', project_name: 'مجمع النخيل السكني', title: 'ارتفاع أسعار الحديد', description: 'تقلبات السوق قد تتجاوز الميزانية المعتمدة', category: 'financial', likelihood: 4, impact: 4, mitigation: 'توقيع عقد توريد بأسعار مثبتة لمدة 6 أشهر', owner: 'مدير المشروع', status: 'mitigating', created_at: '2025-09-01' },
  { id: 'rk-2', project_id: 'prj-1', project_name: 'مجمع النخيل السكني', title: 'تأخر إصدار رخصة البناء', category: 'external', likelihood: 3, impact: 5, mitigation: 'متابعة دورية مع البلدية، تعيين مستشار محلي', owner: 'مهندس الموقع', status: 'open', created_at: '2025-09-15' },
  { id: 'rk-3', project_id: 'prj-2', project_name: 'أبراج السلام', title: 'نقص العمالة الماهرة', category: 'schedule', likelihood: 3, impact: 4, mitigation: 'عقد مع 3 شركات توريد عمالة', owner: 'مدير المشروع', status: 'mitigating', created_at: '2025-10-01' },
  { id: 'rk-4', project_id: 'prj-4', project_name: 'المركز التجاري', title: 'تجاوز ميزانية التشطيبات', category: 'financial', likelihood: 5, impact: 5, mitigation: 'مراجعة شاملة مع الموردين', owner: 'مدير المشروع', status: 'open', created_at: '2025-10-20' },
  { id: 'rk-5', project_id: 'prj-3', project_name: 'فلل الياسمين', title: 'حادث سلامة محتمل', category: 'safety', likelihood: 2, impact: 5, mitigation: 'تدريب أسبوعي للعمال، فحص معدات يومي', owner: 'مسؤول السلامة', status: 'mitigating', created_at: '2025-10-10' },
];

const CATEGORY_LABELS: Record<string, string> = {
  financial: 'مالي', schedule: 'جدول', scope: 'نطاق', quality: 'جودة', safety: 'سلامة', external: 'خارجي',
};

const CATEGORY_COLORS: Record<string, string> = {
  financial: 'bg-red-100 text-red-700',
  schedule: 'bg-amber-100 text-amber-700',
  scope: 'bg-blue-100 text-blue-700',
  quality: 'bg-violet-100 text-violet-700',
  safety: 'bg-orange-100 text-orange-700',
  external: 'bg-gray-100 text-gray-700',
};

// Risk matrix semantic labels
const LIKELIHOOD_LABELS: Record<number, string> = {
  1: 'نادر', 2: 'غير محتمل', 3: 'ممكن', 4: 'محتمل', 5: 'شبه مؤكد',
};
const IMPACT_LABELS: Record<number, string> = {
  1: 'ضئيل', 2: 'صغير', 3: 'متوسط', 4: 'كبير', 5: 'كارثي',
};
type Severity = 'critical' | 'high2' | 'high' | 'medium' | 'low';
const SEVERITY_TIERS: { key: Severity; label: string; range: string; bg: string; text: string; border: string }[] = [
  { key: 'critical', label: 'حرج',       range: '20-25', bg: 'bg-red-700',     text: 'text-white',     border: 'border-red-700' },
  { key: 'high2',    label: 'عالي جداً', range: '15-19', bg: 'bg-red-500',     text: 'text-white',     border: 'border-red-500' },
  { key: 'high',     label: 'عالي',      range: '10-14', bg: 'bg-amber-400',   text: 'text-gray-900',  border: 'border-amber-400' },
  { key: 'medium',   label: 'متوسط',     range: '5-9',   bg: 'bg-emerald-300', text: 'text-gray-900',  border: 'border-emerald-300' },
  { key: 'low',      label: 'منخفض',     range: '1-4',   bg: 'bg-emerald-100', text: 'text-gray-700',  border: 'border-emerald-200' },
];
function severityOf(score: number): Severity {
  if (score >= 20) return 'critical';
  if (score >= 15) return 'high2';
  if (score >= 10) return 'high';
  if (score >= 5)  return 'medium';
  return 'low';
}

function loadRisks(): Risk[] {
  try { return JSON.parse(localStorage.getItem('erp_risk_register') || '[]'); } catch { return []; }
}
function saveRisks(risks: Risk[]) {
  localStorage.setItem('erp_risk_register', JSON.stringify(risks));
}

export default function RiskRegisterPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const projectName = searchParams.get('projectName') || '';
  const [risks, setRisks] = useState<Risk[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<Risk>>({ category: 'financial', likelihood: 3, impact: 3, status: 'open' });
  const [cellDialog, setCellDialog] = useState<{ likelihood: number; impact: number } | null>(null);

  useEffect(() => {
    const existing = loadRisks();
    if (existing.length === 0) { saveRisks(seedRisks); setRisks(seedRisks); }
    else setRisks(existing);
  }, []);

  const refresh = () => setRisks(loadRisks());

  const stats = useMemo(() => {
    const total = risks.length;
    const open = risks.filter(r => r.status !== 'closed').length;
    const high = risks.filter(r => r.status !== 'closed' && (r.likelihood * r.impact) >= 12).length;
    const mitigated = risks.filter(r => r.status === 'mitigating').length;
    return { total, open, high, mitigated };
  }, [risks]);

  const matrix = useMemo(() => {
    // 5x5 grid
    const grid: { likelihood: number; impact: number; count: number; risks: Risk[] }[] = [];
    for (let l = 5; l >= 1; l--) {
      for (let i = 1; i <= 5; i++) {
        const matching = risks.filter(r => r.likelihood === l && r.impact === i && r.status !== 'closed');
        grid.push({ likelihood: l, impact: i, count: matching.length, risks: matching });
      }
    }
    return grid;
  }, [risks]);

  function submitRisk() {
    if (!form.title) { toast.error('عنوان المخاطرة مطلوب'); return; }
    const newRisk: Risk = {
      id: `rk-${Date.now()}`,
      project_id: form.project_id || '',
      project_name: form.project_name || '—',
      title: form.title!,
      description: form.description,
      category: form.category as Risk['category'],
      likelihood: form.likelihood as Risk['likelihood'],
      impact: form.impact as Risk['impact'],
      mitigation: form.mitigation || '',
      owner: form.owner || '',
      status: form.status as Risk['status'],
      created_at: new Date().toISOString().split('T')[0],
    };
    const updated = [newRisk, ...risks];
    saveRisks(updated);
    setRisks(updated);
    setShowAdd(false);
    setForm({ category: 'financial', likelihood: 3, impact: 3, status: 'open' });
    toast.success('تم تسجيل المخاطرة');
  }

  function updateStatus(id: string, status: Risk['status']) {
    const updated = risks.map(r => r.id === id ? { ...r, status } : r);
    saveRisks(updated);
    setRisks(updated);
  }

  // 5x5 matrix color scale
  const cellColor = (l: number, i: number) => {
    const score = l * i;
    if (score >= 20) return 'bg-red-700 text-white';
    if (score >= 15) return 'bg-red-500 text-white';
    if (score >= 10) return 'bg-amber-400 text-gray-900';
    if (score >= 5) return 'bg-emerald-300 text-gray-900';
    return 'bg-emerald-100 text-gray-700';
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="سجل المخاطر" description="إدارة المخاطر عبر المشاريع — مصفوفة الاحتمال × التأثير">
        <Button onClick={() => setShowAdd(true)} className="bg-[#3B82F6] hover:bg-blue-600 text-white h-9 text-sm gap-1.5">
          <Plus className="h-4 w-4" /> تسجيل مخاطرة
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="إجمالي المخاطر" value={stats.total} sublabel="في السجل" icon={<AlertTriangle className="h-5 w-5" />} color="blue" />
        <KpiCard label="مخاطر مفتوحة" value={stats.open} sublabel="تحتاج إجراء" icon={<AlertTriangle className="h-5 w-5" />} color="amber" />
        <KpiCard label="مخاطر عالية جداً" value={stats.high} sublabel="درجة ≥ 12" icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <KpiCard label="قيد المعالجة" value={stats.mitigated} sublabel="تتم المعالجة" icon={<AlertTriangle className="h-5 w-5" />} color="cyan" />
      </div>

      {/* Risk Matrix */}
      <Card>
        <CardContent className="p-5">
          {/* Header: title + description + info */}
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-start gap-2">
              <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">مصفوفة المخاطر</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  خريطة بصرية تصنّف المخاطر المسجلة حسب <span className="font-semibold text-foreground">احتمال حدوثها</span> و<span className="font-semibold text-foreground">مدى تأثيرها</span> على المشروع. تساعدك على تحديد أين يجب تركيز الاهتمام أولاً.
                </p>
              </div>
            </div>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="h-7 w-7 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-right leading-relaxed p-3">
                  <p className="font-semibold mb-1.5">كيف تُحسب درجة المخاطرة؟</p>
                  <p className="text-[11px] mb-2">الدرجة = الاحتمال × التأثير (من 1 إلى 25)</p>
                  <p className="text-[11px] mb-1">مثال: مخاطرة باحتمال 4 وتأثير 5 = درجة 20 (حرج)</p>
                  <p className="text-[11px] mt-2 pt-2 border-t border-white/20 text-white/80">اضغط على أي خلية ملونة لعرض تفاصيل المخاطر الموجودة بها.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Severity color legend */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4 p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
            <span className="text-[11px] font-semibold text-muted-foreground ml-1">دليل الخطورة:</span>
            {SEVERITY_TIERS.map(t => (
              <span key={t.key} className={cn('text-[10px] font-bold px-2 py-0.5 rounded', t.bg, t.text)}>
                {t.label} <span className="opacity-75 font-normal">({t.range})</span>
              </span>
            ))}
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="overflow-x-auto pb-1">
              <div className="inline-block min-w-full">
                <div className="grid" style={{ gridTemplateColumns: '92px repeat(5, minmax(72px, 1fr))', gap: '3px' }}>
                  {/* Top-left corner cell */}
                  <div className="flex flex-col items-end justify-end pr-2 pb-1">
                    <span className="text-[10px] text-muted-foreground">الزاوية =</span>
                    <span className="text-[10px] text-muted-foreground">أعلى خطورة</span>
                  </div>
                  {/* header row: impact 1..5 */}
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="text-center py-1 px-1 rounded-md bg-gray-50 border border-gray-100">
                      <div className="text-xs font-bold leading-tight">تأثير {i}</div>
                      <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{IMPACT_LABELS[i]}</div>
                    </div>
                  ))}

                  {/* matrix rows: likelihood 5 (top) to 1 (bottom) */}
                  {Array.from({ length: 5 }, (_, idx) => 5 - idx).map(l => (
                    <div key={l} className="contents">
                      <div className="text-xs font-bold flex flex-col items-end justify-center pr-2 py-1 rounded-md bg-gray-50 border border-gray-100">
                        <span className="leading-tight">احتمال {l}</span>
                        <span className="text-[9px] text-muted-foreground font-normal leading-tight mt-0.5">{LIKELIHOOD_LABELS[l]}</span>
                      </div>
                      {[1, 2, 3, 4, 5].map(i => {
                        const cell = matrix.find(c => c.likelihood === l && c.impact === i)!;
                        const score = l * i;
                        const severity = severityOf(score);
                        const hasRisks = cell.count > 0;
                        const cellBtn = (
                          <button
                            onClick={() => hasRisks && setCellDialog({ likelihood: l, impact: i })}
                            className={cn(
                              'aspect-square rounded-md flex flex-col items-center justify-center font-bold transition-all relative',
                              hasRisks ? 'hover:scale-105 hover:shadow-lg hover:z-10 cursor-pointer ring-1 ring-black/5' : 'cursor-default',
                              cellColor(l, i)
                            )}
                            aria-label={`احتمال ${l} تأثير ${i} - ${SEVERITY_TIERS.find(t => t.key === severity)?.label} - ${cell.count} مخاطر`}
                          >
                            {hasRisks ? (
                              <>
                                <span className="text-xl font-extrabold leading-none">{cell.count}</span>
                                <span className="text-[8px] mt-0.5 opacity-90 leading-none font-semibold">
                                  {SEVERITY_TIERS.find(t => t.key === severity)?.label}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] opacity-40 leading-none font-semibold">{score}</span>
                            )}
                          </button>
                        );
                        if (!hasRisks) return <div key={i}>{cellBtn}</div>;
                        return (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>{cellBtn}</TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-right p-2.5">
                              <div className="font-semibold mb-1 text-[11px]">
                                {cell.count} {cell.count === 1 ? 'مخاطرة' : 'مخاطر'} · درجة {score} ({SEVERITY_TIERS.find(t => t.key === severity)?.label})
                              </div>
                              <ul className="space-y-0.5 mb-1.5">
                                {cell.risks.slice(0, 4).map(r => (
                                  <li key={r.id} className="text-[10px] leading-relaxed">• {r.title}</li>
                                ))}
                                {cell.risks.length > 4 && (
                                  <li className="text-[10px] opacity-75">و {cell.risks.length - 4} أخرى...</li>
                                )}
                              </ul>
                              <div className="text-[10px] pt-1.5 border-t border-white/20 flex items-center gap-1 opacity-90">
                                <MousePointerClick className="h-2.5 w-2.5" />
                                <span>اضغط للتفاصيل الكاملة</span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TooltipProvider>

          {/* How-to-read guide */}
          <div className="mt-4 flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-600" />
            <div className="text-[11px] text-blue-900 leading-relaxed">
              <span className="font-semibold">كيف تقرأ المصفوفة:</span> كل خلية = تقاطع الاحتمال (يمين) × التأثير (أعلى).{' '}
              <span className="font-semibold">الرقم داخل الخلية</span> = عدد المخاطر بهذا التصنيف.{' '}
              <span className="font-semibold">اللون</span> = درجة الخطورة (مفتاح الألوان أعلاه). مرر الماوس أو اضغط على أي خلية ملونة لعرض التفاصيل.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk list */}
      <Card>
        <CardContent className="p-0">
          {risks.length === 0 ? (
            <EmptyStateWithAction
              size="lg"
              icon={<AlertTriangle className="h-10 w-10 text-emerald-500" />}
              title="لا توجد مخاطر مسجلة"
              description="سجل المخاطر فارغ. ابدأ بتسجيل المخاطر المحتملة."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {risks.map(r => {
                const score = r.likelihood * r.impact;
                const severity = score >= 15 ? 'critical' : score >= 10 ? 'high' : score >= 5 ? 'medium' : 'low';
                const sevColors = {
                  critical: 'border-r-4 border-red-500 bg-red-50/30',
                  high: 'border-r-4 border-amber-500 bg-amber-50/30',
                  medium: 'border-r-4 border-blue-500',
                  low: 'border-r-4 border-emerald-500',
                };
                return (
                  <div key={r.id} className={cn('p-4 flex items-start gap-3', sevColors[severity])}>
                    <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-extrabold text-sm shrink-0">
                      {score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{r.title}</p>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', CATEGORY_COLORS[r.category])}>{CATEGORY_LABELS[r.category]}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold',
                          severity === 'critical' ? 'bg-red-100 text-red-700' :
                          severity === 'high' ? 'bg-amber-100 text-amber-700' :
                          severity === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700',
                        )}>
                          {severity === 'critical' ? 'حرج' : severity === 'high' ? 'عالي' : severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </span>
                        {r.status === 'closed' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">مغلق</span>}
                        {r.status === 'mitigating' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">قيد المعالجة</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{r.project_name} · {r.owner}</p>
                      {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                      {r.mitigation && (
                        <div className="mt-2 p-2 rounded bg-white border border-gray-100">
                          <p className="text-[10px] font-semibold text-muted-foreground">خطة المعالجة:</p>
                          <p className="text-xs">{r.mitigation}</p>
                        </div>
                      )}
                    </div>
                    {r.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'mitigating')} className="h-7 text-xs shrink-0">
                        بدء المعالجة
                      </Button>
                    )}
                    {r.status === 'mitigating' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'closed')} className="h-7 text-xs shrink-0 text-emerald-700">
                        إغلاق
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add risk modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">تسجيل مخاطرة جديدة</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>العنوان *</Label>
                  <Input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: تأخر توريد الحديد" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>المشروع</Label>
                    <Input value={form.project_name || ''} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))} placeholder="اسم المشروع" />
                  </div>
                  <div>
                    <Label>المسؤول</Label>
                    <Input value={form.owner || ''} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="مدير المشروع" />
                  </div>
                </div>
                <div>
                  <Label>الوصف</Label>
                  <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>الفئة</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as Risk['category'] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الاحتمال (1-5)</Label>
                    <Select value={String(form.likelihood)} onValueChange={v => setForm(f => ({ ...f, likelihood: Number(v) as Risk['likelihood'] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>التأثير (1-5)</Label>
                    <Select value={String(form.impact)} onValueChange={v => setForm(f => ({ ...f, impact: Number(v) as Risk['impact'] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>خطة المعالجة</Label>
                  <Textarea value={form.mitigation || ''} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))} rows={2} placeholder="ما الإجراءات التي ستتخذها لتقليل/إزالة المخاطرة؟" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
                  <Button onClick={submitRisk} className="bg-[#3B82F6] hover:bg-blue-600 text-white gap-1.5">
                    <Save className="h-4 w-4" /> حفظ المخاطرة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cell details dialog */}
      {cellDialog && (() => {
        const cell = matrix.find(c => c.likelihood === cellDialog.likelihood && c.impact === cellDialog.impact)!;
        const score = cellDialog.likelihood * cellDialog.impact;
        const severity = severityOf(score);
        const tier = SEVERITY_TIERS.find(t => t.key === severity)!;
        return (
          <Dialog open={!!cellDialog} onOpenChange={open => !open && setCellDialog(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <span className={cn('h-3.5 w-3.5 rounded-full shrink-0 ring-2 ring-offset-1', tier.bg, tier.border)} />
                  <span>المخاطر في خلية الاحتمال {cellDialog.likelihood} × التأثير {cellDialog.impact}</span>
                </DialogTitle>
                <DialogDescription className="text-right">
                  <span className="inline-flex items-center gap-2 flex-wrap mt-1">
                    <span>الدرجة: <span className="font-bold text-foreground">{score}</span></span>
                    <span>·</span>
                    <span>التصنيف: <span className={cn('font-bold px-1.5 py-0.5 rounded text-[11px]', tier.bg, tier.text)}>{tier.label}</span></span>
                    <span>·</span>
                    <span>عدد المخاطر: <span className="font-bold text-foreground">{cell.count}</span></span>
                  </span>
                </DialogDescription>
              </DialogHeader>
              {cell.risks.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">لا توجد مخاطر في هذه الخلية.</div>
              ) : (
                <div className="space-y-2.5">
                  {cell.risks.map(r => (
                    <div key={r.id} className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="h-7 w-7 rounded-md bg-gray-100 flex items-center justify-center font-extrabold text-xs shrink-0">
                          {r.likelihood * r.impact}
                        </div>
                        <span className="text-sm font-semibold flex-1 min-w-0">{r.title}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', CATEGORY_COLORS[r.category])}>
                          {CATEGORY_LABELS[r.category]}
                        </span>
                        {r.status === 'mitigating' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-semibold">قيد المعالجة</span>}
                        {r.status === 'open' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">مفتوح</span>}
                        {r.status === 'closed' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">مغلق</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        <span className="font-semibold">المشروع:</span> {r.project_name} · <span className="font-semibold">المسؤول:</span> {r.owner}
                      </p>
                      {r.description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{r.description}</p>}
                      {r.mitigation && (
                        <div className="mt-2 p-2 rounded bg-emerald-50/60 border border-emerald-100">
                          <p className="text-[10px] font-bold text-emerald-800 mb-0.5">خطة المعالجة:</p>
                          <p className="text-xs text-emerald-900 leading-relaxed">{r.mitigation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
