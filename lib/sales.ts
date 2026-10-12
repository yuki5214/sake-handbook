import type { Section } from './types'

type Table = Extract<Section, { kind: 'table' }>

export type SalesRow = { label: string; unit: string; est: number | null; act: number | null; diff: number | null; note: string }
export type SalesTotal = { est: number; act: number | null; diff: number | null }

const toNum = (s: string | undefined) => {
  if (s === undefined || s.trim() === '') return null
  const n = Number(s.replace(/[,，円\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

// 差額＝実績−試算。実績が空欄の行は差額なし（試算が空欄なら 0 とみなす）。
// 合計は単位が「円」の行だけ。実績の合計と差額の合計は、実績を入れた行だけを足す。
export function computeSales(s: Table): { rows: SalesRow[]; total: SalesTotal | null } {
  const d = s.diff
  if (!d) return { rows: [], total: null }
  const rows = s.rows.map((r): SalesRow => {
    const est = toNum(r[d.est])
    const act = toNum(r[d.act])
    return {
      label: r[0] ?? '',
      unit: r[d.unit] ?? '',
      est,
      act,
      diff: act === null ? null : act - (est ?? 0),
      note: r[s.columns.length - 1] ?? '',
    }
  })
  const yen = rows.filter((r) => r.unit === '円')
  if (yen.length === 0) return { rows, total: null }
  const entered = yen.filter((r) => r.act !== null)
  return {
    rows,
    total: {
      est: yen.reduce((a, r) => a + (r.est ?? 0), 0),
      act: entered.length ? entered.reduce((a, r) => a + (r.act ?? 0), 0) : null,
      diff: entered.length ? entered.reduce((a, r) => a + (r.diff ?? 0), 0) : null,
    },
  }
}

export function formatAmount(n: number | null, unit: string): string {
  return n === null ? '' : `${n.toLocaleString('ja-JP')}${unit}`
}
