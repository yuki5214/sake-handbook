import { NextResponse } from 'next/server'
import { adminClient, checkPasscode } from '@/lib/server'
import { isContent } from '@/lib/types'
import { EVENT_SLUG } from '@/lib/config'

export const dynamic = 'force-dynamic'

// 最後の書き込み優先。RLS に書き込みポリシーは無いので service role で更新する。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!checkPasscode(body?.passcode)) {
    return NextResponse.json({ error: 'パスコードが違います' }, { status: 401 })
  }
  if (!isContent(body?.content)) {
    return NextResponse.json({ error: '本文の形式が不正です' }, { status: 400 })
  }
  const db = adminClient()
  const { data: ev, error: evErr } = await db.from('events').select('id').eq('slug', EVENT_SLUG).single()
  if (evErr || !ev) return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 })

  const updated_by = typeof body.by === 'string' ? body.by.slice(0, 40) : null
  const { data, error } = await db
    .from('handbook')
    .upsert({ event_id: ev.id, content: body.content, updated_at: new Date().toISOString(), updated_by })
    .select('updated_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ updated_at: data.updated_at })
}
