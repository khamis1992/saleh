// Landlord Portal — Maintenance Cost Analysis
// Shows maintenance spend per property, category breakdown, top issues

import { useMemo } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { maintenanceStore, propertyStore, unitStore, tenantStore } from '@/services/stores';
import { formatQAR, formatQARInt, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Wrench, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);
const fmtInt = (v: number) => formatQARInt(v);

const CATEGORY_LABELS: Record<string, string> = {
  ac: 'تكييف', electrical: 'كهرباء', plumbing: 'سباكة', water_leakage: 'تسرب مياه',
  door_window: 'أبواب/شبابيك', painting: 'دهان', elevator: 'مصاعد', fire_alarm: 'إنذار حريق',
  pest_control: 'مكافحة حشرات', cleaning: 'تنظيف', landscaping: 'تشجير', general: 'عام',
};

export default function LandlordMaintenancePage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const propertyId = session?.propertyId;

  const allMaint = useMemo(() => maintenanceStore.getAll(), []);
  const allProperties = useMemo(() => propertyStore.getAll(), []);
  const allUnits = useMemo(() => unitStore.getAll(), []);

  // Filter by property
  const maint = useMemo(() => {
    if (!propertyId) return allMaint;
    return allMaint.filter((m) => m.property_id === propertyId);
  }, [allMaint, propertyId]);

  // Demo: estimate cost per request (QAR 2000 average)
  const ESTIMATED_COST_PER_REQUEST = 2000;

  // By category
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    maint.forEach((m) => {
      map[m.category] = (map[m.category] || 0) + 1;
    });
    return Object.entries(map).map(([key, count]) => ({
      name: CATEGORY_LABELS[key] || key,
      value: count * ESTIMATED_COST_PER_REQUEST,
      count,
    })).sort((a, b) => b.value - a.value);
  }, [maint]);

  // By property
  const byProperty = useMemo(() => {
    return allProperties.map((p) => {
      const propMaint = allMaint.filter((m) => m.property_id === p.id);
      const cost = propMaint.length * ESTIMATED_COST_PER_REQUEST;
      return { name: p.property_name, cost, count: propMaint.length };
    }).filter((p) => p.count > 0);
  }, [allMaint, allProperties]);

  const COLORS = ['#533afd', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];

  const totalCost = maint.length * ESTIMATED_COST_PER_REQUEST;
  const emergencyCount = maint.filter((m) => m.priority === 'emergency').length;
  const openCount = maint.filter((m) => !['closed', 'completed', 'cancelled'].includes(m.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061b31]">تكلفة الصيانة</h1>
        <p className="text-[12px] text-[#64748d] mt-0.5">تحليل تكاليف الصيانة عبر العقارات والفئات</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#64748d]">إجمالي التكلفة (تقديري)</p>
            <p className="text-xl font-bold text-[#061b31]">{fmtInt(totalCost)}</p>
            <p className="text-[12px] text-[#64748d] mt-1">{maint.length} طلب · ~{fmt(ESTIMATED_COST_PER_REQUEST)} للطلب</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#64748d]">طلبات مفتوحة</p>
            <p className="text-2xl font-bold text-[#9b6829]">{openCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#ea2261]">طلبات طارئة</p>
            <p className="text-2xl font-bold text-[#ea2261]">{emergencyCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#64748d]">معدل الإكمال</p>
            <p className="text-2xl font-bold text-emerald-600">
              {maint.length > 0
                ? Math.round((maint.filter((m) => ['closed', 'completed', 'tenant_confirmed'].includes(m.status)).length / maint.length) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By category pie */}
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#061b31]">التكلفة حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <p className="text-center text-[#64748d] py-8 text-[13px]">{tt('common.noData', 'لا توجد بيانات')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry: any) => entry.name}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v as number)} contentStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By property bar */}
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#061b31]">التكلفة حسب العقار</CardTitle>
          </CardHeader>
          <CardContent>
            {byProperty.length === 0 ? (
              <p className="text-center text-[#64748d] py-8 text-[13px]">{tt('common.noData', 'لا توجد بيانات')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byProperty}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => fmt(v as number)} contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="cost" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
