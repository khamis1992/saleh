import { formatQARInt, formatThousand } from '@/lib/format';
import { ReactNode, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowUp, ArrowDown, TrendingUp, TrendingDown, ChevronLeft, MoreHorizontal,
  AlertTriangle, CheckCircle2, Info, Clock, XCircle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//  DashboardKpiCard — enhanced KPI metric card
//  Reusable across all dashboards. Arabic RTL, light theme.
// ═══════════════════════════════════════════════════════════════

type KpiFormat = 'number' | 'currency' | 'percentage';
type KpiSize = 'default' | 'sm' | 'lg';

function formatKpiValue(value: string | number, format: KpiFormat): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  if (format === 'currency') {
    return formatQARInt(num);
  }
  if (format === 'percentage') return `${num}%`;
  return formatThousand(num);
}

interface DashboardKpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  format?: KpiFormat;
  size?: KpiSize;
  trend?: { value: number; isPositive: boolean; label?: string };
  subtitle?: string;
  color?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
  isLoading?: boolean;
  /** Optional badge shown top-right (e.g. unread count) */
  badge?: string | number;
}

const colorStyles: Record<string, { bg: string; text: string }> = {
  default:  { bg: 'bg-primary/10',     text: 'text-primary' },
  success:  { bg: 'bg-emerald-50',     text: 'text-emerald-600' },
  warning:  { bg: 'bg-amber-50',       text: 'text-amber-600' },
  destructive: { bg: 'bg-red-50',      text: 'text-red-600' },
  info:     { bg: 'bg-sky-50',         text: 'text-sky-600' },
};

const sizeValueStyles: Record<KpiSize, string> = {
  sm: 'text-xl',
  default: 'text-[1.75rem]',
  lg: 'text-[2.25rem]',
};

