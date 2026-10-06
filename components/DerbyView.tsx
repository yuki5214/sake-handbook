import type { Section } from '@/lib/types'

// 未確定の印は、お客さん向けには「準備中」と表示する
const show = (v: string) => (v.includes('【未定】') ? '準備中' : v)

function Item({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <h3 className="font-bold text-accent">{title}</h3>
      {body && <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed">{show(body)}</p>}
    </div>
  )
}

function MenuTable({ s }: { s: Extract<Section, { kind: 'table' }> }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <h3 className="mb-2 font-bold text-accent">{s.title.replace(/（.*?）/, '')}</h3>
      <ul className="divide-y divide-line">
        {s.rows.map((r, i) => (
          <li key={i} className="flex items-baseline gap-3 py-2">
            <span className="w-8 shrink-0 text-center text-xl font-bold tabular text-accent">{r[0]}</span>
            <span className="flex-1">{show(r[1] ?? '')}</span>
            {r[2] && <span className="shrink-0 text-sm text-sub">{show(r[2])}</span>}
          </li>
        ))}
      </ul>
      {s.note && <p className="mt-2 text-xs text-sub">{s.note}</p>}
    </div>
  )
}

// 閲覧専用。メモ・編集・同期などの機能は持たない。
export default function DerbyView({ sections }: { sections: Section[] }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 pb-12 pt-6">
      <header>
        <h1 className="text-2xl font-bold">メニューダービー</h1>
        <p className="text-sm text-sub">遊び方と番号表</p>
      </header>
      {sections.map((s) => {
        if (s.kind === 'blocks') return s.items.map((b) => <Item key={b.id} title={b.title} body={b.body} />)
        if (s.kind === 'table') return <MenuTable key={s.key} s={s} />
        return null
      })}
    </div>
  )
}
