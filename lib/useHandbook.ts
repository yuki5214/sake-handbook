'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { migrate } from './migrate'
import { SEED } from './seed'
import { isContent, type Content } from './types'

export const POLL_INTERVAL_MS = 5000

export type Conn = 'connecting' | 'live' | 'offline'

/**
 * 共有本文の取得。画面が表示されている間だけ POLL_INTERVAL_MS ごとに取り直し、
 * オーナーの保存を数秒以内に反映する（裏に回った画面は取りに行かない＝無料枠の節約）。
 */
export function useHandbook() {
  const [content, setContent] = useState<Content>(SEED)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [published, setPublished] = useState(false)
  const [conn, setConn] = useState<Conn>('connecting')
  const seq = useRef(0)
  const since = useRef<string | null>(null)

  const refetch = useCallback(async () => {
    const mine = ++seq.current
    try {
      const q = since.current ? `?since=${encodeURIComponent(since.current)}` : ''
      const res = await fetch(`/api/handbook${q}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      const d = await res.json()
      if (mine !== seq.current) return // 古い応答は捨てる
      setConn('live')
      if (d.unchanged || !d.published) return
      if (isContent(d.content) && typeof d.updated_at === 'string') {
        since.current = d.updated_at
        setContent(migrate(d.content))
        setUpdatedAt(d.updated_at)
        setPublished(true)
      }
    } catch {
      if (mine === seq.current) setConn('offline')
    }
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const start = () => {
      clearInterval(timer)
      if (document.visibilityState !== 'visible') return
      void refetch()
      timer = setInterval(() => void refetch(), POLL_INTERVAL_MS)
    }
    start()
    document.addEventListener('visibilitychange', start)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', start)
    }
  }, [refetch])

  // 楽観的更新: 保存中は自分の内容を先に表示し、成功したらサーバー時刻を確定値にする
  const setOptimistic = useCallback((c: Content) => setContent(c), [])
  const confirmSaved = useCallback((c: Content, at: string) => {
    seq.current++ // 飛行中の古い応答を無効化
    since.current = at
    setContent(c)
    setUpdatedAt(at)
    setPublished(true)
  }, [])

  return { content, updatedAt, published, conn, refetch, setOptimistic, confirmSaved }
}
