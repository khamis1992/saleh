import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { LineItemsTable } from '@/components/shared/Phase2Components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Clock, ShoppingCart, Star, ThumbsUp, Trophy } from 'lucide-react';
import { rfqStore, vendorQuotationStore, projectStore, purchaseOrderStore } from '@/services/stores';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  sent: 'مُرسل',
  quotations_received: 'تم استلام العروض',
  under_evaluation: 'قيد التقييم',
  awarded: 'مُرسى',
  cancelled: 'ملغي',
  closed: 'مغلق',
  submitted: 'مقدم',
  under_review: 'قيد المراجعة',
  recommended: 'موصى به',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  quotations_received: 'bg-amber-100 text-amber-700',
  under_evaluation: 'bg-purple-100 text-purple-700',
  awarded: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  recommended: 'bg-green-100 text-green-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

// Hardcoded vendor names since we don't have vendor store fully seeded
const vendorNames: Record<string, string> = {
  'qtn-1': 'شركة الريان للتوريدات',
  'qtn-2': 'مؤسسة البناء المتقدم',
  'qtn-3': 'مؤسسة الزهراء التجارية',
};

// Mock quotation items - hardcoded for the demo comparison
const quotationItemsMap: Record<string, { itemName: string; description: string; quantity: number; unit: string; unitPrice: number; total: number }[]> = {
  'qtn-1': [
    { itemName: 'سيراميك أرضيات 60x60', description: 'درجة أولى إسباني', quantity: 1500, unit: 'متر مربع', unitPrice: 180, total: 270000 },
    { itemName: 'دهان داخلي أبيض', description: 'جوتن درجة أولى', quantity: 200, unit: 'جالون', unitPrice: 550, total: 110000 },
    { itemName: 'باب خشبي 90سم', description: 'خشب سويدي', quantity: 20, unit: 'وحدة', unitPrice: 1200, total: 24000 },
  ],
  'qtn-2': [
    { itemName: 'سيراميك أرضيات 60x60', description: 'درجة أولى إيطالي', quantity: 1500, unit: 'متر مربع', unitPrice: 190, total: 285000 },
    { itemName: 'دهان داخلي أبيض', description: 'جوتن درجة أولى', quantity: 200, unit: 'جالون', unitPrice: 520, total: 104000 },
    { itemName: 'باب خشبي 90سم', description: 'خشب سويدي', quantity: 20, unit: 'وحدة', unitPrice: 1250, total: 25000 },
  ],
  'qtn-3': [
    { itemName: 'سيراميك أرضيات 60x60', description: 'درجة أولى صيني', quantity: 1500, unit: 'متر مربع', unitPrice: 165, total: 247500 },
    { itemName: 'دهان داخلي أبيض', description: 'جوتن درجة أولى', quantity: 200, unit: 'جالون', unitPrice: 510, total: 102000 },
    { itemName: 'باب خشبي 90سم', description: 'خشب سويدي', quantity: 20, unit: 'وحدة', unitPrice: 1180, total: 23600 },
  ],
};

