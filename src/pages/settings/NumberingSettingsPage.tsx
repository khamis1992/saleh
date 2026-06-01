import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RefreshCw, Eye, Globe, Briefcase, FileText, ClipboardList, ShoppingCart, Building, Home, FileSignature, Receipt, ReceiptText, Hammer, Info, Link2, Calendar, Hash, ChevronUp } from 'lucide-react';

interface NumberingFormat {
  prefix: string;
  use_year: boolean;
  separator: string;
  starting_number: number;
  digits: number;
}

interface NumberingConfig {
  land_code: NumberingFormat;
  project_code: NumberingFormat;
  contract_number: NumberingFormat;
  pr_number: NumberingFormat;
  po_number: NumberingFormat;
  property_code: NumberingFormat;
  unit_code: NumberingFormat;
  lease_contract_number: NumberingFormat;
  invoice_number: NumberingFormat;
  receipt_number: NumberingFormat;
  work_order_number: NumberingFormat;
}

const STORAGE_KEY = 'erp_numbering_settings';

const defaultConfig: NumberingConfig = {
  land_code: { prefix: 'LAND', use_year: true, separator: '-', starting_number: 1, digits: 3 },
  project_code: { prefix: 'PRJ', use_year: true, separator: '-', starting_number: 1, digits: 3 },
  contract_number: { prefix: 'CTR', use_year: true, separator: '-', starting_number: 1, digits: 3 },
  pr_number: { prefix: 'PR', use_year: true, separator: '-', starting_number: 1, digits: 3 },
  po_number: { prefix: 'PO', use_year: true, separator: '-', starting_number: 1, digits: 3 },
  property_code: { prefix: 'PROP', use_year: false, separator: '-', starting_number: 1, digits: 3 },
  unit_code: { prefix: 'UNT', use_year: false, separator: '-', starting_number: 1, digits: 3 },
  lease_contract_number: { prefix: 'LSE', use_year: true, separator: '-', starting_number: 1, digits: 3 },
  invoice_number: { prefix: 'INV', use_year: true, separator: '-', starting_number: 1, digits: 4 },
  receipt_number: { prefix: 'RCP', use_year: true, separator: '-', starting_number: 1, digits: 4 },
  work_order_number: { prefix: 'WO', use_year: true, separator: '-', starting_number: 1, digits: 3 },
};

