'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { browserClient } from './supabase'
import { EVENT_SLUG } from './config'
import { SEED } from './seed'
import { isContent, type Content } from './types'

export type Conn = 'connecting' | 'live' | 'offline' | 'unconfigured'

// 共有本文の取得＋Realtime購読。切断/未対応に備えて表示中は 20秒ごとに再取得する。
export function useHandbook() {
  const [content, setContent] = useState<Content>(SEED)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [published, setPublished] = useState(false)
  const [conn, setConn] = useState<Conn>('connecting')
  const eventId = useRef<string | null>(null)
  const latest = useRef(0)

  const apply = useCallback((c: unknown, at: string) => {
    if (!isContent(c)) return
    const t = Date.parse(at)
    if (t < latest.current) return // 古い通知は捨てる
    latest.current = t
    setContent(c)
    setUpdatedAt(at)
    setPublished(true)
  }, [])

  const refetch = useCallback(async () => {
    const db = browserClient()
    if (!db) return
    if (!eventId.current) {
      const { data } = await db.from('events').select('id').eq('slug', EVENT_SLUG).maybeSingle()
      eventId.current = data?.id ?? null
    }
    if (!eventId.current) return
    const { data, error } = await db
      .from('handbook')
      .select('content, updated_at')
      .eq('event_id', eventId.current)
      .maybeSingle()
    if (error) return setConn('offline')
    if (data) apply(data.content, data.updated_at)
  }, [apply])

  useEffect(() => {
    const db = browserClient()
    if (!db) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConn('unconfigured')
      return
    }
    let channel: ReturnType<typeof db.channel> | undefined
    let dead = false
    ;(async () => {
      await refetch()
      if (dead || !eventId.current) return
      channel = db
        .channel(`handbook:${eventId.current}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'handbook', filter: `event_id=eq.${eventId.current}` },
          (p) => {
            const row = p.new as { content?: unknown; updated_at?: string }
            if (row?.content && row.updated_at) apply(row.content, row.updated_at)
          },
        )
        .subscribe((s) => {
          if (s === 'SUBSCRIBED') setConn('live')
          else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') setConn('offline')
        })
    })()
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void refetch()
    }, 20000)
    const onVis = () => document.visibilityState === 'visible' && void refetch()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      dead = true
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
      if (channel) void db.removeChannel(channel)
    }
  }, [apply, refetch])

  // 楽観的更新: 保存中は自分の内容を先に表示し、成功したらサーバー時刻を確定値にする
  const setOptimistic = useCallback((c: Content) => setContent(c), [])
  const confirmSaved = useCallback((c: Content, at: string) => {
    latest.current = Date.parse(at)
    setContent(c)
    setUpdatedAt(at)
    setPublished(true)
  }, [])

  return { content, updatedAt, published, conn, refetch, setOptimistic, confirmSaved }
}
