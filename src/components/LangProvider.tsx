import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Lang } from '../data/i18n'

interface LangCtx {
  lang: Lang
  toggleLang: () => void
}

const LangContext = createContext<LangCtx>({ lang: 'id', toggleLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('id')
  const toggleLang = () => setLang((l) => (l === 'id' ? 'en' : 'id'))
  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  return useContext(LangContext)
}
