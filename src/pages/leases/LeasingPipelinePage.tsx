import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Eye, Phone, Mail, Calendar, MapPin, Filter, Check, FileText, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Drawer } from '@/components/shared/Drawer';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { KpiCard } from '@/components/shared/KpiCard';
import { toast } from 'sonner';
import { logAudit } from '@/utils/exportUtils';
import { cn } from '@/utils/cn';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: 'bayut' | 'property_finder' | 'dubizzle' | 'walk_in' | 'referral' | 'website' | 'social_media' | 'other';
  interested_unit_id: string;
  interested_unit_code?: string;
  property_id: string;
  property_name?: string;
  budget_min: number;
  budget_max: number;
  status: 'new' | 'contacted' | 'tour_scheduled' | 'tour_done' | 'application' | 'screening' | 'lease_signed' | 'lost';
  notes: string;
  assigned_to: string;
  next_followup: string;
  created_at: string;
  updated_at: string;
}

const STATUS_FLOW: { value: Lead['status']; label: string; color: string; bg: string }[] = [
  { value: 'new', label: 'جديد', color: 'text-blue-700', bg: 'bg-blue-100' },
  { value: 'contacted', label: 'تم التواصل', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  { value: 'tour_scheduled', label: 'معاينة مجدولة', color: 'text-violet-700', bg: 'bg-violet-100' },
  { value: 'tour_done', label: 'تمت المعاينة', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  { value: 'application', label: 'طلب إيجار', color: 'text-amber-700', bg: 'bg-amber-100' },
  { value: 'screening', label: 'فحص', color: 'text-orange-700', bg: 'bg-orange-100' },
  { value: 'lease_signed', label: 'تم التوقيع 🎉', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { value: 'lost', label: 'مفقود', color: 'text-red-700', bg: 'bg-red-100' },
];

const SOURCE_LABELS: Record<string, string> = {
  bayut: 'بيوت', property_finder: 'بروبرتي فايندر', dubizzle: 'دوبيزل', walk_in: 'زيارة مباشرة',
  referral: 'إحالة', website: 'الموقع', social_media: 'سوشيال ميديا', other: 'أخرى',
};

function loadLeads(): Lead[] {
  try { return JSON.parse(localStorage.getItem('erp_leads') || '[]'); } catch { return []; }
}
function saveLeads(leads: Lead[]) { localStorage.setItem('erp_leads', JSON.stringify(leads)); }

export default function LeasingPipelinePage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [form, setForm] = useState<Partial<Lead>>({ source: 'walk_in', status: 'new', budget_min: 0, budget_max: 0 });

  useEffect(() => { setLeads(loadLeads()); }, []);

  const refresh = () => setLeads(loadLeads());

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: leads.length };
    for (const l of leads) m[l.status] = (m[l.status] || 0) + 1;
    return m;
  }, [leads]);

  const filtered = activeStatus === 'all' ? leads : leads.filter(l => l.status === activeStatus);

  const stats = useMemo(() => {
    const newLeads = leads.filter(l => l.status === 'new').length;
    const tours = leads.filter(l => l.status === 'tour_scheduled' || l.status === 'tour_done').length;
    const applications = leads.filter(l => l.status === 'application' || l.status === 'screening').length;
    const closed = leads.filter(l => l.status === 'lease_signed').length;
    const lost = leads.filter(l => l.status === 'lost').length;
    const total = leads.length;
    const conversionRate = total > 0 ? Math.round((closed / total) * 100) : 0;
    return { newLeads, tours, applications, closed, lost, total, conversionRate };
  }, [leads]);

  function submitLead() {
    if (!form.name) { toast.error('الاسم مطلوب'); return; }
    const units = JSON.parse(localStorage.getItem('erp_units') || '[]');
    const unit = units.find((u: any) => u.id === form.interested_unit_id);
    const props = JSON.parse(localStorage.getItem('erp_properties') || '[]');
    const prop = unit ? props.find((p: any) => p.id === unit.property_id) : null;

    const newLead: Lead = {
      id: `ld-${Date.now()}`,
      name: form.name!,
      phone: form.phone || '',
      email: form.email || '',
      source: form.source as Lead['source'],
      interested_unit_id: form.interested_unit_id || '',
      interested_unit_code: unit?.unit_code,
      property_id: unit?.property_id || '',
      property_name: prop?.property_name,
      budget_min: form.budget_min || 0,
      budget_max: form.budget_max || 0,
      status: form.status as Lead['status'],
      notes: form.notes || '',
      assigned_to: form.assigned_to || '',
      next_followup: form.next_followup || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newLead, ...leads];
    saveLeads(updated);
    setLeads(updated);
    setShowAdd(false);
    setForm({ source: 'walk_in', status: 'new', budget_min: 0, budget_max: 0 });
    logAudit('create', 'leads', newLead.id, '', `${newLead.name}`);
    toast.success('تم إضافة العميل المحتمل');
  }

  function updateStatus(id: string, status: Lead['status']) {
    const updated = leads.map(l => l.id === id ? { ...l, status, updated_at: new Date().toISOString() } : l);
    saveLeads(updated);
    setLeads(updated);
    if (selected?.id === id) setSelected({ ...selected, status });
    toast.success(`تم تحديث الحالة إلى: ${STATUS_FLOW.find(s => s.value === status)?.label}`);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="خط أنابيب التأجير" description="إدارة دورة حياة العميل المحتمل من الاستفسار حتى توقيع العقد">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/wizards/lease')} className="h-9 text-sm gap-1.5">
            <FileText className="h-4 w-4" /> معالج عقد
          </Button>
          <Button onClick={() => setShowAdd(true)} className="bg-[#3B82F6] hover:bg-blue-600 text-white h-9 text-sm gap-1.5">
            <Plus className="h-4 w-4" /> عميل محتمل
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="عملاء محتملون" value={stats.total} sublabel="في الأنبوب" icon={<Users className="h-5 w-5" />} color="blue" />
        <KpiCard label="جدد" value={stats.newLeads} sublabel="بانتظار تواصل" icon={<Plus className="h-5 w-5" />} color="amber" />
        <KpiCard label="معاينات" value={stats.tours} sublabel="قادمة أو تمت" icon={<Eye className="h-5 w-5" />} color="violet" />
        <KpiCard label="طلبات" value={stats.applications} sublabel="بانتظار فحص" icon={<Filter className="h-5 w-5" />} color="orange" />
        <KpiCard label="عقود موقعة" value={stats.closed} sublabel="هذا الشهر" icon={<Check className="h-5 w-5" />} color="emerald" />
        <KpiCard label="معدل التحويل" value={`${stats.conversionRate}%`} sublabel="من العميل للعقد" icon={<TrendingUp className="h-5 w-5" />} color="cyan" />
      </div>

      {/* Status tabs (pipeline stages) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveStatus('all')}
          className={cn('shrink-0 h-9 px-3.5 rounded-lg text-xs font-medium',
            activeStatus === 'all' ? 'bg-[#1B2559] text-white' : 'bg-white border border-gray-200 hover:bg-gray-50')}
        >
          الكل ({leads.length})
        </button>
        {STATUS_FLOW.map(s => {
          const c = counts[s.value] || 0;
          if (c === 0 && activeStatus !== s.value) return null;
          return (
            <button
              key={s.value}
              onClick={() => setActiveStatus(s.value)}
              className={cn('shrink-0 h-9 px-3.5 rounded-lg text-xs font-medium',
                activeStatus === s.value ? 'bg-[#1B2559] text-white' : `${s.bg} ${s.color} hover:opacity-80`)}
            >
              {s.label} ({c})
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyStateWithAction
              size="lg"
              icon={<Users className="h-10 w-10 text-blue-500" />}
              title="لا يوجد عملاء محتملون"
              description="ابدأ بتسجيل العملاء المحتملين من بوابات العقارات أو الإحالات أو زيارات المكتب."
              primaryAction={{ label: 'إضافة عميل محتمل', onClick: () => setShowAdd(true) }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-right p-3 font-semibold">العميل</th>
                    <th className="text-right p-3 font-semibold">الاتصال</th>
                    <th className="text-right p-3 font-semibold">المصدر</th>
                    <th className="text-right p-3 font-semibold">الوحدة المهتم بها</th>
                    <th className="text-right p-3 font-semibold">الميزانية</th>
                    <th className="text-right p-3 font-semibold">الحالة</th>
                    <th className="text-right p-3 font-semibold">المتابعة التالية</th>
                    <th className="text-right p-3 font-semibold w-[80px]">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(l => {
                    const s = STATUS_FLOW.find(s => s.value === l.status)!;
                    return (
                      <tr key={l.id} className="hover:bg-gray-50/50">
                        <td className="p-3">
                          <p className="font-semibold text-sm">{l.name}</p>
                          <p className="text-[10px] text-muted-foreground">{l.assigned_to || '—'}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-xs font-mono">{l.phone || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{l.email || '—'}</p>
                        </td>
                        <td className="p-3">
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{SOURCE_LABELS[l.source] || l.source}</span>
                        </td>
                        <td className="p-3">
                          <p className="text-xs font-mono">{l.interested_unit_code || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{l.property_name || '—'}</p>
                        </td>
                        <td className="p-3 text-xs font-bold">
                          {l.budget_min > 0 ? `${l.budget_min.toLocaleString('en-US')} - ${l.budget_max.toLocaleString('en-US')}` : '—'}
                        </td>
                        <td className="p-3">
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', s.bg, s.color)}>{s.label}</span>
                        </td>
                        <td className="p-3 text-xs">{l.next_followup || '—'}</td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost" onClick={() => setSelected(l)} className="h-7 text-xs gap-1">
                            <Eye className="h-3 w-3" /> عرض
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead detail drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || 'تفاصيل العميل'}
        description={selected ? `${SOURCE_LABELS[selected.source] || ''} · ${selected.phone || 'لا يوجد هاتف'}` : ''}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground text-xs">البريد</p><p className="font-mono">{selected.email || '—'}</p></div>
              <div><p className="text-muted-foreground text-xs">الهاتف</p><p className="font-mono">{selected.phone || '—'}</p></div>
              <div><p className="text-muted-foreground text-xs">الوحدة المهتم بها</p><p className="font-mono">{selected.interested_unit_code || '—'}</p></div>
              <div><p className="text-muted-foreground text-xs">الميزانية</p><p className="font-bold">{selected.budget_min > 0 ? `${selected.budget_min.toLocaleString('en-US')} - ${selected.budget_max.toLocaleString('en-US')}` : '—'}</p></div>
              <div className="col-span-2"><p className="text-muted-foreground text-xs">العقار</p><p className="font-semibold">{selected.property_name || '—'}</p></div>
              <div className="col-span-2"><p className="text-muted-foreground text-xs">المسؤول</p><p>{selected.assigned_to || '—'}</p></div>
              {selected.notes && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">ملاحظات</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">تغيير الحالة</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_FLOW.filter(s => s.value !== selected.status).map(s => (
                  <Button key={s.value} size="sm" variant="outline" onClick={() => updateStatus(selected.id, s.value)} className="h-8 text-xs">
                    → {s.label}
                  </Button>
                ))}
              </div>
            </div>

            {selected.status === 'lease_signed' && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-800 font-semibold">🎉 تم توقيع العقد!</p>
                <Button size="sm" onClick={() => navigate('/wizards/lease')} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
                  إنشاء العقد الآن
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Add lead modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">إضافة عميل محتمل</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>إلغاء</Button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>الاسم *</Label><Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div><Label>المصدر</Label>
                    <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v as Lead['source'] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>الهاتف</Label><Input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+974 5555 1234" /></div>
                  <div><Label>البريد</Label><Input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>الميزانية من (ر.ق)</Label><Input type="number" value={form.budget_min || 0} onChange={e => setForm(f => ({ ...f, budget_min: Number(e.target.value) }))} /></div>
                  <div><Label>الميزانية إلى (ر.ق)</Label><Input type="number" value={form.budget_max || 0} onChange={e => setForm(f => ({ ...f, budget_max: Number(e.target.value) }))} /></div>
                </div>
                <div><Label>المسؤول</Label><Input value={form.assigned_to || ''} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="اسم مسؤول المبيعات" /></div>
                <div><Label>ملاحظات</Label><Textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                <Button onClick={submitLead} className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white h-9">إضافة</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
