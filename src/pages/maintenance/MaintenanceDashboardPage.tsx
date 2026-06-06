import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wrench, Clock, CheckCircle2, AlertTriangle, TrendingUp, CalendarCheck,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { maintenanceStore, unitStore } from '@/services/stores';
import { createStore } from '@/services/dataService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const categoryLabels: Record<string, string> = {
  ac: 'تكييف',
  electrical: 'كهرباء',
  plumbing: 'سباكة',
  water_leakage: 'تسرب مياه',
  door_window: 'أبواب ونوافذ',
  painting: 'دهانات',
  elevator: 'مصعد',
  fire_alarm: 'إنذار حريق',
  pest_control: 'مكافحة حشرات',
  cleaning: 'تنظيف',
  landscaping: 'تنسيق حدائق',
  general: 'عامة',
};

export default function MaintenanceDashboardPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [refresh] = useState(0);

  const requests = useMemo(() => maintenanceStore.getAll(), [refresh]);

  // ---- KPI calculations ----
  const openRequests = requests.filter(r => !['completed', 'closed', 'cancelled'].includes(r.status)).length;

  const inProgressOrders = requests.filter(r => r.status === 'in_progress' || r.status === 'assigned').length;

  const completedThisMonth = requests.filter(r => r.status === 'completed' || r.status === 'closed').length;

  const emergencyRequests = requests.filter(r => r.priority === 'emergency' && !['completed', 'closed', 'cancelled'].includes(r.status)).length;

  const avgResponseTime = 4.2; // Mock

  // Upcoming PM schedules (mock)
  const upcomingPM = [
    { id: 1, unit: 'A-101', type: 'تكييف', date: '2026-06-15', status: 'مجدولة' },
    { id: 2, unit: 'B-203', type: 'مصعد', date: '2026-06-20', status: 'مجدولة' },
    { id: 3, unit: 'C-105', type: 'كهرباء', date: '2026-06-25', status: 'قيد التحضير' },
    { id: 4, unit: 'D-302', type: 'سباكة', date: '2026-07-01', status: 'مجدولة' },
  ];

  // Category distribution for pie chart
  const categoryData = useMemo(() => {
    const count: Record<string, number> = {};
    requests.forEach(r => {
      count[r.category] = (count[r.category] || 0) + 1;
    });
    return Object.entries(count).map(([cat, cnt]) => ({
      name: categoryLabels[cat] || cat,
      value: cnt,
    }));
  }, [requests]);

  // Priority distribution for bar chart
  const priorityData = useMemo(() => {
    const priorityOrder = ['emergency', 'high', 'medium', 'low'];
    const priorityLabels: Record<string, string> = {
      emergency: 'طارئ',
      high: 'عالي',
      medium: 'متوسط',
      low: 'منخفض',
    };
    const count: Record<string, number> = { emergency: 0, high: 0, medium: 0, low: 0 };
    requests.forEach(r => {
      count[r.priority] = (count[r.priority] || 0) + 1;
    });
    return priorityOrder.map(p => ({
      name: priorityLabels[p] || p,
      value: count[p] || 0,
      fill: p === 'emergency' ? '#ef4444' : p === 'high' ? '#f59e0b' : p === 'medium' ? '#3b82f6' : '#10b981',
    }));
  }, [requests]);

  // Recent requests
  const recentRequests = useMemo(() => {
    return [...requests]
      .sort((a, b) => b.request_number.localeCompare(a.request_number))
      .slice(0, 5);
  }, [requests]);

  const statusLabels: Record<string, string> = {
    submitted: 'مقدم',
    under_review: 'قيد المراجعة',
    approved: 'معتمد',
    rejected: 'مرفوض',
    assigned: 'تم التعيين',
    in_progress: 'قيد التنفيذ',
    waiting_parts: 'بانتظار قطع',
    completed: 'مكتمل',
    tenant_confirmed: 'مؤكد من المستأجر',
    closed: 'مغلق',
    cancelled: 'ملغي',
  };

  return (
    <div className="bg-gray-50 min-h-full space-y-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">لوحة تحكم الصيانة</h1>
        <p className="text-xs text-gray-500 mt-0.5">نظرة عامة على أداء قسم الصيانة</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="طلبات مفتوحة" value={openRequests} icon={Wrench} />
        <StatCard title="أوامر عمل جارية" value={inProgressOrders} icon={Clock} />
        <StatCard title="مكتملة هذا الشهر" value={completedThisMonth} icon={CheckCircle2} />
        <StatCard title="طلبات طارئة" value={emergencyRequests} icon={AlertTriangle} />
        <StatCard title="متوسط وقت الاستجابة" value={`${avgResponseTime} ساعة`} icon={TrendingUp} format="number" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: requests by category */}
        <Card>
          <CardHeader><CardTitle className="text-base">الطلبات حسب الفئة</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar: requests by priority */}
        <Card>
          <CardHeader><CardTitle className="text-base">الطلبات حسب الأولوية</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming PM + Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Preventive Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              جدول الصيانة الوقائية القادمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPM.map(pm => (
                <div key={pm.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">وحدة {pm.unit} - {pm.type}</p>
                    <p className="text-xs text-muted-foreground">{pm.date}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                    {pm.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">آخر طلبات الصيانة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRequests.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد طلبات</p>
              )}
              {recentRequests.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{r.request_number}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.description}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded"
                    style={{
                      backgroundColor: r.priority === 'emergency' ? 'rgba(239,68,68,0.1)' :
                        r.priority === 'high' ? 'rgba(245,158,11,0.1)' :
                        r.priority === 'medium' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                      color: r.priority === 'emergency' ? '#dc2626' :
                        r.priority === 'high' ? '#d97706' :
                        r.priority === 'medium' ? '#2563eb' : '#059669',
                    }}
                  >
                    {statusLabels[r.status] || r.status}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => navigate('/maintenance')}>
              عرض جميع الطلبات
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
