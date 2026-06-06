import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, FileCheck, Package, Truck, Users, Scale, Plus, Eye, Pencil, MoreHorizontal, Search, Download, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatQARInt } from '@/lib/format';
import { purchaseRequestStore, purchaseOrderStore, inventoryStore } from '@/services/stores';

const fmt = formatQARInt;

export default function ProcurementMergedPage() {
  const { t, tt, dir } = useLocale();
  const navigate = useNavigate();
  const [refresh] = useState(0);
  const [prSearch, setPrSearch] = useState('');
  const [prStatus, setPrStatus] = useState('all');
  const [poSearch, setPoSearch] = useState('');
  const [poStatus, setPoStatus] = useState('all');

  const prs = useMemo(() => purchaseRequestStore.getAll(), [refresh]);
  const pos = useMemo(() => purchaseOrderStore.getAll(), [refresh]);
  const inventory = useMemo(() => inventoryStore.getAll(), [refresh]);

  const pendingPRs = prs.filter(p => p.status === 'pending' || p.status === 'draft');
  const openPOs = pos.filter(p => p.status === 'approved' || p.status === 'in_progress');
  const receivedPOs = pos.filter(p => p.status === 'received' || p.status === 'completed');
  const totalPRValue = prs.reduce((s, p) => s + ((p as any).total_amount || (p as any).estimated_total || 0), 0);
  const lowStock = inventory.filter(i => (i as any).onHand <= ((i as any).reorder_level || 0)).length;

  // Status maps
  const stBg: Record<string, string> = {
    draft: 'bg-[#f6f9fc] text-[#64748d]',
    pending: 'bg-amber-50 text-[#9b6829]',
    approved: 'bg-emerald-50 text-emerald-700',
    in_progress: 'bg-blue-50 text-blue-700',
    received: 'bg-[rgba(83,58,253,0.08)] text-[#533afd]',
    completed: 'bg-emerald-50 text-[#108c3d]',
    cancelled: 'bg-red-50 text-[#ea2261]',
  };

  const stLabel = (s: string) => {
    const map: Record<string, string> = {
      draft: 'مسودة', pending: 'معلق', approved: 'معتمد',
      in_progress: 'قيد التنفيذ', received: 'مستلم', completed: 'مكتمل', cancelled: 'ملغي',
    };
    return map[s] || s;
  };

  // Filters
  const filteredPRs = prs.filter(p => {
    if (prSearch) {
      const q = prSearch.toLowerCase();
      if (!((p as any).title || p.id || '').toLowerCase().includes(q)) return false;
    }
    if (prStatus !== 'all' && p.status !== prStatus) return false;
    return true;
  });

  const filteredPOs = pos.filter(p => {
    if (poSearch) {
      const q = poSearch.toLowerCase();
      if (!((p as any).order_number || p.id || '').toLowerCase().includes(q)) return false;
    }
    if (poStatus !== 'all' && p.status !== poStatus) return false;
    return true;
  });

  return (
    <div className="bg-[#f8fafc] min-h-full" dir={dir}>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Card 1 — طلبات شراء معلقة */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <ShoppingCart className="h-5 w-5 text-[#9b6829]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#9b6829]">{pendingPRs.length}</div>
            <div className="text-[11px] text-[#64748d]">طلبات شراء معلقة</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">{prs.length} إجمالي الطلبات</div>
          </div>
        </div>

        {/* Card 2 — أوامر شراء مفتوحة */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <FileCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-blue-600">{openPOs.length}</div>
            <div className="text-[11px] text-[#64748d]">أوامر شراء مفتوحة</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">{pos.length} إجمالي الأوامر</div>
          </div>
        </div>

        {/* Card 3 — إجمالي القيمة */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-[rgba(83,58,253,0.08)] flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-[#533afd]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#1E293B]">{fmt(totalPRValue)}</div>
            <div className="text-[11px] text-[#64748d]">قيمة الطلبات</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">{pos.length} أمر</div>
          </div>
        </div>

        {/* Card 4 — مخزون منخفض */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-[#ea2261]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#ea2261]">{lowStock}</div>
            <div className="text-[11px] text-[#64748d]">مخزون منخفض</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">{inventory.length} صنف</div>
          </div>
        </div>
      </div>

      {/* ===== TABS CONTAINER ===== */}
      <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="pr" className="w-full" dir={dir}>
            <div className="px-5 pt-4 pb-0 border-b border-gray-100">
              <TabsList className="h-10 bg-transparent gap-1 p-0">
                <TabsTrigger value="pr" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  طلبات الشراء {pendingPRs.length > 0 && <span className="mr-1 bg-[#9b6829] text-white text-[11px] px-1.5 py-0.5 rounded-full">{pendingPRs.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="po" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <FileCheck className="h-4 w-4" />أوامر الشراء
                </TabsTrigger>
                <TabsTrigger value="received" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <Package className="h-4 w-4" />المستلمة
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ===== PURCHASE REQUESTS TAB ===== */}
            <TabsContent value="pr" className="m-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm m-4 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">طلبات الشراء</h3>
                    <p className="text-[11px] text-[#64748d] mt-0.5">إدارة طلبات الشراء واعتمادها</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/wizards/purchase-request')} className="gap-1.5 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg px-3">
                      <Plus className="h-3.5 w-3.5" />طلب شراء
                    </Button>
                    <Button variant="outline" className="gap-1.5 h-8 text-xs rounded-lg px-3">
                      <Download className="h-3.5 w-3.5" />تصدير
                    </Button>
                  </div>
                </div>

                <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input placeholder="بحث عن طلب..." value={prSearch} onChange={e => setPrSearch(e.target.value)} className="pr-9 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white" />
                  </div>
                  <Select value={prStatus} onValueChange={setPrStatus}>
                    <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[150px]">
                      <SelectValue placeholder="الحالة: الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الحالة: الكل</SelectItem>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="pending">معلق</SelectItem>
                      <SelectItem value="approved">معتمد</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                  {(prSearch || prStatus !== 'all') && <span className="text-[10px] text-[#64748d]">{filteredPRs.length} نتيجة</span>}
                </div>

                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الطلب</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المورد</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المبلغ</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">التاريخ</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الحالة</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPRs.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-xs text-[#64748d]">لا توجد طلبات شراء</TableCell></TableRow>
                      )}
                      {filteredPRs.map(pr => {
                        const sb = stBg[pr.status] || 'bg-gray-50 text-gray-600';
                        return (
                          <TableRow key={pr.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                  <ShoppingCart className="h-3.5 w-3.5 text-[#9b6829]" />
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-[#1E293B]">{(pr as any).title || pr.id?.slice(0, 8)}</div>
                                  <div className="text-[10px] text-[#94a3b8]">{(pr as any).request_number || ''}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(pr as any).vendor_name || '—'}</TableCell>
                            <TableCell className="text-xs font-semibold text-[#1E293B] tabular-nums">{fmt((pr as any).total_amount || (pr as any).estimated_total || 0)}</TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(pr as any).created_at?.slice(0, 10) || '—'}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${sb}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${pr.status === 'approved' ? 'bg-emerald-500' : pr.status === 'pending' ? 'bg-amber-500' : pr.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'}`} />
                                {stLabel(pr.status)}
                              </span>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50"><Eye className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100"><MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ===== PURCHASE ORDERS TAB ===== */}
            <TabsContent value="po" className="m-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm m-4 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">أوامر الشراء</h3>
                    <p className="text-[11px] text-[#64748d] mt-0.5">متابعة أوامر الشراء الصادرة للموردين</p>
                  </div>
                </div>

                <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input placeholder="بحث عن أمر شراء..." value={poSearch} onChange={e => setPoSearch(e.target.value)} className="pr-9 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white" />
                  </div>
                  <Select value={poStatus} onValueChange={setPoStatus}>
                    <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[150px]">
                      <SelectValue placeholder="الحالة: الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الحالة: الكل</SelectItem>
                      <SelectItem value="approved">معتمد</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="received">مستلم</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                  {(poSearch || poStatus !== 'all') && <span className="text-[10px] text-[#64748d]">{filteredPOs.length} نتيجة</span>}
                </div>

                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">أمر الشراء</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المورد</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المبلغ</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">التسليم المتوقع</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الحالة</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPOs.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-xs text-[#64748d]">لا توجد أوامر شراء</TableCell></TableRow>
                      )}
                      {filteredPOs.map(po => {
                        const sb = stBg[po.status] || 'bg-gray-50 text-gray-600';
                        return (
                          <TableRow key={po.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <FileCheck className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <span className="text-xs font-semibold text-[#1E293B]">{(po as any).order_number || po.id?.slice(0, 8)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(po as any).vendor_name || '—'}</TableCell>
                            <TableCell className="text-xs font-semibold text-[#1E293B] tabular-nums">{fmt((po as any).total_amount || 0)}</TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(po as any).expected_delivery?.slice(0, 10) || '—'}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${sb}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${po.status === 'received' || po.status === 'completed' ? 'bg-emerald-500' : po.status === 'in_progress' ? 'bg-blue-500' : po.status === 'cancelled' ? 'bg-red-500' : 'bg-[#533afd]'}`} />
                                {stLabel(po.status)}
                              </span>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50"><Eye className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100"><MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ===== RECEIVED TAB ===== */}
            <TabsContent value="received" className="m-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm m-4 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">المستلمة</h3>
                    <p className="text-[11px] text-[#64748d] mt-0.5">أوامر الشراء المستلمة والمكتملة</p>
                  </div>
                </div>

                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">أمر الشراء</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المورد</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المبلغ</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">تاريخ الاستلام</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الحالة</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivedPOs.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-xs text-[#64748d]">لا توجد عناصر مستلمة</TableCell></TableRow>
                      )}
                      {receivedPOs.map(po => {
                        const sb = stBg[po.status] || 'bg-gray-50 text-gray-600';
                        return (
                          <TableRow key={po.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                  <Package className="h-3.5 w-3.5 text-emerald-600" />
                                </div>
                                <span className="text-xs font-semibold text-[#1E293B]">{(po as any).order_number || po.id?.slice(0, 8)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(po as any).vendor_name || '—'}</TableCell>
                            <TableCell className="text-xs font-semibold text-[#1E293B] tabular-nums">{fmt((po as any).total_amount || 0)}</TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(po as any).received_date?.slice(0, 10) || (po as any).updated_at?.slice(0, 10) || '—'}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${sb}`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {stLabel(po.status)}
                              </span>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50"><Eye className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100"><MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
