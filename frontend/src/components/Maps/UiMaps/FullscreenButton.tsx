import React from "react";
import { useTranslation } from 'react-i18next';
import BaseButton from './BaseButton';

interface FullscreenButtonProps {
  onToggle: () => void;
  btnSize?: { w?: number; h?: number };
}

const FullscreenButton: React.FC<FullscreenButtonProps> = ({ onToggle, btnSize }) => {
  const { t } = useTranslation();

  return (
    <BaseButton
      onClick={onToggle}
      title={t('userMap.controls.fullscreen')}
      btnSize={btnSize}
    >
      <svg 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-gray-700"
      >
        <rect x="5" y="5" width="4" height="4" fill="currentColor" />
        <rect x="15" y="5" width="4" height="4" fill="currentColor" />
        <rect x="5" y="15" width="4" height="4" fill="currentColor" />
        <rect x="15" y="15" width="4" height="4" fill="currentColor" />
      </svg>
    </BaseButton>
  );
};

export default FullscreenButton;
