import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Search, BookOpen, Loader, AlertCircle, RefreshCw, ArrowLeft, Pill } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { MedicineCard } from '../components/MedicineCard'
import { MedicineProfile } from '../components/MedicineProfile'
import { DatasetLoader } from '../components/DatasetLoader'
import { searchMedicines } from '../dataset/medicineService'
import type { MedicineRecord } from '../types'

const PAGE_SIZE = 30

export function LibraryPage() {
  const { uiLang, datasetStatus, datasetCount } = useApp()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selected, setSelected] = useState<MedicineRecord | null>(null)
  const [page, setPage] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce input — 150ms is enough for in-memory search
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val)
      setPage(1)
    }, 150)
  }, [])

  // Reset page when debounced query changes
  useEffect(() => { setPage(1) }, [debouncedQuery])

  // Ranked search results
  const results = useMemo(() => {
    if (datasetStatus !== 'loaded') return []
    return searchMedicines(debouncedQuery, PAGE_SIZE * page)
  }, [debouncedQuery, datasetStatus, page])

  // Total count for "load more" button
  const totalCount = useMemo(() => {
    if (datasetStatus !== 'loaded') return 0
    return searchMedicines(debouncedQuery, 99999).length
  }, [debouncedQuery, datasetStatus])

  // Medicine detail view — preserve query state
  if (selected) {
    return (
      <div className="lp-root">
        <div className="lp-scroll">
          <button
            className="lp-back-btn"
            onClick={() => setSelected(null)}
            aria-label={t('backToLibrary', uiLang)}
          >
            <ArrowLeft size={15} />
            <span>{t('backToLibrary', uiLang)}</span>
          </button>
          <MedicineProfile medicine={selected} verified source="dataset" />
        </div>
      </div>
    )
  }

  const hasResults = results.length > 0
  const isSearching = debouncedQuery.trim().length > 0

  return (
    <div className="lp-root" ref={scrollRef}>
      <div className="lp-scroll">

        {/* Header */}
        <div className="lp-header">
          <div className="lp-title-row">
            <div className="lp-title-icon">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="lp-title">{t('verifiedLibrary', uiLang)}</h1>
              <p className="lp-subtitle">
                {datasetStatus === 'loaded'
                  ? t('medicineCount', uiLang, { count: datasetCount.toLocaleString() })
                  : t('librarySubtitle', uiLang)}
              </p>
            </div>
          </div>
          <DatasetLoader />
        </div>

        {/* Search box */}
        {datasetStatus === 'loaded' && (
          <div className="lp-search-wrap">
            <Search size={16} className="lp-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="lp-search"
              placeholder={t('searchMedicinesPlaceholder', uiLang)}
              value={query}
              onChange={handleQueryChange}
              aria-label={t('searchMedicinesPlaceholder', uiLang)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button
                className="lp-search-clear"
                onClick={() => { setQuery(''); setDebouncedQuery(''); setPage(1) }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* States */}
        {datasetStatus === 'loading' && (
          <div className="lp-status" role="status" aria-live="polite">
            <Loader size={22} className="lp-spin" />
            <span>{t('loadingDataset', uiLang)}</span>
          </div>
        )}

        {datasetStatus === 'error' && (
          <div className="lp-status lp-error" role="alert">
            <AlertCircle size={22} />
            <span>{t('datasetError', uiLang)}</span>
          </div>
        )}

        {datasetStatus === 'idle' && (
          <div className="lp-empty">
            <div className="lp-empty-icon">
              <Pill size={36} />
            </div>
            <p className="lp-empty-title">{t('noMedicinesYet', uiLang)}</p>
            <p className="lp-empty-sub">{t('loadDatasetPrompt', uiLang)}</p>
          </div>
        )}

        {/* No results */}
        {datasetStatus === 'loaded' && !hasResults && isSearching && (
          <div className="lp-empty">
            <div className="lp-empty-icon">
              <Search size={32} />
            </div>
            <p className="lp-empty-title">{t('noMedicinesFound', uiLang)}</p>
            <p className="lp-empty-sub">{t('noMatchDetail', uiLang)}</p>
          </div>
        )}

        {/* Search result count hint */}
        {datasetStatus === 'loaded' && hasResults && isSearching && (
          <p className="lp-result-hint" aria-live="polite">
            {totalCount} {totalCount === 1 ? 'result' : 'results'} for "{debouncedQuery}"
          </p>
        )}

        {/* Medicine grid */}
        {datasetStatus === 'loaded' && hasResults && (
          <>
            <div className="lp-grid">
              {results.map((med) => (
                <MedicineCard
                  key={med.id}
                  medicine={med}
                  onClick={setSelected}
                  verified
                />
              ))}
            </div>

            {results.length < totalCount && (
              <div className="lp-load-more">
                <button
                  className="lp-load-more-btn"
                  onClick={() => setPage((p) => p + 1)}
                  aria-label={`Load more medicines, ${totalCount - results.length} remaining`}
                >
                  <RefreshCw size={14} />
                  {t('loadMore', uiLang)} ({totalCount - results.length} more)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .lp-root {
          display: flex; flex-direction: column;
          max-width: 1100px; margin: 0 auto;
          width: 100%; height: calc(100dvh - 56px);
        }
        .lp-scroll {
          flex: 1; overflow-y: auto;
          padding: 24px 20px 100px;
          display: flex; flex-direction: column; gap: 20px;
        }

        /* ── Header ── */
        .lp-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }
        .lp-title-row { display: flex; align-items: flex-start; gap: 12px; }
        .lp-title-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(14,165,233,0.12);
          border: 1px solid rgba(14,165,233,0.2);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent); flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(14,165,233,0.12);
        }
        .lp-title {
          font-size: 1.4rem; font-weight: 700;
          color: var(--text-primary); line-height: 1.2;
        }
        .lp-subtitle { font-size: 0.8rem; color: var(--text-muted); margin-top: 3px; }

        /* ── Search box ── */
        .lp-search-wrap {
          position: relative; width: 100%;
          transition: all 0.2s ease;
        }
        .lp-search-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); color: var(--text-muted);
          pointer-events: none; transition: color 0.2s;
        }
        .lp-search-wrap:focus-within .lp-search-icon { color: var(--accent); }
        .lp-search {
          width: 100%;
          padding: 12px 38px 12px 42px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          font-family: inherit; font-size: 0.9rem;
          color: var(--text-primary); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);
        }
        .lp-search:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(14,165,233,0.12), inset 0 1px 3px rgba(0,0,0,0.04);
          background: var(--surface);
        }
        .lp-search::placeholder { color: var(--text-muted); }
        .lp-search-clear {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); font-size: 0.8rem;
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .lp-search-clear:hover { background: var(--border); color: var(--text-primary); }

        /* ── Status/empty states ── */
        .lp-status {
          display: flex; align-items: center; gap: 10px;
          padding: 20px; color: var(--text-secondary); font-size: 0.875rem;
        }
        .lp-status.lp-error { color: var(--danger); }
        .lp-spin { animation: lpSpin 1s linear infinite; }
        @keyframes lpSpin { to { transform: rotate(360deg); } }
        .lp-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 64px 20px; text-align: center;
        }
        .lp-empty-icon {
          width: 72px; height: 72px; border-radius: 20px;
          background: var(--surface-secondary);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted);
          box-shadow: var(--shadow);
        }
        .lp-empty-title {
          font-size: 0.95rem; font-weight: 600; color: var(--text-secondary);
        }
        .lp-empty-sub { font-size: 0.82rem; color: var(--text-muted); max-width: 280px; }

        /* ── Result hint ── */
        .lp-result-hint {
          font-size: 0.78rem; color: var(--text-muted);
          padding: 0 2px; margin-top: -8px;
        }

        /* ── Grid ── */
        .lp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 14px;
        }

        /* ── Back button ── */
        .lp-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-secondary);
          font-family: inherit; font-size: 0.82rem; font-weight: 500;
          color: var(--text-secondary); cursor: pointer;
          transition: all 0.2s ease; align-self: flex-start;
          box-shadow: var(--shadow);
        }
        .lp-back-btn:hover {
          color: var(--accent); border-color: var(--accent);
          transform: translateX(-3px);
          box-shadow: 0 2px 8px rgba(14,165,233,0.15);
        }

        /* ── Load more ── */
        .lp-load-more { display: flex; justify-content: center; }
        .lp-load-more-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 24px; border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface); color: var(--text-secondary);
          font-family: inherit; font-size: 0.875rem; cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow);
        }
        .lp-load-more-btn:hover {
          border-color: var(--accent); color: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14,165,233,0.12);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .lp-grid { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
        }
        @media (max-width: 480px) {
          .lp-scroll { padding: 16px 12px 80px; gap: 14px; }
          .lp-grid { grid-template-columns: 1fr; }
          .lp-title { font-size: 1.15rem; }
          .lp-header { gap: 10px; }
        }
        @media (max-width: 320px) {
          .lp-scroll { padding: 12px 10px 80px; }
        }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .lp-spin { animation: none; }
          .lp-back-btn, .lp-load-more-btn, .lp-search { transition: none; }
        }
      `}</style>
    </div>
  )
}
