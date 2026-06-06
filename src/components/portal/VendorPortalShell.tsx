// Vendor portal route shell
import { PortalAuthProvider } from '@/providers/PortalAuthContext';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Outlet } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';

export default function VendorPortalShell() {
  const { t, tt, dir } = useLocale();
  return (
    <PortalAuthProvider>
      <PortalLayout portalType="vendor">
        <Outlet />
      </PortalLayout>
    </PortalAuthProvider>
  );
}
