import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { erpStudyStore } from '@/services/stores';
import { formatQAR, formatDate } from '@/lib/format';
import {
  Search, Star, BarChart3, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import type { ErpIntegrationStudy, OpenSourceErp } from '@/types/phase8';

// ── Labels & Colors ──────────────────────────────────────────

const ERP_LABELS: Record<OpenSourceErp, string> = {
  erpnext: 'ERPNext',
  odoo: 'Odoo',
  crater: 'Crater',
  dolibarr: 'Dolibarr',
  metabase: 'Metabase',
  superset: 'Apache Superset',
  grafana: 'Grafana',
};

const ERP_COLORS: Record<string, string> = {
  erpnext: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  odoo: 'bg-violet-100 text-violet-700',
  crater: 'bg-cyan-100 text-cyan-700',
  dolibarr: 'bg-orange-100 text-orange-700',
  metabase: 'bg-emerald-100 text-emerald-700',
  superset: 'bg-indigo-100 text-indigo-700',
  grafana: 'bg-amber-100 text-[#9b6829]',
};

const STATUS_LABELS: Record<string, string> = {
  planned: 'مخطط',
  in_review: t.maintenance.statuses.under_review || tt('maintenance.statuses.under_review','قيد المراجعة'),
  evaluated: 'تم التقييم',
  recommended: 'موصى به',
  not_recommended: 'غير موصى به',
  adopted: 'تم الاعتماد',
};

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  in_review: 'bg-amber-100 text-[#9b6829]',
  evaluated: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  recommended: 'bg-emerald-100 text-emerald-700',
  not_recommended: 'bg-red-100 text-[#ea2261]',
  adopted: 'bg-emerald-100 text-emerald-700',
};

function fitScoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-[#533afd]';
  if (score >= 40) return 'bg-[#9b6829]';
  return 'bg-[#ea2261]';
}

function locScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 50) return 'bg-[#533afd]';
  if (score >= 30) return 'bg-[#9b6829]';
  return 'bg-[#ea2261]';
}

// ── Component ────────────────────────────────────────────────

export default function ErpIntegrationPage() {
  const { dir } = useLocale();
  const [studies, setStudies] = useState<ErpIntegrationStudy[]>(() => erpStudyStore.getAll());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const refresh = () => {
    setStudies(erpStudyStore.getAll());
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stats = useMemo(() => {
    const total = studies.length;
    const recommended = studies.filter(s => s.study_status === 'recommended' || s.study_status === 'adopted').length;
    const avgFit = total > 0 ? studies.reduce((s, st) => s + st.fit_score, 0) / total : 0;
    const evaluated = studies.filter(s => s.study_status === 'evaluated' || s.study_status === 'in_review').length;
    return { total, recommended, avgFit, evaluated };
  }, [studies]);

  // ── KPI Cards ──────────────────────────────────────────────

  const kpiCards = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="الدراسات" value={stats.total} icon={<Search className="h-5 w-5" />} color="blue" />
      <KpiCard label="موصى به" value={stats.recommended} icon={<Star className="h-5 w-5" />} color="green" />
      <KpiCard label="متوسط التوافق" value={`${stats.avgFit.toFixed(0)}%`} icon={<BarChart3 className="h-5 w-5" />} color="violet" />
      <KpiCard label="تم تقييمه" value={stats.evaluated} icon={<CheckCircle2 className="h-5 w-5" />} color="emerald" />
    </div>
  );

  // ── Cards ──────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="دراسات تكامل الأنظمة — Open Source ERP"
        description="تقييم حلول ERP مفتوحة المصدر للتكامل مع نظام إدارة العقارات"
      />

      {kpiCards}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studies.map(study => {
          const isExpanded = expandedIds.has(study.id);
          return (
            <Card key={study.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={ERP_COLORS[study.erp_system] || 'bg-gray-100 text-gray-700'}>
                        {ERP_LABELS[study.erp_system] || study.erp_system}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{study.module}</Badge>
                    </div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{ERP_LABELS[study.erp_system]}</span>
                      <Badge className={STATUS_COLORS[study.study_status] || 'bg-gray-100'}>
                        {STATUS_LABELS[study.study_status] || study.study_status}
                      </Badge>
                    </CardTitle>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[#533afd]">{study.fit_score}%</p>
                    <p className="text-xs text-[#64748d]">درجة التوافق</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Fit score progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-[#64748d] mb-1">
                    <span>درجة التوافق</span>
                    <span>{study.fit_score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${fitScoreColor(study.fit_score)}`}
                      style={{ width: `${study.fit_score}%` }}
                    />
                  </div>
                </div>

                {/* Cost & Time */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">{tt('maintenance.cost', 'التكلفة')}</p>
                    <p className="text-sm font-bold">{formatQAR(study.cost_estimate_qar)}</p>
                  </div>
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">المدة</p>
                    <p className="text-sm font-bold">{study.implementation_months} أشهر</p>
                  </div>
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">API</p>
                    <Badge className={study.api_available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-[#ea2261]'}>
                      {study.api_available ? '✓ متاح' : '✗ غير متاح'}
                    </Badge>
                  </div>
                </div>

                {/* Localization score bar */}
                <div>
                  <div className="flex justify-between text-xs text-[#64748d] mb-1">
                    <span>التعريب والتوطين</span>
                    <span>{study.localization_score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${locScoreColor(study.localization_score)}`}
                      style={{ width: `${study.localization_score}%` }}
                    />
                  </div>
                </div>

                {/* Community & License */}
                <div className="flex items-center justify-between text-xs text-[#64748d] pt-2 border-t">
                  <span>المجتمع: {study.community_size}</span>
                  <Badge variant="outline" className="text-xs">{study.license_type}</Badge>
                </div>

                {/* Expand button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => toggleExpand(study.id)}
                >
                  {isExpanded ? (
                    <><ChevronUp className="h-4 w-4 ml-1" /> إخفاء التفاصيل</>
                  ) : (
                    <><ChevronDown className="h-4 w-4 ml-1" /> عرض التفاصيل</>
                  )}
                </Button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t animate-in fade-in">
                    {/* Pros */}
                    {study.pros.length > 0 && (
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> المزايا
                        </p>
                        <ul className="space-y-1">
                          {study.pros.map((p, i) => (
                            <li key={i} className="text-xs text-emerald-700 flex items-start gap-1">
                              <span className="text-emerald-500 mt-0.5">✓</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Cons */}
                    {study.cons.length > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> العيوب
                        </p>
                        <ul className="space-y-1">
                          {study.cons.map((c, i) => (
                            <li key={i} className="text-xs text-[#ea2261] flex items-start gap-1">
                              <span className="text-red-500 mt-0.5">✗</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Gaps */}
                    {study.gaps.length > 0 && (
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs font-bold text-orange-800 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> الفجوات
                        </p>
                        <ul className="space-y-1">
                          {study.gaps.map((g, i) => (
                            <li key={i} className="text-xs text-orange-700 flex items-start gap-1">
                              <span className="text-[#9b6829] mt-0.5">⚠</span>
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Review meta */}
                    <div className="flex items-center justify-between text-xs text-[#64748d] pt-1 border-t">
                      <span>مراجعة: {study.reviewed_by}</span>
                      <span>{formatDate(study.reviewed_at)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
