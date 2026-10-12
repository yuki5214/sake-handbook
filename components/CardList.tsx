import type { Section } from '@/lib/types'

type Table = Extract<Section, { kind: 'table' }>

// 選択式の列の見た目（要確定リストのバッジと同じ形）。色は値ごとに固定。
const BADGE: Record<string, string> = {
  良かった点: 'bg-ok-soft text-ok',
  反省点: 'bg-warn-soft text-warn',
  高: 'bg-warn-soft text-warn',
  中: 'bg-accent-soft text-accent',
  低: 'bg-mute-soft text-mute',
  未着手: 'bg-mute-soft text-mute',
  検討中: 'bg-accent-soft text-accent',
  反映済: 'bg-ok-soft text-ok',
}

function Badge({ v, label }: { v: string; label?: string }) {
  if (!v) return null
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[v] ?? 'bg-mute-soft text-mute'}`}>
      {label ? `${label} ${v}` : v}
    </span>
  )
}

function Card({ s, r }: { s: Table; r: string[] }) {
  const sel = (j: number) => s.selectCols?.some((c) => c.col === j)
  const isGroup = (j: number) => s.groupCol === j
  const main = s.columns.findIndex((_, j) => !sel(j))
  return (
    <div className="rounded-lg border border-line/70 p-3">
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{r[main] || <span className="text-mute">—</span>}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        {s.columns.map((c, j) => {
          if (j === main || isGroup(j)) return null
          return sel(j) ? <Badge key={c} v={r[j] ?? ''} label={c} /> : r[j] ? <span key={c} className="text-sub">{c}：{r[j]}</span> : null
        })}
      </div>
    </div>
  )
}

// 選択式の列を持つ表をカードで表示する。groupCol があれば、その列の選択肢ごとに見出しを付けてまとめる。
export default function CardList({ s }: { s: Table }) {
  if (s.rows.length === 0) return <p className="text-sm text-mute">{s.emptyText ?? '（まだありません）'}</p>
  const g = s.groupCol
  const opts = g === undefined ? undefined : s.selectCols?.find((c) => c.col === g)?.options
  if (g === undefined || !opts) {
    return <div className="space-y-3">{s.rows.map((r, i) => <Card key={i} s={s} r={r} />)}</div>
  }
  const groups = [...opts, ...(s.rows.some((r) => !opts.includes(r[g] ?? '')) ? [''] : [])]
  return (
    <div className="space-y-4">
      {groups.map((name) => {
        const rows = s.rows.filter((r) => (opts.includes(r[g] ?? '') ? r[g] : '') === name)
        return (
          <div key={name || 'none'} className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Badge v={name || '未分類'} />
              <span className="text-xs font-normal text-sub">{rows.length}件</span>
            </h3>
            {rows.length === 0 ? (
              <p className="text-sm text-mute">まだ入力されていません</p>
            ) : (
              rows.map((r, i) => <Card key={i} s={s} r={r} />)
            )}
          </div>
        )
      })}
    </div>
  )
}
