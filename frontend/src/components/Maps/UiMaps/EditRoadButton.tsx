import React from "react";
import { useTranslation } from 'react-i18next';
import BaseButton from "./BaseButton";

type EditRoadButtonProps = {
  onToggle: () => void;
  active?: boolean;
  btnSize?: { w?: number; h?: number } | undefined;
};

const EditRoadButton: React.FC<EditRoadButtonProps> = ({ onToggle, active, btnSize }) => {
  const { t } = useTranslation();
  return (
    <BaseButton
      onClick={onToggle}
      active={active}
      title={active ? t('userMap.editRoad.exit') : t('userMap.editRoad.title')}
      btnSize={btnSize}
      className={active ? "ring-2 ring-blue-400" : ""}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
        <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
      </svg>
    </BaseButton>
  );
};

export default EditRoadButton;
