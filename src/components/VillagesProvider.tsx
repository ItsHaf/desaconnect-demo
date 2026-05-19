import { createContext, useContext, useState, type ReactNode } from 'react'
import { villages as initialVillages, auditLog as initialAuditLog, type AuditEntry, type Village } from '../data/mockData'

interface VillagesCtx {
  villages: Village[]
  auditLog: AuditEntry[]
  nextId: number
  addVillage: (village: Village) => void
  removeVillage: (id: number) => void
  updateVillage: (id: number, changes: Partial<Village>) => void
  addAuditEntry: (entry: Omit<AuditEntry, 'timestamp'>) => void
}

const VillagesContext = createContext<VillagesCtx>({
  villages: initialVillages,
  auditLog: initialAuditLog,
  nextId: initialVillages.length + 1,
  addVillage: () => {},
  removeVillage: () => {},
  updateVillage: () => {},
  addAuditEntry: () => {},
})

function makeTimestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function VillagesProvider({ children }: { children: ReactNode }) {
  const [villages, setVillages] = useState<Village[]>(initialVillages)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(initialAuditLog)

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

  return (
    <VillagesContext.Provider value={{ villages, auditLog, nextId, addVillage, removeVillage, updateVillage, addAuditEntry }}>
      {children}
    </VillagesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVillages() {
  return useContext(VillagesContext)
}
