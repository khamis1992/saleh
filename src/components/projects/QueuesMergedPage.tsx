import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Shield, DollarSign, Wrench, HardHat, ShoppingCart, AlertTriangle, TrendingUp, TrendingDown, RotateCcw, Sparkles, Activity, Clock, CheckCircle2, FileText, Users, Package, ArrowRight, Ban, X } from 'lucide-react';
import { formatQARInt } from '@/lib/format';
import { invoiceStore, maintenanceStore, projectStore, contractorClaimStore, purchaseRequestStore, purchaseOrderStore, inventoryStore } from '@/services/stores';

const fmt = formatQARInt;

function KpiCard({ label, value, icon: Icon, accent, trend }: {
  label: string; value: string | number; icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const a: Record<string, { iconBg: string; iconColor: string; dot: string }> = {
    slate: { iconBg: 'bg-slate-50', iconColor: 'text-slate-600', dot: 'bg-slate-500' },
    rose:  { iconBg: 'bg-rose-50', iconColor: 'text-rose-600', dot: 'bg-rose-500' },
    amber: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600', dot: 'bg-amber-500' },
    blue:  { iconBg: 'bg-blue-50', iconColor: 'text-blue-600', dot: 'bg-blue-500' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', dot: 'bg-emerald-500' },
  }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600', dot: 'bg-slate-500' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
        {trend && <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{trend.dir === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(trend.val)}%</div>}
      </div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function StatCard({ label, value, accent, subtitle, onClick }: {
  label: string; value: number; accent: string; subtitle?: string; onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    rose: 'bg-rose-50 border-rose-200 text-rose-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    slate: 'bg-gray-50 border-gray-200 text-gray-600',
  };
  const c = colors[accent] || colors.slate;
  return (
    <div className={`rounded-xl border ${c} p-4 cursor-pointer hover:opacity-80 transition-opacity`} onClick={onClick}>
      <div className="text-[11px] font-bold mb-1.5">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-[10px] mt-1 opacity-70">{subtitle}</div>}
    </div>
  );
}

export default function QueuesMergedPage() {
  const { dir } = useLocale();
  const navigate = useNavigate();
  const [refresh] = useState(0);

  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const maintenance = useMemo(() => maintenanceStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);
  const claims = useMemo(() => contractorClaimStore.getAll(), [refresh]);
  const prs = useMemo(() => purchaseRequestStore.getAll(), [refresh]);
  const pos = useMemo(() => purchaseOrderStore.getAll(), [refresh]);
  const items = useMemo(() => inventoryStore.getAll(), [refresh]);

  const today = new Date().toISOString().split('T')[0];

  const pendingApprovals = [
    ...claims.filter(c => c.status === 'submitted').map(c => ({ id: c.id, type: 'مطالبة مقاول', title: `مطالبة ${c.id?.slice(0, 8)}`, link: '/construction/claims', amount: (c as any).claimed_amount || 0 })),
    ...prs.filter(p => p.status === 'pending').map(p => ({ id: p.id, type: 'طلب شراء', title: (p as any).title || p.id?.slice(0, 8), link: '/procurement/requests', amount: (p as any).estimated_total || 0 })),
  ];
  const overdueInvoices = invoices.filter(i => i.status === 'overdue' || (i.balance > 0 && i.status !== 'paid' && i.due_date < today));
  const dueToday = invoices.filter(i => i.balance > 0 && i.status !== 'paid' && i.due_date === today);
  const upcoming = invoices.filter(i => { if (i.status === 'paid') return false; const due = new Date(i.due_date); const d = new Date(); d.setDate(d.getDate() + 7); return due > new Date(today) && due <= d; });
  const newRequests = maintenance.filter(m => m.status === 'submitted' || m.status === 'under_review');
  const emergency = maintenance.filter(m => m.priority === 'emergency' && !['completed', 'closed', 'cancelled'].includes(m.status));
  const inProgress = maintenance.filter(m => m.status === 'in_progress' || m.status === 'assigned');
  const delayedPhases = projects.filter(p => (p.status === 'construction' || p.status === 'testing') && (p as any).planned_end_date && (p as any).planned_end_date < today);
  const budgetOverruns = projects.filter(p => p.actual_cost > p.approved_budget);
  const pendingPRs = prs.filter(p => p.status === 'pending' || p.status === 'draft');
  const openPOs = pos.filter(p => p.status === 'approved' || p.status === 'in_progress');
  const lowStock = items.filter((i: any) => (i.current_stock || 0) <= (i.min_stock || 5));

  const totalQueued = pendingApprovals.length + overdueInvoices.length + emergency.length + delayedPhases.length + pendingPRs.length;

  const tabs = [
    { id: 'approvals', label: 'اعتمادات', icon: Shield, count: pendingApprovals.length },
    { id: 'collection', label: 'تحصيل', icon: DollarSign, count: overdueInvoices.length },
    { id: 'maintenance', label: 'صيانة', icon: Wrench, count: emergency.length },
    { id: 'construction', label: 'إنشاءات', icon: HardHat, count: delayedPhases.length },
    { id: 'procurement', label: 'مشتريات', icon: ShoppingCart, count: pendingPRs.length },
  ];

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm"><Activity className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">قوائم الانتظار</span><span className="text-[13px] font-bold text-gray-900">{totalQueued} مهمة</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="me-auto" />
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="بانتظار الاعتماد" value={pendingApprovals.length} icon={Shield} accent="amber" />
          <KpiCard label="فواتير متأخرة" value={overdueInvoices.length} icon={DollarSign} trend={{ val: overdueInvoices.length > 0 ? 100 : 0, dir: overdueInvoices.length > 0 ? 'down' : 'up' }} accent="rose" />
          <KpiCard label="طلبات صيانة عاجلة" value={emergency.length} icon={Wrench} accent="rose" />
          <KpiCard label="مراحل مشاريع متأخرة" value={delayedPhases.length} icon={HardHat} accent="amber" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <Tabs defaultValue="approvals" className="w-full" dir={dir}>
            <div className="border-b border-gray-100 px-4 pt-3 overflow-x-auto">
              <TabsList className="h-9 bg-transparent gap-0 p-0 flex-nowrap">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id}
                    className="h-9 text-xs font-bold data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 rounded-lg px-3 whitespace-nowrap gap-1.5 data-[state=active]:shadow-none">
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {tab.count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${tab.id === 'collection' || tab.id === 'construction' ? 'bg-rose-500' : 'bg-amber-500'}`}>{tab.count}</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="approvals">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-16 text-sm text-gray-400">لا توجد اعتمادات معلقة</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                      <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">النوع</th>
                      <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">العنوان</th>
                      <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المبلغ</th>
                      <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[140px]"></th>
                    </tr></thead>
                    <tbody>{pendingApprovals.map((a, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-100">{a.type}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-900">{a.title}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700 ltr-only tabular-nums">{fmt(a.amount)}</td>
                        <td className="px-4 py-3"><div className="flex gap-1"><Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white">اعتماد</Button><Button size="sm" variant="outline" className="h-7 text-xs border-gray-200 text-rose-600 hover:bg-rose-50"><Ban className="h-3 w-3 ml-1" />رفض</Button></div></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="collection">
              <div className="p-4 space-y-4">
                {dueToday.length > 0 && (
                  <div><h3 className="text-sm font-bold text-rose-600 mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> مستحق اليوم</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {dueToday.map(inv => (
                        <div key={inv.id} className="rounded-xl border border-rose-200 bg-rose-50 p-3 cursor-pointer hover:bg-rose-100 transition-colors" onClick={() => navigate('/collections')}>
                          <div className="text-xs font-bold text-rose-600">{fmt(inv.balance || inv.total)}</div>
                          <div className="text-[10px] text-rose-500 mt-0.5">{inv.invoice_number}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {overdueInvoices.length > 0 && (
                  <div><h3 className="text-sm font-bold text-rose-600 mb-2">متأخر</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {overdueInvoices.slice(0, 6).map(inv => (
                        <div key={inv.id} className="rounded-xl border border-rose-200 bg-rose-50 p-3 cursor-pointer hover:bg-rose-100 transition-colors" onClick={() => navigate('/collections')}>
                          <div className="text-xs font-bold text-rose-600">{fmt(inv.balance || inv.total)}</div>
                          <div className="text-[10px] text-rose-500 mt-0.5">{inv.invoice_number} — {inv.due_date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {dueToday.length === 0 && overdueInvoices.length === 0 && <div className="text-center py-12 text-sm text-gray-400">لا توجد مستحقات</div>}
              </div>
            </TabsContent>

            <TabsContent value="maintenance">
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard label="طارئة" value={emergency.length} accent="rose" subtitle="بحاجة تدخل فوري" onClick={() => navigate('/maintenance/requests')} />
                <StatCard label="جديدة" value={newRequests.length} accent="amber" subtitle="بانتظار المراجعة" onClick={() => navigate('/maintenance/requests')} />
                <StatCard label="قيد التنفيذ" value={inProgress.length} accent="blue" subtitle="تم التكليف" />
              </div>
            </TabsContent>

            <TabsContent value="construction">
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatCard label="مراحل متأخرة" value={delayedPhases.length} accent="rose" subtitle="تجاوزت الجدول الزمني" />
                <StatCard label="تجاوز ميزانية" value={budgetOverruns.length} accent="amber" subtitle="تكلفة أعلى من المعتمد" />
              </div>
            </TabsContent>

            <TabsContent value="procurement">
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard label="طلبات شراء معلقة" value={pendingPRs.length} accent="amber" subtitle="بانتظار الاعتماد" onClick={() => navigate('/procurement/requests')} />
                <StatCard label="أوامر شراء مفتوحة" value={openPOs.length} accent="blue" subtitle="قيد التنفيذ" onClick={() => navigate('/procurement/orders')} />
                <StatCard label="مخزون منخفض" value={lowStock.length} accent="rose" subtitle="أقل من الحد الأدنى" onClick={() => navigate('/inventory/items')} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>{totalQueued} مهمة في قوائم الانتظار</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />محدث في الوقت الفعلي</span>
        </div>
      </div>
    </div>
  );
}