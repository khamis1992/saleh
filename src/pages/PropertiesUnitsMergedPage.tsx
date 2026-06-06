import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, Home, TrendingUp, MapPin, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { propertyStore, unitStore } from '@/services/stores';

const unitStatus: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-700', leased: 'bg-[rgba(83,58,253,0.06)] text-[#533afd]',
  under_maintenance: 'bg-amber-50 text-[#9b6829]', reserved: 'bg-violet-50 text-violet-700',
  sold: 'bg-gray-100 text-[#64748d]', blocked: 'bg-red-50 text-[#ea2261]',
};
const propStatus: Record<string, string> = {
  ready_for_leasing: 'bg-emerald-50 text-emerald-700', under_construction: 'bg-amber-50 text-[#9b6829]',
  fully_leased: 'bg-[rgba(83,58,253,0.06)] text-[#533afd]', partially_leased: 'bg-violet-50 text-violet-700',
};
const propLabels: Record<string, string> = {
  ready_for_leasing: 'جاهز', under_construction: 'قيد الإنشاء', fully_leased: 'مؤجر بالكامل', partially_leased: 'مؤجر جزئياً',
};

export default function PropertiesUnitsMergedPage() {
  const { t, tt, dir } = useLocale();
  const navigate = useNavigate();
  const [refresh] = useState(0);

  const unitLabels = useMemo(() => ({
    available: t.units.statuses.available || tt('units.statuses.available','متاحة'), leased: t.units.statuses.leased || tt('units.statuses.leased','مؤجرة'), under_maintenance: 'صيانة', reserved: 'محجوزة', sold: 'مباعة', blocked: 'محظورة',
  } as Record<string, string>), []);

  const properties = useMemo(() => propertyStore.getAll(), [refresh]);
  const units = useMemo(() => unitStore.getAll(), [refresh]);

  const totalUnits = units.length;
  const leased = units.filter(u => u.status === 'leased').length;
  const available = units.filter(u => u.status === 'available').length;
  const underMaint = units.filter(u => u.status === 'under_maintenance').length;
  const occupancyRate = totalUnits > 0 ? Math.round((leased / totalUnits) * 100) : 0;

  return (
    <div className="bg-[#f6f9fc] min-h-full" dir={dir}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748d]">{t.properties.title}</div>
                <div className="text-2xl font-bold mt-1 text-[#533afd]">{properties.length}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[rgba(83,58,253,0.06)] flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#533afd]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748d]">{t.units.title}</div>
                <div className="text-2xl font-bold mt-1 text-violet-600">{totalUnits}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Home className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748d]">{t.dashboard.occupancyRate}</div>
                <div className="text-2xl font-bold mt-1 text-emerald-600">{occupancyRate}%</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#64748d]">{t.units.statuses.available}</div>
                <div className="text-2xl font-bold mt-1 text-emerald-600">{available}</div>
                <div className="text-[12px] text-[#64748d]">{underMaint} {t.units.statuses.under_maintenance}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="properties" className="w-full" dir={dir}>
            <div className="px-4 pt-4 border-b border-[#e5edf5]">
              <TabsList className="h-9 bg-transparent gap-0 p-0">
                <TabsTrigger value="properties" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3">
                  <Building2 className="h-3.5 w-3.5 ml-1" /> {t.properties.title}
                </TabsTrigger>
                <TabsTrigger value="units" className="h-9 text-xs data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] rounded-lg px-3">
                  <Home className="h-3.5 w-3.5 ml-1" /> {t.units.title}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="properties" className="m-0">
              <div className="flex items-center gap-2 p-4 pb-0">
                <Button onClick={() => navigate('/properties/create')} className="gap-2 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg">
                  <Plus className="h-3.5 w-3.5" /> {t.properties.create}
                </Button>
              </div>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{t.properties.name}</TableHead>
                      <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{t.properties.type}</TableHead>
                      <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{t.properties.address}</TableHead>
                      <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{t.units.title}</TableHead>
                      <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{t.common.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map(p => {
                      const pu = units.filter(u => u.property_id === p.id);
                      const rate = pu.length > 0 ? Math.round((pu.filter(u => u.status === 'leased').length / pu.length) * 100) : 0;
                      return (
                        <TableRow key={p.id} className="hover:bg-[rgba(83,58,253,0.06)]/30 cursor-pointer" onClick={() => navigate(`/properties/${p.id}`)}>
                          <TableCell>
                            <div className="font-medium text-sm">{p.property_name}</div>
                            <div className="text-[12px] text-[#64748d]">{p.property_code}</div>
                          </TableCell>
                          <TableCell className="text-sm text-[#64748d]">{p.property_type?.includes('residential') ? t.properties.types.residential_building : p.property_type?.includes('commercial') ? t.properties.types.commercial_building : p.property_type || '—'}</TableCell>
                          <TableCell className="text-sm text-[#64748d]">{(p as any).city || (p as any).district || '—'}</TableCell>
                          <TableCell className="text-sm">{pu.length} {t.units.title} · {rate}% {t.dashboard.occupancyRate}</TableCell>
                          <TableCell>
                            <Badge className={`text-[12px] ${propStatus[p.status] || ''}`}>{propLabels[p.status] || p.status}</Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/properties/${p.id}`)}><Eye className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/properties/${p.id}/edit`)}><Pencil className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="units" className="m-0">
              <div className="flex items-center gap-2 p-4 pb-0">
                <Button onClick={() => navigate('/units/create')} className="gap-2 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg">
                  <Plus className="h-3.5 w-3.5" /> {t.units.create}
                </Button>
              </div>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{t.units.title}</TableHead>
                      <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{t.properties.name}</TableHead>
                      <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{t.units.type}</TableHead>
                      <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{t.units.rent}</TableHead>
                      <TableHead className="text-[12px] font-bold text-[#64748d] h-9">{t.common.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.slice(0, 40).map(u => {
                      const prop = properties.find(p => p.id === u.property_id);
                      return (
                        <TableRow key={u.id} className="hover:bg-[rgba(83,58,253,0.06)]/30 cursor-pointer" onClick={() => navigate(`/units/${u.id}`)}>
                          <TableCell>
                            <div className="font-medium text-sm">{u.unit_code}</div>
                          </TableCell>
                          <TableCell className="text-sm text-[#64748d]">{prop?.property_name || '—'}</TableCell>
                          <TableCell className="text-sm text-[#64748d]">{u.unit_type === 'apartment' ? t.units.types.apartment : u.unit_type === 'villa' ? t.units.types.villa : u.unit_type === 'shop' ? t.units.types.shop : u.unit_type || '—'}</TableCell>
                          <TableCell className="text-sm font-medium">{u.actual_rent || u.expected_monthly_rent || 0}</TableCell>
                          <TableCell>
                            <Badge className={`text-[12px] ${unitStatus[u.status] || ''}`}>{unitLabels[u.status] || u.status}</Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/units/${u.id}`)}><Eye className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/units/${u.id}/edit`)}><Pencil className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
