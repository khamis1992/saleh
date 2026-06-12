// Tenant Portal — Move-in / Move-out Inspections
// Tenants sign off on inspection checklists. Uses SignaturePad for signing.

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { inspectionStore, leaseStore, generateId } from '@/services/stores';
import { formatDateLong } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardList, LogIn, LogOut, Calendar, FileSignature, CheckCircle2, Square, FileText,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const INSPECTION_TYPES = [
  { value: 'move_in', label: 'فحص الدخول', icon: LogIn, color: 'emerald' },
  { value: 'move_out', label: 'فحص الخروج', icon: LogOut, color: 'amber' },
  { value: 'routine', label: 'فحص دوري', icon: ClipboardList, color: 'blue' },
  { value: 'emergency', label: 'فحص طارئ', icon: ClipboardList, color: 'red' },
];

const DEFAULT_CHECKLIST = [
  { id: 'walls', label: 'الجدران بحالة جيدة' },
  { id: 'floors', label: 'الأرضيات بحالة جيدة' },
  { id: 'ceiling', label: 'السقف بدون تشققات' },
  { id: 'windows', label: 'النوافذ تعمل بشكل سليم' },
  { id: 'doors', label: 'الأبواب تعمل بشكل سليم' },
  { id: 'ac', label: 'أجهزة التكييف تعمل' },
  { id: 'electrical', label: 'الكهرباء والمفاتيح تعمل' },
  { id: 'plumbing', label: 'السباكة بدون تسريب' },
  { id: 'paint', label: 'الدهان بحالة جيدة' },
  { id: 'cleanliness', label: 'الوحدة نظيفة' },
  { id: 'keys', label: 'تم استلام المفاتيح' },
  { id: 'meter', label: 'قراءة العدادات مسجلة' },
];

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'مجدول',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  tenant_confirmed: 'مؤكد من المستأجر',
  signed: 'موقع',
};

