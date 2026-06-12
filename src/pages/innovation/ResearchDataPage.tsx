import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { researchDatasetStore, marketIndicatorStore } from '@/services/stores';
import { formatQAR, formatDate, formatPercent, formatCompact } from '@/lib/format';
import {
  Database, Globe, Layers, Clock, ArrowUp, ArrowDown,
  TrendingUp, TrendingDown, MapPin, Building2, Activity,
} from 'lucide-react';
import type { ResearchDataset, MarketIndicator, ResearchSource } from '@/types/phase8';

// ── Labels ────────────────────────────────────────────────────

const SOURCE_LABELS: Record<ResearchSource, string> = {
  world_bank: 'البنك الدولي',
  imf: 'صندوق النقد الدولي',
  trading_economics: 'Trading Economics',
  numbeo: 'Numbeo',
  oecd: 'OECD',
  un_data: 'UN Data',
  opendata: 'Open Data',
};

const SOURCE_COLORS: Record<string, string> = {
  world_bank: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  imf: 'bg-indigo-100 text-indigo-700',
  trading_economics: 'bg-emerald-100 text-emerald-700',
  numbeo: 'bg-amber-100 text-[#9b6829]',
  oecd: 'bg-violet-100 text-violet-700',
  un_data: 'bg-cyan-100 text-cyan-700',
  opendata: 'bg-gray-100 text-gray-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  gdp: 'الناتج المحلي',
  population: 'السكان',
  infrastructure: 'البنية التحتية',
  housing: 'الإسكان',
  employment: 'التوظيف',
  inflation: 'التضخم',
  property_prices: 'أسعار العقارات',
  construction_costs: 'تكاليف البناء',
  demographics: 'التركيبة السكانية',
  custom: t.leases.frequencies.custom || tt('leases.frequencies.custom','مخصص'),
};

const CATEGORY_COLORS: Record<string, string> = {
  gdp: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  population: 'bg-violet-100 text-violet-700',
  infrastructure: 'bg-cyan-100 text-cyan-700',
  housing: 'bg-amber-100 text-[#9b6829]',
  employment: 'bg-emerald-100 text-emerald-700',
  inflation: 'bg-red-100 text-[#ea2261]',
  property_prices: 'bg-orange-100 text-orange-700',
  construction_costs: 'bg-gray-100 text-gray-700',
  demographics: 'bg-indigo-100 text-indigo-700',
  custom: 'bg-pink-100 text-pink-700',
};

// ── Source Descriptions ──────────────────────────────────────

interface SourceInfo {
  name: string;
  description: string;
  icon: string;
}

const SOURCE_INFO: Record<ResearchSource, SourceInfo> = {
  world_bank: {
    name: 'البنك الدولي',
    description: 'قاعدة بيانات المؤشرات العالمية — GDP، التضخم، البنية التحتية، والسكان. مصدر رئيسي للبيانات الاقتصادية الموثوقة.',
    icon: '🌐',
  },
  imf: {
    name: 'صندوق النقد الدولي',
    description: 'تقارير الاستقرار المالي والاقتصادي العالمي. يوفر توقعات النمو والاستثمار العقاري حسب المنطقة.',
    icon: '🏦',
  },
  trading_economics: {
    name: 'Trading Economics',
    description: 'مؤشرات السوق في الوقت الفعلي — أسعار العقارات، تكاليف البناء، والإيجارات لأكثر من 200 دولة.',
    icon: '📊',
  },
  numbeo: {
    name: 'Numbeo',
    description: 'أكبر قاعدة بيانات لتكاليف المعيشة وأسعار العقارات حسب المدن. بيانات محدثة من مساهمات المستخدمين.',
    icon: '🏠',
  },
  oecd: {
    name: 'OECD',
    description: 'منظمة التعاون الاقتصادي — تقارير الإسكان والتطوير العمراني والسياسات العقارية في الدول المتقدمة.',
    icon: '🏛️',
  },
  un_data: {
    name: 'UN Data',
    description: 'بوابة بيانات الأمم المتحدة — إحصاءات سكانية وعمرانية شاملة.',
    icon: '🇺🇳',
  },
  opendata: {
    name: 'Open Data',
    description: 'بوابات البيانات المفتوحة الحكومية — سجلات عقارية وتراخيص بناء.',
    icon: '📂',
  },
};

