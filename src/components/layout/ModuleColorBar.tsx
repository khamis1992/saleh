import { useModuleColor, type ModuleName } from '@/hooks/useModuleColor';

const moduleBarColorMap: Record<ModuleName, string> = {
  leasing:      'bg-indigo-500',
  construction: 'bg-orange-500',
  procurement:  'bg-purple-500',
  maintenance:  'bg-rose-500',
  finance:      'bg-emerald-500',
  hr:           'bg-amber-500',
  legal:        'bg-sky-500',
  reports:      'bg-slate-500',
  settings:     'bg-gray-400',
  system:       'bg-gray-400',
};

/**
 * Thin colored bar below the header indicating the current module.
 * Provides visual context for which module the user is in.
 */
export function ModuleColorBar() {
  const { module } = useModuleColor();
  const barColor = moduleBarColorMap[module] || 'bg-blue-500';

  return <div className={`h-0.5 w-full ${barColor}`} />;
}
