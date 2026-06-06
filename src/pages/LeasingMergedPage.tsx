import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Receipt, Plus, Eye, Pencil, MoreHorizontal, Search, Download, TrendingUp, Wallet, Home, Upload, Filter, Calendar, AlertCircle, FileText, AlertTriangle, Clock, MessageSquare, Printer, BarChart3 } from 'lucide-react';
import { formatQARInt } from '@/lib/format';
import { propertyStore, unitStore, tenantStore, leaseStore, invoiceStore, receiptStore } from '@/services/stores';

const fmt = formatQARInt;

const unitSt: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-700',
  leased: 'bg-[rgba(83,58,253,0.08)] text-[#533afd]',
  under_maintenance: 'bg-amber-50 text-[#9b6829]',
};

const propStatusSt: Record<string, string> = {
  ready_for_leasing: 'bg-emerald-50 text-emerald-700',
  partially_leased: 'bg-blue-50 text-blue-700',
  fully_leased: 'bg-[rgba(83,58,253,0.08)] text-[#533afd]',
  under_construction: 'bg-amber-50 text-[#9b6829]',
};

export default function LeasingMergedPage() {
  const { t, tt, dir } = useLocale();
  const navigate = useNavigate();
  const [r] = useState(0);
  const [propSearch, setPropSearch] = useState('');
  const [propType, setPropType] = useState('all');
  const [propStatus, setPropStatus] = useState('all');
  const [unitSearch, setUnitSearch] = useState('');
  const [unitStatus, setUnitStatus] = useState('all');
  const [tenantSearch, setTenantSearch] = useState('');
  const [contractSearch, setContractSearch] = useState('');

  const unitLb = useMemo(() => ({
    available: t.units.statuses.available || tt('units.statuses.available', 'متاحة'),
    leased: t.units.statuses.leased || tt('units.statuses.leased', 'مؤجرة'),
    under_maintenance: 'صيانة',
  } as Record<string, string>), []);

  const properties = useMemo(() => propertyStore.getAll(), [r]);
  const units = useMemo(() => unitStore.getAll(), [r]);
  const tenants = useMemo(() => tenantStore.getAll(), [r]);
  const leases = useMemo(() => leaseStore.getAll(), [r]);
  const invoices = useMemo(() => invoiceStore.getAll(), [r]);
  const receipts = useMemo(() => receiptStore.getAll(), [r]);

  const totalUnits = units.length;
  const leased = units.filter(u => u.status === 'leased').length;
  const availableUnits = units.filter(u => u.status === 'available').length;
  const occupancy = totalUnits > 0 ? Math.round((leased / totalUnits) * 100) : 0;
  const overdueInvs = invoices.filter(i => i.status === 'overdue' || (i.balance > 0 && i.status !== 'paid'));
  const collected = receipts.reduce((s, rec) => s + rec.amount, 0);

  // Sidebar metrics for tenants tab
  const pendingSignatures = leases.filter(l => l.status === 'pending_signature' || l.status === 'pending').length;
  const expiringSoon = leases.filter(l => l.status === 'expiring_soon').length;
  const tenantsWithOverdue = [...new Set(invoices.filter(i => i.status === 'overdue' || (i.balance > 0 && i.status !== 'paid')).map(i => i.tenant_id))].length;
  const monthlyRent = leases.filter(l => l.status === 'active').reduce((s, l) => s + (l.rent_amount || 0), 0);

  // Helper: build enriched tenant rows
  const enrichedTenants = useMemo(() => tenants.map(tn => {
    const tnLeases = leases.filter(l => l.tenant_id === tn.id);
    const activeLease = tnLeases.find(l => l.status === 'active');
    const lease = activeLease || tnLeases[0];
    const unit = lease ? units.find(u => u.id === lease.unit_id) : null;
    const prop = unit ? properties.find(p => p.id === unit.property_id) : null;
    const tnInvoices = invoices.filter(i => i.tenant_id === tn.id);
    const lastPayment = receipts.filter(r => r.tenant_id === tn.id).sort((a, b) => (b.payment_date || '').localeCompare(a.payment_date || ''))[0];
    const hasOverdue = tnInvoices.some(i => i.status === 'overdue' || (i.balance > 0 && i.status !== 'paid'));
    return { tenant: tn, lease, unit, prop, lastPayment, hasOverdue, tnInvoices, tnLeases };
  }), [tenants, leases, units, properties, invoices, receipts]);

  // Filtered tenants
  const filteredTenants = enrichedTenants.filter(et => {
    if (!tenantSearch) return true;
    const q = tenantSearch.toLowerCase();
    const tn = et.tenant;
    const u = et.unit;
    const p = et.prop;
    return (
      (tn.full_name || tn.company_name || '').toLowerCase().includes(q) ||
      (tn.phone || '').includes(q) ||
      (u?.unit_code || '').toLowerCase().includes(q) ||
      (p?.property_name || '').toLowerCase().includes(q)
    );
  });

  // Collection tab metrics
  const totalInvoiced = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalDue = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (i.balance || i.total || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue' || (i.balance > 0 && i.status !== 'paid')).reduce((s, i) => s + (i.balance || i.total || 0), 0);
  const dueToday = invoices.filter(i => (i.status === 'issued' || i.status === 'pending') && i.balance > 0).slice(0, 8);
  const collectionRate = totalInvoiced > 0 ? Math.round((collected / totalInvoiced) * 100) : 0;
  const topOverdue = invoices.filter(i => i.status === 'overdue' || (i.balance > 0 && i.status !== 'paid')).sort((a, b) => (b.balance || b.total || 0) - (a.balance || a.total || 0)).slice(0, 6);

  // Property type label
  const propTypeLabel = (pt: string) => {
    if (!pt) return '—';
    if (pt.includes('residential')) return t.properties.types.residential_building;
    if (pt.includes('commercial')) return t.properties.types.commercial_building;
    if (pt.includes('villa_compound') || pt.includes('single_villa')) return 'فلل سكنية';
    if (pt.includes('mixed_use')) return 'متعدد الاستخدامات';
    if (pt.includes('retail')) return 'مركز تجاري';
    return pt.replace(/_/g, ' ');
  };

  // Property status label
  const propStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      ready_for_leasing: t.properties.statuses.ready_for_leasing || 'جاهز للتأجير',
      partially_leased: tt('leases.partially_leased', 'مؤجر جزئياً'),
      fully_leased: tt('leases.fully_leased', 'مؤجر بالكامل'),
      under_construction: 'تحت الإنشاء',
    };
    return map[s] || s;
  };

  // Filter properties
  const filteredProperties = properties.filter(p => {
    if (propSearch) {
      const q = propSearch.toLowerCase();
      if (!p.property_name?.toLowerCase().includes(q)) return false;
    }
    if (propType !== 'all' && p.property_type !== propType) return false;
    if (propStatus !== 'all' && p.status !== propStatus) return false;
    return true;
  });

  // Filter units
  const filteredUnits = units.filter(u => {
    if (unitSearch) {
      const q = unitSearch.toLowerCase();
      const prop = properties.find(p => p.id === u.property_id);
      if (!(u.unit_code?.toLowerCase().includes(q) || prop?.property_name?.toLowerCase().includes(q))) return false;
    }
    if (unitStatus !== 'all' && u.status !== unitStatus) return false;
    return true;
  });

  // Unique property types and statuses for filters
  const propTypes = useMemo(() => [...new Set(properties.map(p => p.property_type).filter(Boolean))], [properties]);
  const propStatuses = useMemo(() => [...new Set(properties.map(p => p.status).filter(Boolean))], [properties]);

  return (
    <div className="bg-[#f8fafc] min-h-full" dir={dir}>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Card 1 — العقارات */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#1E293B]">{properties.length}</div>
            <div className="text-[11px] text-[#64748d]">{t.properties.title}</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">{properties.length} عقار</div>
          </div>
        </div>

        {/* Card 2 — الوحدات */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-[rgba(83,58,253,0.08)] flex items-center justify-center shrink-0">
            <Home className="h-5 w-5 text-[#533afd]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#1E293B]">{totalUnits}</div>
            <div className="text-[11px] text-[#64748d]">{t.units.title}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{availableUnits} {t.units.statuses.available}</div>
          </div>
        </div>

        {/* Card 3 — نسبة الإشغال */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[#1E293B]">{occupancy}%</div>
            <div className="text-[11px] text-[#64748d]">{t.dashboard.occupancyRate}</div>
            <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-[#533afd] rounded-full transition-all" style={{ width: `${occupancy}%` }} />
            </div>
          </div>
        </div>

        {/* Card 4 — التحصيلات */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-emerald-600">{fmt(collected)}</div>
            <div className="text-[11px] text-[#64748d]">{tt('leases.collections', 'تحصيلات')}</div>
            <div className="text-[10px] text-red-500 mt-0.5">{overdueInvs.length} {tt('leases.overdue_items', 'متأخرة')}</div>
          </div>
        </div>
      </div>

      {/* ===== TABS CONTAINER ===== */}
      <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="properties" className="w-full" dir={dir}>
            <div className="px-5 pt-4 pb-0 border-b border-gray-100">
              <TabsList className="h-10 bg-transparent gap-1 p-0">
                <TabsTrigger value="properties" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <Building2 className="h-4 w-4" />
                  {tt('leases.properties_units', 'عقارات ووحدات')}
                </TabsTrigger>
                <TabsTrigger value="tenants" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <Users className="h-4 w-4" />
                  {tt('leases.tenants_contracts', 'مستأجرون وعقود')}
                </TabsTrigger>
                <TabsTrigger value="collections" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <Receipt className="h-4 w-4" />
                  {tt('leases.collections_tab', 'تحصيل')}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ===== PROPERTIES & UNITS TAB ===== */}
            <TabsContent value="properties" className="m-0">

              {/* ========== PROPERTIES SECTION ========== */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm m-4 mb-3 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">{tt('leases.properties_units', 'العقارات')}</h3>
                    <p className="text-[11px] text-[#64748d] mt-0.5">{tt('leases.manage_properties', 'إدارة ومتابعة حالة العقارات')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/properties/create')} className="gap-1.5 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg px-3">
                      <Plus className="h-3.5 w-3.5" />{t.properties.title}
                    </Button>
                    <Button onClick={() => navigate('/units/create')} variant="outline" className="gap-1.5 h-8 text-xs rounded-lg px-3">
                      <Plus className="h-3.5 w-3.5" />{t.units.title}
                    </Button>
                    <Button variant="outline" className="gap-1.5 h-8 text-xs rounded-lg px-3">
                      <Download className="h-3.5 w-3.5" />تصدير
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="بحث عن عقار..."
                      value={propSearch}
                      onChange={e => setPropSearch(e.target.value)}
                      className="pr-9 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <Select value={propType} onValueChange={setPropType}>
                    <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[160px]">
                      <SelectValue placeholder="نوع العقار: الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">نوع العقار: الكل</SelectItem>
                      {propTypes.map(pt => (
                        <SelectItem key={pt} value={pt}>{propTypeLabel(pt)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={propStatus} onValueChange={setPropStatus}>
                    <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[160px]">
                      <SelectValue placeholder="حالة العقار: الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">حالة العقار: الكل</SelectItem>
                      {propStatuses.map(ps => (
                        <SelectItem key={ps} value={ps}>{propStatusLabel(ps)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(propSearch || propType !== 'all' || propStatus !== 'all') && (
                    <span className="text-[10px] text-[#64748d]">{filteredProperties.length} نتيجة</span>
                  )}
                </div>

                {/* Properties Table */}
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.common.status}</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.units.title} / {t.dashboard.occupancyRate}</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.properties.type}</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.properties.name}</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[80px]">{t.common.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProperties.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-xs text-[#64748d]">
                            {tt('common.noData', 'لا توجد عقارات')}
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredProperties.map(p => {
                        const pu = units.filter(u => u.property_id === p.id);
                        const leasedCount = pu.filter(u => u.status === 'leased').length;
                        const occRate = pu.length > 0 ? Math.round((leasedCount / pu.length) * 100) : 0;
                        const statusColor = propStatusSt[p.status] || 'bg-gray-50 text-gray-600';
                        return (
                          <TableRow key={p.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer" onClick={() => navigate(`/properties/${p.id}`)}>
                            {/* حالة العقار */}
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusColor}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  p.status === 'ready_for_leasing' ? 'bg-emerald-500' :
                                  p.status === 'partially_leased' ? 'bg-blue-500' :
                                  p.status === 'fully_leased' ? 'bg-[#533afd]' : 'bg-gray-400'
                                }`}></span>
                                {propStatusLabel(p.status)}
                              </span>
                            </TableCell>
                            {/* الوحدات / الإشغال */}
                            <TableCell>
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-xs font-bold text-[#1E293B]">{pu.length}</span>
                                  <span className="text-[10px] text-[#94a3b8]">/ {occRate}%</span>
                                </div>
                                <div className="h-1 w-full max-w-[120px] bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-[#533afd] rounded-full transition-all"
                                    style={{ width: `${occRate}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            {/* نوع العقار */}
                            <TableCell>
                              <span className="text-xs text-[#64748d]">{propTypeLabel(p.property_type)}</span>
                            </TableCell>
                            {/* اسم العقار */}
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-[rgba(83,58,253,0.08)] flex items-center justify-center shrink-0">
                                  <Building2 className="h-3.5 w-3.5 text-[#533afd]" />
                                </div>
                                <span className="text-xs font-semibold text-[#1E293B]">{p.property_name}</span>
                              </div>
                            </TableCell>
                            {/* الإجراءات */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50" onClick={() => navigate(`/properties/${p.id}`)}>
                                  <Eye className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-amber-50" onClick={() => navigate(`/properties/${p.id}/edit`)}>
                                  <Pencil className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100">
                                  <MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* ========== UNITS SECTION ========== */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mx-4 mb-4 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">{t.units.title}</h3>
                    <p className="text-[11px] text-[#64748d] mt-0.5">{tt('units.manage_desc', 'متابعة حالة الوحدات وإيجاراتها')}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="relative min-w-[180px] max-w-xs">
                      <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="بحث عن وحدة..."
                        value={unitSearch}
                        onChange={e => setUnitSearch(e.target.value)}
                        className="pr-9 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <Select value={unitStatus} onValueChange={setUnitStatus}>
                      <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[150px]">
                        <SelectValue placeholder="حالة الوحدة: الكل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">حالة الوحدة: الكل</SelectItem>
                        <SelectItem value="available">{t.units.statuses.available}</SelectItem>
                        <SelectItem value="leased">{t.units.statuses.leased}</SelectItem>
                        <SelectItem value="under_maintenance">صيانة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Units Table */}
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.common.status}</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.units.rent} ({tt('common.qar', 'ر.ق')})</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.properties.name}</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.tenants.name}</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.units.code}</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[80px]">{t.common.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUnits.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-xs text-[#64748d]">
                            {tt('common.noData', 'لا توجد وحدات')}
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredUnits.map(u => {
                        const prop = properties.find(p => p.id === u.property_id);
                        const statusColor = unitSt[u.status] || 'bg-gray-50 text-gray-600';
                        return (
                          <TableRow key={u.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer" onClick={() => navigate(`/units/${u.id}`)}>
                            {/* حالة الوحدة */}
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusColor}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  u.status === 'available' ? 'bg-emerald-500' :
                                  u.status === 'leased' ? 'bg-[#533afd]' :
                                  u.status === 'under_maintenance' ? 'bg-amber-500' : 'bg-gray-400'
                                }`}></span>
                                {unitLb[u.status] || u.status}
                              </span>
                            </TableCell>
                            {/* الإيجار */}
                            <TableCell>
                              <span className="text-xs font-semibold text-[#1E293B]">{fmt(u.actual_rent || u.expected_monthly_rent || 0)}</span>
                            </TableCell>
                            {/* اسم العقار */}
                            <TableCell>
                              <span className="text-xs text-[#64748d]">{prop?.property_name || '—'}</span>
                            </TableCell>
                            {/* اسم الوحدة */}
                            <TableCell>
                              <span className="text-xs font-medium text-[#1E293B]">{u.unit_code}</span>
                            </TableCell>
                            {/* كود الوحدة */}
                            <TableCell>
                              <span className="font-mono text-[12px] text-[#3B82F6] font-semibold">{u.unit_code}</span>
                            </TableCell>
                            {/* الإجراءات */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50" onClick={() => navigate(`/units/${u.id}`)}>
                                  <Eye className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-amber-50" onClick={() => navigate(`/units/${u.id}/edit`)}>
                                  <Pencil className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100">
                                  <MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
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

            {/* ===== TENANTS & CONTRACTS TAB — redesigned ===== */}
            <TabsContent value="tenants" className="m-0">
              <div className="flex flex-col lg:flex-row gap-4 p-4">

                {/* ===== MAIN COLUMN: Tenants + Contracts Tables ===== */}
                <div className="flex-1 min-w-0 space-y-4">

                  {/* ========== TENANTS CARD ========== */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#1E293B]">{t.tenants.title}</h3>
                        <p className="text-[11px] text-[#64748d] mt-0.5">قائمة جميع المستأجرين وحالة عقودهم وسدادهم</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => navigate('/tenants/create')} className="gap-1.5 bg-[#533afd] hover:bg-[#533afd] text-white h-9 text-xs rounded-lg px-4 shadow-sm shadow-[#533afd]/20">
                          <Plus className="h-3.5 w-3.5" />إضافة مستأجر
                        </Button>
                        <Button variant="outline" className="gap-1.5 h-9 text-xs rounded-lg px-3">
                          <Upload className="h-3.5 w-3.5" />استيراد
                        </Button>
                      </div>
                    </div>
                    {/* Filters */}
                    <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                      <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                        <Input
                          placeholder="ابحث عن مستأجر، هاتف، عقار أو وحدة..."
                          value={tenantSearch}
                          onChange={e => setTenantSearch(e.target.value)}
                          className="pr-9 h-9 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <Button variant="outline" className="gap-1.5 h-9 text-xs rounded-lg">
                        <Filter className="h-3.5 w-3.5" />تصفية
                      </Button>
                      {tenantSearch && (
                        <span className="text-[10px] text-[#64748d]">{filteredTenants.length} نتيجة</span>
                      )}
                    </div>
                    {/* Tenants Table */}
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.tenants.name}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.tenants.phone}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.properties.name} / {t.units.title}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">حالة العقد</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">حالة السداد</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">آخر دفعة</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">{t.common.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTenants.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-16 text-xs text-[#64748d]">
                                <div className="flex flex-col items-center gap-2">
                                  <Users className="h-8 w-8 text-gray-300" />
                                  <span>{tt('common.noData', 'لا يوجد مستأجرون')}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {filteredTenants.map(et => {
                            const tn = et.tenant;
                            const lease = et.lease;
                            const unit = et.unit;
                            const prop = et.prop;
                            const lp = et.lastPayment;
                            const initials = (tn.full_name || tn.company_name || '?').split(' ').map((s: string) => s[0]).slice(0, 2).join('');
                            const isCompany = tn.tenant_type === 'company';
                            const leaseStatus = lease?.status || 'no_contract';
                            const leaseStatusLabel: Record<string, string> = { active: 'نشط', pending_signature: 'بانتظار التوقيع', pending: 'بانتظار التوقيع', expired: 'منتهي', expiring_soon: 'ينتهي قريباً', renewed: 'مجدد', no_contract: 'بدون عقد' };
                            const leaseStatusColor: Record<string, string> = { active: 'bg-emerald-50 text-emerald-700', pending_signature: 'bg-amber-50 text-[#9b6829]', pending: 'bg-amber-50 text-[#9b6829]', expired: 'bg-gray-100 text-gray-500', expiring_soon: 'bg-orange-50 text-orange-600', renewed: 'bg-blue-50 text-blue-700', no_contract: 'bg-gray-50 text-gray-400' };
                            const paymentLabel = et.hasOverdue ? 'متأخر' : 'مدفوع';
                            const paymentColor = et.hasOverdue ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700';
                            return (
                              <TableRow key={tn.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer" onClick={() => navigate(`/tenants/${tn.id}`)}>
                                {/* الاسم */}
                                <TableCell>
                                  <div className="flex items-center gap-2.5">
                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-sm ${isCompany ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-[#533afd] to-[#7c5cfd]'}`}>
                                      {isCompany ? <Building2 className="h-3 w-3" /> : initials}
                                    </div>
                                    <span className="text-xs font-semibold text-[#1E293B] truncate">{tn.full_name || tn.company_name || '—'}</span>
                                  </div>
                                </TableCell>
                                {/* الهاتف */}
                                <TableCell className="text-xs text-[#64748d] font-mono" dir="ltr">{tn.phone || '—'}</TableCell>
                                {/* العقار / الوحدة */}
                                <TableCell>
                                  <span className="text-xs text-[#64748d]">
                                    {prop ? `${prop.property_name} - ${unit?.unit_code || ''}` : unit?.unit_code || '—'}
                                  </span>
                                </TableCell>
                                {/* حالة العقد */}
                                <TableCell>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${leaseStatusColor[leaseStatus] || 'bg-gray-50 text-gray-400'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                      leaseStatus === 'active' || leaseStatus === 'renewed' ? 'bg-emerald-500' :
                                      leaseStatus === 'pending_signature' || leaseStatus === 'pending' ? 'bg-amber-500' :
                                      leaseStatus === 'expiring_soon' ? 'bg-orange-500' :
                                      'bg-gray-400'
                                    }`}></span>
                                    {leaseStatusLabel[leaseStatus] || leaseStatus}
                                  </span>
                                </TableCell>
                                {/* حالة السداد */}
                                <TableCell>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${paymentColor}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${et.hasOverdue ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                    {paymentLabel}
                                  </span>
                                </TableCell>
                                {/* آخر دفعة */}
                                <TableCell className="text-xs text-[#64748d]">{lp?.payment_date || '—'}</TableCell>
                                {/* الإجراءات */}
                                <TableCell onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center gap-0.5">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50" onClick={() => navigate(`/tenants/${tn.id}`)}>
                                      <Eye className="h-3.5 w-3.5 text-[#64748d]" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-amber-50" onClick={() => navigate(`/tenants/${tn.id}/edit`)}>
                                      <Pencil className="h-3.5 w-3.5 text-[#64748d]" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100">
                                      <MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Footer link */}
                    <div className="px-5 py-3 border-t border-gray-50">
                      <button onClick={() => navigate('/tenants')} className="text-[12px] text-[#533afd] hover:text-[#3d2bb3] font-semibold flex items-center gap-1">
                        عرض جميع المستأجرين
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* ========== CONTRACTS CARD ========== */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#1E293B]">{t.leases.title}</h3>
                        <p className="text-[11px] text-[#64748d] mt-0.5">قائمة العقود مع المواعيد والقيم والحالة</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => navigate('/wizards/lease')} className="gap-1.5 bg-[#533afd] hover:bg-[#533afd] text-white h-9 text-xs rounded-lg px-4 shadow-sm shadow-[#533afd]/20">
                          <Plus className="h-3.5 w-3.5" />إنشاء عقد
                        </Button>
                        <Button variant="outline" className="gap-1.5 h-9 text-xs rounded-lg px-3">خيارات</Button>
                      </div>
                    </div>
                    {/* Filters */}
                    <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                      <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                        <Input
                          placeholder="ابحث عن عقد، مستأجر، عقار أو وحدة..."
                          value={contractSearch}
                          onChange={e => setContractSearch(e.target.value)}
                          className="pr-9 h-9 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <Button variant="outline" className="gap-1.5 h-9 text-xs rounded-lg">
                        <Filter className="h-3.5 w-3.5" />تصفية
                      </Button>
                    </div>
                    {/* Contracts Table */}
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.leases.contractNumber}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.leases.tenant}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.properties.name}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.leases.startDate}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.leases.endDate}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.leases.rentAmount} (QAR)</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.common.status}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">{t.common.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leases.filter(l => {
                            if (!contractSearch) return true;
                            const q = contractSearch.toLowerCase();
                            const tn = tenants.find(tn2 => tn2.id === l.tenant_id);
                            const u = units.find(un => un.id === l.unit_id);
                            const p = u ? properties.find(pr => pr.id === u.property_id) : null;
                            return (
                              (l.contract_number || '').toLowerCase().includes(q) ||
                              (tn?.full_name || tn?.company_name || '').toLowerCase().includes(q) ||
                              (u?.unit_code || '').toLowerCase().includes(q) ||
                              (p?.property_name || '').toLowerCase().includes(q)
                            );
                          }).slice(0, 10).map(l => {
                            const tenant = tenants.find(tn => tn.id === l.tenant_id);
                            const u = units.find(un => un.id === l.unit_id);
                            const prop = u ? properties.find(p => p.id === u.property_id) : null;
                            const lStatus = l.status;
                            const statusLabel: Record<string, string> = { active: 'نشط', pending_signature: 'بانتظار التوقيع', pending: 'بانتظار التوقيع', expired: 'منتهي', expiring_soon: 'ينتهي قريباً', renewed: 'مجدد' };
                            const statusColor: Record<string, string> = { active: 'bg-emerald-50 text-emerald-700', pending_signature: 'bg-amber-50 text-[#9b6829]', pending: 'bg-amber-50 text-[#9b6829]', expired: 'bg-gray-100 text-gray-500', expiring_soon: 'bg-orange-50 text-orange-600', renewed: 'bg-blue-50 text-blue-700' };
                            return (
                              <TableRow key={l.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer" onClick={() => navigate(`/leases/${l.id}`)}>
                                {/* رقم العقد */}
                                <TableCell>
                                  <span className="font-mono text-[11px] text-[#3B82F6] font-semibold">{l.contract_number || l.id?.slice(0, 10)}</span>
                                </TableCell>
                                {/* المستأجر */}
                                <TableCell className="text-xs font-medium text-[#1E293B]">{tenant?.full_name || tenant?.company_name || '—'}</TableCell>
                                {/* العقار */}
                                <TableCell className="text-xs text-[#64748d]">{prop?.property_name || u?.unit_code || '—'}</TableCell>
                                {/* تاريخ البداية */}
                                <TableCell className="text-xs text-[#64748d]">{l.start_date || '—'}</TableCell>
                                {/* تاريخ النهاية */}
                                <TableCell className="text-xs text-[#64748d]">{l.end_date || '—'}</TableCell>
                                {/* الإيجار */}
                                <TableCell className="text-xs font-semibold text-[#1E293B]">{fmt(l.rent_amount || 0)}</TableCell>
                                {/* الحالة */}
                                <TableCell>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusColor[lStatus] || 'bg-gray-50 text-gray-500'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                      lStatus === 'active' || lStatus === 'renewed' ? 'bg-emerald-500' :
                                      lStatus === 'pending_signature' || lStatus === 'pending' ? 'bg-amber-500' :
                                      lStatus === 'expiring_soon' ? 'bg-orange-500' :
                                      'bg-gray-400'
                                    }`}></span>
                                    {statusLabel[lStatus] || lStatus}
                                  </span>
                                </TableCell>
                                {/* الإجراءات */}
                                <TableCell onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center gap-0.5">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50" onClick={() => navigate(`/leases/${l.id}`)}>
                                      <Eye className="h-3.5 w-3.5 text-[#64748d]" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-amber-50">
                                      <Pencil className="h-3.5 w-3.5 text-[#64748d]" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100">
                                      <MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {leases.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-16 text-xs text-[#64748d]">
                                <div className="flex flex-col items-center gap-2">
                                  <FileText className="h-8 w-8 text-gray-300" />
                                  <span>{tt('common.noData', 'لا توجد عقود')}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Footer link */}
                    <div className="px-5 py-3 border-t border-gray-50">
                      <button onClick={() => navigate('/leases')} className="text-[12px] text-[#533afd] hover:text-[#3d2bb3] font-semibold flex items-center gap-1">
                        عرض جميع العقود
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                    </div>
                  </div>

                </div>

                {/* ===== RIGHT SIDEBAR: Summary Cards ===== */}
                <div className="w-full lg:w-[280px] shrink-0 space-y-4">
                  {/* Panel header */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <h3 className="text-sm font-bold text-[#1E293B]">{t.tenants.title}</h3>
                    <p className="text-[11px] text-[#64748d] mt-1">ملخص سريع لحالة المستأجرين</p>
                  </div>

                  {/* Mini Card 1 — pending signatures */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[rgba(83,58,253,0.08)] flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-[#533afd]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-[#1E293B]">{pendingSignatures}</div>
                      <div className="text-[11px] text-[#64748d]">عقود بانتظار التوقيع</div>
                      <div className="text-[10px] text-[#94a3b8]">من إجمالي العقود</div>
                    </div>
                  </div>

                  {/* Mini Card 2 — expiring soon */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-[#1E293B]">{expiringSoon}</div>
                      <div className="text-[11px] text-[#64748d]">عقود تحتاج تجديد</div>
                      <div className="text-[10px] text-[#94a3b8]">خلال 30 يوم</div>
                    </div>
                  </div>

                  {/* Mini Card 3 — overdue tenants */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-[#1E293B]">{tenantsWithOverdue}</div>
                      <div className="text-[11px] text-[#64748d]">مستأجرون متأخرون</div>
                      <div className="text-[10px] text-[#94a3b8]">متأخرون في السداد</div>
                    </div>
                  </div>

                  {/* Monthly rent summary */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Wallet className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-emerald-600">{fmt(monthlyRent)}</div>
                      <div className="text-[11px] text-[#64748d]">التحصيل الشهري</div>
                      <div className="text-[10px] text-[#94a3b8]">العقود النشطة</div>
                    </div>
                  </div>
                </div>

              </div>
            </TabsContent>

            {/* ===== COLLECTIONS TAB — redesigned ===== */}
            <TabsContent value="collections" className="m-0">
              <div className="p-4 space-y-4">

                {/* ===== COLLECTION KPI CARDS ===== */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Card 1 — إجمالي الفواتير */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[rgba(83,58,253,0.08)] flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-[#533afd]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#64748d]">إجمالي الفواتير</div>
                      <div className="text-[15px] font-bold text-[#1E293B]">{fmt(totalInvoiced)}</div>
                      <div className="text-[10px] text-[#94a3b8]">{invoices.length} فاتورة</div>
                    </div>
                  </div>
                  {/* Card 2 — المبالغ المستحقة */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Receipt className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#64748d]">المبالغ المستحقة</div>
                      <div className="text-[15px] font-bold text-[#1E293B]">{fmt(totalDue)}</div>
                      <div className="text-[10px] text-[#94a3b8]">{invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length} فاتورة</div>
                    </div>
                  </div>
                  {/* Card 3 — المتأخرات */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#64748d]">المتأخرات</div>
                      <div className="text-[15px] font-bold text-red-600">{fmt(totalOverdue)}</div>
                      <div className="text-[10px] text-[#94a3b8]">{overdueInvs.length} مستأجر متأخر</div>
                    </div>
                  </div>
                  {/* Card 4 — المستحق اليوم */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#64748d]">المستحق اليوم</div>
                      <div className="text-[15px] font-bold text-[#1E293B]">{fmt(dueToday.reduce((s, i) => s + (i.balance || 0), 0))}</div>
                      <div className="text-[10px] text-[#94a3b8]">{dueToday.length} فواتير</div>
                    </div>
                  </div>
                  {/* Card 5 — تم التحصيل */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Wallet className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#64748d]">تم التحصيل هذا الشهر</div>
                      <div className="text-[15px] font-bold text-emerald-600">{fmt(collected)}</div>
                      <div className="text-[10px] text-[#94a3b8]">نسبة التحصيل {collectionRate}%</div>
                    </div>
                  </div>
                </div>

                {/* ===== QUICK ACTIONS ===== */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <h3 className="text-sm font-bold text-[#1E293B] mb-3">إجراءات سريعة</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <button onClick={() => navigate('/wizards/payment')} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors text-right">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Plus className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-[#1E293B]">تسجيل دفعة</div>
                        <div className="text-[10px] text-[#94a3b8]">إضافة دفعة لمستأجر</div>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors text-right">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-[#1E293B]">إرسال تذكير</div>
                        <div className="text-[10px] text-[#94a3b8]">إرسال تذكير دفع</div>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-colors text-right">
                      <div className="h-9 w-9 rounded-lg bg-[rgba(83,58,253,0.08)] flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-[#533afd]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-[#1E293B]">إنشاء فاتورة</div>
                        <div className="text-[10px] text-[#94a3b8]">إصدار فاتورة جديدة</div>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 transition-colors text-right">
                      <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                        <Printer className="h-4 w-4 text-teal-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-[#1E293B]">طباعة إيصال</div>
                        <div className="text-[10px] text-[#94a3b8]">طباعة إيصال دفعة</div>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-colors text-right">
                      <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                        <BarChart3 className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-[#1E293B]">تقرير التحصيل</div>
                        <div className="text-[10px] text-[#94a3b8]">عرض تقرير التحصيل</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ===== FILTER BAR ===== */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input placeholder="ابحث عن مستأجر، عقد، فاتورة..." className="pr-9 h-9 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="h-9 text-xs rounded-lg border-gray-200 w-[160px]">
                      <SelectValue placeholder="كل العقارات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل العقارات</SelectItem>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="h-9 text-xs rounded-lg border-gray-200 w-[140px]">
                      <SelectValue placeholder="كل الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="paid">مدفوع</SelectItem>
                      <SelectItem value="pending">معلق</SelectItem>
                      <SelectItem value="overdue">متأخر</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="gap-1.5 h-9 text-xs rounded-lg">
                    <Download className="h-3.5 w-3.5" />تصدير
                  </Button>
                </div>

                {/* ===== TWO-COLUMN: Due Today + Overdue ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                  {/* ===== DUE TODAY TABLE (wider) ===== */}
                  <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#1E293B]">المستحق اليوم</h3>
                          <p className="text-[11px] text-[#64748d]">الفواتير المطلوب تحصيلها اليوم</p>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الفاتورة</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.tenants.name}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.rentCollection.dueDate}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.common.amount}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[110px]">إجراء</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dueToday.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-12 text-xs text-[#64748d]">
                                <Clock className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                                {tt('common.noData', 'لا توجد فواتير مستحقة اليوم')}
                              </TableCell>
                            </TableRow>
                          )}
                          {dueToday.map(inv => {
                            const tenant = tenants.find(tn => tn.id === inv.tenant_id);
                            const lease = leases.find(l => l.id === inv.lease_id);
                            const u = lease ? units.find(un => un.id === lease.unit_id) : null;
                            const p = u ? properties.find(pr => pr.id === u.property_id) : null;
                            return (
                              <TableRow key={inv.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer">
                                <TableCell>
                                  <span className="font-mono text-[11px] text-[#3B82F6] font-semibold">{inv.invoice_number || inv.id?.slice(0, 10)}</span>
                                </TableCell>
                                <TableCell className="text-xs font-medium text-[#1E293B]">{tenant?.full_name || tenant?.company_name || '—'}</TableCell>
                                <TableCell className="text-xs text-[#64748d]">{inv.due_date || '—'}{p ? ` · ${p.property_name}` : ''}</TableCell>
                                <TableCell className="text-xs font-bold text-[#1E293B]">{fmt(inv.balance || inv.total)}</TableCell>
                                <TableCell>
                                  <button onClick={() => navigate('/wizards/payment')} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                                    <Plus className="h-3 w-3" />تسجيل دفعة
                                  </button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {dueToday.length > 0 && (
                      <div className="px-5 py-3 border-t border-gray-50">
                        <button className="text-[12px] text-[#533afd] hover:text-[#3d2bb3] font-semibold">عرض جميع المستحق اليوم</button>
                      </div>
                    )}
                  </div>

                  {/* ===== TOP OVERDUE TABLE (narrower) ===== */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#1E293B]">أكبر المتأخرات</h3>
                          <p className="text-[11px] text-[#64748d]">المستأجرون الأكثر تأخراً في السداد</p>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.tenants.name}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.common.amount}</TableHead>
                            <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[100px]">إجراء</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topOverdue.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-12 text-xs text-[#64748d]">
                                {tt('common.noData', 'لا توجد متأخرات')}
                              </TableCell>
                            </TableRow>
                          )}
                          {topOverdue.map(inv => {
                            const tenant = tenants.find(tn => tn.id === inv.tenant_id);
                            const daysLate = inv.due_date ? Math.max(0, Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))) : 0;
                            return (
                              <TableRow key={inv.id} className="hover:bg-red-50/30 cursor-pointer">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                      <span className="text-[10px] font-bold text-red-500">{tenant?.full_name?.[0] || tenant?.company_name?.[0] || '?'}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-semibold text-[#1E293B] truncate">{tenant?.full_name || tenant?.company_name || '—'}</div>
                                      <div className="text-[10px] text-red-500">{daysLate} يوم</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs font-bold text-red-600">{fmt(inv.balance || inv.total)}</TableCell>
                                <TableCell>
                                  <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[rgba(83,58,253,0.08)] text-[#533afd] hover:bg-[rgba(83,58,253,0.15)] transition-colors whitespace-nowrap">
                                    <MessageSquare className="h-3 w-3" />تذكير
                                  </button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-50">
                      <button className="text-[12px] text-[#533afd] hover:text-[#3d2bb3] font-semibold">عرض جميع المتأخرات</button>
                    </div>
                  </div>

                </div>

                {/* ===== RECEIPTS TABLE ===== */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-[#1E293B]">{tt('rentCollection.latest_receipts', 'آخر الإيصالات')}</h3>
                  </div>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.rentCollection.receiptNumber}</TableHead>
                          <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.tenants.name}</TableHead>
                          <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.common.amount}</TableHead>
                          <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.rentCollection.paymentMethod}</TableHead>
                          <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">{t.common.date}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receipts.slice(-10).reverse().map(rec => {
                          const tenant = tenants.find(tn => tn.id === rec.tenant_id);
                          return (
                            <TableRow key={rec.id} className="hover:bg-[rgba(83,58,253,0.03)]">
                              <TableCell className="font-mono text-[11px] text-[#3B82F6] font-semibold">{rec.receipt_number || rec.id?.slice(0, 8)}</TableCell>
                              <TableCell className="text-xs text-[#1E293B]">{tenant?.full_name || tenant?.company_name || '—'}</TableCell>
                              <TableCell className="text-xs font-bold text-emerald-600">{fmt(rec.amount)}</TableCell>
                              <TableCell className="text-xs text-[#64748d]">{rec.payment_method === 'cash' ? t.rentCollection.methods.cash : rec.payment_method === 'bank_transfer' ? tt('rentCollection.transfer_short', 'تحويل') : rec.payment_method}</TableCell>
                              <TableCell className="text-xs text-[#64748d]">{rec.payment_date}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
