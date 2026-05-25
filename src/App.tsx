import { useEffect, useState } from 'react'
import { LangProvider, useLang } from './components/LangProvider'
import { VillagesProvider, useVillages } from './components/VillagesProvider'
import { PlotsProvider } from './components/PlotsProvider'
import { tr, type Lang } from './data/i18n'
import VisitorMapView from './views/VisitorMapView'
import PokdarwisEditor from './views/PokdarwisEditor'
import FarmerPlotRegistration from './views/FarmerPlotRegistration'
import GovernanceDashboard from './views/GovernanceDashboard'

export type Role = 'Visitor' | 'Pokdarwis' | 'Farmer' | 'Officer'

export { useSlowNetwork }

const roles: Role[] = ['Visitor', 'Pokdarwis', 'Farmer', 'Officer']

const roleKeys = {
  Visitor: 'roleVisitor' as const,
  Pokdarwis: 'rolePokdarwis' as const,
  Farmer: 'roleFarmer' as const,
  Officer: 'roleOfficer' as const,
}

const roleDescKeys = {
  Visitor: 'roleDescVisitor' as const,
  Pokdarwis: 'roleDescPokdarwis' as const,
  Farmer: 'roleDescFarmer' as const,
  Officer: 'roleDescOfficer' as const,
}

interface NetworkInfo {
  effectiveType?: string
  downlink?: number
  saveData?: boolean
  addEventListener?: (type: string, fn: () => void) => void
  removeEventListener?: (type: string, fn: () => void) => void
}

let _simulatedSlow = false
const _listeners = new Set<() => void>()

function useSlowNetwork() {
  const [isSlow, setIsSlow] = useState(false)
  const [simulated, setSimulated] = useState(_simulatedSlow)

  useEffect(() => {
    const nav = navigator as { connection?: NetworkInfo }
    const conn = nav.connection
    if (!conn) return

    const check = () => {
      if (_simulatedSlow) return
      const type = conn.effectiveType
      setIsSlow(type === '2g' || type === 'slow-2g' || (conn.downlink !== undefined && conn.downlink < 1))
    }

    check()
    if (conn.addEventListener) {
      const handler = () => check()
      conn.addEventListener('change', handler)
      return () => conn.removeEventListener?.('change', handler)
    }
  }, [simulated])

  useEffect(() => {
    const sync = () => setSimulated(_simulatedSlow)
    _listeners.add(sync)
    return () => { _listeners.delete(sync) }
  }, [])

  const toggleSimulate = () => {
    _simulatedSlow = !_simulatedSlow
    _listeners.forEach((fn) => fn())
  }

  return {
    isSlow: isSlow || simulated,
    simulated,
    toggleSimulate,
  }
}

function NetworkIndicator({ lang }: { lang: Lang }) {
  const { isSlow } = useSlowNetwork()

  if (!isSlow) return null

  return (
    <div className="network-indicator" role="status" aria-live="polite">
      <span className="network-indicator-dot" />
      <span className="network-indicator-text">{tr('slowNetwork', lang)}</span>
      <span className="network-indicator-short">Slow</span>
    </div>
  )
}

function AppInner() {
  const [role, setRole] = useState<Role>('Visitor')
  const { lang, toggleLang } = useLang()
  const { pendingVillageActions } = useVillages()
  const pendingCount = pendingVillageActions.length

  return (
    <>
      <header className="app-header">
        <h1 className="app-title">
          <img src="/logo.jpg" alt="" style={{ height: 32, marginRight: 8, verticalAlign: 'middle', borderRadius: 4 }} />
          DesaConnect
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="lang-btn" onClick={toggleLang} title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}>
            {lang === 'id' ? 'EN' : 'ID'}
          </button>
          <div className="role-switcher">
            {roles.map((r) => (
              <button
                key={r}
                className={`role-btn ${role === r ? 'active' : ''}`}
                onClick={() => setRole(r)}
              >
                {tr(roleKeys[r], lang)}
                {r === 'Pokdarwis' && pendingCount > 0 && (
                  <span className="pending-badge">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
          <NetworkIndicator lang={lang} />
        </div>
      </header>
      <div className="subtitle-bar">
        <span>{tr('appSubtitle', lang)}</span>
        {lang === 'en' && (
          <span className="subtitle-role">{tr(roleDescKeys[role], lang)}</span>
        )}
      </div>
      <div className="app-body">
        {role === 'Visitor' && <VisitorMapView />}
        {role === 'Pokdarwis' && <PokdarwisEditor />}
        {role === 'Farmer' && <FarmerPlotRegistration />}
        {role === 'Officer' && <GovernanceDashboard />}
      </div>
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <VillagesProvider>
        <PlotsProvider>
          <AppInner />
        </PlotsProvider>
      </VillagesProvider>
    </LangProvider>
  )
}
