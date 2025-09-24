import React from 'react';
import { useTranslation } from 'react-i18next';
import FullscreenButton from './FullscreenButton';
import ZoomButtons from './ZoomButtons';
import LayerPicker from './LayerPicker';
import LocateButton from './LocateButton';
import PanelBox from './PanelBox';
import EditRoadButton from './EditRoadButton';
import StatusFilterButton from './StatusFilterButton';
import AddTreeButton from './AddTreeButton';
import EditTreeButton from './EditTreeButton';
import DeleteTreeButton from './DeleteTreeButton';
import PALETTE from './palette';
import { apiUrl } from '../../../config/api';

export type BaseLayer = "osm" | "carto" | "transport" | "topo" | "dark";

type TreeRecord = { id?: string; latitude?: number | string; longitude?: number | string; status?: string; species?: string };

type RoadFeatureProperties = {
  id?: string | number;
  uuid?: string;
  nameroad?: string;
  name?: string;
  color?: string;
  status?: string;
  description?: string;
  treesCount?: number;
  roadPictures?: Array<{ id?: string; url?: string }>;
};

type FiltersType = { roads: { primary: boolean; secondary: boolean; tertiary: boolean; unknown: boolean }; trees: { good: boolean; warning: boolean; danger: boolean } };

type Props = {
  role: 'admin' | 'officer' | 'user' | null;
  toggleFullscreen: () => void;
  btnSize?: { w?: number; h?: number };
  mapInstance?: import('leaflet').Map | null;
  activeControl: string | null;
  setExclusiveControl: (s: string | null) => void;
  baseLayer: BaseLayer;
  setBaseLayer: (b: BaseLayer) => void;
  showAlert: (v: 'success'|'error'|'warning'|'info', title: string, message: string) => void;
  locateRef?: React.Ref<HTMLButtonElement>;
  handleLocate: () => void;
  locateMode: boolean;
  coordBoxLatLng: { lat: number; lng: number } | null;
  setCoordBoxLatLng: (p: { lat: number; lng: number } | null) => void;
  shortenId: (s?: string | null) => string;
  editMode: boolean;
  editingRoadId?: string | null;
  setEditingRoadId: (id: string | null) => void;
  editingProps: { nameroad?: string; color?: string; status?: string };
  setEditingProps: (p: { nameroad?: string; color?: string; status?: string }) => void;
  roadsGeoJson?: GeoJSON.FeatureCollection | null;
  setRoadsGeoJson: (g: GeoJSON.FeatureCollection | null) => void;
  setRoadsVersion: (n: number | ((n:number)=>number)) => void;
  saveStatus?: string | null;
  setSaveStatus: (s: string | null) => void;
  setEditMode: (v: boolean) => void;
  activateControl: (s: string | null) => void;
  filters: FiltersType;
  setFilters: (f: FiltersType) => void;
  editMessage?: string | null;
  pickedLatLng?: { lat: number; lng: number } | null;
  setAddTreeMode: (v: boolean) => void;
  setEditTreeMode: (v: boolean) => void;
  setShowEditForm: (v: boolean) => void;
  setPickedLatLng: (p: { lat: number; lng: number } | null) => void;
  setPickedRoadId: (id: string | null) => void;
  setPickedRoadName: (n: string | null) => void;
  setEditingTree: (t: TreeRecord | null) => void;
  setRoadPickMode: (v: boolean) => void;
  handleTreeCreated: () => Promise<void> | void;
  pickedRoadId?: string | null;
  pickedRoadName?: string | null;
  editingTree?: TreeRecord | null;
  setSelectedForDelete: React.Dispatch<React.SetStateAction<Set<string>>>;
  setDeleteTreeMode: (v: boolean) => void;
  selectedForDelete: Set<string>;
  setTrees: React.Dispatch<React.SetStateAction<TreeRecord[]>>;
  deleteTreeMode: boolean;
};

