import React, { useEffect, useState, useRef } from 'react';
import { getUserRole } from '../../utils/auth';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    openModal?: (who: string) => void;
    closeModal?: (who: string) => void;
  }
}
import { createPortal } from 'react-dom';

type Props = {
  id?: string;
  title?: string;
  description?: string;
};

const ExampleModalDialog: React.FC<Props> = ({ id = 'basicModal', title = 'Deactivate account', description }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalDesc, setModalDesc] = useState<string | undefined>(undefined);
  const [modalData, setModalData] = useState<Record<string, unknown> | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  const handler = () => { setOpen(true); };
  const handlerClose = () => { setOpen(false); };
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('open-me', handler as EventListener);
      el.addEventListener('close-me', handlerClose as EventListener);
    }

    // Listen for app-level example modal event with payload
    const onOpenExample = (ev: Event) => {
      try {
        const ce = ev as CustomEvent<Record<string, unknown>>;
        const detail = ce.detail || {};
        if (typeof detail.title === 'string') setModalTitle(detail.title);
        if (typeof detail.description === 'string') setModalDesc(detail.description);
        setModalData(detail ?? null);
      } catch { /* ignore */ }
      setOpen(true);
    };
    window.addEventListener('gistreeview:open-example-modal', onOpenExample as EventListener);

    // expose global helpers similar to example
  window.openModal = (who: string) => document.getElementById(who)?.dispatchEvent(new CustomEvent('open-me'));
  window.closeModal = (who: string) => document.getElementById(who)?.dispatchEvent(new CustomEvent('close-me'));

    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);

    return () => {
      if (el) {
        el.removeEventListener('open-me', handler as EventListener);
        el.removeEventListener('close-me', handlerClose as EventListener);
      }
      try { delete window.openModal; } catch { /* ignore */ }
      try { delete window.closeModal; } catch { /* ignore */ }
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('gistreeview:open-example-modal', onOpenExample as EventListener);
    };
  }, [id]);

  if (!open) return null;

  // choose portal root: prefer fullscreen element, then leaflet container, then document.body
  const getPortalRoot = () => {
    try {
  const fs = ((document as unknown) as { fullscreenElement?: Element | null; webkitFullscreenElement?: Element | null }).fullscreenElement || ((document as unknown) as { fullscreenElement?: Element | null; webkitFullscreenElement?: Element | null }).webkitFullscreenElement || null;
  if (fs && fs instanceof HTMLElement) return fs as HTMLElement;
      const leaflet = document.querySelector('.leaflet-container') as HTMLElement | null;
      if (leaflet) return leaflet;
    } catch { /* ignore */ }
    return document.body;
  };

  // choose photo path based on available modalData.picture(s) or fallback to default
  // Safely extract first picture URL from modalData if available
  let photoUrl = '/images/tree-default.jpg';
  try {
    if (modalData && typeof modalData === 'object' && 'treePictures' in modalData) {
      const tp = (modalData as unknown as { treePictures?: unknown }).treePictures;
      if (Array.isArray(tp) && tp.length > 0) {
        const first = tp[0] as unknown;
        if (first && typeof first === 'object' && 'url' in (first as object)) {
          const u = (first as unknown as { url?: unknown }).url;
          if (typeof u === 'string' && u.trim() !== '') photoUrl = u;
        }
      }
    }
  } catch { /* ignore and leave default photoUrl */ }
  const bgClass = 'bg-white';

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // Format coordinate helpers: show numbers with a fixed number of decimals when possible.
  const formatCoord = (val: unknown, decimals = 6) => {
    if (val === undefined || val === null) return '-';
    const n = Number(val);
    if (!Number.isFinite(n)) return String(val);
    return n.toFixed(decimals);
  };

  const modal = (
    <div className="relative z-[999999]" aria-labelledby="modal-title" aria-modal="true" role="dialog" ref={dialogRef}>
  {/* semi-transparent blurred backdrop so map remains visible */}
  <div
    className="fixed inset-0 bg-gray-700 bg-opacity-50 backdrop-blur-sm transition-opacity z-[999998]"
    onClick={() => setOpen(false)}
    // inline style ensures rgba opacity and blur work even if Tailwind doesn't include utilities
    style={{ backgroundColor: isDark ? 'rgba(2,6,23,0.6)' : 'rgba(51,65,85,0.5)', backdropFilter: 'blur(4px)' }}
  />

      <div className="fixed z-[999999] inset-0 overflow-y-auto">
        <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-sm sm:mx-0 ${bgClass}`} style={{ height: 64, width: 64 }}>
                  <img
                    src={photoUrl}
                    alt="tree"
                    className="h-16 w-16 object-cover"
                    style={{ height: 64, width: 64, borderRadius: 6 }}
                    onError={(e) => { try { (e.currentTarget as HTMLImageElement).src = '/images/tree-default.jpg'; } catch { /* ignore */ } }}
                  />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">{(modalData && typeof modalData.species === 'string') ? String(modalData.species) : (modalTitle ?? title)}
                    {/* small clickable id under title */}
                    <div className="text-xs text-gray-400 mt-1">
                      {typeof modalData?.id !== 'undefined' ? (
                        <a
                          href={`/view/tree/${encodeURIComponent(String(modalData.id))}`}
                          className="text-xs text-gray-400 hover:underline"
                          onClick={(e) => {
                            try {
                              e.preventDefault();
                              const role = getUserRole();
                              if (!role) {
                                try {
                                  const maybeShow = (window as unknown as { showAlert?: ((variant: string, title: string, message: string) => void) | undefined }).showAlert;
                                  if (typeof maybeShow === 'function') maybeShow('warning', t('userMap.report.loginRequiredTitle'), t('userMap.report.loginRequiredMessage'));
                                  else window.alert(t('userMap.report.loginRequiredMessage'));
                                } catch { try { window.alert(t('userMap.report.loginRequiredMessage')); } catch { /* ignore */ } }
                                return;
                              }
                              window.open(`/view/tree/${encodeURIComponent(String(modalData.id))}`, '_blank');
                            } catch { /* ignore */ }
                          }}
                        >ID: {String(modalData.id)}</a>
                      ) : null}
                    </div>
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-300">{modalDesc ?? description ?? 'No description provided.'}</p>
                    {modalData ? (
                      <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                        {/* Scrollable detail area with labeled grid */}
                        <div className="max-h-56 overflow-auto border border-gray-100 dark:border-gray-600 rounded p-2 bg-gray-50 dark:bg-gray-700">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <div className="text-gray-600 dark:text-gray-300"><strong>{t('userMap.coordinates.title')}</strong></div>
                              <div className="truncate">{(modalData && typeof modalData.lat !== 'undefined' && modalData.lat !== null) ? formatCoord(modalData.lat, 6) : '-'}{(modalData && typeof modalData.lng !== 'undefined' && modalData.lng !== null) ? `, ${formatCoord(modalData.lng, 6)}` : ''}</div>

                              <div className="text-gray-600 dark:text-gray-300"><strong>{t('userMap.labels.ownership')}</strong></div>
                              <div className="truncate">{typeof modalData.ownership !== 'undefined' ? String(modalData.ownership) : '-'}</div>

                              <div className="text-gray-600 dark:text-gray-300"><strong>{t('userMap.labels.road')}</strong></div>
                              <div className="truncate">{typeof modalData.roadName !== 'undefined' && modalData.roadName ? String(modalData.roadName) : t('userMap.labels.unnamedRoad')}</div>

                            {/* species shown in header/title; row removed as requested */}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 items-center">
              <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setOpen(false)}>{t('common.close')}</button>
              {(() => {
                try {
                  // Only show Report button for authenticated users
                  const u = (window as unknown as { __gistreeview_user_role?: string | null }).__gistreeview_user_role ?? null;
                  // Fallback to reading from localStorage if global not set
                  const role = u ?? (localStorage.getItem('user') ? JSON.parse(String(localStorage.getItem('user'))).role : null);
                  if (!role) return null;
                } catch { /* ignore and hide button */ return null; }
                    return (
                  <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => {
                    // Open ReportTreeForm with payload if available
                    try {
                      const detail = modalData ?? {};
                      const ev = new CustomEvent('gistreeview:open-report', { detail });
                      window.dispatchEvent(ev);
                      const win = window as unknown as { __gistreeview_open_report?: (d: unknown) => void } & Window;
                      if (typeof win.__gistreeview_open_report === 'function') win.__gistreeview_open_report(detail);
                    } catch { /* ignore */ }
                    setOpen(false);
                  }}>Report</button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, getPortalRoot());
};

export default ExampleModalDialog;
