import { MapContainer, TileLayer, Marker, Polygon, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useState } from 'react'
import { reviews, type FarmerPlot, type Review, type Village } from '../data/mockData'
import { useLang } from '../components/LangProvider'
import { usePlots } from '../components/PlotsProvider'
import { useVillages } from '../components/VillagesProvider'
import { getMonths, tr, type Lang, type TranslationKey } from '../data/i18n'
import ResponsiveImage from '../components/ResponsiveImage'

function simplifyPublicPoints(points: [number, number][]): [number, number][] {
  const coarse = points.map(([lat, lng]) => [Number(lat.toFixed(3)), Number(lng.toFixed(3))] as [number, number])
  const deduped = coarse.filter((point, index) => index === 0 || point[0] !== coarse[index - 1][0] || point[1] !== coarse[index - 1][1])
  return deduped.length >= 3 ? deduped : points
}

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

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? 'star filled' : 'star'}>&#9733;</span>
      ))}
    </span>
  )
}

function PlotPopup({ plot, villageName, months, lang }: { plot: FarmerPlot; villageName: string; months: string[]; lang: Lang }) {
  return (
    <Popup>
      <div className="plot-popup">
        <strong>{lang === 'en' ? plot.commodityEn : plot.commodity}</strong>
        <div className="plot-popup-row">
          <span className="plot-popup-label">{tr('plotFarmer' as TranslationKey, lang)}:</span>
          <span>{plot.farmerId}</span>
        </div>
        <div className="plot-popup-row">
          <span className="plot-popup-label">{tr('plotHarvestWindow' as TranslationKey, lang)}:</span>
          <span>{months[plot.harvestStart - 1]} - {months[plot.harvestEnd - 1]}</span>
        </div>
        <div className="plot-popup-row">
          <span className={`badge ${plot.inSeason ? 'in-season' : 'off-season'}`} style={{ margin: 0, fontSize: '0.7rem' }}>
            {plot.inSeason ? tr('plotSeasonYes' as TranslationKey, lang) : tr('plotSeasonNo' as TranslationKey, lang)}
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 4 }}>{villageName}</div>
      </div>
    </Popup>
  )
}

interface Filters {
  inSeason: boolean
  hasActivities: boolean
  wheelchairAccess: boolean
}

