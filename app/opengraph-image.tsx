import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Thenvue — Your life, remembered.'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#141514',
          position: 'relative',
          padding: '40px',
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '30%',
            width: '40%',
            height: '40%',
            background: 'radial-gradient(circle, rgba(227, 160, 124, 0.18) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Inner Card Frame */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
          }}
        >
          {/* Logo / Brand Mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '2px solid #E3A07C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E3A07C',
                fontSize: '22px',
              }}
            >
              ✦
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 600,
                letterSpacing: '4px',
                color: '#E3A07C',
                textTransform: 'uppercase',
              }}
            >
              Thenvue
            </span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: '58px',
              fontFamily: 'Georgia, serif',
              fontWeight: 400,
              color: '#F5F4F0',
              margin: '0 0 16px 0',
              letterSpacing: '-1px',
              textAlign: 'center',
            }}
          >
            Your life, remembered.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '22px',
              color: '#A1A09B',
              margin: '0 0 32px 0',
              textAlign: 'center',
            }}
          >
            Personal Memory & AI Journal
          </p>

          {/* Domain Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '6px 20px',
              color: '#D2D1CB',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            thenvue.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
