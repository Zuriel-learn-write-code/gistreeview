import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GeoJSON } from 'react-leaflet';
import type L from 'leaflet';

type RoadPictureRef = { id?: string; url?: string };
type RoadFeatureProperties = {
  id?: string | number;
  uuid?: string;
  nameroad?: string;
  name?: string;
  color?: string;
  status?: string;
  description?: string;
  treesCount?: number;
  roadPictures?: RoadPictureRef[];
};

type TreeRecord = { id?: string; roadId?: string | null; road?: { id?: string; uuid?: string } | null };

interface Props {
  roadsGeoJson: GeoJSON.FeatureCollection | null;
  roadsVersion: number;
  editMode: boolean;
  // A synchronous ref mirror of editMode provided by the parent so Leaflet
  // event handlers can read the current edit state without relying on React
  // state (which may be async/stale inside the DOM event callback).
  editModeRef?: React.RefObject<boolean>;
  geoStyle: (feature?: GeoJSON.Feature) => L.PathOptions;
  // handleFeatureClick removed — we now use window events for cross-component interactions
  zoomLevel: number;
  filters: { roads: Record<string, boolean> };
  addTreeMode: boolean;
  pickedLatLng: { lat: number; lng: number } | null;
  roadPickMode: boolean;
  // showEditForm and editingTree removed (unused)
  setPickedLatLng: (p: { lat: number; lng: number } | null) => void;
  setPickedRoadId: (id: string | null) => void;
  setPickedRoadName: (name: string | null) => void;
  setRoadPickMode: (v: boolean) => void;
  trees?: TreeRecord[];
  // onShowPopup removed; road clicks dispatch event to open RoadModalDialog
}