const configMeta: Record<string, {
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  colors: { bg: string; iconColor: string; previewBg: string; previewText: string; previewBorder: string };
}> = {
  land_code: {
    label: 'رمز الأرض',
    subtitle: 'إعدادات الترقيم لسجلات الأراضي',
    icon: <Globe className="h-5 w-5" />,
    colors: { bg: 'bg-blue-50', iconColor: 'text-blue-600', previewBg: 'bg-blue-50/60', previewText: 'text-blue-700', previewBorder: 'border-blue-100' },
  },
  project_code: {
    label: 'رمز المشروع',
    subtitle: 'إعدادات الترقيم لسجلات المشاريع',
    icon: <Briefcase className="h-5 w-5" />,
    colors: { bg: 'bg-emerald-50', iconColor: 'text-emerald-600', previewBg: 'bg-emerald-50/60', previewText: 'text-emerald-700', previewBorder: 'border-emerald-100' },
  },
  contract_number: {
    label: 'رقم العقد',
    subtitle: 'إعدادات الترقيم لسجلات العقود',
    icon: <FileSignature className="h-5 w-5" />,
    colors: { bg: 'bg-violet-50', iconColor: 'text-violet-600', previewBg: 'bg-violet-50/60', previewText: 'text-violet-700', previewBorder: 'border-violet-100' },
  },
  pr_number: {
    label: 'رقم طلب الشراء',
    subtitle: 'إعدادات الترقيم لطلبات الشراء',
    icon: <ClipboardList className="h-5 w-5" />,
    colors: { bg: 'bg-amber-50', iconColor: 'text-amber-600', previewBg: 'bg-amber-50/60', previewText: 'text-amber-700', previewBorder: 'border-amber-100' },
  },
  po_number: {
    label: 'رقم أمر الشراء',
    subtitle: 'إعدادات الترقيم لأوامر الشراء',
    icon: <ShoppingCart className="h-5 w-5" />,
    colors: { bg: 'bg-cyan-50', iconColor: 'text-cyan-600', previewBg: 'bg-cyan-50/60', previewText: 'text-cyan-700', previewBorder: 'border-cyan-100' },
  },
  property_code: {
    label: 'رمز العقار',
    subtitle: 'إعدادات الترقيم لسجلات العقارات',
    icon: <Building className="h-5 w-5" />,
    colors: { bg: 'bg-rose-50', iconColor: 'text-rose-600', previewBg: 'bg-rose-50/60', previewText: 'text-rose-700', previewBorder: 'border-rose-100' },
  },
  unit_code: {
    label: 'رمز الوحدة',
    subtitle: 'إعدادات الترقيم للوحدات العقارية',
    icon: <Home className="h-5 w-5" />,
    colors: { bg: 'bg-indigo-50', iconColor: 'text-indigo-600', previewBg: 'bg-indigo-50/60', previewText: 'text-indigo-700', previewBorder: 'border-indigo-100' },
  },
  lease_contract_number: {
    label: 'رقم عقد الإيجار',
    subtitle: 'إعدادات الترقيم لعقود الإيجار',
    icon: <FileText className="h-5 w-5" />,
    colors: { bg: 'bg-teal-50', iconColor: 'text-teal-600', previewBg: 'bg-teal-50/60', previewText: 'text-teal-700', previewBorder: 'border-teal-100' },
  },
  invoice_number: {
    label: 'رقم الفاتورة',
    subtitle: 'إعدادات الترقيم للفواتير',
    icon: <Receipt className="h-5 w-5" />,
    colors: { bg: 'bg-orange-50', iconColor: 'text-orange-600', previewBg: 'bg-orange-50/60', previewText: 'text-orange-700', previewBorder: 'border-orange-100' },
  },
  receipt_number: {
    label: 'رقم سند القبض',
    subtitle: 'إعدادات الترقيم لسندات القبض',
    icon: <ReceiptText className="h-5 w-5" />,
    colors: { bg: 'bg-pink-50', iconColor: 'text-pink-600', previewBg: 'bg-pink-50/60', previewText: 'text-pink-700', previewBorder: 'border-pink-100' },
  },
  work_order_number: {
    label: 'رقم أمر العمل',
    subtitle: 'إعدادات الترقيم لأوامر العمل',
    icon: <Hammer className="h-5 w-5" />,
    colors: { bg: 'bg-fuchsia-50', iconColor: 'text-fuchsia-600', previewBg: 'bg-fuchsia-50/60', previewText: 'text-fuchsia-700', previewBorder: 'border-fuchsia-100' },
  },
};

function loadConfig(): NumberingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultConfig };
}

function buildPreview(fmt: NumberingFormat): string {
  const parts: string[] = [];
  if (fmt.prefix) parts.push(fmt.prefix);
  if (fmt.use_year) parts.push(String(new Date().getFullYear()));
  parts.push(String(fmt.starting_number).padStart(fmt.digits, '0'));
  return parts.join(fmt.separator);
}

