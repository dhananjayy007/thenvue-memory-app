/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.1.36', '192.168.1.36:3000', 'localhost:3000', '192.168.1.*'],
}

export default nextConfig