const MapControls: React.FC<Props> = (props) => {
  const {
    role,
    toggleFullscreen,
    btnSize,
    mapInstance,
    activeControl,
    setExclusiveControl,
    baseLayer,
    setBaseLayer,
    showAlert,
    locateRef,
    handleLocate,
    locateMode,
    coordBoxLatLng,
    setCoordBoxLatLng,
    shortenId,
    editMode,
    editingRoadId,
    setEditingRoadId,
    editingProps,
    setEditingProps,
    roadsGeoJson,
    setRoadsGeoJson,
    setRoadsVersion,
    saveStatus,
    setSaveStatus,
    setEditMode,
    activateControl,
    filters,
    setFilters,
    editMessage,
    pickedLatLng,
    setAddTreeMode,
    setEditTreeMode,
    setShowEditForm,
    setPickedLatLng,
    setPickedRoadId,
    setPickedRoadName,
    setEditingTree,
    setRoadPickMode,
    handleTreeCreated,
    pickedRoadId,
    pickedRoadName,
    editingTree,
    setSelectedForDelete,
    setDeleteTreeMode,
    selectedForDelete,
    setTrees,
    deleteTreeMode,
  } = props;

  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col gap-2 absolute left-3" style={{ top: 10, zIndex: 10000 }}>
        <div>
          <FullscreenButton onToggle={toggleFullscreen} btnSize={btnSize} />
        </div>
        <div>
          <ZoomButtons
            btnSize={btnSize}
            onZoomIn={() => mapInstance?.zoomIn()}
            onZoomOut={() => mapInstance?.zoomOut()}
          />
        </div>

        {role !== null ? (
          <>
            <div className="mt-2">
              <LayerPicker baseLayer={baseLayer} onChange={(v: BaseLayer) => { setBaseLayer(v); showAlert('info', t('userMap.alerts.layerSwitchedTitle'), t('userMap.alerts.layerSwitchedMessage', { layer: v })); }} btnSize={btnSize} open={activeControl === 'layers'} onOpenChange={(v: boolean) => setExclusiveControl(v ? 'layers' : null)} />
            </div>

            <div className="mt-2">
              <LocateButton
                ref={locateRef}
                onToggle={() => { handleLocate(); }}
                active={activeControl === 'locate'}
                btnSize={btnSize}
              />
              {locateMode && coordBoxLatLng ? (
                <div className="absolute left-full ml-2" style={{ zIndex: 10001, top: 0 }}>
                  <PanelBox width="w-56 sm:w-64" className="p-2 sm:p-3">
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">{t('userMap.coordinates.title')}</strong>
                      <button className="text-sm text-gray-500 dark:text-gray-300" onClick={() => { setCoordBoxLatLng(null); }} type="button">✕</button>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">{t('userMap.coordinates.lat')}: <span className="font-mono text-gray-800 dark:text-gray-200">{coordBoxLatLng.lat.toFixed(6)}</span></div>
                    <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">{t('userMap.coordinates.lng')}: <span className="font-mono text-gray-800 dark:text-gray-200">{coordBoxLatLng.lng.toFixed(6)}</span></div>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-xs sm:px-3 sm:py-1 bg-blue-500 text-white rounded" onClick={() => {
                        try { const txt = `${coordBoxLatLng.lat},${coordBoxLatLng.lng}`; void navigator.clipboard.writeText(txt); showAlert('success', t('userMap.coordinates.copiedTitle'), t('userMap.coordinates.copiedMessage')); } catch (e) { void e; showAlert('error', t('userMap.coordinates.copyFailedTitle'), t('userMap.coordinates.copyFailedMessage')); }
                      }}>{t('common.copy')}</button>
                      <button className="px-2 py-1 text-xs sm:px-3 sm:py-1 bg-gray-200 dark:bg-gray-600 dark:text-gray-100 rounded" onClick={() => { setCoordBoxLatLng(null); }}>{t('common.close')}</button>
                    </div>
                  </PanelBox>
                </div>
              ) : null}
            </div>

            {(role === 'officer' || role === 'admin') && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <EditRoadButton onToggle={() => {
                    const turningOn = activeControl !== 'editRoad';
                    setExclusiveControl(turningOn ? 'editRoad' : null);
                    setEditMode(turningOn);
                    if (!turningOn) setEditingRoadId(null);
                  }} active={activeControl === 'editRoad'} btnSize={btnSize} />
                </div>

                {editMode && editingRoadId ? (
                  <div className="absolute left-full ml-2" style={{ zIndex: 10001, top: 0 }}>
                    <PanelBox width="w-56 sm:w-64" className="p-2 sm:p-3">
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-sm sm:text-base">{t('userMap.editRoad.title')}</strong>
                          <button className="text-sm text-gray-500" onClick={() => { setEditingRoadId(null); setEditingProps({}); activateControl(null); }} type="button">✕</button>
                      </div>
                      <div className="flex flex-col gap-2 text-xs sm:text-sm">
                        <div className="text-xs text-gray-700 dark:text-gray-300">{t('userMap.editRoad.idLabel')}
                          <span title={editingRoadId || undefined} className="font-mono text-gray-800 dark:text-gray-300">
                            <span className="inline sm:hidden text-xs">{shortenId(editingRoadId)}</span>
                            <span className="hidden sm:inline text-xs">{String(editingRoadId || '')}</span>
                          </span>
                        </div>
                        <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.editRoad.nameLabel')}</label>
                        <input className="border p-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs sm:text-sm" value={editingProps.nameroad || ''} onChange={(e) => setEditingProps({ ...editingProps, nameroad: e.target.value })} />
                        <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.editRoad.colorLabel')}</label>
                        <div className="grid grid-cols-5 gap-2">
                          {PALETTE.map((sw: string) => (
                            <button key={sw} type="button" onClick={() => setEditingProps({ ...editingProps, color: sw })} title={sw} aria-label={`Select color ${sw}`} className={`w-6 h-6 rounded border ${editingProps.color === sw ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`} style={{ background: sw }} />
                          ))}
                        </div>
                        <label className="text-xs text-gray-600 mt-2 dark:text-gray-300">{t('userMap.editRoad.statusLabel')}</label>
                        <select className="border p-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs sm:text-sm" value={editingProps.status || 'unknown'} onChange={(e) => setEditingProps({ ...editingProps, status: e.target.value })}>
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
                                  updated.features = updated.features.map((f: GeoJSON.Feature) => {
                                    const p = (f.properties || {}) as RoadFeatureProperties;
                                    if (String(p.id || f.id) === String(editingRoadId)) {
                                      const newProps: RoadFeatureProperties = { ...p, nameroad: editingProps.nameroad, color: editingProps.color, status: editingProps.status };
                                      return { ...f, properties: newProps } as GeoJSON.Feature;
                                    }
                                    return f;
                                  });
                                  setRoadsGeoJson(updated);
                                  setRoadsVersion((v: number) => v + 1);
                                }
                              } catch (e) { void e; }
                              setSaveStatus('Saved');
                              setTimeout(() => setSaveStatus(null), 2000);
                              setEditingRoadId(null);
                              setEditingProps({});
                              showAlert('success', t('userMap.editRoad.savedTitle'), t('userMap.editRoad.savedMessage'));
                            } catch (err) {
                              console.error('Failed to update road', err);
                              setSaveStatus('Failed to save');
                              showAlert('error', t('userMap.editRoad.failedTitle'), t('userMap.editRoad.failedMessage'));
                            }
                          }} type="button">{t('common.submit')}</button>
                          <button className="px-3 py-1 bg-gray-200 dark:bg-gray-600 dark:text-gray-100 rounded" onClick={() => { setEditingRoadId(null); setEditingProps({}); activateControl(null); }} type="button">{t('common.close')}</button>
                        </div>
                        {saveStatus ? <div className="text-xs text-green-600">{saveStatus}</div> : null}
                      </div>
                    </PanelBox>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-2">
              <StatusFilterButton filters={filters} onChange={(s: FiltersType) => setFilters(s)} btnSize={btnSize} open={activeControl === 'filters'} onOpenChange={(v: boolean) => setExclusiveControl(v ? 'filters' : null)} />
            </div>

            {editMessage && <div className="mt-2 text-xs text-red-600 dark:text-red-400">{editMessage}</div>}
          </>
        ) : null}
      </div>

      <div className="absolute right-3" style={{ top: 10, zIndex: 10000, overflow: 'visible' }}>
        <div className="flex flex-col gap-2">
          {role === 'admin' && (
            <AddTreeButton
              active={activeControl === 'addTree'}
              onToggle={() => {
                const turningOn = activeControl !== 'addTree';
                setExclusiveControl(turningOn ? 'addTree' : null);
                setAddTreeMode(turningOn);
                if (turningOn) {
                  setEditTreeMode(false);
                  setShowEditForm(false);
                } else {
                  setPickedLatLng(null);
                  setPickedRoadId(null);
                  setPickedRoadName(null);
                  setEditingTree(null);
                }
              }}
              btnSize={btnSize}
              lat={pickedLatLng ? pickedLatLng.lat : undefined}
              lng={pickedLatLng ? pickedLatLng.lng : undefined}
              editingTree={editingTree}
              onCancel={() => { activateControl(null); setAddTreeMode(false); setPickedLatLng(null); setPickedRoadId(null); setPickedRoadName(null); setEditingTree(null); setRoadPickMode(false); }}
              onCreated={() => { handleTreeCreated(); activateControl(null); setAddTreeMode(false); setPickedLatLng(null); setPickedRoadId(null); setPickedRoadName(null); setEditingTree(null); setRoadPickMode(false); showAlert('success', t('userMap.tree.addedTitle'), t('userMap.tree.addedMessage')); }}
              roadId={pickedRoadId || undefined}
              roadName={pickedRoadName || undefined}
              roadPickActive={/* roadPickActive */ false}
              onToggleRoadPick={(v: boolean) => {
                if (v) {
                  setPickedLatLng(null);
                }
                setRoadPickMode(v);
              }}
            />
          )}

          {(role === 'officer' || role === 'admin') && (
            <EditTreeButton
              active={activeControl === 'editTree'}
              onToggle={() => {
                const newVal = activeControl !== 'editTree';
                setExclusiveControl(newVal ? 'editTree' : null);
                setEditTreeMode(newVal);
                if (!newVal) {
                  setShowEditForm(false);
                  setEditingTree(null);
                } else {
                  setAddTreeMode(false);
                  setShowEditForm(true);
                }
              }}
              btnSize={btnSize}
              showEditForm={false}
              editingTree={editingTree}
              onCancel={() => { activateControl(null); setShowEditForm(false); setEditingTree(null); setRoadPickMode(false); }}
              onCreated={() => { handleTreeCreated(); activateControl(null); setShowEditForm(false); setEditingTree(null); setRoadPickMode(false); showAlert('success', t('userMap.tree.updatedTitle'), t('userMap.tree.updatedMessage')); }}
              roadId={pickedRoadId || undefined}
              roadName={pickedRoadName || undefined}
              roadPickActive={/* roadPickActive */ false}
              onToggleRoadPick={(v: boolean) => { if (v) setPickedLatLng(null); setRoadPickMode(v); }}
            />
          )}

          {role === 'admin' && (
            <DeleteTreeButton
              active={activeControl === 'deleteTree'}
              onToggle={() => {
                const newVal = activeControl !== 'deleteTree';
                setExclusiveControl(newVal ? 'deleteTree' : null);
                setDeleteTreeMode(newVal);
                if (newVal) {
                  setAddTreeMode(false);
                  setEditTreeMode(false);
                  setShowEditForm(false);
                  setSelectedForDelete(new Set());
                }
              }}
              btnSize={btnSize}
              deleteTreeMode={deleteTreeMode}
              selectedForDelete={selectedForDelete}
              setDeleteTreeMode={setDeleteTreeMode}
              setSelectedForDelete={setSelectedForDelete}
              setTrees={setTrees}
              onDeleted={(count: number) => { showAlert('success', t('userMap.tree.deletedTitle'), t('userMap.tree.deletedMessage', { count })); }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default MapControls;
