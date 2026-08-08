interface CarePilotIconProps {
  size?: number
  className?: string
}

export function CarePilotIcon({ size = 64, className = '' }: CarePilotIconProps) {
  return (
    <div
      className={`cp-icon-wrap ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cpBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <filter id="cpGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Rounded square background */}
        <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#cpBg)" filter="url(#cpGlow)" />
        {/* Shield outline */}
        <path
          d="M32 14L20 19.5V29.5C20 36.4 25.3 42.9 32 44.5C38.7 42.9 44 36.4 44 29.5V19.5L32 14Z"
          stroke="white"
          strokeWidth="2.2"
          strokeLinejoin="round"
          fill="none"
          opacity="0.9"
        />
        {/* Checkmark */}
        <path
          d="M26 31L30 35L38 27"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <style>{`
        .cp-icon-wrap { display: inline-block; }
        .cp-icon-wrap svg { display: block; }
      `}</style>
    </div>
  )
}
