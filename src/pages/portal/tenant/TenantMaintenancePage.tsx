// Tenant Portal — Maintenance Requests (submit + track + photos)

import {
import { useLocale } from '@/providers/LocaleContext'; useMemo, useState } from 'react';
import {
import { useLocale } from '@/providers/LocaleContext'; usePortalAuth } from '@/providers/PortalAuthContext';
import {
import { useLocale } from '@/providers/LocaleContext'; maintenanceStore } from '@/services/stores';
import {
import { useLocale } from '@/providers/LocaleContext'; generateId } from '@/services/dataService';
import {
import { useLocale } from '@/providers/LocaleContext'; formatDate, formatDateLong } from '@/lib/format';
import {
import { useLocale } from '@/providers/LocaleContext'; StatusBadge } from '@/components/shared/StatusBadge';
import {
import { useLocale } from '@/providers/LocaleContext'; Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
import { useLocale } from '@/providers/LocaleContext'; Button } from '@/components/ui/button';
import {
import { useLocale } from '@/providers/LocaleContext'; Input } from '@/components/ui/input';
import {
import { useLocale } from '@/providers/LocaleContext'; Textarea } from '@/components/ui/textarea';
import {
import { useLocale } from '@/providers/LocaleContext'; Label } from '@/components/ui/label';
import {
import { useLocale } from '@/providers/LocaleContext';
  Wrench, Plus, X, AlertCircle, Clock, CheckCircle2, XCircle, Camera, Image as ImageIcon,
  Calendar, Hash, FileText, Eye, Trash2, AlertTriangle, Activity,
} from 'lucide-react';
import {
import { useLocale } from '@/providers/LocaleContext'; toast } from 'sonner';
import {
import { useLocale } from '@/providers/LocaleContext';
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

const CATEGORIES = [
  { value: 'ac', label: 'تكييف', icon: '❄️' },
  { value: 'electrical', label: 'كهرباء', icon: '⚡' },
  { value: 'plumbing', label: 'سباكة', icon: '🚿' },
  { value: 'water_leakage', label: 'تسرب مياه', icon: '💧' },
  { value: 'door_window', label: 'أبواب / شبابيك', icon: '🚪' },
  { value: 'painting', label: 'دهان', icon: '🎨' },
  { value: 'elevator', label: 'مصاعد', icon: '🛗' },
  { value: 'fire_alarm', label: 'إنذار حريق', icon: '🔥' },
  { value: 'pest_control', label: 'مكافحة حشرات', icon: '🪲' },
  { value: 'cleaning', label: 'تنظيف', icon: '🧹' },
  { value: 'landscaping', label: 'تشجير', icon: '🌳' },
  { value: 'general', label: 'عام', icon: '🔧' },
];

const PRIORITIES = [
  { value: 'low', label: 'منخفضة', color: 'emerald' },
  { value: 'medium', label: 'متوسطة', color: 'amber' },
  { value: 'high', label: 'عالية', color: 'red' },
  { value: 'emergency', label: 'طارئ', color: 'red' },
];

interface FormState {
  category: string;
  priority: string;
  description: string;
  preferred_visit_time: string;
  photos: string[];
}

const emptyForm: FormState = {
  category: 'general',
  priority: 'medium',
  description: '',
  preferred_visit_time: '10:00 - 12:00',
  photos: [],
};

export default function TenantMaintenancePage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const tenantId = session?.tenantId;
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [viewRequest, setViewRequest] = useState<any | null>(null);
  const [refresh, setRefresh] = useState(0);

  const requests = useMemo(
    () => (tenantId ? maintenanceStore.getAll().filter((m) => m.tenant_id === tenantId) : []),
    [tenantId, refresh],
  );

  const sorted = useMemo(
    () => [...requests].sort((a, b) => b.request_number.localeCompare(a.request_number)),
    [requests],
  );

  const handleAddPhoto = () => {
    // Simulate adding a photo (data URL would normally come from file input)
    const dummyPhoto = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#533afd"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40">📷</text></svg>`)}`;
    setForm({ ...form, photos: [...form.photos, dummyPhoto] });
    toast.success('تمت إضافة الصورة');
  };

  const handleRemovePhoto = (idx: number) => {
    setForm({ ...form, photos: form.photos.filter((_, i) => i !== idx) });
  };

  const handleSubmit = () => {
    if (!form.description.trim()) {
      toast.error('الرجاء كتابة وصف المشكلة');
      return;
    }
    const newReq = maintenanceStore.create({
      company_id: '',
      request_number: `MNT-${new Date().getFullYear()}-${String(maintenanceStore.getAll().length + 1).padStart(3, '0')}`,
      property_id: '',
      unit_id: '',
      tenant_id: tenantId!,
      category: form.category as any,
      priority: form.priority as any,
      description: form.description,
      preferred_visit_time: form.preferred_visit_time,
      status: 'submitted' as any,
      assigned_team_id: '',
      created_by: tenantId!,
    });
    // Store photos in a parallel notes field (in real app, would be a separate table)
    if (form.photos.length > 0) {
      maintenanceStore.update(newReq.id, { description: `${form.description}\n\n[الصور: ${form.photos.length} صورة مرفقة]` });
    }
    toast.success('تم تقديم طلب الصيانة بنجاح');
    setForm(emptyForm);
    setFormOpen(false);
    setRefresh((r) => r + 1);
  };

  const handleCancelRequest = (id: string) => {
    maintenanceStore.update(id, { status: 'cancelled' as any });
    toast.success('تم إلغاء الطلب');
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">{tt('maintenance.requests', 'طلبات الصيانة')}</h1>
          <p className="text-xs text-[#64748d] mt-0.5">قدّم وتتبع طلبات الصيانة لوحدتك</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 h-10 text-[13px] font-semibold" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 ml-1" />
          طلب صيانة جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-[#64748d]">إجمالي</p>
            <p className="text-xl font-bold text-[#061b31]">{requests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-[#9b6829]">قيد المعالجة</p>
            <p className="text-xl font-bold text-[#9b6829]">
              {requests.filter((r) => ['submitted', 'under_review', 'approved', 'assigned', 'in_progress', 'waiting_parts'].includes(r.status)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600">{tt('maintenance.statuses.completed', 'مكتمل')}</p>
            <p className="text-xl font-bold text-emerald-600">
              {requests.filter((r) => ['completed', 'closed', 'tenant_confirmed'].includes(r.status)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-[#ea2261]">ملغى</p>
            <p className="text-xl font-bold text-[#ea2261]">
              {requests.filter((r) => r.status === 'cancelled').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests list */}
      {sorted.length === 0 ? (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-[#64748d] text-sm">لا توجد طلبات صيانة</p>
            <p className="text-[#64748d] text-xs mt-1">ابدأ بتقديم طلب صيانة جديد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((req) => (
            <Card key={req.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#061b31]">{req.request_number}</p>
                        <p className="text-xs text-[#64748d]">
                          {CATEGORIES.find((c) => c.value === req.category)?.icon} {CATEGORIES.find((c) => c.value === req.category)?.label}
                        </p>
                      </div>
                      <StatusBadge status={req.status} />
                      {req.priority === 'emergency' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-[#ea2261] font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> طارئ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 mb-2 leading-relaxed">{req.description}</p>
                    <div className="flex items-center gap-3 text-xs text-[#64748d] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        الوقت المفضل: {req.preferred_visit_time}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setViewRequest(req)}>
                      <Eye className="h-3 w-3 ml-1" />
                      التفاصيل
                    </Button>
                    {!['completed', 'closed', 'cancelled', 'tenant_confirmed'].includes(req.status) && (
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-[#ea2261] hover:bg-red-50" onClick={() => handleCancelRequest(req.id)}>
                        <XCircle className="h-3 w-3 ml-1" />
                        إلغاء
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New request dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">طلب صيانة جديد</DialogTitle>
            <DialogDescription className="text-xs">
              املأ التفاصيل التالية وسيتم التواصل معك في أقرب وقت
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-2 block">نوع المشكلة</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setForm({ ...form, category: c.value })}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${
                      form.category === c.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-[#e5edf5] hover:border-[#e5edf5]'
                    }`}
                  >
                    <div className="text-xl mb-1">{c.icon}</div>
                    <p className="text-xs text-gray-700">{c.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">{tt('maintenance.priority', 'الأولوية')}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setForm({ ...form, priority: p.value })}
                    className={`p-2 rounded-lg border-2 text-center text-xs font-medium transition-all ${
                      form.priority === p.value
                        ? `border-${p.color}-500 bg-${p.color}-50 text-${p.color}-700`
                        : 'border-[#e5edf5] text-[#64748d] hover:border-[#e5edf5]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">وصف المشكلة</Label>
              <Textarea
                placeholder="اشرح المشكلة بالتفصيل..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 min-h-[100px] text-[13px]"
              />
            </div>

            <div>
              <Label className="text-xs">الوقت المفضل للزيارة</Label>
              <Input
                value={form.preferred_visit_time}
                onChange={(e) => setForm({ ...form, preferred_visit_time: e.target.value })}
                placeholder="مثال: 10:00 - 12:00"
                className="mt-1 h-10 text-[13px]"
              />
            </div>

            <div>
              <Label className="text-xs mb-2 block">صور المشكلة (اختياري)</Label>
              <div className="grid grid-cols-4 gap-2">
                {form.photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#e5edf5]">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute top-1 left-1 h-5 w-5 rounded-full bg-[#ea2261] text-white flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {form.photos.length < 6 && (
                  <button
                    onClick={handleAddPhoto}
                    className="aspect-square rounded-lg border-2 border-dashed border-[#e5edf5] hover:border-violet-400 flex flex-col items-center justify-center text-[#64748d] hover:text-violet-600"
                  >
                    <Camera className="h-5 w-5 mb-1" />
                    <span className="text-xs">إضافة صورة</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setForm(emptyForm); setFormOpen(false); }}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} className="bg-violet-600 hover:bg-violet-700">
              <Wrench className="h-4 w-4 ml-1" />
              تقديم الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View request dialog */}
      <Dialog open={!!viewRequest} onOpenChange={(o) => !o && setViewRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تفاصيل طلب الصيانة</DialogTitle>
          </DialogHeader>
          {viewRequest && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#061b31]">{viewRequest.request_number}</p>
                <StatusBadge status={viewRequest.status} />
              </div>
              <div className="p-3 bg-[#f6f9fc] rounded-lg">
                <p className="text-xs text-[#64748d] mb-1">{tt('maintenance.description', 'الوصف')}</p>
                <p className="text-xs text-gray-700 whitespace-pre-line">{viewRequest.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-xs text-[#64748d]">{tt('inventory.category', 'الفئة')}</p>
                  <p className="text-xs font-semibold">
                    {CATEGORIES.find((c) => c.value === viewRequest.category)?.label}
                  </p>
                </div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-xs text-[#64748d]">{tt('maintenance.priority', 'الأولوية')}</p>
                  <p className="text-xs font-semibold">
                    {PRIORITIES.find((p) => p.value === viewRequest.priority)?.label}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
