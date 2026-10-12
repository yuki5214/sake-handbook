'use client'

import { useState } from 'react'
import { useHandbook } from '@/lib/useHandbook'
import { useOwner } from '@/lib/useOwner'
import { useToast } from '@/lib/useToast'
import type { Section } from '@/lib/types'
import OwnerLogin from './OwnerLogin'
import PageHeader from './PageHeader'
import SectionEditor from './SectionEditor'
import SectionView from './SectionView'
import Toast from './Toast'

// 1セクション＝1ページ。閲覧は誰でも、編集はオーナー（パスコード）だけ。保存はこのセクションだけを差し替える。
export default function SectionPage({ sectionKey }: { sectionKey: string }) {
  const { content, updatedAt, conn, refetch, confirmSaved } = useHandbook()
  const { pass, setPass } = useOwner()
  const { toast, flash } = useToast()
  const [draft, setDraft] = useState<Section | null>(null)
  const [busy, setBusy] = useState(false)
  const [askPass, setAskPass] = useState(false)
  const [base, setBase] = useState<Section | null>(null) // 編集を始めたときのこのセクション（他の人の変更を検出するため）

  const section = content.sections.find((s) => s.key === sectionKey)
  const remoteChanged = !!draft && !!section && JSON.stringify(section) !== JSON.stringify(base)

  const startEdit = () => {
    if (!section) return
    setBase(structuredClone(section))
    setDraft(structuredClone(section))
  }

  const save = async () => {
    if (!draft || !pass) return
    setBusy(true)
    const r = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: pass, sectionKey, section: draft, base, by: 'owner' }),
    }).catch(() => null)
    setBusy(false)
    const body = r ? await r.json().catch(() => null) : null
    if (r?.ok && body) {
      confirmSaved(body.content, body.updated_at)
      setDraft(null)
      flash('保存しました。全員の画面に反映されます')
      return
    }
    // 失敗時は編集内容を残し、最新の本文を取り直す
    flash(body?.error ?? (r ? '保存に失敗しました' : '通信に失敗しました'))
    if (r?.status === 401) setPass(null)
    void refetch()
  }

  const right = draft ? null : (
    <button className="btn !min-h-11 !px-3 text-sm" disabled={conn === 'connecting' || !section} onClick={() => (pass ? startEdit() : setAskPass(true))}>
      オーナー編集
    </button>
  )

  return (
    <div className="mx-auto max-w-2xl pb-28">
      <PageHeader title={section?.title ?? ''} right={right} />
      <main className="space-y-4 px-4 pt-4">
        {draft && remoteChanged && (
          <div className="rounded-lg bg-warn-soft p-3 text-sm text-warn">
            編集中に、このセクションが他の人に更新されました。このまま保存はできません（上書きを防ぐため）。内容を控えて「破棄」し、開き直してください。
          </div>
        )}
        {!section ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-sub">
            {conn === 'connecting' ? '読み込み中…' : 'このセクションは見つかりません'}
          </p>
        ) : draft ? (
          <SectionEditor s={draft} onChange={setDraft} />
        ) : (
          <SectionView s={section} showTitle={false} />
        )}
        {!draft && updatedAt && <p className="text-xs text-sub">最終更新 {new Date(updatedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
      </main>

      {draft && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2">
            <button className="btn flex-1" disabled={busy} onClick={() => setDraft(null)}>破棄</button>
            <button className="btn btn-primary flex-[2]" disabled={busy || remoteChanged} onClick={save}>
              {busy ? '保存中…' : '保存して全員に反映'}
            </button>
          </div>
        </div>
      )}

      {askPass && (
        <OwnerLogin
          onCancel={() => setAskPass(false)}
          onSuccess={(p) => {
            setPass(p)
            setAskPass(false)
            startEdit()
          }}
        />
      )}
      <Toast text={toast} />
    </div>
  )
}
