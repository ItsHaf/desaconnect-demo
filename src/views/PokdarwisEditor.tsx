import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useLang } from '../components/LangProvider'
import { useData } from '../components/DataProvider'
import { tr } from '../data/i18n'
import { type Activity, type Village } from '../data/mockData'
import ResponsiveImage, { makeThumbSvg } from '../components/ResponsiveImage'

type EditorMode = 'edit' | 'add'

interface EditableActivity {
  nameId: string
  nameEn: string
  price: string
  durationId: string
  durationEn: string
}

interface PhotoItem {
  id: number
  villageId: number
  villageName: string
  isNew?: boolean
}

function actToEdit(a: Activity): EditableActivity {
  return { nameId: a.nameId, nameEn: a.nameEn, price: a.price, durationId: a.durationId, durationEn: a.durationEn }
}

function editToAct(a: EditableActivity): Activity {
  return {
    nameId: a.nameId || a.nameEn,
    nameEn: a.nameEn || a.nameId,
    price: a.price || 'Rp 0',
    durationId: a.durationId || a.durationEn,
    durationEn: a.durationEn || a.durationId,
  }
}

function villageToPhotos(v: Village): PhotoItem[] {
  return [{ id: 1, villageId: v.id, villageName: v.name }]
}

function createVillageIcon(v: Village, isSelected: boolean) {
  const bg = isSelected ? '#C68C28' : v.inSeason ? '#4A7C2E' : '#888'
  const border = isSelected ? '3px solid #C68C28' : '2px solid #fff'
  const size = isSelected ? 28 : 20
  const short = v.name.charAt(v.name.lastIndexOf(' ') + 1)
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border:${border};border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:${isSelected ? 12 : 9}px;font-weight:700;font-family:sans-serif;">${short}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FlyToVillage({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMapEvents({})
  map.flyTo([lat, lng], zoom, { duration: 0.8 })
  return null
}

const EMPTY_ACTIVITY: EditableActivity = { nameId: '', nameEn: '', price: '', durationId: '', durationEn: '' }

function shortName(name: string): string {
  return name.replace('Desa Wisata ', '')
}

