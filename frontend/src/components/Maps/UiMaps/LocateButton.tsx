import React from "react";
import { useTranslation } from 'react-i18next';
import BaseButton from "./BaseButton";

type LocateButtonProps = {
  onToggle: () => void;
  active?: boolean;
  btnSize?: { w?: number; h?: number } | undefined;
  refEl?: React.Ref<HTMLButtonElement>;
};

const LocateButton = React.forwardRef<HTMLButtonElement, Omit<LocateButtonProps, 'refEl'>>(({ onToggle, active, btnSize }, ref) => {
  const { t } = useTranslation();
  return (
    <BaseButton
      ref={ref}
      onClick={onToggle}
      active={active}
      title={active ? t('userMap.help.locate') : t('userMap.activeControls.locate')}
      btnSize={btnSize}
      className={active ? 'ring-2 ring-blue-400' : ''}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 20v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </BaseButton>
  );
});

LocateButton.displayName = 'LocateButton';

export default LocateButton;
