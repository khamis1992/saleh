import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, AlertTriangle, FileText, ChevronLeft, ArrowDownToLine, ArrowUpFromLine, Plus, Truck, Users, Scale, ClipboardList, BarChart3, Box } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { colorClass } from '@/utils/colorClass';
import { formatQARInt } from '@/lib/format';
import { cn } from '@/utils/cn';

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

// Compute on-hand quantity per inventory item from stock transactions
function computeOnHand(itemId: string, transactions: any[]): number {
  let onHand = 0;
  for (const t of transactions) {
    if (t.inventory_item_id !== itemId) continue;
    const qty = Number(t.quantity) || 0;
    if (['purchase_receipt', 'transfer_in', 'return_to_stock', 'adjustment_in'].includes(t.transaction_type)) {
      onHand += qty;
    } else if (['issue_to_project', 'transfer_out', 'consumption', 'adjustment_out', 'damage', 'expired'].includes(t.transaction_type)) {
      onHand -= qty;
    }
  }
  return onHand;
}

const CATEGORY_LABELS: Record<string, string> = {
  cement: 'أسمنت', steel: 'حديد', blocks: 'بلوك', plumbing: 'سباكة',
  electrical: 'كهرباء', finishing: 'تشطيبات', paint: 'دهانات', hvac: 'تكييف',
  wood: 'خشب', safety: 'سلامة', tools: 'عدد', other: 'أخرى',
};

