'use client'

import { memoKey, todoKey, useLocal, type Status, type TodoLocal } from '@/lib/local'
import type { Block, Section } from '@/lib/types'

const isPlaceholder = (s: string) => s.includes('【未定】')

function Cell({ v }: { v: string }) {
  if (!v) return <span className="text-mute">—</span>
  return <span className={isPlaceholder(v) ? 'rounded bg-warn-soft px-1 text-warn' : ''}>{v}</span>
}

const num = (s: string) => {
  const n = Number(s.replace(/[,，円\s]/g, ''))
  return s.trim() !== '' && Number.isFinite(n) ? n : null
}

function Table({ s }: { s: Extract<Section, { kind: 'table' }> }) {
  const sumCol = s.sumCol
  const total = sumCol !== undefined ? s.rows.reduce((a, r) => a + (num(r[sumCol] ?? '') ?? 0), 0) : null
  return (
    <div className="space-y-2">
      {/* 狭い画面ではカード積み、広い画面では表 */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-sub">
              {s.columns.map((c) => (
                <th key={c} className="px-2 py-1.5 font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.rows.map((r, i) => (
              <tr key={i} className="border-b border-line/60 align-top">
                {s.columns.map((c, j) => (
                  <td key={c} className="whitespace-pre-wrap px-2 py-1.5"><Cell v={r[j] ?? ''} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 sm:hidden">
        {s.rows.map((r, i) => (
          <li key={i} className="rounded-lg border border-line/70 p-2.5 text-sm">
            <div className="font-semibold"><Cell v={r[0] ?? ''} /></div>
            {s.columns.slice(1).map((c, j) =>
              r[j + 1] ? (
                <div key={c} className="mt-0.5 flex gap-2">
                  {s.columns.length > 2 && <span className="w-16 shrink-0 text-xs text-sub">{c}</span>}
                  <span className="whitespace-pre-wrap"><Cell v={r[j + 1]} /></span>
                </div>
              ) : null,
            )}
          </li>
        ))}
      </ul>
      {total !== null && (
        <div className="flex justify-end gap-2 text-sm font-bold tabular">
          <span className="text-sub">合計</span>
          <span>{total.toLocaleString('ja-JP')}円</span>
        </div>
      )}
    </div>
  )
}

function Blocks({ items }: { items: Block[] }) {
  return (
    <div className="space-y-3">
      {items.map((b) => (
        <div key={b.id} className="rounded-lg border border-line/70 p-3">
          <div className="font-semibold">{b.title}</div>
          {b.body && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed"><Cell v={b.body} /></p>}
        </div>
      ))}
    </div>
  )
}

const STATUS: { v: Status; label: string; cls: string }[] = [
  { v: 'decided', label: '決定', cls: 'bg-ok-soft text-ok border-ok' },
  { v: 'hold', label: '保留', cls: 'bg-warn-soft text-warn border-warn' },
  { v: 'skip', label: '不要', cls: 'bg-mute-soft text-mute border-mute' },
]

function TodoItem({ b }: { b: Block }) {
  const [l, setL] = useLocal<TodoLocal>(todoKey(b.id), { status: '', memo: '' })
  return (
    <div className="rounded-lg border border-line/70 p-3">
      <div className={`font-semibold ${l.status === 'skip' ? 'text-mute line-through' : ''}`}>{b.title}</div>
      {b.body && <p className="mt-1 whitespace-pre-wrap text-sm text-sub">{b.body}</p>}
      <div className="mt-2 flex gap-2" role="group" aria-label={`${b.title}のステータス（この端末のみ）`}>
        {STATUS.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={l.status === o.v}
            onClick={() => setL({ ...l, status: l.status === o.v ? '' : o.v })}
            className={`flex-1 rounded-lg border px-2 py-2 text-sm font-semibold ${
              l.status === o.v ? o.cls : 'border-line text-sub'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <textarea
        className="field mt-2 text-sm"
        rows={1}
        placeholder="自分用メモ（この端末のみ）"
        value={l.memo}
        onChange={(e) => setL({ ...l, memo: e.target.value })}
      />
    </div>
  )
}

export function LocalMemo({ sectionKey }: { sectionKey: string }) {
  const [memo, setMemo] = useLocal<string>(memoKey(sectionKey), '')
  return (
    <label className="mt-3 block rounded-lg bg-mute-soft p-2.5">
      <span className="mb-1 block text-xs font-semibold text-sub">📝 自分のメモ（この端末だけ・共有されません）</span>
      <textarea
        className="field text-sm"
        rows={2}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="気づいたこと、質問など"
      />
    </label>
  )
}

export default function SectionView({ s }: { s: Section }) {
  return (
    <section id={`sec-${s.key}`} className="rounded-2xl border border-line bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-accent">{s.title}</h2>
      {s.kind === 'table' && <Table s={s} />}
      {s.kind === 'blocks' && <Blocks items={s.items} />}
      {s.kind === 'text' && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed"><Cell v={s.text} /></p>
      )}
      {s.kind === 'todo' && (
        <div className="space-y-3">
          {s.items.map((b) => <TodoItem key={b.id} b={b} />)}
        </div>
      )}
      {s.note && <p className="mt-2 text-xs text-sub">{s.note}</p>}
      <LocalMemo sectionKey={s.key} />
    </section>
  )
}
