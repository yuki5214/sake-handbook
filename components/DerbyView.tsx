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

// 閲覧専用。メモ・編集・同期などの機能は持たない。
export default function DerbyView({ sections }: { sections: Section[] }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 pb-12 pt-6">
      <header>
        <h1 className="text-2xl font-bold">メニューダービー</h1>
        <p className="text-sm text-sub">遊び方</p>
      </header>
      {sections.map((s) => {
        if (s.kind === 'blocks') return s.items.map((b) => <Item key={b.id} title={b.title} body={b.body} />)
        return null
      })}
    </div>
  )
}
