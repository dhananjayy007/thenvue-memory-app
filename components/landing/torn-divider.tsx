'use client'

interface TornDividerProps {
  fillColor?: string
  bgFill?: string
  flip?: boolean
  className?: string
}

export function TornDivider({
  fillColor,
  bgFill,
  flip = false,
  className = '',
}: TornDividerProps) {
  return (
    <div
      className={`torn-divider-wrapper ${className}`}
      style={{
        transform: flip ? 'rotate(180deg)' : 'none',
        lineHeight: 0,
        overflow: 'hidden',
        width: '100%',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 24"
        preserveAspectRatio="none"
        className="torn-divider-svg"
        style={{
          display: 'block',
          width: '100%',
          height: '24px',
          backgroundColor: bgFill || 'var(--landing-torn-bg, #F4EFEA)',
        }}
      >
        <path
          d="M0,0 L0,14 Q30,16 60,13 Q90,10 120,15 Q150,20 180,14 Q210,9 240,16 Q270,22 300,15 Q330,8 360,14 Q390,19 420,13 Q450,8 480,15 Q510,21 540,14 Q570,9 600,16 Q630,22 660,15 Q690,8 720,14 Q750,19 780,13 Q810,8 840,15 Q870,21 900,14 Q930,9 960,16 Q990,22 1020,15 Q1050,8 1080,14 Q1110,19 1140,13 Q1170,8 1200,15 L1200,0 Z"
          fill={fillColor || 'var(--landing-torn-fill, #FAF8F5)'}
        />
      </svg>
    </div>
  )
}
