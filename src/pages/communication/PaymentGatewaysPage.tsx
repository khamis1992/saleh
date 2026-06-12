import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  CreditCard, Plus, Settings, Edit, Shield, Activity, Coins, Star,
  CheckCircle2, AlertTriangle, Wifi, WifiOff, Eye, EyeOff, Banknote, Globe,
} from 'lucide-react';
import { paymentGatewayStore, paymentTransactionStore } from '@/services/stores';
import type { PaymentGateway, PaymentGatewayProvider, PaymentGatewayMode } from '@/types';
import { toast } from 'sonner';
import { formatQARInt } from '@/lib/format';

const providerMeta: Record<PaymentGatewayProvider, { name: string; logo: string; color: string; description: string; countries: string[] }> = {
  hyperpay: { name: 'HyperPay', logo: '🔵', color: 'from-blue-500 to-blue-600', description: 'بوابة رائدة في MENA - تدعم Mada و Apple Pay', countries: ['SA', 'AE', 'BH', 'KW', 'OM', 'QA'] },
  moyasar: { name: 'Moyasar', logo: '🟢', color: 'from-emerald-500 to-emerald-600', description: 'بوابة سعودية متخصصة - دعم STC Pay', countries: ['SA'] },
  paytabs: { name: 'PayTabs', logo: '🟠', color: 'from-orange-500 to-orange-600', description: 'موثوقة دولياً - بطاقات متعددة', countries: ['SA', 'AE', 'EG', 'JO'] },
  tap: { name: 'Tap Payments', logo: '🟣', color: 'from-violet-500 to-violet-600', description: 'متخصصة في الخليج - KNET و OmanNet', countries: ['KW', 'OM', 'BH', 'AE', 'SA'] },
};

const methodLabels: Record<string, { name: string; icon: string }> = {
  mada: { name: 'Mada', icon: '💳' },
  visa: { name: 'Visa', icon: '💳' },
  mastercard: { name: 'Mastercard', icon: '💳' },
  amex: { name: 'American Express', icon: '💳' },
  applepay: { name: 'Apple Pay', icon: '🍎' },
  stcpay: { name: 'STC Pay', icon: '📱' },
  benefit: { name: 'Benefit', icon: '💳' },
  knet: { name: 'KNET', icon: '💳' },
  omannet: { name: 'OmanNet', icon: '💳' },
};

