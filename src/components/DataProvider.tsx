import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { initialVillages, initialAuditLog, type Village, type AuditEntry } from '../data/mockData'

interface DataContextType {
  villages: Village[]
  auditLog: AuditEntry[]
  updateVillage: (id: number, changes: Partial<Village>) => void
  addVillage: (v: Omit<Village, 'id' | 'clickThroughs'>) => Village
  addAuditEntry: (entry: Omit<AuditEntry, 'timestamp'>) => void
}

const DataContext = createContext<DataContextType | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextType {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

function makeTimestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [villages, setVillages] = useState<Village[]>(initialVillages)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(initialAuditLog)

  const updateVillage = useCallback((id: number, changes: Partial<Village>) => {
    setVillages(prev => prev.map(v => v.id === id ? { ...v, ...changes } : v))
  }, [])

  const addVillageFn = useCallback((v: Omit<Village, 'id' | 'clickThroughs'>): Village => {
    let newVillage!: Village
    setVillages(prev => {
      const id = prev.length > 0 ? Math.max(...prev.map(x => x.id)) + 1 : 1
      newVillage = { ...v, id, clickThroughs: 0 }
      return [...prev, newVillage]
    })
    return newVillage
  }, [])

  const addAuditEntry = useCallback((entry: Omit<AuditEntry, 'timestamp'>) => {
    setAuditLog(prev => [{ ...entry, timestamp: makeTimestamp() }, ...prev])
  }, [])

  return (
    <DataContext.Provider value={{ villages, auditLog, updateVillage, addVillage: addVillageFn, addAuditEntry }}>
      {children}
    </DataContext.Provider>
  )
}
