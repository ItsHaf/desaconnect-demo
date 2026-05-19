import { useRef, useState } from 'react'
import { MapContainer, Marker, Polygon, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useLang } from '../components/LangProvider'
import { usePlots } from '../components/PlotsProvider'
import { useVillages } from '../components/VillagesProvider'
import { getMonths, tr, type TranslationKey } from '../data/i18n'
import type { FarmerPlot } from '../data/mockData'

const DEFAULT_CENTER: [number, number] = [-7.678, 110.385]
const DEFAULT_POINTS: [number, number][] = [
  [-7.682, 110.382],
  [-7.678, 110.39],
  [-7.674, 110.387],
  [-7.676, 110.379],
]

const pointIcon = L.divIcon({
  className: '',
  html: '<div style="width:12px;height:12px;background:#4A7C2E;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

type CommodityKey = 'Salak' | 'Cabai' | 'Padi' | 'Jagung'

const COMMODITY_KEYS: Record<CommodityKey, string> = {
  Salak: 'commoditySalak',
  Cabai: 'commodityCabai',
  Padi: 'commodityPadi',
  Jagung: 'commodityJagung',
}

const COMMODITIES: CommodityKey[] = ['Salak', 'Cabai', 'Padi', 'Jagung']

const COMMODITY_EN: Record<CommodityKey, string> = {
  Salak: 'Snakefruit (Salak)',
  Cabai: 'Chili (Cabai)',
  Padi: 'Rice (Padi)',
  Jagung: 'Corn (Jagung)',
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

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function DraggableMarker({
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

  return <Marker draggable={true} eventHandlers={eventHandlers} position={position} icon={pointIcon} ref={markerRef} />
}

export default function FarmerPlotRegistration() {
  const { lang } = useLang()
  const { plots, addPlot, removePlotsByFarmer, pendingPlots, addPendingPlot, syncPendingPlots, offlineMode, setOfflineMode } = usePlots()
  const { addAuditEntry } = useVillages()
  const [saved, setSaved] = useState(false)
  const [rightsMsg, setRightsMsg] = useState('')
  const [commodity, setCommodity] = useState<CommodityKey>('Salak')
  const [startMonth, setStartMonth] = useState('5')
  const [endMonth, setEndMonth] = useState('8')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [points, setPoints] = useState<[number, number][]>(DEFAULT_POINTS)
  const queued = pendingPlots.length > 0

  const months = getMonths(lang)

  const buildPlot = (): FarmerPlot => ({
    id: Date.now(),
    farmerId: 'farmer-me',
    villageId: 0,
    commodity,
    commodityEn: COMMODITY_EN[commodity],
    inSeason: true,
    public: visibility === 'public',
    harvestStart: Number(startMonth),
    harvestEnd: Number(endMonth),
    points: [...points],
  })

  const ownPlots = plots.filter((plot) => plot.farmerId === 'farmer-me')

  const handleSave = () => {
    if (points.length < 3) return
    const plot = buildPlot()

    if (offlineMode) {
      addPendingPlot(plot)
      setSaved(true)
    } else {
      addPlot(plot)
      addAuditEntry({
        actorId: 'farmer-session',
        action: 'REGISTER_PLOT',
        targetId: `Lahan ${plot.commodity}, Sleman`,
        targetEn: `${plot.commodityEn} Plot, Sleman`,
      })
      setSaved(true)
    }
  }

  const toggleOffline = () => {
    const goingOnline = offlineMode
    setOfflineMode(!offlineMode)

    if (goingOnline && pendingPlots.length > 0) {
      syncPendingPlots()
      for (const plot of pendingPlots) {
        addAuditEntry({
          actorId: 'farmer-session',
          action: 'REGISTER_PLOT',
          targetId: `Lahan ${plot.commodity}, Sleman`,
          targetEn: `${plot.commodityEn} Plot, Sleman`,
        })
      }
      setSaved(true)
    }
  }

  const addPoint = (lat: number, lng: number) => {
    setPoints((prev) => [...prev, [lat, lng]])
    setSaved(false)
  }

  const updatePoint = (index: number, lat: number, lng: number) => {
    setPoints((prev) => {
      const next = [...prev]
      next[index] = [lat, lng]
      return next
    })
    setSaved(false)
  }

  const removeLastPoint = () => {
    setPoints((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev))
    setSaved(false)
  }

  const clearPoints = () => {
    setPoints([])
    setSaved(false)
  }

  const exportOwnData = () => {
    const data = ownPlots.length > 0 ? ownPlots : (pendingPlots.length > 0 ? pendingPlots : [])
    downloadJson('desaconnect_my_plots.json', data)
    addAuditEntry({
      actorId: 'farmer-session',
      action: 'EXPORT_OWN_DATA',
      targetId: 'Ekspor data petani',
      targetEn: 'Farmer data export',
    })
    setRightsMsg(tr('exportDone', lang))
  }

  const deleteOwnData = () => {
    if (!window.confirm(lang === 'en' ? 'Delete all plots you registered in this session?' : 'Hapus semua lahan yang Anda daftarkan pada sesi ini?')) return
    removePlotsByFarmer('farmer-me')
    setSaved(false)
    addAuditEntry({
      actorId: 'farmer-session',
      action: 'DELETE_DATA_REQUEST',
      targetId: 'Hapus data lahan petani',
      targetEn: 'Delete farmer plot data',
    })
    setRightsMsg(tr('deleteDone', lang))
  }

  return (
    <div className="form-screen">
      <h2>{tr('farmerTitle', lang)}</h2>
      <p className="screen-desc">{tr('farmerDesc', lang)}</p>

      <div className={`offline-sim ${offlineMode ? 'active' : ''}`}>
        <span className="offline-sim-label">{tr('offlineSim', lang)}</span>
        <button className={`toggle ${offlineMode ? 'on' : ''}`} onClick={toggleOffline} aria-label="Toggle offlineMode simulation" />
      </div>

      <div className="map-draw-area">
        <MapContainer center={DEFAULT_CENTER} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} zoomControl={true}>
          <TileLayer attribution='' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onMapClick={addPoint} />
          {points.length > 2 && (
            <Polygon positions={points} pathOptions={{ color: '#4A7C2E', fillColor: '#4A7C2E', fillOpacity: 0.25, weight: 2 }} />
          )}
          {points.map((point, i) => (
            <DraggableMarker key={i} position={point} onDrag={(lat, lng) => updatePoint(i, lat, lng)} onDragEnd={(lat, lng) => updatePoint(i, lat, lng)} />
          ))}
        </MapContainer>
      </div>

      <div className="map-draw-controls">
        <span className="map-draw-hint">{tr('farmerDrawHint', lang)}</span>
        <div className="map-draw-buttons">
          <button className="btn-sm" onClick={removeLastPoint}>{tr('farmerUndoPoint', lang)}</button>
          <button className="btn-sm btn-sm-danger" onClick={clearPoints}>{tr('farmerClearPoints', lang)}</button>
        </div>
      </div>

      <div className="polygon-info">
        {points.length > 0 && <span>{points.length} {lang === 'en' ? 'points' : 'titik'}{points.length >= 3 ? ` · ${(points.length * 0.14 + 0.08).toFixed(2)} ha` : ''}</span>}
      </div>

      <div className="form-card">
        <div className="form-group">
          <label>{tr('commodity', lang)}</label>
          <select value={commodity} onChange={(e) => { setCommodity(e.target.value as CommodityKey); setSaved(false) }}>
            {COMMODITIES.map((key) => (
              <option key={key} value={key}>{tr(COMMODITY_KEYS[key] as TranslationKey, lang)}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{tr('harvestStart', lang)}</label>
            <select value={startMonth} onChange={(e) => { setStartMonth(e.target.value); setSaved(false) }}>
              {months.map((month, i) => (
                <option key={i} value={String(i + 1)}>{month}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{tr('harvestEnd', lang)}</label>
            <select value={endMonth} onChange={(e) => { setEndMonth(e.target.value); setSaved(false) }}>
              {months.map((month, i) => (
                <option key={i} value={String(i + 1)}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{tr('visibility', lang)}</label>
          <select value={visibility} onChange={(e) => { setVisibility(e.target.value as 'public' | 'private'); setSaved(false) }}>
            <option value="public">{tr('publicReduced', lang)}</option>
            <option value="private">{tr('private', lang)}</option>
          </select>
        </div>
      </div>

      <button className={`btn-primary ${offlineMode ? 'offlineMode' : ''} ${saved ? '' : 'dirty'}`} onClick={handleSave}>
        {offlineMode ? tr('savedLocal', lang) : saved ? tr('save', lang) : lang === 'en' ? 'Save Plot' : 'Simpan Lahan'}
      </button>

      {queued && (
        <div className="offline-notice">
          <span className="dot" />
          {tr('queuedNotice', lang)}
        </div>
      )}

      {saved && !queued && !offlineMode && (
        <div className="offline-notice" style={{ background: '#d4edda', borderColor: '#a3d9a5', color: '#155724' }}>
          <span className="dot" style={{ background: '#28a745' }} />
          {lang === 'en' ? 'Plot saved! Switch to Visitor view to see it on the map.' : 'Lahan tersimpan! Beralih ke tampilan Pengunjung untuk melihatnya di peta.'}
        </div>
      )}

      <div className="form-card">
        <div className="card-header-row">
          <h3 style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>{tr('dataRightsTitle', lang)}</h3>
        </div>
        <p className="screen-desc" style={{ marginBottom: 12 }}>{tr('dataRightsDesc', lang)}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-sm" onClick={exportOwnData}>{tr('exportMyData', lang)}</button>
          <button className="btn-sm btn-sm-danger" onClick={deleteOwnData}>{tr('deleteMyData', lang)}</button>
        </div>
        {rightsMsg && (
          <p style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--muted)' }}>{rightsMsg}</p>
        )}
      </div>
    </div>
  )
}
