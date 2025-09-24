import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PanelBox from './PanelBox';
import { apiUrl } from '../../../config/api';

type Props = {
  lat?: number | null;
  lng?: number | null;
  onCancel: () => void;
  onCreated: () => void;
  roadId?: string | null;
  roadName?: string | null;
  // When true, the parent (map) is in 'select road' mode where clicking a road will choose it
  roadPickActive?: boolean;
  // Toggle request to enter/exit road-pick mode
  onToggleRoadPick?: (active: boolean) => void;
  onError?: (message: string) => void;
  // Local minimal type describing a tree record for editing
  editingTree?: {
    id?: string;
    latitude?: number | string;
    longitude?: number | string;
    species?: string;
    age?: number | string;
    trunk_diameter?: number | string;
    lbranch_width?: number | string;
    status?: string;
    description?: string;
    ownership?: string;
    roadId?: string;
    roadName?: string;
    road?: { id?: string; nameroad?: string } | null;
    treePictures?: Array<{ id: string; url: string }> | null;
  } | null;
};

const AddTreeForm: React.FC<Props> = ({ lat: passedLat, lng: passedLng, onCancel, onCreated, roadId: prefillRoadId, roadName: prefillRoadName, roadPickActive, onToggleRoadPick, editingTree, onError }) => {
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState<number | undefined>(undefined);
  const [trunkDiameter, setTrunkDiameter] = useState<number | undefined>(undefined);
  const [lbranchWidth, setLbranchWidth] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<'good' | 'warning' | 'danger'>('good');
  const [description, setDescription] = useState('');
  const [ownership, setOwnership] = useState('');
  const [roadId, setRoadId] = useState('');
  const [roadNameState, setRoadNameState] = useState<string | null>(null);
  const [lat, setLat] = useState<number | undefined>(typeof passedLat === 'number' ? passedLat : undefined);
  const [lng, setLng] = useState<number | undefined>(typeof passedLng === 'number' ? passedLng : undefined);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ file: File; url?: string }[]>([]);
  const [existingPictures, setExistingPictures] = useState<Array<{ id: string; url: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { t } = useTranslation();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files;
    if (!f) return;
    const arr = Array.from(f);
    setFiles((cur) => {
      const next = [...cur, ...arr];
      return next;
    });
  };

  // Build previews whenever files change. Keep order aligned with `files`.
  useEffect(() => {
    let mounted = true;
    const readers: Array<Promise<{ file: File; url?: string }>> = files.map((f) => {
      if (f.type && f.type.startsWith('image/')) {
        return new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => {
            res({ file: f, url: String(reader.result || '') });
          };
          reader.onerror = () => { res({ file: f }); };
          reader.readAsDataURL(f);
        });
      }
      return Promise.resolve({ file: f });
    });
    Promise.all(readers).then((arr) => {
      if (!mounted) return;
      setPreviews(arr);
    }).catch(() => { if (mounted) setPreviews(files.map((f) => ({ file: f }))); });
    return () => { mounted = false; };
  }, [files]);

  const removeFile = (index: number) => {
    setFiles((cur) => cur.filter((_, i) => i !== index));
    setPreviews((cur) => cur.filter((_, i) => i !== index));
  };

  // If parent passes a roadId/roadName (e.g., user clicked a road), prefill
  useEffect(() => {
    if (typeof prefillRoadId === 'string' && prefillRoadId.trim()) setRoadId(prefillRoadId);
    if (typeof prefillRoadName === 'string' && prefillRoadName.trim()) setRoadNameState(prefillRoadName);
  }, [prefillRoadId, prefillRoadName]);

  // Sync lat/lng if parent passes/updates them (e.g., user clicked map after opening form)
  useEffect(() => {
    if (typeof passedLat === 'number') setLat(passedLat);
  }, [passedLat]);
  useEffect(() => {
    if (typeof passedLng === 'number') setLng(passedLng);
  }, [passedLng]);

  // If editingTree provided, prefill fields and switch to edit mode
  useEffect(() => {
    if (!editingTree) return;
    try {
      const t = editingTree;
      setEditingId(t.id || null);
      if (typeof t.latitude === 'number') setLat(t.latitude);
      else if (typeof t.latitude === 'string') setLat(parseFloat(t.latitude));
      if (typeof t.longitude === 'number') setLng(t.longitude);
      else if (typeof t.longitude === 'string') setLng(parseFloat(t.longitude));
      if (typeof t.species === 'string') setSpecies(t.species);
      if (typeof t.age !== 'undefined') setAge(Number(t.age));
      if (typeof t.trunk_diameter !== 'undefined') setTrunkDiameter(Number(t.trunk_diameter));
      if (typeof t.lbranch_width !== 'undefined') setLbranchWidth(Number(t.lbranch_width));
      if (typeof t.status === 'string') setStatus(t.status as 'good'|'warning'|'danger');
      if (typeof t.description === 'string') setDescription(t.description);
      if (typeof t.ownership === 'string') setOwnership(t.ownership);
  if (typeof t.roadId === 'string') setRoadId(t.roadId);
  // Prefer the related road's nameroad if present
  const relatedRoad = (t as unknown as { road?: { nameroad?: string } | null }).road;
  if (relatedRoad && typeof relatedRoad.nameroad === 'string') setRoadNameState(relatedRoad.nameroad);
  else if (typeof t.roadName === 'string') setRoadNameState(t.roadName);
    } catch (e) { void e; }
  }, [editingTree]);

  // load existing pictures from editingTree if any
  useEffect(() => {
    if (editingTree && editingTree.treePictures && Array.isArray(editingTree.treePictures)) {
      const pics = editingTree.treePictures.map((p) => ({ id: p.id, url: p.url }));
      setExistingPictures(pics);
    } else {
      setExistingPictures([]);
    }
  }, [editingTree]);


  const submit = async () => {
    if (busy) return;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      if (typeof onError === 'function') onError(t('userMap.add.location_missing'));
      else alert(t('userMap.add.location_missing'));
      return;
    }
    setBusy(true);
    try {
      const payload: {
        latitude: number;
        longitude: number;
        species?: string;
        age?: number;
        trunk_diameter?: number;
        lbranch_width?: number;
        status: 'good' | 'warning' | 'danger';
        description?: string;
        ownership?: string;
        roadId?: string;
      } = { latitude: lat, longitude: lng, species: species || undefined, age: age || undefined, trunk_diameter: trunkDiameter || undefined, lbranch_width: lbranchWidth || undefined, status, description: description || undefined, ownership: ownership || undefined };
      if (roadId) payload.roadId = roadId;
      let createdId: string | null = null;
      if (editingId) {
        // update existing tree
        const res = await fetch(apiUrl(`/api/trees/${editingId}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('update tree failed');
        createdId = editingId;
      } else {
        const res = await fetch(apiUrl('/api/trees'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('create tree failed');
        const created = await res.json();
        createdId = created.id;
      }
      if (files.length > 0 && createdId) {
        const fd = new FormData();
        files.forEach((f) => fd.append('picture', f));
        const up = await fetch(apiUrl(`/api/trees/${createdId}/pictures`), { method: 'POST', body: fd });
        if (!up.ok) console.warn('Failed to upload some pictures');
      }
      onCreated();
    } catch (err) {
      console.error('Failed creating tree', err);
      if (typeof onError === 'function') onError(t('userMap.add.create_failed'));
      else alert(t('userMap.add.create_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelBox width="w-56 sm:w-64" className="max-h-[60vh] overflow-y-auto p-2 sm:p-3">
      <div className="flex items-center justify-between mb-2">
          <strong className="text-sm sm:text-base">{editingId ? t('userMap.add.edit') : t('userMap.add.title')}</strong>
          <button className="text-sm text-gray-500 dark:text-gray-300" onClick={onCancel} type="button">✕</button>
        </div>
      <div className="flex flex-col gap-2 text-xs sm:text-sm">
        <div>
            {roadNameState || roadId ? (
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <div>{t('userMap.labels.road')}: <span className="font-semibold">{roadNameState || '-'}</span></div>
              <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{t('common.id')}: {roadId || '-'}</div>
            </div>
          ) : null}
        </div>
          <div className="text-xs text-gray-500 dark:text-gray-300">{t('userMap.labels.coordinates')}: <span className="font-mono text-gray-700 dark:text-gray-300">{(typeof lat === 'number' ? lat.toFixed(6) : '-')}</span> {t('userMap.labels.lng')}: <span className="font-mono text-gray-700 dark:text-gray-300">{(typeof lng === 'number' ? lng.toFixed(6) : '-')}</span></div>

          {/* If lat/lng not provided, allow manual entry */}
          {typeof lat !== 'number' || typeof lng !== 'number' ? (
            <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.lat')}</label>
                  <input className="border p-1 rounded w-full" value={lat ?? ''} onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : undefined)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.lng')}</label>
                  <input className="border p-1 rounded w-full" value={lng ?? ''} onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : undefined)} />
                </div>
            </div>
          ) : null}
            <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.species')}</label>
          <input className="border p-1 rounded" value={species} onChange={(e) => setSpecies(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.age')}</label>
              <input type="number" className="border p-1 rounded w-full" value={age ?? ''} onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            </div>
            <div>
                <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.trunk_diameter')}</label>
              <input type="number" className="border p-1 rounded w-full" value={trunkDiameter ?? ''} onChange={(e) => setTrunkDiameter(e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
          </div>
          <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.lbranch_width')}</label>
          <input type="number" className="border p-1 rounded" value={lbranchWidth ?? ''} onChange={(e) => setLbranchWidth(e.target.value ? parseFloat(e.target.value) : undefined)} />
          <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.status')}</label>
          <select className="border p-1 rounded" value={status} onChange={(e) => setStatus(e.target.value as 'good' | 'warning' | 'danger')}>
            <option value="good">{t('userMap.status.good')}</option>
            <option value="warning">{t('userMap.status.warning')}</option>
            <option value="danger">{t('userMap.status.danger')}</option>
          </select>

          <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.ownership')}</label>
          <input className="border p-1 rounded" value={ownership} onChange={(e) => setOwnership(e.target.value)} />

          <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.road')}</label>
          <div>
            <button type="button" onClick={() => {
              try { console.log('[AddTreeForm] Select road clicked', { current: roadPickActive, next: !roadPickActive }); } catch { /* ignore */ }
              try { console.log('[AddTreeForm] onToggleRoadPick typeof', typeof onToggleRoadPick); } catch { /* ignore */ }
              if (typeof onToggleRoadPick === 'function') onToggleRoadPick(!roadPickActive);
            }} className={`px-2 py-1 rounded border text-xs ${roadPickActive ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
              {roadPickActive ? t('common.cancel') : t('userMap.add.select_road')}
            </button>
            {roadNameState || roadId ? (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="font-semibold">{roadNameState || '-'}</div>
                <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{t('common.id')}: {roadId || '-'}</div>
              </div>
            ) : null}
          </div>

          <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.description')}</label>
          <textarea className="border p-1 rounded" value={description} onChange={(e) => setDescription(e.target.value)} />

          <label className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.labels.pictures')}</label>
          <div className="flex flex-col gap-2">
            {existingPictures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {existingPictures.map((p) => (
                  <div key={p.id} className="w-24">
                    <img src={p.url} alt={p.id} className="w-24 h-16 object-cover rounded" />
                    <div className="flex items-center justify-between text-xs mt-1">
                      <div className="truncate" style={{ maxWidth: 120 }}>{p.id}</div>
                      <button type="button" onClick={async () => {
                        if (!editingId) return;
                        try {
                          const res = await fetch(apiUrl(`/api/trees/${editingId}/pictures/${p.id}`), { method: 'DELETE' });
                          if (!res.ok) throw new Error('delete failed');
                          setExistingPictures((cur) => cur.filter((x) => x.id !== p.id));
                          } catch (err) { console.error('Failed to delete picture', err); if (typeof onError === 'function') onError('Failed to delete picture'); else alert('Failed to delete picture'); }
                      }} className="ml-1 text-red-500">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
              <label className="inline-flex items-center gap-2">
              <input id="file-input" type="file" multiple onChange={handleFiles} className="hidden" />
              <button type="button" onClick={() => document.getElementById('file-input')?.click()} className="px-3 py-1 bg-gray-100 border rounded flex items-center gap-2">
                <img src="/icons/upload-svgrepo-com.svg" alt="upload" className="w-5 h-5" />
                
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-300">{t('userMap.add.upload_hint')}</span>
            </label>

            {files.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {files.map((f, idx) => (
                  <div key={`${f.name}-${idx}`} className="w-24">
                    {previews[idx] && previews[idx].url ? (
                      <img src={previews[idx].url} alt={f.name} className="w-24 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-24 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">{f.name}</div>
                    )}
                    <div className="flex items-center justify-between text-xs mt-1">
                      <div className="truncate" style={{ maxWidth: 120 }}>{f.name}</div>
                      <button type="button" onClick={() => removeFile(idx)} className="ml-1 text-red-500">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={submit} type="button" disabled={busy}>{busy ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
            <button className="px-3 py-1 bg-gray-200 rounded dark:bg-gray-700" onClick={onCancel} type="button">Cancel</button>
          </div>
      </div>
    </PanelBox>
  );
};

export default AddTreeForm;
