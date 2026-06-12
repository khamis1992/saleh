// Landlord Portal — Financial Reports
// Summary of receivables, income, NOI, collection rate

import { useMemo } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { invoiceStore, receiptStore, leaseStore, unitStore, propertyStore } from '@/services/stores';
import { formatQAR, formatQARInt, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, FileText, Calendar } from 'lucide-react';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);
const fmtInt = (v: number) => formatQARInt(v);

export default function LandlordFinancialsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const propertyId = session?.propertyId;

  const allLeases = useMemo(() => leaseStore.getAll(), []);
  const allUnits = useMemo(() => unitStore.getAll(), []);
  const allInvoices = useMemo(() => invoiceStore.getAll(), []);
  const allReceipts = useMemo(() => receiptStore.getAll(), []);
  const allProperties = useMemo(() => propertyStore.getAll(), []);

  // Filter by property
  const visibleLeases = useMemo(() => {
    return allLeases.filter((l) => {
      if (!propertyId) return true;
      const u = allUnits.find((x) => x.id === l.unit_id);
      return u?.property_id === propertyId;
    });
  }, [allLeases, allUnits, propertyId]);

  const visibleLeaseIds = useMemo(() => new Set(visibleLeases.map((l) => l.id)), [visibleLeases]);
  const visibleTenantIds = useMemo(() => new Set(visibleLeases.map((l) => l.tenant_id)), [visibleLeases]);

  const invoices = useMemo(() => allInvoices.filter((i) => visibleLeaseIds.has(i.contract_id)), [allInvoices, visibleLeaseIds]);
  const receipts = useMemo(() => allReceipts.filter((r) => visibleTenantIds.has(r.tenant_id)), [allReceipts, visibleTenantIds]);

  // KPIs
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = receipts.reduce((s, r) => s + r.amount, 0);
  const totalReceivables = invoices.reduce((s, i) => s + i.balance, 0);
  const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

  // Annual income from active leases
  const annualIncome = visibleLeases.filter((l) => l.status === 'active').reduce((s, l) => {
    switch (l.payment_frequency) {
      case 'monthly': return s + l.rent_amount * 12;
      case 'quarterly': return s + l.rent_amount * 4;
      case 'semi_annual': return s + l.rent_amount * 2;
      case 'annual': return s + l.rent_amount;
      default: return s + l.rent_amount;
    }
  }, 0);

  // Overdue invoices
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const overdueAmount = overdueInvoices.reduce((s, i) => s + i.balance, 0);

  // Income by property
  const incomeByProperty = useMemo(() => {
    return allProperties.map((p) => {
      const propLeases = allLeases.filter((l) => {
        const u = allUnits.find((x) => x.id === l.unit_id);
        return u?.property_id === p.id && l.status === 'active';
      });
      const annual = propLeases.reduce((s, l) => s + l.rent_amount, 0);
      return { name: p.property_name, value: annual };
    });
  }, [allProperties, allLeases, allUnits]);

  const COLORS = ['#10B981', '#533afd', '#8B5CF6', '#F59E0B'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061b31]">التقارير المالية</h1>
        <p className="text-xs text-[#64748d] mt-0.5">إيرادات العقارات، التحصيل، والمستحقات</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-xs text-[#64748d]">إجمالي المفوتر</p>
            <p className="text-xl font-bold text-[#061b31]">{fmtInt(totalInvoiced)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-xs text-emerald-600">إجمالي المحصل</p>
            <p className="text-xl font-bold text-emerald-600">{fmtInt(totalCollected)}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{collectionRate.toFixed(1)}% معدل تحصيل</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-xs text-[#ea2261]">المستحقات المتبقية</p>
            <p className="text-xl font-bold text-[#ea2261]">{fmtInt(totalReceivables)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-xs text-[#64748d]">الدخل السنوي المتوقع</p>
            <p className="text-xl font-bold text-[#533afd]">{fmtInt(annualIncome)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#061b31]">الدخل السنوي حسب العقار</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={incomeByProperty}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => fmt(v as number)} contentStyle={{ fontSize: '12px' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {incomeByProperty.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Overdue list */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#ea2261]" />
            فواتير متأخرة
          </CardTitle>
          <CardDescription className="text-xs">{overdueInvoices.length} فاتورة · {fmtInt(overdueAmount)} إجمالي</CardDescription>
        </CardHeader>
        <CardContent>
          {overdueInvoices.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
              <p className="text-[#64748d] text-[13px]">لا توجد فواتير متأخرة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueInvoices.slice(0, 6).map((inv) => (
                <div key={inv.id} className="p-3 bg-red-50/50 border border-red-100 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#061b31]">{inv.invoice_number}</p>
                    <p className="text-xs text-[#64748d]">استحقاق {formatDate(inv.due_date)}</p>
                  </div>
                  <p className="text-sm font-bold text-[#ea2261]">{fmt(inv.balance)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
