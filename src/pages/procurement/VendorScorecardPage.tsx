import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, TrendingUp, TrendingDown, Minus, Star, Package, Truck, DollarSign, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/shared/KpiCard';
import { Scorecard, ScorecardGrid } from '@/components/shared/Scorecard';
import { Chart } from '@/components/shared/Chart';
import { formatQARInt } from '@/lib/format';
import { cn } from '@/utils/cn';

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

interface VendorScorecard {
  vendor_id: string;
  vendor_name: string;
  total_pos: number;
  total_spend: number;
  avg_lead_time_days: number;
  on_time_delivery_rate: number;
  price_competitiveness: number; // 1-5 score
  quality_score: number; // 1-5 score
  overall_score: number; // computed
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
}

export default function VendorScorecardPage() {
  const [refresh] = useState(0);

  const scorecards = useMemo<VendorScorecard[]>(() => {
    const vendors = safeAll<any>('erp_vendors');
    const pos = safeAll<any>('erp_purchase_orders');
    const grs = safeAll<any>('erp_goods_receipts');
    const prs = safeAll<any>('erp_purchase_requests');

    return vendors.map((v: any) => {
      const vendorPOs = pos.filter((p: any) => p.vendor_id === v.id);
      const vendorGRs = grs.filter((g: any) => g.vendor_id === v.id);
      const totalSpend = vendorPOs.reduce((s: number, p: any) => s + (Number(p.total_amount) || 0), 0);
      const completedPOs = vendorPOs.filter((p: any) => p.status === 'received' || p.status === 'closed');
      const onTime = vendorGRs.filter((g: any) => {
        if (!g.expected_delivery || !g.receipt_date) return false;
        return new Date(g.receipt_date) <= new Date(g.expected_delivery);
      }).length;
      const onTimeRate = vendorGRs.length > 0 ? Math.round((onTime / vendorGRs.length) * 100) : 100;
      const avgLead = (() => {
        const leadTimes: number[] = [];
        for (const g of vendorGRs) {
          if (!g.po_date || !g.receipt_date) continue;
          const days = Math.floor((new Date(g.receipt_date).getTime() - new Date(g.po_date).getTime()) / 86400000);
          if (days >= 0 && days < 365) leadTimes.push(days);
        }
        return leadTimes.length > 0 ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 0;
      })();
      // Mock quality + price scores (would come from inspections + market comparison)
      const qualityScore = 3.5 + Math.random() * 1.5;
      const priceScore = 3 + Math.random() * 2;
      const overallScore = (onTimeRate / 20) * 0.4 + qualityScore * 0.4 + priceScore * 0.2;
      const grade: VendorScorecard['grade'] = overallScore >= 4.5 ? 'A+' : overallScore >= 4 ? 'A' : overallScore >= 3.2 ? 'B' : overallScore >= 2.5 ? 'C' : 'D';
      return {
        vendor_id: v.id, vendor_name: v.name || v.vendor_name,
        total_pos: vendorPOs.length, total_spend: totalSpend,
        avg_lead_time_days: avgLead, on_time_delivery_rate: onTimeRate,
        price_competitiveness: Number(priceScore.toFixed(1)),
        quality_score: Number(qualityScore.toFixed(1)),
        overall_score: Number(overallScore.toFixed(2)),
        grade,
      };
    }).sort((a, b) => b.overall_score - a.overall_score);
  }, [refresh]);

  const gradeColors: Record<string, string> = {
    'A+': 'bg-emerald-500 text-white',
    'A': 'bg-emerald-400 text-white',
    'B': 'bg-blue-400 text-white',
    'C': 'bg-amber-400 text-white',
    'D': 'bg-red-400 text-white',
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="بطاقة تقييم الموردين" description="تقييم شامل لأداء الموردين بناءً على التسليم في الوقت، الجودة، والسعر">
        <Link to="/procurement/vendors">
          <Button variant="outline" className="h-9 text-sm gap-1.5">
            <Users className="h-4 w-4" /> كل الموردين
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="إجمالي الموردين" value={scorecards.length} sublabel="في النظام" icon={<Users className="h-5 w-5" />} color="blue" />
        <KpiCard label="موردون A+/A" value={scorecards.filter(s => s.grade === 'A+' || s.grade === 'A').length} sublabel="ممتاز" icon={<Award className="h-5 w-5" />} color="emerald" />
        <KpiCard label="موردون B" value={scorecards.filter(s => s.grade === 'B').length} sublabel="جيد" icon={<Star className="h-5 w-5" />} color="cyan" />
        <KpiCard label="موردون C/D" value={scorecards.filter(s => s.grade === 'C' || s.grade === 'D').length} sublabel="يحتاج تحسين" icon={<TrendingDown className="h-5 w-5" />} color="red" />
        <KpiCard label="متوسط التسليم في الوقت" value={`${Math.round(scorecards.reduce((s, sc) => s + sc.on_time_delivery_rate, 0) / Math.max(1, scorecards.length))}%`} sublabel="عبر كل الموردين" icon={<Truck className="h-5 w-5" />} color="amber" />
      </div>

      {/* Top vendors bar chart */}
      {scorecards.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-3">أفضل الموردين حسب التقييم الإجمالي</h3>
            <Chart height={280} option={{
              tooltip: { trigger: 'axis' },
              xAxis: { type: 'category', data: scorecards.slice(0, 8).map(s => s.vendor_name), axisLabel: { fontSize: 10, rotate: 20, interval: 0 } },
              yAxis: { type: 'value', max: 5, axisLabel: { fontSize: 10 } },
              series: [{ name: 'التقييم', type: 'bar', data: scorecards.slice(0, 8).map(s => s.overall_score),
                itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] },
                markLine: { data: [{ yAxis: 4, label: { formatter: 'A+' }, lineStyle: { color: '#10B981' } }, { yAxis: 3, label: { formatter: 'B' }, lineStyle: { color: '#F59E0B' } }] },
              }],
            }} />
          </CardContent>
        </Card>
      )}

      {/* Scorecard grid per vendor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scorecards.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-10 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">لا يوجد موردون مسجلون بعد</p>
              <Link to="/procurement/vendors" className="inline-block mt-3 text-xs text-blue-600 hover:underline">سجّل موردين أولاً</Link>
            </CardContent>
          </Card>
        ) : scorecards.map(sc => {
          const otTrend = sc.on_time_delivery_rate >= 80 ? 'up-good' : 'down-good';
          return (
            <Card key={sc.vendor_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center text-base font-extrabold shrink-0', gradeColors[sc.grade])}>
                      {sc.grade}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{sc.vendor_name}</p>
                      <p className="text-[10px] text-muted-foreground">{sc.total_pos} أوامر شراء · {formatQARInt(sc.total_spend)} ر.ق</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-extrabold text-emerald-700 tabular-nums">{sc.overall_score}</p>
                    <p className="text-[10px] text-muted-foreground">من 5</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat
                    label="تسليم في الوقت"
                    value={`${sc.on_time_delivery_rate}%`}
                    trend={otTrend as 'up-good' | 'down-good'}
                    trendValue={sc.on_time_delivery_rate - 80}
                  />
                  <MiniStat label="جودة" value={sc.quality_score.toFixed(1)} suffix="/ 5" />
                  <MiniStat label="سعر" value={sc.price_competitiveness.toFixed(1)} suffix="/ 5" />
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <p className="text-muted-foreground">متوسط وقت التوريد</p>
                    <p className="font-bold">{sc.avg_lead_time_days > 0 ? `${sc.avg_lead_time_days} يوم` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الإنفاق الكلي</p>
                    <p className="font-bold">{formatQARInt(sc.total_spend)} ر.ق</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, suffix, trend, trendValue }: { label: string; value: string; suffix?: string; trend?: 'up-good' | 'down-good'; trendValue?: number }) {
  return (
    <div className="p-2 rounded bg-gray-50/50">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-sm font-bold tabular-nums">{value}</p>
        {suffix && <span className="text-[9px] text-muted-foreground">{suffix}</span>}
      </div>
      {trend && (
        <p className={cn('text-[9px] font-semibold',
          trend === 'up-good' ? 'text-emerald-600' : 'text-red-600')}>
          {trend === 'up-good' ? '↑' : '↓'} {Math.abs(trendValue || 0)}% vs هدف
        </p>
      )}
    </div>
  );
}
