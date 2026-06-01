import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HardHat, Map, Users, Banknote, AlertTriangle, FileText, ChevronLeft, TrendingUp, Plus, Wrench, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatQARInt } from '@/lib/format';
import { deriveTasksFromData, getTasks } from '@/services/tasks';
import { colorClass } from '@/utils/colorClass';

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

export default function ConstructionCenterPage() {
  const [, setRefresh] = useState(0);
  useEffect(() => { deriveTasksFromData(); setRefresh(r => r + 1); }, []);

  const stats = useMemo(() => {
    const projects = safeAll('erp_projects');
    const phases = safeAll('erp_project_phases');
    const claims = safeAll('erp_contractor_claims');
    const lands = safeAll('erp_lands');
    const budgets = safeAll('erp_project_budgets');

    const active = projects.filter((p: any) => ['construction', 'testing'].includes(p.status)).length;
    const delayedPhases = phases.filter((p: any) => p.status !== 'completed' && p.planned_end && new Date(p.planned_end) < new Date()).length;
    const pendingClaims = claims.filter((c: any) => c.status !== 'paid' && c.status !== 'rejected').length;
    const pendingReports = phases.filter((p: any) => p.status === 'in_progress').length;
    const budgetTotal = budgets.reduce((s: number, b: any) => s + (b.approved_budget || 0), 0);
    const budgetActual = budgets.reduce((s: number, b: any) => s + (b.actual_cost || 0), 0);
    const variance = budgetTotal - budgetActual;
    const overdueBudgets = budgets.filter((b: any) => (b.actual_cost || 0) > (b.approved_budget || 0)).length;
    return { active, delayedPhases, pendingClaims, pendingReports, lands: lands.length, budgetTotal, budgetActual, variance, overdueBudgets, projects };
  }, []);

  const quickActions = [
    { title: 'مشروع تطوير جديد', desc: 'إنشاء مشروع من الصفر عبر المعالج', to: '/wizards/project', icon: Plus, color: 'blue' },
    { title: 'إضافة مطالبة', desc: 'تسجيل مطالبة مقاول جديدة', to: '/construction/claims', icon: Banknote, color: 'amber' },
    { title: 'تقرير يومي', desc: 'تسجيل تقرير موقع', to: '/construction/daily-reports', icon: ClipboardList, color: 'green' },
    { title: 'تحديث تقدم', desc: 'تحديث نسبة إنجاز مشروع', to: '/construction/progress', icon: TrendingUp, color: 'violet' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="التطوير والبناء" description="إدارة دورة حياة المشاريع من الأرض حتى التسليم">
        <Link to="/wizards/project">
          <Button className="bg-[#3B82F6] hover:bg-blue-600 text-white h-9 px-4 text-sm gap-1.5">
            <Plus className="h-4 w-4" /> مشروع جديد
          </Button>
        </Link>
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="مشاريع نشطة" value={stats.active} sublabel="قيد التنفيذ" icon={<HardHat className="h-5 w-5" />} color="orange" to="/projects" />
        <KpiCard label="مراحل متأخرة" value={stats.delayedPhases} sublabel="عن الموعد" icon={<AlertTriangle className="h-5 w-5" />} color="red" to="/queues/construction" />
        <KpiCard label="مطالبات معلقة" value={stats.pendingClaims} sublabel="بانتظار اعتماد" icon={<Banknote className="h-5 w-5" />} color="amber" to="/queues/approvals" />
        <KpiCard label="ميزانيات متجاوزة" value={stats.overdueBudgets} sublabel="تجاوزت الحد" icon={<TrendingUp className="h-5 w-5" />} color="red" to="/budgets" />
        <KpiCard label="أراضي متاحة" value={stats.lands} sublabel="للتطوير" icon={<Map className="h-5 w-5" />} color="cyan" to="/lands" />
      </div>

      {/* Quick actions */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-base mb-3">إجراءات سريعة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((a, i) => {
              const Icon = a.icon;
              const cc = colorClass(a.color);
              return (
                <Link key={i} to={a.to} className="block group">
                  <div className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all bg-white">
                    <div className={`h-10 w-10 rounded-lg ${cc.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`h-5 w-5 ${cc.text}`} />
                    </div>
                    <p className="font-semibold text-sm group-hover:text-blue-600 transition-colors">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active projects */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">المشاريع النشطة</h3>
              <Link to="/projects" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                عرض الكل <ChevronLeft className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {stats.projects.filter((p: any) => ['construction', 'testing'].includes(p.status)).slice(0, 5).map((p: any) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <HardHat className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.project_name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.project_code} · {p.completion_percentage || 0}%</p>
                  </div>
                  <div className="w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.completion_percentage || 0}%` }} />
                  </div>
                </Link>
              ))}
              {stats.projects.filter((p: any) => ['construction', 'testing'].includes(p.status)).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">لا توجد مشاريع نشطة</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget summary */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-4">الميزانية مقابل الفعلي</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">إجمالي الميزانية المعتمدة</span>
                  <span className="font-bold">{formatQARInt(stats.budgetTotal)} ر.ق</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">التكلفة الفعلية</span>
                  <span className={`font-bold ${stats.variance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatQARInt(stats.budgetActual)} ر.ق</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stats.variance < 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (stats.budgetActual / Math.max(1, stats.budgetTotal)) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">الانحراف</span>
                  <span className={`text-sm font-bold ${stats.variance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {stats.variance < 0 ? 'تجاوز' : 'وفر'} {formatQARInt(Math.abs(stats.variance))} ر.ق
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
