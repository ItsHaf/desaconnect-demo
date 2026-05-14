import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useLang } from '../components/LangProvider'
import { useData } from '../components/DataProvider'
import { tr, getMonths, type TranslationKey } from '../data/i18n'

const DEFAULT_CENTER: [number, number] = [-7.678, 110.385]
const DEFAULT_POINTS: [number, number][] = [
  [-7.682, 110.382],
  [-7.678, 110.390],
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

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function DraggableMarker({ position, onDrag, onDragEnd }: { position: [number, number]; onDrag: (lat: number, lng: number) => void; onDragEnd: (lat: number, lng: number) => void }) {
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

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      icon={pointIcon}
      ref={markerRef}
    />
  )
}

export default function FarmerPlotRegistration() {
  const { lang } = useLang()
  const { addAuditEntry } = useData()
  const [offline, setOffline] = useState(false)
  const [queued, setQueued] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [commodity, setCommodity] = useState<CommodityKey>('Salak')
  const [startMonth, setStartMonth] = useState('5')
  const [endMonth, setEndMonth] = useState('8')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [points, setPoints] = useState<[number, number][]>(DEFAULT_POINTS)

  const months = getMonths(lang)

  const commodityLabel = (key: CommodityKey) => tr(COMMODITY_KEYS[key] as TranslationKey, lang)

  const handleSave = () => {
    if (offline) {
      setQueued(true)
      return
    }

    const label = commodityLabel(commodity)
    addAuditEntry({
      actorId: 'farmer-session',
      action: 'REGISTER_PLOT',
      targetId: `Lahan ${label}, Sleman`,
      targetEn: `${label} Plot, Sleman`,
    })

    setSuccessMsg(lang === 'en' ? 'Plot registered successfully!' : 'Lahan berhasil didaftarkan!')
  }

  const addPoint = (lat: number, lng: number) => {
    setPoints((prev) => [...prev, [lat, lng]])
  }

  const updatePoint = (index: number, lat: number, lng: number) => {
    setPoints((prev) => {
      const next = [...prev]
      next[index] = [lat, lng]
      return next
    })
  }

  const removeLastPoint = () => {
    setPoints((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev))
  }

  const clearPoints = () => {
    setPoints([])
  }

  return (
    <div className="form-screen">
      <h2>{tr('farmerTitle', lang)}</h2>
      <p className="screen-desc">{tr('farmerDesc', lang)}</p>

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

      {successMsg && (
        <div className="success-notice">
          {successMsg}
        </div>
      )}

      <div className="map-draw-area">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution=''
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={addPoint} />
          {points.length > 2 && (
            <Polygon
              positions={points}
              pathOptions={{ color: '#4A7C2E', fillColor: '#4A7C2E', fillOpacity: 0.25, weight: 2 }}
            />
          )}
          {points.map((p, i) => (
            <DraggableMarker
              key={i}
              position={p}
              onDrag={(lat, lng) => updatePoint(i, lat, lng)}
              onDragEnd={(lat, lng) => updatePoint(i, lat, lng)}
            />
          ))}
        </MapContainer>
      </div>

      <div className="map-draw-controls">
        <span className="map-draw-hint">
          {tr('farmerDrawHint', lang)}
        </span>
        <div className="map-draw-buttons">
          <button className="btn-sm" onClick={removeLastPoint}>
            {tr('farmerUndoPoint', lang)}
          </button>
          <button className="btn-sm btn-sm-danger" onClick={clearPoints}>
            {tr('farmerClearPoints', lang)}
          </button>
        </div>
      </div>

      <div className="polygon-info">
        {points.length > 0 && (
          <span>{points.length} {lang === 'en' ? 'points' : 'titik'}{points.length >= 3 ? ` · ${(points.length * 0.14 + 0.08).toFixed(2)} ha` : ''}</span>
        )}
      </div>

      <div className="form-card">
        <div className="form-group">
          <label>{tr('commodity', lang)}</label>
          <select value={commodity} onChange={(e) => setCommodity(e.target.value as CommodityKey)}>
            {COMMODITIES.map((key) => (
              <option key={key} value={key}>
                {commodityLabel(key)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{tr('harvestStart', lang)}</label>
            <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)}>
              {months.map((b, i) => (
                <option key={i} value={String(i + 1)}>{b}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{tr('harvestEnd', lang)}</label>
            <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)}>
              {months.map((b, i) => (
                <option key={i} value={String(i + 1)}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{tr('visibility', lang)}</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
          >
            <option value="public">{tr('publicReduced', lang)}</option>
            <option value="private">{tr('private', lang)}</option>
          </select>
        </div>
      </div>

      <button
        className={`btn-primary ${offline ? 'offline' : ''}`}
        onClick={handleSave}
      >
        {offline ? tr('savedLocal', lang) : tr('save', lang)}
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
