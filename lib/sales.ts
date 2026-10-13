import type { Section } from './types'

type Table = Extract<Section, { kind: 'table' }>

export type SalesRow = { label: string; unit: string; est: number | null; act: number | null; diff: number | null; note: string }
// 合計はどれも「実績を入れた行」だけを足す（実績が空欄の行は試算・実績・差額のどの合計にも含めない）。1行も無ければ null
export type SalesTotal = { est: number | null; act: number | null; diff: number | null }

const toNum = (s: string | undefined) => {
  if (s === undefined || s.trim() === '') return null
  const n = Number(s.replace(/[,，円\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

// 差額＝実績−試算。実績が空欄の行は差額なし（試算が空欄なら 0 とみなす）。
// 合計は単位が「円」の行のうち、実績を入れた行だけ（試算の合計も同じ行だけ足すので、実績の合計−試算の合計＝差額の合計になる）。
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
      est: entered.length ? entered.reduce((a, r) => a + (r.est ?? 0), 0) : null,
      act: entered.length ? entered.reduce((a, r) => a + (r.act ?? 0), 0) : null,
      diff: entered.length ? entered.reduce((a, r) => a + (r.diff ?? 0), 0) : null,
    },
  }
}

export function formatAmount(n: number | null, unit: string): string {
  return n === null ? '' : `${n.toLocaleString('ja-JP')}${unit}`
}
