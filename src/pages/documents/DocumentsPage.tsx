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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Filter, Upload, Download, FileText, Trash2, X, Plus, Archive, Eye } from 'lucide-react';
import { documentStore } from '@/services/stores';
import type { StoredDocument } from '@/services/stores';

export default function DocumentsPage() {
  const { t } = useLocale();
  const [docs, setDocs] = useState<StoredDocument[]>(() => documentStore.getAll());
  const [search, setSearch] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoredDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; html: string } | null>(null);
  const [uploadForm, setUploadForm] = useState({
    entity_type: 'project',
    entity_name: '',
    file_name: '',
    file_type: 'contract',
    notes: '',
    file_base64: '',
  });

  const types: Record<string, string> = { land_deed: 'صك أرض', contract: 'عقد', drawing: 'مخطط', report: 'تقرير', photo: 'صورة', invoice: 'فاتورة', other: 'أخرى' };
  const entityTypes: Record<string, string> = {
    land: 'الأراضي', project: 'المشاريع', property: 'العقارات', contract: 'عقود الإيجار',
    tenant: 'المستأجرين', contractor: 'المقاولين', procurement: 'المشتريات', hr: 'الموارد البشرية',
  };

  const refresh = () => setDocs(documentStore.getAll());

  // Drag-and-drop file handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setUploadForm(prev => ({
        ...prev,
        file_name: file.name,
        file_type: file.name.endsWith('.pdf') ? 'contract' : file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'photo' : file.name.match(/\.(xlsx|xls|csv)$/i) ? 'invoice' : file.name.match(/\.(dwg|dxf|skp)$/i) ? 'drawing' : 'other',
        file_base64: base64,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (fileTypeFilter !== 'all' && d.file_type !== fileTypeFilter) return false;
      if (entityTypeFilter !== 'all' && d.entity_type !== entityTypeFilter) return false;
      if (search && !d.file_name.includes(search)) return false;
      return true;
    });
  }, [docs, search, fileTypeFilter, entityTypeFilter]);

  const handleUpload = () => {
    if (!uploadForm.file_name || !uploadForm.file_base64) {
      toast.error('يرجى اختيار ملف للرفع');
      return;
    }
    const user = (() => {
      try {
        const u = localStorage.getItem('erp_auth_user');
        return u ? JSON.parse(u).email || 'مستخدم' : 'مستخدم';
      } catch { return 'مستخدم'; }
    })();

    documentStore.create({
      entity_type: uploadForm.entity_type,
      entity_id: '',
      file_name: uploadForm.file_name,
      file_type: uploadForm.file_type,
      file_url: uploadForm.file_base64,
      uploaded_by: user,
      uploaded_at: new Date().toISOString().split('T')[0],
      notes: uploadForm.notes,
    });
    refresh();
    toast.success('تم رفع المستند بنجاح');
    setShowUploadModal(false);
    setUploadForm({
      entity_type: 'project', entity_name: '', file_name: '', file_type: 'contract', notes: '', file_base64: '',
    });
  };

  const handleDownload = (doc: StoredDocument) => {
    if (!doc.file_url) {
      toast.error('لا يوجد ملف مرفق');
      return;
    }
    try {
      // Determine MIME type
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
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تحميل الملف');
    } catch {
      toast.error('فشل تحميل الملف');
    }
  };

  const handleDownloadAll = async () => {
    const docsWithFiles = filtered.filter(d => d.file_url);
    if (docsWithFiles.length === 0) {
      toast.error('لا توجد ملفات للتحميل');
      return;
    }
    const zip = new JSZip();
    docsWithFiles.forEach(d => {
      try {
        const byteString = atob(d.file_url);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        zip.file(d.file_name, ab);
      } catch {}
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`تم تحميل ${docsWithFiles.length} مستند كملف مضغوط`);
  };

  const handlePreviewOffice = async (doc: StoredDocument) => {
    if (!doc.file_url) return;
    const ext = doc.file_name.split('.').pop()?.toLowerCase();
    if (ext === 'docx') {
      return handlePreviewDocx(doc);
    }
    try {
      const byteString = atob(doc.file_url);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const text = await officeparser.parseOffice(ia);
      setPreviewDoc({ name: doc.file_name, html: `<pre style="white-space:pre-wrap;font-family:inherit;direction:rtl;text-align:right">${text}</pre>` });
    } catch {
      toast.error('فشل معاينة الملف');
    }
  };

  const handlePreviewDocx = async (doc: StoredDocument) => {
    if (!doc.file_url) return;
    if (!doc.file_name.endsWith('.docx')) {
      toast.error('المعاينة متاحة فقط لملفات Word');
      return;
    }
    try {
      const byteString = atob(doc.file_url);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const result = await mammoth.convertToHtml({ arrayBuffer: ab as ArrayBuffer });
      setPreviewDoc({ name: doc.file_name, html: result.value });
    } catch {
      toast.error('فشل معاينة الملف');
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    documentStore.remove(deleteTarget.id);
    refresh();
    toast.success('تم حذف المستند بنجاح');
    setDeleteTarget(null);
  };

  return (
    <div className="bg-gray-50 min-h-full" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.documents.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{filtered.length} مستند — {t.documents.list}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            disabled={filtered.filter(d => d.file_url).length === 0}
            className="gap-1 h-9 rounded-lg text-sm"
            title="تحميل الكل كملف مضغوط"
          >
            <Archive className="h-4 w-4" />
            ZIP
          </Button>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20"
          >
            <Upload className="h-4 w-4" />{t.documents.upload}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t.common.search + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute left-3 top-2.5 text-gray-300 hover:text-gray-500">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="الوحدة المرتبطة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الوحدات</SelectItem>
              {Object.entries(entityTypes).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
            <SelectTrigger className="w-[150px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="نوع المستند" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {Object.entries(types).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold text-gray-500">عنوان المستند</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">{t.documents.documentType}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">{t.documents.linkedModule}</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">رافع المستند</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">التاريخ</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 w-[100px]">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <FileText className="h-7 w-7 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">لا توجد مستندات</p>
                      <p className="text-xs text-gray-400">لم يتم العثور على أي نتائج</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSearch(''); setFileTypeFilter('all'); setEntityTypeFilter('all'); }}
                        className="h-8 text-xs rounded-lg mt-1"
                      >
                        مسح الفلاتر
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((d) => (
                <TableRow key={d.id} className="hover:bg-blue-50/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-sm">{d.file_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{types[d.file_type] || d.file_type}</TableCell>
                  <TableCell className="text-sm">{entityTypes[d.entity_type] || d.entity_type}</TableCell>
                  <TableCell className="text-sm">{d.uploaded_by}</TableCell>
                  <TableCell className="text-sm">{d.uploaded_at}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {d.file_url && (d.file_name.endsWith('.docx') || d.file_name.endsWith('.xlsx') || d.file_name.endsWith('.pptx') || d.file_name.endsWith('.odt')) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                              onClick={() => handlePreviewOffice(d)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>معاينة المكتب</TooltipContent>
                        </Tooltip>
                      )}
                      {d.file_url && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => handleDownload(d)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تحميل</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteTarget(d)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>حذف</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">عرض {filtered.length} من {docs.length} مستند</span>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>رفع مستند جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>الوحدة المرتبطة</Label>
              <Select value={uploadForm.entity_type} onValueChange={(v) => setUploadForm({ ...uploadForm, entity_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(entityTypes).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>نوع المستند</Label>
              <Select value={uploadForm.file_type} onValueChange={(v) => setUploadForm({ ...uploadForm, file_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(types).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الملف *</Label>
              <div
                {...getRootProps()}
                className={`mt-1.5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                {uploadForm.file_name ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{uploadForm.file_name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setUploadForm({ ...uploadForm, file_name: '', file_base64: '' }); }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : isDragActive ? (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-blue-500" />
                    <p className="text-sm text-blue-600 font-medium">أفلت الملف هنا</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">اسحب وأفلت الملف هنا، أو اضغط للتصفح</p>
                    <p className="text-xs text-gray-400">PDF، صور، Word، Excel — حتى 10 ميجابايت</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Input
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>{t.common.cancel}</Button>
            <Button onClick={handleUpload} className="bg-[#3B82F6] hover:bg-blue-600">
              <Upload className="h-4 w-4 ml-2" />
              رفع المستند
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستند <strong>{deleteTarget?.file_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* DOCX Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              معاينة: {previewDoc?.name}
            </DialogTitle>
          </DialogHeader>
          <div
            className="overflow-y-auto max-h-[60vh] p-4 bg-white border rounded-lg text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: previewDoc?.html || '' }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
