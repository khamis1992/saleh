import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, AlertTriangle, ListChecks, ChevronLeft, Wrench as Tool, Plus, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { KpiCard } from '@/components/shared/KpiCard';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface MaintItem {
  id: string;
  request_number: string;
  title: string;
  unit_code?: string;
  status: string;
  priority: string;
  created_at: string;
  scheduled_date?: string;
  due_date?: string;
  bucket: 'new' | 'emergency' | 'assigned' | 'waiting_parts' | 'overdue' | 'completed';
}

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

const BUCKET_META: Record<string, { label: string; color: string; bg: string; text: string }> = {
  new:            { label: 'جديد',                 color: 'blue',   bg: 'bg-blue-50',   text: 'text-blue-700' },
  emergency:      { label: 'طارئ',                color: 'red',    bg: 'bg-red-50',    text: 'text-red-700' },
  assigned:       { label: 'مسند',                color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700' },
  waiting_parts:  { label: 'بانتظار قطع غيار',    color: 'amber',  bg: 'bg-amber-50',  text: 'text-amber-700' },
  overdue:        { label: 'متأخر',               color: 'red',    bg: 'bg-red-50',    text: 'text-red-700' },
  completed:      { label: 'مكتمل (بانتظار تأكيد المستأجر)', color: 'green', bg: 'bg-green-50', text: 'text-green-700' },
};

export default function MaintenanceQueuePage() {
  const [refresh, setRefresh] = useState(0);
  const [activeBucket, setActiveBucket] = useState<string>('all');

  const items = useMemo<MaintItem[]>(() => {
    const requests = safeAll<any>('erp_maintenance');
    const units = safeAll<any>('erp_units');
    const out: MaintItem[] = [];
    const today = new Date();
    for (const r of requests) {
      const unit = units.find((u: any) => u.id === r.unit_id);
      let bucket: MaintItem['bucket'] = 'new';
      if (r.priority === 'emergency' && r.status !== 'closed' && r.status !== 'completed') bucket = 'emergency';
      else if (r.status === 'closed' || r.status === 'completed') bucket = 'completed';
      else if (r.status === 'waiting_parts' || r.status === 'waiting') bucket = 'waiting_parts';
      else if (r.assigned_to || r.technician_id) bucket = 'assigned';
      else bucket = 'new';

      // overdue check
      if (bucket !== 'completed' && r.scheduled_date && new Date(r.scheduled_date) < today) bucket = 'overdue';

      out.push({
        id: r.id, request_number: r.request_number, title: r.title || r.description || r.request_number,
        unit_code: unit?.unit_code, status: r.status, priority: r.priority,
        created_at: r.created_at, scheduled_date: r.scheduled_date, due_date: r.due_date, bucket,
      });
    }
    return out;
  }, [refresh]);

  const filtered = activeBucket === 'all' ? items : items.filter(i => i.bucket === activeBucket);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: items.length };
    for (const i of items) m[i.bucket] = (m[i.bucket] || 0) + 1;
    return m;
  }, [items]);

  function markClosed(id: string) {
    const requests = safeAll<any>('erp_maintenance');
    const idx = requests.findIndex((r: any) => r.id === id);
    if (idx === -1) return;
    requests[idx].status = 'closed';
    requests[idx].closed_at = new Date().toISOString();
    localStorage.setItem('erp_maintenance', JSON.stringify(requests));
    toast.success('تم إغلاق الطلب');
    setRefresh(r => r + 1);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="قائمة الصيانة" description="طلبات الصيانة مقسمة حسب الحالة">
        <Link to="/maintenance/requests">
          <Button className="bg-[#3B82F6] hover:bg-blue-600 text-white h-9 text-sm gap-1.5">
            <Plus className="h-4 w-4" /> طلب صيانة
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="إجمالي" value={items.length} icon={<Wrench className="h-5 w-5" />} color="blue" />
        <KpiCard label="جديد" value={counts.new || 0} sublabel="بانتظار التوزيع" icon={<Wrench className="h-5 w-5" />} color="cyan" />
        <KpiCard label="طارئ" value={counts.emergency || 0} sublabel="أولوية قصوى" icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <KpiCard label="مسند" value={counts.assigned || 0} icon={<Tool className="h-5 w-5" />} color="orange" />
        <KpiCard label="متأخر" value={counts.overdue || 0} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <KpiCard label="بانتظار قطع" value={counts.waiting_parts || 0} icon={<ListChecks className="h-5 w-5" />} color="amber" />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveBucket('all')}
          className={cn('shrink-0 h-9 px-3.5 rounded-lg text-xs font-medium',
            activeBucket === 'all' ? 'bg-[#1B2559] text-white' : 'bg-white border border-gray-200 hover:bg-gray-50')}
        >
          الكل ({items.length})
        </button>
        {Object.entries(BUCKET_META).map(([k, m]) => {
          if (!counts[k]) return null;
          return (
            <button
              key={k}
              onClick={() => setActiveBucket(k)}
              className={cn('shrink-0 h-9 px-3.5 rounded-lg text-xs font-medium',
                activeBucket === k ? 'bg-[#1B2559] text-white' : `${m.bg} ${m.text} hover:opacity-80`)}
            >
              {m.label} ({counts[k]})
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyStateWithAction
              size="lg"
              icon={<ClipboardCheck className="h-10 w-10 text-emerald-500" />}
              title="لا توجد طلبات في هذه القائمة"
              description="كل الطلبات تم التعامل معها."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(item => {
                const b = BUCKET_META[item.bucket];
                return (
                  <div key={item.id} className="p-4 flex items-center gap-3 hover:bg-gray-50/50">
                    <div className={cn('h-2 w-2 rounded-full shrink-0',
                      item.priority === 'emergency' ? 'bg-red-500' :
                      item.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', b.bg, b.text)}>{b.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                        <span className="font-mono">{item.request_number}</span>
                        {item.unit_code && <span>· {item.unit_code}</span>}
                        {item.scheduled_date && <span>· {new Date(item.scheduled_date).toLocaleDateString('ar-SA')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link to={`/maintenance/requests/${item.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-[11px]">
                          فتح <ChevronLeft className="h-3 w-3" />
                        </Button>
                      </Link>
                      {item.bucket !== 'completed' && (
                        <Button size="sm" onClick={() => markClosed(item.id)} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                          <ClipboardCheck className="h-3 w-3" /> إغلاق
                        </Button>
                      )}
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
