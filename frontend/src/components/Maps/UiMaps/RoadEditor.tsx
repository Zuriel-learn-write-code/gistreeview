import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PanelBox from './PanelBox';
import PALETTE from './palette';
import { apiUrl } from '../../../config/api';

type RoadProps = { nameroad?: string; color?: string; status?: string };
type Props = {
  editingRoadId: string | null;
  editingProps: RoadProps;
  setEditingRoadId: (id: string | null) => void;
  setEditingProps: React.Dispatch<React.SetStateAction<RoadProps>>;
  roadsGeoJson: GeoJSON.FeatureCollection | null;
  setRoadsGeoJson: React.Dispatch<React.SetStateAction<GeoJSON.FeatureCollection | null>>;
  setRoadsVersion: React.Dispatch<React.SetStateAction<number>>;
  onError?: (message: string) => void;
};

const RoadEditor: React.FC<Props> = ({ editingRoadId, editingProps, setEditingRoadId, setEditingProps, roadsGeoJson, setRoadsGeoJson, setRoadsVersion, onError }) => {
  const { t } = useTranslation();
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!editingRoadId) return null;

  return (
    <div className="absolute left-3" style={{ top: 200, zIndex: 10000 }}>
  <PanelBox width="w-56 sm:w-64" className="p-2 sm:p-3">
        <div className="flex items-center justify-between mb-2">
          <strong className="text-sm sm:text-base">{t('userMap.editRoad.title')}</strong>
          <button className="text-sm text-gray-500 dark:text-gray-300" onClick={() => { setEditingRoadId(null); setEditingProps({}); }} type="button">✕</button>
        </div>
        <div className="flex flex-col gap-2 text-xs sm:text-sm">
          <div className="text-xs text-gray-700 dark:text-gray-300">{t('common.id')}: <span className="font-mono text-xs text-gray-800 dark:text-gray-300">{editingRoadId}</span></div>
          <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.editRoad.nameLabel')}</label>
          <input className="border p-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs sm:text-sm" value={editingProps.nameroad || ''} onChange={(e) => setEditingProps((s) => ({ ...s, nameroad: e.target.value }))} />
          <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.editRoad.colorLabel')}</label>
          <div className="grid grid-cols-5 gap-2">
            {PALETTE.map((sw) => (
              <button key={sw} type="button" onClick={() => setEditingProps((s) => ({ ...s, color: sw }))} title={sw} className={`w-6 h-6 rounded border ${editingProps.color === sw ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`} style={{ background: sw }} aria-label={`Select color ${sw}`} />
            ))}
          </div>
          <label className="text-xs text-gray-600 mt-2 dark:text-gray-300">{t('userMap.editRoad.statusLabel')}</label>
          <select className="border p-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs sm:text-sm" value={editingProps.status || 'unknown'} onChange={(e) => setEditingProps((s) => ({ ...s, status: e.target.value }))}>
            <option value="primary">{t('userMap.editRoad.statusOptions.primary')}</option>
            <option value="secondary">{t('userMap.editRoad.statusOptions.secondary')}</option>
            <option value="tertiary">{t('userMap.editRoad.statusOptions.tertiary')}</option>
            <option value="unknown">{t('userMap.editRoad.statusOptions.unknown')}</option>
          </select>
          <div className="flex gap-2 mt-2">
            <button className="px-2 py-1 text-xs sm:px-3 sm:py-1 bg-blue-500 text-white rounded" onClick={async () => {
              try {
                const body: { nameroad?: string; color?: string; status?: string } = { nameroad: editingProps.nameroad };
                if (editingProps.color) body.color = editingProps.color;
                if (editingProps.status) body.status = editingProps.status;
                const res = await fetch(apiUrl(`/api/roads/${editingRoadId}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                if (!res.ok) throw new Error('update failed');
                const r = await fetch(apiUrl('/api/roads/geojson'));
                if (r.ok) setRoadsGeoJson(await r.json());
                try {
                  if (roadsGeoJson && Array.isArray(roadsGeoJson.features)) {
                    const updated = { ...roadsGeoJson } as GeoJSON.FeatureCollection;
                    updated.features = updated.features.map((f) => {
                      const p = (f.properties || {}) as Record<string, unknown>;
                      if (String((p as unknown as Record<string, unknown>).id || f.id) === String(editingRoadId)) {
                        const newProps = { ...p, nameroad: editingProps.nameroad, color: editingProps.color, status: editingProps.status } as Record<string, unknown>;
                        return { ...f, properties: newProps } as GeoJSON.Feature;
                      }
                      return f;
                    });
                    setRoadsGeoJson(updated);
                    setRoadsVersion((v) => v + 1);
                  }
                } catch (e) { void e; }
                setSaveStatus(t('userMap.editRoad.savedMessage'));
                setTimeout(() => setSaveStatus(null), 2000);
                setEditingRoadId(null);
                setEditingProps({});
              } catch (err) {
                console.error('Failed to update road', err);
                setSaveStatus(t('userMap.editRoad.failedMessage'));
                if (typeof onError === 'function') onError(t('userMap.editRoad.failedMessage'));
                else alert(t('userMap.editRoad.failedMessage'));
              }
            }} type="button">Save</button>
            <button className="px-3 py-1 bg-gray-200 dark:bg-gray-600 dark:text-gray-100 rounded" onClick={() => { setEditingRoadId(null); setEditingProps({}); }} type="button">{t('common.cancel')}</button>
          </div>
          {saveStatus ? <div className="text-xs text-green-600">{saveStatus}</div> : null}
        </div>
      </PanelBox>
    </div>
  );
};

export default RoadEditor;
