// Landlord Portal — Property Performance (NOI, ROI per property)

import { useMemo } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { propertyStore, unitStore, leaseStore, invoiceStore, receiptStore, maintenanceStore } from '@/services/stores';
import { formatQAR, formatQARInt, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Building2, TrendingUp, DollarSign, Home, MapPin, BarChart3, Wallet, Wrench,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);
const fmtInt = (v: number) => formatQARInt(v);

export default function LandlordPerformancePage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const propertyId = session?.propertyId;

  const properties = useMemo(() => propertyStore.getAll(), []);
  const allUnits = useMemo(() => unitStore.getAll(), []);
  const allLeases = useMemo(() => leaseStore.getAll(), []);
  const allInvoices = useMemo(() => invoiceStore.getAll(), []);
  const allReceipts = useMemo(() => receiptStore.getAll(), []);
  const allMaintenance = useMemo(() => maintenanceStore.getAll(), []);

  // Performance per property
  const performance = useMemo(() => {
    return properties.map((p) => {
      const propUnits = allUnits.filter((u) => u.property_id === p.id);
      const propLeases = allLeases.filter((l) => propUnits.some((u) => u.id === l.unit_id));
      const propMaint = allMaintenance.filter((m) => m.property_id === p.id);
      const leased = propUnits.filter((u) => u.status === 'leased').length;
      const occ = propUnits.length > 0 ? (leased / propUnits.length) * 100 : 0;
      // Annual gross rent
      const annualRent = propLeases.filter((l) => l.status === 'active').reduce((s, l) => {
        switch (l.payment_frequency) {
          case 'monthly': return s + l.rent_amount * 12;
          case 'quarterly': return s + l.rent_amount * 4;
          case 'semi_annual': return s + l.rent_amount * 2;
          case 'annual': return s + l.rent_amount;
          default: return s + l.rent_amount;
        }
      }, 0);
      // Annual maintenance cost (sum of all completed maintenance for units in this property)
      const annualMaintenance = propMaint.filter((m) => ['completed', 'closed'].includes(m.status)).length * 5000; // demo: estimate QAR 5k per completed request
      // NOI = Gross rent - Operating expenses (maintenance)
      const noi = annualRent - annualMaintenance;
      // Cap rate (demo): NOI / asset value
      const capRate = p.total_asset_value > 0 ? (noi / p.total_asset_value) * 100 : 0;
      // ROI = NOI / (asset value * 0.5) — leverage assumption
      const roi = p.total_asset_value > 0 ? (noi / (p.total_asset_value * 0.5)) * 100 : 0;
      return {
        property: p,
        units: propUnits,
        leased,
        occupancy: occ,
        annualRent,
        annualMaintenance,
        noi,
        capRate,
        roi,
      };
    });
  }, [properties, allUnits, allLeases, allMaintenance]);

  const COLORS = ['#10B981', '#533afd', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061b31]">أداء العقارات</h1>
        <p className="text-[12px] text-[#64748d] mt-0.5">NOI، ROI، ونسب الإشغال لكل عقار</p>
      </div>

      {/* Portfolio totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#64748d]">إجمالي الأصول</p>
            <p className="text-lg font-bold text-[#061b31]">
              {fmtInt(properties.reduce((s, p) => s + p.total_asset_value, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#64748d]">إجمالي الإيراد السنوي</p>
            <p className="text-lg font-bold text-emerald-600">
              {fmtInt(performance.reduce((s, p) => s + p.annualRent, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#64748d]">صافي الدخل التشغيلي (NOI)</p>
            <p className="text-lg font-bold text-[#061b31]">
              {fmtInt(performance.reduce((s, p) => s + p.noi, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#64748d]">متوسط ROI</p>
            <p className="text-lg font-bold text-[#533afd]">
              {performance.length > 0
                ? (performance.reduce((s, p) => s + p.roi, 0) / performance.length).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            NOI لكل عقار
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={performance.map((p) => ({ name: p.property.property_name, noi: p.noi }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(v: any) => fmt(v as number)}
              />
              <Bar dataKey="noi" radius={[8, 8, 0, 0]}>
                {performance.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Property cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {performance.map((p) => (
          <Card key={p.property.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    {p.property.property_name}
                  </CardTitle>
                  <CardDescription className="text-[12px] flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {p.property.address}
                  </CardDescription>
                </div>
                <StatusBadge status={p.property.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-[rgba(83,58,253,0.06)] rounded-lg">
                  <p className="text-[12px] text-[#64748d]">الإشغال</p>
                  <p className="text-[16px] font-bold text-[#533afd]">{p.occupancy.toFixed(0)}%</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-[12px] text-[#64748d]">إيراد سنوي</p>
                  <p className="text-[12px] font-bold text-emerald-600">{fmtInt(p.annualRent)}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-[12px] text-[#64748d]">NOI</p>
                  <p className="text-[12px] font-bold text-[#9b6829]">{fmtInt(p.noi)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[12px] text-[#64748d]">{tt('properties.assetValue', 'قيمة الأصل')}</p>
                  <p className="text-[12px] font-semibold">{fmtInt(p.property.total_asset_value)}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#64748d]">Cap Rate</p>
                  <p className="text-[12px] font-semibold">{p.capRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#64748d]">ROI</p>
                  <p className="text-[12px] font-semibold text-[#533afd]">{p.roi.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