// ============================================================
// SECTION COMPONENT
// ============================================================
function NumberingSection({
  configKey, fmt, onChange,
}: {
  configKey: string;
  fmt: NumberingFormat;
  onChange: (next: NumberingFormat) => void;
}) {
  const meta = configMeta[configKey];
  const [collapsed, setCollapsed] = useState(false);
  const preview = buildPreview(fmt);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Section Header */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 p-5 hover:bg-gray-50/50 transition-colors"
      >
        <div className={`h-10 w-10 rounded-xl ${meta.colors.bg} flex items-center justify-center flex-shrink-0`}>
          <div className={meta.colors.iconColor}>{meta.icon}</div>
        </div>
        <div className="flex-1 text-right">
          <h2 className="text-[15px] font-bold text-[#1E293B] leading-tight">{meta.label}</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">{meta.subtitle}</p>
        </div>
        <ChevronUp className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Section Body */}
      {!collapsed && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Form fields (4 cols on large) */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Field 1: البداية (Separator) */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-700 flex items-center gap-1.5">
                  <Info className="h-3 w-3 text-gray-400" />
                  البداية
                </label>
                <Select value={fmt.separator || 'none'} onValueChange={v => onChange({ ...fmt, separator: v === 'none' ? '' : v })}>
                  <SelectTrigger className="h-9 text-[13px] rounded-lg border-gray-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">شرطة (-)</SelectItem>
                    <SelectItem value="/">مائلة (/)</SelectItem>
                    <SelectItem value="_">سفلية (_)</SelectItem>
                    <SelectItem value=".">نقطة (.)</SelectItem>
                    <SelectItem value="none">بدون فاصل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Field 2: الفاصل (Use year yes/no) */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-700 flex items-center gap-1.5">
                  <Link2 className="h-3 w-3 text-gray-400" />
                  الفاصل
                </label>
                <Select value={fmt.use_year ? 'yes' : 'no'} onValueChange={v => onChange({ ...fmt, use_year: v === 'yes' })}>
                  <SelectTrigger className="h-9 text-[13px] rounded-lg border-gray-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">نعم</SelectItem>
                    <SelectItem value="no">لا</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Field 3: السنة (Prefix) */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-700 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  السنة
                </label>
                <Input
                  value={fmt.prefix}
                  onChange={e => onChange({ ...fmt, prefix: e.target.value.toUpperCase() })}
                  placeholder="مثال: LAND"
                  className="h-9 text-[13px] rounded-lg border-gray-200 bg-white font-mono"
                  dir="ltr"
                />
              </div>

              {/* Field 4: عدد الأرقام */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-700 flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-gray-400" />
                  عدد الأرقام
                </label>
                <Select value={String(fmt.digits)} onValueChange={v => onChange({ ...fmt, digits: Number(v) })}>
                  <SelectTrigger className="h-9 text-[13px] rounded-lg border-gray-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview box (2 cols on large) */}
            <div className={`lg:col-span-2 rounded-xl border ${meta.colors.previewBorder} ${meta.colors.previewBg} p-4 flex flex-col gap-2 justify-center`}>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
                <Eye className="h-3.5 w-3.5" />
                معاينة التنسيق
              </div>
              <p className={`text-[22px] font-extrabold ${meta.colors.previewText} font-mono tracking-wide`} dir="ltr">
                {preview}
              </p>
              <p className="text-[11px] text-gray-500">
                {fmt.use_year ? 'بادئة - سنة - رقم تسلسلي' : 'بادئة - رقم تسلسلي'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE COMPONENT
// ============================================================
export default function NumberingSettingsPage() {
  const { t } = useLocale();
  const [config, setConfig] = useState<NumberingConfig>(loadConfig);
  const [saved, setSaved] = useState(false);

  function updateFormat(key: string, next: NumberingFormat) {
    setConfig(c => ({ ...c, [key]: next }));
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setConfig({ ...defaultConfig });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Hash className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#1E293B] leading-tight">إعدادات الترقيم</h1>
            <p className="text-[12px] text-gray-500 mt-1">تخصيص وتنسيق أرقام جميع السجلات في النظام وفقاً لاحتياجات عملك</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 h-10 border-gray-200 text-gray-600 hover:text-gray-800 text-[13px] rounded-lg px-4"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة الضبط
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-[13px] h-10 rounded-lg px-4 shadow-sm shadow-blue-200"
          >
            <Save className="h-4 w-4" />
            {saved ? 'تم الحفظ ✓' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </div>

      {/* ── SECTIONS ────────────────────────────────────────────── */}
      <div className="space-y-4">
        {Object.keys(config).map((key) => {
          const fmt = (config as any)[key] as NumberingFormat;
          return (
            <NumberingSection
              key={key}
              configKey={key}
              fmt={fmt}
              onChange={(next) => updateFormat(key, next)}
            />
          );
        })}
      </div>
    </div>
  );
}
