import { useLocale } from '@/providers/LocaleContext';
import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ComingSoonPageProps {
  moduleName?: string;
}

export default function ComingSoonPage({ moduleName }: ComingSoonPageProps) {
  const { t } = useLocale();
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
      <Card className="max-w-md w-full text-center border-dashed">
        <CardContent className="py-12 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Construction className="h-10 w-10 text-amber-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold">
              {moduleName 
                ? `${moduleName} - هذه الميزة ستكون متاحة في المرحلة القادمة`
                : 'هذه الميزة ستكون متاحة في المرحلة القادمة'
              }
            </h2>
            <p className="text-sm text-muted-foreground">
              سيتم تفعيل هذا القسم ضمن خطة تطوير النظام لاحقاً.
            </p>
          </div>
          
          <Link to="/">
            <Button variant="outline">
              {t.common.back} / {t.dashboard.title}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
