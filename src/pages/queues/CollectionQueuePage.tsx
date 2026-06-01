import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, ChevronLeft, Bell, Scale, Send } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { KpiCard } from '@/components/shared/KpiCard';
import { formatQARInt } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { logAudit, postReceiptToInvoice } from '@/utils/exportUtils';

interface OverdueInvoice {
  id: string;
  invoice_number: string;
  tenant_id: string;
  tenant_name?: string;
  unit_code?: string;
  due_date: string;
  total: number;
  balance: number;
  daysOverdue: number;
  bucket: 'today' | '1-30' | '31-60' | '60+';
}

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

const BUCKET_META: Record<string, { label: string; color: string; bg: string; text: string }> = {
  today:  { label: 'مستحقة اليوم',  color: 'amber',  bg: 'bg-amber-50',  text: 'text-amber-700' },
  '1-30': { label: '1-30 يوم',      color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700' },
  '31-60':{ label: '31-60 يوم',     color: 'red',    bg: 'bg-red-50',    text: 'text-red-700' },
  '60+':  { label: '60+ يوم (قانوني)', color: 'red', bg: 'bg-red-100',   text: 'text-red-800' },
};

export default function CollectionQueuePage() {
  const [refresh, setRefresh] = useState(0);
  const [activeBucket, setActiveBucket] = useState<string>('all');

  const today = new Date();

  const overdue = useMemo<OverdueInvoice[]>(() => {
    const invoices = safeAll<any>('erp_invoices');
    const tenants = safeAll<any>('erp_tenants');
    const units = safeAll<any>('erp_units');
    const out: OverdueInvoice[] = [];
    for (const inv of invoices) {
      if (inv.status === 'paid') continue;
      if (!inv.due_date) continue;
      const due = new Date(inv.due_date);
      if (due >= today) continue;
      const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
      const tenant = tenants.find((t: any) => t.id === inv.tenant_id);
      const unit = units.find((u: any) => u.id === inv.unit_id);
      let bucket: OverdueInvoice['bucket'] = '1-30';
      if (days === 0) bucket = 'today';
      else if (days <= 30) bucket = '1-30';
      else if (days <= 60) bucket = '31-60';
      else bucket = '60+';
      out.push({
        id: inv.id, invoice_number: inv.invoice_number, tenant_id: inv.tenant_id,
        tenant_name: tenant?.name || inv.tenant_name, unit_code: unit?.unit_code,
        due_date: inv.due_date, total: inv.total || 0, balance: inv.balance || inv.total || 0,
        daysOverdue: days, bucket,
      });
    }
    return out.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [refresh]);

  const filtered = activeBucket === 'all' ? overdue : overdue.filter(i => i.bucket === activeBucket);

  const totals = useMemo(() => {
    const all = overdue.reduce((s, i) => s + i.balance, 0);
    const today = overdue.filter(i => i.bucket === 'today').reduce((s, i) => s + i.balance, 0);
    const m30 = overdue.filter(i => i.bucket === '1-30').reduce((s, i) => s + i.balance, 0);
    const m60 = overdue.filter(i => i.bucket === '31-60').reduce((s, i) => s + i.balance, 0);
    const l60 = overdue.filter(i => i.bucket === '60+').reduce((s, i) => s + i.balance, 0);
    return { all, today, m30, m60, l60 };
  }, [overdue]);

  function recordPayment(inv: OverdueInvoice) {
    // quick record full balance
    const ok = postReceiptToInvoice(inv.id, inv.balance);
    if (ok) {
      logAudit('collect', 'invoices', inv.id, '', `${inv.balance} ر.ق`);
      toast.success(`تم تسجيل دفعة ${formatQARInt(inv.balance)} ر.ق للفاتورة ${inv.invoice_number}`);
      setRefresh(r => r + 1);
    } else {
      toast.error('تعذر تسجيل الدفعة');
    }
  }

  function sendReminder(inv: OverdueInvoice) {
    logAudit('reminder', 'invoices', inv.id, '', `تذكير للمستأجر ${inv.tenant_name}`);
    toast.success(`تم إرسال تذكير إلى ${inv.tenant_name}`);
  }

  function createLegalNotice(inv: OverdueInvoice) {
    logAudit('create_legal', 'invoices', inv.id, '', `إشعار قانوني للفاتورة ${inv.invoice_number}`);
    toast.success(`تم إنشاء إشعار قانوني للفاتورة ${inv.invoice_number}`);
    setTimeout(() => { window.location.href = '/legal/notices'; }, 600);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="قائمة التحصيل" description="الفواتير المتأخرة مقسمة حسب عمر التأخير">
        <Link to="/wizards/payment">
          <Button className="bg-[#3B82F6] hover:bg-blue-600 text-white h-9 text-sm gap-1.5">
            <Banknote className="h-4 w-4" /> تسجيل دفعة
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="إجمالي المستحقات" value={formatQARInt(totals.all)} sublabel={`${overdue.length} فاتورة`} icon={<Banknote className="h-5 w-5" />} color="red" />
        <KpiCard label="اليوم" value={formatQARInt(totals.today)} sublabel={`${overdue.filter(i => i.bucket === 'today').length} فاتورة`} icon={<Banknote className="h-5 w-5" />} color="amber" />
        <KpiCard label="1-30 يوم" value={formatQARInt(totals.m30)} sublabel={`${overdue.filter(i => i.bucket === '1-30').length} فاتورة`} icon={<Banknote className="h-5 w-5" />} color="orange" />
        <KpiCard label="31-60 يوم" value={formatQARInt(totals.m60)} sublabel={`${overdue.filter(i => i.bucket === '31-60').length} فاتورة`} icon={<Banknote className="h-5 w-5" />} color="red" />
        <KpiCard label="60+ يوم" value={formatQARInt(totals.l60)} sublabel="إجراء قانوني" icon={<Scale className="h-5 w-5" />} color="red" />
      </div>

      {/* Bucket filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveBucket('all')}
          className={cn('shrink-0 h-9 px-3.5 rounded-lg text-xs font-medium',
            activeBucket === 'all' ? 'bg-[#1B2559] text-white' : 'bg-white border border-gray-200 hover:bg-gray-50')}
        >
          الكل ({overdue.length})
        </button>
        {Object.entries(BUCKET_META).map(([k, m]) => {
          const c = overdue.filter(i => i.bucket === k).length;
          if (c === 0) return null;
          return (
            <button
              key={k}
              onClick={() => setActiveBucket(k)}
              className={cn('shrink-0 h-9 px-3.5 rounded-lg text-xs font-medium',
                activeBucket === k ? 'bg-[#1B2559] text-white' : `${m.bg} ${m.text} hover:opacity-80`)}
            >
              {m.label} ({c})
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyStateWithAction
              size="lg"
              icon={<Banknote className="h-10 w-10 text-emerald-500" />}
              title="لا توجد فواتير متأخرة"
              description="ممتاز! كل الفواتير تم تحصيلها في وقتها."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-right p-3 font-semibold">الفاتورة</th>
                    <th className="text-right p-3 font-semibold">المستأجر</th>
                    <th className="text-right p-3 font-semibold">الوحدة</th>
                    <th className="text-right p-3 font-semibold">تاريخ الاستحقاق</th>
                    <th className="text-right p-3 font-semibold">عمر التأخير</th>
                    <th className="text-right p-3 font-semibold">المبلغ</th>
                    <th className="text-right p-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(inv => {
                    const b = BUCKET_META[inv.bucket];
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-mono text-xs">{inv.invoice_number}</td>
                        <td className="p-3">{inv.tenant_name}</td>
                        <td className="p-3 font-mono text-xs">{inv.unit_code || '-'}</td>
                        <td className="p-3 text-xs">{new Date(inv.due_date).toLocaleDateString('ar-SA')}</td>
                        <td className="p-3">
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-bold', b.bg, b.text)}>
                            {inv.daysOverdue} يوم
                          </span>
                        </td>
                        <td className="p-3 font-bold tabular-nums">{formatQARInt(inv.balance)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button size="sm" onClick={() => recordPayment(inv)} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2">
                              <Banknote className="h-3 w-3" /> تحصيل
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => sendReminder(inv)} className="h-7 text-[11px] gap-1 px-2">
                              <Bell className="h-3 w-3" /> تذكير
                            </Button>
                            {inv.bucket === '60+' && (
                              <Button size="sm" variant="outline" onClick={() => createLegalNotice(inv)} className="h-7 text-[11px] text-red-600 border-red-200 hover:bg-red-50 gap-1 px-2">
                                <Scale className="h-3 w-3" /> قانوني
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
