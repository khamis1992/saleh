import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, AlertTriangle, FileText, TrendingUp, Users, Wrench, Banknote, Scale, BarChart3, ChevronLeft, Activity, Clock } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { getTasks, deriveTasksFromData } from '@/services/tasks';
import { getAuditLogs } from '@/utils/exportUtils';
import { formatQARInt } from '@/lib/format';
import { colorClass } from '@/utils/colorClass';
import { cn } from '@/utils/cn';
import { Chart } from '@/components/shared/Chart';
import { Scorecard, ScorecardGrid } from '@/components/shared/Scorecard';
import { propertyStore, leaseStore } from '@/services/stores';

function safeCount(key: string, predicate?: (item: any) => boolean): number {
  try {
    const raw = localStorage.getItem(key);
    const items = raw ? JSON.parse(raw) : [];
    if (predicate) return items.filter(predicate).length;
    return items.length;
  } catch { return 0; }
}

function safeSum(key: string, field: string, predicate?: (item: any) => boolean): number {
  try {
    const raw = localStorage.getItem(key);
    const items = raw ? JSON.parse(raw) : [];
    return items
      .filter((i: any) => !predicate || predicate(i))
      .reduce((s: number, i: any) => s + (Number(i[field]) || 0), 0);
  } catch { return 0; }
}

