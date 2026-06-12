// Tenant Portal — Notices (renew lease request + submit notice to vacate + general notifications)

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { leaseStore, generateId } from '@/services/stores';
import { formatDate, formatDateLong } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Bell, RefreshCw, LogOut, FileText, Plus, Calendar, CheckCircle2, Clock,
  AlertCircle, MessageCircle, Send, X, FileSignature, AlertTriangle,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const NOTICE_TYPES = [
  { value: 'renewal', label: 'طلب تجديد العقد', icon: RefreshCw, color: 'emerald', description: 'طلب تجديد العقد الحالي لنفس الشروط أو معدلة' },
  { value: 'vacate', label: 'إشعار إخلاء', icon: LogOut, color: 'red', description: 'إبلاغ الإدارة بنيتك إخلاء الوحدة' },
  { value: 'general', label: 'إشعار عام', icon: MessageCircle, color: 'blue', description: 'استفسار أو إشعار عام' },
];

// localStorage-backed notices
const NOTICES_KEY = 'erp_tenant_notices';

interface TenantNotice {
  id: string;
  tenant_id: string;
  type: 'renewal' | 'vacate' | 'general';
  subject: string;
  body: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
}

function getNotices(tenantId: string): TenantNotice[] {
  try {
    const all: TenantNotice[] = JSON.parse(localStorage.getItem(NOTICES_KEY) || '[]');
    return all.filter((n) => n.tenant_id === tenantId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return [];
  }
}

function addNotice(n: TenantNotice) {
  try {
    const all: TenantNotice[] = JSON.parse(localStorage.getItem(NOTICES_KEY) || '[]');
    all.push(n);
    localStorage.setItem(NOTICES_KEY, JSON.stringify(all));
  } catch {}
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'مقدم',
  under_review: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

export default function TenantNoticesPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const tenantId = session?.tenantId;
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('renewal');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [vacateDate, setVacateDate] = useState('');
  const [refresh, setRefresh] = useState(0);

  const leases = useMemo(
    () => (tenantId ? leaseStore.getAll().filter((l) => l.tenant_id === tenantId) : []),
    [tenantId],
  );
  const activeLease = useMemo(() => leases.find((l) => l.status === 'active') || leases[0], [leases]);

  const notices = useMemo(
    () => (tenantId ? getNotices(tenantId) : []),
    [tenantId, refresh],
  );

  // Default subject/body based on type
  const setTypeAndDefaults = (t: string) => {
    setType(t);
    if (t === 'renewal' && activeLease) {
      setSubject(`طلب تجديد العقد ${activeLease.contract_number}`);
      setBody(`أرجو الموافقة على تجديد العقد رقم ${activeLease.contract_number} الذي ينتهي في ${formatDateLong(activeLease.end_date)} بنفس الشروط الحالية.`);
    } else if (t === 'vacate' && activeLease) {
      setSubject(`إشعار إخلاء للعقد ${activeLease.contract_number}`);
      setBody(`أفيدكم بأنني أنوي إخلاء الوحدة بعد انتهاء العقد رقم ${activeLease.contract_number} في تاريخ ${formatDateLong(activeLease.end_date)}، وذلك وفقاً لشروط الإشعار المحددة بـ ${activeLease.termination_notice_days} يوم.`);
    } else {
      setSubject('');
      setBody('');
    }
  };

  const handleSubmit = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('الرجاء إدخال الموضوع والتفاصيل');
      return;
    }
    addNotice({
      id: generateId(),
      tenant_id: tenantId!,
      type: type as any,
      subject,
      body: body + (vacateDate ? `\n\nتاريخ الإخلاء المقترح: ${formatDateLong(vacateDate)}` : ''),
      status: 'submitted',
      created_at: new Date().toISOString(),
    });
    toast.success('تم إرسال الإشعار بنجاح');
    setOpen(false);
    setSubject('');
    setBody('');
    setVacateDate('');
    setRefresh((r) => r + 1);
  };

  // System notifications (synthesized)
  const systemNotices = useMemo(() => {
    const out: any[] = [];
    if (activeLease) {
      const endDate = new Date(activeLease.end_date);
      const daysToEnd = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToEnd > 0 && daysToEnd < 90) {
        out.push({
          id: 'sys-renewal',
          type: 'renewal_reminder',
          icon: AlertTriangle,
          color: 'amber',
          title: 'تنبيه: انتهاء العقد قريباً',
          body: `عقدك الحالي ينتهي بعد ${daysToEnd} يوم (${formatDateLong(activeLease.end_date)}). يرجى التخطيط للتجديد أو الإخلاء.`,
          date: new Date().toISOString(),
        });
      }
    }
    out.push({
      id: 'sys-welcome',
      type: 'welcome',
      icon: CheckCircle2,
      color: 'emerald',
      title: 'مرحباً بك في بوابة المستأجر',
      body: 'يمكنك متابعة عقدك وفواتيرك وطلبات الصيانة من أي مكان. لأي مساعدة، يرجى التواصل مع إدارة العقار.',
      date: activeLease?.start_date || new Date().toISOString(),
    });
    return out;
  }, [activeLease]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">{tt('legal.notices', 'الإشعارات')}</h1>
          <p className="text-xs text-[#64748d] mt-0.5">طلبات التجديد والإخلاء وإشعارات النظام</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-[#533afd] hover:bg-blue-700 h-10 text-xs">
          <Plus className="h-4 w-4 ml-1" />
          إشعار جديد
        </Button>
      </div>

      {/* System notifications */}
      {systemNotices.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748d]">إشعارات النظام</p>
          {systemNotices.map((sn) => {
            const Icon = sn.icon;
            return (
              <div key={sn.id} className={`p-4 bg-${sn.color}-50 border border-${sn.color}-200 rounded-xl flex items-start gap-3`}>
                <div className={`h-9 w-9 rounded-full bg-${sn.color}-100 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 text-${sn.color}-600`} />
                </div>
                <div className="flex-1">
                  <p className={`text-[13px] font-semibold text-${sn.color}-900`}>{sn.title}</p>
                  <p className={`text-xs text-${sn.color}-700 mt-1`}>{sn.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* My submitted notices */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748d]">طلباتي المقدمة</p>
          <span className="text-xs text-[#64748d]">{notices.length} إشعار</span>
        </div>
        {notices.length === 0 ? (
          <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
            <CardContent className="py-8 text-center">
              <Bell className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-[#64748d] text-[13px]">لم تقدم أي إشعارات بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notices.map((n) => {
              const typeInfo = NOTICE_TYPES.find((t) => t.value === n.type) || NOTICE_TYPES[2];
              const Icon = typeInfo.icon;
              return (
                <Card key={n.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg bg-${typeInfo.color}-50 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 text-${typeInfo.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-[13px] font-semibold text-[#061b31]">{n.subject}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            n.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                            n.status === 'rejected' ? 'bg-red-50 text-[#ea2261]' :
                            n.status === 'under_review' ? 'bg-[rgba(83,58,253,0.06)] text-[#533afd]' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {STATUS_LABELS[n.status]}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748d] line-clamp-2 whitespace-pre-line">{n.body}</p>
                        <p className="text-xs text-[#64748d] mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateLong(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>إشعار جديد</DialogTitle>
            <DialogDescription className="text-xs">
              اختر نوع الإشعار واملأ التفاصيل
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-2 block">نوع الإشعار</Label>
              <div className="grid grid-cols-1 gap-2">
                {NOTICE_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTypeAndDefaults(t.value)}
                      className={`p-3 rounded-lg border-2 text-right flex items-center gap-3 transition-all ${
                        type === t.value
                          ? `border-${t.color}-500 bg-${t.color}-50`
                          : 'border-[#e5edf5] hover:border-[#e5edf5]'
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-lg bg-${t.color}-100 flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 text-${t.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-[#061b31]">{t.label}</p>
                        <p className="text-xs text-[#64748d]">{t.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs">الموضوع</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 h-10 text-[13px]"
                placeholder="موضوع الإشعار"
              />
            </div>

            {type === 'vacate' && (
              <div>
                <Label className="text-xs">تاريخ الإخلاء المقترح</Label>
                <Input
                  type="date"
                  value={vacateDate}
                  onChange={(e) => setVacateDate(e.target.value)}
                  className="mt-1 h-10 text-[13px]"
                />
              </div>
            )}

            <div>
              <Label className="text-xs">التفاصيل</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1 min-h-[120px] text-[13px]"
                placeholder="اشرح تفاصيل طلبك..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} className="bg-[#533afd] hover:bg-blue-700">
              <Send className="h-4 w-4 ml-1" />
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
