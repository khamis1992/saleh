import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Chart } from '@/components/shared/Chart';
import { TrendingUp, TrendingDown, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EVMPanelProps {
  /** Budget at Completion (approved budget) */
  bac: number;
  /** Actual Cost to date */
  ac: number;
  /** Earned Value (budget * completion %) */
  ev: number;
  /** Planned Value (budget * planned %) */
  pv: number;
  /** Completion percent (0-100) */
  completionPct: number;
  className?: string;
}

/**
 * Earned Value Management panel. Computes CPI, SPI, EAC, ETC, VAC
 * and renders a status grid with traffic-light indicators.
 * Reference: ANSI/EIA 748 (EVM Standard), PMBOK 7th ed.
 */
export function EVMPanel({ bac, ac, ev, pv, completionPct, className }: EVMPanelProps) {
  const cpi = ac > 0 ? ev / ac : 1;
  const spi = pv > 0 ? ev / pv : 1;
  const eac = cpi > 0 ? bac / cpi : bac;
  const etc = Math.max(0, eac - ac);
  const vac = bac - eac;

  const cpiStatus = cpi >= 1 ? 'good' : cpi >= 0.9 ? 'warn' : 'bad';
  const spiStatus = spi >= 1 ? 'good' : spi >= 0.9 ? 'warn' : 'bad';

  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">إدارة القيمة المكتسبة (EVM)</h3>
            <p className="text-xs text-muted-foreground">المعيار: ANSI/EIA 748 — مقارنة القيمة المخططة بالفعلية</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">نسبة الإنجاز</p>
            <p className="text-2xl font-extrabold text-blue-700">{completionPct.toFixed(1)}%</p>
          </div>
        </div>

        {/* Status indicators grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatusCell
            label="CPI — أداء التكلفة"
            value={cpi.toFixed(2)}
            status={cpiStatus as 'good' | 'warn' | 'bad'}
            detail={cpi >= 1 ? 'ضمن الميزانية' : cpi >= 0.9 ? 'انحراف بسيط' : 'تجاوز كبير'}
          />
          <StatusCell
            label="SPI — أداء الجدول"
            value={spi.toFixed(2)}
            status={spiStatus as 'good' | 'warn' | 'bad'}
            detail={spi >= 1 ? 'متقدم أو في الموعد' : spi >= 0.9 ? 'تأخير بسيط' : 'متأخر جداً'}
          />
          <StatusCell
            label="EAC — التكلفة المتوقعة"
            value={eac.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            status={cpi >= 1 ? 'good' : cpi >= 0.9 ? 'warn' : 'bad'}
            detail={`من ${bac.toLocaleString('en-US', { maximumFractionDigits: 0 })} معتمدة`}
          />
          <StatusCell
            label="VAC — انحراف الميزانية"
            value={vac.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            status={vac >= 0 ? 'good' : 'bad'}
            detail={vac >= 0 ? 'وفر متوقع' : 'تجاوز متوقع'}
            inverted
          />
        </div>

        {/* S-curve chart: PV, EV, AC over time */}
        <Chart
          height={260}
          option={{
            tooltip: { trigger: 'axis', valueFormatter: (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 }) },
            legend: { data: ['القيمة المخططة (PV)', 'القيمة المكتسبة (EV)', 'التكلفة الفعلية (AC)'], bottom: 0, textStyle: { fontSize: 11 } },
            grid: { left: 60, right: 20, top: 40, bottom: 40, containLabel: true },
            xAxis: { type: 'category', data: Array.from({ length: 11 }, (_, i) => `${i * 10}%`), name: 'نسبة الوقت' },
            yAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}K` } },
            series: [
              { name: 'القيمة المخططة (PV)', type: 'line', smooth: true, data: Array.from({ length: 11 }, (_, i) => (bac * i / 10)), itemStyle: { color: '#94A3B8' }, lineStyle: { type: 'dashed' } },
              { name: 'القيمة المكتسبة (EV)', type: 'line', smooth: true, data: Array.from({ length: 11 }, (_, i) => Math.min(bac, bac * (i / 10) * (completionPct / 50))), itemStyle: { color: '#10B981' } },
              { name: 'التكلفة الفعلية (AC)', type: 'line', smooth: true, data: Array.from({ length: 11 }, (_, i) => Math.min(ac, ac * (i / 10))), itemStyle: { color: '#EF4444' } },
            ],
          }}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 text-xs">
          <SmallStat label="الميزانية المعتمدة (BAC)" value={bac.toLocaleString('en-US')} unit="ر.ق" />
          <SmallStat label="التكلفة الفعلية (AC)" value={ac.toLocaleString('en-US')} unit="ر.ق" />
          <SmallStat label="القيمة المكتسبة (EV)" value={ev.toLocaleString('en-US')} unit="ر.ق" />
          <SmallStat label="المتبقي للإنجاز (ETC)" value={etc.toLocaleString('en-US')} unit="ر.ق" />
          <SmallStat label="القيمة المخططة (PV)" value={pv.toLocaleString('en-US')} unit="ر.ق" />
          <SmallStat label="انحراف الميزانية" value={(bac - ac).toLocaleString('en-US')} unit="ر.ق" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusCell({ label, value, status, detail, inverted }: { label: string; value: string; status: 'good' | 'warn' | 'bad'; detail: string; inverted?: boolean }) {
  const colors = {
    good: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warn: 'bg-amber-50 border-amber-200 text-amber-700',
    bad: 'bg-red-50 border-red-200 text-red-700',
  };
  const Icon = status === 'good' ? Check : status === 'warn' ? AlertTriangle : AlertTriangle;
  // For inverted (higher is worse), good means value >= 0
  return (
    <div className={cn('p-3 rounded-lg border', colors[inverted ? (status === 'good' ? 'good' : 'bad') : status])}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-extrabold tabular-nums leading-tight">{value}</p>
      <p className="text-[10px] mt-0.5 opacity-80">{detail}</p>
    </div>
  );
}

function SmallStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold tabular-nums">{value} <span className="text-[10px] font-normal text-muted-foreground">{unit}</span></p>
    </div>
  );
}
