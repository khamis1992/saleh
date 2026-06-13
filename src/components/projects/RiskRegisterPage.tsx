import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Plus, RotateCcw, CheckCircle2, X, Search, Filter, ShieldAlert, MousePointerClick, Info, Pencil } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Risk {
  id: string; project_id: string; project_name: string; title: string;
  description?: string; category: 'financial' | 'schedule' | 'scope' | 'quality' | 'safety' | 'external';
  likelihood: 1|2|3|4|5; impact: 1|2|3|4|5;
  mitigation: string; owner: string; status: 'open' | 'mitigating' | 'closed'; created_at: string;
}

const seedRisks: Risk[] = [
  { id:'rk-1', project_id:'prj-1', project_name:'مجمع النخيل السكني', title:'ارتفاع أسعار الحديد', description:'تقلبات السوق قد تتجاوز الميزانية المعتمدة', category:'financial', likelihood:4, impact:4, mitigation:'توقيع عقد توريد بأسعار مثبتة لمدة 6 أشهر', owner:'مدير المشروع', status:'mitigating', created_at:'2025-09-01' },
  { id:'rk-2', project_id:'prj-1', project_name:'مجمع النخيل السكني', title:'تأخر إصدار رخصة البناء', category:'external', likelihood:3, impact:5, mitigation:'متابعة دورية مع البلدية، تعيين مستشار محلي', owner:'مهندس الموقع', status:'open', created_at:'2025-09-15' },
  { id:'rk-3', project_id:'prj-2', project_name:'أبراج السلام', title:'نقص العمالة الماهرة', category:'schedule', likelihood:3, impact:4, mitigation:'عقد مع 3 شركات توريد عمالة', owner:'مدير المشروع', status:'mitigating', created_at:'2025-10-01' },
  { id:'rk-4', project_id:'prj-4', project_name:'المركز التجاري', title:'تجاوز ميزانية التشطيبات', category:'financial', likelihood:5, impact:5, mitigation:'مراجعة شاملة مع الموردين', owner:'مدير المشروع', status:'open', created_at:'2025-10-20' },
  { id:'rk-5', project_id:'prj-3', project_name:'فلل الياسمين', title:'حادث سلامة محتمل', category:'safety', likelihood:2, impact:5, mitigation:'تدريب أسبوعي للعمال، فحص معدات يومي', owner:'مسؤول السلامة', status:'mitigating', created_at:'2025-10-10' },
];

