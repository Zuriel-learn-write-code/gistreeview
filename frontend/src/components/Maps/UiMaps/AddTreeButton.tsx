import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseButton from './BaseButton';
import AddTreeForm from './AddTreeForm';
import type { Tree } from '../types';

type Props = {
  active: boolean;
  onToggle: () => void;
  btnSize?: { w?: number; h?: number };
  lat?: number | undefined;
  lng?: number | undefined;
  editingTree?: Tree | null;
  onCancel?: () => void;
  onCreated?: () => void;
  onError?: (message: string) => void;
  roadId?: string | undefined;
  roadName?: string | undefined;
  roadPickActive?: boolean;
  onToggleRoadPick?: (v: boolean) => void;
};

const AddTreeButton: React.FC<Props> = ({ active, onToggle, btnSize, lat, lng, editingTree, onCancel, onCreated, roadId, roadName, roadPickActive, onToggleRoadPick, onError }) => {
  const { t } = useTranslation();

  return (
  <div className="inline-block">
      <BaseButton
        onClick={onToggle}
        active={active}
        title={active ? t('userMap.add.cancel') : t('userMap.add.title')}
        btnSize={btnSize}
        className={active ? 'ring-2 ring-blue-400' : ''}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </BaseButton>
      {active ? (
  <div className="absolute right-full mr-2 text-xs text-gray-900 text-right whitespace-nowrap px-3 py-1 rounded bg-white/90 shadow min-w-[140px] sm:w-64"
       style={{ zIndex: 10003, whiteSpace: 'nowrap', top: 0 }}>
          {t('userMap.add.click_map')}
        </div>
      ) : null}

      {/* Panel: Add / Edit tree form lives inside the button component per UI convention */}
    {active ? (
  <div className="absolute right-full mr-2 min-w-[160px] sm:w-64" style={{ zIndex: 30002, overflow: 'visible', top: 0 }}>
          <AddTreeForm
            lat={lat}
            lng={lng}
            editingTree={editingTree}
                      onCancel={onCancel || (() => onToggle())}
                      onCreated={onCreated || (() => onToggle())}
                      onError={onError}
            roadId={roadId}
            roadName={roadName}
            roadPickActive={roadPickActive}
            onToggleRoadPick={onToggleRoadPick}
          />
        </div>
      ) : null}
    </div>
  );
};

export default AddTreeButton;
