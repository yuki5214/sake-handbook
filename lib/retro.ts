import type { Section } from './types'

// イベント後の振り返り用の3セクション（売上実績／良かった点・反省点／次回に向けた改善点）。
// 保存済みの本文に無いときだけ、migrate() が要確定リストの後ろに A→B→C の順で一度だけ足す。
// /derby には出さない（lib/derby.ts の許可リストに入れない）。
export const RETRO_ID = 'retro-sections-2026-10-12'
export const SALES_KEY = 'sales'
export const REVIEW_KEY = 'review'
export const IMPROVE_KEY = 'improve'

export const GOOD = '良かった点'
export const BAD = '反省点'
export const PRIORITIES = ['高', '中', '低']
export const STATES = ['未着手', '検討中', '反映済']

// 列: 項目／単位／試算／実績／備考（差額は 実績−試算 を表示時に計算するので保存しない）
export function salesSection(est: { visitors: number; entryFee: number; bets: number; betCount: number; dining: number }): Section {
  const row = (label: string, unit: string, e: number | null, note = ''): string[] => [label, unit, e === null ? '' : String(e), '', note]
  return {
    key: SALES_KEY,
    title: '売上（実績）',
    kind: 'table',
    columns: ['項目', '単位', '試算', '実績', '備考'],
    rows: [
      row('実来場者数', '人', est.visitors),
      row(`参加費（500円×人数）`, '円', est.entryFee),
      row('馬券（販売口数×200円）', '円', est.bets, `試算は${est.betCount}口`),
      row('前売り券（入金額）', '円', null, 'ticket-roster の集計から手入力'),
      row('当日券', '円', null),
      row('はなれ飲食売上', '円', est.dining, '試算は両店の合計。店別の内訳は未設定'),
      row('AZUKIYA飲食売上', '円', null),
      row('シャンパン等の現金販売', '円', null),
      row('瓶ビール本数（目標50本）', '本', 50),
      row('その他', '円', null),
    ],
    numericCols: [2, 3],
    selectCols: [{ col: 1, options: ['円', '人', '本'], initial: '円' }],
    diff: { unit: 1, est: 2, act: 3 },
    emptyText: 'まだ入力されていません',
    note: '差額＝実績−試算。実績が空欄の行は、合計と差額に含めません。合計は単位が「円」の行だけです。前売り券の入金額は ticket-roster の集計から手入力します（連携はしません）。',
  }
}

export const REVIEW_SECTION: Section = {
  key: REVIEW_KEY,
  title: '良かった点・反省点',
  kind: 'table',
  columns: ['区分', '内容'],
  rows: [],
  selectCols: [{ col: 0, options: [GOOD, BAD], initial: GOOD }],
  groupCol: 0,
  emptyText: 'まだ入力されていません',
}

export const IMPROVE_SECTION: Section = {
  key: IMPROVE_KEY,
  title: '次回に向けた改善点',
  kind: 'table',
  columns: ['内容', '優先度', '担当', '状態'],
  rows: [],
  selectCols: [
    { col: 1, options: PRIORITIES, initial: '中' },
    { col: 3, options: STATES, initial: '未着手' },
  ],
  emptyText: 'まだ入力されていません',
}
