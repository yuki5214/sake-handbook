import { NextResponse } from 'next/server'
import { checkPasscode } from '@/lib/server'
import { saveSection } from '@/lib/saveSection'
import { readHandbook, writeHandbook } from '@/lib/store'
import { isContent } from '@/lib/types'

export const dynamic = 'force-dynamic'

// passcode を検証できたときだけ書く。
//  - sectionKey / section / base が付いているとき（各ページの編集）: そのセクションだけを差し替える（lib/saveSection.ts）。
//    他のセクションは最新のまま残り、同じセクションを先に変更されていたら 409 で止める。
//  - content だけのとき（一回限りの移行スクリプト用）: 本文全体を書く。最後の書き込み優先。
//    expectedUpdatedAt が付いていれば、最新の更新時刻と違えば書かずに止める。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!checkPasscode(body?.passcode)) {
    return NextResponse.json({ error: 'パスコードが違います' }, { status: 401 })
  }
  if (typeof body?.sectionKey === 'string') {
    const by = typeof body.by === 'string' ? body.by.slice(0, 40) : null
    const r = await saveSection(body.sectionKey, body.section, body.base, by)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    return NextResponse.json({ updated_at: r.saved.updated_at, content: r.saved.content })
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
