import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseButton from './BaseButton';
import PanelBox from './PanelBox';
import { apiUrl } from '../../../config/api';
import type { Tree } from '../types';

type Props = {
  active: boolean;
  onToggle: () => void;
  btnSize?: { w?: number; h?: number };
  // delete panel props
  deleteTreeMode: boolean;
  selectedForDelete: Set<string>;
  setDeleteTreeMode: (v: boolean) => void;
  setSelectedForDelete: React.Dispatch<React.SetStateAction<Set<string>>>;
  setTrees: React.Dispatch<React.SetStateAction<Tree[]>>;
  onDeleted?: (count: number) => void;
  onError?: (message: string) => void;
};

const DeleteTreeButton: React.FC<Props> = ({ active, onToggle, btnSize, deleteTreeMode, selectedForDelete, setDeleteTreeMode, setSelectedForDelete, setTrees, onDeleted, onError }) => {
  const [confirming, setConfirming] = React.useState(false);

  const { t } = useTranslation();

  return (
  <div className="inline-block">
      <BaseButton
        onClick={onToggle}
        active={active}
        title={active ? t('userMap.delete.cancel') : t('userMap.delete.title')}
        btnSize={btnSize}
        className={active ? 'ring-2 ring-blue-400' : ''}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </BaseButton>
      {/* helper moved to top-center info window when deleteTree is active */}
      {deleteTreeMode ? (
        <div className="absolute right-full mr-2 min-w-[160px] sm:w-64" style={{ zIndex: 30002, overflow: 'visible', top: 0 }}>
          <div style={{ maxHeight: '60vh' }}>
            <PanelBox width="w-56 sm:w-64" className="p-2 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <strong>{t('userMap.delete.title')}</strong>
                {/* Close (×) removed intentionally: panel cannot be closed via this button */}
              </div>
                  <div className="flex flex-col gap-2 text-xs sm:text-sm">
                <div className="text-xs text-gray-700 dark:text-gray-300">{t('userMap.delete.selected')}</div>
                <div className="flex flex-col gap-1 max-h-48 overflow-auto">
                  {Array.from(selectedForDelete).map((id) => (
                    <div key={id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <div className="text-xs font-mono truncate" style={{ maxWidth: 300 }}>{id}</div>
                      <button type="button" className="text-red-500 text-xs" onClick={() => {
                        setSelectedForDelete((prev) => {
                          const next = new Set(prev);
                          next.delete(id);
                          return next;
                        });
                      }}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {confirming ? (
                      <>
                      <button type="button" onClick={async () => {
                        if (selectedForDelete.size === 0) {
                          if (typeof onError === 'function') onError(t('userMap.delete.no_selected'));
                          else alert(t('userMap.delete.no_selected'));
                          return;
                        }
                        try {
                          const ids = Array.from(selectedForDelete);
                          for (const id of ids) {
                            await fetch(apiUrl(`/api/trees/${id}`), { method: 'DELETE' });
                          }
                          const tr = await fetch(apiUrl('/api/trees'));
                          if (tr.ok) setTrees(await tr.json());
                          const count = ids.length;
                          setSelectedForDelete(new Set());
                          setDeleteTreeMode(false);
                          setConfirming(false);
                          if (typeof (onDeleted) === 'function') onDeleted(count);
                        } catch (e) { console.error('Failed to delete trees', e); if (typeof onError === 'function') onError('Failed to delete trees'); else alert('Failed to delete trees'); }
                      }} className="px-3 py-1 bg-red-600 text-white rounded">{t('common.delete')}</button>
                      <button type="button" onClick={() => { setConfirming(false); }} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">{t('common.cancel')}</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setConfirming(true)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">{t('common.delete')}</button>
                      <button type="button" onClick={() => { setSelectedForDelete(new Set()); }} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">{t('common.clear')}</button>
                    </>
                  )}
                </div>
              </div>
            </PanelBox>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DeleteTreeButton;
