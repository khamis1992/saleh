// Landlord Portal — Documents Archive

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { documentStore, propertyStore, leaseStore, generateId } from '@/services/stores';
import { formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  FileText, FolderOpen, Search, Download, FileSignature, Building, File, Archive, Hash, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const DOC_TYPES = [
  { value: 'title_deed', label: 'صك الملكية', icon: FileSignature, color: 'amber' },
  { value: 'contract', label: 'عقد إيجار', icon: FileText, color: 'blue' },
  { value: 'insurance', label: 'تأمين', icon: File, color: 'emerald' },
  { value: 'license', label: 'رخصة', icon: File, color: 'violet' },
  { value: 'invoice', label: 'فاتورة', icon: FileText, color: 'rose' },
  { value: 'general', label: 'مستند عام', icon: File, color: 'gray' },
];

export default function LandlordDocumentsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const propertyId = session?.propertyId;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const allDocs = useMemo(() => documentStore.getAll(), []);
  const properties = useMemo(() => propertyStore.getAll(), []);
  const leases = useMemo(() => leaseStore.getAll(), []);

  // Synthesize: title deed per property, contract per lease
  const synthesized = useMemo(() => {
    const docs: any[] = [];
    properties.forEach((p) => {
      docs.push({
        id: 'doc-deed-' + p.id,
        name: `صك ملكية - ${p.property_name}`,
        doc_type: 'title_deed',
        entity_type: 'property',
        entity_id: p.id,
        file_url: '',
        file_size: 1048576,
        created_at: '2024-01-15',
        notes: `صك ملكية للعقار ${p.property_name} (${p.address})`,
        synthesized: true,
      });
    });
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
        notes: `عقد إيجار يبدأ ${formatDate(l.start_date)}`,
        synthesized: true,
      });
    });
    return [...docs, ...allDocs].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [properties, leases, allDocs]);

  const filtered = useMemo(() => {
    return synthesized.filter((d) => {
      if (typeFilter !== 'all' && d.doc_type !== typeFilter) return false;
      if (propertyId && d.entity_type === 'property' && d.entity_id !== propertyId) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [synthesized, search, typeFilter, propertyId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">الأرشيف</h1>
          <p className="text-[12px] text-[#64748d] mt-0.5">مستندات العقارات، العقود، والصكوك</p>
        </div>
        <Button variant="outline" onClick={() => toast.success(`جاري تحضير ${filtered.length} مستند`)} className="h-10 text-[12px]">
          <Archive className="h-4 w-4 ml-1" />
          تحميل الكل
        </Button>
      </div>

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
          <button onClick={() => setTypeFilter('all')} className={`px-3 h-10 rounded-lg text-[12px] font-medium whitespace-nowrap ${typeFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 border border-[#e5edf5]'}`}>الكل</button>
          {DOC_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.value} onClick={() => setTypeFilter(t.value)} className={`px-3 h-10 rounded-lg text-[12px] font-medium whitespace-nowrap flex items-center gap-1.5 ${typeFilter === t.value ? `bg-${t.color}-600 text-white` : 'bg-white text-gray-700 border border-[#e5edf5]'}`}>
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-[#64748d] text-[14px]">لا توجد مستندات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((doc) => {
            const typeInfo = DOC_TYPES.find((t) => t.value === doc.doc_type) || DOC_TYPES[5];
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
                      <p className="text-[12px] text-[#64748d] mt-0.5">{typeInfo.label}</p>
                    </div>
                  </div>
                  {doc.notes && <p className="text-[12px] text-[#64748d] mb-3 line-clamp-2">{doc.notes}</p>}
                  <div className="flex items-center justify-between text-[12px] text-[#64748d] mb-3">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(doc.created_at)}</span>
                    <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full h-8 text-[12px]" onClick={() => toast.success(`جاري تحميل ${doc.name}`)}>
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
