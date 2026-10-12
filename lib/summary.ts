import { computeSales } from './sales'
import type { Section } from './types'

type Table = Extract<Section, { kind: 'table' }>

const countText = (v: unknown, t: string) => JSON.stringify(v).split(t).length - 1

const toNum = (s: string | undefined) => {
  const n = Number((s ?? '').replace(/[,，円\s]/g, ''))
  return (s ?? '').trim() !== '' && Number.isFinite(n) ? n : null
}

const countBy = (rows: string[][], col: number, options: string[]) =>
  options.map((o) => `${o} ${rows.filter((r) => r[col] === o).length}`).join('・')

function tableSummary(s: Table): string {
  if (s.rows.length === 0) return 'まだ入力されていません'
  if (s.diff) {
    const { rows } = computeSales(s)
    return `実績 ${rows.filter((r) => r.act !== null).length}/${rows.length} 行を入力済み`
  }
  const sel = s.selectCols?.find((c) => c.col === (s.groupCol ?? -1)) ?? s.selectCols?.[s.selectCols.length - 1]
  if (sel) return countBy(s.rows, sel.col, sel.options)
  if (s.sumCol !== undefined) {
    const col = s.sumCol
    const nums = s.rows.map((r) => toNum(r[col])).filter((n): n is number => n !== null)
    return nums.length ? `${s.rows.length}行・入力済みの合計 ${nums.reduce((a, n) => a + n, 0).toLocaleString('ja-JP')}円` : `${s.rows.length}行・金額は未入力`
  }
  return `${s.rows.length}行`
}

/** 目次のカードに出す1行の要約。内容は本文から計算する（保存はしない）。未確定の印（【未定】）が残っていれば件数を足す。 */
export function summarizeSection(s: Section): string {
  const pending = countText(s, '【未定】')
  let text: string
  switch (s.kind) {
    case 'table':
      text = tableSummary(s)
      break
    case 'blocks':
      text = `${s.items.length}項目`
      break
    case 'todo': {
      const decided = s.items.filter((b) => b.status === 'decided').length
      text = `決定 ${decided}/${s.items.length}`
      break
    }
    case 'text':
      text = s.text.trim() ? '記入あり' : 'まだ入力されていません'
      break
  }
  return pending > 0 ? `${text}・【未定】${pending}件` : text
}