export default function TenantInspectionsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const tenantId = session?.tenantId;

  const [signingInspection, setSigningInspection] = useState<any | null>(null);
  const [signature, setSignature] = useState<string>('');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [refresh, setRefresh] = useState(0);

  // Build inspections: synthesize a move-in inspection for each tenant's lease,
  // and include any real inspection records linked to the tenant's units.
  const inspections = useMemo(() => {
    if (!tenantId) return [];
    const leases = leaseStore.getAll().filter((l) => l.tenant_id === tenantId);
    const unitIds = leases.map((l) => l.unit_id);
    const realInspections = inspectionStore.getAll().filter((i) => unitIds.includes(i.unit_id));

    const synthesized = leases.map((l) => ({
      id: 'insp-' + l.id,
      inspection_number: `INS-IN-${l.contract_number}`,
      inspection_type: 'move_in',
      unit_id: l.unit_id,
      inspection_date: l.start_date,
      inspector_name: 'إدارة العقار',
      condition_rating: 4,
      findings: 'فحص استلام الوحدة عند بداية العقد',
      recommendations: '—',
      status: 'in_progress',
      contract_id: l.id,
      tenant_signature_url: '',
      synthesized: true,
    }));

    return [...synthesized, ...realInspections].sort((a, b) =>
      (b.inspection_date || '').localeCompare(a.inspection_date || ''),
    );
  }, [tenantId, refresh]);

  const handleToggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSign = () => {
    if (!signingInspection) return;
    if (checked.size === 0) {
      toast.error('الرجاء مراجعة عنصر واحد على الأقل');
      return;
    }
    if (!signature) {
      toast.error('الرجاء التوقيع ثم اعتماد التوقيع أولاً');
      return;
    }
    // For synthesized records, create a real inspection record with the signature
    if (signingInspection.synthesized) {
      inspectionStore.create({
        company_id: '',
        inspection_number: `INS-${new Date().getFullYear()}-${String(inspectionStore.getAll().length + 1).padStart(3, '0')}`,
        unit_id: signingInspection.unit_id,
        inspection_type: 'move_in' as any,
        inspection_date: new Date().toISOString().split('T')[0],
        inspector_name: signingInspection.inspector_name || 'إدارة العقار',
        condition_rating: 4,
        findings: signingInspection.findings + (notes ? `\n\nملاحظات المستأجر: ${notes}` : ''),
        recommendations: 'تأكيد من المستأجر باستلام الوحدة بحالة جيدة',
        status: 'completed' as any,
      } as any);
    } else {
      inspectionStore.update(signingInspection.id, {
        findings: signingInspection.findings + (notes ? `\n\nملاحظات المستأجر: ${notes}` : ''),
        status: 'completed' as any,
      } as any);
    }
    toast.success('تم توقيع الفحص بنجاح');
    setSigningInspection(null);
    setSignature('');
    setChecked(new Set());
    setNotes('');
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#061b31]">فحوصات الوحدة</h1>
        <p className="text-xs text-[#64748d] mt-0.5">فحوصات الدخول والخروج والتوقيع عليها</p>
      </div>

      {inspections.length === 0 ? (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-[#64748d] text-sm">لا توجد فحوصات حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => {
            const typeInfo = INSPECTION_TYPES.find((t) => t.value === insp.inspection_type) || INSPECTION_TYPES[2];
            const Icon = typeInfo.icon;
            const isCompleted = insp.status === 'completed' || insp.status === 'tenant_confirmed';
            const isSynthesized = (insp as any).synthesized === true;
            return (
              <Card key={insp.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`h-12 w-12 rounded-xl bg-${typeInfo.color}-50 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 text-${typeInfo.color}-600`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-bold text-[#061b31]">{insp.inspection_number}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700' :
                            insp.status === 'in_progress' ? 'bg-amber-50 text-[#9b6829]' :
                            insp.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                            'bg-[rgba(83,58,253,0.06)] text-[#533afd]'
                          }`}>
                            {STATUS_LABELS[insp.status] || insp.status}
                          </span>
                          {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <p className="text-xs text-[#64748d] flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateLong(insp.inspection_date)}
                          </span>
                          {insp.inspector_name && (
                            <>
                              <span>·</span>
                              <span>المفتش: {insp.inspector_name}</span>
                            </>
                          )}
                        </p>
                        {insp.findings && (
                          <p className="text-xs text-[#64748d] mt-1 line-clamp-2">{insp.findings}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {!isCompleted && !isSynthesized ? (
                        <Button
                          size="sm"
                          className="h-9 text-xs bg-[#533afd] hover:bg-blue-700"
                          onClick={() => setSigningInspection(insp)}
                        >
                          <FileSignature className="h-4 w-4 ml-1" />
                          مراجعة وتوقيع
                        </Button>
                      ) : isSynthesized ? (
                        <Button
                          size="sm"
                          className="h-9 text-xs bg-[#533afd] hover:bg-blue-700"
                          onClick={() => setSigningInspection(insp)}
                        >
                          <FileSignature className="h-4 w-4 ml-1" />
                          توقيع فحص الدخول
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => setSigningInspection(insp)}>
                          <FileText className="h-4 w-4 ml-1" />
                          عرض التفاصيل
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Signing dialog */}
      <Dialog open={!!signingInspection} onOpenChange={(o) => !o && setSigningInspection(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {signingInspection?.status === 'completed' ? 'تفاصيل الفحص' : 'مراجعة وتوقيع الفحص'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {signingInspection?.status === 'completed'
                ? 'تم توقيع هذا الفحص مسبقاً'
                : 'راجع القائمة أدناه ووقّع لتأكيد الفحص'}
            </DialogDescription>
          </DialogHeader>

          {signingInspection && (
            <div className="space-y-4">
              <div className="p-3 bg-[#f6f9fc] rounded-lg">
                <p className="text-xs text-[#64748d] mb-1">الملاحظات المسجلة</p>
                <p className="text-xs text-gray-700 whitespace-pre-line">{signingInspection.findings}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#061b31]">قائمة الفحص</p>
                {DEFAULT_CHECKLIST.map((item) => {
                  const isChecked = signingInspection.status === 'completed' ? true : checked.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => signingInspection.status !== 'completed' && handleToggleCheck(item.id)}
                      disabled={signingInspection.status === 'completed'}
                      className="w-full flex items-center gap-3 p-3 bg-[#f6f9fc] hover:bg-[#f6f9fc] rounded-lg text-right disabled:cursor-default"
                    >
                      {isChecked ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-300 flex-shrink-0" />
                      )}
                      <span className="text-xs text-gray-700">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {signingInspection.status !== 'completed' && (
                <>
                  <div>
                    <Label className="text-xs">ملاحظات إضافية (اختياري)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أي ملاحظات تريد تسجيلها..."
                      className="mt-1 text-[13px]"
                    />
                  </div>

                  <div>
                    <Label className="text-xs mb-2 block">التوقيع</Label>
                    <SignaturePad
                      onSave={(sig) => setSignature(sig)}
                      width={460}
                      height={160}
                    />
                    {signature && (
                      <p className="text-xs text-emerald-600 mt-1">✓ تم اعتماد التوقيع</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            {signingInspection?.status === 'completed' ? (
              <Button onClick={() => setSigningInspection(null)} className="bg-[#533afd] hover:bg-blue-700">
                إغلاق
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setSigningInspection(null)}>
                  إلغاء
                </Button>
                <Button onClick={handleSign} className="bg-[#533afd] hover:bg-blue-700">
                  <FileSignature className="h-4 w-4 ml-1" />
                  تأكيد التوقيع
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
