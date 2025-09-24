import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ZoomButtons from "./UiMaps/ZoomButtons";
import Alert from '../ui/alert/Alert';
import LayerPicker from "./UiMaps/LayerPicker";
import FullscreenButton from "./UiMaps/FullscreenButton";
import LocateButton from "./UiMaps/LocateButton";
import EditRoadButton from "./UiMaps/EditRoadButton";
import EditTreeButton from "./UiMaps/EditTreeButton";
import StatusFilterButton from './UiMaps/StatusFilterButton';
import PanelBox from './UiMaps/PanelBox';
import { apiUrl } from "../../config/api";
import PALETTE, { PALETTE_ENUM } from './UiMaps/palette';
import AddTreeButton from './UiMaps/AddTreeButton';
import Road from './UiMaps/Road';
import DeleteTreeButton from './UiMaps/DeleteTreeButton';
import TreeMarker from './UiMaps/TreeMarker';
import MapPopup from './UiMaps/MapPopup';
import ReportTreeForm from './UiMaps/ReportTreeForm';
import ExampleModalDialog from './TreeModalDialog';
import RoadModalDialog from './RoadModalDialog';
import { getUserRole } from '../../utils/auth';
import type { Tree } from './types';

// Rewritten clean UserMaps component using extracted Ui controls
const customPin = L.icon({
      iconUrl: "/icons/pin-svgrepo-com.svg",
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
      className: "custom-pin-icon",
    });

      // (We now use pre-colored static SVG files under public/icons)

  const AMBON_CENTER: [number, number] = [-3.6978, 128.1814];
  // Bounding box for Ambon area — prevents panning outside Ambon island/city.
  // These coordinates are conservative estimates and can be adjusted if you want
  // a tighter or looser bound. Format: [southWestLat, southWestLng], [northEastLat, northEastLng]
  const AMBON_BOUNDS: [[number, number], [number, number]] = [[-3.95, 128.03], [-3.50, 128.35]];

// When true the map will automatically fit bounds to loaded roads on first load.
// Set to false to preserve the initial center/zoom (Ambon, zoom 16) on reload.
const AUTO_FIT_ROADS_ON_LOAD = false;

  type RoadPictureRef = { id?: string; url?: string };
  type RoadFeatureProperties = {
    id?: string;
    uuid?: string;
    nameroad?: string;
    name?: string;
    color?: string;
    status?: string;
    description?: string;
    treesCount?: number;
    roadPictures?: RoadPictureRef[];
  };
  

  type UserMapsProps = {
  height?: string;
  onMapReady?: (map: { flyTo: (coords: [number, number], zoom?: number) => void }) => void;
  // optional callback when a tree marker is clicked
  onTreeClick?: (tree: Tree) => void;
};

