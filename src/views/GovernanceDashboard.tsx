import { villages, auditLog } from '../data/mockData'
import { useLang } from '../components/LangProvider'
import { tr, type Lang } from '../data/i18n'

function getTarget(entry: { targetId: string; targetEn: string }, lang: Lang) {
  return lang === 'en' ? entry.targetEn : entry.targetId
}

export default function GovernanceDashboard() {
  const { lang } = useLang()

  const top5 = [...villages]
    .sort((a, b) => b.clickThroughs - a.clickThroughs)
    .slice(0, 5)

  const maxClicks = top5[0]?.clickThroughs ?? 1

  return (
    <div className="dashboard">
      <h2>{tr('dashTitle', lang)}</h2>
      <p className="screen-desc">{tr('dashDesc', lang)}</p>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-value">49</div>
          <div className="stat-label">{tr('totalActiveVillages', lang)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">7.834</div>
          <div className="stat-label">{tr('totalVisitorClicks', lang)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{villages.length}</div>
          <div className="stat-label">{tr('registeredVillages', lang)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">186</div>
          <div className="stat-label">{tr('totalFarmers', lang)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">423</div>
          <div className="stat-label">{tr('totalClicksToday', lang)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">12</div>
          <div className="stat-label">{tr('pendingSync', lang)}</div>
        </div>
      </div>

      <div className="chart-section">
        <h3>{tr('clicksPerVillage', lang)}</h3>
        <div className="bar-chart">
          {top5.map((v) => (
            <div key={v.id} className="bar-row">
              <span className="bar-label" title={v.name}>
                {v.name.replace('Desa Wisata ', '')}
              </span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(v.clickThroughs / maxClicks) * 100}%` }}
                >
                  {v.clickThroughs}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="table-section">
        <h3>{tr('recentAuditLog', lang)}</h3>
        <table className="audit-table">
          <thead>
            <tr>
              <th>{tr('actor', lang)}</th>
              <th>{tr('action', lang)}</th>
              <th>{tr('timestamp', lang)}</th>
              <th>{tr('target', lang)}</th>
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
