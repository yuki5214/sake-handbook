// 初期本文を投入する。使い方: .env.local を用意して `npm run seed`
// SEED は TS なので、ここでは Next の API 経由ではなく直接 upsert する。
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../lib/seed.ts', import.meta.url), 'utf8')
const json = src.slice(src.indexOf('= {') + 2).replace(/\n}\s*$/, '\n}')
const content = new Function(`return (${json})`)()

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const slug = process.env.NEXT_PUBLIC_EVENT_SLUG ?? 'sakematsuri-2026'
const { data: ev, error: e1 } = await db.from('events').select('id').eq('slug', slug).single()
if (e1) throw e1
const { data: cur } = await db.from('handbook').select('event_id').eq('event_id', ev.id).maybeSingle()
if (cur && !process.argv.includes('--force')) {
  console.log('既に本文があるため何もしません（上書きは --force）')
  process.exit(0)
}
const { error } = await db.from('handbook').upsert({ event_id: ev.id, content, updated_by: 'seed' })
if (error) throw error
console.log('シード投入完了')
