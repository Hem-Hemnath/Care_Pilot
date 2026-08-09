import React from "react";
import { Settings, Sun, Moon, Monitor, Globe } from "lucide-react";
import { useApp } from "../hooks/useApp";
import { t } from "../i18n";
import type { Language, Theme } from "../types";
import { DatasetLoader } from "../components/DatasetLoader";

interface SettingRowProps {
  label: string;
  children: React.ReactNode;
}
function SettingRow({ label, children }: SettingRowProps) {
  return (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <div className="setting-control">{children}</div>
    </div>
  );
}

interface RadioGroupProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}
function RadioGroup({ options, value, onChange, name }: RadioGroupProps) {
  return (
    <div className="radio-group" role="radiogroup" aria-label={name}>
      {options.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={value === opt.value}
          className={`radio-btn ${value === opt.value ? "active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const { uiLang, setUiLang, theme, setTheme } = useApp();

  const langOptions = [
    { value: "en", label: "English", icon: <Globe size={14} /> },
    { value: "ta", label: "தமிழ்", icon: <Globe size={14} /> },
  ];

  const themeOptions = [
    { value: "light", label: t("light", uiLang), icon: <Sun size={14} /> },
    { value: "dark", label: t("dark", uiLang), icon: <Moon size={14} /> },
    { value: "system", label: t("system", uiLang), icon: <Monitor size={14} /> },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <Settings size={24} style={{ color: "var(--accent)" }} />
        <h1 className="settings-title">{t("settingsTitle", uiLang)}</h1>
      </div>

      <div className="settings-card">
        <h2 className="settings-section-title">{t("language", uiLang)}</h2>
        <SettingRow label="UI Language">
          <RadioGroup
            name="language"
            options={langOptions}
            value={uiLang}
            onChange={(v) => setUiLang(v as Language)}
          />
        </SettingRow>
      </div>

      <div className="settings-card">
        <h2 className="settings-section-title">{t("theme", uiLang)}</h2>
        <SettingRow label="Appearance">
          <RadioGroup
            name="theme"
            options={themeOptions}
            value={theme}
            onChange={(v) => setTheme(v as Theme)}
          />
        </SettingRow>
      </div>

      <div className="settings-card">
        <h2 className="settings-section-title">Medicine Dataset</h2>
        <SettingRow label="Dataset Status">
          <DatasetLoader />
        </SettingRow>
      </div>

      <div className="settings-card">
        <h2 className="settings-section-title">About</h2>
        <div className="about-text">
          <p><strong>CarePilot</strong> v1.0.0</p>
          <p>AI-powered medicine information assistant.</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "8px" }}>
            {t("disclaimer", uiLang)}
          </p>
        </div>
      </div>

      <style>{`
        .settings-page { max-width: 680px; margin: 0 auto; padding: 24px 20px 100px; display: flex; flex-direction: column; gap: 16px; }
        .settings-header { display: flex; align-items: center; gap: 10px; }
        .settings-title { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); }
        .settings-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; box-shadow: var(--shadow); }
        .settings-section-title { font-size: 0.8rem; font-weight: 600; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px; }
        .setting-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .setting-label { font-size: 0.9rem; color: var(--text-secondary); font-weight: 500; }
        .setting-control { display: flex; align-items: center; }
        .radio-group { display: flex; gap: 6px; flex-wrap: wrap; }
        .radio-btn { display: flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-secondary); font-family: inherit; font-size: 0.82rem; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: all 0.18s; }
        .radio-btn:hover { border-color: var(--accent); color: var(--accent); }
        .radio-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
        .about-text { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; display: flex; flex-direction: column; gap: 4px; }
        @media (max-width: 480px) { .settings-page { padding: 16px 12px 80px; } .setting-row { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </div>
  );
}

