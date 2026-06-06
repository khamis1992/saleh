import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Package, Plus, Eye, Pencil, MoreHorizontal, Search, Download, Building2, Home, Shield } from 'lucide-react';
import { maintenanceStore, propertyStore, unitStore } from '@/services/stores';

const priorityLabels: Record<string, string> = {
  emergency: 'طارئ', high: 'عاجل', medium: 'متوسط', low: 'عادي',
};

export default function MaintenanceMergedPage() {
  const { t, tt, dir } = useLocale();
  const navigate = useNavigate();
  const [refresh] = useState(0);
  const [reqSearch, setReqSearch] = useState('');
  const [reqPriority, setReqPriority] = useState('all');
  const [reqStatus, setReqStatus] = useState('all');

  const requests = useMemo(() => maintenanceStore.getAll(), [refresh]);

  const getPropertyName = (pid: string) => {
    try { return propertyStore.getAll().find(p => p.id === pid)?.property_name || '—'; }
    catch { return '—'; }
  };
  const getUnitCode = (uid: string) => {
    try { return unitStore.getAll().find(u => u.id === uid)?.unit_code || '—'; }
    catch { return '—'; }
  };

  const openRequests = requests.filter(r => !['completed', 'closed', 'cancelled'].includes(r.status));
  const workOrders = requests.filter(r => r.status === 'assigned' || r.status === 'in_progress' || r.status === 'waiting_parts');
  const emergencies = requests.filter(r => r.priority === 'emergency' && !['completed', 'closed', 'cancelled'].includes(r.status));
  const completed = requests.filter(r => r.status === 'completed' || r.status === 'closed');

  // Status badges
  const stBg: Record<string, string> = {
    submitted: 'bg-blue-50 text-blue-700',
    under_review: 'bg-violet-50 text-violet-700',
    assigned: 'bg-[rgba(83,58,253,0.08)] text-[#533afd]',
    in_progress: 'bg-amber-50 text-[#9b6829]',
    waiting_parts: 'bg-orange-50 text-orange-700',
    completed: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-[#f6f9fc] text-[#64748d]',
    cancelled: 'bg-red-50 text-[#ea2261]',
  };

  const stLabel = (s: string) => {
    const map: Record<string, string> = {
      submitted: 'مقدم', under_review: 'قيد المراجعة', assigned: 'معين',
      in_progress: 'قيد التنفيذ', waiting_parts: 'بانتظار قطع',
      completed: 'مكتمل', closed: 'مغلق', cancelled: 'ملغي',
    };
    return map[s] || s;
  };

  const priorityBg: Record<string, string> = {
    emergency: 'bg-red-50 text-[#ea2261]',
    high: 'bg-amber-50 text-[#9b6829]',
    medium: 'bg-blue-50 text-blue-700',
    low: 'bg-[#f6f9fc] text-[#64748d]',
  };

  // Filters
  const filteredRequests = requests.filter(r => {
    if (reqSearch) {
      const q = reqSearch.toLowerCase();
      const prop = getPropertyName(r.property_id);
      const unit = getUnitCode(r.unit_id);
      if (!(r.title || r.description || '').toLowerCase().includes(q) &&
          !prop.toLowerCase().includes(q) && !unit.toLowerCase().includes(q)) return false;
    }
    if (reqPriority !== 'all' && r.priority !== reqPriority) return false;
    if (reqStatus !== 'all' && r.status !== reqStatus) return false;
    return true;
  });

  return (
    <div className="bg-[#f8fafc] min-h-full" dir={dir}>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Card 1 — طلبات مفتوحة */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#1E293B]">{openRequests.length}</div>
            <div className="text-[11px] text-[#64748d]">طلبات مفتوحة</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">{requests.length} إجمالي الطلبات</div>
          </div>
        </div>

        {/* Card 2 — طارئة */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-[#ea2261]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#ea2261]">{emergencies.length}</div>
            <div className="text-[11px] text-[#64748d]">طارئة</div>
            <div className="text-[10px] text-red-500 mt-0.5">أولوية قصوى</div>
          </div>
        </div>

        {/* Card 3 — قيد التنفيذ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-[#9b6829]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#9b6829]">{workOrders.length}</div>
            <div className="text-[11px] text-[#64748d]">قيد التنفيذ</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">أوامر عمل نشطة</div>
          </div>
        </div>

        {/* Card 4 — مكتملة */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-emerald-600">{completed.length}</div>
            <div className="text-[11px] text-[#64748d]">مكتملة</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">مغلقة ومؤرشفة</div>
          </div>
        </div>
      </div>

      {/* ===== TABS CONTAINER ===== */}
      <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="requests" className="w-full" dir={dir}>
            <div className="px-5 pt-4 pb-0 border-b border-gray-100">
              <TabsList className="h-10 bg-transparent gap-1 p-0">
                <TabsTrigger value="requests" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <Wrench className="h-4 w-4" />الطلبات
                </TabsTrigger>
                <TabsTrigger value="work-orders" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <Shield className="h-4 w-4" />أوامر العمل
                </TabsTrigger>
                <TabsTrigger value="emergency" className="h-10 text-[13px] data-[state=active]:bg-[rgba(234,34,97,0.08)] data-[state=active]:text-[#ea2261] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  طارئة {emergencies.length > 0 && <span className="mr-1 bg-[#ea2261] text-white text-[11px] px-1.5 py-0.5 rounded-full">{emergencies.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="completed" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <CheckCircle2 className="h-4 w-4" />مكتملة
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ===== ALL REQUESTS TAB ===== */}
            <TabsContent value="requests" className="m-0">
              <MaintenanceTable requests={filteredRequests} reqSearch={reqSearch} setReqSearch={setReqSearch} reqPriority={reqPriority} setReqPriority={setReqPriority} reqStatus={reqStatus} setReqStatus={setReqStatus} stBg={stBg} stLabel={stLabel} priorityBg={priorityBg} getPropertyName={getPropertyName} getUnitCode={getUnitCode} navigate={navigate} />
            </TabsContent>

            {/* ===== WORK ORDERS TAB ===== */}
            <TabsContent value="work-orders" className="m-0">
              <MaintenanceTable requests={requests.filter(r => r.status === 'assigned' || r.status === 'in_progress' || r.status === 'waiting_parts')} reqSearch="" setReqSearch={() => {}} reqPriority="all" setReqPriority={() => {}} reqStatus="all" setReqStatus={() => {}} stBg={stBg} stLabel={stLabel} priorityBg={priorityBg} getPropertyName={getPropertyName} getUnitCode={getUnitCode} navigate={navigate} />
            </TabsContent>

            {/* ===== EMERGENCY TAB ===== */}
            <TabsContent value="emergency" className="m-0">
              <MaintenanceTable requests={emergencies} reqSearch="" setReqSearch={() => {}} reqPriority="all" setReqPriority={() => {}} reqStatus="all" setReqStatus={() => {}} stBg={stBg} stLabel={stLabel} priorityBg={priorityBg} getPropertyName={getPropertyName} getUnitCode={getUnitCode} navigate={navigate} />
            </TabsContent>

            {/* ===== COMPLETED TAB ===== */}
            <TabsContent value="completed" className="m-0">
              <MaintenanceTable requests={completed} reqSearch="" setReqSearch={() => {}} reqPriority="all" setReqPriority={() => {}} reqStatus="all" setReqStatus={() => {}} stBg={stBg} stLabel={stLabel} priorityBg={priorityBg} getPropertyName={getPropertyName} getUnitCode={getUnitCode} navigate={navigate} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Shared Table Section ─── */
function MaintenanceTable({ requests, reqSearch, setReqSearch, reqPriority, setReqPriority, reqStatus, setReqStatus, stBg, stLabel, priorityBg, getPropertyName, getUnitCode, navigate }: any) {
  const showFilters = setReqSearch !== (() => {}); // Detect if it's the main "all requests" tab
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm m-4 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#1E293B]">طلبات الصيانة</h3>
          <p className="text-[11px] text-[#64748d] mt-0.5">متابعة وإدارة طلبات الصيانة</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/wizards/maintenance')} className="gap-1.5 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg px-3">
            <Plus className="h-3.5 w-3.5" />طلب صيانة
          </Button>
          <Button variant="outline" className="gap-1.5 h-8 text-xs rounded-lg px-3">
            <Download className="h-3.5 w-3.5" />تصدير
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input placeholder="بحث عن طلب..." value={reqSearch} onChange={e => setReqSearch(e.target.value)} className="pr-9 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white" />
          </div>
          <Select value={reqPriority} onValueChange={setReqPriority}>
            <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[150px]">
              <SelectValue placeholder="الأولوية: الكل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الأولوية: الكل</SelectItem>
              <SelectItem value="emergency">طارئ</SelectItem>
              <SelectItem value="high">عاجل</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="low">عادي</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reqStatus} onValueChange={setReqStatus}>
            <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[160px]">
              <SelectValue placeholder="الحالة: الكل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الحالة: الكل</SelectItem>
              <SelectItem value="submitted">مقدم</SelectItem>
              <SelectItem value="under_review">قيد المراجعة</SelectItem>
              <SelectItem value="assigned">معين</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="waiting_parts">بانتظار قطع</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="closed">مغلق</SelectItem>
            </SelectContent>
          </Select>
          {(reqSearch || reqPriority !== 'all' || reqStatus !== 'all') && (
            <span className="text-[10px] text-[#64748d]">{requests.length} نتيجة</span>
          )}
        </div>
      )}

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الطلب</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">العقار — الوحدة</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">النوع</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الأولوية</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الحالة</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-xs text-[#64748d]">لا توجد طلبات صيانة</TableCell></TableRow>
            )}
            {requests.map(r => {
              const pb = priorityBg[r.priority] || 'bg-gray-50 text-gray-600';
              const sb = stBg[r.status] || 'bg-gray-50 text-gray-600';
              return (
                <TableRow key={r.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer" onClick={() => navigate(`/maintenance/requests/${r.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Wrench className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#1E293B]">{r.title || r.id?.slice(0, 12)}</div>
                        <div className="text-[10px] text-[#94a3b8]">{r.request_number || ''}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-xs font-medium text-[#1E293B]">{getPropertyName(r.property_id)}</div>
                      <div className="text-[10px] text-[#94a3b8]">{getUnitCode(r.unit_id)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-[#64748d]">{r.maintenance_type || r.type || '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${pb}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${r.priority === 'emergency' ? 'bg-[#ea2261]' : r.priority === 'high' ? 'bg-[#9b6829]' : r.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      {priorityLabels[r.priority] || r.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${sb}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${r.status === 'completed' || r.status === 'closed' ? 'bg-emerald-500' : r.status === 'in_progress' ? 'bg-[#9b6829]' : r.status === 'submitted' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      {stLabel(r.status)}
                    </span>
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50"><Eye className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-amber-50"><Pencil className="h-3.5 w-3.5 text-[#64748d]" /></Button>
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
  );
}
