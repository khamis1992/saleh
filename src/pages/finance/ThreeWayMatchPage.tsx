import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, AlertTriangle, FileText, ShoppingCart, Truck, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/shared/KpiCard';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { formatQARInt } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface ThreeWayMatch {
  po: { id: string; order_number: string; vendor_name: string; total_amount: number; po_date: string };
  gr: { id: string; receipt_number: string; receipt_date: string; total_amount: number; items_received: { inventory_item_id: string; quantity: number; unit_cost: number }[] } | null;
  invoice: { id: string; invoice_number: string; invoice_date: string; total_amount: number; vendor_id: string } | null;
  matched: boolean;
  variance: number;
  status: 'pending-gr' | 'pending-invoice' | 'matched' | 'variance';
}

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

export default function ThreeWayMatchPage() {
  const [refresh, setRefresh] = useState(0);

  const matches = useMemo<ThreeWayMatch[]>(() => {
    const pos = safeAll<any>('erp_purchase_orders');
    const grs = safeAll<any>('erp_goods_receipts');
    const invs = safeAll<any>('erp_invoices');
    return pos.map(po => {
      const gr = grs.find((g: any) => g.po_id === po.id || g.purchase_order_id === po.id) || null;
      // Try to find invoice by PO number or vendor
      const inv = invs.find((i: any) => i.purchase_order_id === po.id || i.po_number === po.order_number) || null;
      const grAmount = gr ? Number(gr.total_amount) || 0 : 0;
      const invAmount = inv ? Number(inv.total_amount) || 0 : 0;
      const reference = grAmount > 0 ? grAmount : Number(po.total_amount) || 0;
      const variance = invAmount > 0 ? invAmount - reference : 0;
      let status: ThreeWayMatch['status'] = 'pending-gr';
      if (gr && inv && Math.abs(variance) < 1) status = 'matched';
      else if (gr && inv && Math.abs(variance) >= 1) status = 'variance';
      else if (gr && !inv) status = 'pending-invoice';
      return {
        po: { id: po.id, order_number: po.order_number || po.id, vendor_name: po.vendor_name || po.vendor_id, total_amount: Number(po.total_amount) || 0, po_date: po.order_date || po.po_date },
        gr, invoice: inv, matched: status === 'matched', variance, status,
      };
    });
  }, [refresh]);

  const stats = useMemo(() => ({
    total: matches.length,
    matched: matches.filter(m => m.status === 'matched').length,
    variance: matches.filter(m => m.status === 'variance').length,
    pendingGR: matches.filter(m => m.status === 'pending-gr').length,
    pendingInvoice: matches.filter(m => m.status === 'pending-invoice').length,
  }), [matches]);

  function approvePayment(po: ThreeWayMatch['po']) {
    toast.success(`تم اعتماد الدفع لـ PO ${po.order_number}`);
  }
  function flagVariance(po: ThreeWayMatch['po']) {
    toast.warning(`تم الإبلاغ عن انحراف في PO ${po.order_number}`);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="مطابقة ثلاثية الأبعاد"
        description="PO + استلام بضاعة + فاتورة مورد. يجب أن تتطابق الثلاثة قبل الاعتماد."
      >
        <Link to="/procurement/purchase-orders">
          <Button variant="outline" className="h-9 text-sm gap-1.5">
            <ShoppingCart className="h-4 w-4" /> أوامر الشراء
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="إجمالي POs" value={stats.total} sublabel="للمطابقة" icon={<ShoppingCart className="h-5 w-5" />} color="blue" />
        <KpiCard label="مطابق" value={stats.matched} sublabel="جاهز للدفع" icon={<Check className="h-5 w-5" />} color="emerald" />
        <KpiCard label="انحراف" value={stats.variance} sublabel="يحتاج مراجعة" icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <KpiCard label="بانتظار استلام" value={stats.pendingGR} sublabel="لم تصل البضاعة" icon={<Truck className="h-5 w-5" />} color="amber" />
        <KpiCard label="بانتظار فاتورة" value={stats.pendingInvoice} sublabel="وصلت بدون فاتورة" icon={<FileText className="h-5 w-5" />} color="orange" />
      </div>

      <Card>
        <CardContent className="p-0">
          {matches.length === 0 ? (
            <EmptyStateWithAction
              size="lg"
              icon={<Sparkles className="h-10 w-10 text-emerald-500" />}
              title="لا توجد أوامر شراء للمطابقة"
              description="أوامر الشراء ستظهر هنا تلقائياً للمطابقة الثلاثية."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {matches.map(m => {
                const statusMap = {
                  'matched': { label: 'مطابق ✓', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
                  'variance': { label: 'انحراف', bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
                  'pending-gr': { label: 'بانتظار استلام', bg: 'bg-amber-100', text: 'text-amber-700', icon: Truck },
                  'pending-invoice': { label: 'بانتظار فاتورة', bg: 'bg-orange-100', text: 'text-orange-700', icon: FileText },
                };
                const st = statusMap[m.status];
                const Icon = st.icon;
                return (
                  <div key={m.po.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className={cn('h-5 w-5', m.matched ? 'text-emerald-600' : m.status === 'variance' ? 'text-red-600' : 'text-amber-600')} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold">PO {m.po.order_number}</p>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', st.bg, st.text)}>{st.label}</span>
                          {m.matched && <Sparkles className="h-3.5 w-3.5 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.po.vendor_name} · {m.po.po_date}</p>
                      </div>
                      {m.status === 'matched' && (
                        <Button size="sm" onClick={() => approvePayment(m.po)} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                          <Check className="h-3.5 w-3.5" /> اعتماد الدفع
                        </Button>
                      )}
                      {m.status === 'variance' && (
                        <Button size="sm" variant="outline" onClick={() => flagVariance(m.po)} className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50">
                          <AlertTriangle className="h-3.5 w-3.5" /> إبلاغ
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className={cn('p-3 rounded-lg border', m.po.total_amount > 0 ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/30')}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">PO</p>
                        </div>
                        <p className="text-base font-bold tabular-nums">{formatQARInt(m.po.total_amount)}</p>
                        <p className="text-[10px] text-muted-foreground">مبلغ أمر الشراء</p>
                      </div>
                      <div className={cn('p-3 rounded-lg border', m.gr ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50/30 border-dashed')}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Truck className={cn('h-3.5 w-3.5', m.gr ? 'text-emerald-600' : 'text-gray-400')} />
                          <p className="text-[10px] font-bold uppercase tracking-wider">استلام</p>
                        </div>
                        <p className="text-base font-bold tabular-nums">{m.gr ? formatQARInt(Number(m.gr.total_amount) || 0) : '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{m.gr ? m.gr.receipt_number : 'لم يصل بعد'}</p>
                      </div>
                      <div className={cn('p-3 rounded-lg border', m.invoice ? 'border-violet-200 bg-violet-50/30' : 'border-gray-200 bg-gray-50/30 border-dashed')}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileText className={cn('h-3.5 w-3.5', m.invoice ? 'text-violet-600' : 'text-gray-400')} />
                          <p className="text-[10px] font-bold uppercase tracking-wider">فاتورة</p>
                        </div>
                        <p className="text-base font-bold tabular-nums">{m.invoice ? formatQARInt(Number(m.invoice.total_amount) || 0) : '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{m.invoice ? m.invoice.invoice_number : 'لم تصل بعد'}</p>
                      </div>
                    </div>
                    {m.variance !== 0 && m.invoice && (
                      <div className={cn('mt-2 p-2 rounded text-xs flex items-center gap-2', m.variance > 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>انحراف: {m.variance > 0 ? '+' : ''}{formatQARInt(m.variance)} ر.ق ({((m.variance / m.po.total_amount) * 100).toFixed(1)}%)</span>
                      </div>
                    )}
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
