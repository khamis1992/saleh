import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, DollarSign, Wrench, HardHat, ShoppingCart, AlertTriangle } from 'lucide-react';
import { formatQARInt } from '@/lib/format';
import {
  invoiceStore, maintenanceStore, projectStore, contractorClaimStore,
  purchaseRequestStore, purchaseOrderStore, inventoryStore,
} from '@/services/stores';

const fmt = formatQARInt;

export default function QueuesMergedPage() {
  const { t, tt, dir } = useLocale();
  const navigate = useNavigate();
  const [refresh] = useState(0);

  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const maintenance = useMemo(() => maintenanceStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);
  const claims = useMemo(() => contractorClaimStore.getAll(), [refresh]);
  const prs = useMemo(() => purchaseRequestStore.getAll(), [refresh]);
  const pos = useMemo(() => purchaseOrderStore.getAll(), [refresh]);
  const items = useMemo(() => inventoryStore.getAll(), [refresh]);

  const today = new Date().toISOString().split('T')[0];

  // Approval queue
  const pendingApprovals = [
    ...claims.filter(c => c.status === 'submitted').map(c => ({ id: c.id, type: 'مطالبة مقاول', title: `مطالبة ${c.id?.slice(0, 8)}`, link: '/construction/claims', amount: (c as any).claimed_amount || 0 })),
    ...prs.filter(p => p.status === 'pending').map(p => ({ id: p.id, type: 'طلب شراء', title: (p as any).title || p.id?.slice(0, 8), link: '/procurement/requests', amount: (p as any).estimated_total || 0 })),
  ];

  // Collection queue
  const overdueInvoices = invoices.filter(i => i.status === 'overdue' || (i.balance > 0 && i.status !== 'paid' && i.due_date < today));
  const dueToday = invoices.filter(i => i.balance > 0 && i.status !== 'paid' && i.due_date === today);
  const upcoming = invoices.filter(i => {
    if (i.status === 'paid') return false;
    const due = new Date(i.due_date);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return due > new Date(today) && due <= d;
  });

  // Maintenance queue
  const newRequests = maintenance.filter(m => m.status === 'submitted' || m.status === 'under_review');
  const emergency = maintenance.filter(m => m.priority === 'emergency' && !['completed', 'closed', 'cancelled'].includes(m.status));
  const inProgress = maintenance.filter(m => m.status === 'in_progress' || m.status === 'assigned');

  // Construction queue
  const delayedPhases = projects.filter(p => (p.status === 'construction' || p.status === 'testing') && (p as any).planned_end_date && (p as any).planned_end_date < today);
  const budgetOverruns = projects.filter(p => p.actual_cost > p.approved_budget);

  // Procurement queue
  const pendingPRs = prs.filter(p => p.status === 'pending' || p.status === 'draft');
  const openPOs = pos.filter(p => p.status === 'approved' || p.status === 'in_progress');
  const lowStock = items.filter((i: any) => (i.current_stock || 0) <= (i.min_stock || 5));

  return (
    <div className="bg-[#f6f9fc] min-h-full" dir={dir}>
      <h1 className="text-xl font-bold text-[#273951] mb-4">قوائم الانتظار</h1>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="approvals" className="w-full" dir={dir}>
            <div className="px-4 pt-4 border-b border-[#e5edf5] overflow-x-auto">
              <TabsList className="h-9 bg-transparent gap-0 p-0 flex-nowrap">
                <TabsTrigger value="approvals" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3 whitespace-nowrap">
                  <Shield className="h-3.5 w-3.5 ml-1" /> اعتمادات
                  {pendingApprovals.length > 0 && <span className="mr-1 bg-[#9b6829] text-white text-[12px] px-1.5 py-0.5 rounded-full">{pendingApprovals.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="collection" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3 whitespace-nowrap">
                  <DollarSign className="h-3.5 w-3.5 ml-1" /> تحصيل
                  {overdueInvoices.length > 0 && <span className="mr-1 bg-[#ea2261] text-white text-[12px] px-1.5 py-0.5 rounded-full">{overdueInvoices.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3 whitespace-nowrap">
                  <Wrench className="h-3.5 w-3.5 ml-1" /> صيانة
                  {newRequests.length > 0 && <span className="mr-1 bg-[#9b6829] text-white text-[12px] px-1.5 py-0.5 rounded-full">{newRequests.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="construction" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3 whitespace-nowrap">
                  <HardHat className="h-3.5 w-3.5 ml-1" /> إنشاءات
                  {delayedPhases.length > 0 && <span className="mr-1 bg-[#ea2261] text-white text-[12px] px-1.5 py-0.5 rounded-full">{delayedPhases.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="procurement" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3 whitespace-nowrap">
                  <ShoppingCart className="h-3.5 w-3.5 ml-1" /> مشتريات
                  {pendingPRs.length > 0 && <span className="mr-1 bg-[#9b6829] text-white text-[12px] px-1.5 py-0.5 rounded-full">{pendingPRs.length}</span>}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Approvals */}
            <TabsContent value="approvals" className="m-0">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-16 text-[#64748d]">لا توجد اعتمادات معلقة</div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{tt('equipment.equipmentType', 'النوع')}</TableHead>
                        <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{tt('properties.address', 'العنوان')}</TableHead>
                        <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{tt('common.amount', 'المبلغ')}</TableHead>
                        <TableHead className="text-[12px] font-bold text-[#64748d] h-9 w-[120px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApprovals.map((a, i) => (
                        <TableRow key={i} className="hover:bg-[rgba(83,58,253,0.06)]/30">
                          <TableCell><Badge className="text-[12px] bg-amber-50 text-[#9b6829]">{a.type}</Badge></TableCell>
                          <TableCell className="text-sm">{a.title}</TableCell>
                          <TableCell className="text-sm font-medium">{fmt(a.amount)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white">اعتماد</Button>
                              <Button size="sm" variant="outline" className="h-7 text-[12px] text-[#ea2261]">رفض</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Collection */}
            <TabsContent value="collection" className="m-0">
              <div className="p-4 space-y-4">
                {dueToday.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#ea2261] mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> مستحق اليوم</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {dueToday.map(inv => (
                        <div key={inv.id} className="border border-red-200 bg-red-50 rounded-lg p-3 cursor-pointer hover:bg-red-100" onClick={() => navigate('/collections')}>
                          <div className="text-xs text-[#ea2261] font-bold">{fmt(inv.balance || inv.total)}</div>
                          <div className="text-[12px] text-red-500 mt-0.5">{inv.invoice_number}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {overdueInvoices.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#ea2261] mb-2">{tt('hr.late', 'متأخر')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {overdueInvoices.slice(0, 6).map(inv => (
                        <div key={inv.id} className="border border-red-200 bg-red-50 rounded-lg p-3 cursor-pointer hover:bg-red-100" onClick={() => navigate('/collections')}>
                          <div className="text-xs text-[#ea2261] font-bold">{fmt(inv.balance || inv.total)}</div>
                          <div className="text-[12px] text-red-500 mt-0.5">{inv.invoice_number} — {inv.due_date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {dueToday.length === 0 && overdueInvoices.length === 0 && (
                  <div className="text-center py-12 text-[#64748d]">لا توجد مستحقات</div>
                )}
              </div>
            </TabsContent>

            {/* Maintenance */}
            <TabsContent value="maintenance" className="m-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="text-xs text-[#ea2261] font-bold mb-2">{tt('maintenance.priorities.emergency', 'طارئة')}</div>
                  <div className="text-2xl font-bold text-[#ea2261]">{emergency.length}</div>
                  {emergency.length > 0 && <Button size="sm" className="mt-2 h-7 text-[12px]" onClick={() => navigate('/maintenance/requests')}>عرض</Button>}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="text-xs text-[#9b6829] font-bold mb-2">جديدة</div>
                  <div className="text-2xl font-bold text-[#9b6829]">{newRequests.length}</div>
                  {newRequests.length > 0 && <Button size="sm" className="mt-2 h-7 text-[12px]" onClick={() => navigate('/maintenance/requests')}>عرض</Button>}
                </div>
                <div className="bg-[rgba(83,58,253,0.06)] border border-blue-200 rounded-xl p-4">
                  <div className="text-xs text-[#533afd] font-bold mb-2">{tt('maintenance.statuses.in_progress', 'قيد التنفيذ')}</div>
                  <div className="text-2xl font-bold text-[#533afd]">{inProgress.length}</div>
                </div>
              </div>
            </TabsContent>

            {/* Construction */}
            <TabsContent value="construction" className="m-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                <div className={`border rounded-xl p-4 ${delayedPhases.length > 0 ? 'bg-red-50 border-red-200' : 'bg-[#f6f9fc] border-[#e5edf5]'}`}>
                  <div className="text-xs font-bold mb-2 text-[#ea2261]">مراحل متأخرة</div>
                  <div className="text-2xl font-bold text-[#ea2261]">{delayedPhases.length}</div>
                </div>
                <div className={`border rounded-xl p-4 ${budgetOverruns.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-[#f6f9fc] border-[#e5edf5]'}`}>
                  <div className="text-xs font-bold mb-2 text-[#9b6829]">تجاوز ميزانية</div>
                  <div className="text-2xl font-bold text-[#9b6829]">{budgetOverruns.length}</div>
                </div>
              </div>
            </TabsContent>

            {/* Procurement */}
            <TabsContent value="procurement" className="m-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
                <div className={`border rounded-xl p-4 ${pendingPRs.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-[#f6f9fc]'}`}>
                  <div className="text-xs font-bold mb-2 text-[#9b6829]">طلبات شراء معلقة</div>
                  <div className="text-2xl font-bold text-[#9b6829]">{pendingPRs.length}</div>
                </div>
                <div className={`border rounded-xl p-4 ${openPOs.length > 0 ? 'bg-[rgba(83,58,253,0.06)] border-blue-200' : 'bg-[#f6f9fc]'}`}>
                  <div className="text-xs font-bold mb-2 text-[#533afd]">أوامر شراء مفتوحة</div>
                  <div className="text-2xl font-bold text-[#533afd]">{openPOs.length}</div>
                </div>
                <div className={`border rounded-xl p-4 ${lowStock.length > 0 ? 'bg-red-50 border-red-200' : 'bg-[#f6f9fc]'}`}>
                  <div className="text-xs font-bold mb-2 text-[#ea2261]">مخزون منخفض</div>
                  <div className="text-2xl font-bold text-[#ea2261]">{lowStock.length}</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
