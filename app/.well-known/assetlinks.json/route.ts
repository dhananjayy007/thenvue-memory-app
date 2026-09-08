export const dynamic = 'force-dynamic'

export async function GET() {
  const sha256Fingerprint = process.env.ANDROID_SHA256_FINGERPRINT || 'FINGERPRINT_PLACEHOLDER'
  const fingerprints = sha256Fingerprint.includes(',')
    ? sha256Fingerprint.split(',').map((f) => f.trim())
    : [sha256Fingerprint]

  const data = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.thenvue.app',
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

