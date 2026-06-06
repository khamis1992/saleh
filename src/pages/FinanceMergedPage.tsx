import { useMemo, useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Landmark, CreditCard, FileText, TrendingUp, Building2, Calculator, Clock, FileCheck, Plus, Eye, Pencil, MoreHorizontal, Search, Download, Receipt, Banknote } from 'lucide-react';
import { formatQARInt } from '@/lib/format';
import { journalEntryStore, bankAccountStore, chequeStore, invoiceStore, receiptStore, propertyStore } from '@/services/stores';

const fmt = formatQARInt;

export default function FinanceMergedPage() {
  const { t, tt, dir } = useLocale();
  const navigate = useNavigate();
  const [refresh] = useState(0);
  const [jeSearch, setJeSearch] = useState('');
  const [jeStatus, setJeStatus] = useState('all');
  const [bankSearch, setBankSearch] = useState('');
  const [chequeSearch, setChequeSearch] = useState('');
  const [chequeStatus, setChequeStatus] = useState('all');

  const journalEntries = useMemo(() => journalEntryStore.getAll(), [refresh]);
  const bankAccounts = useMemo(() => bankAccountStore.getAll(), [refresh]);
  const cheques = useMemo(() => chequeStore.getAll(), [refresh]);
  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const receipts = useMemo(() => receiptStore.getAll(), [refresh]);
  const properties = useMemo(() => propertyStore.getAll(), [refresh]);

  // KPIs
  const postedJEs = journalEntries.filter(j => j.status === 'posted').length;
  const draftJEs = journalEntries.filter(j => j.status === 'draft').length;
  const totalReceivables = invoices.filter(i => i.balance > 0).reduce((s, i) => s + i.balance, 0);
  const totalCollected = receipts.reduce((s, r) => s + r.amount, 0);
  const pendingCheques = cheques.filter(c => c.status === 'issued' || c.status === 'pending').length;
  const totalBankBalance = bankAccounts.reduce((s, b) => s + ((b as any).current_balance || 0), 0);
  const totalPropertyValue = properties.reduce((s, p) => s + (p.total_asset_value || 0), 0);
  const totalPayables = 0; // placeholder — derive from POs/claims if needed

  // Status maps
  const jeStBg: Record<string, string> = {
    draft: 'bg-[#f6f9fc] text-[#64748d]',
    posted: 'bg-emerald-50 text-[#108c3d]',
    reversed: 'bg-red-50 text-[#ea2261]',
  };
  const jeStLabel = (s: string) => ({ draft: 'مسودة', posted: 'مرحّل', reversed: 'معكوس' } as Record<string, string>)[s] || s;

  const chqStBg: Record<string, string> = {
    issued: 'bg-[rgba(83,58,253,0.06)] text-[#533afd]',
    pending: 'bg-amber-50 text-[#9b6829]',
    cleared: 'bg-emerald-50 text-[#108c3d]',
    bounced: 'bg-red-50 text-[#ea2261]',
    cancelled: 'bg-[#f6f9fc] text-[#64748d]',
  };
  const chqStLabel = (s: string) => ({ issued: 'مُصدر', pending: 'معلق', cleared: 'مقيد', bounced: 'مرتجع', cancelled: 'ملغي' } as Record<string, string>)[s] || s;

  const acctStBg: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    inactive: 'bg-[#f6f9fc] text-[#64748d]',
  };

  // Filters
  const filteredJEs = journalEntries.filter(j => {
    if (jeSearch) {
      const q = jeSearch.toLowerCase();
      if (!(j.entry_number || j.id || '').toLowerCase().includes(q) && !(j.description || '').toLowerCase().includes(q)) return false;
    }
    if (jeStatus !== 'all' && j.status !== jeStatus) return false;
    return true;
  });

  const filteredBanks = bankAccounts.filter(b => {
    if (!bankSearch) return true;
    const q = bankSearch.toLowerCase();
    return (b.account_name || b.bank_name || '').toLowerCase().includes(q);
  });

  const filteredCheques = cheques.filter(c => {
    if (chequeSearch) {
      const q = chequeSearch.toLowerCase();
      if (!(c.cheque_number || c.id || '').toLowerCase().includes(q)) return false;
    }
    if (chequeStatus !== 'all' && c.status !== chequeStatus) return false;
    return true;
  });

  return (
    <div className="bg-[#f8fafc] min-h-full" dir={dir}>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Card 1 — قيود مرحلة */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <FileCheck className="h-5 w-5 text-[#108c3d]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#108c3d]">{postedJEs}</div>
            <div className="text-[11px] text-[#64748d]">قيود مرحلة</div>
            <div className="text-[10px] text-amber-600 mt-0.5">{draftJEs} مسودة</div>
          </div>
        </div>

        {/* Card 2 — رصيد البنوك */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-[rgba(83,58,253,0.08)] flex items-center justify-center shrink-0">
            <Landmark className="h-5 w-5 text-[#533afd]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#1E293B]">{fmt(totalBankBalance)}</div>
            <div className="text-[11px] text-[#64748d]">رصيد البنوك</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">{bankAccounts.length} حساب</div>
          </div>
        </div>

        {/* Card 3 — ذمم مدينة */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-[#9b6829]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#9b6829]">{fmt(totalReceivables)}</div>
            <div className="text-[11px] text-[#64748d]">ذمم مدينة</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{fmt(totalCollected)} محصل</div>
          </div>
        </div>

        {/* Card 4 — قيمة الأصول */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#1E293B]">{fmt(totalPropertyValue)}</div>
            <div className="text-[11px] text-[#64748d]">قيمة الأصول</div>
            <div className="text-[10px] text-[#94a3b8] mt-0.5">{properties.length} عقار</div>
          </div>
        </div>
      </div>

      {/* ===== TABS CONTAINER ===== */}
      <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="journal" className="w-full" dir={dir}>
            <div className="px-5 pt-4 pb-0 border-b border-gray-100">
              <TabsList className="h-10 bg-transparent gap-1 p-0">
                <TabsTrigger value="journal" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <FileText className="h-4 w-4" />قيود يومية
                </TabsTrigger>
                <TabsTrigger value="banks" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <Landmark className="h-4 w-4" />حسابات بنكية
                </TabsTrigger>
                <TabsTrigger value="cheques" className="h-10 text-[13px] data-[state=active]:bg-[rgba(83,58,253,0.06)] data-[state=active]:text-[#533afd] data-[state=active]:shadow-none rounded-lg px-4 gap-2">
                  <CreditCard className="h-4 w-4" />شيكات
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ===== JOURNAL ENTRIES TAB ===== */}
            <TabsContent value="journal" className="m-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm m-4 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">القيود اليومية</h3>
                    <p className="text-[11px] text-[#64748d] mt-0.5">سجل القيود المحاسبية المُسجلة</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/wizards/payment')} className="gap-1.5 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg px-3">
                      <Plus className="h-3.5 w-3.5" />قيد جديد
                    </Button>
                    <Button variant="outline" className="gap-1.5 h-8 text-xs rounded-lg px-3">
                      <Download className="h-3.5 w-3.5" />تصدير
                    </Button>
                  </div>
                </div>

                <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input placeholder="بحث عن قيد..." value={jeSearch} onChange={e => setJeSearch(e.target.value)} className="pr-9 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white" />
                  </div>
                  <Select value={jeStatus} onValueChange={setJeStatus}>
                    <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[150px]">
                      <SelectValue placeholder="الحالة: الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الحالة: الكل</SelectItem>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="posted">مرحل</SelectItem>
                      <SelectItem value="reversed">معكوس</SelectItem>
                    </SelectContent>
                  </Select>
                  {(jeSearch || jeStatus !== 'all') && <span className="text-[10px] text-[#64748d]">{filteredJEs.length} نتيجة</span>}
                </div>

                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">رقم القيد</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">البيان</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">التاريخ</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المبلغ</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الحالة</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJEs.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-xs text-[#64748d]">لا توجد قيود</TableCell></TableRow>
                      )}
                      {filteredJEs.map(j => {
                        const stBg = jeStBg[j.status] || 'bg-gray-50 text-gray-600';
                        const amount = (j as any).total || (j as any).amount || 0;
                        return (
                          <TableRow key={j.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-[rgba(83,58,253,0.08)] flex items-center justify-center shrink-0">
                                  <FileText className="h-3.5 w-3.5 text-[#533afd]" />
                                </div>
                                <span className="text-xs font-semibold text-[#1E293B]">{j.entry_number || j.id?.slice(0, 8)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-[#64748d] max-w-[200px] truncate">{j.description || '—'}</TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(j as any).date?.slice(0, 10) || (j as any).created_at?.slice(0, 10) || '—'}</TableCell>
                            <TableCell className="text-xs font-semibold text-[#1E293B] tabular-nums">{fmt(amount)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${stBg}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${j.status === 'posted' ? 'bg-emerald-500' : j.status === 'reversed' ? 'bg-red-500' : 'bg-gray-400'}`} />
                                {jeStLabel(j.status)}
                              </span>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50"><Eye className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100"><MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" /></Button>
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

            {/* ===== BANK ACCOUNTS TAB ===== */}
            <TabsContent value="banks" className="m-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm m-4 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">الحسابات البنكية</h3>
                    <p className="text-[11px] text-[#64748d] mt-0.5">إدارة الحسابات والأرصدة البنكية</p>
                  </div>
                  <Button className="gap-1.5 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg px-3">
                    <Plus className="h-3.5 w-3.5" />حساب جديد
                  </Button>
                </div>

                <div className="px-5 py-3 border-b border-gray-50">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input placeholder="بحث عن حساب..." value={bankSearch} onChange={e => setBankSearch(e.target.value)} className="pr-9 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white" />
                  </div>
                </div>

                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">اسم الحساب</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">البنك</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">رقم الحساب</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الرصيد الحالي</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الحالة</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBanks.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-xs text-[#64748d]">لا توجد حسابات بنكية</TableCell></TableRow>
                      )}
                      {filteredBanks.map(b => {
                        const balance = (b as any).current_balance || (b as any).balance || 0;
                        const stBg = acctStBg[(b as any).status] || 'bg-gray-50 text-gray-600';
                        const stLabel = (b as any).status === 'active' ? 'نشط' : (b as any).status === 'inactive' ? 'غير نشط' : (b as any).status || '—';
                        return (
                          <TableRow key={b.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <Landmark className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <span className="text-xs font-semibold text-[#1E293B]">{b.account_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-[#64748d]">{b.bank_name || '—'}</TableCell>
                            <TableCell className="text-xs tabular-nums font-mono text-[#64748d]">{b.account_number || '—'}</TableCell>
                            <TableCell className="text-xs font-semibold tabular-nums">
                              <span className={balance >= 0 ? 'text-[#108c3d]' : 'text-[#ea2261]'}>{fmt(balance)}</span>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${stBg}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${(b as any).status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                {stLabel}
                              </span>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50"><Eye className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-amber-50"><Pencil className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100"><MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" /></Button>
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

            {/* ===== CHEQUES TAB ===== */}
            <TabsContent value="cheques" className="m-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm m-4 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">الشيكات</h3>
                    <p className="text-[11px] text-[#64748d] mt-0.5">متابعة الشيكات المصدرة والمستلمة</p>
                  </div>
                  <div className="flex gap-2">
                    <Button className="gap-1.5 bg-[#533afd] hover:bg-[#533afd] text-white h-8 text-xs rounded-lg px-3">
                      <Plus className="h-3.5 w-3.5" />شيك جديد
                    </Button>
                  </div>
                </div>

                <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input placeholder="بحث عن شيك..." value={chequeSearch} onChange={e => setChequeSearch(e.target.value)} className="pr-9 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus:bg-white" />
                  </div>
                  <Select value={chequeStatus} onValueChange={setChequeStatus}>
                    <SelectTrigger className="h-8 text-xs rounded-lg border-gray-200 w-[150px]">
                      <SelectValue placeholder="الحالة: الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الحالة: الكل</SelectItem>
                      <SelectItem value="issued">مصدر</SelectItem>
                      <SelectItem value="pending">معلق</SelectItem>
                      <SelectItem value="cleared">مقيد</SelectItem>
                      <SelectItem value="bounced">مرتجع</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                  {(chequeSearch || chequeStatus !== 'all') && <span className="text-[10px] text-[#64748d]">{filteredCheques.length} نتيجة</span>}
                </div>

                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">رقم الشيك</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المستفيد</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">البنك</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">المبلغ</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB]">الحالة</TableHead>
                        <TableHead className="text-[11px] font-semibold text-[#64748B] h-10 bg-[#F9FAFB] w-[90px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCheques.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-xs text-[#64748d]">لا توجد شيكات</TableCell></TableRow>
                      )}
                      {filteredCheques.map(c => {
                        const stBg = chqStBg[c.status] || 'bg-gray-50 text-gray-600';
                        return (
                          <TableRow key={c.id} className="hover:bg-[rgba(83,58,253,0.03)] cursor-pointer">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                                  <CreditCard className="h-3.5 w-3.5 text-violet-600" />
                                </div>
                                <span className="text-xs font-semibold text-[#1E293B]">{c.cheque_number || c.id?.slice(0, 8)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(c as any).payee_name || (c as any).recipient || '—'}</TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(c as any).bank_name || '—'}</TableCell>
                            <TableCell className="text-xs font-semibold text-[#1E293B] tabular-nums">{fmt((c as any).amount || 0)}</TableCell>
                            <TableCell className="text-xs text-[#64748d]">{(c as any).due_date?.slice(0, 10) || (c as any).date?.slice(0, 10) || '—'}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${stBg}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'cleared' ? 'bg-emerald-500' : c.status === 'bounced' ? 'bg-red-500' : c.status === 'issued' ? 'bg-[#533afd]' : 'bg-amber-500'}`} />
                                {chqStLabel(c.status)}
                              </span>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50"><Eye className="h-3.5 w-3.5 text-[#64748d]" /></Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100"><MoreHorizontal className="h-3.5 w-3.5 text-[#64748d]" /></Button>
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
