import { useState } from 'react'
import { LangProvider, useLang } from './components/LangProvider'
import { VillagesProvider } from './components/VillagesProvider'
import { PlotsProvider } from './components/PlotsProvider'
import { tr } from './data/i18n'
import VisitorMapView from './views/VisitorMapView'
import PokdarwisEditor from './views/PokdarwisEditor'
import FarmerPlotRegistration from './views/FarmerPlotRegistration'
import GovernanceDashboard from './views/GovernanceDashboard'

export type Role = 'Visitor' | 'Pokdarwis' | 'Farmer' | 'Officer'

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

function AppInner() {
  const [role, setRole] = useState<Role>('Visitor')
  const { lang, toggleLang } = useLang()

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
              </button>
            ))}
          </div>
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
