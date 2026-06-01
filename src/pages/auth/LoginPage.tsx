import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/providers/AuthContext';
import { useLocale } from '@/providers/LocaleContext';

export default function LoginPage() {
  const { user, signIn, loading } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message || 'فشل تسجيل الدخول');
    } else {
      navigate('/dashboard');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{t.app.name}</CardTitle>
          <CardDescription>{t.auth.welcome}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>{t.auth.email}</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.auth.password}</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t.common.loading : t.auth.loginButton}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary">{t.auth.forgotPassword}</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
