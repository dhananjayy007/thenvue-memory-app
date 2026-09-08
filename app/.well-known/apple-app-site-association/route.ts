export const dynamic = 'force-dynamic'

export async function GET() {
  const appleTeamId = process.env.APPLE_TEAM_ID || 'TEAM_ID'
  const data = {
    applinks: {
      apps: [],
      details: [
        {
          appID: `${appleTeamId}.com.thenvue.app`,
          paths: ['/share/*'],
        },
      ],
    },
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

