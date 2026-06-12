import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { biometricDeviceStore, biometricTemplateStore, biometricAttendanceStore } from '@/services/stores';
import { formatDate } from '@/lib/format';
import {
  Fingerprint, Wifi, WifiOff, Clock, Thermometer,
  User, Monitor,
} from 'lucide-react';
import type {
  BiometricDevice, BiometricTemplate, BiometricAttendanceRecord,
} from '@/types/phase8';

// ── Labels & Badges ──────────────────────────────────────────

const DEVICE_STATUS_LABELS: Record<string, string> = {
  online: 'متصل',
  offline: 'غير متصل',
  maintenance: 'صيانة',
  error: 'خطأ',
};

const DEVICE_STATUS_VARIANTS: Record<string, string> = {
  online: 'bg-emerald-100 text-emerald-700',
  offline: 'bg-red-100 text-[#ea2261]',
  maintenance: 'bg-amber-100 text-[#9b6829]',
  error: 'bg-gray-200 text-gray-700',
};

const DEVICE_TYPE_LABELS: Record<string, string> = {
  zk_fingerprint: 'بصمة ZKTeco',
  zk_face: 'تعرف وجهي ZKTeco',
  zk_palm: 'بصمة كف ZKTeco',
  zk_iris: 'قزحية ZKTeco',
  hikvision: 'Hikvision',
  suprema: 'Suprema',
};

const PUNCH_TYPE_LABELS: Record<string, string> = {
  clock_in: 'حضور',
  clock_out: 'انصراف',
  break_start: 'بداية استراحة',
  break_end: 'نهاية استراحة',
  overtime_in: 'بدء عمل إضافي',
  overtime_out: 'نهاية عمل إضافي',
};

const PUNCH_TYPE_VARIANTS: Record<string, string> = {
  clock_in: 'bg-emerald-100 text-emerald-700',
  clock_out: 'bg-red-100 text-[#ea2261]',
  break_start: 'bg-amber-100 text-[#9b6829]',
  break_end: 'bg-amber-100 text-[#9b6829]',
  overtime_in: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  overtime_out: 'bg-violet-100 text-violet-700',
};

const FINGER_LABELS: Record<number, string> = {
  1: 'الإبهام الأيمن',
  2: 'السبابة اليمنى',
  3: 'الوسطى اليمنى',
  4: 'البنصر اليمنى',
  5: 'الخنصر اليمنى',
  6: 'الإبهام الأيسر',
  7: 'السبابة اليسرى',
  8: 'الوسطى اليسرى',
  9: 'البنصر اليسرى',
  10: 'الخنصر اليسرى',
};

// ── Component ────────────────────────────────────────────────

