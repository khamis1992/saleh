import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Plus, Eye, Pencil, TrendingUp } from 'lucide-react';
import { formatQARInt } from '@/lib/format';
import { tenantStore, leaseStore, unitStore } from '@/services/stores';

const fmt = formatQARInt;

export default function TenantsLeasesMergedPage() {
  const { t, tt, dir } = useLocale();
  const navigate = useNavigate();
  const [r] = useState(0);

  const leaseLabels = useMemo(() => ({
    active: t.leases.statuses.active || 'نشط',
    expiring_soon: 'ينتهي قريباً',
    terminated: t.leases.statuses.terminated || 'منتهي',
  } as Record<string, string>), []);

  const tenants = useMemo(() => tenantStore.getAll(), [r]);
  const leases = useMemo(() => leaseStore.getAll(), [r]);
  const units = useMemo(() => unitStore.getAll(), [r]);

  const getUnitCode = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    return unit?.unit_code || '—';
  };

  const activeLeases = leases.filter(l => l.status === 'active');
  const expiringSoon = leases.filter(l => ['expiring_soon', 'pending_signature'].includes(l.status));

  return (
    <div className="bg-[#f6f9fc] min-h-full" dir={dir}>
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card><CardContent className="p-3">
          <div className="text-xs text-[#64748d]">{t.tenants.title}</div>
          <div className="text-xl font-bold">{tenants.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-[#64748d]">{t.leases.title}</div>
          <div className="text-xl font-bold">{leases.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-[#64748d]">{tt('leases.active_leases','عقود نشطة')}</div>
          <div className="text-xl font-bold text-emerald-600">{activeLeases.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-[#64748d]">{tt('leases.expiring_soon','تنتهي قريباً')}</div>
          <div className="text-xl font-bold text-amber-500">{expiringSoon.length}</div>
        </CardContent></Card>
      </div>

      {/* Tabs: Tenants | Leases */}
      <Card><CardContent className="p-0">
        <Tabs defaultValue="tenants" className="w-full" dir={dir}>
          <div className="px-4 pt-3 border-b border-[#e5edf5]">
            <TabsList className="h-9 bg-transparent gap-0 p-0">
              <TabsTrigger value="tenants" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3">
                <Users className="h-3.5 w-3.5 ml-1" />{t.tenants.title}
              </TabsTrigger>
              <TabsTrigger value="leases" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3">
                <FileText className="h-3.5 w-3.5 ml-1" />{t.leases.title}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tenants tab */}
          <TabsContent value="tenants" className="m-0">
            <div className="flex items-center gap-2 p-4 pb-0">
              <Button onClick={() => navigate('/tenants/create')} className="gap-2 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg">
                <Plus className="h-3.5 w-3.5" /> {tt('tenants.new', 'إضافة مستأجر')}
              </Button>
            </div>
            <div className="overflow-auto p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold text-[#64748d] h-9">{t.tenants.name}</TableHead>
                    <TableHead className="text-xs font-bold text-[#64748d] h-9">{t.tenants.type}</TableHead>
                    <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('hr.phone', 'رقم الجوال')}</TableHead>
                    <TableHead className="text-xs font-bold text-[#64748d] h-9">البريد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.slice(0, 40).map(tn => (
                    <TableRow key={tn.id} className="hover:bg-[rgba(83,58,253,0.06)]/30 cursor-pointer" onClick={() => navigate(`/tenants/${tn.id}`)}>
                      <TableCell>
                        <div className="font-medium text-sm">{tn.full_name || tn.company_name}</div>
                      </TableCell>
                      <TableCell className="text-sm text-[#64748d]">{tn.tenant_type === 'individual' ? 'فرد' : 'شركة'}</TableCell>
                      <TableCell className="text-sm font-mono text-[#64748d]">{tn.phone}</TableCell>
                      <TableCell className="text-sm text-[#64748d]">{tn.email || '—'}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/tenants/${tn.id}`)}><Eye className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/tenants/${tn.id}/edit`)}><Pencil className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Leases tab */}
          <TabsContent value="leases" className="m-0">
            <div className="flex items-center gap-2 p-4 pb-0">
              <Button onClick={() => navigate('/wizards/lease')} className="gap-2 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg">
                <Plus className="h-3.5 w-3.5" /> عقد جديد
              </Button>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold text-[#64748d] h-9">العقد</TableHead>
                    <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('leases.tenant', 'المستأجر')}</TableHead>
                    <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('system.module', 'الوحدة')}</TableHead>
                    <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('units.rent', 'الإيجار')}</TableHead>
                    <TableHead className="text-xs font-bold text-[#64748d] h-9">النهاية</TableHead>
                    <TableHead className="text-xs font-bold text-[#64748d] h-9">{tt('legal.status', 'الحالة')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leases.slice(0, 40).map(l => {
                    const tenant = tenants.find(tn => tn.id === l.tenant_id);
                    const st = l.status === 'active' ? 'bg-emerald-50 text-emerald-700' : l.status === 'expiring_soon' ? 'bg-amber-50 text-[#9b6829]' : 'bg-[#f6f9fc] text-[#64748d]';
                    return (
                      <TableRow key={l.id} className="hover:bg-[rgba(83,58,253,0.06)]/30 cursor-pointer" onClick={() => navigate(`/leases/${l.id}`)}>
                        <TableCell className="text-sm font-mono">{l.contract_number || l.id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{tenant?.full_name || tenant?.company_name || '—'}</TableCell>
                        <TableCell className="text-sm text-[#64748d]">{getUnitCode(l.unit_id)}</TableCell>
                        <TableCell className="text-sm font-bold">{fmt(l.rent_amount)}</TableCell>
                        <TableCell className="text-sm text-[#64748d]">{l.end_date}</TableCell>
                        <TableCell><Badge className={`text-xs ${st}`}>{leaseLabels[l.status] || l.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent></Card>
    </div>
  );
}
