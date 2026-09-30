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

export async function writeHandbook(content: Content, by: string | null): Promise<Stored> {
  const next: Stored = { content, updated_at: new Date().toISOString(), updated_by: by }
  const r = redis()
  if (r) await r.set(KEY, next)
  else memory = next
  return next
}
