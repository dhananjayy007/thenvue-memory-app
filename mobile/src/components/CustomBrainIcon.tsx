import React from 'react'
import Svg, { G, Line, Circle } from 'react-native-svg'

export function CustomBrainIcon({
  size = 18,
  color = '#c7765b',
  strokeWidth = 1.6,
}: {
  size?: number
  color?: string
  strokeWidth?: number
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Network Edges / Lines */}
      <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Outer brain contour */}
        <Line x1="4.5" y1="9" x2="8.5" y2="6" />
        <Line x1="8.5" y1="6" x2="12.5" y2="5.5" />
        <Line x1="12.5" y1="5.5" x2="16.5" y2="6.5" />
        <Line x1="16.5" y1="6.5" x2="19" y2="9" />
        <Line x1="19" y1="9" x2="19.5" y2="12" />
        <Line x1="19.5" y1="12" x2="18" y2="14.5" />
        <Line x1="18" y1="14.5" x2="17.5" y2="15.5" />
        <Line x1="17.5" y1="15.5" x2="15.5" y2="16.5" />
        <Line x1="15.5" y1="16.5" x2="15.5" y2="18.5" />
        <Line x1="15.5" y1="18.5" x2="12.5" y2="15.5" />
        <Line x1="12.5" y1="15.5" x2="9.5" y2="15.5" />
        <Line x1="9.5" y1="15.5" x2="8.5" y2="14" />
        <Line x1="8.5" y1="14" x2="5.5" y2="14" />
        <Line x1="5.5" y1="14" x2="4.5" y2="9" />

        {/* Central Hub Radiating Connections */}
        <Line x1="12" y1="10" x2="4.5" y2="9" />
        <Line x1="12" y1="10" x2="8.5" y2="6" />
        <Line x1="12" y1="10" x2="12.5" y2="5.5" />
        <Line x1="12" y1="10" x2="19" y2="9" />
        <Line x1="12" y1="10" x2="8.5" y2="14" />
        <Line x1="12" y1="10" x2="12.5" y2="15.5" />
        <Line x1="12" y1="10" x2="15" y2="13" />

        {/* Lower Right Mesh Connections */}
        <Line x1="15" y1="13" x2="19" y2="9" />
        <Line x1="15" y1="13" x2="17.5" y2="15.5" />
        <Line x1="15" y1="13" x2="12.5" y2="15.5" />
      </G>

      {/* Nodes / Dots */}
      <G fill={color}>
        <Circle cx="4.5" cy="9" r="1.1" />
        <Circle cx="8.5" cy="6" r="1.1" />
        <Circle cx="12.5" cy="5.5" r="1.1" />
        <Circle cx="16.5" cy="6.5" r="1.1" />
        <Circle cx="19" cy="9" r="1.1" />
        <Circle cx="19.5" cy="12" r="1.1" />
        <Circle cx="18" cy="14.5" r="1.1" />
        <Circle cx="17.5" cy="15.5" r="1.1" />
        <Circle cx="15.5" cy="16.5" r="1.1" />
        <Circle cx="15.5" cy="18.5" r="1.1" />
        <Circle cx="12.5" cy="15.5" r="1.1" />
        <Circle cx="9.5" cy="15.5" r="1.1" />
        <Circle cx="8.5" cy="14" r="1.1" />
        <Circle cx="5.5" cy="14" r="1.1" />
        <Circle cx="15" cy="13" r="1.1" />
        <Circle cx="12" cy="10" r="1.6" />
      </G>
    </Svg>
  )
}
