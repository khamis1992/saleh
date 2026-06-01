import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, DoorOpen, UserRound, FileText, ChevronLeft, Plus, AlertTriangle, Receipt, Banknote, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatQARInt } from '@/lib/format';
import { deriveTasksFromData } from '@/services/tasks';
import { colorClass } from '@/utils/colorClass';

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

export default function PropertyCenterPage() {
  const [, setRefresh] = useState(0);
  useEffect(() => { deriveTasksFromData(); setRefresh(r => r + 1); }, []);

  const stats = useMemo(() => {
    const units = safeAll('erp_units');
    const leases = safeAll('erp_leases');
    const tenants = safeAll('erp_tenants');
    const invoices = safeAll('erp_invoices');
    const properties = safeAll('erp_properties');

    const leased = units.filter((u: any) => u.status === 'leased').length;
    const vacant = units.filter((u: any) => u.status === 'available' || u.status === 'vacant').length;
    const maintenance = units.filter((u: any) => u.status === 'maintenance').length;
    const occupancy = units.length ? Math.round((leased / units.length) * 100) : 0;

    const today = new Date();
    const in30 = new Date(today.getTime() + 30 * 86400000);
    const in60 = new Date(today.getTime() + 60 * 86400000);
    const in90 = new Date(today.getTime() + 90 * 86400000);

    const expiring30 = leases.filter((l: any) => l.status === 'active' && l.end_date && new Date(l.end_date) <= in30 && new Date(l.end_date) >= today).length;
    const expiring60 = leases.filter((l: any) => l.status === 'active' && l.end_date && new Date(l.end_date) > in30 && new Date(l.end_date) <= in60).length;
    const expiring90 = leases.filter((l: any) => l.status === 'active' && l.end_date && new Date(l.end_date) > in60 && new Date(l.end_date) <= in90).length;

    const overdueInvoices = invoices.filter((i: any) => i.status !== 'paid' && i.due_date && new Date(i.due_date) < today);
    const overdueAmount = overdueInvoices.reduce((s: number, i: any) => s + (i.balance || i.total || 0), 0);

    return { units, leases, tenants, properties, leased, vacant, maintenance, occupancy, expiring30, expiring60, expiring90, overdueInvoices: overdueInvoices.length, overdueAmount };
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="العقارات والتأجير" description="إدارة دورة حياة العقار من التطوير حتى التأجير">
        <div className="flex items-center gap-2">
          <Link to="/wizards/lease">
            <Button className="bg-[#3B82F6] hover:bg-blue-600 text-white h-9 px-4 text-sm gap-1.5">
              <Plus className="h-4 w-4" /> عقد جديد
            </Button>
          </Link>
          <Link to="/wizards/payment">
            <Button variant="outline" className="h-9 px-4 text-sm gap-1.5">
              <Banknote className="h-4 w-4" /> تسجيل دفعة
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="عقارات" value={stats.properties.length} sublabel="إجمالي" icon={<Building2 className="h-5 w-5" />} color="blue" to="/properties" />
        <KpiCard label="وحدات" value={stats.units.length} sublabel="إجمالي" icon={<DoorOpen className="h-5 w-5" />} color="cyan" to="/units" />
        <KpiCard label="نسبة الإشغال" value={`${stats.occupancy}%`} sublabel={`${stats.leased} مؤجرة`} icon={<Building2 className="h-5 w-5" />} color="green" to="/reports/occupancy" />
        <KpiCard label="وحدات شاغرة" value={stats.vacant} sublabel="جاهزة للتأجير" icon={<DoorOpen className="h-5 w-5" />} color="emerald" to="/units" />
        <KpiCard label="مستأجرون" value={stats.tenants.length} sublabel="نشط" icon={<UserRound className="h-5 w-5" />} color="violet" to="/tenants" />
        <KpiCard label="تحصيل متأخر" value={formatQARInt(stats.overdueAmount)} sublabel={`${stats.overdueInvoices} فاتورة`} icon={<AlertTriangle className="h-5 w-5" />} color="red" to="/queues/collection" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring contracts */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-4">عقود تنتهي قريباً</h3>
            <div className="space-y-2.5">
              {[
                { label: 'خلال 30 يوم', count: stats.expiring30, color: 'red' },
                { label: 'خلال 60 يوم', count: stats.expiring60, color: 'amber' },
                { label: 'خلال 90 يوم', count: stats.expiring90, color: 'blue' },
              ].map((b, i) => {
                const cc = colorClass(b.color);
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${cc.text.replace('text', 'bg')}`} />
                    <span className="text-sm flex-1">{b.label}</span>
                    <span className={`text-base font-bold ${cc.text}`}>{b.count}</span>
                  </div>
                );
              })}
            </div>
            <Link to="/leases">
              <Button variant="outline" size="sm" className="w-full mt-4 h-9 text-xs gap-1">
                عرض جميع العقود <ChevronLeft className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-base mb-4">إجراءات سريعة</h3>
            <div className="space-y-2.5">
              {[
                { title: 'إنشاء عقد إيجار', desc: 'معالج 7 خطوات لإنشاء عقد جديد', to: '/wizards/lease', icon: FileText, color: 'blue' },
                { title: 'تسجيل دفعة', desc: 'تحصيل دفعة إيجار', to: '/wizards/payment', icon: Banknote, color: 'green' },
                { title: 'إضافة مستأجر', desc: 'تسجيل مستأجر جديد', to: '/tenants/create', icon: Users, color: 'violet' },
                { title: 'إضافة عقار', desc: 'تسجيل عقار جديد', to: '/properties/create', icon: Building2, color: 'orange' },
              ].map((a, i) => {
                const Icon = a.icon;
                const cc = colorClass(a.color);
                return (
                  <Link key={i} to={a.to} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors group">
                    <div className={`h-9 w-9 rounded-lg ${cc.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${cc.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold group-hover:text-blue-600 transition-colors">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
