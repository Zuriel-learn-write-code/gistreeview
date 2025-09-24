import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseButton from './BaseButton';
import AddTreeForm from './AddTreeForm';
import type { Tree } from '../types';

type Props = {
  active: boolean;
  onToggle: () => void;
  btnSize?: { w?: number; h?: number };
  // When editing, the parent will provide whether the edit form should be shown and which tree is being edited
  showEditForm?: boolean;
  editingTree?: Tree | null;
  onCancel?: () => void;
  onCreated?: () => void;
  onError?: (message: string) => void;
  roadId?: string | undefined;
  roadName?: string | undefined;
  roadPickActive?: boolean;
  onToggleRoadPick?: (v: boolean) => void;
};

const EditTreeButton: React.FC<Props> = ({ active, onToggle, btnSize, showEditForm, editingTree, onCancel, onCreated, roadId, roadName, roadPickActive, onToggleRoadPick, onError }) => {
  const { t } = useTranslation();
  return (
  <div className="inline-block">
      <BaseButton
        onClick={onToggle}
        active={active}
        title={active ? t('userMap.editTree.disable') : t('userMap.editTree.enable')}
        btnSize={btnSize}
        className={active ? 'ring-2 ring-blue-400' : ''}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 21l3-3 11-11 3 3L20 21H3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
          <path d="M14 7l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </BaseButton>
      {/* helper moved to top-center info window when editTree is active */}

      {/* When the parent requests the edit form shown, render AddTreeForm in edit mode */}
      {showEditForm && editingTree ? (
        <div className="absolute right-full mr-2 min-w-[160px] sm:w-64" style={{ zIndex: 30002, overflow: 'visible', top: 0 }}>
          <AddTreeForm
            lat={editingTree.latitude ? Number(editingTree.latitude) : undefined}
            lng={editingTree.longitude ? Number(editingTree.longitude) : undefined}
            editingTree={editingTree}
              onCancel={onCancel || (() => {})}
              onCreated={onCreated || (() => {})}
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

export default EditTreeButton;
