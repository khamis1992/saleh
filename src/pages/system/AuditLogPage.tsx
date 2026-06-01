import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { createStore } from '@/services/dataService';

interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  module: string;
  record_id: string;
  old_value: string;
  new_value: string;
  timestamp: string;
}

const seedAuditLogs: AuditLogEntry[] = [
  {
    id: 'al-1', user: 'أحمد المدير', action: 'إنشاء', module: 'الإيجارات',
    record_id: 'LSE-2026-005', old_value: '', new_value: 'تم إنشاء عقد جديد',
    timestamp: '2026-05-31 09:15:22',
  },
  {
    id: 'al-2', user: 'سارة المحاسب', action: 'تعديل', module: 'الفواتير',
    record_id: 'INV-2026-003', old_value: 'الحالة: صادرة', new_value: 'الحالة: مدفوعة جزئياً',
    timestamp: '2026-05-30 14:30:45',
  },
  {
    id: 'al-3', user: 'محمد الفني', action: 'تحديث حالة', module: 'الصيانة',
    record_id: 'WO-2026-003', old_value: 'معين للفني', new_value: 'قيد التنفيذ',
    timestamp: '2026-05-29 11:00:10',
  },
  {
    id: 'al-4', user: 'خالد المشرف', action: 'موافقة', module: 'المشاريع',
    record_id: 'CLM-2026-005', old_value: 'قيد المراجعة', new_value: 'تمت الموافقة',
    timestamp: '2026-05-28 16:45:33',
  },
  {
    id: 'al-5', user: 'أحمد المدير', action: 'حذف', module: 'المستأجرين',
    record_id: 'TNT-OLD', old_value: 'الاسم: مستأجر سابق', new_value: '',
    timestamp: '2026-05-27 10:20:55',
  },
  {
    id: 'al-6', user: 'نورة الموارد', action: 'إنشاء', module: 'الموارد البشرية',
    record_id: 'EMP-2026-012', old_value: '', new_value: 'تم إضافة موظف جديد',
    timestamp: '2026-05-26 08:00:01',
  },
  {
    id: 'al-7', user: 'سارة المحاسب', action: 'تسجيل دفعة', module: 'المالية',
    record_id: 'RCP-2026-008', old_value: '', new_value: 'تم تسديد فاتورة إيجار',
    timestamp: '2026-05-25 13:10:40',
  },
  {
    id: 'al-8', user: 'محمد الفني', action: 'إغلاق', module: 'الصيانة',
    record_id: 'WO-2026-001', old_value: 'مكتمل', new_value: 'مغلق',
    timestamp: '2026-05-24 17:00:00',
  },
];

const auditLogStore = createStore<AuditLogEntry>({ key: 'erp_audit_logs', seed: seedAuditLogs });

const actionLabels: Record<string, string> = {
  'إنشاء': 'إنشاء',
  'تعديل': 'تعديل',
  'حذف': 'حذف',
  'موافقة': 'موافقة',
  'تحديث حالة': 'تحديث حالة',
  'تسجيل دفعة': 'تسجيل دفعة',
  'إغلاق': 'إغلاق',
};

const moduleLabels: Record<string, string> = {
  'الإيجارات': 'الإيجارات',
  'الفواتير': 'الفواتير',
  'الصيانة': 'الصيانة',
  'المشاريع': 'المشاريع',
  'المستأجرين': 'المستأجرين',
  'الموارد البشرية': 'الموارد البشرية',
  'المالية': 'المالية',
};

export default function AuditLogPage() {
  const { t } = useLocale();
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => auditLogStore.getAll());
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (search && !l.user.includes(search) && !l.record_id.includes(search) && !l.module.includes(search)) return false;
      return true;
    });
  }, [logs, search, moduleFilter, actionFilter]);

  return (
    <div dir="rtl">
      <PageHeader
        title="سجل التدقيق"
        description="مراقبة وتسجيل جميع العمليات والتغييرات في النظام"
      />

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
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الوحدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الوحدات</SelectItem>
                {Object.entries(moduleLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الإجراء" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الإجراءات</SelectItem>
                {Object.entries(actionLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>الوحدة</TableHead>
                <TableHead>رقم السجل</TableHead>
                <TableHead>القيمة القديمة</TableHead>
                <TableHead>القيمة الجديدة</TableHead>
                <TableHead>التاريخ / الوقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد سجلات تدقيق
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.user}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {l.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {l.module}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{l.record_id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{l.old_value || '—'}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{l.new_value || '—'}</TableCell>
                  <TableCell className="font-mono text-xs" dir="ltr">{l.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
