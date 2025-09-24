import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseButton from './BaseButton';

interface ZoomButtonsProps {
  btnSize?: { w?: number; h?: number };
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomButtons: React.FC<ZoomButtonsProps> = ({ btnSize, onZoomIn, onZoomOut }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1">
      <BaseButton
        onClick={onZoomIn}
        title={t('userMap.controls.zoomIn')}
        btnSize={btnSize}
        className="font-bold"
      >
        +
      </BaseButton>
      <BaseButton
        onClick={onZoomOut}
        title={t('userMap.controls.zoomOut')}
        btnSize={btnSize}
        className="font-bold"
      >
        −
      </BaseButton>
    </div>
  );
};

export default ZoomButtons;