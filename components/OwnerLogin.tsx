'use client'

import { useState } from 'react'

// パスコード入力。サーバーで照合できたときだけ onSuccess を呼ぶ。
export default function OwnerLogin({ onSuccess, onCancel }: { onSuccess: (pass: string) => void; onCancel: () => void }) {
  const [input, setInput] = useState('')
  const [err, setErr] = useState('')

  const login = async () => {
    setErr('')
    const r = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: input }),
    }).catch(() => null)
    if (!r?.ok) return setErr(r ? 'パスコードが違います' : '通信に失敗しました')
    onSuccess(input)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="オーナー認証">
      <form
        className="w-full max-w-sm space-y-3 rounded-2xl bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault()
          void login()
        }}
      >
        <h2 className="font-bold">オーナー編集</h2>
        <input type="password" autoFocus className="field" placeholder="パスコード" value={input} onChange={(e) => setInput(e.target.value)} />
        {err && <p className="text-sm text-accent" role="alert">{err}</p>}
        <div className="flex gap-2">
          <button type="button" className="btn flex-1" onClick={onCancel}>キャンセル</button>
          <button type="submit" className="btn btn-primary flex-1">開く</button>
        </div>
      </form>
    </div>
  )
}
