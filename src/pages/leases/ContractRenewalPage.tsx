import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  leaseStore, tenantStore, unitStore, propertyStore, rentScheduleStore,
  getTenantName, getUnitNumber, getPropertyName,
} from '@/services/stores';
import { ArrowRight, Save, Eye, Calculator } from 'lucide-react';
import type { RentSchedule } from '@/types';

const fmt = (v: number) => formatQAR(v);

const statusLabels: Record<string, string> = {
  draft: 'مسودة', pending_approval: 'بانتظار الموافقة', approved: 'معتمد', pending_signature: 'بانتظار التوقيع',
  active: 'نشط', expiring_soon: 'قارب الانتهاء', renewed: 'مجدد', terminated: 'منتهي', cancelled: 'ملغي', legal: 'قانوني',
};

const paymentFreqLabels: Record<string, string> = {
  monthly: 'شهري', quarterly: 'ربع سنوي', semi_annual: 'نصف سنوي', annual: 'سنوي', custom: 'مخصص',
};

export default function ContractRenewalPage() {
  const { t } = useLocale();
  const navigate = useNavigate();

  const leases = useMemo(() => {
    return leaseStore.getAll().filter(l => ['active', 'expiring_soon', 'draft'].includes(l.status));
  }, []);

  const [selectedLeaseId, setSelectedLeaseId] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newRentAmount, setNewRentAmount] = useState<number>(0);
  const [renewalTerms, setRenewalTerms] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const selectedLease = useMemo(() => {
    if (!selectedLeaseId) return null;
    return leases.find(l => l.id === selectedLeaseId) || null;
  }, [selectedLeaseId, leases]);

  const tenant = useMemo(() => {
    if (!selectedLease) return null;
    return tenantStore.getById(selectedLease.tenant_id) || null;
  }, [selectedLease]);

  const unit = useMemo(() => {
    if (!selectedLease) return null;
    return unitStore.getById(selectedLease.unit_id) || null;
  }, [selectedLease]);

  const property = useMemo(() => {
    if (!selectedLease) return null;
    return propertyStore.getById(selectedLease.property_id) || null;
  }, [selectedLease]);

  const percentIncrease = useMemo(() => {
    if (!selectedLease || !newRentAmount || selectedLease.rent_amount <= 0) return 0;
    return parseFloat((((newRentAmount - selectedLease.rent_amount) / selectedLease.rent_amount) * 100).toFixed(1));
  }, [selectedLease, newRentAmount]);

  const handleLeaseSelect = (id: string) => {
    setSelectedLeaseId(id);
    const lease = leases.find(l => l.id === id);
    if (lease) {
      // Auto-fill dates: new start = day after old end, new end = 1 year later
      const oldEnd = new Date(lease.end_date);
      const newStart = new Date(oldEnd);
      newStart.setDate(newStart.getDate() + 1);
      const newEnd = new Date(newStart);
      newEnd.setFullYear(newEnd.getFullYear() + 1);
      newEnd.setDate(newEnd.getDate() - 1);

      setNewStartDate(newStart.toISOString().split('T')[0]);
      setNewEndDate(newEnd.toISOString().split('T')[0]);
      setNewRentAmount(lease.rent_amount);
      setRenewalTerms('');
    }
  };

  const handleFillDates = () => {
    setShowPreview(true);
  };

  const handleConfirm = () => {
    if (!selectedLease || !newStartDate || !newEndDate || !newRentAmount) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // 1) Update old lease status to 'renewed'
    leaseStore.update(selectedLease.id, { status: 'renewed' });

    // 2) Create new LeaseContract with status 'draft'
    const newContractNumber = `LSE-${new Date().getFullYear()}-${String(leaseStore.getAll().length + 1).padStart(3, '0')}`;
    const newLease = leaseStore.create({
      company_id: selectedLease.company_id || '',
      contract_number: newContractNumber,
      tenant_id: selectedLease.tenant_id,
      property_id: selectedLease.property_id,
      unit_id: selectedLease.unit_id,
      start_date: newStartDate,
      end_date: newEndDate,
      rent_amount: newRentAmount,
      payment_frequency: selectedLease.payment_frequency,
      security_deposit: selectedLease.security_deposit,
      admin_fees: selectedLease.admin_fees,
      commission: 0,
      grace_period_days: selectedLease.grace_period_days,
      late_fee_type: selectedLease.late_fee_type,
      late_fee_amount: selectedLease.late_fee_amount,
      auto_renewal_allowed: selectedLease.auto_renewal_allowed,
      renewal_notice_days: selectedLease.renewal_notice_days,
      termination_notice_days: selectedLease.termination_notice_days,
      status: 'draft',
    });

    // 3) Auto-generate rent schedule entries for entire term
    const freq = selectedLease.payment_frequency;
    let intervalMonths = 1;
    if (freq === 'quarterly') intervalMonths = 3;
    else if (freq === 'semi_annual') intervalMonths = 6;
    else if (freq === 'annual') intervalMonths = 12;

    const startDate = new Date(newStartDate);
    const endDate = new Date(newEndDate);
    const periodAmount = Math.round(newRentAmount / (12 / intervalMonths));

    let currentStart = new Date(startDate);
    let seq = 0;
    while (currentStart < endDate) {
      const periodEnd = new Date(currentStart);
      periodEnd.setMonth(periodEnd.getMonth() + intervalMonths);
      periodEnd.setDate(periodEnd.getDate() - 1);
      if (periodEnd > endDate) periodEnd.setTime(endDate.getTime());

      const schedule: Omit<RentSchedule, 'id'> = {
        company_id: '',
        contract_id: newLease.id,
        due_date: currentStart.toISOString().split('T')[0],
        period_start: currentStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        rent_amount: periodAmount,
        service_charges: 0,
        other_charges: 0,
        late_fee: 0,
        total_due: periodAmount,
        paid_amount: 0,
        balance: periodAmount,
        status: 'upcoming',
      };
      rentScheduleStore.create(schedule);

      currentStart = new Date(periodEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      seq++;
      if (seq > 100) break; // safety
    }

    toast.success(`تم تجديد العقد بنجاح — رقم العقد الجديد: ${newContractNumber}`);
    setShowPreview(false);
    navigate(`/leases/${newLease.id}`);
  };

  return (
    <div dir="rtl" className="max-w-4xl mx-auto min-h-full bg-[#f6f9fc]">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/leases')}>
          <ArrowRight className="h-4 w-4 ml-2" />{t.common.back}
        </Button>
        <h1 className="text-2xl font-bold">تجديد العقد</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>اختيار العقد</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>العقد المراد تجديده</Label>
            <Select value={selectedLeaseId} onValueChange={handleLeaseSelect}>
              <SelectTrigger>
                <SelectValue placeholder="اختر العقد" />
              </SelectTrigger>
              <SelectContent>
                {leases.map(lease => {
                  const tnt = tenantStore.getById(lease.tenant_id);
                  const unt = unitStore.getById(lease.unit_id);
                  return (
                    <SelectItem key={lease.id} value={lease.id}>
                      {lease.contract_number} — {tnt?.full_name || tnt?.company_name || lease.tenant_id} — {unt?.unit_number || lease.unit_id} ({statusLabels[lease.status] || lease.status})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedLease && (
        <>
          {/* Old Contract Summary */}
          <Card className="mt-4">
            <CardHeader><CardTitle>معلومات العقد الحالي</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">رقم العقد:</span> <span className="font-medium">{selectedLease.contract_number}</span></div>
                <div><span className="text-gray-500">المستأجر:</span> <span className="font-medium">{tenant?.full_name || tenant?.company_name || '-'}</span></div>
                <div><span className="text-gray-500">الوحدة:</span> <span className="font-medium">{unit?.unit_number || '-'} — {property?.property_name || ''}</span></div>
                <div><span className="text-gray-500">تاريخ البداية:</span> <span className="font-medium">{selectedLease.start_date}</span></div>
                <div><span className="text-gray-500">تاريخ النهاية:</span> <span className="font-medium">{selectedLease.end_date}</span></div>
                <div><span className="text-gray-500">قيمة الإيجار:</span> <span className="font-medium font-mono">{fmt(selectedLease.rent_amount)}</span></div>
                <div><span className="text-gray-500">دورية الدفع:</span> <span className="font-medium">{paymentFreqLabels[selectedLease.payment_frequency]}</span></div>
                <div><span className="text-gray-500">التأمين:</span> <span className="font-medium font-mono">{fmt(selectedLease.security_deposit)}</span></div>
                <div><span className="text-gray-500">الحالة:</span> <Badge variant="outline">{statusLabels[selectedLease.status] || selectedLease.status}</Badge></div>
              </div>
            </CardContent>
          </Card>

          {/* New Contract Details */}
          <Card className="mt-4">
            <CardHeader><CardTitle>شروط التجديد</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ البداية الجديد *</Label>
                  <Input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ النهاية الجديد *</Label>
                  <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>مبلغ الإيجار الجديد *</Label>
                  <Input
                    type="number"
                    value={newRentAmount || ''}
                    onChange={(e) => setNewRentAmount(Number(e.target.value))}
                  />
                  {percentIncrease !== 0 && (
                    <p className={`text-xs font-medium mt-1 ${percentIncrease > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      <Calculator className="h-3 w-3 inline ml-1" />
                      نسبة التغيير: {percentIncrease > 0 ? '+' : ''}{percentIncrease}% عن القديم
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>الإيجار القديم</Label>
                  <Input type="number" value={selectedLease.rent_amount} disabled className="bg-gray-50" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>شروط إضافية للتجديد</Label>
                  <Textarea
                    value={renewalTerms}
                    onChange={(e) => setRenewalTerms(e.target.value)}
                    placeholder="أي شروط إضافية أو ملاحظات على التجديد..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 justify-end mt-6">
            <Button variant="outline" onClick={() => navigate('/leases')}>{t.common.cancel}</Button>
            <Button
              onClick={handleFillDates}
              className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white"
            >
              <Eye className="h-4 w-4" />
              معاينة التجديد
            </Button>
          </div>
        </>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>معاينة قبل التجديد</DialogTitle>
          </DialogHeader>
          {selectedLease && (
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2">ملخص التغييرات</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 text-xs">الرقم القديم → الجديد</span>
                    <p className="font-mono">{selectedLease.contract_number} → LSE-{new Date().getFullYear()}-...</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">المدة</span>
                    <p>{newStartDate} → {newEndDate}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">الإيجار القديم</span>
                    <p className="font-mono">{fmt(selectedLease.rent_amount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">الإيجار الجديد</span>
                    <p className={`font-mono font-bold ${newRentAmount > selectedLease.rent_amount ? 'text-orange-600' : newRentAmount < selectedLease.rent_amount ? 'text-green-600' : 'text-blue-600'}`}>
                      {fmt(newRentAmount)}
                      {percentIncrease !== 0 && <span className="text-xs mr-2">({percentIncrease > 0 ? '+' : ''}{percentIncrease}%)</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">المستأجر</span>
                    <p>{tenant?.full_name || tenant?.company_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">الوحدة</span>
                    <p>{unit?.unit_number || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">التأمين</span>
                    <p className="font-mono">{fmt(selectedLease.security_deposit)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">دورية الدفع</span>
                    <p>{paymentFreqLabels[selectedLease.payment_frequency]}</p>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                سيتم إنشاء عقد جديد بحالة "مسودة" وجدول دفعات تلقائي لكامل المدة. سيتم تحديث العقد القديم إلى حالة "مجدد".
              </div>
              {renewalTerms && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs">شروط إضافية:</span>
                  <p className="text-sm mt-1">{renewalTerms}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>إلغاء</Button>
            <Button onClick={handleConfirm} className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white">
              <Save className="h-4 w-4" />
              تأكيد التجديد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}