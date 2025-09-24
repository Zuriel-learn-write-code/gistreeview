import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { Map as LeafletMap, LatLngExpression } from 'leaflet';

type MapPopupProps = {
  map: LeafletMap | null;
  position: { lat: number; lng: number } | null;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
};

const MapPopup: React.FC<MapPopupProps> = ({ map, position, onClose, children, className = '' }) => {
  const [style, setStyle] = useState<{ left: number; top: number; visibility?: string; centered?: boolean } | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // mounted: whether popup DOM should exist (used to animate out)
  const [mounted, setMounted] = useState<boolean>(!!(map && position));
  // shown: control CSS show/hide for animation
  const [shown, setShown] = useState<boolean>(!!(map && position));
  const ANIM_MS = 220;

  const update = useCallback(() => {
    try {
      if (!map) return; // if no map, nothing to compute
      if (!position) return; // keep last style so exit animation can run
      const container = map.getContainer();
      if (!container) return setStyle(null);
      const pt = map.latLngToContainerPoint([position.lat, position.lng] as LatLngExpression);
      const rect = container.getBoundingClientRect();
      // If on small screens, place popup centered horizontally and 10px from top of the map container
      const isSmall = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
      if (isSmall) {
        const left = Math.round(rect.left + rect.width / 2);
        const top = Math.round(rect.top + 10); // 10px from top of map container
        setStyle({ left, top, visibility: 'visible', centered: true });
        // adjust after render when we can measure popup size
        setTimeout(() => {
          try {
            const el = wrapperRef.current;
            if (!el) return;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            let adjLeft = left;
            let adjTop = top;
            const minLeft = rect.left + 10;
            const maxRight = rect.right - 10;
            const minTop = rect.top + 10;
            const maxBottom = rect.bottom - 10;
            // centered: transform(-50%, 0)
            let leftEdge = adjLeft - w / 2;
            let rightEdge = adjLeft + w / 2;
            let topEdge = adjTop;
            let bottomEdge = adjTop + h;
            if (leftEdge < minLeft) adjLeft += (minLeft - leftEdge);
            if (rightEdge > maxRight) adjLeft -= (rightEdge - maxRight);
            // recompute vertical edges
            leftEdge = adjLeft - w / 2;
            rightEdge = adjLeft + w / 2;
            topEdge = adjTop;
            bottomEdge = adjTop + h;
            if (topEdge < minTop) adjTop += (minTop - topEdge);
            if (bottomEdge > maxBottom) adjTop -= (bottomEdge - maxBottom);
            setStyle({ left: Math.round(adjLeft), top: Math.round(adjTop), visibility: 'visible', centered: true });
          } catch { /* ignore */ }
        }, 0);
      } else {
        // Position relative to viewport so we can portal to body
        const left = Math.round(rect.left + pt.x);
        const top = Math.round(rect.top + pt.y);
        setStyle({ left, top, visibility: 'visible', centered: false });
        setTimeout(() => {
          try {
            const el = wrapperRef.current;
            if (!el) return;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            let adjLeft = left;
            let adjTop = top;
            const minLeft = rect.left + 10;
            const maxRight = rect.right - 10;
            const minTop = rect.top + 10;
            const maxBottom = rect.bottom - 10;
            // non-centered: transform(-50%, -110%)
            let leftEdge = adjLeft - w / 2;
            let rightEdge = adjLeft + w / 2;
            let topEdge = adjTop - Math.round(h * 1.1);
            let bottomEdge = topEdge + h;
            if (leftEdge < minLeft) adjLeft += (minLeft - leftEdge);
            if (rightEdge > maxRight) adjLeft -= (rightEdge - maxRight);
            // recompute horizontal edges
            leftEdge = adjLeft - w / 2;
            rightEdge = adjLeft + w / 2;
            // adjust vertical
            topEdge = adjTop - Math.round(h * 1.1);
            bottomEdge = topEdge + h;
            if (topEdge < minTop) adjTop += (minTop - topEdge);
            if (bottomEdge > maxBottom) adjTop -= (bottomEdge - maxBottom);
            setStyle({ left: Math.round(adjLeft), top: Math.round(adjTop), visibility: 'visible', centered: false });
          } catch { /* ignore */ }
        }, 0);
      }
  } catch { setStyle(null); }
  }, [map, position]);

  useEffect(() => {
    // manage mount/show lifecycle when position/map change
    if (position && map) {
      setMounted(true);
      // small delay so CSS transition can pick up
      requestAnimationFrame(() => setShown(true));
      // compute layout for visible popup
      update();
    } else {
      // start hide animation
      setShown(false);
      // after animation, remove from DOM
      const t = setTimeout(() => setMounted(false), ANIM_MS + 20);
      // don't clear style here; keep last measured style so it can animate out in place
      // ensure we cleanup timer if dependencies change
      return () => clearTimeout(t);
    }
    if (!map) return;
    map.on('move zoom resize', update);
    // also listen for fullscreen changes so portal target or layout can update
    const onFs = () => update();
    try { document.addEventListener('fullscreenchange', onFs); } catch { /* ignore */ }
    // Safari/WebKit vendor-prefixed fullscreen event
    try { if ((document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement !== undefined) { document.addEventListener('webkitfullscreenchange', onFs as EventListener); } } catch { /* ignore */ }
    return () => {
      try { map.off('move zoom resize', update); } catch { /* ignore */ }
      try { document.removeEventListener('fullscreenchange', onFs); } catch { /* ignore */ }
      try { if ((document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement !== undefined) { document.removeEventListener('webkitfullscreenchange', onFs as EventListener); } } catch { /* ignore */ }
    };
  }, [map, position, update]);

  if (!mounted || !map) return null;

  const content = (
    <div ref={wrapperRef} style={{ position: 'fixed', left: style ? style.left : 0, top: style ? style.top : 0, transform: style && style.centered ? 'translate(-50%, 0)' : 'translate(-50%, -110%)', zIndex: 100000 }}>
      {/* Animated inner wrapper: fade + slight translate on show/hide */}
      <div
        aria-hidden={!shown}
        className={`transition transition-opacity transition-transform duration-200 ease-out ${shown ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
      >
        <div className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded shadow p-3 border border-gray-200 dark:border-gray-700 ${className}`} style={{ minWidth: 160, maxWidth: 320, wordBreak: 'break-word' }}>
          <div className="flex items-start justify-between gap-2">
            <div style={{ flex: 1 }}>{children}</div>
            <button className="ml-2 text-sm text-gray-500 dark:text-gray-300" onClick={() => onClose && onClose()} aria-label="Close popup">✕</button>
          </div>
        </div>
      </div>
    </div>
  );

  // In fullscreen, elements outside the fullscreen element are not visible. Use the
  // fullscreen element (if any) as the portal root so the popup is visible while
  // the map or wrapper is fullscreen. Fall back to document.body otherwise.
  const portalRoot = (document.fullscreenElement as Element) || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement || document.body;
  return ReactDOM.createPortal(content, portalRoot);
};

export default MapPopup;
