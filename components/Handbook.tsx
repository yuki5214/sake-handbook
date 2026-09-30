'use client'

import { useEffect, useRef, useState } from 'react'
import { EVENT_SUB, EVENT_TITLE } from '@/lib/config'
import { copyText, exportMemos } from '@/lib/export'
import { useHandbook, type Conn } from '@/lib/useHandbook'
import type { Content, Section } from '@/lib/types'
import SectionEditor from './SectionEditor'
import SectionView from './SectionView'

const PASS_KEY = 'sakehb:owner-pass'

const CONN_LABEL: Record<Conn, { text: string; cls: string }> = {
  connecting: { text: '接続中…', cls: 'bg-mute-soft text-mute' },
  live: { text: '● 自動更新中（数秒ごと）', cls: 'bg-ok-soft text-ok' },
  offline: { text: '接続できません（自動で再試行）', cls: 'bg-warn-soft text-warn' },
}

function fmt(at: string | null) {
  if (!at) return ''
  return new Date(at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Handbook() {
  const { content, updatedAt, published, conn, refetch, setOptimistic, confirmSaved } = useHandbook()
  const [pass, setPass] = useState<string | null>(null)
  const [draft, setDraft] = useState<Content | null>(null)
  const [dirtyRemote, setDirtyRemote] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [askPass, setAskPass] = useState(false)
  const [input, setInput] = useState('')
  const [err, setErr] = useState('')
  const baseAt = useRef<string | null>(null) // 編集開始時点の最終更新

  useEffect(() => {
    try {
      // 前回ログインしたパスコードを引き継ぐ（この端末のみ）
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPass(sessionStorage.getItem(PASS_KEY))
    } catch {}
  }, [])

  // 編集中に他者の更新が届いたら知らせる（保存すると最後の書き込みが勝つ）
  useEffect(() => {
    if (draft && updatedAt !== baseAt.current) setDirtyRemote(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedAt])

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2500)
  }

  const startEdit = () => {
    baseAt.current = updatedAt
    setDraft(structuredClone(content))
    setDirtyRemote(false)
  }

  const login = async () => {
    setErr('')
    const r = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: input }),
    })
    if (!r.ok) return setErr('パスコードが違います')
    try {
      sessionStorage.setItem(PASS_KEY, input)
    } catch {}
    setPass(input)
    setAskPass(false)
    setInput('')
    startEdit()
  }

  const save = async () => {
    if (!draft || !pass) return
    setBusy(true)
    const next = draft
    setOptimistic(next)
    const r = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: pass, content: next, by: 'owner' }),
    }).catch(() => null)
    setBusy(false)
    if (r?.ok) {
      const { updated_at } = await r.json()
      confirmSaved(next, updated_at)
      setDraft(null)
      flash('保存しました。全員の画面に反映されます')
    } else {
      // 失敗時は最新のDB値に戻し、編集内容は残す
      const msg = r ? ((await r.json().catch(() => null))?.error ?? '保存に失敗しました') : '通信に失敗しました'
      flash(msg)
      if (r?.status === 401) {
        try {
          sessionStorage.removeItem(PASS_KEY)
        } catch {}
        setPass(null)
      }
      void refetch()
    }
  }

  const changeSection = (i: number, s: Section) =>
    setDraft((d) => (d ? { ...d, sections: d.sections.map((x, k) => (k === i ? s : x)) } : d))

  const doExport = async () => {
    const ok = await copyText(exportMemos(content))
    flash(ok ? '自分のメモをコピーしました' : 'コピーできませんでした')
  }

  const sections = draft ?? content
  const c = CONN_LABEL[conn]

  return (
    <div className="mx-auto max-w-2xl pb-28">
      <header className="px-4 pb-2 pt-5">
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

      <nav className="sticky top-0 z-10 -mb-px overflow-x-auto border-b border-line bg-bg/95 px-2 py-2 backdrop-blur" aria-label="セクション">
        <ul className="flex w-max gap-1.5">
          {sections.sections.map((s) => (
            <li key={s.key}>
              <a href={`#sec-${s.key}`} className="block whitespace-nowrap rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="space-y-4 px-4 pt-4">
        {draft && dirtyRemote && (
          <div className="rounded-lg bg-warn-soft p-3 text-sm text-warn">
            編集中に他の更新がありました。このまま保存するとあなたの内容で上書きされます。
          </div>
        )}
        {draft
          ? draft.sections.map((s, i) => <SectionEditor key={s.key} s={s} onChange={(n) => changeSection(i, n)} />)
          : content.sections.map((s) => <SectionView key={s.key} s={s} />)}

        {!draft && (
          <div className="flex flex-wrap gap-2 pt-2">
            <button className="btn btn-primary" onClick={doExport}>自分のメモを書き出し（コピー）</button>
            <button className="btn" disabled={conn === 'connecting'} onClick={() => (pass ? startEdit() : setAskPass(true))}>オーナー編集</button>
          </div>
        )}
        <p className="pb-2 text-xs text-sub">
          本文は全員で共有されます。📝メモと要確定リストのステータスはこの端末だけに保存され、他の人には見えません。
        </p>
      </main>

      {draft && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2">
            <button className="btn flex-1" disabled={busy} onClick={() => setDraft(null)}>破棄</button>
            <button className="btn btn-primary flex-[2]" disabled={busy} onClick={save}>
              {busy ? '保存中…' : '保存して全員に反映'}
            </button>
          </div>
        </div>
      )}

      {askPass && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="オーナー認証">
          <form
            className="w-full max-w-sm space-y-3 rounded-2xl bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault()
              void login()
            }}
          >
            <h2 className="font-bold">オーナー編集</h2>
            <input
              type="password"
              autoFocus
              className="field"
              placeholder="パスコード"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {err && <p className="text-sm text-accent" role="alert">{err}</p>}
            <div className="flex gap-2">
              <button type="button" className="btn flex-1" onClick={() => setAskPass(false)}>キャンセル</button>
              <button type="submit" className="btn btn-primary flex-1">開く</button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4" role="status">
          <div className="rounded-full bg-ink px-4 py-2 text-sm text-bg shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  )
}
