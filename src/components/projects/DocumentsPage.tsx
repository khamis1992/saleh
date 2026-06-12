import { useState, useMemo, useCallback } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import officeparser from 'officeparser';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Filter, Upload, Download, FileText, Trash2, X, Plus, Archive, Eye, TrendingUp, TrendingDown, RotateCcw, Sparkles, Users, Activity, Clock, CheckCircle2, AlertTriangle, ArrowRight, Building2, FolderKanban } from 'lucide-react';
import { documentStore } from '@/services/stores';
import type { StoredDocument } from '@/services/stores';

const types: Record<string, string> = { land_deed: 'صك أرض', contract: 'عقد', drawing: 'مخطط', report: 'تقرير', photo: 'صورة', invoice: 'فاتورة', other: 'أخرى' };
const entityTypes: Record<string, string> = { land: 'الأراضي', project: 'المشاريع', property: 'العقارات', contract: 'عقود الإيجار', tenant: 'المستأجرين', contractor: 'المقاولين', procurement: 'المشتريات', hr: 'الموارد البشرية', maintenance: 'الصيانة', finance: 'المالية' };

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string;
}) {
  const a: Record<string, { iconBg: string; iconColor: string }> = {
    indigo:{ iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' }, emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    amber: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, slate: { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
  }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      </div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function DocRow({ d, onPreview, onDownload, onDelete }: {
  d: StoredDocument; onPreview: (d: StoredDocument) => void; onDownload: (d: StoredDocument) => void; onDelete: (d: StoredDocument) => void;
}) {
  const canPreview = d.file_url && (d.file_name.endsWith('.docx') || d.file_name.endsWith('.xlsx') || d.file_name.endsWith('.pptx') || d.file_name.endsWith('.odt'));
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400 shrink-0" /><span className="text-sm font-bold text-gray-900">{d.file_name}</span></div></td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${d.file_type === 'contract' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : d.file_type === 'drawing' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : d.file_type === 'photo' ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' : d.file_type === 'invoice' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' : 'bg-gray-50 text-gray-600 ring-1 ring-gray-100'}`}>{types[d.file_type] || d.file_type}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{entityTypes[d.entity_type] || d.entity_type}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{d.uploaded_by}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{d.uploaded_at}</td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          {canPreview && <Tooltip><TooltipTrigger asChild><button onClick={() => onPreview(d)} className="h-7 w-7 rounded-md text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>معاينة</TooltipContent></Tooltip>}
          {d.file_url && <Tooltip><TooltipTrigger asChild><button onClick={() => onDownload(d)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Download className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تحميل</TooltipContent></Tooltip>}
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(d)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyDocs({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><FileText className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد مستندات</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function DocumentsPage() {
  const { t, dir } = useLocale();
  const [docs, setDocs] = useState<StoredDocument[]>(() => documentStore.getAll());
  const [search, setSearch] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoredDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; html: string } | null>(null);
  const [uploadForm, setUploadForm] = useState({ entity_type: 'project', entity_name: '', file_name: '', file_type: 'contract', notes: '', file_base64: '' });

  const refresh = () => setDocs(documentStore.getAll());

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setUploadForm(prev => ({ ...prev, file_name: file.name, file_type: file.name.endsWith('.pdf') ? 'contract' : file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'photo' : file.name.match(/\.(xlsx|xls|csv)$/i) ? 'invoice' : file.name.match(/\.(dwg|dxf|skp)$/i) ? 'drawing' : 'other', file_base64: base64 }));
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, maxFiles: 1, maxSize: 10 * 1024 * 1024,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'], 'application/vnd.ms-excel': ['.xls'], 'text/csv': ['.csv'] },
  });

  const filtered = useMemo(() => docs.filter(d => { if (fileTypeFilter !== 'all' && d.file_type !== fileTypeFilter) return false; if (entityTypeFilter !== 'all' && d.entity_type !== entityTypeFilter) return false; if (search && !d.file_name.includes(search)) return false; return true; }), [docs, search, fileTypeFilter, entityTypeFilter]);

  const handleUpload = () => {
    if (!uploadForm.file_name || !uploadForm.file_base64) { toast.error('يرجى اختيار ملف للرفع'); return; }
    const user = (() => { try { const u = localStorage.getItem('erp_auth_user'); return u ? JSON.parse(u).email || 'مستخدم' : 'مستخدم'; } catch { return 'مستخدم'; } })();
    documentStore.create({ entity_type: uploadForm.entity_type, entity_id: '', file_name: uploadForm.file_name, file_type: uploadForm.file_type, file_url: uploadForm.file_base64, uploaded_by: user, uploaded_at: new Date().toISOString().split('T')[0], notes: uploadForm.notes });
    refresh(); toast.success('تم رفع المستند بنجاح'); setShowUploadModal(false);
    setUploadForm({ entity_type: 'project', entity_name: '', file_name: '', file_type: 'contract', notes: '', file_base64: '' });
  };

  const handleDownload = (doc: StoredDocument) => {
    if (!doc.file_url) { toast.error('لا يوجد ملف مرفق'); return; }
    try {
      let mimeType = 'application/octet-stream';
      if (doc.file_name.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (doc.file_name.endsWith('.jpg') || doc.file_name.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (doc.file_name.endsWith('.png')) mimeType = 'image/png';
      else if (doc.file_name.endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (doc.file_name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (doc.file_name.endsWith('.txt')) mimeType = 'text/plain';
      const byteString = atob(doc.file_url);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = doc.file_name; a.click();
      URL.revokeObjectURL(url); toast.success('تم تحميل الملف');
    } catch { toast.error('فشل تحميل الملف'); }
  };

  const handleDownloadAll = async () => {
    const docsWithFiles = filtered.filter(d => d.file_url);
    if (docsWithFiles.length === 0) { toast.error('لا توجد ملفات للتحميل'); return; }
    const zip = new JSZip();
    docsWithFiles.forEach(d => { try { const s = atob(d.file_url); const ab = new ArrayBuffer(s.length); const ia = new Uint8Array(ab); for (let i = 0; i < s.length; i++) ia[i] = s.charCodeAt(i); zip.file(d.file_name, ab); } catch {} });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `documents_${new Date().toISOString().split('T')[0]}.zip`; a.click();
    toast.success(`تم تحميل ${docsWithFiles.length} مستند كملف مضغوط`);
  };

  const handlePreviewOffice = async (doc: StoredDocument) => {
    if (!doc.file_url) return;
    if (doc.file_name.endsWith('.docx')) return handlePreviewDocx(doc);
    try {
      const s = atob(doc.file_url); const ab = new ArrayBuffer(s.length); const ia = new Uint8Array(ab);
      for (let i = 0; i < s.length; i++) ia[i] = s.charCodeAt(i);
      const text = await officeparser.parseOffice(ia);
      setPreviewDoc({ name: doc.file_name, html: `<pre style="white-space:pre-wrap;font-family:inherit;direction:rtl;text-align:right">${text}</pre>` });
    } catch { toast.error('فشل معاينة الملف'); }
  };

  const handlePreviewDocx = async (doc: StoredDocument) => {
    if (!doc.file_url || !doc.file_name.endsWith('.docx')) { toast.error('المعاينة متاحة فقط لملفات Word'); return; }
    try {
      const s = atob(doc.file_url); const ab = new ArrayBuffer(s.length); const ia = new Uint8Array(ab);
      for (let i = 0; i < s.length; i++) ia[i] = s.charCodeAt(i);
      const result = await mammoth.convertToHtml({ arrayBuffer: ab as ArrayBuffer });
      setPreviewDoc({ name: doc.file_name, html: result.value });
    } catch { toast.error('فشل معاينة الملف'); }
  };

  const handleDelete = () => { if (!deleteTarget) return; documentStore.remove(deleteTarget.id); refresh(); toast.success('تم حذف المستند'); setDeleteTarget(null); };
  const resetFilters = () => { setSearch(''); setFileTypeFilter('all'); setEntityTypeFilter('all'); };

  const contractCount = docs.filter(d => d.file_type === 'contract').length;
  const photoCount = docs.filter(d => d.file_type === 'photo').length;
  const totalFileSize = docs.length;

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm"><FileText className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">المستندات</span><span className="text-[13px] font-bold text-gray-900">{docs.length} مستند</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في المستندات..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="me-auto" />
          <Button onClick={handleDownloadAll} disabled={filtered.filter(d => d.file_url).length === 0}
            className="h-8 px-3 gap-1.5 text-[11px] font-bold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm">
            <Archive className="h-3.5 w-3.5" /><span className="hidden sm:inline">ZIP</span>
          </Button>
          <Button onClick={() => setShowUploadModal(true)}
            className="h-8 px-3 gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Upload className="h-3.5 w-3.5" /><span>رفع مستند</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي المستندات" value={docs.length} sub={`${filtered.length} معروض`} icon={FileText} accent="slate" />
          <KpiCard label="عقود" value={contractCount} sub="مستندات تعاقدية" icon={FileText} accent="indigo" />
          <KpiCard label="صور ومخططات" value={photoCount} sub="ملفات بصرية" icon={Activity} accent="amber" />
          <KpiCard label="تقارير" value={docs.filter(d => d.file_type === 'report').length} sub="مستندات تقارير" icon={FileText} accent="emerald" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">{t.documents.title}</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الوحدة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الوحدات</SelectItem>{Object.entries(entityTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="النوع" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الأنواع</SelectItem>{Object.entries(types).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyDocs onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">عنوان المستند</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">النوع</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الوحدة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رافع الملف</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التاريخ</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[110px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map(d => <DocRow key={d.id} d={d} onPreview={handlePreviewOffice} onDownload={handleDownload} onDelete={setDeleteTarget} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {docs.length} مستند</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف المستند <strong className="text-gray-900">{deleteTarget.file_name}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>رفع مستند جديد</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>الوحدة المرتبطة</Label><Select value={uploadForm.entity_type} onValueChange={v => setUploadForm({ ...uploadForm, entity_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(entityTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>نوع المستند</Label><Select value={uploadForm.file_type} onValueChange={v => setUploadForm({ ...uploadForm, file_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(types).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>الملف *</Label>
              <div {...getRootProps()} className={`mt-1.5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
                <input {...getInputProps()} />
                {uploadForm.file_name ? (
                  <div className="flex items-center justify-center gap-2"><FileText className="h-5 w-5 text-green-600" /><span className="text-sm text-green-700 font-medium">{uploadForm.file_name}</span><button onClick={e => { e.stopPropagation(); setUploadForm({ ...uploadForm, file_name: '', file_base64: '' }); }} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button></div>
                ) : isDragActive ? (
                  <div className="flex flex-col items-center gap-2"><Upload className="h-8 w-8 text-indigo-500" /><p className="text-sm text-indigo-600 font-medium">أفلت الملف هنا</p></div>
                ) : (
                  <div className="flex flex-col items-center gap-2"><Upload className="h-8 w-8 text-gray-300" /><p className="text-sm text-gray-500">اسحب وأفلت الملف هنا، أو اضغط للتصفح</p><p className="text-xs text-gray-400">PDF، صور، Word، Excel — حتى 10 ميجابايت</p></div>
                )}
              </div>
            </div>
            <div><Label>ملاحظات</Label><Input value={uploadForm.notes} onChange={e => setUploadForm({ ...uploadForm, notes: e.target.value })} placeholder="ملاحظات إضافية..." /></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setShowUploadModal(false)}>إلغاء</Button><Button onClick={handleUpload} className="bg-indigo-500 hover:bg-indigo-600 text-white"><Upload className="h-4 w-4 ml-2" /> رفع المستند</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />معاينة: {previewDoc?.name}</DialogTitle></DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-white border rounded-lg text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: previewDoc?.html || '' }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}