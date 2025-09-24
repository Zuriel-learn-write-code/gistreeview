import { useState } from 'react';

type RoadStatusMap = Record<'primary'|'secondary'|'tertiary'|'unknown', boolean>;
type TreeStatusMap = Record<'good'|'warning'|'danger', boolean>;

import { useTranslation } from 'react-i18next';
import BaseButton from './BaseButton';
import PanelBox from './PanelBox';

export default function StatusFilterButton({
  filters,
  onChange,
  btnSize,
  open,
  onOpenChange,
}: {
  filters: { roads: RoadStatusMap; trees: TreeStatusMap };
  onChange: (f: { roads: RoadStatusMap; trees: TreeStatusMap }) => void;
  btnSize?: { w?: number; h?: number };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open !== 'undefined';
  const currentOpen = isControlled ? open : internalOpen;
  const setOpenState = (v: boolean) => { if (typeof onOpenChange === 'function') onOpenChange(v); if (!isControlled) setInternalOpen(v); };

  const toggleRoad = (k: keyof RoadStatusMap) => {
    const next = { ...filters, roads: { ...filters.roads, [k]: !filters.roads[k] } };
    onChange(next);
  };

  const toggleTree = (k: keyof TreeStatusMap) => {
    const next = { ...filters, trees: { ...filters.trees, [k]: !filters.trees[k] } };
    onChange(next);
  };

  const { t } = useTranslation();

  return (
    <div className="inline-block">
      <BaseButton
        onClick={() => setOpenState(!currentOpen)}
        title={t('userMap.activeControls.filters')}
        btnSize={btnSize}
        active={currentOpen}
        className={currentOpen ? 'ring-2 ring-blue-400' : ''}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 18h4v-2h-4v2zm-6-8h16v2H4v-2zm2-6h12v2H6V4z" fill="currentColor" />
        </svg>
      </BaseButton>
      {currentOpen ? (
        <div className="absolute left-full ml-2" style={{ zIndex: 10002, top: 0 }}>
          <PanelBox width="w-56 sm:w-64" className="p-2 sm:p-3">
            <div className="text-xs font-semibold mb-2">{t('userMap.filters.showRoad')}</div>
            <div className="flex flex-col gap-1 text-xs sm:text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={filters.roads.primary} onChange={() => toggleRoad('primary')} />
              <span>{t('userMap.filters.roads.primary')}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={filters.roads.secondary} onChange={() => toggleRoad('secondary')} />
              <span>{t('userMap.filters.roads.secondary')}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={filters.roads.tertiary} onChange={() => toggleRoad('tertiary')} />
              <span>{t('userMap.filters.roads.tertiary')}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={filters.roads.unknown} onChange={() => toggleRoad('unknown')} />
              <span>{t('userMap.filters.roads.unknown')}</span>
            </label>
          </div>

          <div style={{ height: 8 }} />

          <div className="text-xs font-semibold mb-2">{t('userMap.filters.showTree')}</div>
          <div className="flex flex-col gap-1 text-xs sm:text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={filters.trees.good} onChange={() => toggleTree('good')} />
              <span>{t('userMap.filters.trees.good')}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={filters.trees.warning} onChange={() => toggleTree('warning')} />
              <span>{t('userMap.filters.trees.warning')}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={filters.trees.danger} onChange={() => toggleTree('danger')} />
              <span>{t('userMap.filters.trees.danger')}</span>
            </label>
            </div>
          </PanelBox>
        </div>
      ) : null}
    </div>
  );
}