export default function VisitorMapView() {
  const [selected, setSelected] = useState<Village | null>(null)
  const [filters, setFilters] = useState<Filters>({
    inSeason: false,
    hasActivities: false,
    wheelchairAccess: false,
  })
  const [showPlots, setShowPlots] = useState(true)
  const { lang } = useLang()
  const { plots: farmerPlots } = usePlots()
  const { villages, addAuditEntry } = useVillages()

  const [allReviews, setAllReviews] = useState<Review[]>(reviews)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formText, setFormText] = useState('')
  const [formRating, setFormRating] = useState(5)

  const filtered = villages.filter((v) => {
    if (filters.inSeason && !v.inSeason) return false
    if (filters.hasActivities && !v.hasActivities) return false
    if (filters.wheelchairAccess && !v.wheelchairAccess) return false
    return true
  })

  const toggle = (key: keyof Filters) => setFilters((f) => ({ ...f, [key]: !f[key] }))

  const villageReviews = selected ? allReviews.filter((r) => r.villageId === selected.id) : []
  const avgRating = villageReviews.length > 0 ? (villageReviews.reduce((sum, r) => sum + r.rating, 0) / villageReviews.length).toFixed(1) : null

  const submitReview = () => {
    if (!selected || !formName.trim() || !formText.trim()) return

    const newReview: Review = {
      id: Date.now(),
      villageId: selected.id,
      author: formName.trim(),
      rating: formRating,
      textId: formText.trim(),
      textEn: formText.trim(),
      date: new Date().toISOString().split('T')[0],
    }

    setAllReviews((prev) => [newReview, ...prev])
    addAuditEntry({
      actorId: 'visitor-session',
      action: 'SUBMIT_REVIEW',
      targetId: `Ulasan — ${selected.name}`,
      targetEn: `Review — ${selected.name}`,
    })
    setFormName('')
    setFormText('')
    setFormRating(5)
    setShowForm(false)
  }

  const publicPlots = showPlots ? farmerPlots.filter((plot) => plot.public) : []

  return (
    <div className="map-container">
      <div className="visitor-intro">{tr('visitorDesc', lang)}</div>
      <div className="filter-bar filter-bar-right">
        <button className={`filter-chip ${showPlots ? 'active' : ''}`} onClick={() => setShowPlots(!showPlots)}>
          {tr('showPlots' as TranslationKey, lang)}
        </button>
        <button className={`filter-chip ${filters.inSeason ? 'active' : ''}`} onClick={() => toggle('inSeason')}>
          {tr('filterInSeason', lang)}
        </button>
        <button className={`filter-chip ${filters.hasActivities ? 'active' : ''}`} onClick={() => toggle('hasActivities')}>
          {tr('filterActivities', lang)}
        </button>
        <button className={`filter-chip ${filters.wheelchairAccess ? 'active' : ''}`} onClick={() => toggle('wheelchairAccess')}>
          {tr('filterWheelchair', lang)}
        </button>
      </div>

      <MapContainer center={[-7.7, 110.36]} zoom={12} zoomControl={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {publicPlots.map((plot) => {
          const village = villages.find((v) => v.id === plot.villageId)
          const months = getMonths(lang)

          return (
            <Polygon
              key={plot.id}
              positions={simplifyPublicPoints(plot.points)}
              pathOptions={{
                color: plot.inSeason ? '#4A7C2E' : '#999',
                fillColor: plot.inSeason ? '#4A7C2E' : '#999',
                fillOpacity: 0.25,
                weight: 2,
                dashArray: '4 4',
              }}
            >
              <PlotPopup plot={plot} villageName={village?.name ?? ''} months={months} lang={lang} />
            </Polygon>
          )
        })}
        {filtered.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={createIcon(v)} eventHandlers={{ click: () => { setSelected(v); setShowForm(false) } }} />
        ))}
      </MapContainer>

      {selected && (
        <div className="detail-panel">
          <button className="detail-close" onClick={() => setSelected(null)}>&#10005;</button>
          <ResponsiveImage villageId={selected.id} villageName={selected.name} className="detail-photo" style={{ borderRadius: 'var(--radius-sm)' }} />
          <div className="detail-name">{selected.name}</div>
          <div className="detail-desc">{getDesc(selected, lang)}</div>
          <span className={`badge ${selected.inSeason ? 'in-season' : 'off-season'}`}>{selected.inSeason ? tr('inSeason', lang) : tr('offSeason', lang)}</span>

          {avgRating && (
            <div className="review-summary">
              <Stars rating={Math.round(Number(avgRating))} />
              <span className="review-avg">{avgRating}</span>
              <span className="review-count">({villageReviews.length})</span>
            </div>
          )}

          {selected.activities.length > 0 && selected.activities.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-name">{lang === 'en' ? a.nameEn : a.nameId}</div>
              <div className="activity-meta">{a.price} · {lang === 'en' ? a.durationEn : a.durationId}</div>
            </div>
          ))}

          <div className="review-section">
            <div className="card-header-row">
              <h4>{tr('reviews' as TranslationKey, lang)} ({villageReviews.length})</h4>
              <button className="btn-sm" onClick={() => setShowForm(!showForm)}>+ {tr('writeReview' as TranslationKey, lang)}</button>
            </div>

            {showForm && (
              <div className="review-form">
                <div className="form-group">
                  <label>{tr('reviewAuthor' as TranslationKey, lang)}</label>
                  <input value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{tr('reviewRating' as TranslationKey, lang)}</label>
                  <div className="rating-select">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} className={`rating-btn ${n <= formRating ? 'active' : ''}`} onClick={() => setFormRating(n)} type="button">
                        &#9733;
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>{tr('reviewText' as TranslationKey, lang)}</label>
                  <textarea value={formText} onChange={(e) => setFormText(e.target.value)} rows={3} />
                </div>
                <button className="btn-sm" onClick={submitReview}>{tr('reviewSubmit' as TranslationKey, lang)}</button>
              </div>
            )}

            {villageReviews.length === 0 && <p className="review-none">{tr('reviewNone' as TranslationKey, lang)}</p>}

            {villageReviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <span className="review-author">{review.author}</span>
                  <Stars rating={review.rating} />
                </div>
                <p className="review-text">{lang === 'en' ? review.textEn : review.textId}</p>
                <span className="review-date">{review.date}</span>
              </div>
            ))}
          </div>

          <a className="whatsapp-btn" href={`https://wa.me/${selected.whatsapp}?text=${tr('waMessage', lang)}`} target="_blank" rel="noopener noreferrer">
            &#128241; {tr('contactWhatsApp', lang)}
          </a>
        </div>
      )}
    </div>
  )
}
