// 共有本文（handbook.content）の型。セクション配列で持ち、表示/編集は kind ごとの汎用UIで行う。

export type Status = '' | 'decided' | 'hold' | 'skip'
export const STATUSES: Status[] = ['', 'decided', 'hold', 'skip']

// status / decision は要確定リスト（todo）用の共有項目。古い保存データには無いので省略可（無ければ未設定・空欄扱い）
// subs は項目の下に並ぶ小項目（見出し＋本文）。イベント内容の「お客さん用 説明」「スタッフ用 オペレーション」で使う。古い保存データには無いので省略可
export type SubBlock = { id: string; title: string; body: string }
export type Block = { id: string; title: string; body: string; status?: Status; decision?: string; subs?: SubBlock[] }

export type Section =
  | { key: string; title: string; kind: 'table'; columns: string[]; rows: string[][]; sumCol?: number; numericCols?: number[]; note?: string }
  | { key: string; title: string; kind: 'blocks'; items: Block[]; note?: string }
  | { key: string; title: string; kind: 'todo'; items: Block[]; note?: string }
  | { key: string; title: string; kind: 'text'; text: string; note?: string }

export type Content = { version: 1; sections: Section[] }

export type HandbookRow = { content: Content; updated_at: string; updated_by: string | null }

// 数値列（金額）は空欄または半角数字のみ。想定外の値は保存を拒否する（API が 400 を返す）
export const AMOUNT_RE = /^\d{1,12}$/

function validNumericCols(cols: unknown, width: number, rows: string[][]): boolean {
  if (cols === undefined) return true
  if (!Array.isArray(cols) || !cols.every((i) => Number.isInteger(i) && i >= 0 && i < width)) return false
  return rows.every((r) => cols.every((i: number) => r[i] === undefined || r[i] === '' || AMOUNT_RE.test(r[i])))
}

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
          x.rows.every((r) => Array.isArray(r) && r.every((c) => typeof c === 'string')) &&
          validNumericCols(x.numericCols, x.columns.length, x.rows as string[][])
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
              (y.decision === undefined || typeof y.decision === 'string') &&
              (y.subs === undefined ||
                (Array.isArray(y.subs) &&
                  y.subs.every((t) => {
                    const z = t as Record<string, unknown>
                    return z && typeof z.id === 'string' && typeof z.title === 'string' && typeof z.body === 'string'
                  })))
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
