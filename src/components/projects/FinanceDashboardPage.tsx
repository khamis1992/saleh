import { formatQAR } from '@/lib/format';
import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import ReactECharts from 'echarts-for-react';
import { DollarSign, CreditCard, FileText, AlertTriangle, FileEdit, CheckCircle, Wallet, HardHat, Banknote, Receipt, Ban, CalendarClock } from 'lucide-react';
import { invoiceStore, receiptStore, chequeStore, rentScheduleStore, projectStore, contractorStore, journalEntryStore } from '@/services/stores';

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string; }) {
  const a: Record<string, { iconBg: string; iconColor: string }> = { emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, blue:{ iconBg: 'bg-blue-50', iconColor: 'text-blue-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' }, rose:{ iconBg: 'bg-rose-50', iconColor: 'text-rose-600' }, violet:{ iconBg: 'bg-violet-50', iconColor: 'text-violet-600' } }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className="flex items-center gap-3 mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      </div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

export default function FinanceDashboardPage() {
  const { dir } = useLocale();
  const [refresh] = useState(0);

  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const receipts = useMemo(() => receiptStore.getAll(), [refresh]);
  const cheques = useMemo(() => chequeStore.getAll(), [refresh]);
  const schedules = useMemo(() => rentScheduleStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);
  const contractors = useMemo(() => contractorStore.getAll(), [refresh]);
  const journalEntries = useMemo(() => journalEntryStore.getAll(), [refresh]);

  const totalReceivables = invoices.filter((i: any) => i.balance > 0).reduce((sum: number, i: any) => sum + i.balance, 0);
  const totalCollected = receipts.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
  const openInvoices = invoices.filter((i: any) => ['issued', 'partially_paid', 'draft'].includes(i.status)).length;
  const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue' || (i.balance > 0 && new Date(i.due_date) < new Date())).length;
  const draftJournalEntries = journalEntries.filter((je: any) => je.status === 'draft').length;
  const postedJournalEntries = journalEntries.filter((je: any) => je.status === 'posted').length;
  const totalExpenses = 320000;
  const cashBalance = totalCollected - totalExpenses;
  const totalActualCost = projects.reduce((sum: number, p: any) => sum + (p.actual_cost || 0), 0);
  const contractorPayables = Math.round(totalActualCost * 0.25);
  const bouncedCheques = cheques.filter((c: any) => c.status === 'bounced').length;
  const clearedCheques = cheques.filter((c: any) => c.status === 'cleared').length;
  const overdueSchedules = schedules.filter((s: any) => s.status === 'overdue').length;

  const avgMonthlyCollection = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    for (const r of receipts) {
      if (!r.payment_date) continue;
      const monthKey = r.payment_date.substring(0, 7);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + (r.amount || 0));
    }
    const monthCount = monthlyMap.size;
    if (monthCount === 0) return 0;
    let total = 0;
    for (const v of monthlyMap.values()) total += v;
    return Math.round(total / monthCount);
  }, [receipts]);

  const fmt = (v: number) => formatQAR(v);

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm"><DollarSign className="h-5 w-5 text-white" /></div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-base font-bold text-gray-900">لوحة المعلومات المالية</h1>
            <p className="text-xs text-gray-500">نظرة عامة على الوضع المالي للشركة</p>
          </div>
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي المستحقات" value={fmt(totalReceivables)} icon={DollarSign} accent="amber" />
          <KpiCard label="إجمالي المحصل" value={fmt(totalCollected)} icon={CreditCard} accent="emerald" />
          <KpiCard label="الرصيد النقدي" value={fmt(cashBalance)} icon={Wallet} accent="blue" />
          <KpiCard label="مستحقات المقاولين" value={fmt(contractorPayables)} icon={HardHat} accent="slate" />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="الفواتير المفتوحة" value={openInvoices} icon={FileText} accent="violet" />
          <KpiCard label="الفواتير المتأخرة" value={overdueInvoices} icon={AlertTriangle} accent="rose" />
          <KpiCard label="قيود اليومية (مسودة)" value={draftJournalEntries} icon={FileEdit} accent="amber" />
          <KpiCard label="قيود اليومية (مرحلة)" value={postedJournalEntries} icon={CheckCircle} accent="emerald" />
        </div>

        {/* Alert / summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Ban className="h-4 w-4 text-amber-600" /></div>
            <div><div className="text-lg font-bold text-gray-900 ltr-only tabular-nums">{bouncedCheques}</div><div className="text-[11px] text-gray-500 font-medium">شيكات مرتجعة</div></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0"><CalendarClock className="h-4 w-4 text-rose-600" /></div>
            <div><div className="text-lg font-bold text-gray-900 ltr-only tabular-nums">{overdueSchedules}</div><div className="text-[11px] text-gray-500 font-medium">جداول دفع متأخرة</div></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Receipt className="h-4 w-4 text-emerald-600" /></div>
            <div><div className="text-lg font-bold text-gray-900 ltr-only tabular-nums">{clearedCheques}</div><div className="text-[11px] text-gray-500 font-medium">شيكات مصرفة</div></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Banknote className="h-4 w-4 text-blue-600" /></div>
            <div><div className="text-lg font-bold text-gray-900 ltr-only tabular-nums">{fmt(avgMonthlyCollection)}</div><div className="text-[11px] text-gray-500 font-medium">متوسط التحصيل الشهري</div></div>
          </div>
        </div>

        {/* Monthly Cash Flow Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><DollarSign className="h-4 w-4 text-emerald-600" /></div>
            <div><h3 className="text-sm font-bold text-gray-900">التدفقات النقدية الشهرية</h3><p className="text-[11px] text-gray-400">التحصيلات مقابل المدفوعات</p></div>
          </div>
          <ReactECharts
            option={{
              tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e5e7eb', borderRadius: 8, borderWidth: 1, textStyle: { fontFamily: 'Cairo', fontSize: 12, color: '#374151' } },
              legend: { data: ['التحصيلات', 'المدفوعات', 'الصافي'], textStyle: { fontFamily: 'Cairo', fontSize: 11, color: '#6b7280' }, icon: 'roundRect', itemWidth: 14, itemHeight: 8 },
              grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
              xAxis: { type: 'category', data: ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'], axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#9ca3af', fontSize: 11, fontFamily: 'Cairo' } },
              yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { formatter: (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v), color: '#9ca3af', fontSize: 11 } },
              series: [
                { name: 'التحصيلات', type: 'bar', barWidth: '22%', data: [120000, 95000, 140000, 110000, 130000, 160000, 150000, 170000, 145000, 155000, 180000, 200000], itemStyle: { color: '#10B981', borderRadius: [4,4,0,0] } },
                { name: 'المدفوعات', type: 'bar', barWidth: '22%', data: [80000, 75000, 90000, 85000, 95000, 100000, 110000, 120000, 105000, 115000, 125000, 130000], itemStyle: { color: '#F87171', borderRadius: [4,4,0,0] } },
                { name: 'الصافي', type: 'line', data: [40000, 20000, 50000, 25000, 35000, 60000, 40000, 50000, 40000, 40000, 55000, 70000], lineStyle: { color: '#3B82F6', width: 2.5 }, itemStyle: { color: '#3B82F6' }, smooth: true, symbol: 'circle', symbolSize: 6 },
              ],
            }}
            style={{ height: '320px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
          <span>آخر تحديث: الآن</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />بيانات مباشرة</span>
        </div>
      </div>
    </div>
  );
}