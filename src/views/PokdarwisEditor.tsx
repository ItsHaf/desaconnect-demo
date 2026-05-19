import { useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useLang } from '../components/LangProvider'
import { useVillages } from '../components/VillagesProvider'
import { usePlots } from '../components/PlotsProvider'
import { getMonths, tr, type TranslationKey } from '../data/i18n'
import { type Activity, type AuditEntry, type FarmerPlot, type Village } from '../data/mockData'
import ResponsiveImage, { makeThumbSvg } from '../components/ResponsiveImage'

type EditorMode = 'edit' | 'add' | 'delegate'

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
const DEFAULT_POINTS: [number, number][] = [
  [-7.682, 110.382],
  [-7.678, 110.39],
  [-7.674, 110.387],
  [-7.676, 110.379],
]
const plotPointIcon = L.divIcon({
  className: '',
  html: '<div style="width:12px;height:12px;background:#4A7C2E;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})
const COMMODITY_EN = {
  Salak: 'Snakefruit (Salak)',
  Cabai: 'Chili (Cabai)',
  Padi: 'Rice (Padi)',
  Jagung: 'Corn (Jagung)',
} as const
type CommodityKey = keyof typeof COMMODITY_EN

interface PendingVillageAction {
  type: 'update' | 'add'
  villageId?: number
  village?: Village
  changes?: Partial<Village>
  auditEntries: Array<Omit<AuditEntry, 'timestamp'>>
}

function PlotMapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function PlotDraggableMarker({
  position,
  onDrag,
  onDragEnd,
}: {
  position: [number, number]
  onDrag: (lat: number, lng: number) => void
  onDragEnd: (lat: number, lng: number) => void
}) {
  const markerRef = useRef<L.Marker>(null)
  const eventHandlers = {
    drag() {
      const marker = markerRef.current
      if (marker) {
        const pos = marker.getLatLng()
        onDrag(pos.lat, pos.lng)
      }
    },
    dragend() {
      const marker = markerRef.current
      if (marker) {
        const pos = marker.getLatLng()
        onDragEnd(pos.lat, pos.lng)
      }
    },
  }

  return <Marker draggable={true} eventHandlers={eventHandlers} position={position} icon={plotPointIcon} ref={markerRef} />
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function shortName(name: string): string {
  return name.replace('Desa Wisata ', '')
}

export default function PokdarwisEditor() {
  const { lang } = useLang()
  const { villages, nextId, updateVillage, addVillage, removeVillage, addAuditEntry } = useVillages()
  const { addPlot } = usePlots()
  const [mode, setMode] = useState<EditorMode>('edit')
  const [offline, setOffline] = useState(false)
  const [queued, setQueued] = useState(false)
  const [selectedId, setSelectedId] = useState(villages[0]?.id ?? 1)
  const [dirty, setDirty] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const pendingActions = useRef<PendingVillageAction[]>([])

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
  const [newConsent, setNewConsent] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [rightsMsg, setRightsMsg] = useState('')

  const [farmerId, setFarmerId] = useState('')
  const [delegatedConsent, setDelegatedConsent] = useState(false)
  const [delegatedSaved, setDelegatedSaved] = useState(false)
  const [delegatedCommodity, setDelegatedCommodity] = useState<CommodityKey>('Salak')
  const [delegatedStartMonth, setDelegatedStartMonth] = useState('5')
  const [delegatedEndMonth, setDelegatedEndMonth] = useState('8')
  const [delegatedVisibility, setDelegatedVisibility] = useState<'public' | 'private'>('public')
  const [delegatedPoints, setDelegatedPoints] = useState<[number, number][]>(DEFAULT_POINTS)

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
    setRightsMsg('')
    setValidationError('')
    if (m === 'edit') selectVillage(selectedId)
  }

  const syncPendingActions = () => {
    for (const action of pendingActions.current) {
      if (action.type === 'update' && action.villageId && action.changes) {
        updateVillage(action.villageId, action.changes)
      }
      if (action.type === 'add' && action.village) {
        addVillage(action.village)
      }
      action.auditEntries.forEach((entry) => addAuditEntry(entry))
    }
    pendingActions.current = []
    setQueued(false)
    setSuccessMsg(tr('syncComplete', lang))
  }

  const toggleOffline = () => {
    const goingOnline = offline
    setOffline(!offline)
    if (goingOnline && pendingActions.current.length > 0) {
      syncPendingActions()
    } else if (goingOnline) {
      setQueued(false)
    }
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
    const numLat = parseFloat(lat) || (village?.lat ?? -7.7)
    const numLng = parseFloat(lng) || (village?.lng ?? 110.36)
    const mappedActivities = activities.filter(a => a.nameId.trim() || a.nameEn.trim()).map(editToAct)

    const changes: Partial<Village> = {
      name: villageName,
      lat: numLat,
      lng: numLng,
      inSeason,
      wheelchairAccess: wheelchair,
      activities: mappedActivities,
      hasActivities: mappedActivities.length > 0,
    }

    const sn = shortName(villageName)
    const auditEntry: Omit<AuditEntry, 'timestamp'> = {
      actorId: 'pokdarwis-session',
      action: 'UPDATE_VILLAGE',
      targetId: `Perubahan — ${sn}`,
      targetEn: `Village Update — ${sn}`,
    }

    if (offline) {
      pendingActions.current.push({ type: 'update', villageId: selectedId, changes, auditEntries: [auditEntry] })
      setQueued(true)
      setDirty(false)
      setSuccessMsg(tr('savedLocal', lang))
      return
    }

    updateVillage(selectedId, changes)
    addAuditEntry(auditEntry)

    setDirty(false)
    setSuccessMsg(lang === 'en' ? 'Village updated successfully!' : 'Desa berhasil diperbarui!')
  }

  const handleAddVillage = () => {
    setValidationError('')
    if (!newName.trim() || !newDescId.trim() || !newDescEn.trim() || !newWhatsapp.trim() || !newConsent) {
      setValidationError(tr('fillRequired', lang))
      return
    }

    const numLat = parseFloat(newLat) || -7.700
    const numLng = parseFloat(newLng) || 110.360
    const mappedActivities = newActivities.filter(a => a.nameId.trim() || a.nameEn.trim()).map(editToAct)
    const pendingAddCount = pendingActions.current.filter((action) => action.type === 'add').length

    const created: Village = {
      id: nextId + pendingAddCount,
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
      clickThroughs: 0,
      photoColor: '#5b8c3e',
      image: newImage.trim() || `https://picsum.photos/seed/${newName.trim().toLowerCase().replace(/\s+/g, '')}/600/300`,
    }

    const sn = shortName(newName.trim())
    const registerAudit: Omit<AuditEntry, 'timestamp'> = {
      actorId: 'pokdarwis-session',
      action: 'REGISTER_VILLAGE',
      targetId: `Registrasi — ${sn}`,
      targetEn: `Village Registration — ${sn}`,
    }
    const consentAudit: Omit<AuditEntry, 'timestamp'> = {
      actorId: 'pokdarwis-session',
      action: 'CONFIRM_MUSYAWARAH_CONSENT',
      targetId: `Persetujuan Musyawarah — ${sn}`,
      targetEn: `Musyawarah Consent — ${sn}`,
    }

    if (offline) {
      pendingActions.current.push({ type: 'add', village: created, auditEntries: [registerAudit, consentAudit] })
      setQueued(true)
      setSuccessMsg(tr('savedLocal', lang))
    } else {
      addVillage(created)
      addAuditEntry(registerAudit)
      addAuditEntry(consentAudit)
      setSuccessMsg(tr('villageAdded', lang))
    }
    setNewName('')
    setNewDescId('')
    setNewDescEn('')
    setNewLat('-7.700')
    setNewLng('110.360')
    setNewInSeason(false)
    setNewWheelchair(false)
    setNewWhatsapp('')
    setNewImage('')
    setNewActivities([])
    setNewConsent(false)

    if (!offline) {
      setSelectedId(created.id)
      setMode('edit')
      setVillageName(created.name)
      setLat(String(created.lat))
      setLng(String(created.lng))
      setInSeason(created.inSeason)
      setWheelchair(created.wheelchairAccess)
      setActivities(created.activities.map(actToEdit))
      setPhotos(villageToPhotos(created))
      setDirty(false)
    }
  }

  const addDelegatedPoint = (pointLat: number, pointLng: number) => {
    setDelegatedPoints((prev) => [...prev, [pointLat, pointLng]])
    setDelegatedSaved(false)
  }

  const updateDelegatedPoint = (index: number, pointLat: number, pointLng: number) => {
    setDelegatedPoints((prev) => {
      const next = [...prev]
      next[index] = [pointLat, pointLng]
      return next
    })
    setDelegatedSaved(false)
  }

  const removeLastDelegatedPoint = () => {
    setDelegatedPoints((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev))
    setDelegatedSaved(false)
  }

  const clearDelegatedPoints = () => {
    setDelegatedPoints([])
    setDelegatedSaved(false)
  }

  const handleDelegatedPlotSave = () => {
    if (!farmerId.trim() || !delegatedConsent || delegatedPoints.length < 3) return

    const plot: FarmerPlot = {
      id: Date.now(),
      farmerId: farmerId.trim(),
      villageId: selectedId,
      commodity: delegatedCommodity,
      commodityEn: COMMODITY_EN[delegatedCommodity],
      inSeason: true,
      public: delegatedVisibility === 'public',
      harvestStart: Number(delegatedStartMonth),
      harvestEnd: Number(delegatedEndMonth),
      points: [...delegatedPoints],
    }

    addPlot(plot)
    addAuditEntry({
      actorId: 'pokdarwis-session',
      action: 'DELEGATED_REGISTER_PLOT',
      targetId: `Lahan ${plot.commodity} — ${farmerId.trim()}`,
      targetEn: `${plot.commodityEn} Plot — ${farmerId.trim()}`,
    })
    addAuditEntry({
      actorId: 'pokdarwis-session',
      action: 'CONFIRM_FARMER_CONSENT',
      targetId: `Persetujuan Petani — ${farmerId.trim()}`,
      targetEn: `Farmer Consent — ${farmerId.trim()}`,
    })

    setDelegatedSaved(true)
    setFarmerId('')
    setDelegatedConsent(false)
    setDelegatedCommodity('Salak')
    setDelegatedStartMonth('5')
    setDelegatedEndMonth('8')
    setDelegatedVisibility('public')
    setDelegatedPoints(DEFAULT_POINTS)
    setSuccessMsg(tr('delegatedSaved', lang))
  }

  const exportSelectedVillage = () => {
    downloadJson(`desaconnect_village_${selectedId}.json`, village)
    addAuditEntry({
      actorId: 'pokdarwis-session',
      action: 'EXPORT_OWN_DATA',
      targetId: `Ekspor data — ${village.name}`,
      targetEn: `Data export — ${village.name}`,
    })
    setRightsMsg(tr('exportDone', lang))
  }

  const deleteSelectedVillage = () => {
    if (!window.confirm(lang === 'en' ? 'Delete the selected village from this session?' : 'Hapus desa terpilih dari sesi ini?')) return
    const nextVillageId = villages.find((v) => v.id !== selectedId)?.id ?? selectedId
    removeVillage(selectedId)
    addAuditEntry({
      actorId: 'pokdarwis-session',
      action: 'DELETE_DATA_REQUEST',
      targetId: `Hapus data — ${village.name}`,
      targetEn: `Delete data — ${village.name}`,
    })
    setRightsMsg(tr('deleteDone', lang))
    if (nextVillageId !== selectedId) {
      selectVillage(nextVillageId)
    }
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
          onClick={toggleOffline}
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
        <button className={`mode-tab ${mode === 'delegate' ? 'active' : ''}`} onClick={() => switchMode('delegate')}>
          {tr('delegatedRegister', lang)}
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
                      <img className="photo-thumb" src={makeThumbSvg(`${selectedId}-${p.id}`)} alt={lang === 'en' ? `New photo placeholder for ${villageName}` : `Placeholder foto baru untuk ${villageName}`} />
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

          <div className="form-card">
            <div className="card-header-row">
              <h3 style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>{tr('dataRightsTitle', lang)}</h3>
            </div>
            <p className="screen-desc" style={{ marginBottom: 12 }}>{tr('dataRightsDesc', lang)}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-sm" onClick={exportSelectedVillage}>{tr('exportMyData', lang)}</button>
              <button className="btn-sm btn-sm-danger" onClick={deleteSelectedVillage}>{tr('deleteMyData', lang)}</button>
            </div>
            {rightsMsg && <p style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--muted)' }}>{rightsMsg}</p>}
          </div>
        </>
      ) : mode === 'add' ? (
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

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <input
                type="checkbox"
                checked={newConsent}
                onChange={(e) => setNewConsent(e.target.checked)}
                style={{ marginTop: 4, width: 18, height: 18, flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--dark)', lineHeight: 1.4 }}>
                {tr('consentLabel', lang)}
              </span>
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
            disabled={!newName.trim() || !newConsent}
            style={{ opacity: !newName.trim() || !newConsent ? 0.5 : 1 }}
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
      ) : (
        <>
          <div className="form-card">
            <h3 style={{ fontSize: '0.95rem', color: 'var(--dark)', marginBottom: 4 }}>{tr('delegatedPlotTitle', lang)}</h3>
            <p className="screen-desc">{tr('delegatedPlotDesc', lang)}</p>

            <div className="form-group">
              <label>{lang === 'en' ? 'Village' : 'Desa'}</label>
              <select value={selectedId} onChange={(e) => { setSelectedId(Number(e.target.value)); setDelegatedSaved(false) }}>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{tr('delegatedFarmerId', lang)}</label>
              <input value={farmerId} onChange={(e) => { setFarmerId(e.target.value); setDelegatedSaved(false) }} placeholder={lang === 'en' ? 'e.g. farmer-elder-01 or Pak Suyatno' : 'cth. farmer-lansia-01 atau Pak Suyatno'} />
            </div>

            <div className="map-draw-area" style={{ height: 320 }}>
              <MapContainer center={[numLat, numLng]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                <TileLayer attribution='' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <PlotMapClickHandler onMapClick={addDelegatedPoint} />
                {delegatedPoints.length > 2 && (
                  <Polygon positions={delegatedPoints} pathOptions={{ color: '#4A7C2E', fillColor: '#4A7C2E', fillOpacity: 0.25, weight: 2 }} />
                )}
                {delegatedPoints.map((point, i) => (
                  <PlotDraggableMarker key={i} position={point} onDrag={(pointLat, pointLng) => updateDelegatedPoint(i, pointLat, pointLng)} onDragEnd={(pointLat, pointLng) => updateDelegatedPoint(i, pointLat, pointLng)} />
                ))}
              </MapContainer>
            </div>

            <div className="map-draw-controls">
              <span className="map-draw-hint">{tr('farmerDrawHint', lang)}</span>
              <div className="map-draw-buttons">
                <button className="btn-sm" onClick={removeLastDelegatedPoint}>{tr('farmerUndoPoint', lang)}</button>
                <button className="btn-sm btn-sm-danger" onClick={clearDelegatedPoints}>{tr('farmerClearPoints', lang)}</button>
              </div>
            </div>

            <div className="polygon-info">
              {delegatedPoints.length > 0 && <span>{delegatedPoints.length} {lang === 'en' ? 'points' : 'titik'}{delegatedPoints.length >= 3 ? ` · ${(delegatedPoints.length * 0.14 + 0.08).toFixed(2)} ha` : ''}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{tr('commodity', lang)}</label>
                <select value={delegatedCommodity} onChange={(e) => { setDelegatedCommodity(e.target.value as CommodityKey); setDelegatedSaved(false) }}>
                  {Object.keys(COMMODITY_EN).map((key) => (
                    <option key={key} value={key}>{tr(`commodity${key}` as TranslationKey, lang)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{tr('visibility', lang)}</label>
                <select value={delegatedVisibility} onChange={(e) => { setDelegatedVisibility(e.target.value as 'public' | 'private'); setDelegatedSaved(false) }}>
                  <option value="public">{tr('publicReduced', lang)}</option>
                  <option value="private">{tr('private', lang)}</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{tr('harvestStart', lang)}</label>
                <select value={delegatedStartMonth} onChange={(e) => { setDelegatedStartMonth(e.target.value); setDelegatedSaved(false) }}>
                  {getMonths(lang).map((month, i) => (
                    <option key={i} value={String(i + 1)}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{tr('harvestEnd', lang)}</label>
                <select value={delegatedEndMonth} onChange={(e) => { setDelegatedEndMonth(e.target.value); setDelegatedSaved(false) }}>
                  {getMonths(lang).map((month, i) => (
                    <option key={i} value={String(i + 1)}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <input
                type="checkbox"
                checked={delegatedConsent}
                onChange={(e) => { setDelegatedConsent(e.target.checked); setDelegatedSaved(false) }}
                style={{ marginTop: 4, width: 18, height: 18, flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--dark)', lineHeight: 1.4 }}>{tr('delegatedConsentLabel', lang)}</span>
            </div>

            <button className="btn-primary dirty" onClick={handleDelegatedPlotSave} disabled={!farmerId.trim() || !delegatedConsent || delegatedPoints.length < 3} style={{ opacity: !farmerId.trim() || !delegatedConsent || delegatedPoints.length < 3 ? 0.5 : 1 }}>
              {tr('delegatedRegister', lang)}
            </button>

            {delegatedSaved && (
              <div className="offline-notice" style={{ background: '#d4edda', borderColor: '#a3d9a5', color: '#155724', marginTop: 12 }}>
                <span className="dot" style={{ background: '#28a745' }} />
                {tr('delegatedSaved', lang)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
