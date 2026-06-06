import { useState, useEffect } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/cn';
import {
  Save, Building2, FileText, Settings, CheckCircle2, Clock, Users,
  Shield, ShoppingCart, FileSignature, Wrench, Calculator, Scale,
  Receipt, Banknote, ChevronLeft,
} from 'lucide-react';
import { companyStore } from '@/services/stores';

// ── Approval flow config types ──
interface ApprovalFlow {
  id: string;
  module: string;
  label: string;
  icon: React.ElementType;
  levels: number;
  autoApprove: boolean;
  notifyOnSubmit: boolean;
  managers: string[];
}

// ── Main Component ──
export default function SettingsPage() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);

  // Company form state
  const [companyName, setCompanyName] = useState('شركة التطوير العقاري');
  const [companyNameEn, setCompanyNameEn] = useState('Real Estate Development Co.');
  const [crNumber, setCrNumber] = useState('1010123456');
  const [taxNumber, setTaxNumber] = useState('300123456789003');
  const [address, setAddress] = useState('الرياض - حي المروج - طريق الملك فهد');
  const [phone, setPhone] = useState('+966 11 234 5678');
  const [email, setEmail] = useState('info@realestate.sa');
  const [currency, setCurrency] = useState('QAR');
  const [fiscalMonth, setFiscalMonth] = useState('1');

  // Load company data from store on mount
  useEffect(() => {
    const company = companyStore.getAll()[0];
    if (company) {
      setCompanyName(company.name_ar);
      setCompanyNameEn(company.name_en);
      setCrNumber(company.cr_number);
      setTaxNumber(company.tax_number);
      setAddress(company.address);
      setPhone(company.phone);
      setEmail(company.email);
      setCurrency(company.currency);
      setFiscalMonth(String(company.fiscal_year_start_month));
    }
  }, []);

  // Numbering state
  const [numberingFormats, setNumberingFormats] = useState<Record<string, string>>({
    projects: 'PRJ-{year}-{counter}',
    lands: 'LND-{year}-{counter}',
    properties: 'PRP-{year}-{counter}',
    units: 'UNT-{year}-{counter}',
    contractors: 'CON-{year}-{counter}',
    leases: 'LSE-{year}-{counter}',
    invoices: 'INV-{year}-{counter}',
    receipts: 'RCT-{year}-{counter}',
    purchaseOrders: 'PO-{year}-{counter}',
    maintenance: 'MNT-{year}-{counter}',
  });

  // Approval flows state
  const [approvalFlows, setApprovalFlows] = useState<ApprovalFlow[]>([
    { id: 'pr', module: 'purchase_requests', label: 'طلبات الشراء', icon: ShoppingCart, levels: 2, autoApprove: false, notifyOnSubmit: true, managers: ['مدير المشتريات', 'المدير المالي'] },
    { id: 'po', module: 'purchase_orders', label: 'أوامر الشراء', icon: FileText, levels: 3, autoApprove: false, notifyOnSubmit: true, managers: ['مدير المشتريات', 'المدير المالي', 'المدير العام'] },
    { id: 'claims', module: 'contractor_claims', label: 'مطالبات المقاولين', icon: FileSignature, levels: 3, autoApprove: false, notifyOnSubmit: true, managers: ['مهندس الموقع', 'مدير المشروع', 'المدير المالي'] },
    { id: 'payments', module: 'contractor_payments', label: 'مدفوعات المقاولين', icon: Banknote, levels: 2, autoApprove: false, notifyOnSubmit: false, managers: ['المدير المالي', 'المدير العام'] },
    { id: 'leases', module: 'lease_contracts', label: 'عقود الإيجار', icon: FileSignature, levels: 2, autoApprove: false, notifyOnSubmit: true, managers: ['مدير التأجير', 'المدير العام'] },
    { id: 'discounts', module: 'discounts', label: 'الخصومات', icon: Receipt, levels: 2, autoApprove: true, notifyOnSubmit: false, managers: ['مدير التأجير'] },
    { id: 'maintenance', module: 'maintenance_expenses', label: 'مصروفات الصيانة', icon: Wrench, levels: 2, autoApprove: false, notifyOnSubmit: true, managers: ['مدير الصيانة', 'المدير المالي'] },
    { id: 'journal', module: 'journal_entries', label: 'القيود المحاسبية', icon: Calculator, levels: 2, autoApprove: false, notifyOnSubmit: false, managers: ['المدير المالي', 'المدقق الداخلي'] },
    { id: 'legal', module: 'legal_notices', label: 'الإشعارات القانونية', icon: Scale, levels: 2, autoApprove: false, notifyOnSubmit: true, managers: ['المستشار القانوني', 'المدير العام'] },
  ]);

  const handleSave = () => {
    // Save company data to store
    companyStore.update('comp-1', {
      name_ar: companyName,
      name_en: companyNameEn,
      cr_number: crNumber,
      tax_number: taxNumber,
      address: address,
      phone: phone,
      email: email,
      currency: currency,
      fiscal_year_start_month: parseInt(fiscalMonth) || 1,
      updated_at: new Date().toISOString().split('T')[0],
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleFlow = (id: string, field: 'autoApprove' | 'notifyOnSubmit') => {
    setApprovalFlows(prev => prev.map(f => f.id === id ? { ...f, [field]: !f[field] } : f));
  };

  const changeLevels = (id: string, levels: number) => {
    setApprovalFlows(prev => prev.map(f => f.id === id ? { ...f, levels } : f));
  };

  const numberingLabels: Record<string, string> = {
    projects: 'المشاريع', lands: 'الأراضي', properties: 'العقارات',
    units: 'الوحدات', contractors: 'المقاولين', leases: 'عقود الإيجار',
    invoices: 'الفواتير', receipts: 'سندات القبض',
    purchaseOrders: 'أوامر الشراء', maintenance: 'الصيانة',
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الإعدادات</h1>
          <p className="text-xs text-gray-500 mt-0.5">إعدادات الشركة والترقيم وسير الموافقات</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4"
          >
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'تم الحفظ' : 'حفظ التغييرات'}
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
        {[
          { key: 'company', label: 'ملف الشركة', icon: Building2 },
          { key: 'numbering', label: 'إعدادات الترقيم', icon: FileText },
          { key: 'approvals', label: 'سير الموافقات', icon: Shield },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tabs Content ── */}
      <div className="space-y-6">

        {/* TAB 1: Company Profile */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">ملف الشركة</h2>
                  <p className="text-xs text-gray-400 mt-0.5">المعلومات الأساسية للشركة</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">اسم الشركة (عربي)</Label>
                  <Input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">اسم الشركة (إنجليزي)</Label>
                  <Input
                    value={companyNameEn}
                    onChange={e => setCompanyNameEn(e.target.value)}
                    className="h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">السجل التجاري</Label>
                  <Input
                    value={crNumber}
                    onChange={e => setCrNumber(e.target.value)}
                    className="h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">الرقم الضريبي</Label>
                  <Input
                    value={taxNumber}
                    onChange={e => setTaxNumber(e.target.value)}
                    className="h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">العنوان</Label>
                  <Input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">الهاتف</Label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">البريد الإلكتروني</Label>
                  <Input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">العملة الافتراضية</Label>
                  <Select value={currency} onValueChange={v => { setCurrency(v as string); }}>
                    <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QAR">ريال قطري (QAR)</SelectItem>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                      <SelectItem value="EUR">يورو (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">بداية السنة المالية</Label>
                  <Select value={fiscalMonth} onValueChange={v => { setFiscalMonth(v as string); }}>
                    <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">يناير</SelectItem>
                      <SelectItem value="4">أبريل</SelectItem>
                      <SelectItem value="7">يوليو</SelectItem>
                      <SelectItem value="10">أكتوبر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">الشعار والهوية</h2>
                  <p className="text-xs text-gray-400 mt-0.5">شعار الشركة والمظهر العام</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  ع
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg border-gray-200">
                    رفع شعار جديد
                  </Button>
                  <p className="text-[11px] text-gray-400">PNG, JPG — الحد الأقصى 2 ميجابايت</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Numbering Settings */}
        {activeTab === 'numbering' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">إعدادات الترقيم</h2>
                <p className="text-xs text-gray-400 mt-0.5">تخصيص صيغ الترقيم للمستندات والسجلات</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(numberingLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Label className="text-sm font-medium text-gray-600 w-28 shrink-0">{label}:</Label>
                  <div className="flex-1">
                    <Input
                      value={numberingFormats[key]}
                      onChange={e => setNumberingFormats(prev => ({ ...prev, [key]: e.target.value }))}
                      className="h-9 text-sm rounded-lg border-gray-200 font-mono ltr-only text-left"
                      style={{ fontFamily: "'Inter', system-ui, sans-serif", direction: 'ltr' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>المتغيرات المتاحة:</strong> {'{year}'} = السنة الحالية، {'{counter}'} = رقم تسلسلي تلقائي، {'{month}'} = الشهر
              </p>
              <p className="text-xs text-blue-600 mt-1">مثال: PRJ-{'{year}'}-{'{counter}'} ← PRJ-2026-0001</p>
            </div>
          </div>
        )}

        {/* TAB 3: Approval Settings */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">سير الموافقات</h2>
                  <p className="text-xs text-gray-400 mt-0.5">تكوين مستويات الاعتماد لكل نوع من المعاملات</p>
                </div>
              </div>
            </div>

            {approvalFlows.map(flow => (
              <div key={flow.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center">
                      <flow.icon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">{flow.label}</h3>
                      <p className="text-[11px] text-gray-400">
                        {flow.levels} {flow.levels === 1 ? 'مستوى' : flow.levels === 2 ? 'مستويان' : 'مستويات'} اعتماد
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(flow.levels)}
                      onValueChange={v => changeLevels(flow.id, parseInt(v))}
                    >
                      <SelectTrigger className="h-8 w-[110px] text-xs rounded-lg border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">مستوى واحد</SelectItem>
                        <SelectItem value="2">مستويان</SelectItem>
                        <SelectItem value="3">ثلاثة مستويات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Managers list */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {flow.managers.map((mgr, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
                    >
                      <Users className="h-3 w-3" />
                      {mgr}
                      {i === 0 && <span className="text-[9px] text-blue-400">(المستوى {i + 1})</span>}
                      {i > 0 && <span className="text-[9px] text-blue-400">(المستوى {i + 1})</span>}
                    </span>
                  ))}
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => toggleFlow(flow.id, 'autoApprove')}
                    className="flex items-center gap-2"
                  >
                    <div className={cn(
                      'h-5 w-9 rounded-full transition-colors duration-200',
                      flow.autoApprove ? 'bg-emerald-500' : 'bg-gray-200',
                    )}>
                      <div className={cn(
                        'h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-[2px]',
                        flow.autoApprove ? 'translate-x-[18px]' : 'translate-x-[2px]',
                      )} />
                    </div>
                    <span className="text-xs text-gray-500">موافقة تلقائية</span>
                  </button>
                  <button
                    onClick={() => toggleFlow(flow.id, 'notifyOnSubmit')}
                    className="flex items-center gap-2"
                  >
                    <div className={cn(
                      'h-5 w-9 rounded-full transition-colors duration-200',
                      flow.notifyOnSubmit ? 'bg-[#3B82F6]' : 'bg-gray-200',
                    )}>
                      <div className={cn(
                        'h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-[2px]',
                        flow.notifyOnSubmit ? 'translate-x-[18px]' : 'translate-x-[2px]',
                      )} />
                    </div>
                    <span className="text-xs text-gray-500">إشعار عند التقديم</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