export default function ExecutiveCenterPage() {
  const [refresh, setRefresh] = useState(0);
  const [audit, setAudit] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    deriveTasksFromData();
    setTasks(getTasks());
    setAudit(getAuditLogs().slice(0, 8));
  }, [refresh]);

  // Re-derive tasks every 12s
  useEffect(() => {
    const id = setInterval(() => {
      setRefresh(r => r + 1);
    }, 12000);
    return () => clearInterval(id);
  }, []);

  const kpis = useMemo(() => {
    const overdueInvoices = safeSum('erp_invoices', 'total', (i: any) => i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date());
    const monthlyRent = safeSum('erp_invoices', 'total', (i: any) => i.status === 'paid' && i.invoice_date && new Date(i.invoice_date).getMonth() === new Date().getMonth());
    const activeProjects = safeCount('erp_projects', (p: any) => p.status === 'construction' || p.status === 'testing');
    const delayedPhases = safeCount('erp_project_phases', (p: any) => p.status !== 'completed' && p.planned_end && new Date(p.planned_end) < new Date());
    const pendingApprovals = tasks.filter(t => t.status === 'open' && t.category === 'approval').length;
    const openLegal = safeCount('erp_legal_cases', (l: any) => l.status !== 'closed');
    const occupancy = (() => {
      const units = (() => { try { return JSON.parse(localStorage.getItem('erp_units') || '[]'); } catch { return []; } })();
      if (units.length === 0) return 0;
      const leased = units.filter((u: any) => u.status === 'leased').length;
      return Math.round((leased / units.length) * 100);
    })();
    return { overdueInvoices, monthlyRent, activeProjects, delayedPhases, pendingApprovals, openLegal, occupancy };
  }, [tasks, refresh]);

  const quickReports = [
    { title: 'الميزانية العمومية', href: '/reports/balance-sheet', icon: FileText, color: 'blue' },
    { title: 'قائمة الدخل', href: '/reports/profit-loss', icon: TrendingUp, color: 'green' },
    { title: 'التدفقات النقدية', href: '/reports/cash-flow', icon: BarChart3, color: 'emerald' },
    { title: 'أعمار الذمم', href: '/reports/receivables-aging', icon: Clock, color: 'orange' },
    { title: 'الإشغال', href: '/reports/occupancy', icon: Building2, color: 'cyan' },
    { title: 'تقدم المشاريع', href: '/reports/project-progress', icon: TrendingUp, color: 'violet' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="المركز التنفيذي"
        description="نظرة شاملة على أداء الشركة، الموافقات المعلقة، والمخاطر الرئيسية"
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="صندوق نقدي افتراضي" value={formatQARInt(kpis.monthlyRent * 0.4)} sublabel="إيرادات محصلة" icon={<Banknote className="h-5 w-5" />} color="green" />
        <KpiCard label="الإيراد الشهري" value={formatQARInt(kpis.monthlyRent)} sublabel="إيجار محصل" icon={<TrendingUp className="h-5 w-5" />} color="emerald" />
        <KpiCard label="إيجار متأخر" value={formatQARInt(kpis.overdueInvoices)} sublabel="مستحق التحصيل" icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <KpiCard label="نسبة الإشغال" value={`${kpis.occupancy}%`} sublabel="من إجمالي الوحدات" icon={<Building2 className="h-5 w-5" />} color="blue" />
        <KpiCard label="مشاريع نشطة" value={kpis.activeProjects} sublabel="قيد التنفيذ" icon={<Wrench className="h-5 w-5" />} color="orange" />
        <KpiCard label="مراحل متأخرة" value={kpis.delayedPhases} sublabel="عن الموعد المخطط" icon={<Clock className="h-5 w-5" />} color="amber" />
      </div>

      {/* Performance Scorecard Grid */}
      <ScorecardGrid
        title="مؤشرات الأداء الرئيسية"
        subtitle="الأداء الفعلي مقابل الأهداف"
        columns={4}
        scorecards={[
          { label: 'هامش الربح التشغيلي (NOI)', value: formatQARInt(kpis.monthlyRent * 12 * 0.7), target: formatQARInt(kpis.monthlyRent * 14), delta: { value: -10, direction: 'up-good' as const }, sublabel: 'سنوي', icon: <TrendingUp className="h-4 w-4 text-emerald-600" />, iconBg: 'bg-emerald-50' },
          { label: 'نسبة التحصيل', value: `${Math.round(kpis.monthlyRent / Math.max(1, kpis.monthlyRent + kpis.overdueInvoices) * 100)}%`, target: '95%', delta: { value: -5, direction: 'up-good' as const }, sublabel: 'من المستحقات', icon: <Banknote className="h-4 w-4 text-blue-600" />, iconBg: 'bg-blue-50' },
          { label: 'معدل الإشغال', value: `${kpis.occupancy}%`, target: '90%', delta: { value: Math.round((kpis.occupancy - 90) / 90 * 100), direction: 'up-good' as const }, sublabel: 'من الوحدات الجاهزة', icon: <Building2 className="h-4 w-4 text-cyan-600" />, iconBg: 'bg-cyan-50' },
          { label: 'انحراف المواعيد', value: `${kpis.delayedPhases}`, target: '0', delta: { value: kpis.delayedPhases * 10, direction: 'down-good' as const }, sublabel: 'مرحلة متأخرة', icon: <Clock className="h-4 w-4 text-amber-600" />, iconBg: 'bg-amber-50' },
        ]}
      />

      {/* NOI & Occupancy charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-3">صافي الدخل التشغيلي (NOI) لكل عقار</h3>
            <Chart height={260} option={{
              tooltip: { trigger: 'axis', valueFormatter: (v: number) => formatQARInt(v) },
              xAxis: { type: 'category', data: propertyStore.getAll().slice(0, 6).map((p: any) => p.property_name), axisLabel: { fontSize: 10, rotate: 15 } },
              yAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}K` } },
              series: [{ name: 'NOI', type: 'bar', data: propertyStore.getAll().slice(0, 6).map((p: any) => { const ls = leaseStore.getAll().filter((l: any) => l.property_id === p.id && l.status === 'active'); return Math.round(ls.reduce((s: number, l: any) => s + l.rent_amount * 12, 0) * 0.7); }), itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] } }],
            }} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-3">نسبة الإشغال لكل عقار</h3>
            <Chart height={260} option={{
              tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v}%` },
              xAxis: { type: 'category', data: propertyStore.getAll().slice(0, 6).map((p: any) => p.property_name), axisLabel: { fontSize: 10, rotate: 15 } },
              yAxis: { type: 'value', max: 100, axisLabel: { fontSize: 10, formatter: '{value}%' } },
              series: [{ name: 'الإشغال', type: 'bar', data: propertyStore.getAll().slice(0, 6).map((p: any) => { const us = JSON.parse(localStorage.getItem('erp_units') || '[]').filter((u: any) => u.property_id === p.id); if (!us.length) return 0; return Math.round(us.filter((u: any) => u.status === 'leased').length / us.length * 100); }), itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] } }],
            }} />
          </CardContent>
        </Card>
      </div>

      {/* Occupancy heatmap */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-base">خريطة الإشغال</h3>
              <p className="text-xs text-muted-foreground">كل مربع = وحدة. أخضر مؤجرة، رمادي شاغرة، أصفر صيانة، أحمر محجوزة</p>
            </div>
            <Link to="/units" className="text-xs text-blue-600 hover:underline">كل الوحدات</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:grid-cols-10 gap-1.5">
            {(() => { const us = JSON.parse(localStorage.getItem('erp_units') || '[]'); return us.slice(0, 80).map((u: any) => { const c = u.status === 'leased' ? 'bg-emerald-500 text-white' : u.status === 'under_maintenance' ? 'bg-amber-500 text-white' : u.status === 'available' ? 'bg-gray-200 text-gray-600 border border-dashed border-gray-300' : 'bg-red-500 text-white'; return <div key={u.id} title={u.unit_code + ' · ' + u.status} className={cn('aspect-square rounded-md flex items-center justify-center text-[9px] font-bold cursor-pointer transition-transform hover:scale-110', c)}>{(u.unit_code || '').slice(-3) || '?'}</div>; }); })()}
          </div>
          <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500" />مؤجرة</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gray-200 border border-dashed border-gray-300" />شاغرة</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500" />صيانة</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500" />محجوزة</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approvals queue (left, 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">الموافقات المعلقة</h3>
                    <p className="text-xs text-muted-foreground">عناصر تنتظر قرارك</p>
                  </div>
                </div>
                <Link to="/queues/approvals">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">عرض الكل <ChevronLeft className="h-3 w-3" /></Button>
                </Link>
              </div>
              {kpis.pendingApprovals === 0 ? (
                <EmptyStateWithAction
                  icon={<Shield className="h-8 w-8 text-muted-foreground" />}
                  title="لا توجد موافقات معلقة"
                  description="كل العناصر تمت مراجعتها. عمل ممتاز!"
                />
              ) : (
                <div className="space-y-2">
                  {tasks.filter(t => t.status === 'open' && t.category === 'approval').slice(0, 5).map(task => (
                    <Link
                      key={task.id}
                      to={task.link}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/40 transition-colors"
                    >
                      <div className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        task.priority === 'urgent' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-amber-500' :
                        task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400',
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-[11px] text-muted-foreground">{task.module}</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risks */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base">المخاطر الرئيسية</h3>
                  <p className="text-xs text-muted-foreground">عناصر تستحق الانتباه</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link to="/queues/collection" className="block">
                  <div className="p-3 rounded-lg border border-red-100 bg-red-50/40 hover:bg-red-50 transition-colors">
                    <p className="text-xs text-muted-foreground">إيجار متأخر التحصيل</p>
                    <p className="text-xl font-bold text-red-700 mt-1">{formatQARInt(kpis.overdueInvoices)} <span className="text-[10px] font-normal text-muted-foreground">ر.ق</span></p>
                  </div>
                </Link>
                <Link to="/queues/construction" className="block">
                  <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition-colors">
                    <p className="text-xs text-muted-foreground">مراحل متأخرة</p>
                    <p className="text-xl font-bold text-amber-700 mt-1">{kpis.delayedPhases}</p>
                  </div>
                </Link>
                <Link to="/legal/notices" className="block">
                  <div className="p-3 rounded-lg border border-violet-100 bg-violet-50/40 hover:bg-violet-50 transition-colors">
                    <p className="text-xs text-muted-foreground">قضايا قانونية مفتوحة</p>
                    <p className="text-xl font-bold text-violet-700 mt-1">{kpis.openLegal}</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: activity + quick reports */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">آخر النشاطات</h3>
                </div>
              </div>
              {audit.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">لا يوجد نشاط حديث</p>
              ) : (
                <div className="space-y-2.5">
                  {audit.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{a.user}</p>
                        <p className="text-muted-foreground truncate">{a.action} — {a.module}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{new Date(a.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-sm mb-3">تقارير سريعة</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickReports.map(r => {
                  const Icon = r.icon;
                  const cc = colorClass(r.color);
                  return (
                    <Link key={r.href} to={r.href} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-xs">
                      <div className={`h-7 w-7 rounded-md flex items-center justify-center ${cc.bg} ${cc.text}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="flex-1 truncate font-medium">{r.title}</span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
