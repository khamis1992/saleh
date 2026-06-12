import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Receipt, FileCheck, AlertTriangle, Plus, Eye, DollarSign, Clock,
} from 'lucide-react';
import { formatQARInt } from '@/lib/format';
import { invoiceStore, receiptStore, tenantStore } from '@/services/stores';

const fmt = formatQARInt;

const statusColors: Record<string, string> = {
  paid: 'bg-emerald-50 text-[#108c3d] border-emerald-200',
  issued: 'bg-[rgba(83,58,253,0.06)] text-[#533afd] border-[#533afd]/20',
  overdue: 'bg-red-50 text-[#ea2261] border-red-200',
  partially_paid: 'bg-amber-50 text-[#9b6829] border-amber-200',
  draft: 'bg-[#f6f9fc] text-[#64748d] border-[#e5edf5]',
  cancelled: 'bg-[#f6f9fc] text-[#64748d] border-[#e5edf5]',
};

export default function CollectionsPage() {
  const { t, tt, dir } = useLocale();
  const navigate = useNavigate();
  const [refresh] = useState(0);

  const statusLabels = useMemo(() => ({
    paid: t.rentCollection.paid || tt('rentCollection.paid','مدفوع'), issued: t.projects.statuses.on_hold || tt('projects.statuses.on_hold','معلق'), overdue: t.hr.late || tt('hr.late','متأخر'),
    partially_paid: 'مدفوع جزئي', draft: t.hr.draft || tt('hr.draft','مسودة'), cancelled: t.maintenance.statuses.cancelled || tt('maintenance.statuses.cancelled','ملغي'),
  } as Record<string, string>), []);

  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const receipts = useMemo(() => receiptStore.getAll(), [refresh]);

  const overdue = invoices.filter(i => i.status === 'overdue' || (i.balance > 0 && i.status !== 'paid'));
  const paid = invoices.filter(i => i.status === 'paid');

  const getTenantName = (tenantId: string) => {
    try {
      const tenant = tenantStore.getAll().find(tn => tn.id === tenantId);
      return tenant?.full_name || tenant?.company_name || tenantId?.slice(0, 8) || '—';
    } catch { return '—'; }
  };

  // KPIs
  const totalReceivables = overdue.reduce((s, i) => s + i.balance, 0);
  const totalCollected = receipts.reduce((s, r) => s + r.amount, 0);
  const todayReceipts = receipts.filter(r => r.payment_date === new Date().toISOString().split('T')[0]);

  return (
    <div className="bg-[#f6f9fc] min-h-full" dir={dir}>
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748d]">مستحقات معلقة</div>
                <div className="text-2xl font-bold mt-1 text-[#ea2261]">{fmt(totalReceivables)}</div>
                <div className="text-xs text-[#ea2261] mt-0.5">{overdue.length} فاتورة</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-[#ea2261]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748d]">إجمالي المحصل</div>
                <div className="text-2xl font-bold mt-1 text-[#108c3d]">{fmt(totalCollected)}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#108c3d]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748d]">إيصالات اليوم</div>
                <div className="text-2xl font-bold mt-1 text-[#533afd]">{todayReceipts.length}</div>
                <div className="text-xs text-[#533afd] mt-0.5">
                  {fmt(todayReceipts.reduce((s, r) => s + r.amount, 0))}
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[rgba(83,58,253,0.06)] flex items-center justify-center">
                <Clock className="h-5 w-5 text-[#533afd]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748d]">فواتير مدفوعة</div>
                <div className="text-2xl font-bold mt-1 text-[#061b31]">{paid.length}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#f6f9fc] flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-[#64748d]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick action */}
      <div className="flex items-center gap-2 mb-4">
        <Button onClick={() => navigate('/wizards/payment')} className="gap-2 bg-[#533afd] hover:bg-[#533afd]/90 text-white h-9 text-sm rounded-lg">
          <Plus className="h-4 w-4" /> تسجيل دفعة
        </Button>
      </div>

      {/* Tabs: Invoices | Receipts | Overdue */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="invoices" className="w-full" dir={dir}>
            <div className="px-4 pt-4 border-b border-[#e5edf5]">
              <TabsList className="h-9 bg-transparent gap-0 p-0">
                <TabsTrigger value="invoices" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3">{tt('rentCollection.invoices', 'الفواتير')}</TabsTrigger>
                <TabsTrigger value="receipts" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3">الإيصالات</TabsTrigger>
                <TabsTrigger value="overdue" className="h-9 text-xs data-[state=active]:bg-red-50 data-[state=active]:text-[#ea2261] rounded-lg px-3">
                  المتأخرات {overdue.length > 0 && <span className="mr-1 bg-[#ea2261] text-white text-xs px-1.5 py-0.5 rounded-full">{overdue.length}</span>}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Invoices tab */}
            <TabsContent value="invoices" className="m-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('rentCollection.invoiceNumber', 'رقم الفاتورة')}</TableHead>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('leases.tenant', 'المستأجر')}</TableHead>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('common.amount', 'المبلغ')}</TableHead>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('budgets.remaining', 'المتبقي')}</TableHead>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('rentCollection.dueDate', 'تاريخ الاستحقاق')}</TableHead>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('legal.status', 'الحالة')}</TableHead>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9 w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.slice(0, 30).map(inv => (
                      <TableRow key={inv.id} className="hover:bg-[rgba(83,58,253,0.06)]/30 cursor-pointer" onClick={() => navigate('/rent-collection/invoices')}>
                        <TableCell className="text-sm font-mono">{inv.invoice_number || inv.id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{getTenantName((inv as any).tenant_id)}</TableCell>
                        <TableCell className="text-sm font-medium">{fmt(inv.total)}</TableCell>
                        <TableCell className={`text-sm font-medium ${inv.balance > 0 ? 'text-[#ea2261]' : 'text-[#108c3d]'}`}>
                          {fmt(inv.balance || 0)}
                        </TableCell>
                        <TableCell className="text-sm text-[#64748d]">{inv.due_date}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border ${statusColors[inv.status] || ''}`}>
                            {statusLabels[inv.status] || inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); }}>
                            <Eye className="h-3.5 w-3.5 text-[#64748d]" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Receipts tab */}
            <TabsContent value="receipts" className="m-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">رقم الإيصال</TableHead>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('leases.tenant', 'المستأجر')}</TableHead>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('common.amount', 'المبلغ')}</TableHead>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">الطريقة</TableHead>
                      <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('common.date', 'التاريخ')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.slice(0, 30).map(rec => (
                      <TableRow key={rec.id} className="hover:bg-[rgba(83,58,253,0.06)]/30">
                        <TableCell className="text-sm font-mono">{rec.receipt_number || rec.id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{getTenantName((rec as any).tenant_id)}</TableCell>
                        <TableCell className="text-sm font-medium text-[#108c3d]">{fmt(rec.amount)}</TableCell>
                        <TableCell className="text-sm text-[#64748d]">{rec.payment_method === 'cash' ? 'نقدي' : rec.payment_method === 'bank_transfer' ? 'تحويل' : rec.payment_method === 'card' ? 'بطاقة' : rec.payment_method === 'cheque' ? 'شيك' : rec.payment_method || '—'}</TableCell>
                        <TableCell className="text-sm text-[#64748d]">{rec.payment_date}</TableCell>
                      </TableRow>
                    ))}
                    {receipts.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-[#64748d]">لا توجد إيصالات</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Overdue tab */}
            <TabsContent value="overdue" className="m-0">
              {overdue.length === 0 ? (
                <div className="text-center py-16">
                  <FileCheck className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-[#64748d] font-medium">لا توجد فواتير متأخرة</p>
                  <p className="text-xs text-[#64748d] mt-1">كل الفواتير مدفوعة أو في موعدها</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('leases.tenant', 'المستأجر')}</TableHead>
                        <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('rentCollection.invoiceNumber', 'رقم الفاتورة')}</TableHead>
                        <TableHead className="text-xs font-bold text-[#64748d] h-9">المبلغ المستحق</TableHead>
                        <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('rentCollection.dueDate', 'تاريخ الاستحقاق')}</TableHead>
                        <TableHead className="text-xs font-bold text-[#64748d] h-9">أيام التأخير</TableHead>
                        <TableHead className="text-xs font-bold text-[#64748d] h-9 w-[120px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdue.map(inv => {
                        const daysLate = Math.floor((new Date().getTime() - new Date(inv.due_date).getTime()) / 86400000);
                        return (
                          <TableRow key={inv.id} className="hover:bg-red-50/30">
                            <TableCell className="text-sm font-medium">{getTenantName((inv as any).tenant_id)}</TableCell>
                            <TableCell className="text-sm font-mono">{inv.invoice_number || inv.id?.slice(0, 8)}</TableCell>
                            <TableCell className="text-sm font-bold text-[#ea2261]">{fmt(inv.balance || inv.total)}</TableCell>
                            <TableCell className="text-sm text-[#ea2261]">{inv.due_date}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${daysLate > 60 ? 'bg-[#ea2261] text-white' : daysLate > 30 ? 'bg-red-100 text-[#ea2261]' : 'bg-amber-100 text-[#9b6829]'}`}>
                                {daysLate} يوم
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" className="h-7 text-xs bg-[#533afd] hover:bg-[#533afd]/90 text-white rounded-lg" onClick={() => navigate('/wizards/payment')}>
                                سجل دفعة
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