export default function PokdarwisEditor() {
  const { lang } = useLang()
  const { villages, updateVillage, addVillage, addAuditEntry } = useData()
  const [mode, setMode] = useState<EditorMode>('edit')
  const [offline, setOffline] = useState(false)
  const [queued, setQueued] = useState(false)
  const [selectedId, setSelectedId] = useState(villages[0]?.id ?? 1)
  const [dirty, setDirty] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const village = villages.find((v) => v.id === selectedId) ?? villages[0]
  const [villageName, setVillageName] = useState(village?.name ?? '')
  const [lat, setLat] = useState(String(village?.lat ?? -7.7))
  const [lng, setLng] = useState(String(village?.lng ?? 110.36))
  const [inSeason, setInSeason] = useState(village?.inSeason ?? false)
  const [wheelchair, setWheelchair] = useState(village?.wheelchairAccess ?? false)
  const [activities, setActivities] = useState<EditableActivity[]>(village?.activities.map(actToEdit) ?? [])
  const [photos, setPhotos] = useState<PhotoItem[]>(village ? villageToPhotos(village) : [])

  const [newName, setNewName] = useState('')
  const [newDescId, setNewDescId] = useState('')
  const [newDescEn, setNewDescEn] = useState('')
  const [newLat, setNewLat] = useState('-7.700')
  const [newLng, setNewLng] = useState('110.360')
  const [newInSeason, setNewInSeason] = useState(false)
  const [newWheelchair, setNewWheelchair] = useState(false)
  const [newWhatsapp, setNewWhatsapp] = useState('')
  const [newImage, setNewImage] = useState('')
  const [newActivities, setNewActivities] = useState<EditableActivity[]>([])
  const [validationError, setValidationError] = useState('')

  const selectVillage = (id: number) => {
    const v = villages.find((x) => x.id === id)
    if (!v) return
    setSelectedId(id)
    setVillageName(v.name)
    setLat(String(v.lat))
    setLng(String(v.lng))
    setInSeason(v.inSeason)
    setWheelchair(v.wheelchairAccess)
    setActivities(v.activities.map(actToEdit))
    setPhotos(villageToPhotos(v))
    setDirty(false)
    setSuccessMsg('')
  }

  const switchMode = (m: EditorMode) => {
    setMode(m)
    setSuccessMsg('')
    setValidationError('')
    if (m === 'edit') selectVillage(selectedId)
  }

  const markDirty = (fn: () => void) => {
    fn()
    setDirty(true)
  }

  const addActivity = () => {
    markDirty(() => setActivities((prev) => [...prev, { ...EMPTY_ACTIVITY }]))
  }

  const removeActivity = (index: number) => {
    markDirty(() => setActivities((prev) => prev.filter((_, i) => i !== index)))
  }

  const updateActivity = (index: number, field: keyof EditableActivity, value: string) => {
    markDirty(() => {
      setActivities((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], [field]: value }
        return next
      })
    })
  }

  const addNewActivity = () => {
    setNewActivities((prev) => [...prev, { ...EMPTY_ACTIVITY }])
  }

  const removeNewActivity = (index: number) => {
    setNewActivities((prev) => prev.filter((_, i) => i !== index))
  }

  const updateNewActivity = (index: number, field: keyof EditableActivity, value: string) => {
    setNewActivities((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addPhoto = () => {
    markDirty(() => {
      setPhotos((prev) => [
        ...prev,
        { id: Date.now(), villageId: selectedId, villageName: `${villageName} #${prev.length + 1}`, isNew: true },
      ])
    })
  }

  const removePhoto = (photoId: number) => {
    markDirty(() => setPhotos((prev) => prev.filter((p) => p.id !== photoId)))
  }

  const handleSave = () => {
    if (offline) {
      setQueued(true)
      return
    }

    const numLat = parseFloat(lat) || (village?.lat ?? -7.7)
    const numLng = parseFloat(lng) || (village?.lng ?? 110.36)
    const mappedActivities = activities.filter(a => a.nameId.trim() || a.nameEn.trim()).map(editToAct)

    updateVillage(selectedId, {
      name: villageName,
      lat: numLat,
      lng: numLng,
      inSeason,
      wheelchairAccess: wheelchair,
      activities: mappedActivities,
      hasActivities: mappedActivities.length > 0,
    })

    const sn = shortName(villageName)
    addAuditEntry({
      actorId: 'pokdarwis-session',
      action: 'UPDATE_VILLAGE',
      targetId: `Perubahan — ${sn}`,
      targetEn: `Village Update — ${sn}`,
    })

    setDirty(false)
    setSuccessMsg(lang === 'en' ? 'Village updated successfully!' : 'Desa berhasil diperbarui!')
  }

  const handleAddVillage = () => {
    setValidationError('')
    if (!newName.trim() || !newDescId.trim() || !newDescEn.trim() || !newWhatsapp.trim()) {
      setValidationError(tr('fillRequired', lang))
      return
    }

    if (offline) {
      setQueued(true)
      return
    }

    const numLat = parseFloat(newLat) || -7.700
    const numLng = parseFloat(newLng) || 110.360
    const mappedActivities = newActivities.filter(a => a.nameId.trim() || a.nameEn.trim()).map(editToAct)

    const created = addVillage({
      name: newName.trim(),
      descId: newDescId.trim(),
      descEn: newDescEn.trim(),
      lat: numLat,
      lng: numLng,
      inSeason: newInSeason,
      hasActivities: mappedActivities.length > 0,
      wheelchairAccess: newWheelchair,
      activities: mappedActivities,
      whatsapp: newWhatsapp.trim(),
      photoColor: '#5b8c3e',
      image: newImage.trim() || `https://picsum.photos/seed/${newName.trim().toLowerCase().replace(/\s+/g, '')}/600/300`,
    })

    const sn = shortName(newName.trim())
    addAuditEntry({
      actorId: 'pokdarwis-session',
      action: 'REGISTER_VILLAGE',
      targetId: `Registrasi — ${sn}`,
      targetEn: `Village Registration — ${sn}`,
    })

    setSuccessMsg(tr('villageAdded', lang))
    setNewName('')
    setNewDescId('')
    setNewDescEn('')
    setNewLat('-7.700')
    setNewLng('-7.360')
    setNewInSeason(false)
    setNewWheelchair(false)
    setNewWhatsapp('')
    setNewImage('')
    setNewActivities([])

    setSelectedId(created.id)
    setMode('edit')
    selectVillage(created.id)
  }

  const totalActivities = activities.length
  const numLat = parseFloat(lat) || (village?.lat ?? -7.7)
  const numLng = parseFloat(lng) || (village?.lng ?? 110.36)
  const newNumLat = parseFloat(newLat) || -7.700
  const newNumLng = parseFloat(newLng) || 110.360

  return (
    <div className="form-screen">
      <h2>{tr('pokdarwisTitle', lang)}</h2>
      <p className="screen-desc">{tr('pokdarwisDesc', lang)}</p>

      <div className={`offline-sim ${offline ? 'active' : ''}`}>
        <span className="offline-sim-label">
          {tr('offlineSim', lang)}
        </span>
        <button
          className={`toggle ${offline ? 'on' : ''}`}
          onClick={() => { setOffline(!offline); if (!offline) setQueued(false) }}
          aria-label="Toggle offline simulation"
        />
      </div>

      <div className="mode-tabs">
        <button className={`mode-tab ${mode === 'edit' ? 'active' : ''}`} onClick={() => switchMode('edit')}>
          {tr('editVillage', lang)}
        </button>
        <button className={`mode-tab ${mode === 'add' ? 'active' : ''}`} onClick={() => switchMode('add')}>
          {tr('addVillage', lang)}
        </button>
      </div>

      {successMsg && (
        <div className="success-notice">
          {successMsg}
        </div>
      )}

      {validationError && (
        <div className="validation-error">
          {validationError}
        </div>
      )}

      {mode === 'edit' ? (
        <>
          <div className="form-card">
            <div className="form-group">
              <label>{lang === 'en' ? 'Select Village to Edit' : 'Pilih Desa untuk Diedit'}</label>
              <select value={selectedId} onChange={(e) => selectVillage(Number(e.target.value))}>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header-row">
              <h3 style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>
                {lang === 'en' ? 'Village Location' : 'Lokasi Desa'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                {lang === 'en' ? 'Click a village or map to reposition' : 'Klik desa atau peta untuk memindahkan'}
              </span>
            </div>
            <div className="map-draw-area" style={{ height: 320 }}>
              <MapContainer
                key={`edit-${selectedId}`}
                center={[numLat, numLng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution=''
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FlyToVillage lat={numLat} lng={numLng} zoom={14} />
                {villages.map((v) => (
                  v.id === selectedId ? null : (
                    <Marker
                      key={v.id}
                      position={[v.lat, v.lng]}
                      icon={createVillageIcon(v, false)}
                      eventHandlers={{ click: () => selectVillage(v.id) }}
                    />
                  )
                ))}
                <Marker position={[numLat, numLng]} icon={createVillageIcon(village, true)} draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const pos = (e.target as L.Marker).getLatLng()
                      markDirty(() => {
                        setLat(pos.lat.toFixed(6))
                        setLng(pos.lng.toFixed(6))
                      })
                    }
                  }}
                />
              </MapContainer>
            </div>
          </div>

          <div className="form-card">
            <div className="form-group">
              <label>{tr('villageName', lang)}</label>
              <input value={villageName} onChange={(e) => markDirty(() => setVillageName(e.target.value))} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{tr('latitude', lang)}</label>
                <input value={lat} onChange={(e) => markDirty(() => setLat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>{tr('longitude', lang)}</label>
                <input value={lng} onChange={(e) => markDirty(() => setLng(e.target.value))} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{tr('harvestSeason', lang)}</label>
                <div className="toggle-group">
                  <button
                    className={`toggle ${inSeason ? 'on' : ''}`}
                    onClick={() => markDirty(() => setInSeason(!inSeason))}
                    aria-label="Toggle in season"
                  />
                  <span className="toggle-label">
                    {inSeason ? tr('inSeason', lang) : tr('offSeason', lang)}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>{tr('filterWheelchair', lang)}</label>
                <div className="toggle-group">
                  <button
                    className={`toggle ${wheelchair ? 'on' : ''}`}
                    onClick={() => markDirty(() => setWheelchair(!wheelchair))}
                    aria-label="Toggle wheelchair access"
                  />
                  <span className="toggle-label">
                    {wheelchair
                      ? (lang === 'en' ? 'Accessible' : 'Aksesibel')
                      : (lang === 'en' ? 'Not accessible' : 'Tidak aksesibel')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header-row">
              <h3 style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>
                {tr('villagePhoto', lang)} ({photos.length})
              </h3>
              <button className="btn-sm" onClick={addPhoto}>
                + {tr('uploadPhoto', lang)}
              </button>
            </div>
            {photos.length > 0 && (
              <div className="photo-grid">
                {photos.map((p) => (
                  <div key={p.id} className="photo-thumb-wrap">
                    {p.isNew ? (
                      <img className="photo-thumb" src={makeThumbSvg(`${selectedId}-${p.id}`)} alt="New" />
                    ) : (
                      <ResponsiveImage villageId={p.villageId} villageName={p.villageName} className="photo-thumb" />
                    )}
                    <button className="photo-remove" onClick={() => removePhoto(p.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-card">
            <div className="card-header-row">
              <h3 style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>
                {tr('tourActivities', lang)} ({totalActivities})
              </h3>
              <button className="btn-sm" onClick={addActivity}>
                + {lang === 'en' ? 'Add Activity' : 'Tambah Aktivitas'}
              </button>
            </div>
            {activities.map((a, i) => (
              <div key={i} className="activity-edit-card">
                <div className="activity-edit-header">
                  <span className="activity-edit-num">#{i + 1}</span>
                  <button className="btn-sm btn-sm-danger" onClick={() => removeActivity(i)}>
                    {lang === 'en' ? 'Remove' : 'Hapus'}
                  </button>
                </div>
                <div className="form-group">
                  <label>{lang === 'en' ? 'Activity Name (English)' : 'Nama Aktivitas (Inggris)'}</label>
                  <input value={a.nameEn} onChange={(e) => updateActivity(i, 'nameEn', e.target.value)} placeholder="e.g. Village Tour & Homestay" />
                </div>
                <div className="form-group">
                  <label>{lang === 'en' ? 'Activity Name (Bahasa)' : 'Nama Aktivitas (Bahasa)'}</label>
                  <input value={a.nameId} onChange={(e) => updateActivity(i, 'nameId', e.target.value)} placeholder="cth. Tur Desa & Homestay" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{tr('price', lang)}</label>
                    <input value={a.price} onChange={(e) => updateActivity(i, 'price', e.target.value)} placeholder="Rp 100.000 (~$6)" />
                  </div>
                  <div className="form-group">
                    <label>{lang === 'en' ? 'Duration (English)' : 'Durasi (Inggris)'}</label>
                    <input value={a.durationEn} onChange={(e) => updateActivity(i, 'durationEn', e.target.value)} placeholder="e.g. 2 hours" />
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
                {lang === 'en' ? 'No activities yet. Click "Add Activity" above.' : 'Belum ada aktivitas. Klik "Tambah Aktivitas" di atas.'}
              </p>
            )}
          </div>

          <button
            className={`btn-primary ${offline ? 'offline' : ''} ${dirty && !offline ? 'dirty' : ''}`}
            onClick={handleSave}
          >
            {offline
              ? tr('savedLocal', lang)
              : dirty
                ? (lang === 'en' ? 'Save Changes' : 'Simpan Perubahan')
                : tr('save', lang)}
          </button>

          {queued && (
            <div className="offline-notice">
              <span className="dot" />
              {tr('queuedNotice', lang)}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="screen-desc">{tr('addVillageDesc', lang)}</p>

          <div className="form-card">
            <div className="card-header-row">
              <h3 style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>
                {lang === 'en' ? 'Village Location' : 'Lokasi Desa'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                {lang === 'en' ? 'Drag the marker to set position' : 'Seret marker untuk mengatur posisi'}
              </span>
            </div>
            <div className="map-draw-area" style={{ height: 320 }}>
              <MapContainer
                key="add-village"
                center={[newNumLat, newNumLng]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution=''
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FlyToVillage lat={newNumLat} lng={newNumLng} zoom={12} />
                {villages.map((v) => (
                  <Marker
                    key={v.id}
                    position={[v.lat, v.lng]}
                    icon={createVillageIcon(v, false)}
                  />
                ))}
                <Marker
                  position={[newNumLat, newNumLng]}
                  draggable={true}
                  icon={L.divIcon({
                    className: '',
                    html: `<div style="width:28px;height:28px;background:#C68C28;border:3px solid #C68C28;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;font-family:sans-serif;">+</div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                  })}
                  eventHandlers={{
                    dragend: (e) => {
                      const pos = (e.target as L.Marker).getLatLng()
                      setNewLat(pos.lat.toFixed(6))
                      setNewLng(pos.lng.toFixed(6))
                    }
                  }}
                />
              </MapContainer>
            </div>
          </div>

          <div className="form-card">
            <div className="form-group">
              <label>{tr('villageName', lang)} *</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={lang === 'en' ? 'e.g. Desa Wisata Pagerjurang' : 'cth. Desa Wisata Pagerjurang'} />
            </div>

            <div className="form-group">
              <label>{tr('villageDescId', lang)} *</label>
              <textarea
                value={newDescId}
                onChange={(e) => setNewDescId(e.target.value)}
                placeholder={lang === 'en' ? 'Description in Bahasa Indonesia' : 'Deskripsi dalam Bahasa Indonesia'}
                rows={2}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #ddd', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-group">
              <label>{tr('villageDescEn', lang)} *</label>
              <textarea
                value={newDescEn}
                onChange={(e) => setNewDescEn(e.target.value)}
                placeholder={lang === 'en' ? 'Description in English' : 'Deskripsi dalam Bahasa Inggris'}
                rows={2}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #ddd', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{tr('latitude', lang)}</label>
                <input value={newLat} onChange={(e) => setNewLat(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{tr('longitude', lang)}</label>
                <input value={newLng} onChange={(e) => setNewLng(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{tr('harvestSeason', lang)}</label>
                <div className="toggle-group">
                  <button
                    className={`toggle ${newInSeason ? 'on' : ''}`}
                    onClick={() => setNewInSeason(!newInSeason)}
                    aria-label="Toggle in season"
                  />
                  <span className="toggle-label">
                    {newInSeason ? tr('inSeason', lang) : tr('offSeason', lang)}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>{tr('filterWheelchair', lang)}</label>
                <div className="toggle-group">
                  <button
                    className={`toggle ${newWheelchair ? 'on' : ''}`}
                    onClick={() => setNewWheelchair(!newWheelchair)}
                    aria-label="Toggle wheelchair access"
                  />
                  <span className="toggle-label">
                    {newWheelchair
                      ? (lang === 'en' ? 'Accessible' : 'Aksesibel')
                      : (lang === 'en' ? 'Not accessible' : 'Tidak aksesibel')}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>{tr('whatsappNumber', lang)} *</label>
              <input value={newWhatsapp} onChange={(e) => setNewWhatsapp(e.target.value)} placeholder="6281234560000" />
            </div>

            <div className="form-group">
              <label>{tr('imageUrl', lang)}</label>
              <input value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder={lang === 'en' ? 'https://example.com/photo.jpg (optional)' : 'https://example.com/foto.jpg (opsional)'} />
            </div>
          </div>

          <div className="form-card">
            <div className="card-header-row">
              <h3 style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>
                {tr('tourActivities', lang)} ({newActivities.length})
              </h3>
              <button className="btn-sm" onClick={addNewActivity}>
                + {lang === 'en' ? 'Add Activity' : 'Tambah Aktivitas'}
              </button>
            </div>
            {newActivities.map((a, i) => (
              <div key={i} className="activity-edit-card">
                <div className="activity-edit-header">
                  <span className="activity-edit-num">#{i + 1}</span>
                  <button className="btn-sm btn-sm-danger" onClick={() => removeNewActivity(i)}>
                    {lang === 'en' ? 'Remove' : 'Hapus'}
                  </button>
                </div>
                <div className="form-group">
                  <label>{lang === 'en' ? 'Activity Name (English)' : 'Nama Aktivitas (Inggris)'}</label>
                  <input value={a.nameEn} onChange={(e) => updateNewActivity(i, 'nameEn', e.target.value)} placeholder="e.g. Village Tour & Homestay" />
                </div>
                <div className="form-group">
                  <label>{lang === 'en' ? 'Activity Name (Bahasa)' : 'Nama Aktivitas (Bahasa)'}</label>
                  <input value={a.nameId} onChange={(e) => updateNewActivity(i, 'nameId', e.target.value)} placeholder="cth. Tur Desa & Homestay" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{tr('price', lang)}</label>
                    <input value={a.price} onChange={(e) => updateNewActivity(i, 'price', e.target.value)} placeholder="Rp 100.000 (~$6)" />
                  </div>
                  <div className="form-group">
                    <label>{lang === 'en' ? 'Duration (English)' : 'Durasi (Inggris)'}</label>
                    <input value={a.durationEn} onChange={(e) => updateNewActivity(i, 'durationEn', e.target.value)} placeholder="e.g. 2 hours" />
                  </div>
                </div>
              </div>
            ))}
            {newActivities.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
                {lang === 'en' ? 'No activities yet. Click "Add Activity" above.' : 'Belum ada aktivitas. Klik "Tambah Aktivitas" di atas.'}
              </p>
            )}
          </div>

          <button
            className={`btn-primary ${offline ? 'offline' : 'dirty'}`}
            onClick={handleAddVillage}
          >
            {offline
              ? tr('savedLocal', lang)
              : (lang === 'en' ? 'Register Village' : 'Daftarkan Desa')}
          </button>

          {queued && (
            <div className="offline-notice">
              <span className="dot" />
              {tr('queuedNotice', lang)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
