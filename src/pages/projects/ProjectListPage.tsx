import ModernProjectsTab from '@/components/projects/ModernProjectsTab';
import { useLocale } from '@/providers/LocaleContext';

export default function ProjectListPage() {
  const { dir } = useLocale();
  return (
    <div className="min-h-full bg-[#f6f9fc]" dir={dir}>
      <ModernProjectsTab />
    </div>
  );
}