export default function PaymentGatewaysPage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<PaymentGateway | null>(null);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<PaymentGateway | null>(null);

  const gateways = useMemo(() => paymentGatewayStore.getAll(), [refresh]);
  const transactions = useMemo(() => paymentTransactionStore.getAll(), [refresh]);

  const activeCount = gateways.filter(g => g.status === 'active').length;
  const totalTransactions = transactions.length;
  const totalVolume = transactions.reduce((s, t) => t.status === 'settled' || t.status === 'captured' ? s + t.net_amount : s, 0);
  const totalFees = transactions.reduce((s, t) => t.status === 'settled' || t.status === 'captured' ? s + t.fee : s, 0);

  const handleSave = (g: PaymentGateway) => {
    if (g.id && gateways.find(x => x.id === g.id)) {
      paymentGatewayStore.update(g.id, g);
      toast.success(`تم تحديث ${g.display_name}`);
    } else {
      paymentGatewayStore.create({
      company_id: 'comp-1', provider: g.provider, display_name: g.display_name,
      mode: g.mode, status: g.status, merchant_id: g.merchant_id,
      api_key_masked: g.api_key_masked, webhook_secret_masked: g.webhook_secret_masked,
      supported_methods: g.supported_methods, transaction_fee_percent: g.transaction_fee_percent,
      transaction_fee_fixed: g.transaction_fee_fixed, currency: g.currency,
      settlement_days: g.settlement_days, is_default: g.is_default,
      created_at: '2026-06-02', updated_at: '2026-06-02', notes: g.notes,
    });
      toast.success(`تم إضافة ${g.display_name}`);
    }
    setEditing(null); setCreating(false); setRefresh(r => r + 1);
  };

  const handleToggleStatus = (g: PaymentGateway) => {
    const next = g.status === 'active' ? 'inactive' : 'active';
    paymentGatewayStore.update(g.id, { status: next });
    toast.success(`تم ${next === 'active' ? 'تفعيل' : 'تعطيل'} ${g.display_name}`);
    setRefresh(r => r + 1);
  };

  const handleSetDefault = (g: PaymentGateway) => {
    gateways.forEach(x => paymentGatewayStore.update(x.id, { is_default: x.id === g.id }));
    toast.success(`${g.display_name} هي البوابة الافتراضية الآن`);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="بوابات الدفع"
        description="إدارة بوابات الدفع الإلكتروني ووسائل الدفع المدعومة"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="البوابات النشطة" value={`${activeCount} / ${gateways.length}`} icon={<Wifi className="h-5 w-5" />} color="green" />
        <KpiCard label="إجمالي المعاملات" value={formatQARInt(totalTransactions)} icon={<Activity className="h-5 w-5" />} color="blue" />
        <KpiCard label="حجم المدفوعات" value={`${formatQARInt(totalVolume)} ر.ق`} icon={<Coins className="h-5 w-5" />} color="emerald" />
        <KpiCard label="إجمالي الرسوم" value={`${formatQARInt(totalFees)} ر.ق`} icon={<Banknote className="h-5 w-5" />} color="orange" />
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">عرض البطاقات</TabsTrigger>
            <TabsTrigger value="list">عرض الجدول</TabsTrigger>
            <TabsTrigger value="methods">وسائل الدفع</TabsTrigger>
          </TabsList>
          <Button onClick={() => setCreating(true)} className="bg-[#533afd] hover:bg-[#533afd]">
            <Plus className="h-4 w-4 ml-2" />
            إضافة بوابة
          </Button>
        </div>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gateways.map(g => {
              const meta = providerMeta[g.provider];
              const txCount = transactions.filter(t => t.gateway_id === g.id).length;
              const vol = transactions.filter(t => t.gateway_id === g.id && (t.status === 'settled' || t.status === 'captured')).reduce((s, t) => s + t.net_amount, 0);
              return (
                <Card key={g.id} className="overflow-hidden hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
                  <div className={`h-2 bg-gradient-to-r ${meta.color}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px]`}>
                          {meta.logo}
                        </div>
                        <div>
                          <h3 className="font-bold text-base flex items-center gap-2">
                            {g.display_name}
                            {g.is_default && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          </h3>
                          <p className="text-xs text-[#64748d]">{meta.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {g.status === 'active' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{tt('leases.statuses.active', 'نشط')}</Badge>
                        ) : (
                          <Badge variant="secondary">معطل</Badge>
                        )}
                        {g.mode === 'live' ? (
                          <Badge variant="outline" className="text-xs">مباشر</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-[#9b6829]">اختبار</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-4 py-3 border-y border-[#e5edf5]">
                      <div className="text-center">
                        <div className="text-xs text-[#64748d]">المعاملات</div>
                        <div className="text-base font-bold">{txCount}</div>
                      </div>
                      <div className="text-center border-x border-[#e5edf5]">
                        <div className="text-xs text-[#64748d]">حجم التداول</div>
                        <div className="text-base font-bold">{formatQARInt(vol)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-[#64748d]">الرسوم</div>
                        <div className="text-base font-bold">{g.transaction_fee_percent}%</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3 min-h-[28px]">
                      {g.supported_methods.slice(0, 5).map(m => (
                        <span key={m} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {methodLabels[m]?.icon} {methodLabels[m]?.name || m}
                        </span>
                      ))}
                      {g.supported_methods.length > 5 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">+{g.supported_methods.length - 5}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#64748d] mb-3">
                      <span>Merchant: <code className="text-gray-700">{g.merchant_id}</code></span>
                      <span>تسوية: {g.settlement_days} يوم</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setView(g)} className="flex-1">
                        <Eye className="h-3 w-3 ml-1" /> تفاصيل
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(g)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!g.is_default && g.status === 'active' && (
                        <Button size="sm" variant="outline" onClick={() => handleSetDefault(g)} title="اجعلها افتراضية">
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleToggleStatus(g)}>
                        {g.status === 'active' ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-[#f6f9fc] text-[#64748d] text-xs">
                  <tr>
                    <th className="text-right p-3">البوابة</th>
                    <th className="text-right p-3">{tt('legal.status', 'الحالة')}</th>
                    <th className="text-right p-3">الوضع</th>
                    <th className="text-right p-3">Merchant ID</th>
                    <th className="text-right p-3">وسائل الدفع</th>
                    <th className="text-right p-3">الرسوم</th>
                    <th className="text-right p-3">التسوية</th>
                    <th className="text-right p-3">{tt('common.actions', 'إجراءات')}</th>
                  </tr>
                </thead>
                <tbody>
                  {gateways.map(g => {
                    const meta = providerMeta[g.provider];
                    return (
                      <tr key={g.id} className="border-t hover:bg-[#f6f9fc]">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-base`}>
                              {meta.logo}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {g.display_name}
                                {g.is_default && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                              </div>
                              <div className="text-xs text-[#64748d]">{meta.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {g.status === 'active' ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{tt('leases.statuses.active', 'نشط')}</Badge>
                          ) : (
                            <Badge variant="secondary">معطل</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {g.mode === 'live' ? <Badge variant="outline">مباشر</Badge> : <Badge variant="outline" className="bg-amber-50 text-[#9b6829]">اختبار</Badge>}
                        </td>
                        <td className="p-3 font-mono text-xs">{g.merchant_id}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-0.5">
                            {g.supported_methods.slice(0, 4).map(m => (
                              <span key={m} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                                {methodLabels[m]?.name || m}
                              </span>
                            ))}
                            {g.supported_methods.length > 4 && (
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">+{g.supported_methods.length - 4}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-xs">{g.transaction_fee_percent}% + {g.transaction_fee_fixed}</td>
                        <td className="p-3 text-xs">{g.settlement_days} يوم</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setView(g)}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(g)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(g)}>
                              {g.status === 'active' ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">وسائل الدفع المدعومة عبر البوابات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(methodLabels).map(([key, meta]) => {
                  const supportedBy = gateways.filter(g => g.supported_methods.includes(key as any) && g.status === 'active');
                  return (
                    <div key={key} className="border rounded-lg p-3 text-center hover:shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
                      <div className="text-3xl mb-1">{meta.icon}</div>
                      <div className="font-medium text-sm">{meta.name}</div>
                      <div className="text-xs text-[#64748d] mt-1">{supportedBy.length} بوابة نشطة</div>
                      <div className="flex justify-center gap-1 mt-2">
                        {supportedBy.map(g => (
                          <span key={g.id} className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                            {providerMeta[g.provider].name.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {(editing || creating) && (
        <GatewayDialog
          gateway={editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}

      {view && (
        <ViewDialog gateway={view} onClose={() => setView(null)} onEdit={() => { setEditing(view); setView(null); }} />
      )}
    </div>
  );
}

function GatewayDialog({ gateway, onSave, onClose }: {
  gateway: PaymentGateway | null;
  onSave: (g: PaymentGateway) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PaymentGateway>(gateway || {
    id: '', company_id: 'comp-1', provider: 'hyperpay', display_name: '',
    mode: 'test', status: 'inactive', merchant_id: '', api_key_masked: '',
    webhook_secret_masked: '', supported_methods: ['mada', 'visa', 'mastercard'],
    transaction_fee_percent: 2.4, transaction_fee_fixed: 0.5, currency: 'QAR',
    settlement_days: 2, is_default: false,
    created_at: '2026-06-02', updated_at: '2026-06-02', notes: '',
  });

  const toggleMethod = (m: string) => {
    setForm(f => ({
      ...f,
      supported_methods: f.supported_methods.includes(m as any)
        ? f.supported_methods.filter(x => x !== m)
        : [...f.supported_methods, m as any],
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle>{gateway ? 'تعديل بوابة' : 'إضافة بوابة جديدة'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>مزود البوابة</Label>
            <Select value={form.provider} onValueChange={(v) => setForm(f => ({ ...f, provider: v as PaymentGatewayProvider, display_name: f.display_name || providerMeta[v as PaymentGatewayProvider].name }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(providerMeta)).map(([k, m]) => (
                  <SelectItem key={k} value={k}>{m.logo} {m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الاسم المعروض</Label>
            <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <Label>Merchant ID</Label>
            <Input value={form.merchant_id} onChange={e => setForm(f => ({ ...f, merchant_id: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <Label>API Key</Label>
            <Input value={form.api_key_masked} onChange={e => setForm(f => ({ ...f, api_key_masked: e.target.value }))} placeholder="••••••••" className="mt-1.5" />
          </div>
          <div>
            <Label>Webhook Secret</Label>
            <Input value={form.webhook_secret_masked} onChange={e => setForm(f => ({ ...f, webhook_secret_masked: e.target.value }))} placeholder="••••••••" className="mt-1.5" />
          </div>
          <div>
            <Label>الوضع</Label>
            <Select value={form.mode} onValueChange={(v) => setForm(f => ({ ...f, mode: v as PaymentGatewayMode }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="test">اختبار</SelectItem>
                <SelectItem value="live">مباشر (Live)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>رسوم المعاملة (%)</Label>
            <Input type="number" step="0.1" value={form.transaction_fee_percent} onChange={e => setForm(f => ({ ...f, transaction_fee_percent: parseFloat(e.target.value) || 0 }))} className="mt-1.5" />
          </div>
          <div>
            <Label>رسوم ثابتة</Label>
            <Input type="number" step="0.1" value={form.transaction_fee_fixed} onChange={e => setForm(f => ({ ...f, transaction_fee_fixed: parseFloat(e.target.value) || 0 }))} className="mt-1.5" />
          </div>
          <div>
            <Label>أيام التسوية</Label>
            <Input type="number" value={form.settlement_days} onChange={e => setForm(f => ({ ...f, settlement_days: parseInt(e.target.value) || 0 }))} className="mt-1.5" />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.status === 'active'} onCheckedChange={c => setForm(f => ({ ...f, status: c ? 'active' : 'inactive' }))} />
              نشطة
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_default} onCheckedChange={c => setForm(f => ({ ...f, is_default: c }))} />
              افتراضية
            </label>
          </div>
        </div>
        <div className="mt-4">
          <Label>وسائل الدفع المدعومة</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {Object.entries(methodLabels).map(([k, m]) => (
              <label key={k} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-[#f6f9fc]">
                <input type="checkbox" checked={form.supported_methods.includes(k as any)} onChange={() => toggleMethod(k)} />
                <span>{m.icon}</span>
                <span className="text-sm">{m.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Label>{tt('common.notes', 'ملاحظات')}</Label>
          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1.5" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tt('common.cancel', 'إلغاء')}</Button>
          <Button onClick={() => onSave(form)} className="bg-[#533afd] hover:bg-[#533afd]">{tt('common.save', 'حفظ')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewDialog({ gateway, onClose, onEdit }: {
  gateway: PaymentGateway;
  onClose: () => void;
  onEdit: () => void;
}) {
  const meta = providerMeta[gateway.provider];
  const tx = paymentTransactionStore.getAll().filter(t => t.gateway_id === gateway.id);
  const totalVol = tx.filter(t => t.status === 'settled' || t.status === 'captured').reduce((s, t) => s + t.amount, 0);
  const totalFees = tx.filter(t => t.status === 'settled' || t.status === 'captured').reduce((s, t) => s + t.fee, 0);
  const successCount = tx.filter(t => ['settled', 'captured', 'authorized'].includes(t.status)).length;
  const successRate = tx.length > 0 ? Math.round((successCount / tx.length) * 100) : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl`}>
              {meta.logo}
            </div>
            {gateway.display_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[rgba(83,58,253,0.06)] rounded-lg">
              <div className="text-xs text-[#64748d]">إجمالي المعاملات</div>
              <div className="text-lg font-bold">{tx.length}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-xs text-[#64748d]">حجم التداول</div>
              <div className="text-lg font-bold">{formatQARInt(totalVol)}</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-xs text-[#64748d]">معدل النجاح</div>
              <div className="text-lg font-bold">{successRate}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 border-b">
              <span className="text-[#64748d]">المزود</span>
              <span className="font-medium">{meta.name}</span>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span className="text-[#64748d]">الوضع</span>
              <span className="font-medium">{gateway.mode === 'live' ? 'مباشر' : 'اختبار'}</span>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span className="text-[#64748d]">Merchant ID</span>
              <code className="text-xs">{gateway.merchant_id}</code>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span className="text-[#64748d]">API Key</span>
              <code className="text-xs">{gateway.api_key_masked}</code>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span className="text-[#64748d]">العملة</span>
              <span className="font-medium">{gateway.currency}</span>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span className="text-[#64748d]">الرسوم</span>
              <span className="font-medium">{gateway.transaction_fee_percent}% + {gateway.transaction_fee_fixed}</span>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span className="text-[#64748d]">التسوية</span>
              <span className="font-medium">{gateway.settlement_days} يوم</span>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span className="text-[#64748d]">الدول المدعومة</span>
              <span className="font-medium">{meta.countries.join(', ')}</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">وسائل الدفع ({gateway.supported_methods.length})</div>
            <div className="flex flex-wrap gap-1">
              {gateway.supported_methods.map(m => (
                <span key={m} className="text-xs px-2 py-1 bg-gray-100 rounded">
                  {methodLabels[m]?.icon} {methodLabels[m]?.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button onClick={onEdit} className="bg-[#533afd] hover:bg-[#533afd]">
            <Edit className="h-4 w-4 ml-1" /> تعديل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