export function DashboardKpiCard({
  title, value, icon: Icon, format = 'number', size = 'default',
  trend, subtitle, color = 'default', onClick, className, children,
  isLoading = false, badge,
}: DashboardKpiCardProps) {
  const cs = colorStyles[color];

  if (isLoading) {
    return (
      <div className={cn('stat-card animate-pulse relative', className)} dir="rtl">
        <div className="flex items-start justify-between mb-1">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded-lg" />
        </div>
        <div className="h-7 w-24 bg-muted rounded mt-2" />
        <div className="h-4 w-16 bg-muted rounded mt-3" />
      </div>
    );
  }

  return (
    <div
      className={cn('stat-card group flex flex-col relative', onClick && 'cursor-pointer', className)}
      onClick={onClick}
      dir="rtl"
    >
      {/* Badge */}
      {badge !== undefined && (
        <span className="absolute top-2 right-2 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-primary text-white text-[9px] font-semibold px-1 z-10">
          {badge}
        </span>
      )}

      <div className="flex items-start justify-between mb-1">
        <span className="stat-label truncate">{title}</span>
        {Icon && (
          <div className={cn('stat-icon group-hover:scale-110 transition-transform duration-200', cs.bg, cs.text)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div
        className={cn('stat-value ltr-only inline-block', sizeValueStyles[size])}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {formatKpiValue(value, format)}
      </div>

      {trend && (
        <div className={cn(
          'inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium',
          trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
        )}>
          {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{Math.abs(trend.value)}%</span>
          {trend.label && <span className="text-muted-foreground font-normal mr-0.5">{trend.label}</span>}
        </div>
      )}

      {subtitle && !trend && <p className="text-[11px] text-muted-foreground mt-2">{subtitle}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  FinancialSummaryCard — income / expense / profit bar breakdown
//  ═══════════════════════════════════════════════════════════════

interface FinancialMetric {
  label: string;
  value: number;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

interface FinancialSummaryCardProps {
  title: string;
  subtitle?: string;
  metrics: FinancialMetric[];
  total?: { label: string; value: number };
  className?: string;
  isLoading?: boolean;
}

export function FinancialSummaryCard({
  title, subtitle, metrics, total, className, isLoading = false,
}: FinancialSummaryCardProps) {
  const maxValue = useMemo(
    () => Math.max(...metrics.map((m) => Math.abs(m.value)), 1),
    [metrics],
  );

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader className="pb-3">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          {subtitle && <div className="h-4 w-48 bg-muted rounded mt-1 animate-pulse" />}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
                <div className="h-2 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const fmt = (v: number) =>
    formatQARInt(v);

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent dir="rtl">
        <div className="space-y-4">
          {metrics.map((metric, i) => {
            const barColor = metric.color || 'bg-primary';
            const pct = Math.min((Math.abs(metric.value) / maxValue) * 100, 100);
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{metric.label}</span>
                  <span className="ltr-only inline-block font-mono text-sm">{fmt(metric.value)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className={cn('h-2 rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
                </div>
                {metric.trend && (
                  <div className="flex items-center gap-1 text-[11px]">
                    {metric.trend.isPositive ? <ArrowUp className="h-3 w-3 text-emerald-500" /> : <ArrowDown className="h-3 w-3 text-red-500" />}
                    <span className={metric.trend.isPositive ? 'text-emerald-600' : 'text-red-600'}>{Math.abs(metric.trend.value)}%</span>
                    <span className="text-muted-foreground">مقارنة بالفترة السابقة</span>
                  </div>
                )}
              </div>
            );
          })}

          {total && (
            <>
              <div className="border-t border-border pt-3 mt-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{total.label}</span>
                <span className="ltr-only inline-block text-base font-bold" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(total.value)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ChartCard — card wrapper for recharts or custom charts
//  ═══════════════════════════════════════════════════════════════

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  isEmpty?: boolean;
}

function ChartPlaceholderSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="28" width="8" height="16" rx="1" />
      <rect x="16" y="18" width="8" height="26" rx="1" />
      <rect x="28" y="10" width="8" height="34" rx="1" />
      <rect x="40" y="22" width="8" height="22" rx="1" />
    </svg>
  );
}

export function ChartCard({
  title, subtitle, children, className, actions, isLoading = false,
  emptyMessage = 'لا توجد بيانات للعرض', isEmpty = false,
}: ChartCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {subtitle && <CardDescription className="mt-1">{subtitle}</CardDescription>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64 animate-pulse">
            <div className="h-48 w-48 bg-muted rounded-full" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground" dir="rtl">
            <ChartPlaceholderSvg className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ProjectProgressTable — table of project progress with
//  completion bar, budget vs actual, and status badge.
//  ═══════════════════════════════════════════════════════════════

type ProjectStatus = 'on_track' | 'at_risk' | 'delayed' | 'completed';

interface ProjectRow {
  id: string | number;
  name: string;
  completion: number;
  budget: number;
  actualCost: number;
  status: ProjectStatus;
  plannedEndDate?: string;
  category?: string;
}

const statusConfig: Record<ProjectStatus, {
  label: string; variant: 'success' | 'warning' | 'destructive' | 'info'; icon: React.ElementType;
}> = {
  on_track:  { label: 'في المسار', variant: 'success',     icon: CheckCircle2 },
  at_risk:   { label: 'خطر',       variant: 'warning',     icon: AlertTriangle },
  delayed:   { label: 'متأخر',     variant: 'destructive', icon: XCircle },
  completed: { label: 'مكتمل',     variant: 'info',        icon: CheckCircle2 },
};

interface ProjectProgressTableProps {
  projects: ProjectRow[];
  className?: string;
  title?: string;
  subtitle?: string;
  onRowClick?: (project: ProjectRow) => void;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ProjectProgressTable({
  projects, className, title = 'تقدم المشاريع', subtitle, onRowClick,
  maxItems = 8, showViewAll = false, onViewAll, isLoading = false,
  emptyMessage = 'لا توجد مشاريع قيد التنفيذ',
}: ProjectProgressTableProps) {
  const displayRows = maxItems ? projects.slice(0, maxItems) : projects;
  const remaining = projects.length - displayRows.length;

  const fmt = (v: number) =>
    formatQARInt(v);

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {subtitle && <CardDescription className="mt-1">{subtitle}</CardDescription>}
          </div>
          {showViewAll && onViewAll && projects.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              عرض الكل
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (<div key={i} className="h-10 bg-muted rounded" />))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground" dir="rtl">
            <Info className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">المشروع</TableHead>
                  <TableHead className="w-[14%]">نسبة الإنجاز</TableHead>
                  <TableHead className="w-[17%]">الميزانية</TableHead>
                  <TableHead className="w-[17%]">الفعلي</TableHead>
                  <TableHead className="w-[14%]">الحالة</TableHead>
                  <TableHead className="w-[8%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map((project) => {
                  const overBudget = project.actualCost > project.budget;
                  const st = statusConfig[project.status];
                  const StatusIcon = st.icon;
                  return (
                    <TableRow key={project.id} className={cn(onRowClick && 'cursor-pointer')} onClick={() => onRowClick?.(project)}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{project.name}</p>
                          {project.category && <p className="text-xs text-muted-foreground">{project.category}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-1.5 min-w-[50px]">
                            <div
                              className={cn(
                                'h-1.5 rounded-full transition-all duration-300',
                                project.completion >= 80 ? 'bg-emerald-500' : project.completion >= 50 ? 'bg-primary' : project.completion >= 25 ? 'bg-amber-500' : 'bg-red-500',
                              )}
                              style={{ width: `${Math.min(project.completion, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono ltr-only min-w-[2rem] text-right" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{project.completion}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="ltr-only font-mono text-xs">{fmt(project.budget)}</TableCell>
                      <TableCell className={cn('ltr-only font-mono text-xs', overBudget && 'text-red-600 font-medium')}>
                        {fmt(project.actualCost)}
                        {overBudget && <span className="inline-block mr-1 text-red-500">⚠</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {onRowClick && <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {remaining > 0 && (
              <div className="px-6 py-3 text-center border-t">
                <p className="text-xs text-muted-foreground">+{remaining} مشاريع أخرى</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
//  AlertsList — system alerts grouped by severity
//  ═══════════════════════════════════════════════════════════════

type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

interface AlertItem {
  id: string | number;
  title: string;
  description?: string;
  severity: AlertSeverity;
  timestamp?: string;
  icon?: React.ElementType;
  count?: number;
  onClick?: () => void;
}

const severityConfig: Record<AlertSeverity, {
  bg: string; border: string; text: string; dotColor: string; defaultIcon: React.ElementType; label: string;
}> = {
  critical: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    dotColor: 'bg-red-500',    defaultIcon: AlertTriangle, label: 'حرج' },
  warning:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  dotColor: 'bg-amber-500',  defaultIcon: AlertTriangle, label: 'تحذير' },
  info:     { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   dotColor: 'bg-blue-500',   defaultIcon: Info,          label: 'معلومات' },
  success:  { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-800',dotColor: 'bg-emerald-500',defaultIcon: CheckCircle2,  label: 'مكتمل' },
};

interface AlertsListProps {
  alerts: AlertItem[];
  className?: string;
  title?: string;
  subtitle?: string;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
  onAlertClick?: (alert: AlertItem) => void;
}

export function AlertsList({
  alerts, className, title = 'التنبيهات', subtitle, maxItems = 6,
  showViewAll = false, onViewAll, isLoading = false,
  emptyMessage = 'لا توجد تنبيهات حالياً', onAlertClick,
}: AlertsListProps) {
  const displayItems = maxItems ? alerts.slice(0, maxItems) : alerts;
  const remaining = alerts.length - displayItems.length;

  // Group by severity, critical first
  const grouped = useMemo(() => {
    const order: AlertSeverity[] = ['critical', 'warning', 'info', 'success'];
    const map = new Map<AlertSeverity, AlertItem[]>();
    for (const a of displayItems) {
      const list = map.get(a.severity) || [];
      list.push(a);
      map.set(a.severity, list);
    }
    // Sort groups
    return new Map(order.filter((k) => map.has(k)).map((k) => [k, map.get(k)!]));
  }, [displayItems]);

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between" dir="rtl">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            {alerts.length > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-500 text-white text-[10px] font-semibold px-1.5">
                {alerts.length}
              </span>
            )}
          </div>
          {showViewAll && onViewAll && alerts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              عرض الكل
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          )}
        </div>
        {subtitle && <CardDescription className="mt-1">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3" dir="rtl">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (<div key={i} className="h-16 bg-muted rounded-lg" />))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium">{emptyMessage}</p>
            <p className="text-xs mt-1">كل شيء يسير على ما يرام</p>
          </div>
        ) : (
          <>
            {Array.from(grouped.entries()).map(([severity, items]) => {
              const cfg = severityConfig[severity];
              return (
                <div key={severity} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-1">
                    <div className={cn('h-2 w-2 rounded-full', cfg.dotColor)} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {cfg.label} ({items.length})
                    </span>
                  </div>
                  {items.map((alert) => {
                    const Icon = alert.icon || cfg.defaultIcon;
                    return (
                      <div
                        key={alert.id}
                        className={cn('rounded-lg border p-3 transition-colors', cfg.bg, cfg.border, (alert.onClick || onAlertClick) && 'cursor-pointer hover:opacity-80')}
                        onClick={() => { (alert.onClick || onAlertClick)?.(alert); }}
                      >
                        <div className="flex items-start gap-2.5">
                          <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', cfg.text)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn('text-sm font-medium', cfg.text)}>{alert.title}</p>
                              {alert.count !== undefined && alert.count > 1 && (
                                <span className="shrink-0 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-white/60 text-[10px] font-semibold px-1 border">{alert.count}</span>
                              )}
                            </div>
                            {alert.description && <p className={cn('text-xs mt-0.5 opacity-80', cfg.text)}>{alert.description}</p>}
                            {alert.timestamp && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <Clock className="h-3 w-3 opacity-50" />
                                <span className="text-[10px] opacity-60">{alert.timestamp}</span>
                              </div>
                            )}
                          </div>
                          {(alert.onClick || onAlertClick) && <ChevronLeft className={cn('h-4 w-4 shrink-0 mt-0.5 opacity-50', cfg.text)} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {remaining > 0 && <p className="text-center text-xs text-muted-foreground pt-1">+{remaining} تنبيهات إضافية</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
//  QuickActionsGrid — grid of shortcut action buttons
//  Two variants: card (bordered) and minimal (icon-only).
//  ═══════════════════════════════════════════════════════════════

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  description?: string;
  color?: string;
  badge?: string | number;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
  className?: string;
  title?: string;
  subtitle?: string;
  columns?: 3 | 4 | 5 | 6;
  /** 'card' = with Card wrapper and borders, 'minimal' = flat icon grid */
  variant?: 'card' | 'minimal';
}

const colsMap: Record<number, string> = {
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-6',
};

const colorIconMap: Record<string, string> = {
  blue:    'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber:   'bg-amber-50 text-amber-600',
  red:     'bg-red-50 text-red-600',
  purple:  'bg-purple-50 text-purple-600',
  teal:    'bg-teal-50 text-teal-600',
  sky:     'bg-sky-50 text-sky-600',
  default: 'bg-primary/10 text-primary',
};

const BASE_COLORS = ['blue', 'emerald', 'amber', 'red', 'purple', 'teal', 'sky'];

// ProgressBarCard — full project progress card
export function ProgressBarCard({ name, location, manager, completion, budget, actualCost, delay, status, onClick }: { name: string; location?: string; manager?: string; completion: number; budget: number; actualCost: number; delay?: number; status?: string; onClick?: () => void }) {
  const fmt = (v: number) => formatQARInt(v);
  const overBudget = actualCost > budget;
  const statusLabels: Record<string, string> = { on_track: 'ضمن الخطة', delayed: 'متأخر', over_budget: 'تجاوز ميزانية', completed: 'مكتمل' };
  const statusClasses: Record<string, string> = { on_track: 'bg-emerald-50 text-emerald-600 border-emerald-200', delayed: 'bg-amber-50 text-amber-600 border-amber-200', over_budget: 'bg-red-50 text-red-600 border-red-200', completed: 'bg-blue-50 text-blue-600 border-blue-200' };
  return (
    <div onClick={onClick} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer" dir="rtl">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-slate-800 text-sm truncate">{name}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusClasses[status || ''] || ''}`}>{statusLabels[status || ''] || status}</span>
          {delay && <span className="text-[10px] text-red-500 font-medium">+{delay} يوم</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          {location && <span>{location}</span>}{manager && <><span className="text-slate-300">|</span><span>{manager}</span></>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${completion >= 80 ? 'bg-emerald-500' : completion >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${completion}%` }} />
          </div>
          <span className="text-xs font-semibold text-slate-600 w-10 text-left">{completion}%</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs">
          <span className="text-slate-500">الميزانية: <span className="font-semibold text-slate-700">{fmt(budget)}</span></span>
          <span className="text-slate-500">الفعلي: <span className={`font-semibold ${overBudget ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(actualCost)}</span></span>
        </div>
      </div>
    </div>
  );
}

// AlertCard — colored alert grouping card
export function AlertCard({ type, title, count, icon: SIcon, children, onClick }: { type?: string; title: string; count?: number; icon?: any; children?: React.ReactNode; onClick?: () => void }) {
  const colors: Record<string, string> = { critical: 'border-red-200 bg-red-50', warning: 'border-amber-200 bg-amber-50', info: 'border-blue-200 bg-blue-50', success: 'border-emerald-200 bg-emerald-50' };
  const textColors: Record<string, string> = { critical: 'text-red-700', warning: 'text-amber-700', info: 'text-blue-700', success: 'text-emerald-700' };
  return (
    <div onClick={onClick} className={`border rounded-xl p-4 ${colors[type || ''] || 'border-slate-200'} hover:shadow-md transition-all duration-200 cursor-pointer`} dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        {SIcon && <SIcon className={`h-5 w-5 ${textColors[type || ''] || 'text-slate-500'}`} />}
        <h4 className={`font-semibold text-sm ${textColors[type || ''] || 'text-slate-700'}`}>{title}</h4>
        {count !== undefined && count > 0 && <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full shadow-sm">{count}</span>}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function QuickActionsGrid({
  actions, className, title = 'إجراءات سريعة', subtitle, columns = 4, variant = 'card',
}: QuickActionsGridProps) {
  if (variant === 'minimal') {
    return (
      <div className={cn(className)}>
        {title && (
          <div className="mb-3" dir="rtl">
            <h3 className="text-sm font-semibold">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        )}
        <div className={cn('grid gap-2', colsMap[columns] || colsMap[4])}>
          {actions.map((action, i) => {
            const colorKey = action.color || BASE_COLORS[i % BASE_COLORS.length];
            const iconClass = colorIconMap[colorKey] || colorIconMap.default;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-muted/60 transition-colors relative group"
                dir="rtl"
              >
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110', iconClass)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
                {action.badge !== undefined && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-primary text-white text-[9px] font-semibold px-1">{action.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Variant: card
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && <CardDescription className="mt-1">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={cn('grid gap-3', colsMap[columns] || colsMap[4])}>
          {actions.map((action, i) => {
            const colorKey = action.color || BASE_COLORS[i % BASE_COLORS.length];
            const iconClass = colorIconMap[colorKey] || colorIconMap.default;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all relative group"
                dir="rtl"
              >
                {action.badge !== undefined && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-primary text-white text-[9px] font-semibold px-1">{action.badge}</span>
                )}
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-200', iconClass)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-medium">{action.label}</span>
                  {action.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{action.description}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════
// Thin wrappers for DashboardPage.tsx compatibility
// ═══════════════════════════════════════════════

import React from 'react';

export function SectionHeader({ title, subtitle, count, action, icon: _icon, countColor: _cc, actionLabel: _al, actionTo: _at }: { title: string; subtitle?: string; count?: number; action?: React.ReactNode; icon?: any; countColor?: string; actionLabel?: string; actionTo?: string }) {
  return (
    <div className="flex items-center justify-between mb-4" dir="rtl">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {count !== undefined && <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{count}</span>}
        {action}
      </div>
    </div>
  );
}

export function AlertRow({ label, value, sublabel, onClick }: { label: string; value?: string; sublabel?: string; onClick?: () => void }) {
  return (
    <div className="flex items-center justify-between py-1.5" dir="rtl">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="text-right" onClick={onClick} style={{cursor: onClick?'pointer':undefined}}>{value && <span className="text-sm font-semibold">{value}</span>}{sublabel && <span className="text-xs text-slate-400 mr-2">{sublabel}</span>}</div>
    </div>
  );
}

export function QuickActionCard({ icon: Icon, label, description, onClick, color }: { icon: any; label: string; description?: string; onClick?: () => void; color?: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-200 transition-all duration-200 text-right w-full group" dir="rtl">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${color || 'bg-blue-50 text-blue-600'}`}>
        <Icon className="h-5 w-5"/>
      </div>
      <div>
        <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{label}</div>
        {description && <div className="text-xs text-slate-400 mt-0.5">{description}</div>}
      </div>
    </button>
  );
}

export function EmptyState({ icon: SIcon, title, description, message }: { icon?: any; title?: string; description?: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" dir="rtl">
      {SIcon && <SIcon className="h-12 w-12 text-slate-300 mb-4"/>}
      <h4 className="text-base font-medium text-slate-500">{title}</h4>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
    </div>
  );
}

export function SummaryStat({ label, value, trend, format, icon: _icon, onClick: _onClick, children }: { label: string; value?: number; trend?: number; format?: 'currency'|'number'|'percentage'; icon?: any; onClick?: () => void; children?: React.ReactNode }) {
  const f = (v:number) => { if(format==='currency') return formatQARInt(v); if(format==='percentage') return v+'%'; return formatThousand(v); };
  if (value === undefined || value === null) return (<div className="flex flex-col" dir="rtl" onClick={_onClick} style={{cursor:_onClick?'pointer':undefined}}><span className="text-xs text-slate-500">{label}</span>{children}</div>);
  return (<div className="flex flex-col" dir="rtl" onClick={_onClick} style={{cursor:_onClick?'pointer':undefined}}><span className="text-xs text-slate-500">{label}</span><span className="text-lg font-bold text-slate-800">{f(value)}</span>{trend!==undefined&&<span className={`text-xs font-medium ${trend>=0?'text-emerald-600':'text-red-500'}`}>{trend>=0?'↑':'↓'} {Math.abs(trend)}%</span>}</div>);
}

export function DashboardKpiGrid({ children, columns }: { children: React.ReactNode; columns?: number }) {
  const c = columns || 4;
  return <div className={`grid ${c===3?'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3':'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} gap-4 stagger`}>{children}</div>;
}

export function FinanceSummaryBar({ revenue, expenses, netProfit, cash, profitMargin }: { revenue:number; expenses:number; netProfit:number; cash:number; profitMargin:number }) {
  const f = (v:number) => formatQARInt(v);
  const items = [{l:'الإيرادات',v:revenue,c:'text-emerald-600'},{l:'المصروفات',v:expenses,c:'text-red-500'},{l:'صافي الربح',v:netProfit,c:'text-blue-600'},{l:'النقدية',v:cash,c:'text-slate-700'}];
  return (<div className="grid grid-cols-2 gap-3" dir="rtl">{items.map(i=><div key={i.l} className="flex flex-col p-3 bg-slate-50 rounded-xl"><span className="text-xs text-slate-500">{i.l}</span><span className={`text-base font-bold ${i.c}`}>{f(i.v)}</span></div>)}<div className="col-span-2 flex items-center justify-between p-3 bg-blue-50 rounded-xl"><span className="text-xs font-medium text-blue-700">هامش الربح</span><span className="text-lg font-bold text-blue-700">{profitMargin}%</span></div></div>);
}

export function MetricCard({ title, value, icon: Icon, variant, trend, format }: { title:string; value:number; icon:any; variant?:string; trend?:number; format?:'currency'|'number'|'percentage' }) {
  const f = (v:number) => { if(format==='currency') return formatQARInt(v); if(format==='percentage') return v+'%'; return formatThousand(v); };
  const colors: Record<string,string> = { success:'bg-emerald-50 text-emerald-600', warning:'bg-amber-50 text-amber-600', destructive:'bg-red-50 text-red-600', info:'bg-blue-50 text-blue-600' };
  return (<div className="stat-card"><div className="flex items-start justify-between mb-1"><span className="stat-label">{title}</span><div className={`h-9 w-9 rounded-lg flex items-center justify-center ${variant?colors[variant]:'bg-blue-50 text-blue-600'}`}><Icon className="h-4 w-4"/></div></div><div className="stat-value">{f(value)}</div>{trend!==undefined&&<div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium ${trend>=0?'bg-emerald-50 text-emerald-600':'bg-red-50 text-red-500'}`}>{trend>=0?'↑':'↓'} {Math.abs(trend)}%</div>}</div>);
}