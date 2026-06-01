import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Check, X, ChevronLeft, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { KpiCard } from '@/components/shared/KpiCard';
import { getTasks, markTaskDone } from '@/services/tasks';
import { formatQARInt } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface QueueItem {
  id: string;
  type: 'claim-engineer' | 'claim-pm' | 'claim-finance' | 'lease' | 'pr' | 'journal' | 'legal-notice';
  title: string;
  subtitle?: string;
  amount?: number;
  requester?: string;
  submittedAt?: string;
  link: string;
  urgency: 'urgent' | 'high' | 'medium' | 'low';
}

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function buildApprovalQueue(): QueueItem[] {
  const out: QueueItem[] = [];
  // contractor claims
  for (const c of safeAll('erp_contractor_claims')) {
    if (c.engineer_verification_status === 'pending') {
      out.push({
        id: `eng-${c.id}`, type: 'claim-engineer',
        title: `التحقق الهندسي — ${c.claim_number}`,
        subtitle: `${c.contractor_name || 'مقاول'} · مشروع ${c.project_id}`,
        amount: c.claimed_amount, link: '/construction/claims', urgency: 'high',
      });
    }
    if (c.project_manager_approval_status === 'pending' && c.engineer_verification_status !== 'pending') {
      out.push({
        id: `pm-${c.id}`, type: 'claim-pm',
        title: `موافقة مدير المشروع — ${c.claim_number}`,
        subtitle: `${c.contractor_name || 'مقاول'} · ${c.claim_date}`,
        amount: c.claimed_amount, link: '/construction/claims', urgency: 'high',
      });
    }
    if (c.finance_approval_status === 'pending' && c.project_manager_approval_status === 'approved') {
      out.push({
        id: `fin-${c.id}`, type: 'claim-finance',
        title: `موافقة المالية — ${c.claim_number}`,
        subtitle: `صافي ${c.net_payable || c.claimed_amount} ر.ق`,
        amount: c.net_payable || c.claimed_amount, link: '/construction/claims', urgency: 'high',
      });
    }
  }
  // journal entries
  for (const j of safeAll('erp_journal_entries')) {
    if (j.status === 'draft') {
      out.push({
        id: `je-${j.id}`, type: 'journal',
        title: `ترحيل قيد — ${j.entry_number}`,
        subtitle: j.description,
        amount: j.total_debit, link: '/finance/journal-entries', urgency: 'medium',
      });
    }
  }
  // legal notices
  for (const n of safeAll('erp_legal_notices')) {
    if (n.status === 'draft' || n.status === 'pending') {
      out.push({
        id: `legal-${n.id}`, type: 'legal-notice',
        title: `إشعار قانوني — ${n.notice_number || n.id}`,
        subtitle: n.tenant_name || n.subject,
        link: '/legal/notices', urgency: 'medium',
      });
    }
  }
  return out;
}

const URGENCY_META: Record<string, { label: string; bg: string; text: string }> = {
  urgent: { label: 'عاجل',  bg: 'bg-red-50',    text: 'text-red-700' },
  high:   { label: 'مهم',   bg: 'bg-amber-50',  text: 'text-amber-700' },
  medium: { label: 'متوسط', bg: 'bg-blue-50',   text: 'text-blue-700' },
  low:    { label: 'منخفض', bg: 'bg-gray-50',   text: 'text-gray-700' },
};

const TYPE_META: Record<string, { label: string; color: string }> = {
  'claim-engineer':  { label: 'هندسي',  color: 'orange' },
  'claim-pm':        { label: 'مدير مشروع', color: 'blue' },
  'claim-finance':   { label: 'مالي',  color: 'emerald' },
  'lease':           { label: 'عقد',   color: 'violet' },
  'pr':              { label: 'طلب شراء', color: 'cyan' },
  'journal':         { label: 'قيد',   color: 'amber' },
  'legal-notice':    { label: 'إشعار', color: 'red' },
};

