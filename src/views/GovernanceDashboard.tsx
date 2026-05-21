import { reviews } from '../data/mockData'
import { useLang } from '../components/LangProvider'
import { useVillages } from '../components/VillagesProvider'
import { tr, type Lang, type TranslationKey } from '../data/i18n'

function getTarget(entry: { targetId: string; targetEn: string }, lang: Lang) {
  return lang === 'en' ? entry.targetEn : entry.targetId
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportVillagesCsv(allVillages: { id: number; name: string; lat: number; lng: number; inSeason: boolean; wheelchairAccess: boolean; activities: unknown[]; clickThroughs: number; whatsapp: string }[]) {
  const header = ['ID', 'Name', 'Latitude', 'Longitude', 'Open for Visits', 'Wheelchair Access', 'Activities', 'Click-throughs', 'WhatsApp']
  const rows = allVillages.map((village) => [
    String(village.id),
    village.name,
    String(village.lat),
    String(village.lng),
    String(village.inSeason),
    String(village.wheelchairAccess),
    String(village.activities.length),
    String(village.clickThroughs),
    village.whatsapp,
  ])

  downloadCsv('desaconnect_villages.csv', [header, ...rows])
}

function exportAuditLog(rows: { actorId: string; action: string; timestamp: string; targetEn: string }[]) {
  const header = ['Actor', 'Action', 'Timestamp', 'Target']
  downloadCsv('desaconnect_audit_log.csv', [header, ...rows.map((entry) => [entry.actorId, entry.action, entry.timestamp, entry.targetEn])])
}

function exportReviewsCsv(allVillages: { id: number; name: string }[]) {
  const header = ['ID', 'Village ID', 'Village Name', 'Author', 'Rating', 'Review (EN)', 'Review (ID)', 'Date']
  const rows = reviews.map((review) => {
    const village = allVillages.find((v) => v.id === review.villageId)
    return [String(review.id), String(review.villageId), village?.name ?? '', review.author, String(review.rating), review.textEn, review.textId, review.date]
  })

  downloadCsv('desaconnect_reviews.csv', [header, ...rows])
}

export default function GovernanceDashboard() {
  const { lang } = useLang()
  const { villages, auditLog } = useVillages()

  const top5 = [...villages].sort((a, b) => b.clickThroughs - a.clickThroughs).slice(0, 5)
  const maxClicks = top5[0]?.clickThroughs ?? 1
  const avgAllRatings = reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : '-'

  return (
    <div className="dashboard">
      <h2>{tr('dashTitle', lang)}</h2>
      <p className="screen-desc">{tr('dashDesc', lang)}</p>

      <div className="stat-cards">
        <div className="stat-card"><div className="stat-value">49</div><div className="stat-label">{tr('totalActiveVillages' as TranslationKey, lang)}</div></div>
        <div className="stat-card"><div className="stat-value">7.834</div><div className="stat-label">{tr('totalVisitorClicks' as TranslationKey, lang)}</div></div>
        <div className="stat-card"><div className="stat-value">{villages.length}</div><div className="stat-label">{tr('registeredVillages' as TranslationKey, lang)}</div></div>
        <div className="stat-card"><div className="stat-value">186</div><div className="stat-label">{tr('totalFarmers' as TranslationKey, lang)}</div></div>
        <div className="stat-card"><div className="stat-value">423</div><div className="stat-label">{tr('totalClicksToday' as TranslationKey, lang)}</div></div>
        <div className="stat-card"><div className="stat-value">12</div><div className="stat-label">{tr('pendingSync' as TranslationKey, lang)}</div></div>
        <div className="stat-card"><div className="stat-value">{reviews.length}</div><div className="stat-label">{tr('reviews' as TranslationKey, lang)}</div></div>
        <div className="stat-card"><div className="stat-value">{avgAllRatings}</div><div className="stat-label">{tr('avgRating' as TranslationKey, lang)}</div></div>
      </div>

      <div className="export-section">
        <h3>{lang === 'en' ? 'Export Data' : 'Ekspor Data'}</h3>
        <div className="export-buttons">
          <button className="btn-primary export-btn" onClick={() => exportVillagesCsv(villages)}>{tr('exportVillagesCsv' as TranslationKey, lang)}</button>
          <button className="btn-primary export-btn" onClick={() => exportAuditLog(auditLog)}>{tr('exportAuditCsv' as TranslationKey, lang)}</button>
          <button className="btn-primary export-btn" onClick={() => exportReviewsCsv(villages)}>{tr('exportReviewsCsv' as TranslationKey, lang)}</button>
        </div>
      </div>

      <div className="chart-section">
        <h3>{tr('clicksPerVillage' as TranslationKey, lang)}</h3>
        <div className="bar-chart">
          {top5.map((village) => (
            <div key={village.id} className="bar-row">
              <span className="bar-label" title={village.name}>{village.name.replace('Desa Wisata ', '')}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(village.clickThroughs / maxClicks) * 100}%` }}>{village.clickThroughs}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="table-section">
        <h3>{tr('recentAuditLog' as TranslationKey, lang)}</h3>
        <table className="audit-table">
          <thead>
            <tr>
              <th>{tr('actor' as TranslationKey, lang)}</th>
              <th>{tr('action' as TranslationKey, lang)}</th>
              <th>{tr('timestamp' as TranslationKey, lang)}</th>
              <th>{tr('target' as TranslationKey, lang)}</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.map((entry, i) => (
              <tr key={i}>
                <td><code>{entry.actorId}</code></td>
                <td>{entry.action}</td>
                <td>{entry.timestamp}</td>
                <td>{getTarget(entry, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
