import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { exportToCSV } from '@/utils/exportUtils';
import {
  Search, Filter, Download, RefreshCw, Shield, User, Database, Settings,
  Clock, Activity, AlertTriangle, Info, CheckCircle2, XCircle,
} from 'lucide-react';
import { createStore } from '@/services/dataService';

interface ActivityLogEntry {
  id: string;
  user: string;
  action: string;
  module: string;
  record_id: string;
  severity: string;
  category: string;
  ip_address: string;
  details: string;
  timestamp: string;
}

const seedActivityLogs: ActivityLogEntry[] = [
  {
    id: 'act-1', user: 'أحمد المدير', action: 'تسجيل دخول', module: 'النظام',
    record_id: '', severity: 'info', category: 'security',
    ip_address: '192.168.1.100', details: 'تسجيل دخول ناجح من المتصفح',
    timestamp: '2026-05-31 08:30:15',
  },
  {
    id: 'act-2', user: 'سارة المحاسب', action: 'إنشاء فاتورة', module: 'الفواتير',
    record_id: 'INV-2026-045', severity: 'info', category: 'data',
    ip_address: '192.168.1.105', details: 'إنشاء فاتورة إيجار جديدة',
    timestamp: '2026-05-31 09:15:22',
  },
  {
    id: 'act-3', user: 'محمد الفني', action: 'تحديث طلب صيانة', module: 'الصيانة',
    record_id: 'WO-2026-012', severity: 'info', category: 'data',
    ip_address: '192.168.1.110', details: 'تغيير الحالة من معين إلى قيد التنفيذ',
    timestamp: '2026-05-31 10:00:45',
  },
  {
    id: 'act-4', user: 'خالد المشرف', action: 'محاولة وصول مرفوضة', module: 'الصلاحيات',
    record_id: '', severity: 'warning', category: 'security',
    ip_address: '192.168.1.200', details: 'محاولة الوصول إلى قسم المالية بدون صلاحية',
    timestamp: '2026-05-31 10:30:00',
  },
  {
    id: 'act-5', user: 'أحمد المدير', action: 'تعديل صلاحيات', module: 'المستخدمين',
    record_id: 'USR-005', severity: 'warning', category: 'admin',
    ip_address: '192.168.1.100', details: 'منح صلاحية مدير مالي للمستخدم سارة',
    timestamp: '2026-05-30 14:00:10',
  },
  {
    id: 'act-6', user: 'النظام', action: 'نسخ احتياطي', module: 'النظام',
    record_id: 'BKP-2026-005', severity: 'info', category: 'system',
    ip_address: 'localhost', details: 'اكتمال النسخ الاحتياطي التلقائي بنجاح',
    timestamp: '2026-05-30 03:00:00',
  },
  {
    id: 'act-7', user: 'نورة الموارد', action: 'تصدير بيانات', module: 'الموارد البشرية',
    record_id: '', severity: 'info', category: 'data',
    ip_address: '192.168.1.115', details: 'تصدير تقرير الرواتب الشهري إلى CSV',
    timestamp: '2026-05-29 16:45:30',
  },
  {
    id: 'act-8', user: 'سارة المحاسب', action: 'خطأ في النظام', module: 'المالية',
    record_id: 'JRN-2026-008', severity: 'error', category: 'system',
    ip_address: '192.168.1.105', details: 'فشل في ترحيل القيد المحاسبي - الأرصدة غير متطابقة',
    timestamp: '2026-05-29 11:20:00',
  },
  {
    id: 'act-9', user: 'أحمد المدير', action: 'حذف سجل', module: 'المستأجرين',
    record_id: 'TNT-OLD-03', severity: 'critical', category: 'data',
    ip_address: '192.168.1.100', details: 'حذف سجل مستأجر قديم',
    timestamp: '2026-05-28 09:00:55',
  },
  {
    id: 'act-10', user: 'محمد الفني', action: 'رفع مستند', module: 'الصيانة',
    record_id: 'WO-2026-010', severity: 'info', category: 'data',
    ip_address: '192.168.1.110', details: 'رفع تقرير فني مع الصور',
    timestamp: '2026-05-28 13:15:40',
  },
  {
    id: 'act-11', user: 'النظام', action: 'تحديث تلقائي', module: 'النظام',
    record_id: '', severity: 'info', category: 'system',
    ip_address: 'localhost', details: 'تحديث أسعار الصرف التلقائي',
    timestamp: '2026-05-28 00:05:00',
  },
  {
    id: 'act-12', user: 'خالد المشرف', action: 'قفل فترة مالية', module: 'المالية',
    record_id: 'PERIOD-2026-05', severity: 'warning', category: 'admin',
    ip_address: '192.168.1.200', details: 'قفل الفترة المالية مايو 2026',
    timestamp: '2026-05-27 17:00:00',
  },
];

