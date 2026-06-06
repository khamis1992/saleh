// Vendor Portal — Submit New Quotation
// Vendor responds to RFQs with a price quote

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { contractorStore, generateId, vendorQuotationStore, rfqStore } from '@/services/stores';
import { formatQAR, formatDate, formatDateLong } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  FileText, Plus, Send, Calendar, DollarSign, Building, Hash, CheckCircle2, Eye,
  Clock, Trash2, Package,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);

const QUOTATIONS_KEY = 'erp_vendor_quotations';

interface VendorQuotation {
  id: string;
  vendor_id: string;
  rfq_id: string;
  rfq_number: string;
  amount: number;
  delivery_days: number;
  valid_until: string;
  notes: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  created_at: string;
}

function getQuotations(vendorId: string): VendorQuotation[] {
  try {
    const all: VendorQuotation[] = JSON.parse(localStorage.getItem(QUOTATIONS_KEY) || '[]');
    return all.filter((q) => q.vendor_id === vendorId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return [];
  }
}

function addQuotation(q: VendorQuotation) {
  try {
    const all: VendorQuotation[] = JSON.parse(localStorage.getItem(QUOTATIONS_KEY) || '[]');
    all.push(q);
    localStorage.setItem(QUOTATIONS_KEY, JSON.stringify(all));
  } catch {}
}

export default function VendorQuotationsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const vendorId = session?.vendorId;

  const [open, setOpen] = useState(false);
  const [rfqNumber, setRfqNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [refresh, setRefresh] = useState(0);

  const quotations = useMemo(() => vendorId ? getQuotations(vendorId) : [], [vendorId, refresh]);

  const handleSubmit = () => {
    if (!rfqNumber || !amount || !deliveryDays) {
      toast.error('الرجاء إكمال الحقول المطلوبة');
      return;
    }
    addQuotation({
      id: generateId(),
      vendor_id: vendorId!,
      rfq_id: 'rfq-' + Date.now(),
      rfq_number: rfqNumber,
      amount: Number(amount),
      delivery_days: Number(deliveryDays),
      valid_until: validUntil,
      notes,
      status: 'submitted',
      created_at: new Date().toISOString(),
    });
    toast.success(`تم تقديم عرض السعر بنجاح لطلب ${rfqNumber}`);
    setOpen(false);
    setRfqNumber('');
    setAmount('');
    setDeliveryDays('');
    setValidUntil('');
    setNotes('');
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">عروض الأسعار</h1>
          <p className="text-[12px] text-[#64748d] mt-0.5">تقديم عروض أسعار استجابة لطلبات التسعير (RFQ)</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-amber-600 hover:bg-amber-700 h-10 text-[12px]">
          <Plus className="h-4 w-4 ml-1" />
          عرض سعر جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-[12px] text-[#64748d]">إجمالي</p>
            <p className="text-[20px] font-bold text-[#061b31]">{quotations.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-[12px] text-[#9b6829]">{tt('maintenance.statuses.under_review', 'قيد المراجعة')}</p>
            <p className="text-[20px] font-bold text-[#9b6829]">
              {quotations.filter((q) => q.status === 'submitted').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-[12px] text-emerald-600">مقبول</p>
            <p className="text-[20px] font-bold text-emerald-600">
              {quotations.filter((q) => q.status === 'accepted').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-[12px] text-[#64748d]">معدل القبول</p>
            <p className="text-[20px] font-bold text-[#533afd]">
              {quotations.length > 0
                ? Math.round((quotations.filter((q) => q.status === 'accepted').length / quotations.length) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {quotations.length === 0 ? (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-[#64748d] text-[14px]">لا توجد عروض أسعار</p>
            <p className="text-[#64748d] text-[12px] mt-1">ابدأ بتقديم عرض سعر جديد عند استلام طلب RFQ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotations.map((q) => (
            <Card key={q.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-[#9b6829]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-[14px] font-bold text-[#061b31]">{q.rfq_number}</p>
                        <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${
                          q.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                          q.status === 'rejected' ? 'bg-red-50 text-[#ea2261]' :
                          q.status === 'submitted' ? 'bg-amber-50 text-[#9b6829]' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {q.status === 'accepted' ? '✓ مقبول' :
                           q.status === 'rejected' ? '✗ مرفوض' :
                           q.status === 'submitted' ? '⌛ مقدم' : 'مسودة'}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#64748d] flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(q.created_at)}
                        </span>
                        <span>·</span>
                        <span>تسليم: {q.delivery_days} يوم</span>
                        {q.valid_until && (
                          <>
                            <span>·</span>
                            <span>صالح حتى: {formatDate(q.valid_until)}</span>
                          </>
                        )}
                      </p>
                      {q.notes && <p className="text-[12px] text-[#64748d] mt-1 line-clamp-2">{q.notes}</p>}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[12px] text-[#64748d]">{tt('common.amount', 'المبلغ')}</p>
                    <p className="text-[18px] font-bold text-[#9b6829]">{fmt(q.amount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>عرض سعر جديد</DialogTitle>
            <DialogDescription className="text-[12px]">قدم عرض سعر استجابة لطلب RFQ</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">رقم طلب التسعير (RFQ)</Label>
              <Input value={rfqNumber} onChange={(e) => setRfqNumber(e.target.value)} placeholder="RFQ-2026-XXX" className="mt-1 h-10 text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px]">المبلغ (ر.ق)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 h-10 text-[13px]" dir="ltr" />
              </div>
              <div>
                <Label className="text-[12px]">مدة التسليم (يوم)</Label>
                <Input type="number" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} className="mt-1 h-10 text-[13px]" dir="ltr" />
              </div>
            </div>
            <div>
              <Label className="text-[12px]">صالح حتى</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1 h-10 text-[13px]" />
            </div>
            <div>
              <Label className="text-[12px]">{tt('common.notes', 'ملاحظات')}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أي ملاحظات أو شروط..." className="mt-1 text-[13px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tt('common.cancel', 'إلغاء')}</Button>
            <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">
              <Send className="h-4 w-4 ml-1" />
              تقديم العرض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
