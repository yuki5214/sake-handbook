import { NextResponse } from 'next/server'
import { checkPasscode } from '@/lib/server'
import { readHandbook, writeHandbook } from '@/lib/store'
import { isContent } from '@/lib/types'

export const dynamic = 'force-dynamic'

// 最後の書き込み優先。passcode を検証できたときだけ書く。
// expectedUpdatedAt が付いているとき（一回限りの移行スクリプト用）は、最新の更新時刻と違えば書かずに止める。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!checkPasscode(body?.passcode)) {
    return NextResponse.json({ error: 'パスコードが違います' }, { status: 401 })
  }
  if (!isContent(body?.content)) {
    return NextResponse.json({ error: '本文の形式が不正です' }, { status: 400 })
  }
  if (typeof body.expectedUpdatedAt === 'string') {
    const current = await readHandbook()
    if (current?.updated_at !== body.expectedUpdatedAt) {
      return NextResponse.json({ error: '読み込み後に本文が更新されたため、保存しませんでした' }, { status: 409 })
    }
  }
  const by = typeof body.by === 'string' ? body.by.slice(0, 40) : null
  const saved = await writeHandbook(body.content, by)
  return NextResponse.json({ updated_at: saved.updated_at })
}
