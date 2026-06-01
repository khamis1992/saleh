import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, FileText, Banknote, ChevronLeft, TrendingUp, Receipt, AlertCircle, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatQARInt } from '@/lib/format';
import { deriveTasksFromData } from '@/services/tasks';

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

export default function FinanceCenterPage() {
  const [, setRefresh] = useState(0);
  useEffect(() => { deriveTasksFromData(); setRefresh(r => r + 1); }, []);

  const stats = useMemo(() => {
    const invoices = safeAll('erp_invoices');
    const receipts = safeAll('erp_receipts');
    const entries = safeAll('erp_journal_entries');
    const accounts = safeAll('erp_accounts');
    const cheques = safeAll('erp_cheques');

    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const isThisMonth = (d: string) => { const x = new Date(d); return x.getMonth() === thisMonth && x.getFullYear() === thisYear; };

    const dueInvoices = invoices.filter((i: any) => i.status !== 'paid' && i.due_date && new Date(i.due_date) <= today);
    const dueAmount = dueInvoices.reduce((s: number, i: any) => s + (i.balance || i.total || 0), 0);

    const monthReceipts = receipts.filter((r: any) => isThisMonth(r.payment_date));
    const monthReceiptsTotal = monthReceipts.reduce((s: number, r: any) => s + (r.amount || 0), 0);

    const draftEntries = entries.filter((e: any) => e.status === 'draft').length;
    const postedEntries = entries.filter((e: any) => e.status === 'posted').length;

    const bouncedCheques = cheques.filter((c: any) => c.status === 'bounced').length;
    const pendingCheques = cheques.filter((c: any) => c.status === 'pending').length;

    return { invoices, receipts, entries, accounts, cheques, dueInvoices: dueInvoices.length, dueAmount, monthReceipts: monthReceipts.length, monthReceiptsTotal, draftEntries, postedEntries, bouncedCheques, pendingCheques };
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="المالية والتحصيل" description="الفواتير، السندات، القيود، والتقارير المالية" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="فواتير مستحقة" value={stats.dueInvoices} sublabel={formatQARInt(stats.dueAmount) + ' ر.ق'} icon={<Receipt className="h-5 w-5" />} color="red" to="/queues/collection" />
        <KpiCard label="سندات هذا الشهر" value={stats.monthReceipts} sublabel={formatQARInt(stats.monthReceiptsTotal) + ' ر.ق'} icon={<Banknote className="h-5 w-5" />} color="green" to="/rent-collection/receipts" />
        <KpiCard label="قيود معلقة" value={stats.draftEntries} sublabel="بانتظار الترحيل" icon={<FileText className="h-5 w-5" />} color="amber" to="/finance/journal-entries" />
        <KpiCard label="شيكات مرتجعة" value={stats.bouncedCheques} sublabel="تحتاج متابعة" icon={<AlertCircle className="h-5 w-5" />} color="red" to="/finance/cheques" />
        <KpiCard label="شيكات معلقة" value={stats.pendingCheques} sublabel="بانتظار التحصيل" icon={<Calculator className="h-5 w-5" />} color="blue" to="/finance/cheques" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-3">الفواتير المستحقة</h3>
            {stats.dueInvoices === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">لا توجد فواتير مستحقة</p>
            ) : (
              <div className="space-y-2">
                {stats.invoices.filter((i: any) => i.status !== 'paid' && i.due_date && new Date(i.due_date) <= new Date()).slice(0, 5).map((i: any) => (
                  <div key={i.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100">
                    <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <Receipt className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{i.invoice_number}</p>
                      <p className="text-[11px] text-muted-foreground">{i.tenant_name || i.tenant_id}</p>
                    </div>
                    <span className="text-sm font-bold text-red-600">{formatQARInt(i.balance || i.total)}</span>
                  </div>
                ))}
              </div>
            )}
            <Link to="/queues/collection">
              <Button variant="outline" size="sm" className="w-full mt-4 h-9 text-xs">قائمة التحصيل</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-3">القيود اليومية</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/40 border border-emerald-100">
                <span className="text-sm font-medium">مرحّلة</span>
                <span className="text-base font-bold text-emerald-700">{stats.postedEntries}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/40 border border-amber-100">
                <span className="text-sm font-medium">مسودة</span>
                <span className="text-base font-bold text-amber-700">{stats.draftEntries}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Link to="/finance/journal-entries" className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-9 text-xs">القيود</Button>
              </Link>
              <Link to="/finance/period-closing" className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1">
                  <ClipboardCheck className="h-3.5 w-3.5" /> إقفال
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-3">تقارير مالية</h3>
            <div className="space-y-2">
              {[
                { title: 'الميزانية العمومية', href: '/reports/balance-sheet' },
                { title: 'قائمة الدخل', href: '/reports/profit-loss' },
                { title: 'التدفقات النقدية', href: '/reports/cash-flow' },
                { title: 'ميزان المراجعة', href: '/reports/trial-balance' },
              ].map(r => (
                <Link key={r.href} to={r.href} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-sm">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="flex-1">{r.title}</span>
                  <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
