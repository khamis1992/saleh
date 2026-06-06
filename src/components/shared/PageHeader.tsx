import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  createLabel?: string;
  onCreate?: () => void;
  createDisabled?: boolean;
}

export function PageHeader({ title, description, children, createLabel, onCreate, createDisabled }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {createLabel && (
          <Button onClick={onCreate} disabled={createDisabled} className="bg-[#533afd] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4">
            <Plus className="h-4 w-4 ml-2" />
            {createLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
