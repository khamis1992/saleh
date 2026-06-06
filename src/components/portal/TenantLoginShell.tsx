// Tenant login shell
import { PortalAuthProvider } from '@/providers/PortalAuthContext';
import TenantLoginPage from '@/pages/portal/tenant/TenantLoginPage';
import { useLocale } from '@/providers/LocaleContext';

export default function TenantLoginShell() {
  const { t, tt, dir } = useLocale();
  return (
    <PortalAuthProvider>
      <TenantLoginPage />
    </PortalAuthProvider>
  );
}
