// Tenant portal route shell — wraps all tenant routes in PortalLayout + PortalAuthProvider
import { PortalAuthProvider } from '@/providers/PortalAuthContext';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Outlet } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';

export default function TenantPortalShell() {
  const { t, tt, dir } = useLocale();
  return (
    <PortalAuthProvider>
      <PortalLayout portalType="tenant">
        <Outlet />
      </PortalLayout>
    </PortalAuthProvider>
  );
}
