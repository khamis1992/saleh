// Portal Selector — landing page for /portal
// Shows 3 portal options: Tenant, Landlord, Vendor
// Each card explains the portal and links to its login

import { Link } from 'react-router-dom';
import { Building2, User, Briefcase, ArrowLeft, CheckCircle2, ShieldCheck, Globe, Clock, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/providers/LocaleContext';

const PORTALS = [
  {
    key: 'tenant',
    title: 'بوابة المستأجر',
    subtitle: 'Tenant Portal',
    description: 'استعرض عقدك، ادفع الإيجار، تابع الفواتير، قدّم طلبات الصيانة، ووقّع الفحوصات.',
    features: ['عقد الإيجار', 'الفواتير والمدفوعات', 'طلبات الصيانة', 'المستندات والفحوصات'],
    icon: User,
    color: 'blue',
    accentBg: 'bg-[rgba(83,58,253,0.06)]',
    accentText: 'text-[#533afd]',
    accentBorder: 'border-blue-200',
    accentBtn: 'bg-[#533afd] hover:bg-blue-700',
    to: '/portal/tenant/login',
  },
  {
    key: 'landlord',
    title: 'بوابة المالك',
    subtitle: 'Landlord Portal',
    description: 'تابع أداء محفظتك العقارية، إيرادات العقارات، المستأجرين، وتجديد العقود.',
    features: ['نظرة عامة على المحفظة', 'أداء العقارات (NOI/ROI)', 'دليل المستأجرين', 'خط أنابيب التجديد'],
    icon: Building2,
    color: 'emerald',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
    accentBorder: 'border-emerald-200',
    accentBtn: 'bg-emerald-600 hover:bg-emerald-700',
    to: '/portal/landlord/login',
  },
  {
    key: 'vendor',
    title: 'بوابة المقاول',
    subtitle: 'Vendor Portal',
    description: 'استعرض عقودك، قدّم عروض الأسعار، تابع مطالبات الدفع، وارفع الوثائق النظامية.',
    features: [t.contractors.activeContracts || tt('contractors.activeContracts','العقود النشطة'), 'تسعير ومطالبات', 'حالة المدفوعات', 'الوثائق النظامية'],
    icon: Briefcase,
    color: 'amber',
    accentBg: 'bg-amber-50',
    accentText: 'text-[#9b6829]',
    accentBorder: 'border-amber-200',
    accentBtn: 'bg-amber-600 hover:bg-amber-700',
    to: '/portal/vendor/login',
  },
];

export default function PortalSelectorPage() {
  const { t, dir } = useLocale();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30" dir={dir}>
      {/* Top bar */}
      <header className="px-4 lg:px-8 h-16 border-b border-[#e5edf5] bg-white/90 backdrop-blur flex items-center justify-between">
        <Link to="/login" className="flex items-center gap-2 text-sm text-[#64748d] hover:text-[#061b31]">
          <Building2 className="h-5 w-5 text-[#533afd]" />
          <span className="font-bold text-[#061b31]">Land2 ERP</span>
        </Link>
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-[#64748d]">
            <ArrowLeft className="h-4 w-4 ml-1" />
            دخول الإدارة
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="px-4 lg:px-8 py-12 lg:py-20 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(83,58,253,0.06)] border border-blue-200 text-[12px] font-medium text-[#533afd] mb-4">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>بوابات خارجية آمنة</span>
        </div>
        <h1 className="text-3xl lg:text-5xl font-bold text-[#061b31] mb-4 leading-tight">
          مرحباً بك في بوابات Land2
        </h1>
        <p className="text-base lg:text-lg text-[#64748d] max-w-2xl mx-auto mb-10">
          اختر البوابة المناسبة لاحتياجاتك. كل بوابة مصممة لتوفر لك تجربة مخصصة وسهلة الاستخدام.
        </p>

        {/* Portal cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mt-8">
          {PORTALS.map((p) => {
            const Icon = p.icon;
            return (
              <Card
                key={p.key}
                className={`group hover:shadow-xl transition-all duration-300 border-2 ${p.accentBorder} hover:border-opacity-100 overflow-hidden text-right`}
              >
                <CardHeader className="pb-3">
                  <div className={`h-12 w-12 rounded-lg ${p.accentBg} ${p.accentText} flex items-center justify-center mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-bold text-[#061b31]">{p.title}</CardTitle>
                  <CardDescription className="text-[12px] text-[#64748d]">{p.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[13px] text-[#64748d] leading-relaxed min-h-[60px]">
                    {p.description}
                  </p>
                  <ul className="space-y-1.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-[12px] text-gray-700">
                        <CheckCircle2 className={`h-3.5 w-3.5 ${p.accentText} flex-shrink-0`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={p.to} className="block">
                    <Button className={`w-full h-10 text-[13px] font-semibold text-white ${p.accentBtn} shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]`}>
                      <Lock className="h-3.5 w-3.5 ml-2" />
                      دخول البوابة
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Trust bar */}
      <section className="px-4 lg:px-8 py-10 border-t border-[#e5edf5] bg-white/50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="inline-flex h-10 w-10 rounded-full bg-[rgba(83,58,253,0.06)] items-center justify-center text-[#533afd] mb-2">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-[13px] font-semibold text-[#061b31]">تشفير من طرف إلى طرف</p>
            <p className="text-[12px] text-[#64748d] mt-1">جميع البيانات محمية</p>
          </div>
          <div>
            <div className="inline-flex h-10 w-10 rounded-full bg-emerald-50 items-center justify-center text-emerald-600 mb-2">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-[13px] font-semibold text-[#061b31]">متاحة 24/7</p>
            <p className="text-[12px] text-[#64748d] mt-1">وصول في أي وقت</p>
          </div>
          <div>
            <div className="inline-flex h-10 w-10 rounded-full bg-amber-50 items-center justify-center text-[#9b6829] mb-2">
              <Globe className="h-5 w-5" />
            </div>
            <p className="text-[13px] font-semibold text-[#061b31]">عربي / English</p>
            <p className="text-[12px] text-[#64748d] mt-1">دعم ثنائي اللغة</p>
          </div>
        </div>
      </section>
    </div>
  );
}
