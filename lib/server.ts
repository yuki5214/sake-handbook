import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'

export function checkPasscode(input: unknown): boolean {
  const expected = process.env.EDIT_PASSCODE
  if (!expected || typeof input !== 'string') return false
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// service role は RLS を越えるのでサーバー側だけで使う
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase の環境変数が未設定です')
  return createClient(url, key, { auth: { persistSession: false } })
}
