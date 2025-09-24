import React from "react";
import GridShape from "../../components/common/GridShape";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import UserMaps from "../../components/Maps/UserMaps";
import LanguageSwitcher from "../../components/i18n/LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import {
  PreloaderProvider,
  usePreloader,
} from "../../context/PreloaderContext";
import LoaderGis from "../../components/ui/loader/loader";

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const { showPreloader } = usePreloader();
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      {showPreloader && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50">
          <LoaderGis />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 h-screen">
        {/* Sisi kiri: 1/4 untuk form login/register */}
        <div className="flex flex-col justify-center items-center px-6 py-8 lg:col-span-1 bg-white dark:bg-gray-900 z-10">
          {/* Logo di atas form */}
          <div className="mb-8 flex justify-center w-full">
            <img
              src="/images/logo/logo.png"
              alt={t('auth.logoAlt')}
              className="block dark:hidden h-14 w-auto"
            />
            <img
              src="/images/logo/logo-dark.png"
              alt={t('auth.logoAltDark')}
              className="hidden dark:block h-14 w-auto"
            />
          </div>
          <div className="w-full max-w-md">{children}</div>
        </div>
        {/* Sisi kanan: 3/4 untuk peta auth */}
        <div className="hidden lg:col-span-3 lg:flex bg-brand-950 dark:bg-white/5 relative h-screen w-full overflow-hidden">
          <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
            <GridShape />
          </div>
          <div className="relative z-10 w-full h-full flex flex-col">
            {/* Swap the lightweight auth Leaflet map with the full `UserMaps` component */}
            <UserMaps height="100%" />
          </div>
        </div>
      </div>
      {/* Theme toggler tetap di kanan bawah */}
      <div className="fixed z-50 bottom-6 right-6 sm:block">
        <ThemeTogglerTwo />
      </div>
      {/* Language switcher (flags) di kiri bawah */}
      <div className="fixed z-50 bottom-6 left-6">
        <LanguageSwitcher />
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PreloaderProvider>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </PreloaderProvider>
  );
}
