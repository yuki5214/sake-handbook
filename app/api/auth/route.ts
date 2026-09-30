import { NextResponse } from 'next/server'
import { checkPasscode } from '@/lib/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!checkPasscode(body?.passcode)) {
    return NextResponse.json({ error: 'パスコードが違います' }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
