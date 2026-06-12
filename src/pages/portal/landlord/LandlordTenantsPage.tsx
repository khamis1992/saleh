// Landlord Portal — Tenant Directory
// Shows all active tenants with lease info, contact, balance

import {
import { useLocale } from '@/providers/LocaleContext'; useMemo, useState } from 'react';
import {
import { useLocale } from '@/providers/LocaleContext'; usePortalAuth } from '@/providers/PortalAuthContext';
import {
import { useLocale } from '@/providers/LocaleContext'; tenantStore, leaseStore, unitStore, invoiceStore, propertyStore } from '@/services/stores';
import {
import { useLocale } from '@/providers/LocaleContext'; formatQAR, formatDate } from '@/lib/format';
import {
import { useLocale } from '@/providers/LocaleContext'; Card, CardContent } from '@/components/ui/card';
import {
import { useLocale } from '@/providers/LocaleContext'; Input } from '@/components/ui/input';
import {
import { useLocale } from '@/providers/LocaleContext'; Button } from '@/components/ui/button';
import {
import { useLocale } from '@/providers/LocaleContext'; StatusBadge } from '@/components/shared/StatusBadge';
import {
import { useLocale } from '@/providers/LocaleContext';
  User, Search, Phone, Mail, Hash, Home, DollarSign, Building2, Calendar, AlertCircle,
} from 'lucide-react';

const fmt = (v: number) => formatQAR(v);

export default function LandlordTenantsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const propertyId = session?.propertyId;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const allLeases = useMemo(() => leaseStore.getAll(), []);
  const allTenants = useMemo(() => tenantStore.getAll(), []);
  const allUnits = useMemo(() => unitStore.getAll(), []);
  const allInvoices = useMemo(() => invoiceStore.getAll(), []);

  // For landlord, filter to active leases on their property (or all if no property selected)
  const visibleLeases = useMemo(() => {
    return allLeases.filter((l) => {
      if (propertyId) {
        const unit = allUnits.find((u) => u.id === l.unit_id);
        return unit?.property_id === propertyId;
      }
      return true;
    });
  }, [allLeases, allUnits, propertyId]);

  const rows = useMemo(() => {
    return visibleLeases.map((l) => {
      const tenant = allTenants.find((t) => t.id === l.tenant_id);
      const unit = allUnits.find((u) => u.id === l.unit_id);
      const property = unit ? propertyStore.getById(unit.property_id) : null;
      const balance = allInvoices
        .filter((i) => i.tenant_id === l.tenant_id && i.contract_id === l.id)
        .reduce((s, i) => s + i.balance, 0);
      return { lease: l, tenant, unit, property, balance };
    }).filter((r) => r.tenant);
  }, [visibleLeases, allTenants, allUnits, allInvoices]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.lease.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const name = (r.tenant?.full_name || r.tenant?.company_name || '').toLowerCase();
        if (!name.includes(s) && !r.lease.contract_number.toLowerCase().includes(s) && !(r.tenant?.phone || '').includes(s)) {
          return false;
        }
      }
      return true;
    });
  }, [rows, search, statusFilter]);

  const totalBalance = filtered.reduce((s, r) => s + r.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">دليل المستأجرين</h1>
          <p className="text-xs text-[#64748d] mt-0.5">جميع المستأجرين النشطين في محفظتك</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
          <p className="text-xs text-emerald-600">{tt('dashboard.totalReceivables', 'إجمالي المستحقات')}</p>
          <p className="text-base font-bold text-emerald-700">{fmt(totalBalance)}</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
          <Input
            placeholder="ابحث بالاسم، رقم العقد، أو الجوال..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-10 text-[13px] bg-white"
          />
        </div>
        <div className="flex gap-1">
          {[
            { v: 'all', label: 'الكل' },
            { v: 'active', label: 'نشط' },
            { v: 'expiring_soon', label: 'قارب الانتهاء' },
          ].map((b) => (
            <button
              key={b.v}
              onClick={() => setStatusFilter(b.v)}
              className={`px-3 h-10 rounded-lg text-xs font-medium ${
                statusFilter === b.v ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 border border-[#e5edf5]'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-[#64748d] text-sm">لا يوجد مستأجرين مطابقين</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ lease, tenant, unit, property, balance }) => {
            const name = tenant?.full_name || tenant?.company_name || '—';
            const initials = name.charAt(0);
            const isExpiring = lease.status === 'expiring_soon';
            return (
              <Card key={lease.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-bold text-[#061b31]">{name}</p>
                          <StatusBadge status={lease.status} />
                          {balance > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-[#ea2261] font-medium flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> مستحق {fmt(balance)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#64748d] flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" /> {lease.contract_number}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> <span dir="ltr">{tenant?.phone}</span>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> <span dir="ltr">{tenant?.email}</span>
                          </span>
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
                          <div>
                            <p className="text-xs text-[#64748d]">العقار</p>
                            <p className="text-xs font-semibold text-[#061b31]">{property?.property_name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#64748d]">{tt('system.module', 'الوحدة')}</p>
                            <p className="text-xs font-semibold text-[#061b31]">{unit?.unit_number || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#64748d]">{tt('leases.rentAmount', 'قيمة الإيجار')}</p>
                            <p className="text-xs font-semibold text-emerald-600">{fmt(lease.rent_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#64748d]">ينتهي في</p>
                            <p className="text-xs font-semibold text-[#061b31]">{formatDate(lease.end_date)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
