import { useState, useRef, useEffect, type ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface GlassDropdownOption<T extends string = string> {
  value: T
  label: string
  icon?: ReactNode
  description?: string
}

interface GlassDropdownProps<T extends string = string> {
  options: GlassDropdownOption<T>[]
  value: T
  onChange: (value: T) => void
  label?: string
  placeholder?: string
  icon?: ReactNode
  className?: string
}

export function GlassDropdown<T extends string = string>({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select option...',
  icon,
  className = '',
}: GlassDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className={`glass-dropdown-root ${className}`} ref={containerRef}>
      {label && <label className="glass-dropdown-label">{label}</label>}
      <button
        type="button"
        className={`glass-dropdown-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {icon && <span className="trigger-icon">{icon}</span>}
        <span className="trigger-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`chevron-icon ${open ? 'rotated' : ''}`} />
      </button>

      {open && (
        <div className="glass-dropdown-menu" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <div
                key={opt.value}
                className={`glass-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                role="option"
                aria-selected={isSelected}
              >
                {opt.icon && <span className="item-icon">{opt.icon}</span>}
                <div className="item-content">
                  <span className="item-label">{opt.label}</span>
                  {opt.description && <span className="item-desc">{opt.description}</span>}
                </div>
                {isSelected && <Check size={14} className="check-icon" />}
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .glass-dropdown-root { position: relative; display: inline-flex; flex-direction: column; gap: 4px; }
        .glass-dropdown-label { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
        .glass-dropdown-trigger {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 12px;
          background: var(--surface); border: 1.5px solid var(--border);
          color: var(--text-primary); font-family: inherit; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 14px rgba(0,0,0,0.05); outline: none;
        }
        .glass-dropdown-trigger:hover, .glass-dropdown-trigger.open {
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(14,165,233,0.15);
        }
        .trigger-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chevron-icon { transition: transform 0.2s ease; margin-left: auto; color: var(--text-muted); }
        .chevron-icon.rotated { transform: rotate(180deg); color: var(--accent); }
        .glass-dropdown-menu {
          position: absolute; top: calc(100% + 6px); left: 0; min-width: 200px; max-height: 280px; overflow-y: auto; z-index: 300;
          background: var(--surface); border: 1.5px solid var(--border); border-radius: 16px;
          padding: 6px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.05);
          animation: dropdownPop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .glass-dropdown-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
          cursor: pointer; transition: all 0.15s ease; color: var(--text-primary); font-size: 0.84rem;
        }
        .glass-dropdown-item:hover {
          background: var(--surface-secondary); color: var(--accent); transform: translateX(3px);
        }
        .glass-dropdown-item.selected {
          background: rgba(14,165,233,0.12); color: var(--accent); font-weight: 700;
        }
        .item-content { display: flex; flex-direction: column; gap: 2px; }
        .item-desc { font-size: 0.72rem; color: var(--text-muted); font-weight: 400; }
        .check-icon { margin-left: auto; color: var(--accent); }
        @keyframes dropdownPop {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
