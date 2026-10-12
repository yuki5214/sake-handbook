import 'server-only'
import { Redis } from '@upstash/redis'
import { EVENT_SLUG } from './config'
import type { Content } from './types'

/**
 * 共有本文の保存先。Upstash Redis のキー1つに { content, updated_at, updated_by } の JSON で持つ（最後の書き込み優先）。
 * 接続情報が無い開発環境ではメモリに保存する（再起動で消える）。本番では必ず Upstash を使う。
 */
export type Stored = { content: Content; updated_at: string; updated_by: string | null }

const KEY = `handbook:${EVENT_SLUG}`
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

let memory: Stored | null = null

function redis(): Redis | null {
  if (url && token) return new Redis({ url, token })
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Upstash Redis の接続情報（KV_REST_API_URL / KV_REST_API_TOKEN）が未設定です')
  }
  return null
}

export async function readHandbook(): Promise<Stored | null> {
  const r = redis()
  return r ? await r.get<Stored>(KEY) : memory
}

// セクション単位の保存用。Redis に入っている文字列そのもの（JSON）を読み、「読んだ値のままのときだけ」書く。
// 比較と書き込みは Lua（EVAL）で1回の命令にまとめるので、間に他の書き込みが入ることはない（入ったら書かずに false）。
const CAS = `
local cur = redis.call('GET', KEYS[1])
if (cur == false and ARGV[1] == '') or cur == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2])
  return 1
end
return 0`

export type Raw = { raw: string | null; stored: Stored | null }

export async function readRaw(): Promise<Raw> {
  const r = redis()
  if (!r) return { raw: memory ? JSON.stringify(memory) : null, stored: memory }
  // 文字列のまま読む（自動のJSON変換をしない）。書き込みの比較に、保存されている文字列そのものが要る
  const raw = await new Redis({ url: url!, token: token!, automaticDeserialization: false }).get<string>(KEY)
  return { raw, stored: raw ? (JSON.parse(raw) as Stored) : null }
}

/** prevRaw のままなら next を書いて true。他の書き込みが先に入っていたら false */
export async function writeIfUnchanged(prevRaw: string | null, content: Content, by: string | null): Promise<Stored | null> {
  const next: Stored = { content, updated_at: new Date().toISOString(), updated_by: by }
  const r = redis()
  if (!r) {
    if ((memory ? JSON.stringify(memory) : null) !== prevRaw) return null
    memory = next
    return next
  }
  const ok = await r.eval(CAS, [KEY], [prevRaw ?? '', JSON.stringify(next)])
  return ok === 1 ? next : null
}

export async function writeHandbook(content: Content, by: string | null): Promise<Stored> {
  const next: Stored = { content, updated_at: new Date().toISOString(), updated_by: by }
  const r = redis()
  if (r) await r.set(KEY, next)
  else memory = next
  return next
}
