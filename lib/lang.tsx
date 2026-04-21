'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Lang } from './translations'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
}

const LangContext = createContext<LangContextType>({
  lang: 'sk',
  setLang: () => {},
  toggle: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('sk')
  const toggle = () => setLang((l) => (l === 'sk' ? 'en' : 'sk'))
  return (
    <LangContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
