// Landlord Portal — Renewals Pipeline
// Shows leases that need renewal action: expiring, pending tenant confirmation, renewed, lost

import {
import { useLocale } from '@/providers/LocaleContext'; useMemo, useState } from 'react';
import {
import { useLocale } from '@/providers/LocaleContext'; usePortalAuth } from '@/providers/PortalAuthContext';
import {
import { useLocale } from '@/providers/LocaleContext'; leaseStore, tenantStore, unitStore, propertyStore, leaseStore as _ls } from '@/services/stores';
import {
import { useLocale } from '@/providers/LocaleContext'; formatQAR, formatDate, formatDateLong } from '@/lib/format';
import {
import { useLocale } from '@/providers/LocaleContext'; Card, CardContent } from '@/components/ui/card';
import {
import { useLocale } from '@/providers/LocaleContext'; Button } from '@/components/ui/button';
import {
import { useLocale } from '@/providers/LocaleContext'; Input } from '@/components/ui/input';
import {
import { useLocale } from '@/providers/LocaleContext'; StatusBadge } from '@/components/shared/StatusBadge';
import {
import { useLocale } from '@/providers/LocaleContext';
  RefreshCw, Clock, CheckCircle2, XCircle, Calendar, User, Home, Hash, DollarSign, Search,
} from 'lucide-react';

const fmt = (v: number) => formatQAR(v);

export default function LandlordRenewalsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const propertyId = session?.propertyId;

  const allLeases = useMemo(() => leaseStore.getAll(), []);
  const allTenants = useMemo(() => tenantStore.getAll(), []);
  const allUnits = useMemo(() => unitStore.getAll(), []);

  const [search, setSearch] = useState('');

  // Pipeline: categorize by status
  const pipeline = useMemo(() => {
    const today = new Date();
    const expiring = allLeases.filter((l) => {
      if (propertyId) {
        const u = allUnits.find((x) => x.id === l.unit_id);
        if (u?.property_id !== propertyId) return false;
      }
      const days = Math.ceil((new Date(l.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return l.status === 'active' && days > 0 && days < 120;
    });
    const renewed = allLeases.filter((l) => l.status === 'renewed');
    const expiringSoon = allLeases.filter((l) => l.status === 'expiring_soon');
    return { expiring, renewed, expiringSoon };
  }, [allLeases, allUnits, propertyId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061b31]">خط أنابيب التجديد</h1>
        <p className="text-xs text-[#64748d] mt-0.5">العقود التي تحتاج تجديد أو متابعة</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-[#9b6829]">قارب الانتهاء</p>
            <p className="text-xl font-bold text-[#9b6829]">{pipeline.expiringSoon.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-[#533afd]">بحاجة لتجديد</p>
            <p className="text-xl font-bold text-[#533afd]">{pipeline.expiring.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600">تم التجديد</p>
            <p className="text-xl font-bold text-emerald-600">{pipeline.renewed.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <p className="text-xs text-[#64748d]">إجمالي العقود</p>
            <p className="text-xl font-bold text-[#061b31]">{allLeases.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
        <Input
          placeholder="ابحث برقم العقد أو اسم المستأجر..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 h-10 text-[13px] bg-white"
        />
      </div>

      {/* Expiring list */}
      <div>
        <h2 className="text-sm font-bold text-[#061b31] mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#9b6829]" />
          عقود تنتهي خلال 120 يوم
        </h2>
        {pipeline.expiring.length === 0 ? (
          <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
              <p className="text-[#64748d] text-[13px]">لا توجد عقود بحاجة لتجديد قريباً</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pipeline.expiring.map((l) => {
              const tenant = allTenants.find((t) => t.id === l.tenant_id);
              const unit = allUnits.find((u) => u.id === l.unit_id);
              const property = unit ? propertyStore.getById(unit.property_id) : null;
              const days = Math.ceil((new Date(l.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Card key={l.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-[13px] font-bold text-[#061b31]">{l.contract_number}</p>
                          <StatusBadge status="expiring_soon" />
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            days < 30 ? 'bg-red-50 text-[#ea2261]' :
                            days < 60 ? 'bg-amber-50 text-[#9b6829]' :
                            'bg-[rgba(83,58,253,0.06)] text-[#533afd]'
                          }`}>
                            {days} يوم متبقي
                          </span>
                        </div>
                        <p className="text-xs text-[#64748d]">
                          {tenant?.full_name || tenant?.company_name} · {property?.property_name} · وحدة {unit?.unit_number}
                        </p>
                        <p className="text-xs text-[#64748d] mt-1">
                          ينتهي {formatDateLong(l.end_date)} · إيجار {fmt(l.rent_amount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <XCircle className="h-3 w-3 ml-1" />
                          رفض
                        </Button>
                        <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                          <RefreshCw className="h-3 w-3 ml-1" />
                          تجديد
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
