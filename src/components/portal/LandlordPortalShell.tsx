// Landlord portal route shell
import { PortalAuthProvider } from '@/providers/PortalAuthContext';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Outlet } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';

export default function LandlordPortalShell() {
  const { t, tt, dir } = useLocale();
  return (
    <PortalAuthProvider>
      <PortalLayout portalType="landlord">
        <Outlet />
      </PortalLayout>
    </PortalAuthProvider>
  );
}