export default function QuotationComparisonPage() {
  const { t } = useLocale();
  const [selectedRfqId, setSelectedRfqId] = useState('');
  const [refresh, setRefresh] = useState(0);

  const rfqs = useMemo(() => rfqStore.getAll(), [refresh]);
  const quotations = useMemo(() => vendorQuotationStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), []);

  const selectedRfq = rfqs.find((r: any) => r.id === selectedRfqId);
  const rfqQuotations = quotations.filter((q: any) => q.rfq_id === selectedRfqId);

  const formattedAmount = (v: number) =>
    formatQAR(v);

  const getProjectName = (id: string) => projects.find((p: any) => p.id === id)?.project_name || id;

  // Get all unique items for side-by-side comparison
  const allItemNames = useMemo(() => {
    const names = new Set<string>();
    rfqQuotations.forEach((q: any) => {
      const items = quotationItemsMap[q.id] || [];
      items.forEach((it: any) => names.add(it.itemName));
    });
    return Array.from(names);
  }, [rfqQuotations]);

  const bestQuotation = rfqQuotations.find((q: any) => q.is_recommended);
  const lowestTotal = rfqQuotations.length > 0
    ? Math.min(...rfqQuotations.map((q: any) => q.total_amount))
    : 0;

  const navigate = useNavigate();

  const handleCreatePO = (quotationId: string) => {
    const quotation = rfqQuotations.find((q: any) => q.id === quotationId);
    if (!quotation || !selectedRfq) {
      toast.error('تعذر إنشاء أمر الشراء: بيانات غير مكتملة');
      return;
    }

    // Auto-generate PO number: PO-{year}-{counter}
    const currentYear = new Date().getFullYear();
    const allPOs = purchaseOrderStore.getAll();
    const yearPOs = allPOs.filter((po) => po.po_number.startsWith(`PO-${currentYear}-`));
    const counter = String(yearPOs.length + 1).padStart(3, '0');
    const poNumber = `PO-${currentYear}-${counter}`;

    const vendorName = vendorNames[quotationId] || quotation.quotation_number || 'مورد غير معروف';
    const projectName = getProjectName(selectedRfq.project_id);
    const today = new Date().toISOString().split('T')[0];
    const expectedDelivery = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      purchaseOrderStore.create({
        po_number: poNumber,
        vendor: vendorName,
        project: projectName,
        order_date: today,
        expected_delivery: expectedDelivery,
        delivery_location: '',
        total_amount: quotation.total_amount,
        receipt_status: 'none',
        payment_status: 'unpaid',
        status: 'draft',
        notes: `تم إنشاؤه تلقائياً من عرض السعر ${quotation.quotation_number || quotationId}`,
      });

      toast.success(`تم إنشاء أمر الشراء ${poNumber} بنجاح`, {
        description: `المورد: ${vendorName} | الإجمالي: ${formattedAmount(quotation.total_amount)}`,
      });

      navigate('/procurement/purchase-orders');
    } catch (err) {
      toast.error('فشل إنشاء أمر الشراء');
      console.error('handleCreatePO error:', err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-full" dir="rtl">
      <PageHeader
        title="مقارنة عروض الأسعار"
        description="مقارنة عروض الأسعار المقدمة من الموردين لطلبات العروض"
      />

      {/* RFQ Selection */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px] max-w-md">
              <label className="text-sm font-medium mb-1 block">اختر طلب عرض السعر (RFQ)</label>
              <Select value={selectedRfqId} onValueChange={setSelectedRfqId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر RFQ للمقارنة" />
                </SelectTrigger>
                <SelectContent>
                  {rfqs.map((rfq: any) => (
                    <SelectItem key={rfq.id} value={rfq.id}>
                      {rfq.rfq_number} - {rfq.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRfq && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>المشروع: <strong>{getProjectName(selectedRfq.project_id)}</strong></span>
                <span>الحالة: <Badge variant="outline">{statusLabels[selectedRfq.status] || selectedRfq.status}</Badge></span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedRfq && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ArrowLeft className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">اختر طلب عرض سعر</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              يرجى اختيار طلب عرض سعر من القائمة أعلاه لعرض ومقارنة عروض الأسعار المقدمة
            </p>
          </CardContent>
        </Card>
      )}

      {selectedRfq && rfqQuotations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-lg font-semibold mb-1">لا توجد عروض أسعار</h3>
            <p className="text-sm text-muted-foreground">لم يتم تقديم أي عروض أسعار لطلب العرض هذا بعد</p>
          </CardContent>
        </Card>
      )}

      {selectedRfq && rfqQuotations.length > 0 && (
        <>
          {/* Quotations summary cards */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(rfqQuotations.length, 4)} gap-4 mb-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {rfqQuotations.map((qtn: any) => (
                <Card
                  key={qtn.id}
                  className={qtn.is_recommended ? 'border-green-500 border-2' : ''}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">{vendorNames[qtn.id] || qtn.quotation_number}</h3>
                      {qtn.is_recommended && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <Trophy className="h-3 w-3 ml-1" />
                          موصى به
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">رقم العرض:</span>
                        <span className="font-medium">{qtn.quotation_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الإجمالي:</span>
                        <span className="font-bold font-mono">{formattedAmount(qtn.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">مدة التوريد:</span>
                        <span className="font-mono">{qtn.delivery_time_days} يوم</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">التقييم:</span>
                        <span className={`font-mono ${qtn.evaluation_score >= 90 ? 'text-green-600' : qtn.evaluation_score >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                          <Star className="h-3 w-3 inline ml-1 fill-amber-400 text-amber-400" />
                          {qtn.evaluation_score}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">شروط الدفع:</span>
                        <span className="text-xs max-w-[140px] text-left">{qtn.payment_terms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الضمان:</span>
                        <span className="text-xs">{qtn.warranty_terms}</span>
                      </div>
                      <div className="pt-2">
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleCreatePO(qtn.id)}
                        >
                          <ShoppingCart className="h-4 w-4 ml-2" />
                          تحويل لأمر شراء
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Side-by-side item comparison table */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">مقارنة تفصيلية للبنود</h3>
              <div className="overflow-auto">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead>البند</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الكمية</TableHead>
                      {rfqQuotations.map((qtn: any) => (
                        <TableHead key={qtn.id} className="text-center">
                          {vendorNames[qtn.id] || qtn.quotation_number}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allItemNames.map((itemName, idx) => {
                      // Find a sample to get quantity/unit from first quotation
                      const sampleItem = rfqQuotations
                        .map((q: any) => (quotationItemsMap[q.id] || []).find((it: any) => it.itemName === itemName))
                        .find(Boolean);

                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{itemName}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {sampleItem?.description || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {sampleItem?.quantity || '-'} {sampleItem?.unit || ''}
                          </TableCell>
                          {rfqQuotations.map((qtn: any) => {
                            const item = (quotationItemsMap[qtn.id] || []).find(
                              (it: any) => it.itemName === itemName
                            );
                            return (
                              <TableCell key={qtn.id} className="text-center font-mono">
                                {item ? formattedAmount(item.unitPrice) : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                    {/* Totals row */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3} className="text-right">
                        الإجمالي
                      </TableCell>
                      {rfqQuotations.map((qtn: any) => (
                        <TableCell
                          key={qtn.id}
                          className={`text-center font-mono ${
                            qtn.total_amount === lowestTotal ? 'text-green-600' : ''
                          }`}
                        >
                          {formattedAmount(qtn.total_amount)}
                          {qtn.total_amount === lowestTotal && (
                            <Check className="h-3 w-3 inline mr-1 text-green-600" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recommendation summary */}
          {bestQuotation && (
            <Card className="mt-4 border-green-500 border-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ThumbsUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">التوصية</h4>
                    <p className="text-sm text-muted-foreground">
                      {vendorNames[bestQuotation.id] || bestQuotation.quotation_number} هو العرض الموصى به
                      (التقييم: {bestQuotation.evaluation_score}/100، مدة التوريد: {bestQuotation.delivery_time_days} يوم)
                    </p>
                  </div>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 text-base"
                    onClick={() => handleCreatePO(bestQuotation.id)}
                  >
                    <ShoppingCart className="h-5 w-5 ml-2" />
                    تحويل العرض الموصى به لأمر شراء
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
