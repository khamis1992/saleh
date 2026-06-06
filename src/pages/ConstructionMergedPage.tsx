import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardHat, Briefcase, FileSignature, Plus, Eye, Pencil, MoreHorizontal, Search, Download, TrendingUp, Building2, Clock, AlertTriangle, FileText } from 'lucide-react';
import { formatQARInt } from '@/lib/format';
import { projectStore, contractorStore, contractorClaimStore } from '@/services/stores';
import ModernProjectsTab from '@/components/projects/ModernProjectsTab';

const fmt = formatQARInt;

export default function ConstructionMergedPage() {
  const { t, tt, dir } = useLocale();
  const navigate = useNavigate();
  const [r] = useState(0);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatus, setProjectStatus] = useState('all');
  const [contractorSearch, setContractorSearch] = useState('');
  const [contractorStatus, setContractorStatus] = useState('all');
  const [claimSearch, setClaimSearch] = useState('');
  const [claimStatus, setClaimStatus] = useState('all');

  const projects = useMemo(() => projectStore.getAll(), [r]);
  const contractors = useMemo(() => contractorStore.getAll(), [r]);
  const claims = useMemo(() => contractorClaimStore.getAll(), [r]);

  // Computed KPIs
  const activeProjects = projects.filter(p => p.status === 'construction' || p.status === 'testing');
  const delayedProjects = projects.filter(p => {
    if (p.status !== 'construction' && p.status !== 'testing') return false;
    const end = (p as any).planned_end_date || (p as any).end_date;
    if (!end) return false;
    return end < new Date().toISOString().split('T')[0];
  });
  const pendingClaims = claims.filter(c => c.status === 'submitted' || c.status === 'verified');
  const totalBudget = projects.reduce((s, p) => s + (p.approved_budget || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.actual_cost || 0), 0);

  // Status badges
  const projectStBg: Record<string, string> = {
    construction: 'bg-blue-50 text-blue-700',
    testing: 'bg-[rgba(83,58,253,0.08)] text-[#533afd]',
    completed: 'bg-emerald-50 text-emerald-700',
    design: 'bg-amber-50 text-[#9b6829]',
    approvals: 'bg-violet-50 text-violet-700',
    tendering: 'bg-cyan-50 text-cyan-700',
    handover: 'bg-orange-50 text-orange-700',
    cancelled: 'bg-red-50 text-[#ea2261]',
    feasibility: 'bg-gray-50 text-[#64748d]',
    idea: 'bg-gray-50 text-[#64748d]',
  };

  const projectStLabel = (s: string) => {
    const map: Record<string, string> = {
      construction: 'قيد الإنشاء', testing: 'اختبار', completed: 'مكتمل',
      design: 'تصميم', approvals: 'اعتمادات', tendering: 'طرح مناقصة',
      handover: 'تسليم', cancelled: 'ملغي', feasibility: 'دراسة جدوى', idea: 'فكرة',
    };
    return map[s] || s;
  };

  const contractorStBg: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    inactive: 'bg-[#f6f9fc] text-[#64748d]',
    suspended: 'bg-red-50 text-[#ea2261]',
  };

  const claimStBg: Record<string, string> = {
    submitted: 'bg-blue-50 text-blue-700',
    verified: 'bg-[rgba(83,58,253,0.08)] text-[#533afd]',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-[#ea2261]',
    paid: 'bg-emerald-50 text-[#108c3d]',
    draft: 'bg-[#f6f9fc] text-[#64748d]',
  };

  const claimStLabel = (s: string) => {
    const map: Record<string, string> = {
      submitted: 'مقدم', verified: 'مدقق', approved: 'معتمد',
      rejected: 'مرفوض', paid: 'مدفوع', draft: 'مسودة',
    };
    return map[s] || s;
  };

  // Filters
  const filteredProjects = projects.filter(p => {
    if (projectSearch) {
      const q = projectSearch.toLowerCase();
      if (!(p.project_name || '').toLowerCase().includes(q) && !(p.project_code || '').toLowerCase().includes(q)) return false;
    }
    if (projectStatus !== 'all' && p.status !== projectStatus) return false;
    return true;
  });

  const filteredContractors = contractors.filter(c => {
    if (contractorSearch) {
      const q = contractorSearch.toLowerCase();
      if (!(c.name || '').toLowerCase().includes(q) && !(c.specialty || '').toLowerCase().includes(q)) return false;
    }
    if (contractorStatus !== 'all' && c.status !== contractorStatus) return false;
    return true;
  });

  const filteredClaims = claims.filter(c => {
    if (claimSearch) {
      const q = claimSearch.toLowerCase();
      if (!(c.claim_number || c.id || '').toLowerCase().includes(q)) return false;
    }
    if (claimStatus !== 'all' && c.status !== claimStatus) return false;
    return true;
  });

  const projectStatuses = useMemo(() => [...new Set(projects.map(p => p.status).filter(Boolean))], [projects]);
  const claimStatuses = useMemo(() => [...new Set(claims.map(c => c.status).filter(Boolean))], [claims]);

  return (
    <div className="bg-[#f8fafc] min-h-full" dir={dir}>
      {/* ===== TABS CONTAINER ===== */}
      <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="projects" className="w-full" dir={dir}>
            <div className="px-5 pt-4 pb-0 border-b border-gray-100">
              <TabsList className="h-10 bg-transparent gap-1 p-0">
                <TabsTrigger value="projects" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <HardHat className="h-4 w-4" />
                  مشاريع
                </TabsTrigger>
                <TabsTrigger value="contractors" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <Briefcase className="h-4 w-4" />
                  مقاولون
                </TabsTrigger>
                <TabsTrigger value="claims" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <FileSignature className="h-4 w-4" />
                  مطالبات
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ===== PROJECTS TAB ===== */}
            <TabsContent value="projects" className="m-0">
              <ModernProjectsTab />
            </TabsContent>

            {/* ===== CONTRACTORS TAB ===== */}
            <TabsContent value="contractors" className="m-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm m-4 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">المقاولون</h3>
                    <p className="text-[11px] text-[#64748d] mt-0.5">سجل المقاولين والموردين المعتمدين</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/contractors/create')} className="gap-1.5 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg px-3">
                      <Plus className="h-3.5 w-3.5" />مقاول جديد
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="بحث عن مقاول..."
                      value={contractorSearch}
                      onChange={e => setContractorSearch(e.target.value)}
                      className="pr-9 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <Select value={contractorStatus} onValueChange={setContractorStatus}>
                    <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[160px]">
                      <SelectValue placeholder="الحالة: الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الحالة: الكل</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                      <SelectItem value="suspended">موقوف</SelectItem>
                    </SelectContent>
                  </Select>
                  {(contractorSearch || contractorStatus !== 'all') && (
                    <span className="text-[10px] text-[#64748d]">{filteredContractors.length} نتيجة</span>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المقاول</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">التخصص</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">رقم الجوال</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الحالة</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContractors.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-xs text-[#64748d]">
                            لا يوجد مقاولون
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredContractors.map(c => {
                        const stBg = contractorStBg[c.status] || 'bg-gray-50 text-gray-600';
                        return (
                          <TableRow key={c.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer" onClick={() => navigate(`/contractors/${c.id}`)}>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <span className="text-xs font-semibold text-[#1E293B]">{c.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-[#64748d]">{c.specialty || '—'}</TableCell>
                            <TableCell className="text-xs tabular-nums">{c.phone || '—'}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${stBg}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : c.status === 'suspended' ? 'bg-red-500' : 'bg-gray-400'}`} />
                                {c.status === 'active' ? 'نشط' : c.status === 'inactive' ? 'غير نشط' : c.status === 'suspended' ? 'موقوف' : c.status}
                              </span>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50" onClick={() => navigate(`/contractors/${c.id}`)}>
                                  <Eye className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-amber-50">
                                  <Pencil className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100">
                                  <MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ===== CLAIMS TAB ===== */}
            <TabsContent value="claims" className="m-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm m-4 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">مطالبات المقاولين</h3>
                    <p className="text-[11px] text-[#64748d] mt-0.5">متابعة واعتماد مطالبات المقاولين المالية</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="بحث عن مطالبة..."
                      value={claimSearch}
                      onChange={e => setClaimSearch(e.target.value)}
                      className="pr-9 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <Select value={claimStatus} onValueChange={setClaimStatus}>
                    <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[160px]">
                      <SelectValue placeholder="الحالة: الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الحالة: الكل</SelectItem>
                      {claimStatuses.map(cs => (
                        <SelectItem key={cs} value={cs}>{claimStLabel(cs)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(claimSearch || claimStatus !== 'all') && (
                    <span className="text-[10px] text-[#64748d]">{filteredClaims.length} نتيجة</span>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">رقم المطالبة</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المشروع / المقاول</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المبلغ</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">التاريخ</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الحالة</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClaims.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-xs text-[#64748d]">
                            لا توجد مطالبات
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredClaims.map(c => {
                        const stBg = claimStBg[c.status] || 'bg-gray-50 text-gray-600';
                        const project = projects.find(p => p.id === c.project_id);
                        const contractor = contractors.find(ct => ct.id === c.contractor_id);
                        return (
                          <TableRow key={c.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                  <FileSignature className="h-3.5 w-3.5 text-[#9b6829]" />
                                </div>
                                <span className="text-xs font-semibold text-[#1E293B]">{c.claim_number || c.id?.slice(0, 8)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-xs font-medium text-[#1E293B]">{project?.project_name || '—'}</div>
                                <div className="text-[10px] text-[#94a3b8]">{contractor?.name || '—'}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-[#1E293B] tabular-nums">{fmt((c as any).amount || (c as any).claimed_amount || 0)}</TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(c as any).submitted_at?.slice(0, 10) || (c as any).created_at?.slice(0, 10) || '—'}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${stBg}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'approved' || c.status === 'paid' ? 'bg-emerald-500' : c.status === 'rejected' ? 'bg-red-500' : c.status === 'verified' ? 'bg-[#533afd]' : 'bg-blue-500'}`} />
                                {claimStLabel(c.status)}
                              </span>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50">
                                  <Eye className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100">
                                  <MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
