import { formatQAR } from '@/lib/format';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WorkflowTimeline } from '@/components/shared/WorkflowTimeline';
import { NextBestAction } from '@/components/shared/NextBestAction';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Pencil, Star, Phone, Mail, MapPin, FileText, User, Banknote, Plus } from 'lucide-react';
import { contractorStore, contractorClaimStore, projectStore, getProjectName } from '@/services/stores';
import { seedContractorContracts } from '@/pages/construction/ContractorContractsPage';
import { createStore } from '@/services/dataService';
import type { ContractorContract } from '@/types';

const contractorContractStore = createStore<ContractorContract>({ key: 'erp_contractor_contracts', seed: seedContractorContracts });

const fmt = (v: number) => formatQAR(v);

const contractStatusLabels: Record<string, string> = {
  draft: 'مسودة', pending_approval: 'بانتظار الموافقة', active: 'نشط',
  suspended: 'معلق', completed: 'مكتمل', terminated: 'منتهي', closed: 'مغلق',
};

const claimStatusLabels: Record<string, string> = {
  draft: 'مسودة', submitted: 'مقدم', verified: 'مدقق', approved: 'معتمد',
  rejected: 'مرفوض', partially_paid: 'مدفوع جزئياً', paid: 'مدفوع', cancelled: 'ملغي',
};