export default function ProcurementCenterPage() {
  const [, setRefresh] = useState(0);
  useEffect(() => { setRefresh(r => r + 1); }, []);

  const stats = useMemo(() => {
    const prs = safeAll<any>('erp_purchase_requests');
    const pos = safeAll<any>('erp_purchase_orders');
    const grs = safeAll<any>('erp_goods_receipts');
    const vendors = safeAll<any>('erp_vendors');
    const warehouses = safeAll<any>('erp_warehouses');
    const items = safeAll<any>('erp_inventory');
    const txns = safeAll<any>('erp_stock_transactions');
    const rfqs = safeAll<any>('erp_rfqs');

    // PR status: draft, pending_approval, approved, rejected, converted_to_po
    const pendingPRs = prs.filter((p: any) => p.status === 'pending_approval' || p.status === 'draft').length;
    const approvedPRs = prs.filter((p: any) => p.status === 'approved').length;
    const openPOs = pos.filter((p: any) => !['received', 'cancelled', 'closed'].includes(p.status)).length;
    const pendingDeliveries = grs.filter((g: any) => g.status === 'pending' || g.status === 'partial').length;
    const lowStock = items.filter((i: any) => {
      const oh = computeOnHand(i.id, txns);
      return oh <= (i.reorder_level || 0);
    }).length;
    const totalValue = items.reduce((s: number, i: any) => {
      const oh = computeOnHand(i.id, txns);
      return s + oh * (i.average_cost || 0);
    }, 0);
    const thisMonthIssued = txns.filter((t: any) => {
      if (!['issue_to_project', 'consumption'].includes(t.transaction_type)) return false;
      const d = new Date(t.transaction_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return {
      pendingPRs, approvedPRs, openPOs, pendingDeliveries, lowStock,
      vendorCount: vendors.length, warehouseCount: warehouses.length, itemCount: items.length,
      totalValue, thisMonthIssued, rfqCount: rfqs.length,
    };
  }, []);

  const lowStockItems = useMemo(() => {
    const items = safeAll<any>('erp_inventory');
    const txns = safeAll<any>('erp_stock_transactions');
    return items
      .map((i: any) => ({ ...i, onHand: computeOnHand(i.id, txns) }))
      .filter((i: any) => i.onHand <= (i.reorder_level || 0))
      .sort((a: any, b: any) => a.onHand - b.onHand)
      .slice(0, 5);
  }, []);

  const recentTxns = useMemo(() => {
    const txns = safeAll<any>('erp_stock_transactions');
    return txns.sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()).slice(0, 6);
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="المشتريات والمخزون" description="إدارة دورة الشراء من طلب الشراء حتى استلام البضائع، والمستودعات، وحركات المخزون">
        <div className="flex items-center gap-2">
          <Link to="/procurement/purchase-requests">
            <Button className="bg-[#3B82F6] hover:bg-blue-600 text-white h-9 text-sm gap-1.5">
              <Plus className="h-4 w-4" /> طلب شراء
            </Button>
          </Link>
          <Link to="/queues/procurement">
            <Button variant="outline" className="h-9 text-sm gap-1.5">
              <ClipboardList className="h-4 w-4" /> قائمة الانتظار
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* KPIs */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">المشتريات</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard label="طلبات شراء معلقة" value={stats.pendingPRs} sublabel="بانتظار موافقة" icon={<FileText className="h-5 w-5" />} color="amber" to="/procurement/purchase-requests" />
          <KpiCard label="أوامر شراء مفتوحة" value={stats.openPOs} sublabel="قيد التنفيذ" icon={<ShoppingCart className="h-5 w-5" />} color="blue" to="/procurement/purchase-orders" />
          <KpiCard label="استلامات معلقة" value={stats.pendingDeliveries} sublabel="بانتظار الوصول" icon={<Truck className="h-5 w-5" />} color="orange" to="/procurement/goods-receipts" />
          <KpiCard label="RFQs مفتوحة" value={stats.rfqCount} sublabel="طلبات عرض أسعار" icon={<Scale className="h-5 w-5" />} color="violet" to="/procurement/quotation-comparison" />
          <KpiCard label="موردون نشطون" value={stats.vendorCount} sublabel="في السجل" icon={<Users className="h-5 w-5" />} color="cyan" to="/procurement/vendors" />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">المخزون</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard label="أصناف منخفضة" value={stats.lowStock} sublabel="تحتاج إعادة طلب" icon={<AlertTriangle className="h-5 w-5" />} color="red" to="/inventory/items" />
          <KpiCard label="إجمالي الأصناف" value={stats.itemCount} sublabel="في السجل" icon={<Box className="h-5 w-5" />} color="blue" to="/inventory/items" />
          <KpiCard label="مستودعات نشطة" value={stats.warehouseCount} sublabel="رئيسي + مشاريع" icon={<Package className="h-5 w-5" />} color="cyan" to="/inventory/warehouses" />
          <KpiCard label="قيمة المخزون" value={formatQARInt(stats.totalValue)} sublabel="ر.ق" icon={<BarChart3 className="h-5 w-5" />} color="emerald" to="/reports/stock-balance" />
          <KpiCard label="صرف هذا الشهر" value={stats.thisMonthIssued} sublabel="حركة لمشاريع" icon={<ArrowUpFromLine className="h-5 w-5" />} color="violet" to="/inventory/transactions" />
        </div>
      </div>

      {/* Quick actions */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-base mb-3">إجراءات سريعة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { title: 'طلب شراء جديد', desc: 'إنشاء PR جديد', to: '/procurement/purchase-requests', icon: FileText, color: 'blue' },
              { title: 'مقارنة عروض', desc: 'مقارنة عروض الموردين', to: '/procurement/quotation-comparison', icon: Scale, color: 'violet' },
              { title: 'استلام بضاعة', desc: 'تسجيل GR', to: '/procurement/goods-receipts', icon: ArrowDownToLine, color: 'emerald' },
              { title: 'حركة مخزون', desc: 'صرف/إضافة مواد', to: '/inventory/transactions', icon: ArrowUpFromLine, color: 'orange' },
            ].map((a, i) => {
              const Icon = a.icon;
              const cc = colorClass(a.color);
              return (
                <Link key={i} to={a.to} className="block group">
                  <div className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all bg-white">
                    <div className={`h-10 w-10 rounded-lg ${cc.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`h-5 w-5 ${cc.text}`} />
                    </div>
                    <p className="font-semibold text-sm group-hover:text-blue-600 transition-colors">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base">أصناف بحاجة لإعادة الطلب</h3>
                  <p className="text-xs text-muted-foreground">المخزون وصل أو تحت حد إعادة الطلب</p>
                </div>
              </div>
              <Link to="/inventory/items">
                <Button variant="outline" size="sm" className="h-8 text-xs">عرض الكل</Button>
              </Link>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">جميع الأصناف فوق حد الأمان</p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((it: any) => {
                  const fill = Math.min(100, Math.round((it.onHand / Math.max(1, it.maximum_stock)) * 100));
                  const cc = colorClass('red');
                  return (
                    <Link key={it.id} to="/inventory/items" className="flex items-center gap-3 p-2.5 rounded-lg border border-red-100 bg-red-50/30 hover:bg-red-50 transition-colors">
                      <div className={`h-8 w-8 rounded-md ${cc.bg} flex items-center justify-center`}>
                        <Box className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{it.name_ar}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{it.item_code} · {CATEGORY_LABELS[it.category] || it.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-700">{it.onHand.toLocaleString('en-US')} <span className="text-[10px] text-muted-foreground font-normal">{it.unit_of_measure}</span></p>
                        <div className="w-20 h-1 rounded-full bg-red-100 mt-0.5">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${fill}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">حد الطلب: {it.reorder_level}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent stock movements */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ArrowUpFromLine className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base">آخر حركات المخزون</h3>
                  <p className="text-xs text-muted-foreground">استلامات وصرفيات حديثة</p>
                </div>
              </div>
              <Link to="/inventory/transactions">
                <Button variant="outline" size="sm" className="h-8 text-xs">عرض الكل</Button>
              </Link>
            </div>
            {recentTxns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد حركات حديثة</p>
            ) : (
              <div className="space-y-2">
                {recentTxns.map((t: any) => {
                  const isIn = ['purchase_receipt', 'transfer_in', 'return_to_stock', 'adjustment_in'].includes(t.transaction_type);
                  const labelMap: Record<string, string> = {
                    purchase_receipt: 'استلام من مورد',
                    issue_to_project: 'صرف لمشروع',
                    transfer_in: 'تحويل وارد',
                    transfer_out: 'تحويل صادر',
                    consumption: 'استهلاك',
                    return_to_stock: 'إرجاع',
                    adjustment_in: 'تسوية بالزيادة',
                    adjustment_out: 'تسوية بالنقص',
                    damage: 'إتلاف',
                    expired: 'انتهاء صلاحية',
                  };
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100">
                      <div className={cn(
                        'h-8 w-8 rounded-md flex items-center justify-center shrink-0',
                        isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600',
                      )}>
                        {isIn ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{labelMap[t.transaction_type] || t.transaction_type}</p>
                        <p className="text-[11px] text-muted-foreground">{t.transaction_number} · {t.transaction_date}</p>
                      </div>
                      <p className={cn('text-sm font-bold tabular-nums', isIn ? 'text-emerald-700' : 'text-orange-700')}>
                        {isIn ? '+' : '-'}{Number(t.quantity).toLocaleString('en-US')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
