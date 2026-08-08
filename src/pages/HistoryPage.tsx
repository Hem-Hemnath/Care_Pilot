import React from "react";
import { History, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { useApp } from "../hooks/useApp";
import { t } from "../i18n";
import { MedicineProfile } from "../components/MedicineProfile";
import type { HistoryEntry } from "../types";

export function HistoryPage() {
  const { uiLang, history, clearHistory } = useApp();
  const [selected, setSelected] = React.useState<HistoryEntry | null>(null);

  if (selected) {
    return (
      <div className="history-page">
        <button className="back-btn" onClick={() => setSelected(null)}>
          {t("backToScanner", uiLang)}
        </button>
        {selected.result.medicine && (
          <MedicineProfile
            medicine={selected.result.medicine}
            verified={selected.verified}
            source={selected.result.source}
          />
        )}
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <History size={24} style={{ color: "var(--accent)" }} />
          <h1 className="history-title">{t("history", uiLang)}</h1>
        </div>
        {history.length > 0 && (
          <button className="clear-btn" onClick={clearHistory} aria-label={t("clearHistory", uiLang)}>
            <Trash2 size={14} />
            {t("clearHistory", uiLang)}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="history-empty">
          <History size={48} style={{ color: "var(--text-muted)" }} />
          <p>{t("historyEmpty", uiLang)}</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((entry) => (
            <button
              key={entry.id}
              className="history-item"
              onClick={() => setSelected(entry)}
              aria-label={`View ${entry.medicineName}`}
            >
              {entry.thumbnailUrl ? (
                <img src={entry.thumbnailUrl} alt="" className="history-thumb" />
              ) : (
                <div className="history-thumb-placeholder">
                  <History size={20} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              <div className="history-item-info">
                <div className="history-item-name">{entry.medicineName}</div>
                <div className="history-item-meta">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="history-item-badge">
                {entry.verified ? (
                  <span className="verified-badge">
                    <CheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span className="unverified-badge">
                    <AlertTriangle size={12} /> AI
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <style>{`
        .history-page { max-width: 720px; margin: 0 auto; padding: 24px 20px 100px; display: flex; flex-direction: column; gap: 20px; }
        .history-header { display: flex; align-items: center; justify-content: space-between; }
        .history-title { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); }
        .clear-btn { display: flex; align-items: center; gap: 6px; padding: 7px 14px; background: var(--surface-secondary); border: 1px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 0.8rem; cursor: pointer; color: var(--danger); transition: all 0.18s; }
        .clear-btn:hover { background: rgba(239,68,68,0.08); }
        .history-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: var(--text-muted); text-align: center; }
        .history-list { display: flex; flex-direction: column; gap: 10px; }
        .history-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; cursor: pointer; text-align: left; width: 100%; transition: all 0.18s; box-shadow: var(--shadow); }
        .history-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: var(--accent); }
        .history-item:active { transform: scale(0.98); }
        .history-thumb { width: 52px; height: 52px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
        .history-thumb-placeholder { width: 52px; height: 52px; border-radius: 8px; background: var(--surface-secondary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .history-item-info { flex: 1; min-width: 0; }
        .history-item-name { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .history-item-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
        .history-item-badge { flex-shrink: 0; }
        .verified-badge, .unverified-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 0.7rem; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
        .verified-badge { background: rgba(16,185,129,0.1); color: var(--success); }
        .unverified-badge { background: rgba(245,158,11,0.1); color: var(--warning); }
        .back-btn { align-self: flex-start; padding: 8px 16px; background: var(--surface-secondary); border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; color: var(--text-secondary); cursor: pointer; font-family: inherit; transition: all 0.18s; }
        .back-btn:hover { color: var(--accent); border-color: var(--accent); }
        @media (max-width: 480px) { .history-page { padding: 16px 12px 80px; } }
      `}</style>
    </div>
  );
}

