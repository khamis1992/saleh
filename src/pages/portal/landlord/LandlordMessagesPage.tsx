// Landlord Portal — Messages (landlord ↔ tenant communication)
// In-memory message threads (localStorage). Read-only in demo (no real backend).

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { tenantStore, leaseStore, unitStore, generateId } from '@/services/stores';
import { formatDate, formatDateLong } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageCircle, Send, User, Hash, Home, Search, Clock, Plus, Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const MESSAGES_KEY = 'erp_portal_messages';

interface PortalMessage {
  id: string;
  thread_id: string;
  from: 'landlord' | 'tenant';
  sender_name: string;
  body: string;
  created_at: string;
  read: boolean;
}

function getMessages(threadId: string): PortalMessage[] {
  try {
    const all: PortalMessage[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    return all.filter((m) => m.thread_id === threadId).sort((a, b) => a.created_at.localeCompare(b.created_at));
  } catch {
    return [];
  }
}

function addMessage(m: PortalMessage) {
  try {
    const all: PortalMessage[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    all.push(m);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  } catch {}
}

const TENANT_PALETTE = ['bg-[rgba(83,58,253,0.10)] text-[#533afd]', 'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-[#9b6829]'];

export default function LandlordMessagesPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const propertyId = session?.propertyId;

  const [search, setSearch] = useState('');
  const [activeTenantId, setActiveTenantId] = useState<string>('');
  const [reply, setReply] = useState('');
  const [refresh, setRefresh] = useState(0);

  const allLeases = useMemo(() => leaseStore.getAll(), []);
  const allUnits = useMemo(() => unitStore.getAll(), []);
  const allTenants = useMemo(() => tenantStore.getAll(), []);

  // Tenants with active leases
  const tenants = useMemo(() => {
    return allLeases
      .filter((l) => {
        if (!propertyId) return true;
        const u = allUnits.find((x) => x.id === l.unit_id);
        return u?.property_id === propertyId;
      })
      .filter((l) => l.status === 'active')
      .map((l) => {
        const t = allTenants.find((x) => x.id === l.tenant_id);
        const u = allUnits.find((x) => x.id === l.unit_id);
        if (!t) return null;
        return { tenant: t, lease: l, unit: u };
      })
      .filter(Boolean) as { tenant: any; lease: any; unit: any }[];
  }, [allLeases, allUnits, allTenants, propertyId]);

  const filteredTenants = useMemo(() => {
    if (!search) return tenants;
    return tenants.filter(({ tenant }) => {
      const name = (tenant.full_name || tenant.company_name).toLowerCase();
      return name.includes(search.toLowerCase()) || tenant.phone.includes(search);
    });
  }, [tenants, search]);

  // Active thread
  const activeThreadId = activeTenantId ? `thread-${activeTenantId}` : '';
  const messages = useMemo(() => activeThreadId ? getMessages(activeThreadId) : [], [activeThreadId, refresh]);

  // Auto-select first tenant
  if (!activeTenantId && filteredTenants.length > 0) {
    setActiveTenantId(filteredTenants[0].tenant.id);
  }

  const handleSend = () => {
    if (!reply.trim() || !activeTenantId) return;
    addMessage({
      id: generateId(),
      thread_id: activeThreadId,
      from: 'landlord',
      sender_name: session?.displayName || 'المالك',
      body: reply,
      created_at: new Date().toISOString(),
      read: true,
    });
    // Auto-reply simulation
    setTimeout(() => {
      const tenant = allTenants.find((t) => t.id === activeTenantId);
      const name = tenant?.full_name || tenant?.company_name || 'المستأجر';
      addMessage({
        id: generateId(),
        thread_id: activeThreadId,
        from: 'tenant',
        sender_name: name,
        body: 'شكراً لك، تم استلام رسالتك. سأتواصل معك قريباً.',
        created_at: new Date(Date.now() + 1500).toISOString(),
        read: false,
      });
      setRefresh((r) => r + 1);
    }, 1500);
    setReply('');
    setRefresh((r) => r + 1);
    toast.success('تم إرسال الرسالة');
  };

  const activeTenant = activeTenantId ? allTenants.find((t) => t.id === activeTenantId) : null;
  const activeLease = activeTenantId ? allLeases.find((l) => l.tenant_id === activeTenantId) : null;
  const activeUnit = activeLease ? allUnits.find((u) => u.id === activeLease.unit_id) : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#061b31]">الرسائل</h1>
        <p className="text-xs text-[#64748d] mt-0.5">تواصل مع المستأجرين</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Tenants list */}
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] flex flex-col">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
              <Input
                placeholder="ابحث عن مستأجر..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 h-9 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {filteredTenants.length === 0 ? (
              <p className="text-center text-[#64748d] py-6 text-xs">لا يوجد مستأجرين</p>
            ) : (
              <div className="space-y-1">
                {filteredTenants.map(({ tenant }) => {
                  const name = tenant.full_name || tenant.company_name;
                  const initials = name.charAt(0);
                  const colorIdx = (tenant.id.charCodeAt(0) || 0) % TENANT_PALETTE.length;
                  const isActive = activeTenantId === tenant.id;
                  return (
                    <button
                      key={tenant.id}
                      onClick={() => setActiveTenantId(tenant.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-right transition-colors ${
                        isActive ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-[#f6f9fc]'
                      }`}
                    >
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback className={TENANT_PALETTE[colorIdx]}>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#061b31] truncate">{name}</p>
                        <p className="text-xs text-[#64748d] truncate">{tenant.phone}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat panel */}
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] lg:col-span-2 flex flex-col">
          {activeTenant ? (
            <>
              <CardHeader className="border-b border-[#e5edf5] pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                      {(activeTenant.full_name || activeTenant.company_name).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-sm font-bold text-[#061b31]">
                      {activeTenant.full_name || activeTenant.company_name}
                    </CardTitle>
                    <p className="text-xs text-[#64748d]">
                      {activeUnit ? `وحدة ${activeUnit.unit_number}` : ''} · {activeTenant.phone}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-[#64748d]">
                    <MessageCircle className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-xs">لا توجد رسائل بعد. ابدأ المحادثة الآن.</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.from === 'landlord' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] p-3 rounded-lg ${
                        m.from === 'landlord'
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-gray-100 text-[#061b31] rounded-tl-none'
                      }`}>
                        <p className="text-xs leading-relaxed">{m.body}</p>
                        <p className={`text-xs mt-1 ${m.from === 'landlord' ? 'text-emerald-100' : 'text-[#64748d]'}`}>
                          {formatDate(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              <div className="p-3 border-t border-[#e5edf5]">
                <div className="flex gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    className="text-xs min-h-[40px] max-h-[80px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button onClick={handleSend} className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 p-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#64748d]">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-[13px]">اختر مستأجر لبدء المحادثة</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
