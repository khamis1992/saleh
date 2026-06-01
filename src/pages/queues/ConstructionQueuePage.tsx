import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HardHat, AlertTriangle, TrendingUp, ChevronLeft, ListChecks, Banknote } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { KpiCard } from '@/components/shared/KpiCard';
import { formatQARInt } from '@/lib/format';
import { cn } from '@/utils/cn';

interface ConstrItem {
  id: string;
  type: 'delayed-phase' | 'pending-report' | 'pending-claim' | 'overrun';
  project: string;
  project_id: string;
  title: string;
  subtitle?: string;
  amount?: number;
  severity: 'high' | 'medium';
  link: string;
}

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

export default function ConstructionQueuePage() {
  const items = useMemo<ConstrItem[]>(() => {
    const out: ConstrItem[] = [];
    const today = new Date();
    const projects = safeAll<any>('erp_projects');
    const phases = safeAll<any>('erp_project_phases');
    const claims = safeAll<any>('erp_contractor_claims');
    const budgets = safeAll<any>('erp_project_budgets');

    for (const p of phases) {
      if (p.status === 'completed') continue;
      const project = projects.find((x: any) => x.id === p.project_id);
      const projName = project?.project_name || p.project_id;

      if (p.planned_end && new Date(p.planned_end) < today) {
        const days = Math.floor((today.getTime() - new Date(p.planned_end).getTime()) / 86400000);
        out.push({
          id: `ph-${p.id}`, type: 'delayed-phase', project: projName, project_id: p.project_id,
          title: `مرحلة متأخرة: ${p.phase_name}`, subtitle: `${days} يوم تأخير`, severity: 'high',
          link: `/projects/${p.project_id}`,
        });
      }
      if (p.status === 'in_progress') {
        // check for missing daily reports
        out.push({
          id: `rep-${p.id}`, type: 'pending-report', project: projName, project_id: p.project_id,
          title: `تقرير يومي معلق لمرحلة ${p.phase_name}`, severity: 'medium',
          link: '/construction/daily-reports',
        });
      }
    }

    for (const c of claims) {
      if (['paid', 'rejected'].includes(c.status)) continue;
      const project = projects.find((x: any) => x.id === c.project_id);
      out.push({
        id: `clm-${c.id}`, type: 'pending-claim', project: project?.project_name || '',
        project_id: c.project_id || '', title: `مطالبة معلقة: ${c.claim_number}`,
        subtitle: `صافي ${formatQARInt(c.net_payable || c.claimed_amount)} ر.ق`,
        amount: c.net_payable || c.claimed_amount, severity: 'high',
        link: '/construction/claims',
      });
    }

    for (const b of budgets) {
      if ((b.actual_cost || 0) > (b.approved_budget || 0)) {
        const project = projects.find((x: any) => x.id === b.project_id);
        out.push({
          id: `bud-${b.id}`, type: 'overrun', project: project?.project_name || '',
          project_id: b.project_id, title: 'تجاوز ميزانية',
          subtitle: `تجاوز بمقدار ${formatQARInt((b.actual_cost || 0) - (b.approved_budget || 0))} ر.ق`,
          amount: (b.actual_cost || 0) - (b.approved_budget || 0), severity: 'high',
          link: '/budgets',
        });
      }
    }
    return out;
  }, []);

  const byType = {
    'delayed-phase': items.filter(i => i.type === 'delayed-phase').length,
    'pending-report': items.filter(i => i.type === 'pending-report').length,
    'pending-claim': items.filter(i => i.type === 'pending-claim').length,
    'overrun': items.filter(i => i.type === 'overrun').length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="قائمة البناء" description="كل الاختناقات والمتأخرات في المشاريع في مكان واحد" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="مراحل متأخرة" value={byType['delayed-phase']} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <KpiCard label="تقارير يومية معلقة" value={byType['pending-report']} icon={<ListChecks className="h-5 w-5" />} color="amber" />
        <KpiCard label="مطالبات معلقة" value={byType['pending-claim']} icon={<Banknote className="h-5 w-5" />} color="orange" />
        <KpiCard label="تجاوزات ميزانية" value={byType['overrun']} icon={<TrendingUp className="h-5 w-5" />} color="red" />
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <EmptyStateWithAction
              size="lg"
              icon={<HardHat className="h-10 w-10 text-emerald-500" />}
              title="لا توجد اختناقات"
              description="كل المشاريع تسير وفق الخطة."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map(item => {
                const meta: Record<string, { label: string; bg: string; text: string; icon: any }> = {
                  'delayed-phase':  { label: 'مرحلة متأخرة', bg: 'bg-red-50',    text: 'text-red-700',    icon: AlertTriangle },
                  'pending-report': { label: 'تقرير معلق',   bg: 'bg-amber-50',  text: 'text-amber-700',  icon: ListChecks },
                  'pending-claim':  { label: 'مطالبة',        bg: 'bg-orange-50', text: 'text-orange-700', icon: Banknote },
                  'overrun':        { label: 'تجاوز',         bg: 'bg-red-50',    text: 'text-red-700',    icon: TrendingUp },
                };
                const m = meta[item.type];
                const Icon = m.icon;
                return (
                  <div key={item.id} className="p-4 flex items-center gap-3 hover:bg-gray-50/50">
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', m.bg)}>
                      <Icon className={cn('h-4 w-4', m.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', m.bg, m.text)}>{m.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.project}{item.subtitle ? ` · ${item.subtitle}` : ''}</p>
                    </div>
                    {item.amount && <span className="text-sm font-bold text-red-600 tabular-nums shrink-0">{formatQARInt(item.amount)}</span>}
                    <Link to={item.link}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
