// Vendor Portal Login — email + cr_number (commercial registration)
// Contractor CR numbers from seed:
// - 1010123456 (شركة البناء المتقدمة - civil)
// - 1010765432 (مؤسسة الكهرباء الحديثة - electrical)
// - 1010111222 (شركة التكييف الموحد - hvac)
// - 1010333444 (مؤسسة التشطيبات الفاخرة - finishing)

import { useState, useEffect } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate, Link } from 'react-router-dom';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { Building2, Mail, Key, Eye, EyeOff, ArrowLeft, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function VendorLoginPage() {
  const { dir } = useLocale();
  const { signInVendor, session } = usePortalAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [cr, setCr] = useState('');
  const [error, setError] = useState('');
  const [showCr, setShowCr] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.portalType === 'vendor') {
      navigate('/portal/vendor', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signInVendor(email.trim(), cr.trim());
    if (error) {
      setError(error);
    } else {
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/portal/vendor');
    }
    setSubmitting(false);
  };

  const fillDemo = (em: string, crVal: string) => {
    setEmail(em);
    setCr(crVal);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-50 flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-md">
        <Link to="/portal" className="flex items-center gap-1 text-sm text-[#64748d] hover:text-[#061b31] mb-4">
          <ArrowLeft className="h-4 w-4" />
          بوابات أخرى
        </Link>
        <Card className="border-2 border-amber-100 shadow-lg">
          <CardHeader className="text-center space-y-3 pb-4">
            <div className="mx-auto h-14 w-14 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px]">
              <Building2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#061b31]">بوابة المقاول</CardTitle>
            <CardDescription className="text-[13px] text-[#64748d]">
              تابع عقودك، قدّم عروض الأسعار، وأدر مطالبات الدفع
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-[#ea2261] text-xs p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">{tt('hr.email', 'البريد الإلكتروني')}</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
                  <Input
                    type="email"
                    placeholder="info@buildco.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10 h-10 text-[13px]"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">السجل التجاري</Label>
                <div className="relative">
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
                  <Input
                    type={showCr ? 'text' : 'password'}
                    placeholder="1010123456"
                    value={cr}
                    onChange={(e) => setCr(e.target.value)}
                    className="pr-10 pl-10 h-10 text-[13px]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCr(!showCr)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d] hover:text-[#64748d]"
                  >
                    {showCr ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-[#64748d]">رقم السجل التجاري المسجل لدينا</p>
              </div>
              <Button type="submit" className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-[13px] font-semibold" disabled={submitting}>
                {submitting ? 'جاري الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-5 p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="h-3.5 w-3.5 text-[#9b6829]" />
                <p className="text-xs font-semibold text-[#9b6829]">حسابات تجريبية (اضغط للتعبئة):</p>
              </div>
              <div className="space-y-1">
                <button type="button" onClick={() => fillDemo('info@buildco.com', '1010123456')} className="block w-full text-right text-xs text-gray-700 hover:text-[#9b6829] hover:bg-white px-2 py-1 rounded">
                  • info@buildco.com / 1010123456 (البناء المتقدمة)
                </button>
                <button type="button" onClick={() => fillDemo('info@elec.com', '1010765432')} className="block w-full text-right text-xs text-gray-700 hover:text-[#9b6829] hover:bg-white px-2 py-1 rounded">
                  • info@elec.com / 1010765432 (الكهرباء الحديثة)
                </button>
                <button type="button" onClick={() => fillDemo('info@hvac.com', '1010111222')} className="block w-full text-right text-xs text-gray-700 hover:text-[#9b6829] hover:bg-white px-2 py-1 rounded">
                  • info@hvac.com / 1010111222 (التكييف الموحد)
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
