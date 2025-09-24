import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();
  const current = i18n.language || (typeof window !== 'undefined' ? localStorage.getItem('lang') || 'en' : 'en');
  const change = (lng: string) => {
    try {
      i18n.changeLanguage(lng);
      localStorage.setItem('lang', lng);
    } catch { /* ignore */ }
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <button
        onClick={() => change('en')}
        aria-label="English"
        className={`w-8 h-8 flex items-center justify-center rounded-full overflow-hidden ${current === 'en' ? 'ring-2 ring-offset-1 ring-blue-400' : ''}  bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-transparent shadow-sm`}
      >
        <div className="w-full h-full flex items-center justify-center p-[2px]">
          <img src="/icons/flag-english.svg" alt="EN" className="max-w-[78%] max-h-[78%] object-contain" />
        </div>
      </button>
      <button
        onClick={() => change('id')}
        aria-label="Indonesia"
        className={`w-8 h-8 flex items-center justify-center rounded-full overflow-hidden ${current === 'id' ? 'ring-2 ring-offset-1 ring-blue-400' : ''} bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-transparent shadow-sm`}
      >
        <div className="w-full h-full flex items-center justify-center p-[2px]">
          <img src="/icons/flag-indonesia.svg" alt="ID" className="max-w-[78%] max-h-[78%] object-contain" />
        </div>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