export default function ApprovalsQueuePage() {
  const [refresh, setRefresh] = useState(0);
  const [filter, setFilter] = useState<'all' | string>('all');

  const items = useMemo(() => {
    const list = buildApprovalQueue();
    return filter === 'all' ? list : list.filter(i => i.type === filter);
  }, [filter, refresh]);

  // counts by type
  const counts = useMemo(() => {
    const all = buildApprovalQueue();
    const map: Record<string, number> = { all: all.length };
    for (const i of all) map[i.type] = (map[i.type] || 0) + 1;
    return map;
  }, [refresh]);

  const totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);

  function approve(item: QueueItem) {
    // attempt to advance the underlying record
    try {
      if (item.type === 'claim-engineer' || item.type === 'claim-pm' || item.type === 'claim-finance') {
        const realId = item.id.split('-').slice(1).join('-');
        const claims = safeAll<any>('erp_contractor_claims');
        const idx = claims.findIndex((c: any) => c.id === realId);
        if (idx !== -1) {
          if (item.type === 'claim-engineer') claims[idx].engineer_verification_status = 'verified';
          else if (item.type === 'claim-pm') claims[idx].project_manager_approval_status = 'approved';
          else if (item.type === 'claim-finance') {
            claims[idx].finance_approval_status = 'approved';
            claims[idx].status = 'approved';
          }
          localStorage.setItem('erp_contractor_claims', JSON.stringify(claims));
        }
      } else if (item.type === 'journal') {
        const realId = item.id.replace('je-', '');
        const entries = safeAll<any>('erp_journal_entries');
        const idx = entries.findIndex((e: any) => e.id === realId);
        if (idx !== -1) {
          entries[idx].status = 'posted';
          entries[idx].posted_at = new Date().toISOString();
          localStorage.setItem('erp_journal_entries', JSON.stringify(entries));
        }
      } else if (item.type === 'legal-notice') {
        const realId = item.id.replace('legal-', '');
        const notices = safeAll<any>('erp_legal_notices');
        const idx = notices.findIndex((n: any) => n.id === realId);
        if (idx !== -1) { notices[idx].status = 'sent'; localStorage.setItem('erp_legal_notices', JSON.stringify(notices)); }
      }
    } catch (e) { console.error(e); }
    markTaskDone(item.id);
    setRefresh(r => r + 1);
    toast.success('تم اعتماد العنصر');
  }

  function reject(item: QueueItem) {
    markTaskDone(item.id);
    setRefresh(r => r + 1);
    toast.success('تم رفض العنصر');
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="قائمة الموافقات" description="كل ما يحتاج موافقتك أو قرارك في مكان واحد" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="إجمالي المعلق" value={counts.all || 0} sublabel="بانتظار قرار" icon={<Shield className="h-5 w-5" />} color="amber" />
        <KpiCard label="مطالبات" value={(counts['claim-engineer'] || 0) + (counts['claim-pm'] || 0) + (counts['claim-finance'] || 0)} sublabel="مراحل الاعتماد" icon={<Shield className="h-5 w-5" />} color="orange" />
        <KpiCard label="قيود يومية" value={counts.journal || 0} sublabel="بانتظار ترحيل" icon={<Shield className="h-5 w-5" />} color="blue" />
        <KpiCard label="قيمة المعلقة" value={formatQARInt(totalAmount)} sublabel="ر.ق" icon={<Shield className="h-5 w-5" />} color="red" />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={cn('shrink-0 h-9 px-3.5 rounded-lg text-xs font-medium transition-colors',
            filter === 'all' ? 'bg-[#1B2559] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}
        >
          الكل ({counts.all || 0})
        </button>
        {Object.entries(TYPE_META).map(([k, m]) => {
          if (!counts[k]) return null;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn('shrink-0 h-9 px-3.5 rounded-lg text-xs font-medium transition-colors',
                filter === k ? 'bg-[#1B2559] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}
            >
              {m.label} ({counts[k]})
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <EmptyStateWithAction
              size="lg"
              icon={<Check className="h-10 w-10 text-emerald-500" />}
              title="لا توجد موافقات معلقة"
              description="كل العناصر تم اتخاذ قرار بشأنها."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map(item => {
                const u = URGENCY_META[item.urgency] || URGENCY_META.medium;
                const t = TYPE_META[item.type] || { label: item.type, color: 'gray' };
                return (
                  <div key={item.id} className="p-4 flex items-center gap-3 hover:bg-gray-50/50">
                    <AlertCircle className={cn('h-5 w-5 shrink-0', u.text)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{item.title}</p>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', u.bg, u.text)}>{u.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{t.label}</span>
                      </div>
                      {item.subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>}
                    </div>
                    {item.amount && <span className="text-sm font-bold tabular-nums shrink-0">{formatQARInt(item.amount)}</span>}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link to={item.link}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600">
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => approve(item)} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                        <Check className="h-3.5 w-3.5" /> موافقة
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reject(item)} className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
