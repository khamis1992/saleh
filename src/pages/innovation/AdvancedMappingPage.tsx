import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mapLayerStore, mapLocationStore } from '@/services/stores';
import { formatDate } from '@/lib/format';
import {
  Map, Layers, MapPin, Activity, Globe, Navigation, Building2,
  Eye, EyeOff, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MapLayer, MapLocation } from '@/types/phase8';

// ── Labels & Badges ──────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  mapbox: 'Mapbox',
  google: 'Google Maps',
  esri: 'ESRI ArcGIS',
  tomtom: 'TomTom',
  what3words: 'What3Words',
};

const PROVIDER_COLORS: Record<string, string> = {
  mapbox: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  google: 'bg-red-100 text-[#ea2261]',
  esri: 'bg-violet-100 text-violet-700',
  tomtom: 'bg-emerald-100 text-emerald-700',
  what3words: 'bg-amber-100 text-[#9b6829]',
};

const LAYER_TYPE_LABELS: Record<string, string> = {
  tiles: 'طبقات التجانب',
  vector: 'طبقات متجهة',
  heatmap: 'خريطة حرارية',
  cluster: 'تجميع',
  '3d_buildings': 'مباني ثلاثية الأبعاد',
  satellite: 'قمر صناعي',
  traffic: 'حركة المرور',
  demographics: 'ديموغرافية',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  land: 'أرض',
  project: 'مشروع',
  property: 'عقار',
  unit: 'وحدة',
  contractor: 'مقاول',
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  land: 'bg-emerald-100 text-emerald-700',
  project: 'bg-amber-100 text-[#9b6829]',
  property: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  unit: 'bg-violet-100 text-violet-700',
  contractor: 'bg-gray-100 text-gray-700',
};

// ── Component ────────────────────────────────────────────────

export default function AdvancedMappingPage() {
  const { dir } = useLocale();
  const [layers, setLayers] = useState<MapLayer[]>(() => mapLayerStore.getAll());
  const [locations, setLocations] = useState<MapLocation[]>(() => mapLocationStore.getAll());

  const refresh = () => {
    setLayers(mapLayerStore.getAll());
    setLocations(mapLocationStore.getAll());
  };

  const toggleLayer = (layer: MapLayer) => {
    mapLayerStore.update(layer.id, {
      ...layer,
      is_active: !layer.is_active,
    } as any);
    refresh();
    toast.success(layer.is_active ? `تم تعطيل ${layer.layer_name}` : `تم تفعيل ${layer.layer_name}`);
  };

  const stats = useMemo(() => {
    const totalLayers = layers.length;
    const activeLayers = layers.filter(l => l.is_active).length;
    const totalLocations = locations.length;
    const landLocations = locations.filter(l => l.entity_type === 'land').length;
    return { totalLayers, activeLayers, totalLocations, landLocations };
  }, [layers, locations]);

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="الخرائط المتقدمة — GIS & Mapping"
        description="تكوين طبقات الخرائط وإدارة المواقع الجغرافية وتحليلات الخرائط الحرارية"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="الطبقات"
          value={stats.totalLayers}
          icon={<Layers className="h-5 w-5" />}
          color="blue"
        />
        <KpiCard
          label="نشطة"
          value={stats.activeLayers}
          icon={<Eye className="h-5 w-5" />}
          color="green"
        />
        <KpiCard
          label="المواقع"
          value={stats.totalLocations}
          icon={<MapPin className="h-5 w-5" />}
          color="violet"
        />
        <KpiCard
          label={t.lands.title || tt('lands.title','الأراضي')}
          value={stats.landLocations}
          icon={<Globe className="h-5 w-5" />}
          color="amber"
        />
      </div>

      <Tabs defaultValue="layers" dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="layers">الطبقات ({layers.length})</TabsTrigger>
          <TabsTrigger value="locations">المواقع ({locations.length})</TabsTrigger>
        </TabsList>

        {/* Layers Tab */}
        <TabsContent value="layers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {layers.map(layer => (
              <Card key={layer.id} className={`hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow ${!layer.is_active ? 'opacity-70' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Layers className="h-4 w-4 text-[#533afd]" />
                        <span>{layer.layer_name}</span>
                      </CardTitle>
                      <p className="text-xs text-[#64748d] mt-1">
                        {PROVIDER_LABELS[layer.provider] || layer.provider}
                      </p>
                    </div>
                    <Badge className={PROVIDER_COLORS[layer.provider] || 'bg-gray-100'}>
                      {PROVIDER_LABELS[layer.provider] || layer.provider}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">تفعيل الطبقة</span>
                      <div className="flex items-center gap-2">
                        {layer.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <ToggleRight className="h-3.5 w-3.5" /> نشط
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-200 text-[#64748d] flex items-center gap-1">
                            <ToggleLeft className="h-3.5 w-3.5" /> غير نشط
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => toggleLayer(layer)}
                        >
                          {layer.is_active ? 'تعطيل' : 'تفعيل'}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#f6f9fc] rounded-lg p-2">
                        <p className="text-[#64748d]">مستوى z</p>
                        <p className="font-bold">{layer.z_index}</p>
                      </div>
                      <div className="bg-[#f6f9fc] rounded-lg p-2">
                        <p className="text-[#64748d]">الشفافية</p>
                        <p className="font-bold">{Math.round(layer.opacity * 100)}%</p>
                      </div>
                    </div>

                    <div className="text-xs text-[#64748d] pt-2 border-t">
                      النوع:{' '}
                      <Badge variant="secondary" className="text-xs">
                        {LAYER_TYPE_LABELS[layer.layer_type] || layer.layer_type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#ea2261]" />
                المواقع الجغرافية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{tt('equipment.equipmentType', 'النوع')}</TableHead>
                    <TableHead className="text-right">التسمية</TableHead>
                    <TableHead className="text-right">خط العرض</TableHead>
                    <TableHead className="text-right">خط الطول</TableHead>
                    <TableHead className="text-right">What3Words</TableHead>
                    <TableHead className="text-right">نصف القطر (م)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map(loc => (
                    <TableRow key={loc.id}>
                      <TableCell>
                        <Badge className={ENTITY_TYPE_COLORS[loc.entity_type] || 'bg-gray-100'}>
                          {ENTITY_TYPE_LABELS[loc.entity_type] || loc.entity_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{loc.label}</TableCell>
                      <TableCell className="text-xs font-mono">{loc.lat.toFixed(4)}</TableCell>
                      <TableCell className="text-xs font-mono">{loc.lng.toFixed(4)}</TableCell>
                      <TableCell className="text-xs font-mono text-[#533afd]">{loc.w3w_address}</TableCell>
                      <TableCell className="text-xs">{loc.radius_m}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
