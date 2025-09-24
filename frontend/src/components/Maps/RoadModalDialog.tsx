import React, { useEffect, useRef, useState } from 'react';
import { getUserRole } from '../../utils/auth';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

type RoadPayload = {
  id?: string | number | null;
  nameroad?: string | null;
  name?: string | null;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
  treesCount?: number | null;
  roadPictures?: Array<{ id?: string; url?: string }>|null;
};

const RoadModalDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [modalData, setModalData] = useState<RoadPayload | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onOpen = (ev: Event) => {
      try {
        const ce = ev as CustomEvent<RoadPayload>;
        setModalData(ce.detail || null);
      } catch {
        setModalData(null);
      }
      setOpen(true);
    };
    window.addEventListener('gistreeview:open-road-modal', onOpen as EventListener);

    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('gistreeview:open-road-modal', onOpen as EventListener);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!open || !modalData) return null;

  const getPortalRoot = () => {
    try {
      const fs = ((document as unknown) as { fullscreenElement?: Element | null; webkitFullscreenElement?: Element | null }).fullscreenElement || ((document as unknown) as { fullscreenElement?: Element | null; webkitFullscreenElement?: Element | null }).webkitFullscreenElement || null;
      if (fs && fs instanceof HTMLElement) return fs as HTMLElement;
      const leaflet = document.querySelector('.leaflet-container') as HTMLElement | null;
      if (leaflet) return leaflet;
    } catch { /* ignore */ }
    return document.body;
  };

  // Format coordinate helpers: show numbers with a fixed number of decimals when possible.
  const formatCoord = (val: unknown, decimals = 6) => {
    if (val === undefined || val === null) return '-';
    const n = Number(val);
    if (!Number.isFinite(n)) return String(val);
    return n.toFixed(decimals);
  };

  const firstPic = Array.isArray(modalData.roadPictures) && modalData.roadPictures.length > 0 ? (modalData.roadPictures[0] as { id?: string; url?: string } | undefined) : undefined;
  const imgUrl = firstPic && typeof firstPic.url === 'string' ? firstPic.url : null;
  const imgSrc = imgUrl || '/images/road-default.jpg';

  const modal = (
    <div className="relative z-[999999]" aria-modal="true" role="dialog" ref={dialogRef}>
      <div
        className="fixed inset-0 bg-gray-700 bg-opacity-50 backdrop-blur-sm transition-opacity z-[999998]"
        onClick={() => setOpen(false)}
        style={{ backgroundColor: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'rgba(2,6,23,0.6)' : 'rgba(51,65,85,0.5)', backdropFilter: 'blur(4px)' }}
      />

      <div className="fixed z-[999999] inset-0 overflow-y-auto">
        <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                {/* thumbnail left (use default image when no picture available) */}
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 sm:mx-0 bg-gray-100`} style={{ height: 64, width: 64 }}>
                  <img
                    src={imgSrc}
                    alt="road"
                    className="h-16 w-16"
                    style={{ height: 64, width: 64, objectFit: 'cover', borderRadius: 6 }}
                    onError={(e) => { try { (e.currentTarget as HTMLImageElement).src = '/images/road-default.jpg'; } catch { /* ignore */ } }}
                  />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  {/* compute readable name: treat empty/whitespace as missing */}
                  {(() => {
                    const rawName = modalData.nameroad ?? modalData.name ?? null;
                    const name = rawName && String(rawName).trim() ? String(rawName).trim() : 'Unnamed road';
                    return (
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                        {name}
                        <div className="text-xs text-gray-400 mt-1">
                          {typeof modalData.id !== 'undefined' ? (
                            <a
                              href={`/view/road/${encodeURIComponent(String(modalData.id))}`}
                              className="text-xs text-gray-400 hover:underline"
                              onClick={(e) => {
                                try {
                                  e.preventDefault();
                                  const role = getUserRole();
                                  const path = typeof window !== 'undefined' ? window.location.pathname : '';
                                  if (!role || path === '/' || path === '/register') {
                                    // Prefer the app UI alert when available (exposed by UserMaps),
                                    // otherwise fall back to the native alert for compatibility.
                                    try {
                                      const maybeShow = (window as unknown as { showAlert?: ((variant: string, title: string, message: string) => void) | undefined }).showAlert;
                                      if (typeof maybeShow === 'function') maybeShow('warning', t('userMap.report.loginRequiredTitle'), t('userMap.report.loginRequiredMessage'));
                                      else window.alert(t('userMap.report.loginRequiredMessage'));
                                    } catch {
                                      try { window.alert(t('userMap.report.loginRequiredMessage')); } catch { /* ignore */ }
                                    }
                                    return;
                                  }
                                  window.open(`/view/road/${encodeURIComponent(String(modalData.id))}`, '_blank');
                                } catch { /* ignore */ }
                              }}
                            >ID: {String(modalData.id)}</a>
                          ) : null}
                        </div>
                      </h3>
                    );
                  })()}
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-300">{modalData.description ?? 'No description provided.'}</p>
                    <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                      <div className="max-h-56 overflow-auto border border-gray-100 dark:border-gray-600 rounded p-2 bg-gray-50 dark:bg-gray-700">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="text-gray-600 dark:text-gray-300"><strong>{t('userMap.coordinates.title')}</strong></div>
                            <div className="truncate">{formatCoord(modalData.lat, 6)}{modalData.lng != null ? `, ${formatCoord(modalData.lng, 6)}` : ''}</div>

                            <div className="text-gray-600 dark:text-gray-300"><strong>{t('userMap.labels.trees', 'Trees')}</strong></div>
                            <div className="truncate">{typeof modalData.treesCount === 'number' ? String(modalData.treesCount) : '-'}</div>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 items-center">

              <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, getPortalRoot());
};

export default RoadModalDialog;
