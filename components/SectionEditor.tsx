'use client'

import type { Section } from '@/lib/types'

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
          {s.rows.map((r, i) => (
            <div key={i} className="flex items-start gap-1 rounded-lg border border-line/70 p-2">
              <div className="grid flex-1 gap-1.5">
                {s.columns.map((c, j) => (
                  <label key={c} className="block">
                    <span className="text-xs text-sub">{c}</span>
                    <textarea
                      className="field"
                      rows={j === 0 || s.columns.length > 3 ? 1 : 2}
                      value={r[j] ?? ''}
                      onChange={(e) => {
                        const rows = s.rows.map((x) => [...x])
                        rows[i][j] = e.target.value
                        onChange({ ...s, rows })
                      }}
                    />
                  </label>
                ))}
              </div>
              <RemoveBtn label="この行を削除" onClick={() => onChange({ ...s, rows: s.rows.filter((_, k) => k !== i) })} />
            </div>
          ))}
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
          {s.items.map((b, i) => (
            <div key={b.id} className="flex items-start gap-1 rounded-lg border border-line/70 p-2">
              <div className="grid flex-1 gap-1.5">
                <input
                  className="field font-semibold"
                  value={b.title}
                  placeholder="見出し"
                  onChange={(e) =>
                    onChange({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })
                  }
                />
                <textarea
                  className="field"
                  rows={4}
                  value={b.body}
                  placeholder="内容"
                  onChange={(e) =>
                    onChange({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, body: e.target.value } : x)) })
                  }
                />
              </div>
              <RemoveBtn label="この項目を削除" onClick={() => onChange({ ...s, items: s.items.filter((_, k) => k !== i) })} />
            </div>
          ))}
          <button
            type="button"
            className="btn"
            onClick={() => onChange({ ...s, items: [...s.items, { id: newId(), title: '', body: '' }] })}
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
