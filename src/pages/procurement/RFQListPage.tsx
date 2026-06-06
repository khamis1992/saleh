import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, FileText, Plus, Search } from 'lucide-react';
import { rfqStore, vendorQuotationStore, projectStore, getProjectName } from '@/services/stores';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  draft: 'مسودة', sent: 'مُرسل', quotations_received: 'تم استلام العروض',
  under_evaluation: 'قيد التقييم', awarded: 'مُرسى', cancelled: 'ملغي', closed: 'مغلق',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  quotations_received: 'bg-amber-100 text-amber-700', under_evaluation: 'bg-purple-100 text-purple-700',
  awarded: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', closed: 'bg-gray-100 text-gray-700',
};

export default function RFQListPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);

  const rfqs = useMemo(() => rfqStore.getAll(), [refresh]);
  const quotations = useMemo(() => vendorQuotationStore.getAll(), [refresh]);

  const filtered = useMemo(() => rfqs.filter((r: any) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.rfq_number?.includes(search) && !r.title?.includes(search)) return false;
    return true;
  }), [rfqs, search, statusFilter]);

  const getQuoteCount = (rfqId: string) => quotations.filter((q: any) => q.rfq_id === rfqId).length;

  const handleStatusChange = (rfqId: string, newStatus: string) => {
    rfqStore.update(rfqId, { status: newStatus } as any);
    setRefresh(r => r + 1);
    toast.success(`تم تحديث الحالة إلى "${statusLabels[newStatus] || newStatus}"`);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">طلبات عروض الأسعار</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة طلبات عروض الأسعار وإرسالها للموردين ومتابعة العروض</p>
        </div>
        <Button onClick={() => navigate('/procurement/quotation-comparison')} className="gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm h-9 rounded-full px-4">
          <Plus className="h-4 w-4" /> مقارنة عروض
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث برقم RFQ أو العنوان..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-2 pr-8 h-9 text-sm rounded-lg"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-40 text-sm rounded-lg">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="text-xs font-semibold text-gray-500">رقم RFQ</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">العنوان</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">المشروع</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">تاريخ التسليم</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">العروض</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">الحالة</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rfq: any) => {
                const quoteCount = getQuoteCount(rfq.id);
                return (
                  <TableRow key={rfq.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-sm font-mono text-indigo-600">{rfq.rfq_number}</TableCell>
                    <TableCell className="text-sm text-gray-800">{rfq.title}</TableCell>
                    <TableCell className="text-xs text-gray-500">{getProjectName(rfq.project_id) || rfq.project_id}</TableCell>
                    <TableCell className="text-xs text-gray-500">{rfq.submission_deadline || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{quoteCount} عرض</Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={rfq.status} onValueChange={(v) => handleStatusChange(rfq.id, v)}>
                        <SelectTrigger className="h-7 w-36 text-[11px] rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-sm">{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-indigo-600 hover:bg-indigo-50"
                          onClick={() => navigate(`/procurement/quotation-comparison?rfqId=${rfq.id}`)}>
                          <FileText className="h-3 w-3 ml-1" /> عرض العروض
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-sm text-gray-400">
                    لا توجد طلبات عروض أسعار
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="py-2 px-4 border-t border-gray-100 bg-gray-50/50">
          <span className="text-xs text-gray-500">عرض {filtered.length} من {rfqs.length} طلب</span>
        </div>
      </div>
    </div>
  );
}