const Road: React.FC<Props> = ({
  roadsGeoJson,
  roadsVersion,
  editMode,
  editModeRef,
  geoStyle,
  zoomLevel,
  filters,
  addTreeMode,
  pickedLatLng,
  roadPickMode,
  // showEditForm and editingTree removed from props
  setPickedLatLng,
  setPickedRoadId,
  setPickedRoadName,
  setRoadPickMode,
  trees,
  
}) => {
  // RoadPopupContent removed; we now open the RoadModalDialog on click
  const { t } = useTranslation();

  const element = useMemo(() => {
    if (!roadsGeoJson) return null;
    if (typeof zoomLevel === 'number' && zoomLevel < 16) return null;

    // build tree counts lookup
    const countsMap: Record<string, number> = {};
    if (Array.isArray(trees)) {
      for (const t of trees) {
        if (!t) continue;
        const rid = t.roadId || (t.road && (t.road.id || t.road.uuid)) || null;
        if (!rid) continue;
        countsMap[String(rid).toLowerCase()] = (countsMap[String(rid).toLowerCase()] || 0) + 1;
      }
    }

    const filtered = {
      ...roadsGeoJson,
      features: (roadsGeoJson.features || []).filter((f) => {
        const p = (f.properties || {}) as RoadFeatureProperties;
        const st = (p.status || 'unknown') as keyof typeof filters.roads;
        return Boolean(filters.roads[st]);
      }),
    } as GeoJSON.FeatureCollection;

    const buildPopupForFeature = (feature: GeoJSON.Feature, evtLat?: number, evtLng?: number) => {
      try {
        const props2 = (feature?.properties || {}) as RoadFeatureProperties;
        const uuid = (props2.uuid || props2.id || '').toString().toLowerCase();
        const propsCount = typeof props2.treesCount === 'number' ? props2.treesCount : undefined;
        const lookupCount = countsMap[uuid || String(props2.id || '').toLowerCase()] || 0;
        const treesCount = lookupCount > 0 ? lookupCount : (typeof propsCount === 'number' ? propsCount : 0);
        const pics = Array.isArray(props2.roadPictures) ? props2.roadPictures : [];
        // Also dispatch a road modal open event so a dedicated RoadModalDialog can pick it up
        try {
          const detail = {
            id: props2.id ?? props2.uuid ?? uuid ?? null,
            nameroad: props2.nameroad ?? null,
            name: props2.name ?? null,
            description: props2.description ?? null,
            lat: evtLat ?? null,
            lng: evtLng ?? null,
            treesCount: treesCount,
            roadPictures: pics as RoadPictureRef[],
            color: props2.color ?? null,
            status: props2.status ?? null,
          };

          // Dispatch a cancellable 'road-click' event first so listeners (like UserMaps)
          // can prevent the modal when they want to handle the click (for example
          // when edit mode is active). If not prevented, open the modal as before.
          let openModal = true;
          try {
            const evt = new CustomEvent('gistreeview:road-click', { detail, cancelable: true });
            // dispatchEvent returns false when preventDefault() was called by a listener
            console.log('[Road] dispatch to window: gistreeview:road-click');
            const notPrevented = window.dispatchEvent(evt);
            // Also dispatch on document as a fallback for different event contexts
            try { document.dispatchEvent(new CustomEvent('gistreeview:road-click', { detail, cancelable: true, bubbles: true })); console.log('[Road] dispatch to document: gistreeview:road-click'); } catch { /* ignore */ }
            openModal = Boolean(notPrevented);
          } catch (e) { console.log('[Road] dispatch gistreeview:road-click failed', e); }

          if (openModal) {
            try {
              try { window.dispatchEvent(new CustomEvent('gistreeview:open-road-modal', { detail })); } catch { /* ignore */ }
              try { document.dispatchEvent(new CustomEvent('gistreeview:open-road-modal', { detail, bubbles: true })); } catch { /* ignore */ }
            } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
      } catch { /* ignore */ }
    };

    return (
      <>
        {/* Visible road layer */}
        <GeoJSON key={`roads-visible-${roadsVersion}`} data={filtered as GeoJSON.FeatureCollection} style={geoStyle} />

        {/* Invisible thicker hit layer to improve clickability without changing visuals */}
        <GeoJSON
          key={`roads-hit-${roadsVersion}`}
          data={filtered as GeoJSON.FeatureCollection}
          style={(feature: GeoJSON.Feature | undefined) => {
            const base = geoStyle(feature) as unknown as { weight?: number };
            const baseWeight = (base && base.weight) ? (base.weight as number) : 2;
            return { weight: Math.max(12, baseWeight + 8), color: '#98cfd6ff', opacity: 0, interactive: true } as L.PathOptions;
          }}
          onEachFeature={(feature, layer: unknown) => {
            const cl = layer as unknown as { on?: (ev: string, cb: (...args: unknown[]) => void) => void } | undefined;
            if (!cl || !cl.on) return;
            cl.on('click', (...args: unknown[]) => {
              try {
                const evt = args && args.length > 0 ? (args[0] as { latlng?: { lat: number; lng: number } }) : undefined;
                if (!feature) return;
                const props = (feature?.properties || {}) as RoadFeatureProperties;
                const fid = String(props.id || (feature as GeoJSON.Feature).id || '').trim();
                const fname = String(props.nameroad || props.name || '').trim() || null;

                console.log('[Road] feature click', { fid, fname, addTreeMode, pickedLatLng, roadPickMode });

                if (addTreeMode || pickedLatLng) {
                  const latlng = evt && evt.latlng ? evt.latlng : undefined;
                  if (latlng) {
                      console.log('[Road] setting picked latlng for addTree', { lat: latlng });
                    setPickedLatLng({ lat: latlng.lat, lng: latlng.lng });
                  }
                    console.log('[Road] setting picked road for addTree', { fid, fname });
                  setPickedRoadId(fid || null);
                  setPickedRoadName(fname || null);
                }

                // Consult the synchronous global flag first to avoid React state delay
                const globalRoadPick = (window as unknown as { __gistreeviewRoadPick?: boolean }).__gistreeviewRoadPick === true;
                if (roadPickMode || globalRoadPick) {
                  console.log('[Road] roadPickMode active - selecting road', { fid, fname });
                  setPickedRoadId(fid || null);
                  setPickedRoadName(fname || null);
                  try { (window as unknown as { __gistreeviewRoadPick?: boolean }).__gistreeviewRoadPick = false; } catch { /* ignore */ }
                  setRoadPickMode(false);
                  setPickedLatLng(null);
                  try {
                    const maybeShow = (window as unknown as { showAlert?: ((variant: string, title: string, message: string) => void) | undefined }).showAlert;
                    if (typeof maybeShow === 'function') maybeShow('success', t('userMap.road.selectedTitle'), String(fname || fid));
                  } catch { /* ignore */ }
                }

                // const clLayer = layer as unknown as L.Layer; (unused)
                // Build a detail payload for events
                const detail = {
                  id: fid || null,
                  nameroad: fname || null,
                  name: fname || null,
                  description: (props as RoadFeatureProperties).description ?? null,
                  lat: evt && evt.latlng ? evt.latlng.lat : null,
                  lng: evt && evt.latlng ? evt.latlng.lng : null,
                  treesCount: (props as RoadFeatureProperties).treesCount ?? null,
                  roadPictures: Array.isArray((props as RoadFeatureProperties).roadPictures) ? (props as RoadFeatureProperties).roadPictures : [],
                  color: (props as RoadFeatureProperties).color ?? null,
                  status: (props as RoadFeatureProperties).status ?? null,
                };

                // compatibility event
                try {
                  console.log('[Road] dispatching gistreeview:road-click', { detail });
                  window.dispatchEvent(new CustomEvent('gistreeview:road-click', { detail }));
                } catch (e) { console.log('[Road] dispatch gistreeview:road-click failed', e); }

                // If edit mode is active (global quick flag or synchronous ref),
                // dispatch a specific event to ask the app to open the edit panel
                // and do not open the modal.
                try {
                  const globalEdit = (window as unknown as { __gistreeviewEditMode?: boolean }).__gistreeviewEditMode === true;
                  const isEditMode = (editModeRef && typeof editModeRef === 'object' && 'current' in editModeRef)
                    ? (editModeRef.current === true)
                    : Boolean(editMode);
                  console.log('[Road] edit check', { globalEdit, isEditMode, editMode });
                  if (globalEdit || isEditMode) {
                    console.log('[Road] dispatching gistreeview:road-selected-for-edit', { detail });
                    try { window.dispatchEvent(new CustomEvent('gistreeview:road-selected-for-edit', { detail })); } catch { /* ignore */ }
                    try { document.dispatchEvent(new CustomEvent('gistreeview:road-selected-for-edit', { detail, bubbles: true })); } catch { /* ignore */ }
                    // ensure we don't fallthrough to opening the modal
                    return;
                  }
                } catch (e) { console.log('[Road] edit-check failed', e); }

                // Not edit mode: open the road modal as before
                try {
                  const lat = evt && evt.latlng ? evt.latlng.lat : undefined;
                  const lng = evt && evt.latlng ? evt.latlng.lng : undefined;
                  buildPopupForFeature(feature as GeoJSON.Feature, lat, lng);
                } catch { /* ignore */ }
              } catch { /* ignore */ }
            });
          }}
        />
      </>
    );
  }, [roadsGeoJson, roadsVersion, editMode, editModeRef, geoStyle, zoomLevel, filters, addTreeMode, pickedLatLng, roadPickMode, setPickedLatLng, setPickedRoadId, setPickedRoadName, setRoadPickMode, trees, t]);

  return <>{element}</>;
};

export default Road;
