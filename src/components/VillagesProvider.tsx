import { createContext, useContext, useState, type ReactNode } from 'react'
import { villages as initialVillages, auditLog as initialAuditLog, type AuditEntry, type Village } from '../data/mockData'

export interface PendingVillageAction {
  type: 'update' | 'add'
  villageId?: number
  village?: Village
  changes?: Partial<Village>
  auditEntries: Array<Omit<AuditEntry, 'timestamp'>>
}

interface VillagesCtx {
  villages: Village[]
  auditLog: AuditEntry[]
  nextId: number
  pendingVillageActions: PendingVillageAction[]
  offlineMode: boolean
  addVillage: (village: Village) => void
  removeVillage: (id: number) => void
  updateVillage: (id: number, changes: Partial<Village>) => void
  addAuditEntry: (entry: Omit<AuditEntry, 'timestamp'>) => void
  addPendingVillageAction: (action: PendingVillageAction) => void
  syncPendingVillageActions: () => void
  setOfflineMode: (offline: boolean) => void
}

const VillagesContext = createContext<VillagesCtx>({
  villages: initialVillages,
  auditLog: initialAuditLog,
  nextId: initialVillages.length + 1,
  pendingVillageActions: [],
  offlineMode: false,
  addVillage: () => {},
  removeVillage: () => {},
  updateVillage: () => {},
  addAuditEntry: () => {},
  addPendingVillageAction: () => {},
  syncPendingVillageActions: () => {},
  setOfflineMode: () => {},
})

function makeTimestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function VillagesProvider({ children }: { children: ReactNode }) {
  const [villages, setVillages] = useState<Village[]>(initialVillages)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(initialAuditLog)
  const [pendingVillageActions, setPendingVillageActions] = useState<PendingVillageAction[]>([])
  const [offlineMode, setOfflineMode] = useState(false)
  const nextId = villages.reduce((max, village) => Math.max(max, village.id), 0) + 1

  const addVillage = (village: Village) => {
    setVillages((prev) => [...prev, village])
  }

  const removeVillage = (id: number) => {
    setVillages((prev) => prev.filter((village) => village.id !== id))
  }

  const updateVillage = (id: number, changes: Partial<Village>) => {
    setVillages((prev) => prev.map((village) => (village.id === id ? { ...village, ...changes } : village)))
  }

  const addAuditEntry = (entry: Omit<AuditEntry, 'timestamp'>) => {
    setAuditLog((prev) => [{ ...entry, timestamp: makeTimestamp() }, ...prev])
  }

  const addPendingVillageAction = (action: PendingVillageAction) => {
    setPendingVillageActions((prev) => [...prev, action])
  }

  const syncPendingVillageActions = () => {
      const newAuditEntries: AuditEntry[] = []
    setPendingVillageActions((prev) => {
      if (prev.length === 0) return []
      setVillages((vs) => {
        let updated = vs
        for (const action of prev) {
          if (action.type === 'update' && action.villageId && action.changes) {
            updated = updated.map((v) => (v.id === action.villageId ? { ...v, ...action.changes } : v))
          }
          if (action.type === 'add' && action.village) {
            if (!updated.some((v) => v.id === action.village!.id)) {
              updated = [...updated, action.village]
            }
          }
          for (const entry of action.auditEntries) {
            newAuditEntries.push({ ...entry, timestamp: makeTimestamp() })
          }
        }
        return updated
      })
      if (newAuditEntries.length > 0) {
        setAuditLog((al) => [...newAuditEntries, ...al])
      }
      return []
    })
  }

  return (
    <VillagesContext.Provider value={{ villages, auditLog, nextId, pendingVillageActions, offlineMode, addVillage, removeVillage, updateVillage, addAuditEntry, addPendingVillageAction, syncPendingVillageActions, setOfflineMode }}>
      {children}
    </VillagesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVillages() {
  return useContext(VillagesContext)
}
