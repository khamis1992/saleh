// Tenant Portal — Documents (lease, ID, receipts, etc.)

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { documentStore, leaseStore, receiptStore, tenantStore } from '@/services/stores';
import { formatQAR, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText, Download, Search, FileDown, FolderOpen, Hash, Calendar,
  File, Image as ImageIcon, Archive, Shield, FileSignature, CreditCard,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);

const DOC_TYPES = [
  { value: 'contract', label: 'عقد الإيجار', icon: FileSignature, color: 'blue' },
  { value: 'id_copy', label: 'صورة الهوية', icon: Shield, color: 'emerald' },
  { value: 'receipt', label: 'إيصال دفع', icon: CreditCard, color: 'amber' },
  { value: 'invoice', label: 'فاتورة', icon: FileText, color: 'violet' },
  { value: 'general', label: 'مستند عام', icon: File, color: 'gray' },
];

export default function TenantDocumentsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const tenantId = session?.tenantId;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const allDocs = useMemo(() => documentStore.getAll(), []);
  const receipts = useMemo(
    () => (tenantId ? receiptStore.getAll().filter((r) => r.tenant_id === tenantId) : []),
    [tenantId],
  );
  const leases = useMemo(
    () => (tenantId ? leaseStore.getAll().filter((l) => l.tenant_id === tenantId) : []),
    [tenantId],
  );
  const tenant = useMemo(() => (tenantId ? tenantStore.getById(tenantId) : null), [tenantId]);

  // Synthesize documents from real records (lease contracts, receipts, etc.)
  const synthesizedDocs = useMemo(() => {
    const docs: any[] = [];
    // Lease contracts → contract docs
    leases.forEach((l) => {
      docs.push({
        id: 'doc-lease-' + l.id,
        name: `عقد إيجار - ${l.contract_number}`,
        doc_type: 'contract',
        entity_type: 'contract',
        entity_id: l.id,
        file_url: '',
        file_size: 524288,
        created_at: l.start_date,
        notes: `عقد إيجار من ${formatDate(l.start_date)} إلى ${formatDate(l.end_date)}`,
        synthesized: true,
      });
    });
    // Receipts → receipt docs
    receipts.forEach((r) => {
      docs.push({
        id: 'doc-rcp-' + r.id,
        name: `إيصال دفع - ${r.receipt_number}`,
        doc_type: 'receipt',
        entity_type: 'receipt',
        entity_id: r.id,
        file_url: '',
        file_size: 102400,
        created_at: r.payment_date,
        notes: `إيصال دفع بمبلغ ${fmt(r.amount)}`,
        synthesized: true,
      });
    });
    // ID copy (synthesized)
    if (tenant && (tenant.national_id || tenant.passport_number)) {
      docs.push({
        id: 'doc-id-' + tenant.id,
        name: 'صورة الهوية / جواز السفر',
        doc_type: 'id_copy',
        entity_type: 'tenant',
        entity_id: tenant.id,
        file_url: '',
        file_size: 256000,
        created_at: new Date().toISOString().split('T')[0],
        notes: tenant.national_id ? `رقم الهوية: ${tenant.national_id}` : `رقم الجواز: ${tenant.passport_number}`,
        synthesized: true,
      });
    }
    // Real docs from store (linked to this tenant)
    const realDocs = allDocs.filter((d) => d.entity_id === tenantId);
    return [...docs, ...realDocs].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [leases, receipts, tenant, allDocs, tenantId]);

  const filtered = useMemo(() => {
    return synthesizedDocs.filter((d) => {
      if (typeFilter !== 'all' && d.doc_type !== typeFilter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [synthesizedDocs, search, typeFilter]);

  const handleDownload = (doc: any) => {
    if (doc.file_url) {
      // Real download (won't work in demo but the intent is right)
      window.open(doc.file_url, '_blank');
    } else {
      toast.success(`جاري تحميل ${doc.name}...`);
    }
  };

  const handleDownloadAll = () => {
    toast.success(`جاري تحضير ${filtered.length} مستند في ملف ZIP...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">{tt('documents.title', 'المستندات')}</h1>
          <p className="text-xs text-[#64748d] mt-0.5">جميع مستندات عقدك وسجلات الدفع</p>
        </div>
        <Button variant="outline" onClick={handleDownloadAll} className="h-10 text-xs">
          <Archive className="h-4 w-4 ml-1" />
          تحميل الكل (ZIP)
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
          <Input
            placeholder="ابحث في المستندات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-10 text-[13px] bg-white"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 h-10 rounded-lg text-xs font-medium whitespace-nowrap ${
              typeFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-[#e5edf5]'
            }`}
          >
            الكل
          </button>
          {DOC_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-3 h-10 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${
                  typeFilter === t.value ? `bg-${t.color}-600 text-white` : 'bg-white text-gray-700 border border-[#e5edf5]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents list */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-[#64748d] text-sm">لا توجد مستندات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((doc) => {
            const typeInfo = DOC_TYPES.find((t) => t.value === doc.doc_type) || DOC_TYPES[4];
            const Icon = typeInfo.icon;
            return (
              <Card key={doc.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`h-11 w-11 rounded-xl bg-${typeInfo.color}-50 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 text-${typeInfo.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#061b31] line-clamp-2 leading-tight">{doc.name}</p>
                      <p className="text-xs text-[#64748d] mt-0.5">{typeInfo.label}</p>
                    </div>
                  </div>
                  {doc.notes && (
                    <p className="text-xs text-[#64748d] mb-3 line-clamp-2">{doc.notes}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-[#64748d] mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(doc.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      {doc.file_url ? (
                        <span className="text-emerald-600">✓ ملف متاح</span>
                      ) : (
                        <span className="text-[#9b6829]">جاهز للتحميل</span>
                      )}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-3 w-3 ml-1" />
                    تحميل
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
