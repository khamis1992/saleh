// Landlord Portal Login — email + property_code
// The "landlord" is the property owner. For the demo, the property_code is the link.
// Property codes from seed: PROP-001 through PROP-004

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

export default function LandlordLoginPage() {
  const { dir } = useLocale();
  const { signInLandlord, session } = usePortalAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.portalType === 'landlord') {
      navigate('/portal/landlord', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signInLandlord(email.trim(), code.trim());
    if (error) {
      setError(error);
    } else {
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/portal/landlord');
    }
    setSubmitting(false);
  };

  const fillDemo = (em: string, cd: string) => {
    setEmail(em);
    setCode(cd);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-md">
        <Link to="/portal" className="flex items-center gap-1 text-sm text-[#64748d] hover:text-[#061b31] mb-4">
          <ArrowLeft className="h-4 w-4" />
          بوابات أخرى
        </Link>
        <Card className="border-2 border-emerald-100 shadow-lg">
          <CardHeader className="text-center space-y-3 pb-4">
            <div className="mx-auto h-14 w-14 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px]">
              <Building2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#061b31]">بوابة المالك</CardTitle>
            <CardDescription className="text-[13px] text-[#64748d]">
              تابع أداء محفظتك العقارية وإيرادات عقاراتك
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
                    placeholder="owner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10 h-10 text-[13px]"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{tt('properties.code', 'كود العقار')}</Label>
                <div className="relative">
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
                  <Input
                    type={showCode ? 'text' : 'password'}
                    placeholder="PROP-001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pr-10 pl-10 h-10 text-[13px]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d] hover:text-[#64748d]"
                  >
                    {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-[#64748d]">كود العقار الذي تتابعه (PROP-001، PROP-002، إلخ)</p>
              </div>
              <Button type="submit" className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-[13px] font-semibold" disabled={submitting}>
                {submitting ? 'جاري الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-5 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700">حسابات تجريبية (اضغط للتعبئة):</p>
              </div>
              <div className="space-y-1">
                <button type="button" onClick={() => fillDemo('owner@alnoor.com', 'PROP-001')} className="block w-full text-right text-xs text-gray-700 hover:text-emerald-600 hover:bg-white px-2 py-1 rounded">
                  • owner@alnoor.com / PROP-001 (عمارة النخيل)
                </button>
                <button type="button" onClick={() => fillDemo('owner@alsalam.com', 'PROP-002')} className="block w-full text-right text-xs text-gray-700 hover:text-emerald-600 hover:bg-white px-2 py-1 rounded">
                  • owner@alsalam.com / PROP-002 (أبراج السلام)
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