const CATEGORY_LABELS: Record<string,string> = { financial:'مالي', schedule:'جدول', scope:'نطاق', quality:'جودة', safety:'سلامة', external:'خارجي' };
const CATEGORY_CONFIG: Record<string,{dot:string;chip:string}> = {
  financial:{ dot:'bg-rose-500', chip:'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  schedule:{ dot:'bg-amber-500', chip:'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  scope:{ dot:'bg-blue-500', chip:'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  quality:{ dot:'bg-violet-500', chip:'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  safety:{ dot:'bg-orange-500', chip:'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  external:{ dot:'bg-gray-400', chip:'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};
const STATUS_LABELS: Record<string,string> = { open:'مفتوحة', mitigating:'قيد المعالجة', closed:'مغلقة' };
const STATUS_CONFIG: Record<string,{dot:string;chip:string}> = {
  open:{ dot:'bg-gray-400', chip:'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  mitigating:{ dot:'bg-amber-500', chip:'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  closed:{ dot:'bg-emerald-500', chip:'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
};
const LIKELIHOOD_LABELS: Record<number,string> = { 1:'نادر', 2:'غير محتمل', 3:'ممكن', 4:'محتمل', 5:'شبه مؤكد' };
const IMPACT_LABELS: Record<number,string> = { 1:'ضئيل', 2:'صغير', 3:'متوسط', 4:'كبير', 5:'كارثي' };
const SEVERITY_TIERS = [
  { key:'critical' as const, label:'حرج', range:'20-25', bg:'bg-red-700', text:'text-white' },
  { key:'high2' as const, label:'عالي جداً', range:'15-19', bg:'bg-red-500', text:'text-white' },
  { key:'high' as const, label:'عالي', range:'10-14', bg:'bg-amber-400', text:'text-gray-900' },
  { key:'medium' as const, label:'متوسط', range:'5-9', bg:'bg-emerald-300', text:'text-gray-900' },
  { key:'low' as const, label:'منخفض', range:'1-4', bg:'bg-emerald-100', text:'text-gray-700' },
];
const severityOf = (s:number) => s>=20?'critical':s>=15?'high2':s>=10?'high':s>=5?'medium':'low';

function KpiCard({ label, value, icon: Icon, accent }: { label:string; value:string|number; icon:React.ElementType; accent:string }) {
  const a: Record<string,{bg:string;color:string}> = { blue:{ bg:'bg-blue-50', color:'text-blue-600' }, amber:{ bg:'bg-amber-50', color:'text-amber-600' }, rose:{ bg:'bg-rose-50', color:'text-rose-600' }, slate:{ bg:'bg-slate-50', color:'text-slate-600' }, emerald:{ bg:'bg-emerald-50', color:'text-emerald-600' } }[accent]||{ bg:'bg-slate-50', color:'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.bg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.color}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function cellColor(l:number,i:number) {
  const s=l*i;
  if(s>=20)return 'bg-red-700 text-white';if(s>=15)return 'bg-red-500 text-white';if(s>=10)return 'bg-amber-400 text-gray-900';if(s>=5)return 'bg-emerald-300 text-gray-900';return 'bg-emerald-100 text-gray-700';
}

export default function RiskRegisterPage() {
  const { dir } = useLocale();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const projectName = searchParams.get('projectName') || '';
  const [risks, setRisks] = useState<Risk[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Partial<Risk>>({ category:'financial', likelihood:3, impact:3, status:'open' });
  const [cellDialog, setCellDialog] = useState<{likelihood:number;impact:number}|null>(null);

  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('erp_risk_register')||'[]');
    if (existing.length===0) { localStorage.setItem('erp_risk_register',JSON.stringify(seedRisks)); setRisks(seedRisks); }
    else setRisks(existing);
  }, []);

  const refresh = () => setRisks(JSON.parse(localStorage.getItem('erp_risk_register')||'[]'));

  const stats = useMemo(() => {
    const total=risks.length;const open=risks.filter(r=>r.status!=='closed').length;
    const high=risks.filter(r=>r.status!=='closed'&&(r.likelihood*r.impact)>=12).length;
    const mitigated=risks.filter(r=>r.status==='mitigating').length;
    return { total, open, high, mitigated };
  }, [risks]);

  const matrix = useMemo(() => {
    const grid:{likelihood:number;impact:number;count:number;risks:Risk[]}[]=[];
    for(let l=5;l>=1;l--)for(let i=1;i<=5;i++){const m=risks.filter(r=>r.likelihood===l&&r.impact===i&&r.status!=='closed');grid.push({likelihood:l,impact:i,count:m.length,risks:m});}
    return grid;
  }, [risks]);

  const filtered = useMemo(() => risks.filter(r=>{
    if(catFilter!=='all'&&r.category!==catFilter)return false;
    if(statusFilter!=='all'&&r.status!==statusFilter)return false;
    if(search&&!r.title.includes(search)&&!r.project_name.includes(search))return false;
    return true;
  }), [risks, catFilter, statusFilter, search]);

  function submitRisk() {
    if(!form.title){toast.error('عنوان المخاطرة مطلوب');return;}
    const nr:Risk={id:`rk-${Date.now()}`,project_id:form.project_id||projectId||'',project_name:form.project_name||projectName||'—',
      title:form.title!,description:form.description,category:form.category as Risk['category'],
      likelihood:form.likelihood as Risk['likelihood'],impact:form.impact as Risk['impact'],
      mitigation:form.mitigation||'',owner:form.owner||'',status:form.status as Risk['status'],
      created_at:new Date().toISOString().split('T')[0]};
    const u=[nr,...risks];localStorage.setItem('erp_risk_register',JSON.stringify(u));setRisks(u);
    setShowAdd(false);setForm({category:'financial',likelihood:3,impact:3,status:'open'});toast.success('تم تسجيل المخاطرة');
  }

  function updateStatus(id:string,status:Risk['status']){
    const u=risks.map(r=>r.id===id?{...r,status}:r);localStorage.setItem('erp_risk_register',JSON.stringify(u));setRisks(u);
  }

  const openCreate = () => {
    setForm({category:'financial',likelihood:3,impact:3,status:'open',project_id:projectId||'',project_name:projectName||''});
    setShowAdd(true);
  };

  const resetFilters = () => { setCatFilter('all'); setStatusFilter('all'); setSearch(''); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm"><ShieldAlert className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-600">سجل المخاطر</span><span className="text-[13px] font-bold text-gray-900">{risks.length} مخاطرة</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e=>setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search&&<button onClick={()=>setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3"/></button>}
          </div>
          <div className="me-auto" />
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><Plus className="h-3.5 w-3.5" /><span>تسجيل مخاطرة</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي المخاطر" value={stats.total} icon={AlertTriangle} accent="slate" />
          <KpiCard label="مخاطر مفتوحة" value={stats.open} icon={AlertTriangle} accent="amber" />
          <KpiCard label="عالية جداً (≥12)" value={stats.high} icon={AlertTriangle} accent="rose" />
          <KpiCard label="قيد المعالجة" value={stats.mitigated} icon={CheckCircle2} accent="emerald" />
        </div>

        {/* Risk Matrix */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-start gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0"><ShieldAlert className="h-4 w-4 text-rose-600" /></div>
              <div><h3 className="text-sm font-bold text-gray-900">مصفوفة المخاطر</h3><p className="text-[11px] text-gray-500 mt-0.5">خريطة بصرية تصنّف المخاطر حسب الاحتمال والتأثير</p></div>
            </div>
            <Tooltip><TooltipTrigger asChild><button className="h-7 w-7 rounded-md border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"><Info className="h-3.5 w-3.5"/></button></TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-right p-3 leading-relaxed">
              <p className="font-bold mb-1.5 text-[12px]">كيف تُحسب درجة المخاطرة؟</p>
              <p className="text-[11px] mb-2">الدرجة = الاحتمال × التأثير (من 1 إلى 25)</p>
              <p className="text-[11px]">اضغط على خلية ملونة لعرض تفاصيل المخاطر</p>
            </TooltipContent></Tooltip>
          </div>
          {/* Severity legend */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4 p-2.5 rounded-lg bg-gray-50/70 ring-1 ring-gray-100">
            <span className="text-[11px] font-bold text-gray-500 ml-1">دليل الخطورة:</span>
            {SEVERITY_TIERS.map(t=>(
              <span key={t.key} className={cn('text-[10px] font-bold px-2 py-0.5 rounded', t.bg, t.text)}>{t.label} <span className="opacity-75 font-normal">({t.range})</span></span>
            ))}
          </div>
          {/* 5x5 Grid */}
          <div className="overflow-x-auto pb-1">
            <div className="inline-block min-w-full">
              <div className="grid" style={{gridTemplateColumns:'92px repeat(5, minmax(72px, 1fr))',gap:'3px'}}>
                <div className="flex flex-col items-end justify-end pr-2 pb-1"><span className="text-[10px] text-gray-400">الزاوية =</span><span className="text-[10px] text-gray-400">أعلى خطورة</span></div>
                {[1,2,3,4,5].map(i=>(<div key={i} className="text-center py-1 px-1 rounded-md bg-gray-50 ring-1 ring-gray-100"><div className="text-xs font-bold leading-tight text-gray-700">تأثير {i}</div><div className="text-[9px] text-gray-400 leading-tight mt-0.5">{IMPACT_LABELS[i]}</div></div>))}
                {Array.from({length:5},(_,idx)=>5-idx).map(l=>(<div key={l} className="contents">
                  <div className="text-xs font-bold flex flex-col items-end justify-center pr-2 py-1 rounded-md bg-gray-50 ring-1 ring-gray-100"><span className="leading-tight text-gray-700">احتمال {l}</span><span className="text-[9px] text-gray-400 font-normal leading-tight mt-0.5">{LIKELIHOOD_LABELS[l]}</span></div>
                  {[1,2,3,4,5].map(i=>{
                    const cell=matrix.find(c=>c.likelihood===l&&c.impact===i)!;
                    const score=l*i;const sev=severityOf(score);const has=cell.count>0;
                    return(
                      <button key={i} onClick={()=>has&&setCellDialog({likelihood:l,impact:i})}
                        className={cn('aspect-square rounded-md flex flex-col items-center justify-center font-bold transition-all relative',has?'hover:scale-105 hover:shadow-lg hover:z-10 cursor-pointer ring-1 ring-black/5':'cursor-default',cellColor(l,i))}>
                        {has?<><span className="text-xl font-extrabold leading-none">{cell.count}</span><span className="text-[8px] mt-0.5 opacity-90 leading-none font-semibold">{SEVERITY_TIERS.find(t=>t.key===sev)?.label}</span></>:<span className="text-[10px] opacity-40 leading-none font-semibold">{score}</span>}
                      </button>
                    );
                  })}
                </div>))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/60 ring-1 ring-blue-100">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-[11px] text-blue-900 leading-relaxed"><span className="font-bold">كيف تقرأ المصفوفة:</span> كل خلية = تقاطع الاحتمال × التأثير. اللون = درجة الخطورة. اضغط على خلية ملونة لعرض التفاصيل.</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">قائمة المخاطر</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5"/> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1"/><SelectValue placeholder="الفئة"/></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الفئات</SelectItem>{Object.entries(CATEGORY_LABELS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1"/><SelectValue placeholder="الحالة"/></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الحالات</SelectItem>{Object.entries(STATUS_LABELS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Risk table */}
        {filtered.length===0 ? (
          <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><ShieldAlert className="h-8 w-8 text-gray-300"/></div>
            <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد مخاطر</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج مطابقة</p></div>
            <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5"/> مسح الفلاتر</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[60px]">الدرجة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المخاطرة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المشروع</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الفئة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المسؤول</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-center w-[100px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map(r=>{
                  const score=r.likelihood*r.impact;const sev=severityOf(score);
                  const sc=STATUS_CONFIG[r.status]||STATUS_CONFIG.open;
                  const cc=CATEGORY_CONFIG[r.category]||CATEGORY_CONFIG.financial;
                  const sevColor={critical:'bg-red-700 text-white',high2:'bg-red-500 text-white',high:'bg-amber-400 text-gray-900',medium:'bg-emerald-300 text-gray-900',low:'bg-emerald-100 text-gray-700'}[sev]||'bg-gray-100 text-gray-600';
                  return(
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3"><span className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-[11px] font-extrabold ${sevColor}`}>{score}</span></td>
                      <td className="px-4 py-3"><div><div className="text-sm font-bold text-gray-900">{r.title}</div>{r.description&&<div className="text-[11px] text-gray-400 truncate max-w-xs">{r.description}</div>}</div></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.project_name}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${cc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`}/>{CATEGORY_LABELS[r.category]}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.owner}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${sc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{STATUS_LABELS[r.status]}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {r.status==='open'&&<Tooltip><TooltipTrigger asChild><button onClick={()=>updateStatus(r.id,'mitigating')} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5"/></button></TooltipTrigger><TooltipContent>بدء المعالجة</TooltipContent></Tooltip>}
                          {r.status==='mitigating'&&<Tooltip><TooltipTrigger asChild><button onClick={()=>updateStatus(r.id,'closed')} className="h-7 w-7 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center"><CheckCircle2 className="h-3.5 w-3.5"/></button></TooltipTrigger><TooltipContent>إغلاق</TooltipContent></Tooltip>}
                          {r.status==='closed'&&<span className="text-[11px] text-gray-400">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {risks.length} مخاطرة</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-500"/>محدث في الوقت الفعلي</span>
        </div>
      </div>

      {/* Create risk dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>تسجيل مخاطرة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>العنوان *</Label><Input value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="مثال: تأخر توريد الحديد" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>المشروع</Label><Input value={form.project_name||projectName||''} onChange={e=>setForm(f=>({...f,project_name:e.target.value}))} placeholder="اسم المشروع" /></div>
              <div><Label>المسؤول</Label><Input value={form.owner||''} onChange={e=>setForm(f=>({...f,owner:e.target.value}))} placeholder="مدير المشروع" /></div>
            </div>
            <div><Label>الوصف</Label><Textarea value={form.description||''} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>الفئة</Label><Select value={form.category} onValueChange={v=>setForm(f=>({...f,category:v as Risk['category']}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(CATEGORY_LABELS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>الاحتمال (1-5)</Label><Select value={String(form.likelihood)} onValueChange={v=>setForm(f=>({...f,likelihood:Number(v) as Risk['likelihood']}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n=><SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>التأثير (1-5)</Label><Select value={String(form.impact)} onValueChange={v=>setForm(f=>({...f,impact:Number(v) as Risk['impact']}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n=><SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>خطة المعالجة</Label><Textarea value={form.mitigation||''} onChange={e=>setForm(f=>({...f,mitigation:e.target.value}))} rows={2} placeholder="ما الإجراءات التي ستتخذها؟" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setShowAdd(false)}>إلغاء</Button><Button onClick={submitRisk} className="bg-rose-500 hover:bg-rose-600 text-white gap-1.5"><Plus className="h-4 w-4"/> حفظ المخاطرة</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Matrix cell detail dialog */}
      {cellDialog&&(()=>{
        const cell=matrix.find(c=>c.likelihood===cellDialog.likelihood&&c.impact===cellDialog.impact)!;
        const score=cellDialog.likelihood*cellDialog.impact;const sev=severityOf(score);const tier=SEVERITY_TIERS.find(t=>t.key===sev)!;
        return(
          <Dialog open={!!cellDialog} onOpenChange={open=>!open&&setCellDialog(null)}>
            <DialogContent className="sm:max-w-2xl" dir="rtl">
              <DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><span className={cn('h-3 w-3 rounded-full shrink-0 ring-2 ring-offset-1',tier.bg)}/><span>احتمال {cellDialog.likelihood} × تأثير {cellDialog.impact}</span></DialogTitle>
              <DialogDescription className="text-right flex items-center gap-2 flex-wrap mt-1"><span>الدرجة: <span className="font-bold text-gray-900">{score}</span></span><span>·</span><span>التصنيف: <span className={cn('font-bold px-1.5 py-0.5 rounded text-[11px]',tier.bg,tier.text)}>{tier.label}</span></span><span>·</span><span>عدد المخاطر: <span className="font-bold text-gray-900">{cell.count}</span></span></DialogDescription></DialogHeader>
              {cell.risks.length===0?<p className="text-center text-sm text-gray-400 py-8">لا توجد مخاطر في هذه الخلية.</p>:(
                <div className="space-y-2 max-h-60 overflow-y-auto">{cell.risks.map(r=>{
                  const cc=CATEGORY_CONFIG[r.category]||CATEGORY_CONFIG.financial;
                  return(
                    <div key={r.id} className="p-3 rounded-lg ring-1 ring-gray-100 hover:ring-gray-200 transition-all">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`h-7 w-7 rounded-md flex items-center justify-center text-[11px] font-extrabold shrink-0 ${cellColor(r.likelihood,r.impact)}`}>{r.likelihood*r.impact}</span>
                        <span className="text-sm font-bold text-gray-900 flex-1 min-w-0">{r.title}</span>
                        <span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded text-[10px] font-bold ${cc.chip}`}><span className={`h-1 w-1 rounded-full ${cc.dot}`}/>{CATEGORY_LABELS[r.category]}</span>
                        <span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded text-[10px] font-bold ${STATUS_CONFIG[r.status].chip}`}><span className={`h-1 w-1 rounded-full ${STATUS_CONFIG[r.status].dot}`}/>{STATUS_LABELS[r.status]}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1.5"><span className="font-bold">المشروع:</span> {r.project_name} · <span className="font-bold">المسؤول:</span> {r.owner}</p>
                      {r.description&&<p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.description}</p>}
                      {r.mitigation&&<div className="mt-2 p-2 rounded bg-emerald-50/60 ring-1 ring-emerald-100"><p className="text-[10px] font-bold text-emerald-800 mb-0.5">خطة المعالجة:</p><p className="text-xs text-emerald-900 leading-relaxed">{r.mitigation}</p></div>}
                    </div>
                  );
                })}</div>
              )}
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}