const UserMaps: React.FC<UserMapsProps> = ({ height = "600px", onMapReady, onTreeClick }) => {
    // determine current user role from localStorage via auth helper; may be null
  // determine current user role from localStorage via auth helper; may be null
  // Use state so we can update when logout happens in another component/tab
  const [role, setRole] = useState<"admin"|"officer"|"user"|null>(() => getUserRole());
    const [renderError, setRenderError] = useState<Error | null>(null);
    // Update role state when logout happens elsewhere or when localStorage changes
    useEffect(() => {
      const onLoggedOut = () => { try { setRole(null); } catch { /* ignore */ } };
      const onStorage = (ev: StorageEvent) => {
        try { if (ev.key === 'user') setRole(getUserRole()); } catch { /* ignore */ }
      };
      try { window.addEventListener('gistreeview:user-logged-out', onLoggedOut as EventListener); } catch { /* ignore */ }
      try { window.addEventListener('storage', onStorage as EventListener); } catch { /* ignore */ }
      return () => {
        try { window.removeEventListener('gistreeview:user-logged-out', onLoggedOut as EventListener); } catch { /* ignore */ }
        try { window.removeEventListener('storage', onStorage as EventListener); } catch { /* ignore */ }
      };
    }, []);
      const wrapperRef = useRef<HTMLDivElement | null>(null);
      const btnRef = useRef<HTMLButtonElement | null>(null);
    // helper to shorten long IDs for display (keep full ID in title/hover)
    const shortenId = (id?: string | null) => {
      if (!id) return '-';
      const s = String(id);
      if (s.length <= 12) return s;
      const first = s.slice(0, 6);
      const last = s.slice(-6);
      return `${first}...${last}`;
    };
      const locateRef = useRef<HTMLButtonElement | null>(null);

  const [editMode, setEditMode] = useState(false);
  // Synchronous ref mirror for editMode so map click handlers (Leaflet) can
  // read the current edit state without risking React state async staleness.
  const editModeRef = React.useRef<boolean>(editMode);
  // Keep the ref in sync on each render
  editModeRef.current = editMode;
  // Keep the ref in sync on each render
  // editModeRef.current = editMode; (already done above)
      const [editingRoadId, setEditingRoadId] = useState<string | null>(null);
    const [editingProps, setEditingProps] = useState<{ nameroad?: string; color?: string; status?: string }>({});
      const [editMessage, setEditMessage] = useState<string | null>(null);
      const [btnSize, setBtnSize] = useState<{ w?: number; h?: number }>({});
      const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
      // Base layer defaults to Carto Voyager (light). We'll only switch to the dark Carto
      // basemap if the application explicitly has the `dark` class on <html> (Tailwind dark).
      // This avoids using OS-level prefers-color-scheme for initial map selection which can
      // cause the wrong tiles to load when the app theme is controlled independently.
  const defaultBase: "osm" | "carto" | "transport" | "topo" | "dark" = 'carto';
  const [baseLayer, setBaseLayer] = useState<"osm" | "carto" | "transport" | "topo" | "dark">(defaultBase);
  // preserve prior non-dark layer so we can restore when dark mode is turned off
  const prevBaseLayerRef = useRef<"osm" | "carto" | "transport" | "topo" | null>(null);
  // central active control name - only one control may be active at a time
  const [activeControl, setActiveControl] = useState<string | null>(null);
  const { t } = useTranslation();

  const activateControl = (name: string | null) => {
    setActiveControl((prev) => {
      if (prev === name) return null; // toggle off if same
      if (name === 'editRoad') {
        setEditMode(true);
        setShowEditForm(true);
      }
      return name;
    });
  };

  // Centralized exclusive control setter: when one control becomes active,
  // ensure all other mutually-exclusive modes are turned off and related
  // transient state (picked coords, editing ids, cursors) are cleared.
  const setExclusiveControl = useCallback((name: string | null) => {
    // Use functional updater to avoid reading stale `activeControl` from closure
    setActiveControl((prevActive) => {
      const turningOn = prevActive !== name && name !== null;
      const newActive = turningOn ? name : null;

  try { console.debug('[UserMaps] setExclusiveControl ->', { requested: name, newActive, turningOn, prevActive }); } catch { /* ignore */ }

      // Set flags according to the newly active control
      setLocateMode(newActive === 'locate');
      
      // Special handling for edit road mode
      if (newActive === 'editRoad') {
        setEditMode(true);
        if (editModeRef) editModeRef.current = true;
        setShowEditForm(true);
        try { (window as unknown as { __gistreeviewEditMode?: boolean }).__gistreeviewEditMode = true; } catch { /* ignore */ }
      } else {
        setEditMode(false);
        if (editModeRef) editModeRef.current = false;
        try { (window as unknown as { __gistreeviewEditMode?: boolean }).__gistreeviewEditMode = false; } catch { /* ignore */ }
      }
      
      setAddTreeMode(newActive === 'addTree');
      setEditTreeMode(newActive === 'editTree');
      setDeleteTreeMode(newActive === 'deleteTree');

      // Manage showEditForm centrally: show when activating editTree or editRoad, hide otherwise
      setShowEditForm(newActive === 'editTree' || newActive === 'editRoad');

      // Clear control-specific transient state when that control is not active
        if (newActive !== 'locate') {
        try {
          setCoordBoxLatLng(null);
          const container = (mapInstance as unknown as { getContainer?: () => HTMLElement }).getContainer?.();
          if (container) container.style.cursor = '';
        } catch (err) { console.debug('UserMaps: ignored error', err); }
      }

      if (newActive !== 'editRoad') {
        // Clear edit-road transient state whenever editRoad is not the active control
        setEditingRoadId(null);
        setEditingProps({});
      }

      if (newActive !== 'addTree') {
        setPickedLatLng(null);
        setPickedRoadId(null);
        setPickedRoadName(null);
        setEditingTree(null);
        setRoadPickMode(false);
      }

      if (newActive !== 'editTree') {
        // Ensure editingTree is cleared when leaving editTree
        setEditingTree(null);
      }

      if (newActive !== 'deleteTree') {
        setSelectedForDelete(new Set());
        setDeleteTreeMode(false);
      }

      // Synchronously update a global flag so non-React map layers can
      // immediately observe edit mode without waiting for React effects.
      try { (window as unknown as { __gistreeviewEditMode?: boolean }).__gistreeviewEditMode = (newActive === 'editRoad'); } catch { /* ignore */ }
      try { console.debug('[UserMaps] set __gistreeviewEditMode ->', { value: (newActive === 'editRoad') }); } catch { /* ignore */ }
      return newActive;
    });
  }, [mapInstance]);
  // Keep synchronous refs for activeControl and setExclusiveControl so the
  // mount-only event handler can consult and call them without stale closures.
  const activeControlRef = useRef<string | null>(null);
  useEffect(() => { activeControlRef.current = activeControl; }, [activeControl]);

  const setExclusiveControlRef = useRef<typeof setExclusiveControl | null>(null);
  useEffect(() => { setExclusiveControlRef.current = setExclusiveControl; }, [setExclusiveControl]);
      // coordinate picker box when locateMode is active
      const [coordBoxLatLng, setCoordBoxLatLng] = useState<{ lat: number; lng: number } | null>(null);
  // Start at zoom 18 to show a closer street-level view for Ambon
  const [zoomLevel, setZoomLevel] = useState<number>(18);
  const [locateMode, setLocateMode] = useState(false);
  const [addTreeMode, setAddTreeMode] = useState(false);
  const [editTreeMode, setEditTreeMode] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [roadPickMode, setRoadPickMode] = useState(false);

  useEffect(() => {
    try { console.log('[UserMaps] roadPickMode changed', { roadPickMode }); } catch { /* ignore */ }
  }, [roadPickMode]);

  // Wrapper to synchronously reflect pick mode to a window-global flag so
  // map click handlers can consult it immediately (avoids React state async timing).
  const setRoadPickModeSafe = (v: boolean) => {
    try { (window as unknown as { __gistreeviewRoadPick?: boolean }).__gistreeviewRoadPick = v; } catch { /* ignore */ }
    setRoadPickMode(v);
  };
  const [deleteTreeMode, setDeleteTreeMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [pickedLatLng, setPickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [pickedRoadId, setPickedRoadId] = useState<string | null>(null);
  const [pickedRoadName, setPickedRoadName] = useState<string | null>(null);
      const [roadsGeoJson, setRoadsGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [editingTree, setEditingTree] = useState<Tree | null>(null);

      // When a tree is selected (setEditingTree called) while edit-tree mode is active,
      // ensure the edit form is shown. This guards against the case where the user
      // toggled edit mode on/off and later selects a tree — the parent may not have
      // shown the form automatically.
      useEffect(() => {
        try {
          if (editingTree && editTreeMode) {
            console.debug('[UserMaps] effect: editingTree & editTreeMode true -> showEditForm', { editingTreeId: editingTree?.id, editTreeMode, showEditForm });
            setShowEditForm(true);
          }
        } catch { /* ignore */ }
      }, [editingTree, editTreeMode, showEditForm]);

      // Effect to show edit form when road is selected for editing
      useEffect(() => {
        try {
          if (editingRoadId && activeControl === 'editRoad') {
            console.debug('[UserMaps] effect: road selected for edit -> showEditForm', { editingRoadId, activeControl });
            setShowEditForm(true);
          }
        } catch { /* ignore */ }
      }, [editingRoadId, activeControl]);
      const [alertProps, setAlertProps] = useState<{
        variant: 'success'|'error'|'warning'|'info';
        title: string;
        message: string;
        duration?: number;
      } | null>(null);
  // using pre-colored static SVGs; no runtime svg string needed
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [roadsVersion, setRoadsVersion] = useState(0);
  const hasFittedRef = useRef(false);

      // Thunderforest key handling
      const TF_KEY = typeof (import.meta as unknown as { env?: { VITE_THUNDERFOREST_KEY?: string } })?.env?.VITE_THUNDERFOREST_KEY === "string"
        ? (import.meta as unknown as { env: { VITE_THUNDERFOREST_KEY: string } }).env.VITE_THUNDERFOREST_KEY
        : "";
      const transportUrl = TF_KEY ? `https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${TF_KEY}` : "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";

      // On init, if app appears to be in dark mode, ensure basemap is dark and remember previous
      useEffect(() => {
        try {
          // Only switch to dark if the application explicitly set the `dark` class on <html>.
          // This ensures that if the app is in light mode but the OS preference is dark,
          // we still show the light Carto Voyager tiles.
          const isHtmlDark = typeof document !== 'undefined' && document.documentElement && document.documentElement.classList.contains('dark');
          if (isHtmlDark && baseLayer !== 'dark') {
            prevBaseLayerRef.current = baseLayer;
            setBaseLayer('dark');
          }
        } catch (err) { console.debug('UserMaps detect dark-on-mount check failed', err); }
        // run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      // Listen for system theme changes and switch basemap to dark when theme becomes dark,
      // restoring previous basemap when theme becomes light again.
      useEffect(() => {
        try {
          if (typeof window === 'undefined' || !window.matchMedia) return;
          const mq = window.matchMedia('(prefers-color-scheme: dark)');
          const onChange = (ev: MediaQueryListEvent) => {
            try {
              const isDark = ev.matches === true;
              if (isDark) {
                if (baseLayer !== 'dark') {
                  prevBaseLayerRef.current = baseLayer;
                  setBaseLayer('dark');
                }
              } else {
                // restore previous layer if we previously switched to dark automatically
                if (baseLayer === 'dark' && prevBaseLayerRef.current) {
                  setBaseLayer(prevBaseLayerRef.current);
                  prevBaseLayerRef.current = null;
                }
              }
            } catch (err) { console.debug('UserMaps.matchMedia change handler failed', err); }
          };
          // use onchange property which is widely supported instead of addEventListener/removeEventListener
          try { (mq as MediaQueryList).onchange = onChange; } catch (err) { console.debug('UserMaps: failed to set mq.onchange', err); }
          return () => { try { (mq as MediaQueryList).onchange = null; } catch (err) { console.debug('UserMaps: failed to clear mq.onchange', err); } };
  } catch (err) { console.debug('UserMaps: ignored error', err); }
      }, [baseLayer]);

      // If the app toggles Tailwind's `dark` class on <html> at runtime, observe it and update
      useEffect(() => {
        try {
          if (typeof document === 'undefined' || !document.documentElement) return;
          const target = document.documentElement;
          const mo = new MutationObserver(() => {
            try {
              const dark = target.classList.contains('dark');
              if (dark) {
                if (baseLayer !== 'dark') {
                  prevBaseLayerRef.current = baseLayer;
                  setBaseLayer('dark');
                }
              } else {
                if (baseLayer === 'dark' && prevBaseLayerRef.current) {
                  setBaseLayer(prevBaseLayerRef.current);
                  prevBaseLayerRef.current = null;
                }
              }
            } catch (err) { console.debug('UserMaps.MutationObserver handler failed', err); }
          });
          mo.observe(target, { attributes: true, attributeFilter: ['class'] });
          return () => { try { mo.disconnect(); } catch (err) { console.debug('UserMaps: MutationObserver.disconnect failed', err); } };
  } catch (err) { console.debug('UserMaps: ignored error', err); }
      }, [baseLayer]);

      const handleLocate = () => {
        // activate locate control exclusively — this now becomes a coordinate picker
        const turningOn = activeControl !== 'locate';
        setExclusiveControl(turningOn ? 'locate' : null);
        // clear any existing coord box when toggling off
        if (!turningOn) {
          setCoordBoxLatLng(null);
          // also clear any custom cursor immediately on the map container
          try {
            const container = (mapInstance as unknown as { getContainer?: () => HTMLElement }).getContainer?.();
            if (container) container.style.cursor = '';
          } catch (err) { console.debug('UserMaps: ignored error', err); }
          // setCoordBoxPos was removed
        }
      };

      // Ensure that when another control becomes active, locateMode and its cursor are cleared
      useEffect(() => {
        try {
          if (activeControl !== 'locate' && locateMode) {
            setLocateMode(false);
            setCoordBoxLatLng(null);
            const container = (mapInstance as unknown as { getContainer?: () => HTMLElement }).getContainer?.();
            if (container) container.style.cursor = '';
          }
  } catch (err) { console.debug('UserMaps: ignored error', err); }
      }, [activeControl, locateMode, mapInstance]);

      const toggleFullscreen = async () => {
        const el = wrapperRef.current;
        if (!el) return;
        try {
          if (!document.fullscreenElement) await el.requestFullscreen();
          else await document.exitFullscreen();
        } catch { /* ignore */ }
      };

      useEffect(() => {
        const loadFromApi = async () => {
          try {
            // Prefer backend endpoint that already returns GeoJSON with treesCount to reduce payload and client work
            const r = await fetch(apiUrl('/api/roads/with-treecount'));
            if (r.ok) {
              try {
                const data = await r.json();
                // Expecting FeatureCollection
                if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
                  // Normalize properties: palette enum -> hex, ensure status
                  data.features = data.features.map((f: GeoJSON.Feature) => {
                    const props = f.properties || {};
                    try {
                      if (props.color && typeof props.color === 'string' && props.color.startsWith('palette_')) {
                        const hex = (PALETTE_ENUM && PALETTE_ENUM[props.color]) ? PALETTE_ENUM[props.color] : null;
                        if (hex) props.color = hex;
                      }
                    } catch { /* ignore */ }
                    if (!props.status) props.status = 'unknown';
                    f.properties = props;
                    return f;
                  });
                  setRoadsGeoJson(data as GeoJSON.FeatureCollection);
                  return;
                }
              } catch (e) {
                console.warn('Failed to parse /api/roads/with-treecount response, falling back', e);
              }
            }

            // Fallback: older endpoint that returns raw rows; convert to GeoJSON like before
            const fallback = await fetch(apiUrl('/api/roads'));
            if (!fallback.ok) throw new Error('api returned non-ok');
            const rows = await fallback.json();
            if (!Array.isArray(rows)) throw new Error('api returned invalid payload');

            const features: GeoJSON.Feature[] = rows
              .filter((row) => row && (row.geometry || row.geom))
              .map((row) => {
                let geometry = null;
                try {
                  if (row.geometry) geometry = typeof row.geometry === 'string' ? JSON.parse(row.geometry) : row.geometry;
                  else if (row.geom) geometry = typeof row.geom === 'string' ? JSON.parse(row.geom) : row.geom;
                } catch { geometry = null; }

                // Normalize color: backend may return enum like 'palette_01' or a hex string
                let colorHex: string | null = null;
                try {
                  const raw = row.color;
                  if (raw) {
                    const s = String(raw);
                    if (s.startsWith('palette_')) {
                      colorHex = (PALETTE_ENUM && PALETTE_ENUM[s]) ? PALETTE_ENUM[s] : null;
                    } else if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(s)) {
                      colorHex = s;
                    }
                  }
                } catch (e) { void e; }

                return {
                  // cast to GeoJSON.Feature so TypeScript accepts the shape
                  ...( { type: 'Feature', properties: {
                    id: row.id,
                    uuid: row.uuid,
                    nameroad: row.nameroad,
                    description: row.description,
                    color: colorHex,
                    status: row.status || 'unknown',
                    treesCount: typeof row.treesCount === 'number' ? row.treesCount : 0,
                  }, geometry } as unknown as GeoJSON.Feature ),
                };
              })
              .filter((f) => !!f.geometry);

            setRoadsGeoJson({ type: 'FeatureCollection', features });
            return;
          } catch (err) {
            console.error('Failed to load roads from API', err);
            setRoadsGeoJson(null);
            setEditMessage('Cannot load roads from backend API — editing disabled.');
          }
        };
        loadFromApi();

        // measure the Leaflet zoom button and copy its size
        const zoomIn = document.querySelector<HTMLElement>(".leaflet-control-zoom a.leaflet-control-zoom-in");
        const zoomBtn = zoomIn || document.querySelector<HTMLElement>(".leaflet-control-zoom a");
        if (zoomBtn) {
          const rect = zoomBtn.getBoundingClientRect();
          setBtnSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
          try {
            const cs = window.getComputedStyle(zoomBtn);
            const btnEl = btnRef.current;
            if (btnEl && cs) {
              btnEl.style.background = cs.backgroundColor || "";
              btnEl.style.color = cs.color || "";
              btnEl.style.boxShadow = cs.boxShadow || "";
              const parsedWidth = parseFloat(cs.borderWidth || "0") || 0;
              const increasedWidth = parsedWidth > 0 ? `${Math.max(2, parsedWidth + 2)}px` : "2px";
              const borderStr = `${increasedWidth} ${cs.borderStyle} ${cs.borderColor}`;
              btnEl.style.border = borderStr;
              btnEl.style.boxSizing = "border-box";
              btnEl.style.borderRadius = cs.borderRadius || "";
              btnEl.style.padding = cs.padding || btnEl.style.padding || "";
              if (cs.outlineStyle && cs.outlineStyle !== "none") {
                btnEl.style.outline = `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`;
              }
              const locateEl = locateRef.current;
              if (locateEl) {
                locateEl.style.background = btnEl.style.background;
                locateEl.style.color = btnEl.style.color;
                locateEl.style.border = btnEl.style.border;
                locateEl.style.borderRadius = btnEl.style.borderRadius;
                locateEl.style.boxSizing = btnEl.style.boxSizing;
                locateEl.style.padding = btnEl.style.padding;
              }
            }
          } catch (_e) { void _e; }
        }
      }, [mapInstance]);

      // Change map container cursor to pin when locateMode active
      useEffect(() => {
        try {
          if (!mapInstance) return;
          const container = (mapInstance as unknown as { getContainer?: () => HTMLElement }).getContainer?.();
          if (!container) return;
          if (locateMode) {
            // hotspot at (18,36) matches our pin anchor
            container.style.cursor = "url('/icons/pin-svgrepo-com.svg') 18 36, auto";
          } else {
            container.style.cursor = '';
          }
          return () => { if (container) container.style.cursor = ''; };
        } catch (_e) { void _e; }
      }, [locateMode, mapInstance]);

      // Removed forced zoom-to-19 behavior so the map will respect the initial zoom (16)
      // and user interactions. Keep mapInstance watcher for future behaviors if needed.
      useEffect(() => {
        if (!mapInstance) return;
        try { 
          setZoomLevel(mapInstance.getZoom()); 
          
          // Expose the flyTo method through the onMapReady callback
          if (onMapReady) {
            onMapReady({
              flyTo: (coords: [number, number], zoom = 20) => {
                mapInstance.flyTo(coords, zoom);
              }
            });
          }
        } catch { /* ignore */ }
      }, [mapInstance, onMapReady]);

      useEffect(() => {
        if (!mapInstance) return;
        const handler = (e: L.LeafletMouseEvent) => {
          try {
            const { lat, lng } = e.latlng;
            // If add-tree mode is active or a pin is already picked, update the picked location
            if (addTreeMode || pickedLatLng) {
              setPickedLatLng({ lat, lng });
              // leave addTreeMode as-is; user can continue picking or move the pin
              return;
            }
            // Otherwise if locateMode is active, open the coordinate box at the clicked position
            if (locateMode && mapInstance && wrapperRef.current) {
                try {
                // We only need the lat/lng for the side panel
                setCoordBoxLatLng({ lat, lng });
              } catch (_err) { void _err; }
            }
          } catch (err) { void err; }
        };
        if (locateMode || addTreeMode || pickedLatLng) mapInstance.on('click', handler);
        return () => { try { mapInstance.off('click', handler); } catch { /* ignore */ } };
  }, [mapInstance, locateMode, addTreeMode, pickedLatLng]);

  // Note: treesCount is calculated dynamically in the Road component to avoid
  // mutating `roadsGeoJson` state here which caused repeated re-renders.

  // Map popup state: position + React node content
  const [popupContent, setPopupContent] = useState<React.ReactNode | null>(null);
  const [popupPos, setPopupPos] = useState<{ lat: number; lng: number } | null>(null);

  // Shortbread overlay fetch removed per user request; shortbread now only requests tiles

  const handleShowPopup = (pos: { lat: number; lng: number } | null, content: React.ReactNode | null) => {
    try {
      if (pos && mapInstance) {
        const m = mapInstance as unknown as LeafletMap & { panTo?: (p: [number, number]) => void; setView?: (p: [number, number]) => void };
        if (m && typeof m.panTo === 'function') {
          try { m.panTo([pos.lat, pos.lng]); } catch { /* ignore */ }
        } else if (m && typeof m.setView === 'function') {
          try { m.setView([pos.lat, pos.lng]); } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
    setPopupPos(pos);
    setPopupContent(content);
  };

      useEffect(() => {
        if (!editingRoadId || (editingProps && editingProps.nameroad)) return;
        try {
          if (!roadsGeoJson || !Array.isArray(roadsGeoJson.features)) return;
          const found = roadsGeoJson.features.find((f) => {
            const p = (f.properties || {}) as RoadFeatureProperties;
            return String(p.id || f.id) === String(editingRoadId);
          });
          if (!found) { setEditingProps((s) => ({ ...s, nameroad: '' })); return; }
          const p = (found.properties || {}) as RoadFeatureProperties;
          const name = (p.nameroad || p.name || '').trim();
          setEditingProps((s) => ({ ...s, nameroad: name, color: s.color || p.color || '#ff5722', status: s.status || (p.status as string) || 'unknown' }));
        } catch (e) { void e; }
      }, [editingRoadId, roadsGeoJson, editingProps]);

      useEffect(() => {
        if (!mapInstance || !roadsGeoJson) return;
        if (hasFittedRef.current) return;
        if (!AUTO_FIT_ROADS_ON_LOAD) return; // preserve initial view/zoom when disabled
        try {
          const layer = L.geoJSON(roadsGeoJson as unknown as GeoJSON.FeatureCollection);
          const bounds = layer.getBounds();
          const isValidBounds = typeof (bounds as unknown as { isValid?: () => boolean }).isValid === 'function'
            ? (bounds as unknown as { isValid: () => boolean }).isValid()
            : Boolean(bounds);
          const typedMap = mapInstance as unknown as LeafletMap & { fitBounds?: (b: L.LatLngBoundsExpression, o?: L.FitBoundsOptions) => void };
          if (isValidBounds && typeof typedMap.fitBounds === 'function') {
            try { typedMap.fitBounds(bounds, { padding: [40, 40] }); } catch (e) { void e; }
            hasFittedRef.current = true;
          }
        } catch (err) { void err; }
      }, [mapInstance, roadsGeoJson]);

      useEffect(() => {
        if (!mapInstance) return;
        const map = mapInstance;
        try { setZoomLevel(map.getZoom()); } catch { /* ignore */ }
        const onBase = (e: unknown) => { console.log('baselayerchange', e); };
        const onOverlayAdd = (e: unknown) => { console.log('overlayadd', e); };
        const onZoomEnd = () => { try { setZoomLevel(map.getZoom()); } catch { /* ignore */ } };
        map.on('baselayerchange', onBase);
        map.on('overlayadd', onOverlayAdd);
        map.on('zoomend', onZoomEnd);
        const ctrl = document.querySelector('.leaflet-control-layers');
        if (ctrl && ctrl instanceof HTMLElement) { ctrl.style.zIndex = '10001'; ctrl.style.pointerEvents = 'auto'; }
        return () => { map.off('baselayerchange', onBase); map.off('overlayadd', onOverlayAdd); if (ctrl && ctrl instanceof HTMLElement) { ctrl.style.zIndex = ''; ctrl.style.pointerEvents = ''; } };
      }, [mapInstance]);

  

  // Diagnostic: log when editingRoadId or showEditForm change so we can see
  // whether the side panel conditional should be visible.
  useEffect(() => {
    try { console.debug('[UserMaps] diagnostic: editingRoadId/showEditForm changed', { editingRoadId, showEditForm, editMode }); } catch { /* ignore */ }
  }, [editingRoadId, showEditForm, editMode]);

  // Default filters: only show primary roads to keep the map light (user preference)
  const [filters, setFilters] = useState<{ roads: { primary: boolean; secondary: boolean; tertiary: boolean; unknown: boolean }; trees: { good: boolean; warning: boolean; danger: boolean } }>(
    {
      roads: { primary: true, secondary: false, tertiary: false, unknown: false },
      trees: { good: true, warning: true, danger: true },
    }
  );
  

  const handleTreeCreated = async () => {
    try {
      const r = await fetch(apiUrl('/api/roads/geojson'));
      if (r.ok) setRoadsGeoJson(await r.json());
      try {
        const tr = await fetch(apiUrl('/api/trees'));
        if (tr.ok) setTrees(await tr.json());
      } catch { /* ignore tree refresh error */ }
      setRoadsVersion((v) => v + 1);
      setPickedLatLng(null);
    } catch (err) { console.error('Failed to refresh roads after tree creation', err); }
  };

  const showAlert = useCallback((variant: 'success'|'error'|'warning'|'info', title: string, message: string, duration = 3000) => {
    setAlertProps({ variant, title, message, duration });
  }, []);

  // Listen for road selection events dispatched by Road.tsx when the map
  // layer wants to select a road for editing synchronously.
  useEffect(() => {
    try { console.log('[UserMaps] mounting: installing road-selected-for-edit listener'); } catch { /* ignore */ }
    const onSelectForEdit = (ev: Event) => {
      try {
        const ce = ev as CustomEvent<Record<string, unknown>>;
        const detail = ce.detail || {};
        const id = detail.id ?? detail.uuid ?? detail.id;
        const sid = id != null ? String(id) : null;
        if (!sid) return;
        try { console.log('[UserMaps] received gistreeview:road-selected-for-edit', { detail, editModeRefCurrent: editModeRef.current, activeControl: activeControlRef.current }); } catch { /* ignore */ }
        const name = (detail.nameroad ?? detail.name) as string | undefined;
        const color = detail.color as string | undefined;
        const status = detail.status as string | undefined;
        
        // First, set edit mode and update all related states
  setEditMode(true);
  if (editModeRef) editModeRef.current = true;
        try { (window as unknown as { __gistreeviewEditMode?: boolean }).__gistreeviewEditMode = true; } catch { /* ignore */ }
        
        // Then set active control and show form
  // Ensure we use the setter so refs/state stay in sync
  setActiveControl('editRoad');
        setShowEditForm(true);
        
        // Finally set the editing properties
        setEditingProps({ nameroad: name || '', color: color || undefined, status: status || 'unknown' });
        setEditingRoadId(sid);
        
        // Log the state change
        try { 
          console.log('[UserMaps] road selected for edit -> updating state', { 
            sid, 
            name, 
            editMode: true, 
            activeControl: 'editRoad',
            showEditForm: true 
          }); 
        } catch { /* ignore */ }
      } catch { /* ignore */ }
    };
  try { window.addEventListener('gistreeview:road-selected-for-edit', onSelectForEdit as EventListener); } catch { /* ignore */ }
  // Also attempt to listen in the capture phase as a fallback for any dispatch timing issues
  try { window.addEventListener('gistreeview:road-selected-for-edit', onSelectForEdit as EventListener, true); } catch { /* ignore */ }
    try { (window as unknown as { __gistreeview_userMaps_listeners?: boolean }).__gistreeview_userMaps_listeners = true; } catch { /* ignore */ }
    try { console.log('[UserMaps] installed gistreeview:road-selected-for-edit listeners (window+capture)'); } catch { /* ignore */ }
    return () => { try { window.removeEventListener('gistreeview:road-selected-for-edit', onSelectForEdit as EventListener); } catch { /* ignore */ } try { window.removeEventListener('gistreeview:road-selected-for-edit', onSelectForEdit as EventListener, true); } catch { /* ignore */ } };
  }, []);

  // Expose the app showAlert globally so portaled components (modals/popups)
  // can call it without prop-drilling. This is a convenience bridge used
  // by the report modal. We attach on mount and remove on unmount.
  useEffect(() => {
    try {
      (window as unknown as { showAlert?: typeof showAlert }).showAlert = showAlert;
    } catch { /* ignore */ }
    return () => { try { delete (window as unknown as { showAlert?: typeof showAlert }).showAlert; } catch { /* ignore */ } };
  }, [showAlert]);

  useEffect(() => {
    // Listen for requests to close the currently open popup (dispatched by modals)
    const onClosePopup = () => {
      try {
        setPopupPos(null);
        setPopupContent(null);
      } catch (err) { void err; }
    };
  try { window.addEventListener('gistreeview:close-popup', onClosePopup); } catch { /* ignore */ }
  return () => { try { window.removeEventListener('gistreeview:close-popup', onClosePopup); } catch { /* ignore */ } };
  }, []);

  // Intercept road click events so we can open the edit panel when edit mode
  // is active. Road.tsx dispatches a cancellable 'gistreeview:road-click' before
  // opening the modal; here we listen and prevent it when we handle the click.
  useEffect(() => {
    try { console.log('[UserMaps] mounting: installing gistreeview:road-click listener'); } catch { /* ignore */ }
    // Register the listener only once and consult the synchronous refs so the
    // handler sees the most up-to-date mode even if a click happens before
    // React has finished a re-render after toggling controls.
    const onRoadClick = (ev: Event) => {
      try {
        const ce = ev as CustomEvent<Record<string, unknown>>;
        const detail = ce.detail || {};
        const id = detail.id ?? detail.uuid ?? detail.id;
        try { console.log('[UserMaps] received gistreeview:road-click', { detail, editModeRefCurrent: editModeRef.current, activeControlRefCurrent: activeControlRef.current }); } catch { /* ignore */ }

        // Use the synchronous ref so the mount-only listener sees latest control state
        const shouldHandle = activeControlRef.current === 'editRoad';
        
        if (shouldHandle) {
          try { if (ev && typeof (ev as CustomEvent).preventDefault === 'function') (ev as CustomEvent).preventDefault(); } catch { /* ignore */ }
          const sid = id != null ? String(id) : null;
          if (!sid) return;
          const name = (detail.nameroad ?? detail.name) as string | undefined;
          const color = detail.color as string | undefined;
          const status = detail.status as string | undefined;
          try { console.log('[UserMaps] handling road-click -> opening editor', { sid, name, activeControlRefCurrent: activeControlRef.current }); } catch { /* ignore */ }

          // Ensure edit mode flags are set
          setEditMode(true);
          if (editModeRef) editModeRef.current = true;
          setShowEditForm(true);
          setEditingProps({ nameroad: name || '', color: color || undefined, status: status || 'unknown' });
          setEditingRoadId(sid);
        }
      } catch (err) { void err; }
    };
    try { window.addEventListener('gistreeview:road-click', onRoadClick as EventListener); } catch { /* ignore */ }
    try { window.addEventListener('gistreeview:road-click', onRoadClick as EventListener, true); } catch { /* ignore */ }
    try { (window as unknown as { __gistreeview_userMaps_listeners?: boolean }).__gistreeview_userMaps_listeners = true; } catch { /* ignore */ }
    try { console.log('[UserMaps] installed gistreeview:road-click listeners (window+capture)'); } catch { /* ignore */ }
    return () => { try { window.removeEventListener('gistreeview:road-click', onRoadClick as EventListener); } catch { /* ignore */ } try { window.removeEventListener('gistreeview:road-click', onRoadClick as EventListener, true); } catch { /* ignore */ } };
  }, []);

    // load trees from API
    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch(apiUrl('/api/trees'));
          if (!res.ok) return;
          const data = await res.json();
          if (!cancelled) setTrees(data || []);
        } catch (e) { console.error('Failed to load trees', e); }
      })();
      return () => { cancelled = true; };
    }, []);


      // Use pre-colored static SVGs in public/icons for consistent rendering
      // base static icons used as fallback; we'll create dynamic sized icons from these
      const baseIconUrls = useMemo(() => ({
        good: '/icons/tree-good.svg',
        warning: '/icons/tree-warning.svg',
        danger: '/icons/tree-danger.svg',
      }), [] as const);

      // cache of created icons by key `${status}:${size}`
      const iconCacheRef = useRef<Record<string, L.Icon>>({});

      // horror icon cache for selected markers
      const horrorIconCacheRef = useRef<Record<number, L.Icon>>({});

      const getHorrorIconForZoom = useCallback((zoom: number) => {
        const maxZoom = 22;
        const minVisibleZoom = 16;
        if (typeof zoom !== 'number' || zoom < minVisibleZoom) return null;
        const t = Math.min(1, Math.max(0, (zoom - minVisibleZoom) / (maxZoom - minVisibleZoom)));
        const size = Math.round(18 + (64 - 18) * t);
        if (horrorIconCacheRef.current[size]) return horrorIconCacheRef.current[size];
        const icon = L.icon({ iconUrl: '/icons/tree-horror-svgrepo-com.svg', iconSize: [size, size], iconAnchor: [Math.round(size/2), size], popupAnchor: [0, -Math.round(size/2)], className: 'tree-horror-icon' });
        horrorIconCacheRef.current[size] = icon;
        return icon;
      }, []);

      const getIconForZoom = useCallback((status: 'good'|'warning'|'danger', zoom: number) => {
        // Compute size: below 16 hidden, at 16 render a very small dot, then smoothly scale up to a larger icon at max zoom
        const maxZoom = 22;
        const minVisibleZoom = 16;
  const maxSize = 64; // px at max zoom
  const minSize = 4; // px at zoom == minVisibleZoom -> smaller dot
        if (typeof zoom !== 'number' || zoom < minVisibleZoom) return null;
  // Use a non-linear ease (quadratic) so growth is slower just above minVisibleZoom
  const rawT = Math.min(1, Math.max(0, (zoom - minVisibleZoom) / (maxZoom - minVisibleZoom)));
  const t = rawT * rawT; // ease-in (t^2)
  const size = Math.max(2, Math.round(minSize + (maxSize - minSize) * t));
        const key = `${status}:${size}`;
        if (iconCacheRef.current[key]) return iconCacheRef.current[key];

        // For very small sizes, draw a simple colored circle SVG as data URI for crispness.
        const colorForStatus = status === 'good' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';
        const useSvg = size <= 18; // use simple circle SVG for small sizes
        let icon: L.Icon;
        if (useSvg) {
          const r = Math.max(1, Math.floor(size / 2));
          const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><circle cx='${size/2}' cy='${size/2}' r='${r}' fill='${colorForStatus}'/></svg>`;
          const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
          icon = L.icon({ iconUrl: url, iconSize: [size, size], iconAnchor: [Math.round(size/2), size], popupAnchor: [0, -Math.round(size/2)], className: 'tree-icon' });
        } else {
          // For larger sizes reuse the colored SVG files from public icons for richer appearance
          const url = baseIconUrls[status];
          icon = L.icon({ iconUrl: url, iconSize: [size, size], iconAnchor: [Math.round(size/2), size], popupAnchor: [0, -Math.round(size/2)], className: 'tree-icon' });
        }
        iconCacheRef.current[key] = icon;
        return icon;
      }, [baseIconUrls]);

      const geoStyle = useCallback((feature: GeoJSON.Feature | undefined) => {
        const feat = feature as GeoJSON.Feature | undefined;
        const props = (feat?.properties || {}) as RoadFeatureProperties;
        // Scale weight with zoom: base weight at zoom 16, increase up to zoom 22
        const minZoom = 16;
        const maxZoom = 22;
        const baseWeight = 2; // weight at minZoom
        const maxWeight = 8;  // weight at maxZoom
        const z = typeof zoomLevel === 'number' ? zoomLevel : minZoom;
        const t = Math.min(1, Math.max(0, (z - minZoom) / (maxZoom - minZoom)));
        const weight = Math.round(baseWeight + (maxWeight - baseWeight) * t);
        const highlight = editingRoadId === props.id ? Math.max(weight, 6) : weight;
        return { color: props.color || '#ff5722', weight: highlight, opacity: 0.95 } as L.PathOptions;
      }, [editingRoadId, zoomLevel]);

  // Effect to synchronize editMode with global state
  useEffect(() => {
    try {
      (window as unknown as { __gistreeviewEditMode?: boolean }).__gistreeviewEditMode = editMode;
      if (editModeRef) editModeRef.current = editMode;
      
      // If edit mode is active, ensure active control is set
      if (editMode && activeControl !== 'editRoad') {
        setActiveControl('editRoad');
      }
    } catch { /* ignore */ }
  }, [editMode, activeControl]);

  // geoJsonElement has been extracted to UiMaps/Road component

      try {
        if (renderError) throw renderError;
        return (
          <div ref={wrapperRef} className="relative w-full" style={{ height }}>
          {/* Alerts */}
          {alertProps ? (
            <Alert
              variant={alertProps.variant}
              title={alertProps.title}
              message={alertProps.message}
              duration={alertProps.duration ?? 3000}
              onClose={() => setAlertProps(null)}
            />
          ) : null}

          {/* Active control info window (top center) */}
          {activeControl ? (
            <div className="absolute left-1/2 transform -translate-x-1/2 top-3 z-[10002] hidden sm:flex">
              <div className="bg-white/95 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-full shadow flex items-center gap-3" style={{ minWidth: 220 }}>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold">{
                    activeControl === 'layers' ? t('userMap.activeControls.layers') :
                    activeControl === 'locate' ? t('userMap.activeControls.locate') :
                    activeControl === 'editRoad' ? t('userMap.activeControls.editRoad') :
                    activeControl === 'filters' ? t('userMap.activeControls.filters') :
                    activeControl === 'addTree' ? t('userMap.activeControls.addTree') :
                    activeControl === 'editTree' ? t('userMap.activeControls.editTree') :
                    activeControl === 'deleteTree' ? t('userMap.activeControls.deleteTree') : ''
                  }</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                      {activeControl === 'editRoad' && t('userMap.help.editRoad')}
                      {activeControl === 'editTree' && t('userMap.help.editTree')}
                      {activeControl === 'locate' && t('userMap.help.locate')}
                      {activeControl === 'filters' && t('userMap.help.filters')}
                      {activeControl === 'addTree' && t('userMap.help.addTree')}
                      {activeControl === 'deleteTree' && t('userMap.help.deleteTree')}
                    </div>
                </div>
                <button className="ml-auto text-sm text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white px-1" onClick={() => activateControl(null)} aria-label="Close active control">×</button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 absolute left-3" style={{ top: 10, zIndex: 10000 }}>
            {/* Fullscreen + Zoom always available (even when role is null) */}
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

            {/* Controls shown for roles user/officer/admin */}
            {role !== null ? (
              <>
                {/* Map Layers */}
                <div className="mt-2">
                  <LayerPicker baseLayer={baseLayer} onChange={(v) => { setBaseLayer(v); showAlert('info', 'Layer switched', `Now showing ${v}`); }} btnSize={btnSize} open={activeControl === 'layers'} onOpenChange={(v) => setExclusiveControl(v ? 'layers' : null)} />
                </div>

                {/* Locate Me */}
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

                {/* Edit Road - officer and admin only */}
                {(role === 'officer' || role === 'admin') && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <EditRoadButton onToggle={() => {
                        const turningOn = activeControl !== 'editRoad';
                        // First update editMode and editModeRef
                        setEditMode(turningOn);
                        if (editModeRef) editModeRef.current = turningOn;
                        // Then set the active control
                        setExclusiveControl(turningOn ? 'editRoad' : null);
                        if (turningOn) {
                          setShowEditForm(true);
                          // Set global flag for immediate access by event handlers
                          try { (window as unknown as { __gistreeviewEditMode?: boolean }).__gistreeviewEditMode = true; } catch { /* ignore */ }
                        } else {
                          setShowEditForm(false);
                          setEditingRoadId(null);
                          setEditingProps({});
                          try { (window as unknown as { __gistreeviewEditMode?: boolean }).__gistreeviewEditMode = false; } catch { /* ignore */ }
                        }
                      }} active={activeControl === 'editRoad' || editMode} btnSize={btnSize} />
                      {/* helper text moved to top-center info window when editRoad is active */}
                    </div>

                    {editingRoadId ? (
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
                            <input className="border p-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs sm:text-sm" value={editingProps.nameroad || ''} onChange={(e) => setEditingProps((s) => ({ ...s, nameroad: e.target.value }))} />
                            <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.editRoad.colorLabel')}</label>
                            <div className="grid grid-cols-5 gap-2">
                              {PALETTE.map((sw) => (
                                <button key={sw} type="button" onClick={() => setEditingProps((s) => ({ ...s, color: sw }))} title={sw} aria-label={`Select color ${sw}`} className={`w-6 h-6 rounded border ${editingProps.color === sw ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`} style={{ background: sw }} />
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
                                        const p = (f.properties || {}) as RoadFeatureProperties;
                                        if (String(p.id || f.id) === String(editingRoadId)) {
                                          const newProps = { ...p, nameroad: editingProps.nameroad, color: editingProps.color, status: editingProps.status } as RoadFeatureProperties & Record<string, unknown>;
                                          return { ...f, properties: newProps } as GeoJSON.Feature;
                                        }
                                        return f;
                                      });
                                      setRoadsGeoJson(updated);
                                      setRoadsVersion((v) => v + 1);
                                    }
                                  } catch (e) { void e; }
                                  setSaveStatus('Saved');
                                  setTimeout(() => setSaveStatus(null), 2000);
                                  setEditingRoadId(null);
                                  setEditingProps({});
                                  // notify user of success
                                  showAlert('success', t('userMap.editRoad.savedTitle'), t('userMap.editRoad.savedMessage'));
                                } catch (err) {
                                  console.error('Failed to update road', err);
                                  setSaveStatus('Failed to save');
                                  showAlert('error', t('userMap.editRoad.failedTitle'), t('userMap.editRoad.failedMessage'));
                                }
                              }} type="button">{t('common.save')}</button>
                              <button className="px-3 py-1 bg-gray-200 dark:bg-gray-600 dark:text-gray-100 rounded" onClick={() => { setEditingRoadId(null); setEditingProps({}); activateControl(null); }} type="button">{t('common.cancel')}</button>
                            </div>
                            {saveStatus ? <div className="text-xs text-green-600">{saveStatus}</div> : null}
                            {/* Debug props removed per user request */}
                          </div>
                        </PanelBox>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Filter Status - all logged-in users */}
                <div className="mt-2">
                  <StatusFilterButton filters={filters} onChange={(s) => setFilters(s)} btnSize={btnSize} open={activeControl === 'filters'} onOpenChange={(v) => setExclusiveControl(v ? 'filters' : null)} />
                </div>

                {editMessage && <div className="mt-2 text-xs text-red-600 dark:text-red-400">{editMessage}</div>}
              </>
            ) : null}
          </div>

          {/* Tree Management Controls - Right Side */}
          <div className="absolute right-3" style={{ top: 10, zIndex: 10000, overflow: 'visible' }}>
            <div className="flex flex-col gap-2">
              {/* Right-side controls vary by role:
                  - null: none (management controls hidden)
                  - user: none (only left-side controls)
                  - officer: EditTree
                  - admin: AddTree, EditTree, DeleteTree
              */}
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
                  onCancel={() => { activateControl(null); setAddTreeMode(false); setPickedLatLng(null); setPickedRoadId(null); setPickedRoadName(null); setEditingTree(null); setRoadPickModeSafe(false); }}
                  onCreated={() => { handleTreeCreated(); activateControl(null); setAddTreeMode(false); setPickedLatLng(null); setPickedRoadId(null); setPickedRoadName(null); setEditingTree(null); setRoadPickModeSafe(false); showAlert('success', t('userMap.tree.addedTitle'), t('userMap.tree.addedMessage')); }}
                  roadId={pickedRoadId || undefined}
                  roadName={pickedRoadName || undefined}
                  roadPickActive={roadPickMode}
                  onToggleRoadPick={(v) => {
                    try { console.log('[UserMaps] AddTree onToggleRoadPick called', { requested: v }); } catch { /* ignore */ }
                    if (v) {
                      setPickedLatLng(null);
                    }
                    setRoadPickModeSafe(v);
                  }}
                />
              )}

              {/* Edit Tree: officer + admin */}
              {(role === 'officer' || role === 'admin') && (
                <EditTreeButton 
                    active={activeControl === 'editTree'}
                    onToggle={() => {
                      // Delegate toggling entirely to setExclusiveControl so the
                      // single-button toggle reliably turns the mode on/off and
                      // central state (showEditForm, editingTree) is handled there.
                      setExclusiveControl(activeControl !== 'editTree' ? 'editTree' : null);
                    }}
                  btnSize={btnSize}
                  showEditForm={showEditForm}
                  editingTree={editingTree}
                  onCancel={() => { /* keep edit-tree control active when user closes panel */ setShowEditForm(false); setEditingTree(null); setRoadPickModeSafe(false); }}
                  onCreated={() => { handleTreeCreated(); activateControl(null); setShowEditForm(false); setEditingTree(null); setRoadPickModeSafe(false); showAlert('success', t('userMap.tree.updatedTitle'), t('userMap.tree.updatedMessage')); }}
                  roadId={pickedRoadId || undefined}
                  roadName={pickedRoadName || undefined}
                  roadPickActive={roadPickMode}
                  onToggleRoadPick={(v) => { if (v) setPickedLatLng(null); setRoadPickModeSafe(v); }}
                  
                />
              )}

              {/* Delete Tree: admin only */}
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
                  onDeleted={(count:number) => { showAlert('success', t('userMap.tree.deletedTitle'), t('userMap.tree.deletedMessage', { count })); }}
                />
              )}
            </div>
          </div>
          <MapContainer
            center={AMBON_CENTER}
            zoom={17}
            minZoom={11}
            maxZoom={22}
            maxBounds={AMBON_BOUNDS}
            maxBoundsViscosity={1}
            scrollWheelZoom
            preferCanvas={true}
            style={{ height: '100%', width: '100%' }}
            className="leaflet-container"
            zoomControl={false}
            ref={(mapRef) => {
              if (mapRef && typeof (mapRef as unknown) !== 'function') {
                try { setMapInstance(mapRef as unknown as LeafletMap); } catch (e) { void e; }
              }
            }}
          >
            {baseLayer === 'osm' && (
              <TileLayer key="osm" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={22} maxZoom={22} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
            )}
            {baseLayer === 'carto' && (
              <TileLayer key="carto" url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" maxNativeZoom={22} maxZoom={22} attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>' />
            )}
            {/* Dark basemap for dark mode */}
            {baseLayer === 'dark' && (
              <TileLayer key="dark" url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png" maxNativeZoom={22} maxZoom={22} attribution='&copy; <a href="https://carto.com/attributions">CARTO Dark</a>' />
            )}
            {baseLayer === 'transport' && (
              <TileLayer key="transport" url={transportUrl} maxNativeZoom={22} maxZoom={22} attribution="Map data &copy; OpenStreetMap contributors, Tiles &copy; Thunderforest (or HOT fallback)" />
            )}
            {baseLayer === 'topo' && (
              <TileLayer key="topo" url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" maxNativeZoom={17} maxZoom={17} attribution="Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)" />
            )}
            {/* shortbread removed */}
            {/* shortbread overlay removed per user request */}

            {/* Ambon city center marker removed per user request */}

            {/* Coordinate picker panel shown next to Locate button */}
            {/* Render trees as SVG-icon markers based on status; only when zoom >= 16 */}
            {Array.isArray(trees) ? trees.filter((t) => {
              if (!t) return false;
              const st = (t.status || 'good').toString();
              const lat = typeof t.latitude === 'number' ? t.latitude : parseFloat(String(t.latitude || ''));
              const lng = typeof t.longitude === 'number' ? t.longitude : parseFloat(String(t.longitude || ''));
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
              if (!filters || !filters.trees) return true;
              return Boolean((filters.trees as Record<string, boolean>)[st]);
            }).map((t) => {
              return (
                <TreeMarker
                  key={t?.id || undefined}
                  t={t as unknown as { id?: string; latitude?: number | string; longitude?: number | string; status?: string; species?: string; road?: { nameroad?: string } | null }}
                  zoomLevel={zoomLevel}
                  getIconForZoom={getIconForZoom}
                  getHorrorIconForZoom={getHorrorIconForZoom}
                  deleteTreeMode={deleteTreeMode}
                  selectedForDelete={selectedForDelete}
                  setSelectedForDelete={setSelectedForDelete}
                  editTreeMode={editTreeMode}
                  setEditingTree={setEditingTree}
                  addTreeMode={addTreeMode}
                  setPickedLatLng={setPickedLatLng}
                  onTreeClick={onTreeClick}
                />
              );
            }) : null}
            <Road
              key={`roads-${roadsVersion}-${JSON.stringify(filters.roads)}`}
              roadsGeoJson={roadsGeoJson}
              roadsVersion={roadsVersion}
              editMode={editMode}
              editModeRef={editModeRef}
              geoStyle={geoStyle}
              zoomLevel={zoomLevel}
              filters={filters}
              addTreeMode={addTreeMode}
              pickedLatLng={pickedLatLng}
              roadPickMode={roadPickMode}
              setPickedLatLng={setPickedLatLng}
              setPickedRoadId={setPickedRoadId}
              setPickedRoadName={setPickedRoadName}
              setRoadPickMode={setRoadPickModeSafe}
              trees={trees}
            />
            {popupPos && popupContent ? (
              <div
                className="fixed z-[10003] left-1/2 transform -translate-x-1/2"
                style={{
                  top: '10px',
                  width: '90%',
                  maxWidth: 400,
                  pointerEvents: 'auto',
                  // Responsive: hanya pada layar kecil
                  ...(window.innerWidth <= 640 ? {
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: '10px',
                  } : {})
                }}
              >
                <MapPopup map={mapInstance} position={popupPos} onClose={() => handleShowPopup(null, null)}>
                  {popupContent}
                </MapPopup>
              </div>
            ) : null}
            {addTreeMode && pickedLatLng ? (
              <Marker
                position={[pickedLatLng.lat, pickedLatLng.lng]}
                icon={customPin as unknown as L.Icon}
                draggable
                eventHandlers={{
                  dragend: (e: L.DragEndEvent) => {
                    try {
                      const target = (e as unknown as { target?: { getLatLng?: () => { lat:number; lng:number } } }).target;
                      if (target && typeof target.getLatLng === 'function') {
                        const p = target.getLatLng();
                        setPickedLatLng({ lat: p.lat, lng: p.lng });
                      }
                    } catch { /* ignore */ }
                  }
                }}
              />
            ) : null}

            { /* Mount the global report modal only for authenticated users (role != null). */ }
            {role !== null ? <ReportTreeForm /> : null}
            { /* Also mount the example modal dialog used by popups for demo */ }
            <ExampleModalDialog id="basicModal" title="Report (example)" />
            { /* Mount the road modal so Road clicks can open it via event */ }
            <RoadModalDialog />
            
          </MapContainer>
          {/* panel rendered next to Locate button below in the left controls column */}
          </div>
        );
      } catch (err) {
        console.error('Render error in UserMaps', err);
        // show fallback UI with error message for debugging
        return (
          <div ref={wrapperRef} className="relative w-full" style={{ height, padding: 12 }}>
            <div className="bg-red-50 border border-red-200 text-red-900 p-3 rounded">
              <strong>Map render error</strong>
              <pre className="text-xs mt-2">{String(err)}</pre>
              <button className="mt-2 px-3 py-1 bg-gray-200 rounded" onClick={() => setRenderError(null)}>Retry</button>
            </div>
          </div>
        );
      }
    };

    export default UserMaps;
