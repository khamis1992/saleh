// Vendor Portal — Compliance Documents
// Upload / track compliance docs (CR, tax cert, insurance, safety certs)

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { contractorStore, generateId } from '@/services/stores';
import { formatDate, formatDateLong } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText, Upload, Calendar, Hash, Shield, FileSignature, Award, Briefcase,
  CheckCircle2, AlertTriangle, Download, Trash2, Plus, X, Camera, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const COMPLIANCE_KEY = 'erp_vendor_compliance';

interface ComplianceDoc {
  id: string;
  vendor_id: string;
  doc_type: 'cr' | 'tax' | 'insurance' | 'safety' | 'license' | 'other';
  name: string;
  file_url: string;
  expiry_date: string;
  uploaded_at: string;
}

function getDocs(vendorId: string): ComplianceDoc[] {
  try {
    const all: ComplianceDoc[] = JSON.parse(localStorage.getItem(COMPLIANCE_KEY) || '[]');
    return all.filter((d) => d.vendor_id === vendorId).sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  } catch {
    return [];
  }
}

function addDoc(d: ComplianceDoc) {
  try {
    const all: ComplianceDoc[] = JSON.parse(localStorage.getItem(COMPLIANCE_KEY) || '[]');
    all.push(d);
    localStorage.setItem(COMPLIANCE_KEY, JSON.stringify(all));
  } catch {}
}

function removeDoc(id: string) {
  try {
    const all: ComplianceDoc[] = JSON.parse(localStorage.getItem(COMPLIANCE_KEY) || '[]');
    localStorage.setItem(COMPLIANCE_KEY, JSON.stringify(all.filter((d) => d.id !== id)));
  } catch {}
}

const DOC_TYPES = [
  { value: 'cr', label: 'السجل التجاري', icon: Briefcase, color: 'blue' },
  { value: 'tax', label: 'شهادة ضريبة', icon: FileText, color: 'emerald' },
  { value: 'insurance', label: 'تأمين', icon: Shield, color: 'amber' },
  { value: 'safety', label: 'شهادة سلامة', icon: Award, color: 'red' },
  { value: 'license', label: 'رخصة', icon: FileSignature, color: 'violet' },
  { value: 'other', label: 'أخرى', icon: FileText, color: 'gray' },
];

