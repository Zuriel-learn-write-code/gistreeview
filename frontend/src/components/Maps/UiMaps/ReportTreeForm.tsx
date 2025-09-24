import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { apiUrl } from '../../../config/api';
import { getUserData } from '../../../utils/auth';

// Minimal modal styles using PanelBox for consistency if available

type Payload = {
  id?: string | number | null;
  lat?: number;
  lng?: number;
  species?: string | null;
  treeDescription?: string | null;
  status?: string | null;
};

const ReportTreeForm: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [description, setDescription] = useState('');
  // reporter and type removed per request; we'll attach authenticated userId on submit
  const [files, setFiles] = useState<FileList | null>(null);
  const [treeMeta, setTreeMeta] = useState<{ id?: string | number | null; species?: string | null; description?: string | null; status?: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<Payload>;
      console.debug('ReportTreeForm: received gistreeview:open-report event', ev.detail);
      setPayload(ev.detail || null);
      setOpen(true);
    };
    const openReport = (detail: Payload | null) => {
      console.debug('ReportTreeForm: __gistreeview_open_report called', detail);
      if (!detail) return;
      setPayload(detail);
      setOpen(true);
    };
    // listen for custom event
    window.addEventListener('gistreeview:open-report', handler as EventListener);
    // set a global function fallback so popup content rendered via portals can reliably call it
    const win = window as unknown as { __gistreeview_open_report?: (d: Payload | null) => void } & Window;
    win.__gistreeview_open_report = openReport;
    return () => {
      try { window.removeEventListener('gistreeview:open-report', handler as EventListener); } catch (e) { void e; }
      try { delete win.__gistreeview_open_report; } catch (e) { void e; }
    };
  }, []);

  useEffect(() => {
    // when payload contains id, try to fetch tree details to prefill metadata
    let cancelled = false;
    (async () => {
      try {
        if (!payload || !payload.id) {
          // if event provided species/description/status inline, use it
          if (payload) setTreeMeta({ id: payload.id, species: payload.species ?? null, description: payload.treeDescription ?? null, status: payload.status ?? null });
          // notify to close any open popups when the modal opens
          try { window.dispatchEvent(new CustomEvent('gistreeview:close-popup')); } catch { /* ignore */ }
          return;
        }
        const res = await fetch(apiUrl(`/api/trees/${payload.id}`));
        if (!res.ok) {
          // fallback to event-provided metadata
          setTreeMeta({ id: payload.id, species: payload.species ?? null, description: payload.treeDescription ?? null, status: payload.status ?? null });
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setTreeMeta({ id: json.id ?? payload.id, species: json.species ?? json.name ?? payload.species ?? null, description: json.description ?? payload.treeDescription ?? null, status: json.status ?? payload.status ?? null });
          // notify to close any open popups when the modal opens
          try { window.dispatchEvent(new CustomEvent('gistreeview:close-popup')); } catch { /* ignore */ }
        }
      } catch {
        setTreeMeta({ id: payload?.id ?? null, species: payload?.species ?? null, description: payload?.treeDescription ?? null, status: payload?.status ?? null });
      }
    })();
    return () => { cancelled = true; };
  }, [payload]);

  const [layout, setLayout] = useState<{ top: number; maxHeight: number } | null>(null);

  // compute layout (top and maxHeight) so the modal starts at map.top + 10px
  // and its height follows the map (never exceeding map.bottom - 10px).
  useEffect(() => {
    if (!open) return;
    const compute = () => {
      try {
        const mapEl = document.querySelector('.leaflet-container');
        const vw = window.innerHeight || document.documentElement.clientHeight;
        if (!mapEl) {
          // fallback: pin to viewport top 10px and cap height to viewport (with small margins)
          const viewportAvail = Math.max(120, vw - 40);
          const modalH = Math.min(440, viewportAvail);
          const top = 10;
          setLayout({ top, maxHeight: modalH });
          return;
        }
        const r = mapEl.getBoundingClientRect();
        // available space inside map (respect 10px margin top/bottom)
        const available = Math.max(120, Math.floor(r.height - 20));
        // viewport available height
        const viewportAvail = Math.max(120, Math.floor(vw - 40));
        // choose modal height: constrained by map available space, viewport, and an upper cap
        const modalH = Math.min(440, available, viewportAvail);
        // anchor to map top + 10px so modal always starts near the top of the map
        const top = Math.round(r.top + 10);
        setLayout({ top, maxHeight: modalH });
      } catch {
        const vw = window.innerHeight || document.documentElement.clientHeight;
        const modalH = Math.min(440, Math.max(120, vw - 40));
        setLayout({ top: 10, maxHeight: modalH });
      }
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => { window.removeEventListener('resize', compute); window.removeEventListener('scroll', compute, true); };
  }, [open]);

  // Portal helpers: prefer fullscreen element or map container when available.
  // Portal helpers: prefer fullscreen element or map container when available.
  const getPortalRoot = () => {
    try {
      const mapEl = document.querySelector('.leaflet-container');
      if (document.fullscreenElement) return document.fullscreenElement as Element;
      const webkitFs = (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      if (webkitFs) return webkitFs;
      if (mapEl) return mapEl;
      return document.body;
    } catch {
      return document.body;
    }
  };

  // Recompute layout and reportal when fullscreen changes
  useEffect(() => {
    const onFs = () => {
      try {
        const mapEl = document.querySelector('.leaflet-container');
        const vw = window.innerHeight || document.documentElement.clientHeight;
        if (!mapEl) {
          const viewportAvail = Math.max(120, vw - 40);
          const modalH = Math.min(440, viewportAvail);
          const top = Math.max(10, Math.round((vw - modalH) / 2));
          setLayout({ top, maxHeight: modalH });
          return;
        }
        const r = mapEl.getBoundingClientRect();
        const available = Math.max(120, Math.floor(r.height - 20));
        const viewportAvail = Math.max(120, Math.floor(vw - 40));
        const modalH = Math.min(440, available, viewportAvail);
        const minTop = Math.round(r.top + 10);
        const maxTopAllowed = Math.round(r.bottom - 10 - modalH);
        const centeredTopInMap = Math.round(minTop + Math.floor((available - modalH) / 2));
        const top = Math.min(Math.max(centeredTopInMap, minTop), Math.max(minTop, maxTopAllowed));
        setLayout({ top, maxHeight: modalH });
      } catch { /* ignore */ }
    };
    try { document.addEventListener('fullscreenchange', onFs); } catch { /* ignore */ }
    try { if ((document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement !== undefined) { document.addEventListener('webkitfullscreenchange', onFs as EventListener); } } catch { /* ignore */ }
    return () => {
      try { document.removeEventListener('fullscreenchange', onFs); } catch { /* ignore */ }
      try { if ((document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement !== undefined) { document.removeEventListener('webkitfullscreenchange', onFs as EventListener); } } catch { /* ignore */ }
    };
  }, []);

  if (!open || !payload) return null;
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const modal = (
    <div className="relative z-[999999]" aria-modal="true" role="dialog">
      <div
        className="fixed inset-0 bg-gray-700 bg-opacity-50 backdrop-blur-sm transition-opacity z-[999998]"
        onClick={() => { setOpen(false); setPayload(null); }}
        style={{ backgroundColor: isDark ? 'rgba(2,6,23,0.6)' : 'rgba(51,65,85,0.5)', backdropFilter: 'blur(4px)' }}
      />

      <div className="fixed z-[999999] inset-0 overflow-y-auto">
        <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-2">
                <strong className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">{t('userMap.report.treeTitle')}</strong>
              </div>

              {/* scrollable content area constrained by map bounds */}
              <div className="flex flex-col gap-3" style={{ overflowY: 'auto', maxHeight: layout ? `${layout.maxHeight}px` : '60vh', paddingRight: 6 }}>
                {/* Tree ID hidden/visible only once below species */}
                {/* Hidden form fields to include tree identification in FormData and provide names */}
                <input type="hidden" name="treeId" value={String(treeMeta?.id ?? payload.id ?? '')} />
                <input type="hidden" name="lat" value={String(payload.lat ?? '')} />
                <input type="hidden" name="lng" value={String(payload.lng ?? '')} />

                <div className="sm:flex sm:items-start">
                  <div className="mt-0 text-center sm:mt-0 sm:ml-0 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">{(treeMeta && treeMeta.species) ? String(treeMeta.species) : t('userMap.report.treeTitle')}</h3>
                    <div className="text-xs text-gray-400 mt-1">
                      {typeof (treeMeta?.id ?? payload.id) !== 'undefined' ? (
                        <a
                          href={`/view/tree/${encodeURIComponent(String(treeMeta?.id ?? payload.id))}`}
                          className="text-xs text-gray-400 hover:underline"
                          onClick={(e) => {
                            try {
                              e.preventDefault();
                              const user = getUserData();
                              const role = user ? (user.role as string | null) : null;
                              if (!role) {
                                try {
                                  const maybeShow = (window as unknown as { showAlert?: ((variant: string, title: string, message: string) => void) | undefined }).showAlert;
                                  if (typeof maybeShow === 'function') maybeShow('warning', t('userMap.report.loginRequiredTitle'), t('userMap.report.loginRequiredMessage'));
                                  else window.alert(t('userMap.report.loginRequiredMessage'));
                                } catch { try { window.alert(t('userMap.report.loginRequiredMessage')); } catch { /* ignore */ } }
                                return;
                              }
                              window.open(`/view/tree/${encodeURIComponent(String(treeMeta?.id ?? payload.id))}`, '_blank');
                            } catch { /* ignore */ }
                          }}
                        >ID: {String(treeMeta?.id ?? payload.id)}</a>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="report-description" className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.description')}</label>
                  <textarea id="report-description" name="description" className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded mt-1" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div>
                  <label htmlFor="report-files" className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.report.upload_pictures')}</label>
                  <input id="report-files" name="reportPictures" className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-1 rounded mt-1" type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
                </div>
              </div>
            </div>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 items-center">
              <button className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm" disabled={submitting} onClick={async () => {
                if (submitting) return;
                setSubmitting(true);
                try {
                  // Create report first (JSON) — backend expects JSON for POST /api/reports
                  const payloadBody: Record<string, unknown> = {};
                  if (payload.id) payloadBody.treeId = String(payload.id);
                  if (description) payloadBody.description = description;
                  try {
                    const user = getUserData();
                    if (user && user.id) payloadBody.userId = String(user.id);
                  } catch { /* ignore */ }

                  const createRes = await fetch(apiUrl('/api/reports'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadBody) });
                  if (!createRes.ok) {
                    const text = await createRes.text().catch(() => '');
                    throw new Error(`Failed to create report: ${createRes.status} ${text}`);
                  }
                  const created = await createRes.json();

                  // If there are files, upload them to the dedicated pictures endpoint
                  if (files && files.length > 0) {
                    const formData = new FormData();
                    for (let i = 0; i < files.length; i++) {
                      // backend middleware expects field name 'picture'
                      formData.append('picture', files[i]);
                    }
                    try {
                      const upRes = await fetch(apiUrl(`/api/reports/${created.id}/pictures`), { method: 'POST', body: formData });
                        if (!upRes.ok) {
                        const text = await upRes.text().catch(() => '');
                        console.warn('Report created but failed to upload pictures', text);
                        const maybeShowAlert2 = (window as unknown as { showAlert?: ((variant: string, title: string, message: string) => void) | undefined }).showAlert;
                        if (typeof maybeShowAlert2 === 'function') maybeShowAlert2('warning', t('userMap.report.partialSavedTitle'), t('userMap.report.partialSavedMessage'));
                        else window.alert(t('userMap.report.partialSavedMessage'));
                      }
                    } catch (err) {
                      console.warn('Failed uploading pictures', err);
                    }
                  }

                  // success
                  setOpen(false);
                  setPayload(null);
                  setDescription('');
                  const maybeShowAlert = (window as unknown as { showAlert?: ((variant: string, title: string, message: string) => void) | undefined }).showAlert;
                  if (typeof maybeShowAlert === 'function') maybeShowAlert('success', t('userMap.report.sentTitle'), t('userMap.report.sentMessage'));
                  else window.alert(t('userMap.report.sentMessage'));
                } catch (e) {
                  console.error('Failed to submit report', e);
                  const maybeShowAlert = (window as unknown as { showAlert?: ((variant: string, title: string, message: string) => void) | undefined }).showAlert;
                  if (typeof maybeShowAlert === 'function') maybeShowAlert('error', t('userMap.report.failedTitle'), t('userMap.report.failedMessage'));
                  else window.alert(t('userMap.report.failedMessage'));
                } finally { setSubmitting(false); }
              }}>{t('common.submit')}</button>
              <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" onClick={() => { setOpen(false); setPayload(null); }}>{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Choose portal root and render modal there so it remains visible in fullscreen
  const portalRoot = (typeof document !== 'undefined') ? getPortalRoot() : null;
  if (portalRoot) return createPortal(modal, portalRoot);
  return modal;
};

export default ReportTreeForm;
