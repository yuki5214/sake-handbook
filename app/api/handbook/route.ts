import { NextResponse } from 'next/server'
import { readHandbook } from '@/lib/store'

export const dynamic = 'force-dynamic'

// 閲覧は公開。?since=<updated_at> が最新と同じなら本文を返さない（通信量の節約）
export async function GET(request: Request) {
  const since = new URL(request.url).searchParams.get('since')
  const row = await readHandbook()
  const headers = { 'Cache-Control': 'no-store' }
  if (!row) return NextResponse.json({ published: false }, { headers })
  if (since && since === row.updated_at) return NextResponse.json({ published: true, unchanged: true }, { headers })
  return NextResponse.json({ published: true, content: row.content, updated_at: row.updated_at }, { headers })
}
