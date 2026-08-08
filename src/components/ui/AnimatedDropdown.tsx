import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface AnimatedDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
  id?: string
  iconOnly?: boolean
  triggerIcon?: React.ReactNode
  align?: 'left' | 'right'
}

export function AnimatedDropdown({
  options, value, onChange, label, className = '', id,
  iconOnly = false, triggerIcon, align = 'right',
}: AnimatedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { setIsOpen(false); return }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!isOpen) { setIsOpen(true); setFocusIndex(0); return }
      if (focusIndex >= 0) { onChange(options[focusIndex].value); setIsOpen(false) }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!isOpen) { setIsOpen(true); setFocusIndex(0); return } setFocusIndex((i) => Math.min(i + 1, options.length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIndex((i) => Math.max(i - 1, 0)); return }
  }

  function selectOption(val: string) { onChange(val); setIsOpen(false); setFocusIndex(-1) }

  return (
    <div className={`dd-wrap align-${align} ${className}`} ref={containerRef}>
      {label && !iconOnly && <label htmlFor={id} className="dd-label">{label}</label>}

      <button
        id={id}
        type="button"
        className={iconOnly ? 'dd-icon-trigger' : 'dd-trigger'}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => { setIsOpen((v) => !v); setFocusIndex(0) }}
        onKeyDown={handleKeyDown}
        title={selectedOption?.label}
      >
        {iconOnly ? (
          triggerIcon || selectedOption?.icon
        ) : (
          <>
            <span className="dd-selected">
              {selectedOption?.icon && <span className="dd-sel-icon">{selectedOption.icon}</span>}
              {selectedOption?.label}
            </span>
            <ChevronDown size={14} className={`dd-arrow ${isOpen ? 'open' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div role="listbox" aria-label={label} className="dd-menu">
          {options.map((opt, idx) => (
            <button
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              tabIndex={0}
              onClick={() => selectOption(opt.value)}
              className={`dd-option ${value === opt.value ? 'selected' : ''} ${focusIndex === idx ? 'focused' : ''}`}
              onMouseEnter={() => setFocusIndex(idx)}
            >
              {opt.icon && <span className="dd-opt-icon">{opt.icon}</span>}
              {opt.label}
              {value === opt.value && <span className="dd-check">✓</span>}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .dd-wrap { position: relative; display: inline-block; }
        .dd-label { display: block; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 3px; }
        .dd-trigger {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 12px; background: var(--surface-elevated);
          border: 1px solid var(--border); border-radius: 10px;
          color: var(--text-primary); font-size: 0.83rem; font-weight: 500;
          cursor: pointer; box-shadow: var(--shadow);
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
          white-space: nowrap; min-width: 110px; justify-content: space-between;
        }
        .dd-trigger:hover { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(14,165,233,0.1); transform: translateY(-1px); }
        .dd-icon-trigger {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 8px;
          background: var(--surface-secondary); border: 1px solid var(--border);
          color: var(--text-secondary); cursor: pointer;
          transition: all 0.15s ease;
        }
        .dd-icon-trigger:hover { background: var(--border); color: var(--accent); }
        .dd-selected { display: flex; align-items: center; gap: 5px; }
        .dd-arrow { color: var(--text-muted); transition: transform 0.2s ease; }
        .dd-arrow.open { transform: rotate(180deg); }
        .dd-menu {
          position: absolute; top: calc(100% + 6px);
          min-width: 150px; background: var(--surface-elevated);
          border: 1px solid var(--border); border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08);
          padding: 5px; z-index: 1000;
          animation: ddOpen 0.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .dd-wrap.align-right .dd-menu { right: 0; left: auto; }
        .dd-wrap.align-left .dd-menu { left: 0; right: auto; }
        @keyframes ddOpen {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dd-option {
          display: flex; align-items: center; gap: 7px; width: 100%;
          padding: 8px 11px; background: transparent; border: none;
          border-radius: 8px; color: var(--text-primary); font-size: 0.83rem;
          font-weight: 400; cursor: pointer; text-align: left;
          transition: background 0.12s, transform 0.12s;
        }
        .dd-option:hover, .dd-option.focused { background: var(--surface-secondary); transform: translateY(-1px); }
        .dd-option.selected { color: var(--accent); font-weight: 600; }
        .dd-opt-icon { display: flex; align-items: center; }
        .dd-sel-icon { display: flex; align-items: center; }
        .dd-check { margin-left: auto; color: var(--accent); font-size: 0.8rem; }
        @media (prefers-reduced-motion: reduce) {
          .dd-menu { animation: none; }
          .dd-trigger, .dd-option, .dd-icon-trigger { transition: none; }
          .dd-arrow { transition: none; }
        }
      `}</style>
    </div>
  )
}
