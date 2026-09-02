import React from 'react'

export interface ThenvueLogoProps {
  /**
   * Target visual size of the visible logo artwork in pixels (default: 36)
   */
  size?: number
  /**
   * 'foreground' (default): transparent background feather + ring from /brand/master/logo_foreground.svg
   * 'master': squircle charcoal background + feather + ring from /brand/master/logo_master.svg
   * 'square': square charcoal background + feather + ring from /brand/master/logo_master_square.svg
   */
  variant?: 'foreground' | 'master' | 'square'
  className?: string
  style?: React.CSSProperties
  alt?: string
}

export function ThenvueLogo({
  size = 36,
  variant = 'foreground',
  className,
  style,
  alt = 'Thenvue',
}: ThenvueLogoProps) {
  // Asset source mapping strictly from /public/brand/master/
  const assetSrc =
    variant === 'master'
      ? '/brand/master/logo_master.svg'
      : variant === 'square'
      ? '/brand/master/logo_master_square.svg'
      : '/brand/master/logo_foreground.svg'

  // Scale factor to normalize visual presence so 'size' matches actual visible artwork diameter
  // logo_foreground.svg has artwork diameter of 507px inside a 1024px canvas (~49.5%)
  // logo_master.svg has squircle bounds of 1024px
  const scaleMultiplier = variant === 'foreground' ? 1.98 : 1.0
  const renderedSize = Math.round(size * scaleMultiplier)

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        overflow: 'visible',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetSrc}
        alt={alt}
        width={renderedSize}
        height={renderedSize}
        style={{
          width: renderedSize,
          height: renderedSize,
          maxWidth: 'none',
          maxHeight: 'none',
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    </span>
  )
}
