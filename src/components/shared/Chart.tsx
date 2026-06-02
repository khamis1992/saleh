import ReactECharts from 'echarts-for-react';
import { cn } from '@/utils/cn';

interface ChartProps {
  option: any;
  height?: number | string;
  className?: string;
}

/**
 * Thin wrapper around echarts-for-react with safe defaults for land2.
 * Use this in dashboards instead of raw ReactECharts so theming stays consistent.
 */
export function Chart({ option, height = 300, className }: ChartProps) {
  // Merge in land2 defaults
  const merged = {
    textStyle: { fontFamily: "'Cairo', system-ui, sans-serif", fontSize: 12, color: '#475569' },
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'],
    grid: { left: 40, right: 20, top: 30, bottom: 40, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
      ...option.tooltip,
    },
    legend: {
      bottom: 0, textStyle: { fontSize: 11, color: '#64748B' }, icon: 'circle',
      ...option.legend,
    },
    ...option,
  };

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts option={merged} style={{ height, width: '100%' }} notMerge={true} lazyUpdate={true} />
    </div>
  );
}
