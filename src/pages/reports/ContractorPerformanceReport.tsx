import { useState, useMemo } from 'react';
import { formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { contractorStore } from '@/services/stores';
import { createStore } from '@/services/dataService';
import type { ContractorContract, ContractorClaim } from '@/types';
import { seedContractorContracts } from '@/pages/construction/ContractorContractsPage';
import { seedContractorClaims } from '@/pages/construction/ContractorClaimsPage';

const contractStore = createStore<ContractorContract>({ key: 'erp_contractor_contracts', seed: seedContractorContracts });
const claimStore = createStore<ContractorClaim>({ key: 'erp_contractor_claims', seed: seedContractorClaims });

export default function ContractorPerformanceReport() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [refresh] = useState(0);

  const contractors = useMemo(() => contractorStore.getAll(), [refresh]);
  const contracts = useMemo(() => contractStore.getAll(), [refresh]);
  const claims = useMemo(() => claimStore.getAll(), [refresh]);

  const reportData = useMemo(() => {
    return contractors
      .map((c) => {
        const contractorContracts = contracts.filter((ct) => ct.contractor_id === c.id);
        const contractorClaims = claims.filter((cl) => cl.contractor_id === c.id);
        const activeContracts = contractorContracts.filter((ct) => ct.status === 'active').length;
        const totalContractValue = contractorContracts.reduce((s, ct) => s + ct.contract_amount, 0);
        const claimsSubmitted = contractorClaims.length;
        const claimsApproved = contractorClaims.filter((cl) => cl.status === 'approved' || cl.status === 'partially_paid' || cl.status === 'paid').length;
        const claimsPaid = contractorClaims.filter((cl) => cl.payment_status === 'paid').length;

        return {
          id: c.id,
          contractor_name: c.name,
          contractor_code: c.contractor_code,
          active_contracts: activeContracts,
          total_contracts: contractorContracts.length,
          total_contract_value: totalContractValue,
          claims_submitted: claimsSubmitted,
          claims_approved: claimsApproved,
          claims_paid: claimsPaid,
          rating: c.rating,
          status: c.status,
        };
      })
      .filter((d) => {
        if (search && !d.contractor_name.includes(search) && !d.contractor_code.includes(search)) return false;
        return true;
      })
      .sort((a, b) => b.total_contract_value - a.total_contract_value);
  }, [contractors, contracts, claims, search]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const stats = useMemo(() => {
    const totalContractors = reportData.length;
    const totalContractValue = reportData.reduce((s, d) => s + d.total_contract_value, 0);
    const totalActiveContracts = reportData.reduce((s, d) => s + d.active_contracts, 0);
    const totalClaimsSubmitted = reportData.reduce((s, d) => s + d.claims_submitted, 0);
    const totalClaimsApproved = reportData.reduce((s, d) => s + d.claims_approved, 0);
    const totalClaimsPaid = reportData.reduce((s, d) => s + d.claims_paid, 0);
    return { totalContractors, totalContractValue, totalActiveContracts, totalClaimsSubmitted, totalClaimsApproved, totalClaimsPaid };
  }, [reportData]);

  const statusLabels: Record<string, string> = {
    active: 'نشط',
    inactive: 'غير نشط',
    blacklisted: 'محظور',
  };

  return (
    <div dir="rtl">
      <PageHeader title="أداء المقاولين" description="تقرير أداء المقاولين والعقود والمستخلصات" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">عدد المقاولين</p>
            <p className="text-2xl font-bold">{stats.totalContractors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">العقود النشطة</p>
            <p className="text-2xl font-bold">{stats.totalActiveContracts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">قيمة العقود</p>
            <p className="text-2xl font-bold">{fmt(stats.totalContractValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">المستخلصات المقدمة</p>
            <p className="text-2xl font-bold">{stats.totalClaimsSubmitted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">المستخلصات المعتمدة</p>
            <p className="text-2xl font-bold text-amber-600">{stats.totalClaimsApproved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">المستخلصات المدفوعة</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalClaimsPaid}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم المقاول..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المقاول</TableHead>
                <TableHead className="text-right">العقود النشطة</TableHead>
                <TableHead className="text-right">إجمالي العقود</TableHead>
                <TableHead className="text-right">قيمة العقود</TableHead>
                <TableHead className="text-right">المستخلصات المقدمة</TableHead>
                <TableHead className="text-right">المعتمدة</TableHead>
                <TableHead className="text-right">المدفوعة</TableHead>
                <TableHead className="text-right">التقييم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.contractor_name}</TableCell>
                    <TableCell>{d.active_contracts}</TableCell>
                    <TableCell>{d.total_contracts}</TableCell>
                    <TableCell>{fmt(d.total_contract_value)}</TableCell>
                    <TableCell>{d.claims_submitted}</TableCell>
                    <TableCell>{d.claims_approved}</TableCell>
                    <TableCell>{d.claims_paid}</TableCell>
                    <TableCell>
                      {'★'.repeat(d.rating)}{'☆'.repeat(5 - d.rating)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
