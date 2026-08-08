import { useRef } from 'react'
import { Upload, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { importDatasetFromFile, getMedicineCount } from '../dataset/medicineService'

export function DatasetLoader() {
  const { uiLang, datasetStatus, datasetCount, datasetError, setDatasetStatus, setDatasetCount, setDatasetError } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) { setDatasetError('Please upload an XLSX, XLS, or CSV file.'); return }
    setDatasetStatus('loading')
    setDatasetError(null)
    try {
      const count = await importDatasetFromFile(file)
      setDatasetCount(count)
      setDatasetStatus('loaded')
    } catch (err) {
      setDatasetError(String(err))
      setDatasetStatus('error')
    }
  }

  if (datasetStatus === 'loaded') {
    return (
      <div className="dl-status loaded" role="status">
        <CheckCircle size={15} />
        <span>{t('medicineCount', uiLang, { count: datasetCount.toLocaleString() })}</span>
        <button className="dl-reload-btn" onClick={() => fileRef.current?.click()} title="Replace dataset" aria-label="Replace dataset">
          <RefreshCw size={12} />
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      </div>
    )
  }

  return (
    <div className="dl-wrap">
      {datasetStatus === 'loading' && (
        <div className="dl-status loading" role="status" aria-live="polite">
          <Loader size={15} className="dl-spin" />
          <span>{t('loadingDataset', uiLang)}</span>
        </div>
      )}
      {datasetStatus === 'error' && (
        <div className="dl-status error" role="alert">
          <AlertCircle size={15} />
          <span>{datasetError || t('datasetError', uiLang)}</span>
        </div>
      )}
      {(datasetStatus === 'idle' || datasetStatus === 'error') && (
        <label className="dl-upload-btn">
          <Upload size={15} />
          <span>{t('datasetLoadBtn', uiLang)}</span>
          <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
        </label>
      )}
      <style>{`
        .dl-wrap { display:flex;flex-direction:column;gap:8px; }
        .dl-status { display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:0.77rem;font-weight:500; }
        .dl-status.loaded { background:rgba(16,185,129,0.1);color:var(--success);border:1px solid rgba(16,185,129,0.2); }
        .dl-status.loading { background:rgba(14,165,233,0.1);color:var(--accent); }
        .dl-status.error { background:rgba(239,68,68,0.1);color:var(--danger); }
        .dl-reload-btn { background:none;border:none;cursor:pointer;color:var(--success);display:flex;align-items:center; }
        .dl-upload-btn { display:inline-flex;align-items:center;gap:7px;padding:8px 14px;background:var(--surface);border:2px dashed var(--border);border-radius:10px;cursor:pointer;font-size:0.8rem;font-weight:500;color:var(--text-secondary);transition:all 0.18s; }
        .dl-upload-btn:hover { border-color:var(--accent);color:var(--accent);background:rgba(14,165,233,0.04); }
        .dl-spin { animation:dlSpin 1s linear infinite; }
        @keyframes dlSpin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  )
}
