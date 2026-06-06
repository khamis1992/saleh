import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  leaseStore, unitStore, tenantStore, propertyStore, invoiceStore,
  getTenantName, getUnitNumber, getPropertyName,
} from '@/services/stores';
import { logAudit } from '@/utils/exportUtils';
import { ArrowRight, AlertTriangle, FileText } from 'lucide-react';
import type { RentalInvoice } from '@/types';

const fmt = (v: number) => formatQAR(v);

const statusLabels: Record<string, string> = {
  draft: 'مسودة', active: 'نشط', expiring_soon: 'قارب الانتهاء', renewed: 'مجدد', terminated: 'منتهي', cancelled: 'ملغي',
};

const terminationReasons: Record<string, string> = {
  end_of_term: 'نهاية المدة',
  early_termination: 'إنهاء مبكر',
  breach: 'إخلال بالعقد',
  eviction: 'إخلاء',
  mutual_agreement: 'اتفاق متبادل',
  other: 'أخرى',
};

export default function ContractTerminationPage() {
  const { t } = useLocale();
  const navigate = useNavigate();

  const leases = useMemo(() => {
    return leaseStore.getAll().filter(l => ['active', 'expiring_soon'].includes(l.status));
  }, []);

  const [selectedLeaseId, setSelectedLeaseId] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);
  const [damagesAmount, setDamagesAmount] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [generateFinalInvoice, setGenerateFinalInvoice] = useState(true);
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

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

  const depositAmount = selectedLease?.security_deposit || 0;
  const refundableBalance = Math.max(0, depositAmount - damagesAmount - additionalCharges);

  const handleLeaseSelect = (id: string) => {
    setSelectedLeaseId(id);
    // Reset fields
    setTerminationDate(new Date().toISOString().split('T')[0]);
    setTerminationReason('');
    setDamagesAmount(0);
    setAdditionalCharges(0);
    setNotes('');
    setShowConfirm(false);
  };

  const handleConfirm = () => {
    if (!selectedLease || !terminationReason) {
      toast.error('يرجى اختيار العقد وسبب الإنهاء');
      return;
    }

    // 1) Update lease status to 'terminated'
    leaseStore.update(selectedLease.id, { status: 'terminated' });

    // 2) Update unit status to 'available'
    if (selectedLease.unit_id) {
      unitStore.update(selectedLease.unit_id, { status: 'available' });
    }

    // 3) If deposit refundable > 0, create a credit note invoice
    if (refundableBalance > 0) {
      const invNumber = `CN-${new Date().getFullYear()}-${String(invoiceStore.getAll().length + 1).padStart(3, '0')}`;
      const creditNote: Omit<RentalInvoice, 'id'> = {
        company_id: '',
        invoice_number: invNumber,
        tenant_id: selectedLease.tenant_id,
        contract_id: selectedLease.id,
        unit_id: selectedLease.unit_id,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        rent_amount: 0,
        service_charges: 0,
        maintenance_charges: 0,
        penalties: 0,
        discounts: refundableBalance,
        tax: 0,
        total: -refundableBalance,
        paid_amount: 0,
        balance: -refundableBalance,
        status: 'draft',
      };
      invoiceStore.create(creditNote);
    }

    // 4) Create audit log entry
    logAudit('update', 'leases', selectedLease.id, `Terminated: ${terminationReasons[terminationReason] || terminationReason}`);

    toast.success(`تم إنهاء العقد ${selectedLease.contract_number} بنجاح`);
    setShowConfirm(false);
    navigate('/leases');
  };

  return (
    <div dir="rtl" className="max-w-4xl mx-auto min-h-full bg-[#f6f9fc]">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/leases')}>
          <ArrowRight className="h-4 w-4 ml-2" />{t.common.back}
        </Button>
        <h1 className="text-2xl font-bold">إنهاء العقد / الإخلاء</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>اختيار العقد</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>العقد المراد إنهاؤه</Label>
            <Select value={selectedLeaseId} onValueChange={handleLeaseSelect}>
              <SelectTrigger>
                <SelectValue placeholder="اختر العقد" />
              </SelectTrigger>
              <SelectContent>
                {leases.length === 0 && (
                  <SelectItem value="none" disabled>لا توجد عقود نشطة</SelectItem>
                )}
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
          {/* Contract Summary */}
          <Card className="mt-4">
            <CardHeader><CardTitle>معلومات العقد المحدد</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">رقم العقد:</span> <span className="font-medium">{selectedLease.contract_number}</span></div>
                <div><span className="text-gray-500">المستأجر:</span> <span className="font-medium">{tenant?.full_name || tenant?.company_name || '-'}</span></div>
                <div><span className="text-gray-500">الوحدة:</span> <span className="font-medium">{unit?.unit_number || '-'} — {property?.property_name || ''}</span></div>
                <div><span className="text-gray-500">تاريخ البداية:</span> <span className="font-medium">{selectedLease.start_date}</span></div>
                <div><span className="text-gray-500">تاريخ النهاية:</span> <span className="font-medium">{selectedLease.end_date}</span></div>
                <div><span className="text-gray-500">قيمة الإيجار:</span> <span className="font-medium font-mono">{fmt(selectedLease.rent_amount)}</span></div>
                <div><span className="text-gray-500">التأمين:</span> <span className="font-medium font-mono">{fmt(selectedLease.security_deposit)}</span></div>
                <div><span className="text-gray-500">الحالة:</span> <Badge variant="outline">{statusLabels[selectedLease.status] || selectedLease.status}</Badge></div>
              </div>
            </CardContent>
          </Card>

          {/* Termination Details */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                تفاصيل الإنهاء
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>سبب الإنهاء *</Label>
                  <Select value={terminationReason} onValueChange={setTerminationReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السبب" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(terminationReasons).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الإنهاء *</Label>
                  <Input type="date" value={terminationDate} onChange={(e) => setTerminationDate(e.target.value)} />
                </div>
              </div>

              {/* Security Deposit Settlement */}
              <div className="border rounded-lg p-4 bg-orange-50/30">
                <h4 className="font-semibold text-sm mb-3">تسوية التأمين</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>مبلغ التأمين</Label>
                    <Input type="number" value={depositAmount} disabled className="bg-gray-50 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label>الخصومات / الأضرار</Label>
                    <Input
                      type="number"
                      value={damagesAmount || ''}
                      onChange={(e) => setDamagesAmount(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رسوم إضافية</Label>
                    <Input
                      type="number"
                      value={additionalCharges || ''}
                      onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">إجمالي الخصومات:</span>
                    <span className="font-mono font-bold mr-2 text-red-600">{fmt(damagesAmount + additionalCharges)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">المبلغ المستحق للمستأجر:</span>
                    <span className={`font-mono font-bold mr-2 ${refundableBalance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {fmt(refundableBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">ملاحظة:</span>
                    <span className="text-xs mr-2">{refundableBalance > 0 ? 'سيتم إنشاء إشعار دائن' : 'لا يوجد مبلغ مسترد'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="genInvoice"
                  checked={generateFinalInvoice}
                  onChange={(e) => setGenerateFinalInvoice(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#3B82F6] focus:ring-[#3B82F6]"
                />
                <Label htmlFor="genInvoice">إنشاء فاتورة تسوية نهائية</Label>
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية على عملية الإنهاء..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 justify-end mt-6">
            <Button variant="outline" onClick={() => navigate('/leases')}>{t.common.cancel}</Button>
            <Button
              onClick={() => setShowConfirm(true)}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <AlertTriangle className="h-4 w-4" />
              تأكيد الإنهاء
            </Button>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              تأكيد إنهاء العقد
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-3">هل أنت متأكد من إنهاء العقد <strong>{selectedLease?.contract_number}</strong>؟</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                <div><span className="text-gray-500">المستأجر:</span> <span>{tenant?.full_name || tenant?.company_name || '-'}</span></div>
                <div><span className="text-gray-500">الوحدة:</span> <span>{unit?.unit_number || '-'}</span></div>
                <div><span className="text-gray-500">سبب الإنهاء:</span> <span>{terminationReasons[terminationReason] || '-'}</span></div>
                <div><span className="text-gray-500">تاريخ الإنهاء:</span> <span>{terminationDate}</span></div>
                {refundableBalance > 0 && (
                  <div className="text-green-700 font-medium">سيتم إنشاء إشعار دائن بقيمة {fmt(refundableBalance)}</div>
                )}
              </div>
              <p className="mt-3 text-xs text-gray-500">سيتم تحديث حالة العقد إلى "منتهي" وحالة الوحدة إلى "متاحة".</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
              تأكيد الإنهاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
