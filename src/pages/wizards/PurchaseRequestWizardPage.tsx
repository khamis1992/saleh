import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Trash2, Sparkles, Check } from 'lucide-react';
import { StepperForm, type WizardStep } from '@/components/shared/StepperForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatQARInt } from '@/lib/format';
import { toast } from 'sonner';
import { logAudit } from '@/utils/exportUtils';
import { cn } from '@/utils/cn';

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

interface LineItem {
  id: string;
  item_id: string;
  item_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

const PRIORITIES = [
  { value: 'low', label: 'منخفض' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'مهم' },
  { value: 'urgent', label: 'عاجل' },
];

export default function PurchaseRequestWizardPage() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState('');
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [neededBy, setNeededBy] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');

  const vendors = safeAll<any>('erp_vendors');
  const projects = safeAll<any>('erp_projects');
  const invItems = safeAll<any>('erp_inventory');

  const total = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unit_price, 0), [items]);

  const steps: WizardStep[] = [
    {
      key: 'header', title: 'بيانات الطلب', description: 'المورد، المشروع، الأولوية',
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>المورد *</Label>
              <Select value={vendor} onValueChange={setVendor}>
                <SelectTrigger><SelectValue placeholder="اختر مورد" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name || v.vendor_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المشروع</Label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger><SelectValue placeholder="اختر مشروع (اختياري)" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>الأولوية</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>التاريخ المطلوب</Label>
              <Input type="date" value={neededBy} onChange={e => setNeededBy(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>وصف الطلب</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="غرض الطلب والتفاصيل الإضافية..." rows={3} />
          </div>
        </div>
      ),
      validate: () => vendor ? true : 'اختر مورد',
    },
    {
      key: 'items', title: 'بنود الطلب',
      render: () => {
        function addItem() {
          setItems(prev => [...prev, {
            id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            item_id: '', item_name: '', unit: '', quantity: 1, unit_price: 0,
          }]);
        }
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">أضف البنود التي تريد طلبها</p>
              <Button onClick={addItem} size="sm" className="gap-1 bg-[#3B82F6] hover:bg-blue-600 text-white h-8">
                <Plus className="h-3.5 w-3.5" /> بند
              </Button>
            </div>
            {items.length === 0 ? (
              <div className="p-8 rounded-lg border-2 border-dashed border-gray-200 text-center text-sm text-muted-foreground">
                لا توجد بنود. أضف أول بند للطلب.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((li, idx) => (
                  <div key={li.id} className="p-3 rounded-lg border border-gray-200 grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label className="text-[10px]">الصنف</Label>
                      <Select value={li.item_id} onValueChange={(v) => {
                        const it = invItems.find((i: any) => i.id === v);
                        setItems(prev => prev.map(x => x.id === li.id ? { ...x, item_id: v, item_name: it?.name_ar || '', unit: it?.unit_of_measure || '', unit_price: it?.average_cost || 0 } : x));
                      }}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="اختر صنف" /></SelectTrigger>
                        <SelectContent>
                          {invItems.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.name_ar} ({i.item_code})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px]">الكمية</Label>
                      <Input type="number" min={1} value={li.quantity} onChange={e => setItems(prev => prev.map(x => x.id === li.id ? { ...x, quantity: Number(e.target.value) || 0 } : x))} className="h-9" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px]">سعر الوحدة</Label>
                      <Input type="number" min={0} value={li.unit_price} onChange={e => setItems(prev => prev.map(x => x.id === li.id ? { ...x, unit_price: Number(e.target.value) || 0 } : x))} className="h-9" />
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="text-[10px] text-muted-foreground">الإجمالي</p>
                      <p className="font-bold text-sm">{formatQARInt(li.quantity * li.unit_price)}</p>
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="icon" onClick={() => setItems(prev => prev.filter(x => x.id !== li.id))} className="h-9 w-9 text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="font-semibold">إجمالي الطلب:</span>
              <span className="text-xl font-bold text-emerald-700">{formatQARInt(total)} ر.ق</span>
            </div>
          </div>
        );
      },
      validate: () => items.length > 0 ? true : 'أضف بنداً واحداً على الأقل',
    },
    {
      key: 'notes', title: 'ملاحظات وشروط',
      render: () => (
        <div>
          <Label>ملاحظات إضافية</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="شروط الدفع، موقع التوصيل، أي تعليمات خاصة..." rows={5} />
        </div>
      ),
    },
    {
      key: 'review', title: 'مراجعة وإرسال',
      render: () => {
        const v = vendors.find((vv: any) => vv.id === vendor);
        return (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">المورد:</span> <span className="font-semibold">{v?.name || v?.vendor_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الأولوية:</span> <span>{PRIORITIES.find(p => p.value === priority)?.label}</span></div>
              {neededBy && <div className="flex justify-between"><span className="text-muted-foreground">التاريخ المطلوب:</span> <span>{neededBy}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">عدد البنود:</span> <span>{items.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الإجمالي:</span> <span className="font-bold text-emerald-700">{formatQARInt(total)} ر.ق</span></div>
              {description && <div className="text-xs text-muted-foreground pt-2 border-t">{description}</div>}
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
              <div className="text-xs text-emerald-800">
                <p>عند الإرسال سيتم إنشاء طلب الشراء بحالة "بانتظار الموافقة" وإضافته لقائمة الموافقات.</p>
              </div>
            </div>
          </div>
        );
      },
    },
  ];

  const handleComplete = () => {
    try {
      const yearCode = new Date().getFullYear();
      const existing = safeAll<any>('erp_purchase_requests');
      const count = existing.length + 1;
      const prNumber = `PR-${yearCode}-${String(count).padStart(3, '0')}`;

      const newPR = {
        id: `pr-${Date.now()}`,
        request_number: prNumber,
        vendor_id: vendor,
        vendor_name: vendors.find((v: any) => v.id === vendor)?.name || '',
        project_id: project || '',
        priority, needed_by: neededBy, description, notes,
        status: 'pending_approval',
        line_items: items.map(i => ({
          inventory_item_id: i.item_id, item_name: i.item_name, unit: i.unit,
          quantity: i.quantity, unit_price: i.unit_price, total: i.quantity * i.unit_price,
        })),
        total_amount: total,
        created_at: new Date().toISOString(),
        requested_by: '',
      };
      const updated = [...existing, newPR];
      localStorage.setItem('erp_purchase_requests', JSON.stringify(updated));
      logAudit('create', 'purchase_requests', newPR.id, '', `${formatQARInt(total)} ر.ق`);

      toast.success(`تم إنشاء طلب الشراء ${prNumber}`);
      navigate('/procurement/purchase-requests');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ');
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <ShoppingCart className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold">معالج طلب الشراء</h1>
          <p className="text-xs text-muted-foreground">4 خطوات لإنشاء طلب شراء جديد</p>
        </div>
      </div>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={() => navigate('/procurement/purchase-requests')}
        completeLabel="إرسال للموافقة"
      />
    </div>
  );
}
