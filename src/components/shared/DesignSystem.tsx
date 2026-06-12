import React from 'react';
import { cn } from '@/utils/cn';
import { Search, X } from 'lucide-react';
import type { ModuleName } from '@/hooks/useModuleColor';
import { useModuleColor } from '@/hooks/useModuleColor';

// ============================================================
// STATUS BADGE
// ============================================================

export type StatusVariant = 'active' | 'pending' | 'danger' | 'info' | 'muted';

const statusColorMap: Record<StatusVariant, { dot: string; text: string; bg: string }> = {
  active:  { dot: 'bg-emerald-500',  text: 'text-emerald-700', bg: 'bg-emerald-50' },
  pending: { dot: 'bg-amber-500',    text: 'text-amber-700',   bg: 'bg-amber-50' },
  danger:  { dot: 'bg-red-500',      text: 'text-red-700',     bg: 'bg-red-50' },
  info:    { dot: 'bg-blue-500',     text: 'text-blue-700',    bg: 'bg-blue-50' },
  muted:   { dot: 'bg-gray-400',     text: 'text-gray-600',    bg: 'bg-gray-100' },
};

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
  /** If true, shows a colored dot before the label */
  withDot?: boolean;
}

export function StatusBadge({ label, variant = 'muted', className, withDot = true }: StatusBadgeProps) {
  const c = statusColorMap[variant];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
      c.bg, c.text, className,
    )}>
      {withDot && <span className={cn('h-2 w-2 rounded-full shrink-0', c.dot)} />}
      {label}
    </span>
  );
}

// ============================================================
// KPI CARD
// ============================================================

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label?: string };
  onClick?: () => void;
  moduleOverride?: ModuleName;
}

const moduleColorMap: Record<ModuleName, { iconBg: string; bar: string }> = {
  leasing:      { iconBg: 'bg-indigo-100 text-indigo-600',     bar: 'bg-indigo-500' },
  construction: { iconBg: 'bg-orange-100 text-orange-600',  bar: 'bg-orange-500' },
  procurement:  { iconBg: 'bg-purple-100 text-purple-600',  bar: 'bg-purple-500' },
  maintenance:  { iconBg: 'bg-rose-100 text-rose-600',     bar: 'bg-rose-500' },
  finance:      { iconBg: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-500' },
  hr:           { iconBg: 'bg-amber-100 text-amber-600',    bar: 'bg-amber-500' },
  legal:        { iconBg: 'bg-sky-100 text-sky-600',        bar: 'bg-sky-500' },
  reports:      { iconBg: 'bg-slate-100 text-slate-600',    bar: 'bg-slate-500' },
  settings:     { iconBg: 'bg-gray-100 text-gray-600',      bar: 'bg-gray-500' },
  system:       { iconBg: 'bg-gray-100 text-gray-600',      bar: 'bg-gray-500' },
};

export function KpiCard({ title, value, subtitle, icon: Icon, trend, onClick, moduleOverride }: KpiCardProps) {
  const { module: currentModule } = useModuleColor();
  const mod = moduleOverride || currentModule;
  const colors = moduleColorMap[mod];
  const isUp = trend !== undefined && trend.value >= 0;
  const isDown = trend !== undefined && trend.value < 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-white rounded-xl p-4 shadow-sm border border-gray-100 overflow-hidden',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
      )}
      dir="rtl"
    >
      {/* Left accent bar */}
      <div className={cn('absolute top-0 start-0 w-1 h-full rounded-s-full', colors.bar)} />

      <div className="flex items-start justify-between mb-3">
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', colors.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full',
            isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
          )}>
            {isUp ? <span>↑</span> : <span>↓</span>}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-gray-800 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1 font-medium">{title}</div>
      {subtitle && <div className="text-[11px] text-gray-400 mt-0.5">{subtitle}</div>}
      {trend?.label && <div className="text-[11px] text-gray-400 mt-0.5">{trend.label}</div>}
    </div>
  );
}

// ============================================================
// SECTION CARD — white container for content blocks
// ============================================================

interface SectionCardProps {
  title: string;
  description?: string;
  /** Right-side actions (RTL: left side) */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, description, actions, children, className }: SectionCardProps) {
  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden', className)} dir="rtl">
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)} dir="rtl">
      {Icon && (
        <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ============================================================
// FILTER BAR — search + dropdowns row
// ============================================================

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({ searchPlaceholder = 'بحث...', searchValue, onSearchChange, children, className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 px-4 py-2.5 bg-gray-50/80 rounded-lg border border-gray-100', className)} dir="rtl">
      {onSearchChange && (
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pe-3 ps-9 rounded-md border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// DATA TABLE VIEW — wrapper providing consistent table + empty state
// ============================================================

interface DataTableViewProps {
  columns: { key: string; label: string; className?: string; hidden?: boolean }[];
  data: Record<string, React.ReactNode>[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ElementType;
  emptyAction?: React.ReactNode;
  onRowClick?: (index: number) => void;
  className?: string;
  /** If true, wraps in a SectionCard with the given title */
  sectionTitle?: string;
  sectionDescription?: string;
  sectionActions?: React.ReactNode;
}

export function DataTableView({
  columns,
  data,
  emptyTitle = 'لا توجد بيانات',
  emptyDescription = 'لم يتم إضافة أي عناصر بعد',
  emptyIcon,
  emptyAction,
  onRowClick,
  className,
  sectionTitle,
  sectionDescription,
  sectionActions,
}: DataTableViewProps) {
  const visibleColumns = columns.filter(c => !c.hidden);
  const isEmpty = data.length === 0;

  const tableContent = (
    <div className={cn('overflow-x-auto', className)} dir="rtl">
      {isEmpty ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              {visibleColumns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider',
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(idx)}
                className={cn(
                  'border-b border-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-blue-50/40',
                )}
              >
                {visibleColumns.map(col => (
                  <td key={col.key} className={cn('px-4 py-3 text-sm text-gray-700', col.className)}>
                    {row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // If a section title is provided, wrap in SectionCard
  if (sectionTitle) {
    return (
      <SectionCard title={sectionTitle} description={sectionDescription} actions={sectionActions}>
        {tableContent}
      </SectionCard>
    );
  }

  return tableContent;
}
