// 共有本文（handbook.content）の型。セクション配列で持ち、表示/編集は kind ごとの汎用UIで行う。

export type Status = '' | 'decided' | 'hold' | 'skip'
export const STATUSES: Status[] = ['', 'decided', 'hold', 'skip']

// status / decision は要確定リスト（todo）用の共有項目。古い保存データには無いので省略可（無ければ未設定・空欄扱い）
// subs は項目の下に並ぶ小項目（見出し＋本文）。イベント内容の「お客さん用 説明」「スタッフ用 オペレーション」で使う。古い保存データには無いので省略可
export type SubBlock = { id: string; title: string; body: string }
export type Block = { id: string; title: string; body: string; status?: Status; decision?: string; subs?: SubBlock[] }

// 表の拡張（いずれも省略可。古い保存データには無い）
//  - selectCols: その列を選択式にする。値は空欄か options のどれか。initial は「行を追加」したときの初期値
//  - groupCol: 表示時に、その列の値（selectCols の options の順）で見出しを付けてまとめる
//  - diff: 試算と実績の差額（実績−試算）を計算して表示する列の指定。unit が「円」の行だけ合計に入れる
//  - emptyText: 行が無いときの表示
export type SelectCol = { col: number; options: string[]; initial?: string }
export type DiffCols = { unit: number; est: number; act: number }
export type Section =
  | {
      key: string
      title: string
      kind: 'table'
      columns: string[]
      rows: string[][]
      sumCol?: number
      numericCols?: number[]
      selectCols?: SelectCol[]
      groupCol?: number
      diff?: DiffCols
      emptyText?: string
      note?: string
    }
  | { key: string; title: string; kind: 'blocks'; items: Block[]; note?: string }
  | { key: string; title: string; kind: 'todo'; items: Block[]; note?: string }
  | { key: string; title: string; kind: 'text'; text: string; note?: string }

// applied: 読み込み時補正（migrate）で「一度だけ足した」項目の記録。保存後は、オーナーが削除しても復活させない。
export type Content = { version: 1; sections: Section[]; applied?: string[] }

export type HandbookRow = { content: Content; updated_at: string; updated_by: string | null }

// 数値列（金額）は空欄または半角数字のみ。想定外の値は保存を拒否する（API が 400 を返す）
export const AMOUNT_RE = /^\d{1,12}$/

function validNumericCols(cols: unknown, width: number, rows: string[][]): boolean {
  if (cols === undefined) return true
  if (!Array.isArray(cols) || !cols.every((i) => Number.isInteger(i) && i >= 0 && i < width)) return false
  return rows.every((r) => cols.every((i: number) => r[i] === undefined || r[i] === '' || AMOUNT_RE.test(r[i])))
}

const isIdx = (v: unknown, width: number) => Number.isInteger(v) && (v as number) >= 0 && (v as number) < width

function validSelectCols(sel: unknown, width: number, rows: string[][]): boolean {
  if (sel === undefined) return true
  if (!Array.isArray(sel)) return false
  return sel.every((x) => {
    const y = x as { col?: unknown; options?: unknown; initial?: unknown }
    if (!y || !isIdx(y.col, width) || !Array.isArray(y.options) || !y.options.every((o) => typeof o === 'string')) return false
    const opts = y.options as string[]
    if (y.initial !== undefined && !(typeof y.initial === 'string' && (y.initial === '' || opts.includes(y.initial)))) return false
    return rows.every((r) => r[y.col as number] === undefined || r[y.col as number] === '' || opts.includes(r[y.col as number]))
  })
}

function validExtras(x: Record<string, unknown>, width: number): boolean {
  const d = x.diff as { unit?: unknown; est?: unknown; act?: unknown } | undefined
  if (d !== undefined && !(d && isIdx(d.unit, width) && isIdx(d.est, width) && isIdx(d.act, width))) return false
  if (x.groupCol !== undefined && !isIdx(x.groupCol, width)) return false
  return x.emptyText === undefined || typeof x.emptyText === 'string'
}

export function isContent(v: unknown): v is Content {
  if (!v || typeof v !== 'object') return false
  const c = v as { version?: unknown; sections?: unknown }
  if (c.version !== 1 || !Array.isArray(c.sections)) return false
  const applied = (c as { applied?: unknown }).applied
  if (applied !== undefined && !(Array.isArray(applied) && applied.every((a) => typeof a === 'string'))) return false
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
          validNumericCols(x.numericCols, x.columns.length, x.rows as string[][]) &&
          validSelectCols(x.selectCols, x.columns.length, x.rows as string[][]) &&
          validExtras(x, x.columns.length)
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
