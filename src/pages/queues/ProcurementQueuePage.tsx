import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, AlertTriangle, Truck, Scale, ChevronLeft, FileText, ClipboardCheck, Box, ChevronRight, BarChart3, Check } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { KpiCard } from '@/components/shared/KpiCard';
import { colorClass } from '@/utils/colorClass';
import { formatQARInt } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface QueueItem {
  id: string;
  bucket: 'pending-pr' | 'open-po' | 'pending-gr' | 'low-stock' | 'pending-rfq';
  title: string;
  subtitle?: string;
  amount?: number;
  urgency: 'urgent' | 'high' | 'medium' | 'low';
  link: string;
}

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function computeOnHand(itemId: string, transactions: any[]): number {
  let oh = 0;
  for (const t of transactions) {
    if (t.inventory_item_id !== itemId) continue;
    const qty = Number(t.quantity) || 0;
    if (['purchase_receipt', 'transfer_in', 'return_to_stock', 'adjustment_in'].includes(t.transaction_type)) oh += qty;
    else if (['issue_to_project', 'transfer_out', 'consumption', 'adjustment_out', 'damage', 'expired'].includes(t.transaction_type)) oh -= qty;
  }
  return oh;
}

const BUCKET_META: Record<string, { label: string; color: string; bg: string; text: string; icon: any }> = {
  'pending-pr':   { label: 'طلبات شراء',        color: 'amber',  bg: 'bg-amber-50',  text: 'text-amber-700',  icon: FileText },
  'open-po':     { label: 'أوامر شراء',        color: 'blue',   bg: 'bg-blue-50',   text: 'text-blue-700',   icon: ShoppingCart },
  'pending-gr':  { label: 'استلامات',           color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700', icon: Truck },
  'low-stock':   { label: 'مخزون منخفض',       color: 'red',    bg: 'bg-red-50',    text: 'text-red-700',    icon: AlertTriangle },
  'pending-rfq': { label: 'طلبات عروض أسعار',  color: 'violet', bg: 'bg-violet-50', text: 'text-violet-700', icon: Scale },
};

const URGENCY_META: Record<string, { label: string; bg: string; text: string }> = {
  urgent: { label: 'عاجل',  bg: 'bg-red-50',    text: 'text-red-700' },
  high:   { label: 'مهم',   bg: 'bg-amber-50',  text: 'text-amber-700' },
  medium: { label: 'متوسط', bg: 'bg-blue-50',   text: 'text-blue-700' },
  low:    { label: 'منخفض', bg: 'bg-gray-50',   text: 'text-gray-700' },
};

export default function ProcurementQueuePage() {
  const [refresh, setRefresh] = useState(0);
  const [activeBucket, setActiveBucket] = useState<string>('all');

  const items = useMemo<QueueItem[]>(() => {
    const out: QueueItem[] = [];
    const prs = safeAll<any>('erp_purchase_requests');
    const pos = safeAll<any>('erp_purchase_orders');
    const grs = safeAll<any>('erp_goods_receipts');
    const rfqs = safeAll<any>('erp_rfqs');
    const inv = safeAll<any>('erp_inventory');
    const txns = safeAll<any>('erp_stock_transactions');

    // PRs pending approval
    for (const p of prs) {
      if (p.status === 'pending_approval' || p.status === 'draft') {
        out.push({
          id: `pr-${p.id}`, bucket: 'pending-pr',
          title: `طلب شراء: ${p.request_number || p.id}`,
          subtitle: p.description || p.project_name || '',
          amount: p.total_amount, link: '/procurement/purchase-requests',
          urgency: p.priority === 'urgent' ? 'urgent' : p.priority === 'high' ? 'high' : 'medium',
        });
      }
    }
    // Open POs (not yet received)
    for (const po of pos) {
      if (!['received', 'cancelled', 'closed'].includes(po.status)) {
        out.push({
          id: `po-${po.id}`, bucket: 'open-po',
          title: `أمر شراء: ${po.order_number || po.id}`,
          subtitle: `مورد: ${po.vendor_name || '-'} · متوقع: ${po.expected_delivery || '-'}`,
          amount: po.total_amount, link: '/procurement/purchase-orders',
          urgency: po.expected_delivery && new Date(po.expected_delivery) < new Date() ? 'urgent' : 'medium',
        });
      }
    }
    // Pending goods receipts
    for (const g of grs) {
      if (g.status === 'pending' || g.status === 'partial') {
        out.push({
          id: `gr-${g.id}`, bucket: 'pending-gr',
          title: `استلام: ${g.receipt_number || g.id}`,
          subtitle: g.po_number || g.vendor_name || '',
          amount: g.total_amount, link: '/procurement/goods-receipts',
          urgency: g.status === 'partial' ? 'high' : 'medium',
        });
      }
    }
    // RFQs open
    for (const r of rfqs) {
      if (r.status === 'open' || r.status === 'draft') {
        out.push({
          id: `rfq-${r.id}`, bucket: 'pending-rfq',
          title: `RFQ: ${r.rfq_number || r.id}`,
          subtitle: r.description || '',
          link: '/procurement/quotation-comparison',
          urgency: r.due_date && new Date(r.due_date) < new Date() ? 'high' : 'low',
        });
      }
    }
    // Low stock items
    for (const i of inv) {
      const oh = computeOnHand(i.id, txns);
      if (oh <= (i.reorder_level || 0)) {
        const ratio = (i.maximum_stock || 1) > 0 ? oh / i.maximum_stock : 0;
        out.push({
          id: `ls-${i.id}`, bucket: 'low-stock',
          title: `${i.name_ar} (${i.item_code})`,
          subtitle: `المتوفر: ${oh.toLocaleString('en-US')} ${i.unit_of_measure} · حد الطلب: ${i.reorder_level}`,
          amount: oh * (i.average_cost || 0),
          link: '/inventory/items',
          urgency: oh <= (i.minimum_stock || 0) ? 'urgent' : 'high',
        });
      }
    }
    return out;
  }, [refresh]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: items.length };
    for (const i of items) m[i.bucket] = (m[i.bucket] || 0) + 1;
    return m;
  }, [items]);

  const filtered = activeBucket === 'all' ? items : items.filter(i => i.bucket === activeBucket);

  const totals = useMemo(() => ({
    pendingPRs: items.filter(i => i.bucket === 'pending-pr').length,
    openPOs: items.filter(i => i.bucket === 'open-po').length,
    pendingGRs: items.filter(i => i.bucket === 'pending-gr').length,
    lowStock: items.filter(i => i.bucket === 'low-stock').length,
    pendingRFQs: items.filter(i => i.bucket === 'pending-rfq').length,
  }), [items]);

  function approvePR(prId: string) {
    const prs = safeAll<any>('erp_purchase_requests');
    const idx = prs.findIndex((p: any) => p.id === prId);
    if (idx === -1) return;
    prs[idx].status = 'approved';
    prs[idx].approved_at = new Date().toISOString();
    localStorage.setItem('erp_purchase_requests', JSON.stringify(prs));
    toast.success('تم اعتماد طلب الشراء');
    setRefresh(r => r + 1);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="قائمة المشتريات والمخزون"
        description="كل ما يحتاج قرارك أو إجراءك في المشتريات والمخزون"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="طلبات شراء معلقة" value={totals.pendingPRs} icon={<FileText className="h-5 w-5" />} color="amber" />
        <KpiCard label="أوامر شراء مفتوحة" value={totals.openPOs} icon={<ShoppingCart className="h-5 w-5" />} color="blue" />
        <KpiCard label="استلامات معلقة" value={totals.pendingGRs} icon={<Truck className="h-5 w-5" />} color="orange" />
        <KpiCard label="أصناف منخفضة" value={totals.lowStock} sublabel="تحت حد الطلب" icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <KpiCard label="RFQs مفتوحة" value={totals.pendingRFQs} icon={<Scale className="h-5 w-5" />} color="violet" />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveBucket('all')}
          className={cn('shrink-0 h-9 px-3.5 rounded-lg text-xs font-medium',
            activeBucket === 'all' ? 'bg-[#1B2559] text-white' : 'bg-white border border-gray-200 hover:bg-gray-50')}
        >
          الكل ({items.length})
        </button>
        {Object.entries(BUCKET_META).map(([k, m]) => {
          if (!counts[k]) return null;
          const Icon = m.icon;
          return (
            <button
              key={k}
              onClick={() => setActiveBucket(k)}
              className={cn('shrink-0 h-9 px-3.5 rounded-lg text-xs font-medium flex items-center gap-1.5',
                activeBucket === k ? 'bg-[#1B2559] text-white' : `${m.bg} ${m.text} hover:opacity-80`)}
            >
              <Icon className="h-3.5 w-3.5" />
              {m.label} ({counts[k]})
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyStateWithAction
              size="lg"
              icon={<Check className="h-10 w-10 text-emerald-500" />}
              title="لا توجد عناصر معلقة"
              description="كل المشتريات والمخزون في حالة سليمة."
              primaryAction={{ label: 'تحديث', onClick: () => setRefresh(r => r + 1) }}
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(item => {
                const b = BUCKET_META[item.bucket];
                const u = URGENCY_META[item.urgency];
                return (
                  <div key={item.id} className="p-4 flex items-center gap-3 hover:bg-gray-50/50">
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', b.bg)}>
                      <b.icon className={cn('h-4 w-4', b.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{item.title}</p>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', u.bg, u.text)}>{u.label}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700')}>{b.label}</span>
                      </div>
                      {item.subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>}
                    </div>
                    {item.amount !== undefined && (
                      <span className="text-sm font-bold tabular-nums shrink-0">{formatQARInt(item.amount)}</span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      {item.bucket === 'pending-pr' && (
                        <Button size="sm" onClick={() => approvePR(item.id.replace('pr-', ''))} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                          <Check className="h-3 w-3" /> اعتماد
                        </Button>
                      )}
                      <Link to={item.link}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-600 gap-1">
                          فتح <ChevronLeft className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
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
