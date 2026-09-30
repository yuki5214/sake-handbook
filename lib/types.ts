// 共有本文（handbook.content）の型。セクション配列で持ち、表示/編集は kind ごとの汎用UIで行う。

export type Status = '' | 'decided' | 'hold' | 'skip'
export const STATUSES: Status[] = ['', 'decided', 'hold', 'skip']

// status / decision は要確定リスト（todo）用の共有項目。古い保存データには無いので省略可（無ければ未設定・空欄扱い）
export type Block = { id: string; title: string; body: string; status?: Status; decision?: string }

export type Section =
  | { key: string; title: string; kind: 'table'; columns: string[]; rows: string[][]; sumCol?: number; note?: string }
  | { key: string; title: string; kind: 'blocks'; items: Block[]; note?: string }
  | { key: string; title: string; kind: 'todo'; items: Block[]; note?: string }
  | { key: string; title: string; kind: 'text'; text: string; note?: string }

export type Content = { version: 1; sections: Section[] }

export type HandbookRow = { content: Content; updated_at: string; updated_by: string | null }

export function isContent(v: unknown): v is Content {
  if (!v || typeof v !== 'object') return false
  const c = v as { version?: unknown; sections?: unknown }
  if (c.version !== 1 || !Array.isArray(c.sections)) return false
  return c.sections.every((s) => {
    if (!s || typeof s !== 'object') return false
    const x = s as Record<string, unknown>
    if (typeof x.key !== 'string' || typeof x.title !== 'string') return false
    switch (x.kind) {
      case 'table':
        return (
          Array.isArray(x.columns) &&
          x.columns.every((c) => typeof c === 'string') &&
          Array.isArray(x.rows) &&
          x.rows.every((r) => Array.isArray(r) && r.every((c) => typeof c === 'string'))
        )
      case 'blocks':
      case 'todo':
        return (
          Array.isArray(x.items) &&
          x.items.every((b) => {
            const y = b as Record<string, unknown>
            return (
              y &&
              typeof y.id === 'string' &&
              typeof y.title === 'string' &&
              typeof y.body === 'string' &&
              (y.status === undefined || STATUSES.includes(y.status as Status)) &&
              (y.decision === undefined || typeof y.decision === 'string')
            )
          })
        )
      case 'text':
        return typeof x.text === 'string'
      default:
        return false
    }
  })
}
