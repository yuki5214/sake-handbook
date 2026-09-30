'use client'

import type { Section, Status } from '@/lib/types'

const STATUS_OPTS: { v: Status; label: string }[] = [
  { v: '', label: '未定' },
  { v: 'decided', label: '決定' },
  { v: 'hold', label: '保留' },
  { v: 'skip', label: '不要' },
]

const newId = () => `b-${Math.random().toString(36).slice(2, 9)}`

function RemoveBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="shrink-0 rounded-lg px-2 text-lg text-sub">
      ✕
    </button>
  )
}

export default function SectionEditor({ s, onChange }: { s: Section; onChange: (s: Section) => void }) {
  return (
    <section id={`sec-${s.key}`} className="rounded-2xl border-2 border-accent/60 bg-card p-4">
      <h2 className="mb-3 text-lg font-bold text-accent">
        {s.title}
        <span className="ml-2 text-xs font-normal text-sub">編集中</span>
      </h2>

      {s.kind === 'table' && (
        <div className="space-y-3">
          {s.rows.map((r, i) => {
            const move = (d: -1 | 1) => {
              const rows = [...s.rows]
              ;[rows[i], rows[i + d]] = [rows[i + d], rows[i]]
              onChange({ ...s, rows })
            }
            return (
              <div key={i} className="flex items-start gap-1 rounded-lg border border-line/70 p-2">
                <div className="grid flex-1 gap-1.5">
                  {s.columns.map((c, j) => {
                    const set = (v: string) => {
                      const rows = s.rows.map((x) => [...x])
                      rows[i][j] = v
                      onChange({ ...s, rows })
                    }
                    const numeric = s.numericCols?.includes(j)
                    return (
                      <label key={c} className="block">
                        <span className="text-xs text-sub">{c}{numeric ? '（数字のみ・空欄可）' : ''}</span>
                        {numeric ? (
                          <input
                            className="field tabular"
                            inputMode="numeric"
                            value={r[j] ?? ''}
                            placeholder="未入力"
                            // 全角数字・カンマ・円などは落として半角数字だけ残す
                            onChange={(e) =>
                              set(e.target.value.replace(/[０-９]/g, (d) => String(d.charCodeAt(0) - 0xff10)).replace(/\D/g, '').slice(0, 12))
                            }
                          />
                        ) : (
                          <textarea
                            className="field"
                            rows={j === 0 || s.columns.length > 3 ? 1 : 2}
                            value={r[j] ?? ''}
                            onChange={(e) => set(e.target.value)}
                          />
                        )}
                      </label>
                    )
                  })}
                </div>
                <div className="flex shrink-0 flex-col">
                  <button type="button" aria-label="上へ" disabled={i === 0} onClick={() => move(-1)} className="rounded-lg px-2 py-1 text-lg text-sub disabled:opacity-30">↑</button>
                  <button type="button" aria-label="下へ" disabled={i === s.rows.length - 1} onClick={() => move(1)} className="rounded-lg px-2 py-1 text-lg text-sub disabled:opacity-30">↓</button>
                  <RemoveBtn label="この行を削除" onClick={() => onChange({ ...s, rows: s.rows.filter((_, k) => k !== i) })} />
                </div>
              </div>
            )
          })}
          <button
            type="button"
            className="btn"
            onClick={() => onChange({ ...s, rows: [...s.rows, s.columns.map(() => '')] })}
          >
            ＋ 行を追加
          </button>
        </div>
      )}

      {(s.kind === 'blocks' || s.kind === 'todo') && (
        <div className="space-y-3">
          {s.items.map((b, i) => {
            const set = (patch: Partial<typeof b>) =>
              onChange({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, ...patch } : x)) })
            const move = (d: -1 | 1) => {
              const items = [...s.items]
              ;[items[i], items[i + d]] = [items[i + d], items[i]]
              onChange({ ...s, items })
            }
            return (
              <div key={b.id} className="flex items-start gap-1 rounded-lg border border-line/70 p-2">
                <div className="grid flex-1 gap-1.5">
                  <input className="field font-semibold" value={b.title} placeholder="見出し" onChange={(e) => set({ title: e.target.value })} />
                  <textarea className="field" rows={3} value={b.body} placeholder="内容・論点" onChange={(e) => set({ body: e.target.value })} />
                  {s.kind === 'todo' && (
                    <>
                      <div className="flex gap-1.5" role="group" aria-label="ステータス（全員に共有）">
                        {STATUS_OPTS.map((o) => (
                          <button
                            key={o.v}
                            type="button"
                            aria-pressed={(b.status ?? '') === o.v}
                            onClick={() => set({ status: o.v })}
                            className={`flex-1 rounded-lg border px-2 py-2 text-sm font-semibold ${
                              (b.status ?? '') === o.v ? 'border-accent bg-accent-soft text-accent' : 'border-line text-sub'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="field"
                        rows={2}
                        value={b.decision ?? ''}
                        placeholder="決定内容（全員に共有されます）"
                        onChange={(e) => set({ decision: e.target.value })}
                      />
                    </>
                  )}
                </div>
                <div className="flex shrink-0 flex-col">
                  <button type="button" aria-label="上へ" disabled={i === 0} onClick={() => move(-1)} className="rounded-lg px-2 py-1 text-lg text-sub disabled:opacity-30">↑</button>
                  <button type="button" aria-label="下へ" disabled={i === s.items.length - 1} onClick={() => move(1)} className="rounded-lg px-2 py-1 text-lg text-sub disabled:opacity-30">↓</button>
                  <RemoveBtn label="この項目を削除" onClick={() => onChange({ ...s, items: s.items.filter((_, k) => k !== i) })} />
                </div>
              </div>
            )
          })}
          <button
            type="button"
            className="btn"
            onClick={() => onChange({ ...s, items: [...s.items, { id: newId(), title: '', body: '', ...(s.kind === 'todo' ? { status: '' as Status, decision: '' } : {}) }] })}
          >
            ＋ 項目を追加
          </button>
        </div>
      )}

      {s.kind === 'text' && (
        <textarea className="field" rows={8} value={s.text} onChange={(e) => onChange({ ...s, text: e.target.value })} />
      )}
    </section>
  )
}