// ── Component ────────────────────────────────────────────────

export default function ResearchDataPage() {
  const { dir } = useLocale();
  const [datasets, setDatasets] = useState<ResearchDataset[]>(() => researchDatasetStore.getAll());
  const [indicators, setIndicators] = useState<MarketIndicator[]>(() => marketIndicatorStore.getAll());
  const [activeTab, setActiveTab] = useState('datasets');

  const refresh = () => {
    setDatasets(researchDatasetStore.getAll());
    setIndicators(marketIndicatorStore.getAll());
  };

  const stats = useMemo(() => {
    const totalDatasets = datasets.length;
    const totalMarkets = indicators.length;
    const totalSources = new Set(datasets.map(d => d.source)).size;
    const latestFetched = datasets.length > 0
      ? datasets.reduce((latest, d) => d.fetched_at > latest ? d.fetched_at : latest, datasets[0].fetched_at)
      : '-';
    return { totalDatasets, totalMarkets, totalSources, latestFetched };
  }, [datasets, indicators]);

  // ── KPI Cards ──────────────────────────────────────────────

  const kpiCards = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="مجموعات البيانات" value={stats.totalDatasets} icon={<Database className="h-5 w-5" />} color="blue" />
      <KpiCard label="أسواق" value={stats.totalMarkets} icon={<Globe className="h-5 w-5" />} color="emerald" />
      <KpiCard label="المصادر" value={stats.totalSources} icon={<Layers className="h-5 w-5" />} color="violet" />
      <KpiCard label="آخر تحديث" value={typeof stats.latestFetched === 'string' && stats.latestFetched !== '-' ? formatDate(stats.latestFetched) : '-'} icon={<Clock className="h-5 w-5" />} color="amber" />
    </div>
  );

  // ── Datasets Tab ──────────────────────────────────────────

  const datasetsTab = (
    <TabsContent value="datasets">
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{tt('finance.source', 'المصدر')}</TableHead>
                <TableHead className="text-right">{tt('finance.description', 'البيان')}</TableHead>
                <TableHead className="text-right">{tt('inventory.category', 'الفئة')}</TableHead>
                <TableHead className="text-right">القيمة</TableHead>
                <TableHead className="text-right">السنة</TableHead>
                <TableHead className="text-right">الإتجاه</TableHead>
                <TableHead className="text-right">النسبة</TableHead>
                <TableHead className="text-right">{tt('maintenance.description', 'الوصف')}</TableHead>
                <TableHead className="text-right">تاريخ الجلب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map(ds => (
                <TableRow key={ds.id}>
                  <TableCell>
                    <Badge className={SOURCE_COLORS[ds.source] || 'bg-gray-100 text-gray-700'}>
                      {SOURCE_LABELS[ds.source] || ds.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium max-w-[180px] truncate">{ds.dataset_name}</TableCell>
                  <TableCell>
                    <Badge className={CATEGORY_COLORS[ds.category] || 'bg-gray-100'}>
                      {CATEGORY_LABELS[ds.category] || ds.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {ds.latest_value.toLocaleString('en-US')} {ds.value_unit}
                  </TableCell>
                  <TableCell className="text-xs">{ds.latest_year}</TableCell>
                  <TableCell>
                    {ds.trend_direction === 'up' && (
                      <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                        <ArrowUp className="h-3 w-3" /> صعود
                      </Badge>
                    )}
                    {ds.trend_direction === 'down' && (
                      <Badge className="bg-red-100 text-[#ea2261] flex items-center gap-1 w-fit">
                        <ArrowDown className="h-3 w-3" /> هبوط
                      </Badge>
                    )}
                    {ds.trend_direction === 'stable' && (
                      <Badge className="bg-gray-100 text-gray-700 flex items-center gap-1 w-fit">
                        استقرار
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className={ds.trend_percent >= 0 ? 'text-emerald-600 font-medium' : 'text-[#ea2261] font-medium'}>
                      {ds.trend_percent > 0 ? '+' : ''}{ds.trend_percent}%
                    </span>
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{ds.description}</TableCell>
                  <TableCell className="text-xs">{formatDate(ds.fetched_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );

  // ── Market Indicators Tab ─────────────────────────────────

  const marketsTab = (
    <TabsContent value="markets">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indicators.map(mi => {
          const yoyPriceClr = mi.yoy_price_change >= 0 ? 'text-emerald-600' : 'text-[#ea2261]';
          const yoyRentClr = mi.yoy_rent_change >= 0 ? 'text-emerald-600' : 'text-[#ea2261]';
          return (
            <Card key={mi.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#533afd] shrink-0" />
                      <span className="truncate">{mi.market_name}</span>
                    </CardTitle>
                    <p className="text-xs text-[#64748d] mt-0.5">
                      {mi.city}، {mi.country === 'QA' ? 'قطر' : mi.country === 'SA' ? 'السعودية' : mi.country}
                      {' — '}
                      <Badge variant="secondary" className="text-xs">
                        {mi.property_type === 'residential' ? 'سكني' :
                         mi.property_type === 'commercial' ? 'تجاري' :
                         mi.property_type === 'industrial' ? 'صناعي' : mi.property_type}
                      </Badge>
                    </p>
                  </div>
                  <Badge className={SOURCE_COLORS[mi.data_source] || 'bg-gray-100 text-gray-700 shrink-0'}>
                    {SOURCE_LABELS[mi.data_source] || mi.data_source}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Price & Yield */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">متوسط / م²</p>
                    <p className="text-sm font-bold">{formatQAR(mi.avg_price_sqm)}</p>
                  </div>
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">العائد الإيجاري</p>
                    <p className="text-sm font-bold text-[#533afd]">{mi.avg_rent_yield}%</p>
                  </div>
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">الإشغال</p>
                    <p className="text-sm font-bold">{mi.occupancy_rate}%</p>
                  </div>
                </div>

                {/* YoY Changes */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">تغير السعر السنوي</p>
                    <p className={`text-sm font-bold flex items-center justify-center gap-1 ${yoyPriceClr}`}>
                      {mi.yoy_price_change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {mi.yoy_price_change > 0 ? '+' : ''}{mi.yoy_price_change}%
                    </p>
                  </div>
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">تغير الإيجار السنوي</p>
                    <p className={`text-sm font-bold flex items-center justify-center gap-1 ${yoyRentClr}`}>
                      {mi.yoy_rent_change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {mi.yoy_rent_change > 0 ? '+' : ''}{mi.yoy_rent_change}%
                    </p>
                  </div>
                </div>

                {/* Supply & Demand */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">المعروض الجديد</p>
                    <p className="text-sm font-bold">{mi.supply_pipeline.toLocaleString('en-US')} وحدة</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-[#64748d] mb-1">
                      <span>مؤشر الطلب</span>
                      <span>{mi.demand_index}/100</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${mi.demand_index >= 80 ? 'bg-emerald-500' : mi.demand_index >= 60 ? 'bg-[#533afd]' : 'bg-[#9b6829]'}`}
                        style={{ width: `${mi.demand_index}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Investment Volume */}
                <div className="flex items-center justify-between pt-2 border-t text-xs text-[#64748d]">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    حجم الاستثمار
                  </span>
                  <span className="font-bold text-[#533afd]">{formatCompact(mi.investment_volume)} ريال</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TabsContent>
  );

  // ── Sources Tab ────────────────────────────────────────────

  const sourcesTab = (
    <TabsContent value="sources">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(SOURCE_INFO).map(([key, info]) => (
          <Card key={key} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">{info.icon}</span>
                <span>{info.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#64748d] leading-relaxed">{info.description}</p>
              <div className="mt-3 pt-2 border-t">
                <Badge className={SOURCE_COLORS[key] || 'bg-gray-100 text-gray-700'}>
                  {SOURCE_LABELS[key as ResearchSource] || key}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  );

  // ── Main ───────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="بيانات الأبحاث ومؤشرات السوق"
        description="قواعد بيانات اقتصادية، مؤشرات عقارية، ومصادر بحثية موثوقة"
      />

      {kpiCards}

      <Tabs value={activeTab} onValueChange={setActiveTab} dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="datasets">البيانات ({datasets.length})</TabsTrigger>
          <TabsTrigger value="markets">مؤشرات السوق ({indicators.length})</TabsTrigger>
          <TabsTrigger value="sources">المصادر</TabsTrigger>
        </TabsList>

        {datasetsTab}
        {marketsTab}
        {sourcesTab}
      </Tabs>
    </div>
  );
}
