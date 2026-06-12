// Tenant Portal Login — email + tenant_code
// Both fields are looked up against the seedTenant data
// The tenant_code from seed data: TNT-001 through TNT-005
// Emails from seed: ahmed@email.com, sara@email.com, info@alnoor.com, fahad@email.com, noura@email.com

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

export default function TenantLoginPage() {
  const { dir } = useLocale();
  const { signInTenant, session } = usePortalAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.portalType === 'tenant') {
      navigate('/portal/tenant', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signInTenant(email.trim(), code.trim());
    if (error) {
      setError(error);
    } else {
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/portal/tenant');
    }
    setSubmitting(false);
  };

  const fillDemo = (em: string, cd: string) => {
    setEmail(em);
    setCode(cd);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-md">
        <Link to="/portal" className="flex items-center gap-1 text-sm text-[#64748d] hover:text-[#061b31] mb-4">
          <ArrowLeft className="h-4 w-4" />
          بوابات أخرى
        </Link>
        <Card className="border-2 border-blue-100 shadow-lg">
          <CardHeader className="text-center space-y-3 pb-4">
            <div className="mx-auto h-14 w-14 rounded-lg bg-[#533afd] flex items-center justify-center text-white shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px]">
              <Building2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#061b31]">بوابة المستأجر</CardTitle>
            <CardDescription className="text-[13px] text-[#64748d]">
              سجل دخولك للوصول إلى عقدك وفواتيرك وطلبات الصيانة
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
                    placeholder="ahmed@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10 h-10 text-[13px]"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{tt('tenants.code', 'كود المستأجر')}</Label>
                <div className="relative">
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
                  <Input
                    type={showCode ? 'text' : 'password'}
                    placeholder="TNT-001"
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
                <p className="text-xs text-[#64748d]">ستجد الكود في رسالة الترحيب من إدارة العقار</p>
              </div>
              <Button type="submit" className="w-full h-10 bg-[#533afd] hover:bg-blue-700 text-[13px] font-semibold" disabled={submitting}>
                {submitting ? 'جاري الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-5 p-3 bg-[rgba(83,58,253,0.06)]/50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="h-3.5 w-3.5 text-[#533afd]" />
                <p className="text-xs font-semibold text-[#533afd]">حسابات تجريبية (اضغط للتعبئة):</p>
              </div>
              <div className="space-y-1">
                <button type="button" onClick={() => fillDemo('ahmed@email.com', 'TNT-001')} className="block w-full text-right text-xs text-gray-700 hover:text-[#533afd] hover:bg-white px-2 py-1 rounded">
                  • ahmed@email.com / TNT-001
                </button>
                <button type="button" onClick={() => fillDemo('sara@email.com', 'TNT-002')} className="block w-full text-right text-xs text-gray-700 hover:text-[#533afd] hover:bg-white px-2 py-1 rounded">
                  • sara@email.com / TNT-002
                </button>
                <button type="button" onClick={() => fillDemo('info@alnoor.com', 'TNT-003')} className="block w-full text-right text-xs text-gray-700 hover:text-[#533afd] hover:bg-white px-2 py-1 rounded">
                  • info@alnoor.com / TNT-003
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
