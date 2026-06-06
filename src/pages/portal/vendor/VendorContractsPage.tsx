// Vendor Portal — Active Contracts
// Lists contracts where the logged-in vendor is the contractor

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { contractorStore, projectStore } from '@/services/stores';
import { formatQAR, formatQARInt, formatDate, formatDateLong } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Briefcase, Calendar, DollarSign, Building, Hash, Download, Eye, FileText, Clock,
  Percent, Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { seedContractorContracts } from '@/pages/construction/ContractorContractsPage';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);
const fmtInt = (v: number) => formatQARInt(v);

export default function VendorContractsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const vendorId = session?.vendorId;

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Use seed contractor contracts (they have contractor_id field)
  const allContracts = useMemo(() => seedContractorContracts, []);

  const myContracts = useMemo(() => {
    return allContracts.filter((c) => c.contractor_id === vendorId);
  }, [allContracts, vendorId]);

  const filtered = useMemo(() => {
    return myContracts.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search && !c.contract_number.toLowerCase().includes(search.toLowerCase()) && !c.contract_title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [myContracts, search, statusFilter]);

  const totalActive = filtered.filter((c) => c.status === 'active').reduce((s, c) => s + c.contract_amount, 0);
  const totalAdvance = filtered.reduce((s, c) => s + c.advance_payment, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">عقودي</h1>
          <p className="text-[12px] text-[#64748d] mt-0.5">العقود النشطة والمنتهية</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <p className="text-[12px] text-emerald-600">قيمة العقود النشطة</p>
            <p className="text-[15px] font-bold text-emerald-700">{fmtInt(totalActive)}</p>
          </div>
          <div className="bg-[rgba(83,58,253,0.06)] border border-blue-200 rounded-xl px-3 py-2">
            <p className="text-[12px] text-[#533afd]">إجمالي الدفعات المقدمة</p>
            <p className="text-[15px] font-bold text-[#533afd]">{fmtInt(totalAdvance)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          placeholder="ابحث برقم أو عنوان العقد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-10 text-[13px] bg-white border border-[#e5edf5] rounded-lg px-3"
        />
        <div className="flex gap-1">
          {[
            { v: 'all', label: 'الكل' },
            { v: 'active', label: 'نشط' },
            { v: 'completed', label: 'مكتمل' },
            { v: 'draft', label: 'مسودة' },
          ].map((b) => (
            <button
              key={b.v}
              onClick={() => setStatusFilter(b.v)}
              className={`px-3 h-10 rounded-lg text-[12px] font-medium ${
                statusFilter === b.v ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 border border-[#e5edf5]'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-[#64748d] text-[14px]">لا توجد عقود</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const project = projectStore.getById(c.project_id);
            const startDate = new Date(c.start_date);
            const endDate = new Date(c.end_date);
            const today = new Date();
            const daysToEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const progress = Math.max(0, Math.min(100, Math.round(((today.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100)));
            return (
              <Card key={c.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-[14px] font-bold text-[#061b31]">{c.contract_title}</h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-[12px] text-[#64748d] flex items-center gap-2 mb-3">
                        <Hash className="h-3 w-3" />
                        {c.contract_number}
                        <span>·</span>
                        <Building className="h-3 w-3" />
                        {project?.project_name || '—'}
                      </p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[12px] text-[#64748d]">قيمة العقد</p>
                          <p className="text-[13px] font-bold text-[#9b6829]">{fmt(c.contract_amount)}</p>
                        </div>
                        <div>
                          <p className="text-[12px] text-[#64748d]">دفعة مقدمة</p>
                          <p className="text-[13px] font-semibold text-[#061b31]">{fmt(c.advance_payment)}</p>
                        </div>
                        <div>
                          <p className="text-[12px] text-[#64748d]">نسبة الحجز</p>
                          <p className="text-[13px] font-semibold text-[#061b31]">{c.retention_percentage}%</p>
                        </div>
                        <div>
                          <p className="text-[12px] text-[#64748d]">الضمان</p>
                          <p className="text-[13px] font-semibold text-[#061b31]">{c.warranty_period_months} شهر</p>
                        </div>
                      </div>
                      {c.status === 'active' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[12px] text-[#64748d]">التقدم الزمني</p>
                            <p className="text-[12px] text-[#64748d]">{progress}% · {daysToEnd > 0 ? `${daysToEnd} يوم متبقي` : 'منتهي'}</p>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#9b6829] rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 lg:min-w-[140px]">
                      <Link to="/portal/vendor/claims">
                        <Button size="sm" className="w-full h-9 text-[12px] bg-amber-600 hover:bg-amber-700">
                          <DollarSign className="h-3.5 w-3.5 ml-1" />
                          تقديم مطالبة
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="w-full h-9 text-[12px]" onClick={() => toast.success(`جاري تحميل ${c.contract_number}`)}>
                        <Download className="h-3.5 w-3.5 ml-1" />
                        تحميل العقد
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
