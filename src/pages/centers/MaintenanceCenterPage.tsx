import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Scale, AlertTriangle, ListChecks, Plus, Clock, ChevronLeft, Shield } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { deriveTasksFromData, getTasks } from '@/services/tasks';
import { colorClass } from '@/utils/colorClass';

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

export default function MaintenanceCenterPage() {
  const [, setRefresh] = useState(0);
  useEffect(() => { deriveTasksFromData(); setRefresh(r => r + 1); }, []);

  const stats = useMemo(() => {
    const requests = safeAll('erp_maintenance');
    const workOrders = safeAll('erp_work_orders');
    const legalCases = safeAll('erp_legal_cases');
    const legalNotices = safeAll('erp_legal_notices');
    const inspections = safeAll('erp_inspections');
    const open = requests.filter((r: any) => !['closed', 'completed', 'cancelled'].includes(r.status)).length;
    const emergency = requests.filter((r: any) => r.priority === 'emergency' && !['closed', 'completed'].includes(r.status)).length;
    const assigned = workOrders.filter((w: any) => w.status === 'in_progress' || w.status === 'assigned').length;
    const overdue = requests.filter((r: any) => {
      if (['closed', 'completed', 'cancelled'].includes(r.status)) return false;
      if (!r.due_date && !r.scheduled_date) return false;
      const d = r.due_date || r.scheduled_date;
      return new Date(d) < new Date();
    }).length;
    const openCases = legalCases.filter((c: any) => c.status !== 'closed').length;
    const pendingNotices = legalNotices.filter((n: any) => n.status === 'draft' || n.status === 'pending').length;
    return { requests, workOrders, open, emergency, assigned, overdue, inspections: inspections.length, openCases, pendingNotices };
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="الصيانة والشؤون القانونية" description="إدارة طلبات الصيانة، أوامر العمل، القضايا، والإشعارات القانونية">
        <div className="flex items-center gap-2">
          <Link to="/maintenance/requests">
            <Button className="bg-[#3B82F6] hover:bg-blue-600 text-white h-9 px-4 text-sm gap-1.5">
              <Plus className="h-4 w-4" /> طلب صيانة
            </Button>
          </Link>
          <Link to="/queues/approvals">
            <Button variant="outline" className="h-9 px-4 text-sm gap-1.5">
              <Shield className="h-4 w-4" /> الموافقات
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Maintenance KPIs */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">الصيانة</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard label="طلبات مفتوحة" value={stats.open} sublabel="بانتظار التنفيذ" icon={<Wrench className="h-5 w-5" />} color="blue" to="/queues/maintenance" />
          <KpiCard label="حالات طارئة" value={stats.emergency} sublabel="أولوية قصوى" icon={<AlertTriangle className="h-5 w-5" />} color="red" to="/queues/maintenance" />
          <KpiCard label="أوامر عمل جارية" value={stats.assigned} sublabel="مسندة" icon={<ListChecks className="h-5 w-5" />} color="orange" to="/maintenance/work-orders" />
          <KpiCard label="متأخرة" value={stats.overdue} sublabel="عن الموعد" icon={<Clock className="h-5 w-5" />} color="red" to="/queues/maintenance" />
          <KpiCard label="معاينات" value={stats.inspections} sublabel="إجمالي" icon={<ListChecks className="h-5 w-5" />} color="cyan" to="/maintenance/inspections" />
        </div>
      </div>

      {/* Legal KPIs */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">الشؤون القانونية</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard label="قضايا مفتوحة" value={stats.openCases} sublabel="نشطة" icon={<Scale className="h-5 w-5" />} color="violet" to="/legal/cases" />
          <KpiCard label="إشعارات معلقة" value={stats.pendingNotices} sublabel="بانتظار الإرسال" icon={<Scale className="h-5 w-5" />} color="amber" to="/legal/notices" />
          <KpiCard label="مهام معلقة" value="—" sublabel="إجراءات مطلوبة" icon={<ListChecks className="h-5 w-5" />} color="blue" to="/tasks" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-3">إجراءات سريعة</h3>
            <div className="space-y-2">
              {[
                { title: 'طلب صيانة جديد', desc: 'تسجيل طلب صيانة جديد', to: '/maintenance/requests', icon: Wrench, color: 'blue' },
                { title: 'إنشاء أمر عمل', desc: 'مساعدة فني على طلب موجود', to: '/maintenance/work-orders', icon: ListChecks, color: 'orange' },
                { title: 'جدولة صيانة وقائية', desc: 'صيانة دورية لوحدة', to: '/maintenance/preventive', icon: Clock, color: 'green' },
                { title: 'إشعار قانوني', desc: 'إصدار إشعار لمستأجر', to: '/legal/notices', icon: Scale, color: 'violet' },
              ].map((a, i) => {
                const Icon = a.icon;
                const cc = colorClass(a.color);
                return (
                  <Link key={i} to={a.to} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                    <div className={`h-9 w-9 rounded-lg ${cc.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${cc.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-3">الصيانة الوقائية</h3>
            <p className="text-xs text-muted-foreground mb-3">جدولة الصيانة الدورية قبل أن تتفاقم الأعطال</p>
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                <Clock className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">فحص التكييف</p>
                  <p className="text-[11px] text-muted-foreground">كل 6 أشهر</p>
                </div>
                <span className="text-xs font-semibold text-amber-600">3 مستحقة</span>
              </div>
              <div className="p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">فحص السباكة</p>
                  <p className="text-[11px] text-muted-foreground">سنوي</p>
                </div>
                <span className="text-xs font-semibold text-blue-600">1 مستحقة</span>
              </div>
              <div className="p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                <Clock className="h-5 w-5 text-violet-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">فحص المصاعد</p>
                  <p className="text-[11px] text-muted-foreground">ربع سنوي</p>
                </div>
                <span className="text-xs font-semibold text-violet-600">2 مستحقة</span>
              </div>
            </div>
            <Link to="/maintenance/preventive">
              <Button variant="outline" size="sm" className="w-full mt-4 h-9 text-xs">إدارة الصيانة الوقائية</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