const activityLogStore = createStore<ActivityLogEntry>({ key: 'erp_activity_logs', seed: seedActivityLogs });

const categoryLabels: Record<string, string> = {
  all: 'جميع الفئات',
  security: 'الأمان',
  data: 'البيانات',
  system: 'النظام',
  admin: 'الإدارة',
};

const severityLabels: Record<string, string> = {
  all: 'جميع المستويات',
  info: 'معلومة',
  warning: 'تحذير',
  error: 'خطأ',
  critical: 'حرج',
};

const severityIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  error: <XCircle className="h-4 w-4 text-red-400" />,
  critical: <Shield className="h-4 w-4 text-red-500" />,
};

const severityBadgeClass: Record<string, string> = {
  info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-300 border-red-500/30',
  critical: 'bg-red-700/30 text-red-200 border-red-700/50',
};

export default function ActivityLogPage() {
  const { t } = useLocale();
  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => activityLogStore.getAll());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [tabFilter, setTabFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const refresh = () => setLogs(activityLogStore.getAll());

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (tabFilter !== 'all' && l.category !== tabFilter) return false;
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
      if (severityFilter !== 'all' && l.severity !== severityFilter) return false;
      if (dateFrom && l.timestamp < dateFrom) return false;
      if (dateTo && l.timestamp > dateTo + ' 23:59:59') return false;
      if (search && !l.user.includes(search) && !l.action.includes(search) && !l.details.includes(search) && !l.ip_address.includes(search)) return false;
      return true;
    });
  }, [logs, search, categoryFilter, severityFilter, tabFilter, dateFrom, dateTo]);

  const handleExport = () => {
    exportToCSV(
      filtered.map((l) => ({
        'المستخدم': l.user,
        'الإجراء': l.action,
        'الوحدة': l.module,
        'رقم السجل': l.record_id,
        'المستوى': severityLabels[l.severity],
        'الفئة': categoryLabels[l.category],
        'عنوان IP': l.ip_address,
        'التفاصيل': l.details,
        'التاريخ': l.timestamp,
      })),
      [
        { key: 'المستخدم', label: 'المستخدم' },
        { key: 'الإجراء', label: 'الإجراء' },
        { key: 'الوحدة', label: 'الوحدة' },
        { key: 'رقم السجل', label: 'رقم السجل' },
        { key: 'المستوى', label: 'المستوى' },
        { key: 'الفئة', label: 'الفئة' },
        { key: 'عنوان IP', label: 'عنوان IP' },
        { key: 'التفاصيل', label: 'التفاصيل' },
        { key: 'التاريخ', label: 'التاريخ' },
      ],
      'سجل_النشاط.csv',
    );
  };

  const stats = useMemo(() => {
    const total = logs.length;
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.timestamp.startsWith(today)).length;
    const warnings = logs.filter(l => l.severity === 'warning').length;
    const errors = logs.filter(l => l.severity === 'error' || l.severity === 'critical').length;
    return { total, todayLogs, warnings, errors };
  }, [logs]);

  return (
    <div dir="rtl">
      <PageHeader
        title="سجل النشاط"
        description="سجل شامل لجميع الأنشطة والأحداث في النظام"
      >
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 ml-2" />
          تصدير
        </Button>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-3 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">إجمالي السجلات</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-3 flex items-center gap-3">
            <Clock className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold">{stats.todayLogs}</p>
              <p className="text-xs text-muted-foreground">نشاط اليوم</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold">{stats.warnings}</p>
              <p className="text-xs text-muted-foreground">تحذيرات</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-3 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold">{stats.errors}</p>
              <p className="text-xs text-muted-foreground">أخطاء</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tabFilter} onValueChange={(v) => { setTabFilter(v); setCategoryFilter('all'); }} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="data">البيانات</TabsTrigger>
          <TabsTrigger value="system">النظام</TabsTrigger>
          <TabsTrigger value="admin">الإدارة</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.common.search + '...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="المستوى" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(severityLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[140px] h-9 text-xs"
                placeholder="من تاريخ"
              />
              <span className="text-muted-foreground text-xs">-</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[140px] h-9 text-xs"
                placeholder="إلى تاريخ"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">المستوى</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الإجراء</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>رقم السجل</TableHead>
                  <TableHead>التفاصيل</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="w-[140px]">التاريخ / الوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      لا توجد سجلات نشاط
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Badge variant="outline" className={`inline-flex items-center gap-1 text-xs ${severityBadgeClass[l.severity] || ''}`}>
                        {severityIcons[l.severity]}
                        {severityLabels[l.severity] || l.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{l.user}</TableCell>
                    <TableCell>{l.action}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{l.module}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.record_id || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">{l.details}</TableCell>
                    <TableCell className="font-mono text-xs" dir="ltr">{l.ip_address}</TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap" dir="ltr">{l.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
