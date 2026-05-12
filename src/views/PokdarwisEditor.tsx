import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useLang } from '../components/LangProvider'
import { tr } from '../data/i18n'
import { villages, type Activity, type Village } from '../data/mockData'
import ResponsiveImage, { makeThumbSvg } from '../components/ResponsiveImage'

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

export default function PokdarwisEditor() {
  const { lang } = useLang()
  const [offline, setOffline] = useState(false)
  const [queued, setQueued] = useState(false)
  const [selectedId, setSelectedId] = useState(villages[0].id)
  const [dirty, setDirty] = useState(false)

  const village = villages.find((v) => v.id === selectedId) ?? villages[0]

  const [villageName, setVillageName] = useState(village.name)
  const [lat, setLat] = useState(String(village.lat))
  const [lng, setLng] = useState(String(village.lng))
  const [inSeason, setInSeason] = useState(village.inSeason)
  const [wheelchair, setWheelchair] = useState(village.wheelchairAccess)
  const [activities, setActivities] = useState<EditableActivity[]>(village.activities.map(actToEdit))
  const [photos, setPhotos] = useState<PhotoItem[]>(villageToPhotos(village))

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
  }

  const markDirty = (fn: () => void) => {
    fn()
    setDirty(true)
  }

  const addActivity = () => {
    markDirty(() => setActivities((prev) => [...prev, { nameId: '', nameEn: '', price: '', durationId: '', durationEn: '' }]))
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
    } else {
      setDirty(false)
    }
  }

  const totalActivities = activities.length
  const numLat = parseFloat(lat) || village.lat
  const numLng = parseFloat(lng) || village.lng

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
            key={selectedId}
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
    </div>
  )
}
