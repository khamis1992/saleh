// Landlord login shell
import { PortalAuthProvider } from '@/providers/PortalAuthContext';
import LandlordLoginPage from '@/pages/portal/landlord/LandlordLoginPage';
import { useLocale } from '@/providers/LocaleContext';

export default function LandlordLoginShell() {
  const { t, tt, dir } = useLocale();
  return (
    <PortalAuthProvider>
      <LandlordLoginPage />
    </PortalAuthProvider>
  );
}
