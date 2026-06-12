import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Shield, Building2, FileText, Globe, AlertTriangle, CheckCircle2, Clock,
  Plus, Eye, Download, RefreshCw, Calendar, DollarSign,
} from 'lucide-react';
import { regulatoryStore } from '@/services/stores';
import {
  AUTHORITY_REGISTRY, REGULATORY_STATUS_LABELS_AR, REGULATORY_STATUS_VARIANTS,
  REGISTRATION_TYPES, isExpiringSoon, isExpired, daysUntilExpiry,
} from '@/utils/regulatory';
import { formatQAR } from '@/lib/format';
import type { RegulatoryAuthority, RegulatoryRegistration, RegulatoryStatus } from '@/types';

export default function RegulatoryPage() {
  const { dir } = useLocale();
  const [registrations, setRegistrations] = useState(() => regulatoryStore.getAll());
  const [authorityFilter, setAuthorityFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const refresh = () => setRegistrations(regulatoryStore.getAll());
  const now = new Date();

  const filtered = useMemo(() => {
    return registrations.filter(r => authorityFilter === 'all' || r.authority === authorityFilter).sort((a, b) => b.issue_date.localeCompare(a.issue_date));
  }, [registrations, authorityFilter]);

  const kpis = useMemo(() => ({
    total: filtered.length,
    expiringSoon: filtered.filter(r => isExpiringSoon(r, 30, now)).length,
    expired: filtered.filter(r => isExpired(r, now)).length,
    totalFees: filtered.filter(r => r.status === 'registered' || r.status === 'renewed').reduce((s, r) => s + r.fee_amount, 0),
  }), [filtered]);

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader title="السجل التنظيمي — دول الخليج" description="تتبع وإدارة التسجيلات الحكومية والتراخيص الرسمية (إيجاري، بلدي، RERA، بلدية دبي، إلخ)" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard icon={FileText} label="إجمالي التسجيلات" value={String(kpis.total)} color="blue" />
        <KPICard icon={Clock} label="قريبة الانتهاء (30 يوم)" value={String(kpis.expiringSoon)} color="amber" />
        <KPICard icon={AlertTriangle} label="منتهية" value={String(kpis.expired)} color="red" />
        <KPICard icon={DollarSign} label="الرسوم المدفوعة" value={formatQAR(kpis.totalFees)} color="emerald" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Label>الجهة:</Label>
          <Select value={authorityFilter} onValueChange={setAuthorityFilter}>
            <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الجهات</SelectItem>
              {(Object.keys(AUTHORITY_REGISTRY) as RegulatoryAuthority[]).map(a => (
                <SelectItem key={a} value={a}>{AUTHORITY_REGISTRY[a].name_ar}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-[#533afd] hover:bg-[#533afd]">
          <Plus className="h-4 w-4" /> تسجيل جديد
        </Button>
      </div>

      <Tabs defaultValue="all" dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">الكل ({filtered.length})</TabsTrigger>
          <TabsTrigger value="expiring">قريبة الانتهاء ({kpis.expiringSoon})</TabsTrigger>
          <TabsTrigger value="expired">منتهية ({kpis.expired})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الجهة</TableHead><TableHead>{tt('equipment.equipmentType', 'النوع')}</TableHead><TableHead>المرجع</TableHead>
                    <TableHead>تاريخ الإصدار</TableHead><TableHead>الانتهاء</TableHead><TableHead>الرسوم</TableHead>
                    <TableHead>{tt('legal.status', 'الحالة')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => {
                    const meta = AUTHORITY_REGISTRY[r.authority];
                    const days = daysUntilExpiry(r, now);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Shield className="h-4 w-4 text-[#64748d]" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold">{meta.name_ar}</p>
                              <p className="text-xs text-[#64748d]">{meta.country}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{r.registration_type}</TableCell>
                        <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                        <TableCell className="text-xs">{r.issue_date}</TableCell>
                        <TableCell className="text-xs">
                          {r.expiry_date ? (
                            <span className={days <= 0 ? 'text-[#ea2261] font-semibold' : days <= 30 ? 'text-[#9b6829] font-semibold' : ''}>
                              {r.expiry_date} {days > 0 && days <= 30 && <span className="text-xs">({days} يوم)</span>}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{meta.fee_currency} {r.fee_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={REGULATORY_STATUS_VARIANTS[r.status]}>{REGULATORY_STATUS_LABELS_AR[r.status]}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="p-8 text-center text-[#64748d]">لا توجد تسجيلات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <AlertTriangle className="h-4 w-4 inline mr-1 text-[#9b6829]" />
        <strong>تنبيه:</strong> هذه التسجيلات هي سجل مرجعي. التقديم الفعلي يتم عبر البوابات الرسمية لكل جهة. راجع تواريخ الانتهاء بانتظام لتجنب الغرامات.
      </div>

      {createOpen && (
        <CreateRegistrationDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={(data) => {
          regulatoryStore.create({
            company_id: 'comp-1',
            authority: data.authority, registration_type: data.registration_type,
            reference: data.reference, property_id: '', unit_id: '', lease_id: '',
            issue_date: data.issue_date, expiry_date: data.expiry_date, fee_amount: data.fee_amount,
            status: 'registered', document_url: '', notes: data.notes,
            created_at: new Date().toISOString(),
          });
          refresh();
          setCreateOpen(false);
          toast.success(`تم تسجيل ${AUTHORITY_REGISTRY[data.authority].name_ar}`);
        }} />
      )}
    </div>
  );
}

function CreateRegistrationDialog({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void; onCreate: (data: { authority: RegulatoryAuthority; registration_type: string; reference: string; issue_date: string; expiry_date: string; fee_amount: number; notes: string }) => void;
}) {
  const { dir } = useLocale();
  const [authority, setAuthority] = useState<RegulatoryAuthority>('Ejari');
  const [regType, setRegType] = useState('عقد إيجار');
  const [ref, setRef] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [fee, setFee] = useState('');
  const [notes, setNotes] = useState('');

  const types = REGISTRATION_TYPES[authority] || [];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md" dir={dir}>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-[#533afd]" /> تسجيل تنظيمي جديد</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>الجهة الحكومية</Label>
            <Select value={authority} onValueChange={(v) => { setAuthority(v as RegulatoryAuthority); setRegType(REGISTRATION_TYPES[v as RegulatoryAuthority]?.[0] || ''); }}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(AUTHORITY_REGISTRY) as RegulatoryAuthority[]).map(a => (
                  <SelectItem key={a} value={a}>{AUTHORITY_REGISTRY[a].name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>نوع التسجيل</Label>
            <Select value={regType} onValueChange={setRegType}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>الرقم المرجعي</Label><Input value={ref} onChange={e => setRef(e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>تاريخ الإصدار</Label><Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="mt-1.5" /></div>
            <div><Label>{tt('documents.expiryDate', 'تاريخ الانتهاء')}</Label><Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label>الرسوم ({AUTHORITY_REGISTRY[authority].fee_currency})</Label><Input type="number" value={fee} onChange={e => setFee(e.target.value)} className="mt-1.5" /></div>
          <div><Label>{tt('common.notes', 'ملاحظات')}</Label><Input value={notes} onChange={e => setNotes(e.target.value)} className="mt-1.5" /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{tt('common.cancel', 'إلغاء')}</Button>
          <Button onClick={() => onCreate({
            authority, registration_type: regType, reference: ref,
            issue_date: issueDate, expiry_date: expiryDate, fee_amount: parseFloat(fee) || 0, notes,
          })} className="bg-[#533afd] hover:bg-[#533afd]" disabled={!ref}>{tt('common.save', 'حفظ')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colors: Record<string, string> = { blue: 'bg-[rgba(83,58,253,0.06)] text-[#533afd]', amber: 'bg-amber-50 text-[#9b6829]', red: 'bg-red-50 text-[#ea2261]', emerald: 'bg-emerald-50 text-emerald-600' };
  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${colors[color] || colors.blue} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
          </div>
          <div><p className="text-xs text-[#64748d]">{label}</p><p className="text-2xl font-bold text-[#061b31]">{value}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}
