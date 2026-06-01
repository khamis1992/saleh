import { formatQAR } from '@/lib/format';
import { cn } from '@/utils/cn';
import { Check, Clock, X } from 'lucide-react';

interface ApprovalStep {
  label: string;
  status: 'pending' | 'approved' | 'rejected' | 'current';
}

interface ApprovalStepperProps {
  steps: ApprovalStep[];
  className?: string;
}

export function ApprovalStepper({ steps, className }: ApprovalStepperProps) {
  return (
    <div className={cn('flex items-center gap-1', className)} dir="rtl">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              step.status === 'approved' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              step.status === 'rejected' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              step.status === 'current' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              step.status === 'pending' && 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
            )}
          >
            {step.status === 'approved' && <Check className="h-3 w-3" />}
            {step.status === 'rejected' && <X className="h-3 w-3" />}
            {step.status === 'current' && <Clock className="h-3 w-3" />}
            {step.status === 'pending' && <span className="h-3 w-3 rounded-full border border-current" />}
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-6',
                step.status === 'approved' ? 'bg-green-400' : 'bg-gray-200',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Claim calculation box
interface ClaimCalculationBoxProps {
  claimedAmount: number;
  retention: number;
  advanceDeduction: number;
  penalties: number;
  netPayable: number;
  className?: string;
}

export function ClaimCalculationBox({ claimedAmount, retention, advanceDeduction, penalties, netPayable, className }: ClaimCalculationBoxProps) {
  const fmt = (v: number) => formatQAR(v);
  return (
    <div className={cn('bg-muted rounded-lg p-4 space-y-2', className)} dir="rtl">
      <h4 className="font-semibold text-sm mb-2">ملخص الحساب</h4>
      <div className="flex justify-between text-sm">
        <span>المبلغ المطالب به</span>
        <span className="font-mono">{fmt(claimedAmount)}</span>
      </div>
      <div className="flex justify-between text-sm text-red-600">
        <span>خصم التأمين</span>
        <span className="font-mono">- {fmt(retention)}</span>
      </div>
      <div className="flex justify-between text-sm text-red-600">
        <span>خصم الدفعة المقدمة</span>
        <span className="font-mono">- {fmt(advanceDeduction)}</span>
      </div>
      {penalties > 0 && (
        <div className="flex justify-between text-sm text-red-600">
          <span>الغرامات</span>
          <span className="font-mono">- {fmt(penalties)}</span>
        </div>
      )}
      <div className="border-t pt-2 flex justify-between text-sm font-bold">
        <span>صافي المستحق</span>
        <span className="font-mono text-green-600">{fmt(netPayable)}</span>
      </div>
    </div>
  );
}

// Line Items Table (for PR, PO, Quotation items)
export interface LineItem {
  id?: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface LineItemsTableProps {
  items: LineItem[];
  showItemName?: boolean;
  editable?: boolean;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  onChange?: (index: number, field: string, value: unknown) => void;
  className?: string;
}

export function LineItemsTable({ items, className }: LineItemsTableProps) {
  const fmt = (v: number) => formatQAR(v);
  const total = items.reduce((s, i) => s + i.total, 0);

  return (
    <div className={cn('space-y-2', className)} dir="rtl">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-right p-2">الصنف</th>
              <th className="text-right p-2">الوصف</th>
              <th className="text-center p-2 w-20">الكمية</th>
              <th className="text-center p-2 w-20">الوحدة</th>
              <th className="text-right p-2 w-28">سعر الوحدة</th>
              <th className="text-right p-2 w-28">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{item.itemName}</td>
                <td className="p-2 text-muted-foreground">{item.description}</td>
                <td className="p-2 text-center">{item.quantity}</td>
                <td className="p-2 text-center">{item.unit}</td>
                <td className="p-2 text-right font-mono">{fmt(item.unitPrice)}</td>
                <td className="p-2 text-right font-mono">{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/50">
            <tr>
              <td colSpan={5} className="p-2 text-right font-semibold">الإجمالي</td>
              <td className="p-2 text-right font-bold font-mono">{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// Budget Variance Badge
interface BudgetVarianceBadgeProps {
  variance: number;
  percentage: number;
  className?: string;
}

export function BudgetVarianceBadge({ variance, percentage, className }: BudgetVarianceBadgeProps) {
  const fmt = (v: number) => formatQAR(Math.abs(v));
  const overBudget = variance < 0;
  
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <span
        className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium',
          overBudget ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        )}
      >
        {overBudget ? 'تجاوز' : 'توفير'} {percentage.toFixed(1)}%
      </span>
      <span className="text-xs text-muted-foreground font-mono">
        {overBudget ? '-' : '+'}{fmt(variance)}
      </span>
    </div>
  );
}

// Stock Level Badge
interface StockLevelBadgeProps {
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  className?: string;
}

export function StockLevelBadge({ currentStock, minimumStock, reorderLevel, className }: StockLevelBadgeProps) {
  const isLow = currentStock <= minimumStock;
  const isReorder = currentStock <= reorderLevel && currentStock > minimumStock;
  
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium',
        isLow ? 'bg-red-100 text-red-700' : isReorder ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700',
        className
      )}
    >
      {isLow ? 'منخفض' : isReorder ? 'إعادة طلب' : 'متوفر'} ({currentStock})
    </span>
  );
}

// Project Cost Summary Card
interface ProjectCostSummaryProps {
  approvedBudget: number;
  contractorClaims: number;
  materialsIssued: number;
  otherCosts: number;
  totalActualCost: number;
  remainingBudget: number;
  variance: number;
  className?: string;
}

export function ProjectCostSummaryCard({ approvedBudget, contractorClaims, materialsIssued, otherCosts, totalActualCost, remainingBudget, variance, className }: ProjectCostSummaryProps) {
  const fmt = (v: number) => formatQAR(v);
  const overBudget = variance < 0;

  return (
    <div className={cn('space-y-3', className)} dir="rtl">
      <h4 className="font-semibold">ملخص تكاليف المشروع</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between bg-muted p-2 rounded">
          <span>الميزانية المعتمدة</span>
          <span className="font-mono">{fmt(approvedBudget)}</span>
        </div>
        <div className="flex justify-between bg-muted p-2 rounded">
          <span>مطالبات المقاولين</span>
          <span className="font-mono">{fmt(contractorClaims)}</span>
        </div>
        <div className="flex justify-between bg-muted p-2 rounded">
          <span>مواد مصروفة للمشروع</span>
          <span className="font-mono">{fmt(materialsIssued)}</span>
        </div>
        <div className="flex justify-between bg-muted p-2 rounded">
          <span>تكاليف أخرى</span>
          <span className="font-mono">{fmt(otherCosts)}</span>
        </div>
      </div>
      <div className="border-t pt-2 space-y-1">
        <div className="flex justify-between text-sm font-semibold">
          <span>إجمالي التكلفة الفعلية</span>
          <span className="font-mono">{fmt(totalActualCost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>المتبقي من الميزانية</span>
          <span className={cn('font-mono', overBudget ? 'text-red-600' : 'text-green-600')}>{fmt(Math.abs(remainingBudget))}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>الانحراف</span>
          <span className={cn('font-mono font-semibold', overBudget ? 'text-red-600' : 'text-green-600')}>
            {overBudget ? '-' : '+'}{fmt(Math.abs(variance))}
          </span>
        </div>
      </div>
    </div>
  );
}