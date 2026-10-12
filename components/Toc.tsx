'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { EVENT_SUB, EVENT_TITLE } from '@/lib/config'
import { copyText, exportMemos } from '@/lib/export'
import { SECTION_ROUTES, slugOfKey } from '@/lib/routes'
import { summarizeSection } from '@/lib/summary'
import { useHandbook, type Conn } from '@/lib/useHandbook'
import { useToast } from '@/lib/useToast'
import Toast from './Toast'

const CONN_LABEL: Record<Conn, { text: string; cls: string }> = {
  connecting: { text: '接続中…', cls: 'bg-mute-soft text-mute' },
  live: { text: '● 自動更新中（数秒ごと）', cls: 'bg-ok-soft text-ok' },
  offline: { text: '接続できません（自動で再試行）', cls: 'bg-warn-soft text-warn' },
}

const CARD = 'flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 shadow-sm'

function fmt(at: string | null) {
  if (!at) return ''
  return new Date(at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// トップ＝目次。各セクションは別ページ（/<slug>）。名簿は統合の準備中なので、いまは枠だけ。
export default function Toc() {
  const { content, updatedAt, published, conn } = useHandbook()
  const { toast, flash } = useToast()
  const router = useRouter()

  // 旧いリンク（/#sec-<key>）は、新しいページへ転送する（# はサーバーに届かないので、ここで読む）
  useEffect(() => {
    const go = () => {
      const m = window.location.hash.match(/^#sec-(.+)$/)
      const slug = m && slugOfKey(decodeURIComponent(m[1]))
      if (slug) router.replace(`/${slug}`)
    }
    go()
    window.addEventListener('hashchange', go)
    return () => window.removeEventListener('hashchange', go)
  }, [router])

  const doExport = async () => {
    const ok = await copyText(exportMemos(content))
    flash(ok ? '自分のメモをコピーしました' : 'コピーできませんでした')
  }

  const c = CONN_LABEL[conn]
  const cards = SECTION_ROUTES.flatMap((r) => {
    const s = content.sections.find((x) => x.key === r.key)
    return s ? [{ slug: r.slug, title: s.title, summary: summarizeSection(s) }] : []
  })

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <header className="pb-3 pt-5">
        <h1 className="text-2xl font-bold">{EVENT_TITLE}</h1>
        <p className="text-sm text-sub">{EVENT_SUB}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 ${c.cls}`}>{c.text}</span>
          {updatedAt ? (
            <span className="text-sub">最終更新 {fmt(updatedAt)}</span>
          ) : (
            !published && conn !== 'connecting' && <span className="text-sub">まだ公開されていません（初期値）</span>
          )}
        </div>
      </header>

      <nav aria-label="目次">
        <ul className="grid gap-2.5 sm:grid-cols-2">
          <li>
            <div className={`${CARD} border-dashed opacity-70`} aria-disabled="true">
              <div className="min-w-0 flex-1">
                <div className="font-bold">名簿</div>
                <div className="text-sm text-sub">統合の準備中です（いまは ticket-roster をご利用ください）</div>
              </div>
            </div>
          </li>
          {cards.map((card) => (
            <li key={card.slug}>
              <Link href={`/${card.slug}`} className={`${CARD} active:bg-mute-soft`}>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{card.title}</div>
                  <div className="truncate text-sm text-sub">{card.summary}</div>
                </div>
                <span className="text-xl text-mute" aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="pt-5">
        <button className="btn btn-primary" onClick={doExport}>自分のメモを書き出し（コピー）</button>
      </div>
      <p className="pt-3 text-xs text-sub">
        本文は全員で共有されます。📝メモと要確定リストのステータスはこの端末だけに保存され、他の人には見えません。
      </p>
      <Toast text={toast} />
    </div>
  )
}
