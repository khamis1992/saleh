// Vendor login shell
import { PortalAuthProvider } from '@/providers/PortalAuthContext';
import VendorLoginPage from '@/pages/portal/vendor/VendorLoginPage';
import { useLocale } from '@/providers/LocaleContext';

export default function VendorLoginShell() {
  const { t, tt, dir } = useLocale();
  return (
    <PortalAuthProvider>
      <VendorLoginPage />
    </PortalAuthProvider>
  );
}
