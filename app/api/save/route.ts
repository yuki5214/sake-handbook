import { NextResponse } from 'next/server'
import { checkPasscode } from '@/lib/server'
import { writeHandbook } from '@/lib/store'
import { isContent } from '@/lib/types'

export const dynamic = 'force-dynamic'

// 最後の書き込み優先。passcode を検証できたときだけ書く。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!checkPasscode(body?.passcode)) {
    return NextResponse.json({ error: 'パスコードが違います' }, { status: 401 })
  }
  if (!isContent(body?.content)) {
    return NextResponse.json({ error: '本文の形式が不正です' }, { status: 400 })
  }
  const by = typeof body.by === 'string' ? body.by.slice(0, 40) : null
  const saved = await writeHandbook(body.content, by)
  return NextResponse.json({ updated_at: saved.updated_at })
}
