import React, { useEffect, useRef } from 'react';
import type { Tree } from '../types';
import { Marker, CircleMarker } from 'react-leaflet';
import type L from 'leaflet';

type Props = {
  t: Tree;
  zoomLevel: number;
  getIconForZoom: (status: 'good'|'warning'|'danger', zoom: number) => L.Icon | null;
  getHorrorIconForZoom: (zoom: number) => L.Icon | null;
  deleteTreeMode: boolean;
  selectedForDelete: Set<string>;
  setSelectedForDelete: React.Dispatch<React.SetStateAction<Set<string>>>;
  editTreeMode: boolean;
  setEditingTree: (tr: Tree | null) => void;
  // setShowEditForm removed: selection now only sets editingTree; parent toggles the form
  addTreeMode: boolean;
  setPickedLatLng: (p: { lat: number; lng: number } | null) => void;
  setUserPos?: (p: [number, number] | null) => void;
  onTreeClick?: (tree: Tree) => void;
};

const TreeMarker: React.FC<Props> = ({ t, zoomLevel, getIconForZoom, getHorrorIconForZoom, deleteTreeMode, selectedForDelete, setSelectedForDelete, editTreeMode, setEditingTree, addTreeMode, setPickedLatLng, onTreeClick }) => {
  // Refs to access underlying Leaflet layer instances for fallback DOM listeners
  const markerDomRef = useRef<L.Marker | null>(null);
  const circleDomRef = useRef<L.CircleMarker | null>(null);

  // Compute positional and status values up-front so hooks are called
  // unconditionally (React rules require hooks to run in the same order).
  const lat = t && typeof t.latitude === 'number' ? t.latitude : parseFloat(String(t?.latitude || ''));
  const lng = t && typeof t.longitude === 'number' ? t.longitude : parseFloat(String(t?.longitude || ''));
  const st = ((t && t.status) || 'good').toString() as 'good'|'warning'|'danger';
  const icon = getIconForZoom(st, zoomLevel);
  const isSelected = Boolean(t && t.id && selectedForDelete.has(String(t.id)));
  const markerIcon = isSelected ? (getHorrorIconForZoom(zoomLevel) as L.Icon) : (icon as L.Icon);

  const handleClick = React.useCallback(async () => {
    try {
      console.debug('[TreeMarker] handleClick', { id: t?.id, editTreeMode, deleteTreeMode, addTreeMode });
      // Toggle selection for delete mode
      if (deleteTreeMode) {
        if (!t || !t.id) return;
        setSelectedForDelete((prev) => {
          const next = new Set(prev);
          if (next.has(String(t.id))) next.delete(String(t.id)); else next.add(String(t.id));
          return next;
        });
        return;
      }

      // Edit mode: fetch full record and set editing
      if (editTreeMode) {
        try {
          if (!t || !t.id) return;
          const res = await fetch(`/api/trees/${t.id}`);
          if (res.ok) {
            const full = await res.json();
            setEditingTree(full);
          } else {
            setEditingTree(t);
          }
        } catch (e) {
          console.error('Failed to fetch full tree record', e);
          setEditingTree(t);
        }
        console.debug('[TreeMarker] entering editTreeMode -> setEditingTree', { id: t?.id });
        try { (window as unknown as { mapInstance?: { panTo?: (a: [number, number]) => void } }).mapInstance?.panTo?.([lat, lng]); } catch { /* ignore */ }
        return;
      }

      // Add tree mode: pick this location
      if (addTreeMode) {
        setPickedLatLng({ lat, lng });
        return;
      }

      // Normal click: clear any selection and open modal/popup via custom event (legacy behaviour)
      if (!deleteTreeMode && !editTreeMode) {
        try {
          // ensure parent does not keep an editing selection which would show the
          // side edit panel. Clear it before dispatching the legacy modal event.
          try { setEditingTree(null); } catch { /* ignore */ }
          console.debug('[TreeMarker] normal click -> cleared editingTree and dispatch legacy modal', { id: t?.id });
          const detail = {
            title: t.species ?? 'Tree',
            description: t.description ?? '',
            id: t.id,
            lat,
            lng,
            ownership: t.ownership ?? null,
            age: t.age ?? null,
            trunk_diameter: t.trunk_diameter ?? null,
            lbranch_width: t.lbranch_width ?? null,
            roadName: t.road?.nameroad ?? null,
            status: t.status ?? null,
          };
          // Open the modal via global custom event (original behaviour)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gistreeview:open-example-modal', { detail }));
          }
          // Also inform parent via optional callback
          try {
            if (typeof onTreeClick === 'function') onTreeClick(t as Tree);
          } catch { /* ignore */ }
        } catch (_e) { void _e; }
      }
  } catch { /* ignore */ }
  }, [addTreeMode, deleteTreeMode, editTreeMode, setEditingTree, setPickedLatLng, setSelectedForDelete, t, lat, lng, onTreeClick]);

  useEffect(() => {
    const tryAttach = (ref: React.RefObject<L.Marker | L.CircleMarker | null>) => {
      try {
        if (!ref || !ref.current) return null;
        const inst = ref.current as unknown;
        // access internal DOM element used by Leaflet marker/circle
        // Use guarded property access on unknown and narrow to HTMLElement when possible
        let el: unknown = null;
        try {
          // Access internals via index signature to avoid `any`
          const obj = inst as { [k: string]: unknown };
          el = (obj['_icon'] as unknown) ?? null;
        } catch { el = null; }
        if (!el) {
          try {
            // prefer getElement() when available
            const obj = inst as { [k: string]: unknown };
            const getEl = obj['getElement'] as unknown;
            if (typeof getEl === 'function') el = (getEl as () => unknown).call(inst);
          } catch { /* ignore */ }
        }
        if (!el) {
          try { const obj = inst as { [k: string]: unknown }; el = (obj['_path'] as unknown) ?? null; } catch { /* ignore */ }
        }
        return el instanceof HTMLElement ? el : null;
      } catch { return null; }
    };

    const markerEl = tryAttach(markerDomRef);
    const circleEl = tryAttach(circleDomRef);

    const onDomClick = (ev: Event) => {
      try { ev.stopPropagation(); void handleClick(); } catch { /* ignore */ }
    };

    if (markerEl) markerEl.addEventListener('click', onDomClick);
    if (circleEl) circleEl.addEventListener('click', onDomClick);

    return () => {
      try { if (markerEl) markerEl.removeEventListener('click', onDomClick); } catch { /* ignore */ }
      try { if (circleEl) circleEl.removeEventListener('click', onDomClick); } catch { /* ignore */ }
    };
  }, [handleClick]);

  // Guard rendering after hooks to keep hook order stable
  if (!t) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!icon) return null;

  return (
    <>
      {/* Attach a ref to the Marker so we can add a DOM-level click listener as a fallback
          in case Leaflet's event handling or overlay ordering prevents React-Leaflet clicks.
      */}
      <Marker
        key={t.id || `${lat}-${lng}-${t.id}`}
        position={[lat, lng]}
        icon={markerIcon}
        eventHandlers={{ click: () => void handleClick() }}
        ref={(r) => { markerDomRef.current = r as unknown as L.Marker | null; }}
      >
      {/* Popup opened via global custom event; no onShowPopup prop is used */}
      </Marker>

      {/* Invisible larger hit area to make tree clicks easier */}
      <CircleMarker
        center={[lat, lng]}
        radius={Math.min(Math.max(8, 2 + (18 - Math.floor(zoomLevel || 16))), 24)}
        pathOptions={{ color: '#000', opacity: 0, fillOpacity: 0 }}
        eventHandlers={{ click: () => void handleClick() }}
        ref={(r) => { circleDomRef.current = r as unknown as L.CircleMarker | null; }}
      />
    </>
  );
};

export default TreeMarker;