export default function ContractorDetailPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const contractor = useMemo(() => contractorStore.getById(id || ''), [id]);

  const contracts = useMemo(() => { if (!id) return []; return contractorContractStore.getAll().filter(c => c.contractor_id === id); }, [id]);
  const claims = useMemo(() => { if (!id) return []; return contractorClaimStore.getAll().filter(c => c.contractor_id === id); }, [id]);

  const paymentSummary = useMemo(() => {
    const totalClaimed = claims.reduce((s, c) => s + c.claimed_amount, 0);
    const totalPaid = claims.filter(c => c.payment_status === 'paid').reduce((s, c) => s + c.claimed_amount, 0);
    const totalUnpaid = claims.filter(c => c.payment_status !== 'paid').reduce((s, c) => s + c.claimed_amount, 0);
    const totalNetPayable = claims.reduce((s, c) => s + c.net_payable, 0);
    return { totalClaimed, totalPaid, totalUnpaid, totalNetPayable };
  }, [claims]);

  if (!contractor) return <div className="text-center py-12 text-gray-500">المقاول غير موجود</div>;

  return (
    <div className="bg-gray-50 min-h-full" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contractors')} className="text-xs text-gray-500">
            <ArrowRight className="h-4 w-4 ml-1" />{t.common.back}
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{contractor.contractor_code} - {contractor.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">تفاصيل المقاول وسجل التعاملات</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/contractors/${contractor.id}/edit`)} className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4">
          <Pencil className="h-4 w-4" />{t.common.edit}
        </Button>
      </div>

      {/* Workflow timeline + Quick actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">دورة علاقة العمل</p>
        <WorkflowTimeline
          steps={(() => {
            const claims = contractorClaimStore.getAll().filter((c: any) => c.contractor_id === contractor.id);
            const hasContract = claims.length > 0;
            const hasActiveClaim = claims.some((c: any) => c.status !== 'paid' && c.status !== 'rejected');
            const hasPaid = claims.some((c: any) => c.status === 'paid');
            return [
              { key: 'active', label: 'تعاقد', status: hasContract ? 'completed' as const : 'pending' as const },
              { key: 'claim', label: 'تقديم مطالبة', status: hasActiveClaim ? 'current' as const : hasContract ? 'completed' as const : 'pending' as const },
              { key: 'paid', label: 'صرف المستحقات', status: hasPaid ? 'completed' as const : 'pending' as const },
            ];
          })()}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-2">إجراءات سريعة:</span>
        <Button variant="outline" size="sm" onClick={() => navigate('/wizards/claim')} className="h-8 text-xs gap-1">
          <Plus className="h-3.5 w-3.5" /> مطالبة جديدة
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/construction/claims')} className="h-8 text-xs gap-1">
          <Banknote className="h-3.5 w-3.5" /> المطالبات
        </Button>
      </div>

      <Tabs dir="rtl" defaultValue="profile">
        <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6 w-fit">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="contracts" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">العقود</TabsTrigger>
            <TabsTrigger value="claims" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">المطالبات</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">المدفوعات</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">الأداء</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">المستندات</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center space-y-3">
              <div className="h-20 w-20 rounded-full bg-blue-50 mx-auto flex items-center justify-center text-2xl font-bold text-blue-600">{contractor.name.charAt(0)}</div>
              <div><h3 className="font-bold text-lg">{contractor.name}</h3><p className="text-sm text-gray-500">{(t.contractors.specialties as any)[contractor.specialty]}</p></div>
              <div className="flex items-center justify-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span>{contractor.rating}/5</span></div>
              <StatusBadge status={contractor.status} label={contractor.status === 'active' ? 'نشط' : contractor.status === 'inactive' ? 'غير نشط' : 'قائمة سوداء'} />
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2 justify-center"><Phone className="h-4 w-4" />{contractor.phone}</div>
                <div className="flex items-center gap-2 justify-center"><Mail className="h-4 w-4" />{contractor.email}</div>
                <div className="flex items-center gap-2 justify-center"><MapPin className="h-4 w-4" />{contractor.address}</div>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><User className="h-5 w-5 text-blue-600" /></div>
                <div><h2 className="text-base font-semibold text-gray-800">معلومات الشركة</h2></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">التصنيف: </span>{contractor.classification}</div>
                <div><span className="text-gray-400">السجل التجاري: </span>{contractor.cr_number}</div>
                <div><span className="text-gray-400">الرقم الضريبي: </span>{contractor.tax_number}</div>
                <div><span className="text-gray-400">الشخص المسؤول: </span>{contractor.contact_person}</div>
                <div><span className="text-gray-400">البنك: </span>{contractor.bank_name}</div>
                <div><span className="text-gray-400">IBAN: </span>{contractor.iban}</div>
                <div><span className="text-gray-400">رقم الحساب: </span>{contractor.account_number}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">عدد العقود</div><div className="text-lg font-bold text-gray-800 mt-1">{contracts.length}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">العقود النشطة</div><div className="text-lg font-bold text-gray-800 mt-1">{contracts.filter(c => c.status === 'active').length}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">إجمالي المطالبات</div><div className="text-lg font-bold text-gray-800 mt-1">{fmt(paymentSummary.totalClaimed)}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">المدفوع</div><div className="text-lg font-bold text-emerald-600 mt-1">{fmt(paymentSummary.totalPaid)}</div></div>
          </div>
        </TabsContent>

        <TabsContent value="contracts">
          {contracts.length === 0 ? (
            <p className="text-gray-400 text-center py-12">لا توجد عقود لهذا المقاول</p>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">رقم العقد</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">عنوان العقد</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">المشروع</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">قيمة العقد</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">تاريخ البداية</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">تاريخ النهاية</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(c => (
                    <TableRow key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => navigate(`/construction/contractor-contracts`)}>
                      <TableCell className="font-medium text-sm">{c.contract_number}</TableCell>
                      <TableCell className="text-sm">{c.contract_title}</TableCell>
                      <TableCell className="text-sm">{getProjectName(c.project_id)}</TableCell>
                      <TableCell className="text-sm">{fmt(c.contract_amount)}</TableCell>
                      <TableCell className="text-sm">{c.start_date}</TableCell>
                      <TableCell className="text-sm">{c.end_date}</TableCell>
                      <TableCell><StatusBadge status={c.status} label={contractStatusLabels[c.status] || c.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims">
          {claims.length === 0 ? (
            <p className="text-gray-400 text-center py-12">لا توجد مطالبات لهذا المقاول</p>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">رقم المطالبة</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">التاريخ</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">المشروع</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">المبلغ المطالب</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">صافي المستحق</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">نسبة الإنجاز</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map(c => (
                    <TableRow key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell className="font-medium text-sm">{c.claim_number}</TableCell>
                      <TableCell className="text-sm">{c.claim_date}</TableCell>
                      <TableCell className="text-sm">{getProjectName(c.project_id)}</TableCell>
                      <TableCell className="text-sm">{fmt(c.claimed_amount)}</TableCell>
                      <TableCell className="font-bold text-sm">{fmt(c.net_payable)}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><div className="w-16 bg-gray-200 rounded-full h-1.5"><div className="bg-[#3B82F6] h-1.5 rounded-full" style={{width: `${c.work_completed_percentage}%`}} /></div><span className="text-xs text-gray-500">{c.work_completed_percentage}%</span></div></TableCell>
                      <TableCell><StatusBadge status={c.status} label={claimStatusLabels[c.status] || c.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">إجمالي المبالغ المطالب بها</div><div className="text-lg font-bold text-gray-800 mt-1">{fmt(paymentSummary.totalClaimed)}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">إجمالي المدفوع</div><div className="text-lg font-bold text-emerald-600 mt-1">{fmt(paymentSummary.totalPaid)}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">المبالغ غير المدفوعة</div><div className="text-lg font-bold text-red-600 mt-1">{fmt(paymentSummary.totalUnpaid)}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">صافي المستحق</div><div className="text-lg font-bold text-gray-800 mt-1">{fmt(paymentSummary.totalNetPayable)}</div></div>
          </div>
          {claims.length === 0 ? (
            <p className="text-gray-400 text-center py-12">لا توجد مدفوعات</p>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">رقم المطالبة</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">صافي المستحق</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">حالة الدفع</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">حالة الاعتماد الهندسي</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">حالة اعتماد المالية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map(c => (
                    <TableRow key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell className="font-medium text-sm">{c.claim_number}</TableCell>
                      <TableCell className="font-bold text-sm">{fmt(c.net_payable)}</TableCell>
                      <TableCell><Badge variant={c.payment_status === 'paid' ? 'default' : c.payment_status === 'partially_paid' ? 'secondary' : 'outline'} className="text-[10px]">{c.payment_status === 'paid' ? 'مدفوع' : c.payment_status === 'partially_paid' ? 'مدفوع جزئياً' : 'غير مدفوع'}</Badge></TableCell>
                      <TableCell><Badge variant={c.engineer_verification_status === 'verified' ? 'default' : c.engineer_verification_status === 'rejected' ? 'destructive' : 'outline'} className="text-[10px]">{c.engineer_verification_status === 'verified' ? 'مدقق' : c.engineer_verification_status === 'rejected' ? 'مرفوض' : 'قيد التدقيق'}</Badge></TableCell>
                      <TableCell><Badge variant={c.finance_approval_status === 'approved' ? 'default' : c.finance_approval_status === 'rejected' ? 'destructive' : 'outline'} className="text-[10px]">{c.finance_approval_status === 'approved' ? 'معتمد' : c.finance_approval_status === 'rejected' ? 'مرفوض' : 'قيد الاعتماد'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center"><Star className="h-5 w-5 text-violet-600" /></div>
                <div><h2 className="text-base font-semibold text-gray-800">ملخص الأداء</h2></div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">التقييم</span><span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{contractor.rating}/5</span></div>
                <div className="flex justify-between"><span className="text-gray-400">عدد العقود</span><span>{contracts.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">العقود المكتملة</span><span>{contracts.filter(c => c.status === 'completed' || c.status === 'closed').length}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">العقود النشطة</span><span>{contracts.filter(c => c.status === 'active').length}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">إجمالي قيمة العقود</span><span className="font-bold">{fmt(contracts.reduce((s, c) => s + c.contract_amount, 0))}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><FileText className="h-5 w-5 text-blue-600" /></div>
                <div><h2 className="text-base font-semibold text-gray-800">المشاريع المرتبطة</h2></div>
              </div>
              <div>
                {[...new Set(contracts.map(c => c.project_id))].length === 0 ? (
                  <p className="text-gray-400">لا توجد مشاريع مرتبطة</p>
                ) : (
                  <ul className="space-y-2">
                    {[...new Set(contracts.map(c => c.project_id))].map(pid => {
                      const p = projectStore.getById(pid);
                      return p ? (
                        <li key={pid} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-[10px]">{p.project_code}</Badge>
                          <span>{p.project_name}</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400">قسم المستندات قيد التطوير</p>
            <p className="text-sm text-gray-400 mt-1">سيتم إضافة رفع وعرض المستندات قريباً</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}