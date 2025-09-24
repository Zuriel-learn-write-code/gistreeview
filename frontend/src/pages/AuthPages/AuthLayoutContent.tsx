import React from "react";
import LoaderGis from "../../components/loader";
import { usePreloader } from "../../context/PreloaderContext";
// ThemeTogglerTwo was removed from the project. Provide a small local toggle
// component that toggles the `dark` class on the documentElement. This avoids
// re-adding deleted UI components while keeping the toggle available.
function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(() => document.documentElement.classList.contains('dark'));
  React.useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setIsDark((s) => !s)}
      className="bg-gray-100 dark:bg-gray-700 p-2 rounded shadow"
    >
      {isDark ? 'Dark' : 'Light'}
    </button>
  );
}

interface AuthLayoutContentProps {
  children: React.ReactNode;
}

export default function AuthLayoutContent({
  children,
}: AuthLayoutContentProps) {
  const { showPreloader } = usePreloader();

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      {/* Preloader dengan z-index tertinggi */}
      {showPreloader && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm">
          <LoaderGis />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 h-screen">{children}</div>
      <div className="fixed z-50 bottom-6 right-6 sm:block">
        <ThemeToggle />
      </div>
    </div>
  );
}
