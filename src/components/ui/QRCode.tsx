import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 128, className }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#111827', light: '#FFFFFF' },
    });
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

interface QRCodePrintableProps {
  value: string;
  label: string;
  sublabel?: string;
  size?: number;
}

export function QRCodePrintable({ value, label, sublabel, size = 180 }: QRCodePrintableProps) {
  return (
    <div className="inline-flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm print:border print:shadow-none">
      <QRCode value={value} size={size} />
      <div className="text-center">
        <p className="text-sm font-bold text-gray-800">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}
