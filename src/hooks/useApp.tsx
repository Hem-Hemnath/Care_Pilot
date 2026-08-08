import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Language, Theme, HistoryEntry, AnalysisResult, DatasetStatus } from '../types'
import { applyTheme } from '../theme'
import { loadPersistedDataset } from '../dataset/medicineService'

interface AppContextValue {
  uiLang: Language; setUiLang: (lang: Language) => void
  theme: Theme; setTheme: (theme: Theme) => void
  datasetStatus: DatasetStatus; datasetCount: number; datasetError: string | null
  setDatasetStatus: (s: DatasetStatus) => void
  setDatasetCount: (n: number) => void
  setDatasetError: (e: string | null) => void
  history: HistoryEntry[]; addHistory: (e: HistoryEntry) => void; clearHistory: () => void
  currentResult: AnalysisResult | null; setCurrentResult: (r: AnalysisResult | null) => void
  currentImageUrl: string | null; setCurrentImageUrl: (u: string | null) => void
  isOnline: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [uiLang, setUiLangState] = useState<Language>(() => (localStorage.getItem('cp_lang') as Language) || 'en')
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('cp_theme') as Theme) || 'system')
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus>('idle')
  const [datasetCount, setDatasetCount] = useState(0)
  const [datasetError, setDatasetError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const s = localStorage.getItem('cp_history')
      if (s) return JSON.parse(s).map((h: HistoryEntry) => ({ ...h, timestamp: new Date(h.timestamp) }))
    } catch { /* ignore */ }
    return []
  })
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Theme
  useEffect(() => {
    applyTheme(theme); localStorage.setItem('cp_theme', theme)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = () => { if (theme === 'system') applyTheme('system') }
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [theme])

  // Online detection
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Auto-load persisted dataset on start
  useEffect(() => {
    setDatasetStatus('loading')
    loadPersistedDataset().then((count) => {
      if (count > 0) { setDatasetCount(count); setDatasetStatus('loaded') }
      else setDatasetStatus('idle')
    }).catch(() => setDatasetStatus('idle'))
  }, [])

  const setUiLang = useCallback((lang: Language) => { setUiLangState(lang); localStorage.setItem('cp_lang', lang) }, [])
  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const addHistory = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 50)
      localStorage.setItem('cp_history', JSON.stringify(updated))
      return updated
    })
  }, [])
  const clearHistory = useCallback(() => { setHistory([]); localStorage.removeItem('cp_history') }, [])

  return (
    <AppContext.Provider value={{
      uiLang, setUiLang, theme, setTheme,
      datasetStatus, datasetCount, datasetError,
      setDatasetStatus, setDatasetCount, setDatasetError,
      history, addHistory, clearHistory,
      currentResult, setCurrentResult, currentImageUrl, setCurrentImageUrl,
      isOnline,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
