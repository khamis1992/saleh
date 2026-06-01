// Static class maps for Tailwind JIT compatibility.
// Using dynamic class strings like `bg-${color}-50` is NOT supported
// by Tailwind's JIT compiler because it scans source files for full class names.
// Use this helper instead of template-literal class names.

export const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; hover: string }> = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    hover: 'hover:bg-blue-50' },
  green:   { bg: 'bg-green-50',   text: 'text-green-600',   border: 'border-green-200',   hover: 'hover:bg-green-50' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', hover: 'hover:bg-emerald-50' },
  red:     { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     hover: 'hover:bg-red-50' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   hover: 'hover:bg-amber-50' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200',  hover: 'hover:bg-orange-50' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200',  hover: 'hover:bg-violet-50' },
  cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-200',    hover: 'hover:bg-cyan-50' },
  gray:    { bg: 'bg-gray-100',   text: 'text-gray-500',    border: 'border-gray-200',    hover: 'hover:bg-gray-50' },
  white:   { bg: 'bg-white',      text: 'text-gray-700',    border: 'border-gray-200',    hover: 'hover:bg-gray-50' },
};

export function colorClass(color: string): { bg: string; text: string; border: string; hover: string } {
  return COLOR_CLASSES[color] || COLOR_CLASSES.blue;
}
