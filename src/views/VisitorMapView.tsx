import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useState } from 'react'
import { useData } from '../components/DataProvider'
import { type Village } from '../data/mockData'
import { useLang } from '../components/LangProvider'
import { tr, type Lang } from '../data/i18n'
import ResponsiveImage from '../components/ResponsiveImage'

function createIcon(v: Village) {
  return L.divIcon({
    className: '',
    html: `<div class="village-marker ${v.inSeason ? '' : 'off-season'}"><span>${v.name.charAt(v.name.lastIndexOf(' ') + 1)}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

function getDesc(v: Village, lang: Lang) {
  return lang === 'en' ? v.descEn : v.descId
}

interface Filters {
  inSeason: boolean
  hasActivities: boolean
  wheelchairAccess: boolean
}

export default function VisitorMapView() {
  const { villages } = useData()
  const [selected, setSelected] = useState<Village | null>(null)
  const [filters, setFilters] = useState<Filters>({
    inSeason: false,
    hasActivities: false,
    wheelchairAccess: false,
  })
  const { lang } = useLang()

  const filtered = villages.filter((v) => {
    if (filters.inSeason && !v.inSeason) return false
    if (filters.hasActivities && !v.hasActivities) return false
    if (filters.wheelchairAccess && !v.wheelchairAccess) return false
    return true
  })

  const toggle = (key: keyof Filters) =>
    setFilters((f) => ({ ...f, [key]: !f[key] }))

  return (
    <div className="map-container">
      <div className="visitor-intro">
        {tr('visitorDesc', lang)}
      </div>
      <div className="filter-bar filter-bar-right">
        <button
          className={`filter-chip ${filters.inSeason ? 'active' : ''}`}
          onClick={() => toggle('inSeason')}
        >
          {tr('filterInSeason', lang)}
        </button>
        <button
          className={`filter-chip ${filters.hasActivities ? 'active' : ''}`}
          onClick={() => toggle('hasActivities')}
        >
          {tr('filterActivities', lang)}
        </button>
        <button
          className={`filter-chip ${filters.wheelchairAccess ? 'active' : ''}`}
          onClick={() => toggle('wheelchairAccess')}
        >
          {tr('filterWheelchair', lang)}
        </button>
      </div>

      <MapContainer
        center={[-7.70, 110.36]}
        zoom={12}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filtered.map((v) => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={createIcon(v)}
            eventHandlers={{ click: () => setSelected(v) }}
          />
        ))}
      </MapContainer>

      {selected && (
        <div className="detail-panel">
          <button className="detail-close" onClick={() => setSelected(null)}>
            ✕
          </button>
          <ResponsiveImage
            villageId={selected.id}
            villageName={selected.name}
            className="detail-photo"
            style={{ borderRadius: 'var(--radius-sm)' }}
          />
          <div className="detail-name">{selected.name}</div>
          <div className="detail-desc">{getDesc(selected, lang)}</div>
          <span className={`badge ${selected.inSeason ? 'in-season' : 'off-season'}`}>
            {selected.inSeason ? tr('inSeason', lang) : tr('offSeason', lang)}
          </span>
          {selected.activities.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-name">
                {lang === 'en' ? a.nameEn : a.nameId}
              </div>
              <div className="activity-meta">
                {a.price} · {lang === 'en' ? a.durationEn : a.durationId}
              </div>
            </div>
          ))}
          <a
            className="whatsapp-btn"
            href={`https://wa.me/${selected.whatsapp}?text=${tr('waMessage', lang)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📱 {tr('contactWhatsApp', lang)}
          </a>
        </div>
      )}
    </div>
  )
}
