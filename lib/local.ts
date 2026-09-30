import { useCallback, useEffect, useState } from 'react'
import { EVENT_SLUG } from './config'

// 各自の端末だけのメモ（DBには送らない）
export type Status = '' | 'decided' | 'hold' | 'skip'
export type TodoLocal = { status: Status; memo: string }

const P = `sakehb:${EVENT_SLUG}:`
export const memoKey = (sectionKey: string) => `${P}memo:${sectionKey}`
export const todoKey = (id: string) => `${P}todo:${id}`

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 容量超過・プライベートモード等は黙って諦める（表示上の state は維持）
  }
}

export function useLocal<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(fallback)
  useEffect(() => {
    // hydration 後に端末の値を読む
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setV(readLocal(key, fallback))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const set = useCallback(
    (next: T) => {
      setV(next)
      writeLocal(key, next)
    },
    [key],
  )
  return [v, set]
}
