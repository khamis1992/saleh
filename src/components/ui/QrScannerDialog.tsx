import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Scan, X } from 'lucide-react';

interface QrScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

export function QrScannerDialog({ open, onClose, onScan, title = 'مسح الرمز' }: QrScannerDialogProps) {
  const [error, setError] = useState('');

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes.length > 0) {
      const result = detectedCodes[0].rawValue;
      if (result) {
        onScan(result);
        onClose();
      }
    }
  };

  const handleError = (err: any) => {
    setError(err?.message || 'تعذر الوصول إلى الكاميرا');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setError('')} className="rounded-lg">
                إعادة المحاولة
              </Button>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border-2 border-gray-200">
              <Scanner
                onScan={handleScan}
                onError={handleError}
                styles={{ container: { width: '100%', aspectRatio: '1' } as any }}
              />
            </div>
          )}
          <p className="text-xs text-gray-400 text-center">وجه الكاميرا نحو الرمز للمسح التلقائي</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