export default function VendorCompliancePage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const vendorId = session?.vendorId;
  const vendor = useMemo(() => vendorId ? contractorStore.getById(vendorId) : null, [vendorId]);

  const [showUpload, setShowUpload] = useState(false);
  const [type, setType] = useState('cr');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [refresh, setRefresh] = useState(0);

  const docs = useMemo(() => vendorId ? getDocs(vendorId) : [], [vendorId, refresh]);

  // Synthesize initial required docs from vendor data
  const requiredDocs = useMemo(() => {
    const items: any[] = [];
    if (vendor?.cr_number) items.push({ name: 'السجل التجاري', value: vendor.cr_number, status: 'verified', type: 'cr' });
    if (vendor?.tax_number) items.push({ name: 'الرقم الضريبي', value: vendor.tax_number, status: 'verified', type: 'tax' });
    items.push({ name: 'شهادة سلامة مهنية', value: '', status: 'missing', type: 'safety' });
    items.push({ name: 'تأمين المسؤولية', value: '', status: 'missing', type: 'insurance' });
    return items;
  }, [vendor]);

  const handleUpload = () => {
    if (!name.trim()) {
      toast.error('الرجاء إدخال اسم المستند');
      return;
    }
    addDoc({
      id: generateId(),
      vendor_id: vendorId!,
      doc_type: type as any,
      name,
      file_url: '',
      expiry_date: expiry,
      uploaded_at: new Date().toISOString(),
    });
    toast.success('تم رفع المستند بنجاح');
    setName('');
    setExpiry('');
    setType('cr');
    setShowUpload(false);
    setRefresh((r) => r + 1);
  };

  const isExpiringSoon = (expiry: string) => {
    if (!expiry) return false;
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days < 30 && days >= 0;
  };

  const isExpired = (expiry: string) => {
    if (!expiry) return false;
    return new Date(expiry).getTime() < Date.now();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">الوثائق النظامية</h1>
          <p className="text-[12px] text-[#64748d] mt-0.5">إدارة شهادات السجل التجاري والضرائب والتأمين</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-amber-600 hover:bg-amber-700 h-10 text-[12px]">
          <Upload className="h-4 w-4 ml-1" />
          رفع مستند
        </Button>
      </div>

      {/* Required docs (from vendor data) */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-[#9b6829]" />
            <h2 className="text-[14px] font-bold text-[#061b31]">المستندات الأساسية</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {requiredDocs.map((d, i) => {
              const typeInfo = DOC_TYPES.find((t) => t.value === d.type) || DOC_TYPES[5];
              const Icon = typeInfo.icon;
              return (
                <div key={i} className="p-3 border border-[#e5edf5] rounded-lg flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg bg-${typeInfo.color}-50 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 text-${typeInfo.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#061b31]">{d.name}</p>
                    <p className="text-[12px] text-[#64748d]" dir="ltr">{d.value || 'غير مرفوع'}</p>
                  </div>
                  {d.status === 'verified' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded docs */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardContent className="p-0">
          <div className="p-4 border-b border-[#e5edf5]">
            <h2 className="text-[14px] font-bold text-[#061b31]">المستندات المرفوعة</h2>
            <p className="text-[12px] text-[#64748d]">{docs.length} مستند</p>
          </div>
          {docs.length === 0 ? (
            <div className="py-12 text-center text-[#64748d]">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-[14px]">لا توجد مستندات مرفوعة</p>
              <p className="text-[12px] mt-1">ارفع شهاداتك النظامية لضمان استمرارية العمل</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {docs.map((d) => {
                const typeInfo = DOC_TYPES.find((t) => t.value === d.doc_type) || DOC_TYPES[5];
                const Icon = typeInfo.icon;
                const expiring = isExpiringSoon(d.expiry_date);
                const expired = isExpired(d.expiry_date);
                return (
                  <div key={d.id} className="p-4 hover:bg-[#f6f9fc] transition-colors">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`h-10 w-10 rounded-xl bg-${typeInfo.color}-50 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 text-${typeInfo.color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#061b31]">{d.name}</p>
                        <p className="text-[12px] text-[#64748d] flex items-center gap-2 flex-wrap">
                          <span>{typeInfo.label}</span>
                          <span>·</span>
                          <span>رفع: {formatDate(d.uploaded_at)}</span>
                          {d.expiry_date && (
                            <>
                              <span>·</span>
                              <span>ينتهي: {formatDate(d.expiry_date)}</span>
                            </>
                          )}
                        </p>
                      </div>
                      {expired && (
                        <span className="text-[12px] px-2 py-0.5 rounded-full bg-red-50 text-[#ea2261] font-medium">⚠ منتهي</span>
                      )}
                      {expiring && !expired && (
                        <span className="text-[12px] px-2 py-0.5 rounded-full bg-amber-50 text-[#9b6829] font-medium">قارب الانتهاء</span>
                      )}
                      {!expired && !expiring && d.expiry_date && (
                        <span className="text-[12px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">✓ ساري</span>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => { removeDoc(d.id); setRefresh((r) => r + 1); toast.success('تم الحذف'); }} className="h-7 w-7 p-0 text-[#ea2261]">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload dialog */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#061b31] mb-4">رفع مستند جديد</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-[12px]">{tt('documents.documentType', 'نوع المستند')}</Label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full h-10 text-[13px] bg-white border border-[#e5edf5] rounded-lg px-3">
                  {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[12px]">اسم المستند</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: السجل التجاري 2026" className="mt-1 h-10 text-[13px]" />
              </div>
              <div>
                <Label className="text-[12px]">تاريخ الانتهاء (اختياري)</Label>
                <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="mt-1 h-10 text-[13px]" />
              </div>
              <div className="border-2 border-dashed border-[#e5edf5] rounded-lg p-4 text-center">
                <Camera className="h-6 w-6 mx-auto text-[#64748d] mb-1" />
                <p className="text-[12px] text-[#64748d]">اضغط لرفع أو اسحب الملف</p>
                <p className="text-[12px] text-[#64748d] mt-1">PDF، JPG، PNG حتى 5MB</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowUpload(false)}>{tt('common.cancel', 'إلغاء')}</Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={handleUpload}>
                <Upload className="h-4 w-4 ml-1" />
                رفع
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
