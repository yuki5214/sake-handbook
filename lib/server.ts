import 'server-only'
import { timingSafeEqual } from 'node:crypto'

export function checkPasscode(input: unknown): boolean {
  const expected = process.env.EDIT_PASSCODE
  if (!expected || typeof input !== 'string') return false
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