export default function BiometricDevicesPage() {
  const { dir } = useLocale();
  const [devices, setDevices] = useState<BiometricDevice[]>(() => biometricDeviceStore.getAll());
  const [templates, setTemplates] = useState<BiometricTemplate[]>(() => biometricTemplateStore.getAll());
  const [attendance, setAttendance] = useState<BiometricAttendanceRecord[]>(() => biometricAttendanceStore.getAll());

  const refresh = () => {
    setDevices(biometricDeviceStore.getAll());
    setTemplates(biometricTemplateStore.getAll());
    setAttendance(biometricAttendanceStore.getAll());
  };

  const stats = useMemo(() => {
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const totalTemplates = templates.length;
    const todayAttendance = attendance.filter(a => {
      const d = new Date(a.punch_time);
      const t = new Date();
      return d.toDateString() === t.toDateString();
    }).length;
    return { totalDevices, onlineDevices, totalTemplates, todayAttendance };
  }, [devices, templates, attendance]);

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="أجهزة البصمة — إدارة الحضور البيومتري"
        description="إدارة أجهزة البصمة وتسجيل البصمات وسجلات الحضور والانصراف"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="الأجهزة"
          value={stats.totalDevices}
          icon={<Monitor className="h-5 w-5" />}
          color="blue"
        />
        <KpiCard
          label="متصل"
          value={stats.onlineDevices}
          icon={<Wifi className="h-5 w-5" />}
          color="green"
        />
        <KpiCard
          label="البصمات"
          value={stats.totalTemplates}
          icon={<Fingerprint className="h-5 w-5" />}
          color="violet"
        />
        <KpiCard
          label="حضور اليوم"
          value={stats.todayAttendance}
          icon={<Clock className="h-5 w-5" />}
          color="blue"
        />
      </div>

      <Tabs defaultValue="devices" dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="devices">الأجهزة ({devices.length})</TabsTrigger>
          <TabsTrigger value="attendance">الحضور ({attendance.length})</TabsTrigger>
          <TabsTrigger value="templates">البصمات ({templates.length})</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map(device => (
              <Card key={device.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        {device.status === 'online' ? (
                          <Wifi className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-400" />
                        )}
                        <span className="truncate">{device.device_name}</span>
                      </CardTitle>
                      <p className="text-xs text-[#64748d] mt-1">{device.location}</p>
                    </div>
                    <Badge className={DEVICE_STATUS_VARIANTS[device.status] || 'bg-gray-100'}>
                      {DEVICE_STATUS_LABELS[device.status] || device.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-[#f6f9fc] rounded-lg p-2">
                      <p className="text-[#64748d]">{tt('equipment.equipmentType', 'النوع')}</p>
                      <p className="font-semibold">{DEVICE_TYPE_LABELS[device.device_type] || device.device_type}</p>
                    </div>
                    <div className="bg-[#f6f9fc] rounded-lg p-2">
                      <p className="text-[#64748d]">الموديل</p>
                      <p className="font-semibold truncate">{device.model}</p>
                    </div>
                    <div className="bg-[#f6f9fc] rounded-lg p-2">
                      <p className="text-[#64748d]">IP</p>
                      <p className="font-semibold font-mono text-xs">{device.ip_address}</p>
                    </div>
                    <div className="bg-[#f6f9fc] rounded-lg p-2">
                      <p className="text-[#64748d]">البرنامج الثابت</p>
                      <p className="font-semibold font-mono text-xs">{device.firmware_version}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-[#64748d]">
                    <div className="flex items-center gap-1">
                      <Fingerprint className="h-3.5 w-3.5" />
                      <span>{device.stored_templates} بصمة</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(device.last_sync_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                سجلات الحضور والانصراف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">وقت البصمة</TableHead>
                    <TableHead className="text-right">{tt('equipment.equipmentType', 'النوع')}</TableHead>
                    <TableHead className="text-right">درجة المطابقة</TableHead>
                    <TableHead className="text-right">الحرارة</TableHead>
                    <TableHead className="text-right">تم التحقق</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="text-xs font-medium font-mono">{record.employee_id}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(record.punch_time).toLocaleString('ar-SA', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={PUNCH_TYPE_VARIANTS[record.punch_type] || 'bg-gray-100'}>
                          {PUNCH_TYPE_LABELS[record.punch_type] || record.punch_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={record.verification_score >= 90 ? 'text-emerald-600 font-bold' : record.verification_score >= 80 ? 'text-[#9b6829]' : 'text-[#ea2261]'}>
                          {record.verification_score}%
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={record.temperature_celsius > 37.5 ? 'text-[#ea2261] font-semibold' : 'text-gray-700'}>
                          {record.temperature_celsius}°C
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={record.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-[#ea2261]'}>
                          {record.is_verified ? 'نعم' : 'لا'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-violet-600" />
                البصمات المسجلة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">الإصبع</TableHead>
                    <TableHead className="text-right">جودة البصمة</TableHead>
                    <TableHead className="text-right">تاريخ التسجيل</TableHead>
                    <TableHead className="text-right">{tt('legal.status', 'الحالة')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map(tpl => (
                    <TableRow key={tpl.id}>
                      <TableCell className="text-xs font-medium font-mono">{tpl.employee_id}</TableCell>
                      <TableCell className="text-xs">
                        {FINGER_LABELS[tpl.finger_index] || `الإصبع ${tpl.finger_index}`}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={tpl.quality_score >= 90 ? 'text-emerald-600 font-bold' : tpl.quality_score >= 80 ? 'text-[#9b6829]' : 'text-[#ea2261]'}>
                          {tpl.quality_score}%
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(tpl.registered_at)}</TableCell>
                      <TableCell>
                        <Badge className={tpl.status === 'active' ? 'bg-emerald-100 text-emerald-700' : tpl.status === 'expired' ? 'bg-amber-100 text-[#9b6829]' : 'bg-gray-200 text-[#64748d]'}>
                          {tpl.status === 'active' ? t.leases.statuses.active || tt('leases.statuses.active','نشط') : tpl.status === 'expired' ? t.leases.statuses.terminated || tt('leases.statuses.terminated','منتهي') : t.maintenance.statuses.cancelled || tt('maintenance.statuses.cancelled','ملغي')}
                        </Badge>
                      </TableCell>
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
