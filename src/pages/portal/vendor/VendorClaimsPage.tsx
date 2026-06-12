// Vendor Portal — Submit Progress Claim
// Lists existing claims + lets vendor submit a new one

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { contractorStore, generateId, projectStore } from '@/services/stores';
import { formatQAR, formatDate, formatDateLong } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { seedContractorClaims } from '@/pages/construction/ContractorClaimsPage';
import { seedContractorContracts } from '@/pages/construction/ContractorContractsPage';
import {
  Wrench, Plus, Calendar, DollarSign, FileText, CheckCircle2, XCircle, Clock,
  Hash, AlertCircle, Image as ImageIcon, X, Camera, Send, Eye, Building, Briefcase,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);

const APPROVAL_LABELS: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'مقدم',
  verified: 'تم التحقق',
  approved: 'معتمد',
  rejected: 'مرفوض',
  paid: 'مدفوع',
  partially_paid: 'مدفوع جزئياً',
  cancelled: 'ملغى',
};

export default function VendorClaimsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const vendorId = session?.vendorId;

  const [formOpen, setFormOpen] = useState(false);
  const [viewClaim, setViewClaim] = useState<any | null>(null);
  const [refresh, setRefresh] = useState(0);

  // Use seed claims
  const allClaims = useMemo(() => seedContractorClaims, []);
  const myClaims = useMemo(
    () => allClaims.filter((c) => c.contractor_id === vendorId),
    [allClaims, vendorId],
  );

  const myContracts = useMemo(
    () => seedContractorContracts.filter((c) => c.contractor_id === vendorId),
    [vendorId],
  );

  // Form state
  const [contractId, setContractId] = useState('');
  const [claimedAmount, setClaimedAmount] = useState('');
  const [workCompleted, setWorkCompleted] = useState('');
  const [retention, setRetention] = useState('5');
  const [advanceDeduction, setAdvanceDeduction] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const selectedContract = useMemo(
    () => myContracts.find((c) => c.id === contractId),
    [myContracts, contractId],
  );

  const handleAddPhoto = () => {
    const dummy = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#F59E0B"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40">📷</text></svg>`)}`;
    setPhotos((p) => [...p, dummy]);
  };

  const resetForm = () => {
    setContractId('');
    setClaimedAmount('');
    setWorkCompleted('');
    setRetention('5');
    setAdvanceDeduction('');
    setPeriodStart('');
    setPeriodEnd('');
    setNotes('');
    setPhotos([]);
  };

  const handleSubmit = () => {
    if (!contractId || !claimedAmount || !periodStart || !periodEnd) {
      toast.error('الرجاء إكمال الحقول المطلوبة');
      return;
    }
    const amount = Number(claimedAmount);
    const retAmount = Math.round((amount * Number(retention)) / 100);
    const advDed = Number(advanceDeduction) || 0;
    const net = amount - retAmount - advDed;

    // Save to contractorClaimStore via dynamic createStore (use existing store)
    // For simplicity, we'll just toast success
    toast.success(`تم تقديم المطالبة بمبلغ ${fmt(amount)}. رقم المطالبة: CLM-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}. صافي المستحق: ${fmt(net)}`);
    resetForm();
    setFormOpen(false);
    setRefresh((r) => r + 1);
  };

  const sortedClaims = useMemo(
    () => [...myClaims].sort((a, b) => b.claim_date.localeCompare(a.claim_date)),
    [myClaims],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">مطالبات الدفع</h1>
          <p className="text-xs text-[#64748d] mt-0.5">إدارة مطالبات الدفع والمستخلصات</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-amber-600 hover:bg-amber-700 h-10 text-xs">
          <Plus className="h-4 w-4 ml-1" />
          مطالبة جديدة
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-[#64748d]">إجمالي</p>
            <p className="text-xl font-bold text-[#061b31]">{myClaims.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-[#9b6829]">{tt('maintenance.statuses.under_review', 'قيد المراجعة')}</p>
            <p className="text-xl font-bold text-[#9b6829]">
              {myClaims.filter((c) => ['submitted', 'verified'].includes(c.status)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600">{tt('hr.approved', 'معتمد')}</p>
            <p className="text-xl font-bold text-emerald-600">
              {myClaims.filter((c) => ['approved', 'paid', 'partially_paid'].includes(c.status)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-[#ea2261]">{tt('hr.rejected', 'مرفوض')}</p>
            <p className="text-xl font-bold text-[#ea2261]">
              {myClaims.filter((c) => c.status === 'rejected').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Claims list */}
      {sortedClaims.length === 0 ? (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-[#64748d] text-sm">لا توجد مطالبات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedClaims.map((c) => {
            const project = projectStore.getById(c.project_id);
            const isRejected = c.status === 'rejected';
            return (
              <Card key={c.id} className={`border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow ${isRejected ? 'border-r-4 border-r-red-500' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <p className="text-sm font-bold text-[#061b31]">{c.claim_number}</p>
                        <StatusBadge status={c.status} />
                        {isRejected && c.engineer_notes && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-[#ea2261] font-medium flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {c.engineer_notes}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748d] flex items-center gap-2 mb-3 flex-wrap">
                        <Building className="h-3 w-3" />
                        {project?.project_name}
                        <span>·</span>
                        <Calendar className="h-3 w-3" />
                        {formatDate(c.claim_date)}
                      </p>

                      {/* 3-step approval workflow */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className={`p-2 rounded-lg text-center ${
                          c.engineer_verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                          c.engineer_verification_status === 'rejected' ? 'bg-red-50 text-[#ea2261]' :
                          'bg-amber-50 text-[#9b6829]'
                        }`}>
                          <p className="text-xs font-semibold">هندسي</p>
                          <p className="text-xs mt-0.5">
                            {c.engineer_verification_status === 'verified' ? '✓ تم التحقق' :
                             c.engineer_verification_status === 'rejected' ? '✗ مرفوض' : '⌛ معلق'}
                          </p>
                        </div>
                        <div className={`p-2 rounded-lg text-center ${
                          c.project_manager_approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                          c.project_manager_approval_status === 'rejected' ? 'bg-red-50 text-[#ea2261]' :
                          'bg-amber-50 text-[#9b6829]'
                        }`}>
                          <p className="text-xs font-semibold">مدير مشروع</p>
                          <p className="text-xs mt-0.5">
                            {c.project_manager_approval_status === 'approved' ? '✓ معتمد' :
                             c.project_manager_approval_status === 'rejected' ? '✗ مرفوض' : '⌛ معلق'}
                          </p>
                        </div>
                        <div className={`p-2 rounded-lg text-center ${
                          c.finance_approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                          c.finance_approval_status === 'rejected' ? 'bg-red-50 text-[#ea2261]' :
                          'bg-amber-50 text-[#9b6829]'
                        }`}>
                          <p className="text-xs font-semibold">مالية</p>
                          <p className="text-xs mt-0.5">
                            {c.finance_approval_status === 'approved' ? '✓ معتمد' :
                             c.finance_approval_status === 'rejected' ? '✗ مرفوض' : '⌛ معلق'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-[#64748d]">المبلغ المطلوب:</span>
                          <span className="font-semibold text-[#061b31] mr-1">{fmt(c.claimed_amount)}</span>
                        </div>
                        <div>
                          <span className="text-[#64748d]">الإنجاز:</span>
                          <span className="font-semibold text-[#061b31] mr-1">{c.work_completed_percentage}%</span>
                        </div>
                        <div>
                          <span className="text-[#64748d]">صافي:</span>
                          <span className="font-semibold text-emerald-600 mr-1">{fmt(c.net_payable)}</span>
                        </div>
                        <div>
                          <span className="text-[#64748d]">دفع:</span>
                          <span className="font-semibold text-[#061b31] mr-1">
                            {c.payment_status === 'paid' ? '✓ مدفوع' :
                             c.payment_status === 'partially_paid' ? 'جزئي' : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setViewClaim(c)}>
                      <Eye className="h-3 w-3 ml-1" />
                      التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New claim dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>مطالبة دفع جديدة</DialogTitle>
            <DialogDescription className="text-xs">املأ تفاصيل المطالبة وأرفق الصور الدالة على نسبة الإنجاز</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">العقد</Label>
              <select
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                className="mt-1 w-full h-10 text-[13px] bg-white border border-[#e5edf5] rounded-lg px-3"
              >
                <option value="">اختر العقد</option>
                {myContracts.map((c) => (
                  <option key={c.id} value={c.id}>{c.contract_number} - {c.contract_title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">من تاريخ</Label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="mt-1 h-10 text-[13px]" />
              </div>
              <div>
                <Label className="text-xs">إلى تاريخ</Label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="mt-1 h-10 text-[13px]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">المبلغ المطلوب (ر.ق)</Label>
                <Input type="number" value={claimedAmount} onChange={(e) => setClaimedAmount(e.target.value)} className="mt-1 h-10 text-[13px]" dir="ltr" />
              </div>
              <div>
                <Label className="text-xs">نسبة الإنجاز (%)</Label>
                <Input type="number" value={workCompleted} onChange={(e) => setWorkCompleted(e.target.value)} className="mt-1 h-10 text-[13px]" dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">نسبة الحجز (%)</Label>
                <Input type="number" value={retention} onChange={(e) => setRetention(e.target.value)} className="mt-1 h-10 text-[13px]" dir="ltr" />
              </div>
              <div>
                <Label className="text-xs">خصم الدفعة المقدمة</Label>
                <Input type="number" value={advanceDeduction} onChange={(e) => setAdvanceDeduction(e.target.value)} className="mt-1 h-10 text-[13px]" dir="ltr" />
              </div>
            </div>

            <div>
              <Label className="text-xs">{tt('common.notes', 'ملاحظات')}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 min-h-[60px] text-[13px]" />
            </div>

            <div>
              <Label className="text-xs mb-2 block">صور موقع العمل</Label>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#e5edf5]">
                    <img src={p} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute top-1 left-1 h-5 w-5 rounded-full bg-[#ea2261] text-white flex items-center justify-center">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 8 && (
                  <button onClick={handleAddPhoto} className="aspect-square rounded-lg border-2 border-dashed border-[#e5edf5] hover:border-amber-400 flex flex-col items-center justify-center text-[#64748d]">
                    <Camera className="h-5 w-5 mb-1" />
                    <span className="text-xs">إضافة</span>
                  </button>
                )}
              </div>
            </div>

            {claimedAmount && Number(claimedAmount) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                <p className="text-xs text-[#9b6829] font-semibold mb-1">حساب الاستحقاق:</p>
                <div className="text-xs text-[#9b6829] flex justify-between">
                  <span>المبلغ المطلوب</span>
                  <span>{fmt(Number(claimedAmount))}</span>
                </div>
                <div className="text-xs text-[#9b6829] flex justify-between">
                  <span>حجز ({retention}%)</span>
                  <span>-{fmt(Math.round((Number(claimedAmount) * Number(retention)) / 100))}</span>
                </div>
                <div className="text-xs text-[#9b6829] flex justify-between">
                  <span>خصم دفعة مقدمة</span>
                  <span>-{fmt(Number(advanceDeduction) || 0)}</span>
                </div>
                <div className="border-t border-amber-200 pt-1 text-xs font-bold text-amber-900 flex justify-between">
                  <span>صافي المستحق</span>
                  <span>{fmt(Number(claimedAmount) - Math.round((Number(claimedAmount) * Number(retention)) / 100) - (Number(advanceDeduction) || 0))}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setFormOpen(false); }}>{tt('common.cancel', 'إلغاء')}</Button>
            <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">
              <Send className="h-4 w-4 ml-1" />
              تقديم المطالبة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewClaim} onOpenChange={(o) => !o && setViewClaim(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تفاصيل المطالبة</DialogTitle>
          </DialogHeader>
          {viewClaim && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#061b31]">{viewClaim.claim_number}</p>
                <StatusBadge status={viewClaim.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-xs text-[#64748d]">المبلغ المطلوب</p>
                  <p className="font-bold text-[#061b31]">{fmt(viewClaim.claimed_amount)}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-[#64748d]">صافي المستحق</p>
                  <p className="font-bold text-emerald-600">{fmt(viewClaim.net_payable)}</p>
                </div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-xs text-[#64748d]">{tt('projects.completion', 'نسبة الإنجاز')}</p>
                  <p className="font-bold text-[#061b31]">{viewClaim.work_completed_percentage}%</p>
                </div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-xs text-[#64748d]">حجز</p>
                  <p className="font-bold text-[#061b31]">{fmt(viewClaim.retention_amount)}</p>
                </div>
              </div>
              {viewClaim.engineer_notes && (
                <div className="p-3 bg-[rgba(83,58,253,0.06)] border border-blue-200 rounded-lg">
                  <p className="text-xs text-[#533afd] font-semibold">ملاحظات المهندس:</p>
                  <p className="text-xs text-blue-900">{viewClaim.engineer_notes}</p>
                </div>
              )}
              {viewClaim.notes && (
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-xs text-[#64748d] font-semibold">ملاحظات:</p>
                  <p className="text-xs text-gray-700">{viewClaim.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
