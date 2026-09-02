import React from 'react'
import { Image, ImageStyle, View, ViewStyle } from 'react-native'

export interface MobileThenvueLogoProps {
  size?: number
  variant?: 'foreground' | 'square' | 'master'
  style?: ViewStyle
  imageStyle?: ImageStyle
}

export function ThenvueLogo({
  size = 32,
  variant = 'foreground',
  style,
  imageStyle,
}: MobileThenvueLogoProps) {
  // Use transparent foreground asset by default for clean in-app UI branding
  const source =
    variant === 'master'
      ? require('../../assets/brand/master/thenvue-logo-master-1024.png')
      : variant === 'square'
      ? require('../../assets/brand/master/thenvue-logo-square-1024.png')
      : require('../../assets/android/mipmap-xxxhdpi/ic_launcher_foreground.png')

  // ic_launcher_foreground.png contains adaptive icon margin padding (~58% visible)
  const visualMultiplier = variant === 'foreground' ? 1.72 : 1.0
  const renderedSize = Math.round(size * visualMultiplier)

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={[
          {
            width: renderedSize,
            height: renderedSize,
          },
          variant !== 'foreground' && {
            borderRadius: variant === 'square' ? size / 2 : size * 0.22,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  )
}
