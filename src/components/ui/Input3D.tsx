import React, { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

export interface Input3DProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  containerClassName?: string
}

export const Input3D = forwardRef<HTMLInputElement, Input3DProps>(
  ({ label, error, containerClassName = '', className = '', ...props }, ref) => {
    return (
      <div
        className={`input-3d-wrapper ${containerClassName}`}
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>}
        <div className="relative transform-gpu transition-all duration-300 ease-out">
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 rounded-xl
              border border-slate-300 dark:border-slate-800
              bg-white/80 dark:bg-slate-900/80
              text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-500
              shadow-inner outline-none
              transition-all duration-300 ease-out transform-gpu
              hover:-translate-y-0.5 hover:scale-[1.01] hover:border-teal-500/50 hover:shadow-[0_8px_20px_-6px_rgba(20,184,166,0.25)]
              focus:-translate-y-1 focus:scale-[1.015] focus:border-teal-400 focus:shadow-[0_12px_28px_-4px_rgba(20,184,166,0.35)] focus:ring-2 focus:ring-teal-400/20
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
      </div>
    )
  }
)

Input3D.displayName = 'Input3D'

export interface Textarea3DProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  containerClassName?: string
}

export const Textarea3D = forwardRef<HTMLTextAreaElement, Textarea3DProps>(
  ({ label, error, containerClassName = '', className = '', ...props }, ref) => {
    return (
      <div
        className={`textarea-3d-wrapper ${containerClassName}`}
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>}
        <div className="relative transform-gpu transition-all duration-300 ease-out">
          <textarea
            ref={ref}
            className={`
              w-full px-4 py-2.5 rounded-xl
              border border-slate-300 dark:border-slate-800
              bg-white/80 dark:bg-slate-900/80
              text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-500
              shadow-inner outline-none
              transition-all duration-300 ease-out transform-gpu
              hover:-translate-y-0.5 hover:scale-[1.01] hover:border-teal-500/50 hover:shadow-[0_8px_20px_-6px_rgba(20,184,166,0.25)]
              focus:-translate-y-1 focus:scale-[1.015] focus:border-teal-400 focus:shadow-[0_12px_28px_-4px_rgba(20,184,166,0.35)] focus:ring-2 focus:ring-teal-400/20
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
      </div>
    )
  }
)

Textarea3D.displayName = 'Textarea3D'
