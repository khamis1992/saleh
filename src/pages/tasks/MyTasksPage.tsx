import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, RefreshCw, Check, X, Clock, ChevronLeft, Bell, Shield, Wrench, FileText, Banknote, User, Scale, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { deriveTasksFromData, getTasks, markTaskDone, markTaskInProgress, cancelTask, type ErpTask, type TaskCategory } from '@/services/tasks';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

const CATEGORY_META: Record<TaskCategory, { label: string; icon: any; color: string }> = {
  approval:    { label: 'الموافقات', icon: Shield,     color: 'amber' },
  followup:    { label: 'متابعات',   icon: Bell,        color: 'blue' },
  maintenance: { label: 'صيانة',     icon: Wrench,      color: 'orange' },
  collection:  { label: 'تحصيل',     icon: Banknote,    color: 'red' },
  project:     { label: 'مشاريع',    icon: FileText,    color: 'cyan' },
  contract:    { label: 'عقود',      icon: FileText,    color: 'violet' },
  legal:       { label: 'قانونية',   icon: Scale,       color: 'red' },
  document:    { label: 'مستندات',   icon: FileText,    color: 'gray' },
};

const PRIORITY_META: Record<string, { label: string; color: string; dot: string }> = {
  urgent: { label: 'عاجل',     color: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  high:   { label: 'مهم',      color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  medium: { label: 'متوسط',    color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  low:    { label: 'منخفض',    color: 'bg-gray-100 text-gray-700',   dot: 'bg-gray-400' },
};

export default function MyTasksPage() {
  const [refresh, setRefresh] = useState(0);
  const [activeCat, setActiveCat] = useState<TaskCategory | 'all'>('all');

  useEffect(() => {
    deriveTasksFromData();
  }, [refresh]);

  const tasks = useMemo(() => getTasks().filter(t => t.status === 'open' || t.status === 'in_progress'), [refresh]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: tasks.length };
    for (const t of tasks) map[t.category] = (map[t.category] || 0) + 1;
    return map;
  }, [tasks]);

  const filtered = activeCat === 'all' ? tasks : tasks.filter(t => t.category === activeCat);

  function onDone(id: string) { markTaskDone(id); setRefresh(r => r + 1); toast.success('تم إنجاز المهمة'); }
  function onProgress(id: string) { markTaskInProgress(id); setRefresh(r => r + 1); toast.success('بدأت العمل على المهمة'); }
  function onCancel(id: string) { cancelTask(id); setRefresh(r => r + 1); toast.success('تم إلغاء المهمة'); }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="مهامي" description="جميع المهام والإجراءات المعلقة بانتظارك">
        <Button variant="outline" onClick={() => { deriveTasksFromData(); setRefresh(r => r + 1); toast.success('تم تحديث قائمة المهام'); }} className="h-9 text-sm gap-1.5">
          <RefreshCw className="h-4 w-4" /> تحديث
        </Button>
      </PageHeader>

      {/* Category tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        <button
          onClick={() => setActiveCat('all')}
          className={cn(
            'shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium transition-colors',
            activeCat === 'all' ? 'bg-[#1B2559] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
          )}
        >
          <ListChecks className="h-3.5 w-3.5" />
          <span>الكل</span>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded', activeCat === 'all' ? 'bg-white/20' : 'bg-gray-100')}>{counts.all || 0}</span>
        </button>
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          if (!counts[key]) return null;
          const Icon = meta.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveCat(key as TaskCategory)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium transition-colors',
                activeCat === key ? 'bg-[#1B2559] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{meta.label}</span>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded', activeCat === key ? 'bg-white/20' : 'bg-gray-100')}>{counts[key] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* Tasks list */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyStateWithAction
              size="lg"
              icon={<Check className="h-10 w-10 text-emerald-500" />}
              title="لا توجد مهام معلقة"
              description="كل المهام مكتملة أو لا توجد مهام جديدة بحاجة لاهتمامك."
              primaryAction={{ label: 'تحديث القائمة', onClick: () => { deriveTasksFromData(); setRefresh(r => r + 1); } }}
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(task => {
                const cat = CATEGORY_META[task.category];
                const CatIcon = cat?.icon || FileText;
                const pri = PRIORITY_META[task.priority] || PRIORITY_META.medium;
                return (
                  <div key={task.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn('h-2 w-2 rounded-full mt-2 shrink-0', pri.dot)} />
                      <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <CatIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', pri.color)}>{pri.label}</span>
                          {task.status === 'in_progress' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-100 text-blue-700">قيد العمل</span>
                          )}
                        </div>
                        {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                          <span>{cat?.label}</span>
                          {task.recordLabel && <span>· {task.recordLabel}</span>}
                          {task.dueDate && <span>· استحقاق {new Date(task.dueDate).toLocaleDateString('ar-SA')}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link to={task.link}>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                            فتح <ChevronLeft className="h-3 w-3" />
                          </Button>
                        </Link>
                        {task.status === 'open' && (
                          <Button size="sm" variant="ghost" onClick={() => onProgress(task.id)} className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Clock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => onDone(task.id)} className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onCancel(task.id)} className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
