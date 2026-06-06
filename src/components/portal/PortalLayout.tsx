// Portal Layout — top-nav, mobile-friendly, separate from admin
// Used by /portal/tenant, /portal/landlord, /portal/vendor
// Provides context for the active portal session + portal navigation

import React, { useState, createContext, useContext, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { usePortalAuth, type PortalType } from '@/providers/PortalAuthContext';
import { useLocale } from '@/providers/LocaleContext';
import { Building2, LogOut, Menu, X, Globe, Bell, ChevronDown, Home, User, MessageCircle, Phone, Mail, MapPin, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface PortalNavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const TENANT_NAV: PortalNavItem[] = [
  { to: '/portal/tenant', label: 'لوحة المعلومات', icon: <Home className="h-4 w-4" /> },
  { to: '/portal/tenant/lease', label: 'عقد الإيجار', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/tenant/invoices', label: t.rentCollection.invoices || tt('rentCollection.invoices','الفواتير'), icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/tenant/pay', label: 'دفع الإيجار', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/tenant/payments', label: 'سجل المدفوعات', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/tenant/maintenance', label: 'طلبات الصيانة', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/tenant/documents', label: t.documents.title || tt('documents.title','المستندات'), icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/tenant/inspections', label: 'الفحوصات', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/tenant/profile', label: 'الملف الشخصي', icon: <User className="h-4 w-4" /> },
  { to: '/portal/tenant/notices', label: 'الإشعارات', icon: <Bell className="h-4 w-4" /> },
];

const LANDLORD_NAV: PortalNavItem[] = [
  { to: '/portal/landlord', label: 'نظرة عامة', icon: <Home className="h-4 w-4" /> },
  { to: '/portal/landlord/performance', label: 'أداء العقارات', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/landlord/tenants', label: 'دليل المستأجرين', icon: <User className="h-4 w-4" /> },
  { to: '/portal/landlord/renewals', label: 'التجديدات', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/landlord/maintenance', label: 'تكلفة الصيانة', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/landlord/financials', label: 'التقارير المالية', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/landlord/documents', label: 'الأرشيف', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/landlord/messages', label: 'الرسائل', icon: <MessageCircle className="h-4 w-4" /> },
];

const VENDOR_NAV: PortalNavItem[] = [
  { to: '/portal/vendor', label: 'لوحة المعلومات', icon: <Home className="h-4 w-4" /> },
  { to: '/portal/vendor/contracts', label: t.contractors.activeContracts || tt('contractors.activeContracts','العقود النشطة'), icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/vendor/quotations', label: 'تسعير جديد', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/vendor/claims', label: 'مطالبات الدفع', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/vendor/payments', label: 'حالة المدفوعات', icon: <FileText className="h-4 w-4" /> },
  { to: '/portal/vendor/compliance', label: 'الوثائق النظامية', icon: <FileText className="h-4 w-4" /> },
];

const PORTAL_INFO: Record<PortalType, { title: string; subtitle: string; accent: string; ringColor: string }> = {
  tenant: { title: 'بوابة المستأجر', subtitle: 'Tenant Portal', accent: 'bg-[#533afd]', ringColor: 'ring-blue-100' },
  landlord: { title: 'بوابة المالك', subtitle: 'Landlord Portal', accent: 'bg-emerald-600', ringColor: 'ring-emerald-100' },
  vendor: { title: 'بوابة المقاول', subtitle: 'Vendor Portal', accent: 'bg-amber-600', ringColor: 'ring-amber-100' },
};

function getNavFor(portalType: PortalType): PortalNavItem[] {
  if (portalType === 'tenant') return TENANT_NAV;
  if (portalType === 'landlord') return LANDLORD_NAV;
  return VENDOR_NAV;
}

interface PortalLayoutProps {
  portalType: PortalType;
  children?: React.ReactNode;
}

export function PortalLayout({ portalType }: PortalLayoutProps) {
  const { session, signOut } = usePortalAuth();
  const { t, dir, locale, setLocale } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If no session, redirect to login
  useEffect(() => {
    if (!session) {
      navigate(`/portal/${portalType}/login`, { replace: true });
    } else if (session.portalType !== portalType) {
      // Session exists but for a different portal — sign out and redirect
      signOut();
      navigate(`/portal/${portalType}/login`, { replace: true });
    }
  }, [session, portalType, navigate, signOut]);

  if (!session || session.portalType !== portalType) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f6f9fc]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const info = PORTAL_INFO[portalType];
  const nav = getNavFor(portalType);

  const handleSignOut = () => {
    signOut();
    navigate('/portal');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" dir={dir}>
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#e5edf5] shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <div className="px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Right: Logo + portal title + mobile menu */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-[#f6f9fc]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="القائمة"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]', info.accent)}>
              <Building2 className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-[#061b31] leading-tight">{info.title}</p>
              <p className="text-[12px] text-[#64748d] leading-tight">{info.subtitle}</p>
            </div>
          </div>

          {/* Center: portal nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto max-w-3xl">
            {nav.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== `/portal/${portalType}` && location.pathname.startsWith(item.to));
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-[#64748d] hover:bg-[#f6f9fc] hover:text-[#061b31]',
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Left: actions + profile */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              className="hidden sm:flex items-center gap-1 px-2 h-9 rounded-lg text-[12px] font-medium text-[#64748d] hover:bg-[#f6f9fc]"
              title="تبديل اللغة"
            >
              <Globe className="h-3.5 w-3.5" />
              {locale === 'ar' ? 'EN' : 'AR'}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-1.5 h-9 rounded-lg hover:bg-[#f6f9fc]">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={cn('text-white text-[12px] font-bold', info.accent)}>
                      {session.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-right">
                    <p className="text-[12px] font-semibold text-[#061b31] leading-tight">{session.displayName}</p>
                    <p className="text-[12px] text-[#64748d] leading-tight">{session.email}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-[#64748d]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate(`/portal/${portalType}/profile`)}>
                  <User className="h-4 w-4 ml-2" />
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/portal')}>
                  <Home className="h-4 w-4 ml-2" />
                  بوابات أخرى
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-[#ea2261]">
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#e5edf5] bg-white">
            <nav className="px-2 py-2 max-h-[70vh] overflow-y-auto">
              {nav.map((item) => {
                const isActive = location.pathname === item.to || (item.to !== `/portal/${portalType}` && location.pathname.startsWith(item.to));
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 h-10 rounded-lg text-[13px] font-medium',
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-[#f6f9fc]',
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
              <div className="border-t border-[#e5edf5] my-2" />
              <button
                onClick={() => { setLocale(locale === 'ar' ? 'en' : 'ar'); setMobileOpen(false); }}
                className="w-full flex items-center gap-2 px-3 h-10 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-[#f6f9fc]"
              >
                <Globe className="h-4 w-4" />
                {locale === 'ar' ? 'English' : 'العربية'}
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 h-10 rounded-lg text-[13px] font-medium text-[#ea2261] hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="px-4 lg:px-8 py-6 border-t border-[#e5edf5] bg-white/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#64748d]">
          <div className="flex items-center gap-3">
            <span>© 2026 Land2 ERP — {info.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+97444445555" className="flex items-center gap-1 hover:text-gray-700">
              <Phone className="h-3 w-3" /> +974 4444 5555
            </a>
            <a href="mailto:support@land2.qa" className="flex items-center gap-1 hover:text-gray-700">
              <Mail className="h-3 w-3" /> support@land2.qa
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
