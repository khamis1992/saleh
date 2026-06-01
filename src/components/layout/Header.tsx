import { useNavigate } from 'react-router-dom';
import { Bell, Search, Moon, Sun, Globe, LogOut, BellDot, Check, Trash2, UserCog, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/providers/AuthContext';
import { useLocale } from '@/providers/LocaleContext';
import { useNotifications } from '@/providers/NotificationContext';
import { useRole, ROLES } from '@/providers/RoleContext';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';

function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const typeStyles: Record<string, string> = {
    error: 'border-red-400 bg-red-50 dark:bg-red-950/20',
    warning: 'border-amber-400 bg-amber-50 dark:bg-amber-950/20',
    info: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20',
    success: 'border-green-400 bg-green-50 dark:bg-green-950/20',
  };

  const typeDots: Record<string, string> = {
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    success: 'bg-green-500',
  };

  const fmt = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `منذ ${diffHrs} ساعة`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return d.toLocaleDateString('ar-SA');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          {unreadCount > 0 ? (
            <>
              <BellDot className="h-5 w-5 text-amber-500" />
              <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] max-h-[480px] overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">الإشعارات</DropdownMenuLabel>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <Check className="h-3 w-3 ml-1" />
              تعليم الكل مقروء
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={clearAll} disabled={notifications.length === 0}>
              <Trash2 className="h-3 w-3 ml-1" />
              مسح الكل
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            لا توجد إشعارات
          </div>
        )}

        {notifications.slice(0, 20).map(n => (
          <DropdownMenuItem
            key={n.id}
            className={cn(
              'flex flex-col items-start gap-1 px-3 py-3 cursor-pointer border-r-2 border-transparent m-1 rounded-md',
              !n.read && 'font-medium',
              typeStyles[n.type] || typeStyles.info,
            )}
            onClick={() => {
              if (!n.read) markAsRead(n.id);
              if (n.link) navigate(n.link);
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <span className={cn('h-2 w-2 rounded-full flex-shrink-0', typeDots[n.type])} />
              <span className="text-sm flex-1">{n.title}</span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{fmt(n.timestamp)}</span>
            </div>
            <p className="text-xs text-muted-foreground pr-4">{n.message}</p>
          </DropdownMenuItem>
        ))}

        {notifications.length > 20 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-center text-xs text-muted-foreground">
              +{notifications.length - 20} إشعارات أخرى
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { profile, signOut } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const { role, setRole, homePath } = useRole();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchOpen, setSearchOpen] = useState(false);

  const currentRole = ROLES.find(r => r.value === role) || ROLES[0];

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  // Global Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-6">
          {/* Left side — Breadcrumbs + Role switcher */}
          <div className="flex items-center gap-4 min-w-0">
            <Breadcrumbs />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium rounded-lg hidden md:flex">
                  <UserCog className="h-3.5 w-3.5" />
                  <span>{currentRole.label}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">عرض كـ</DropdownMenuLabel>
                {ROLES.map(r => (
                  <DropdownMenuItem
                    key={r.value}
                    onClick={() => { setRole(r.value); navigate(r.center); }}
                    className={cn('text-xs', role === r.value && 'bg-blue-50 text-blue-700 font-semibold')}
                  >
                    <span className="flex-1">{r.label}</span>
                    <span className="text-[9px] text-muted-foreground">{r.value}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-xs text-muted-foreground w-[220px] lg:w-[280px]"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-right">بحث...</span>
              <kbd className="text-[9px] px-1 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono">Ctrl+K</kbd>
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(homePath)}
              className="h-8 text-xs gap-1.5 hidden lg:flex"
              title="الصفحة الرئيسية لدوري"
            >
              الصفحة الرئيسية
            </Button>

            <NotificationsDropdown />

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            >
              <Globe className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm">{profile?.full_name || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{profile?.full_name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600">
                  <LogOut className="h-4 w-4 ml-2" />
                  {t.auth.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
