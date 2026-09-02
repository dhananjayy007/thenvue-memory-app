import Image from 'next/image'

export function BrainLogo({ size = 24, className = '' }: { size?: number | string, className?: string }) {
  return (
    <Image 
      src="/brain-logo.png" 
      alt="Brain AI Logo" 
      width={typeof size === 'string' ? parseInt(size, 10) : size} 
      height={typeof size === 'string' ? parseInt(size, 10) : size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
