import type { Content, Section } from './types'

// /derby（お客さん向け・馬券のQRのリンク先）に出す本文のセクション。
// ここに無いセクション（収支・予算・仕入れなど運営側の情報）は /derby に一切渡さない。
export const DERBY_GUIDE_KEY = 'derby'
export const DERBY_MENU_KEY = 'derby-menu'
const PUBLIC_KEYS: string[] = [DERBY_GUIDE_KEY, DERBY_MENU_KEY]

// 特定の回に固定した文言（「今回」「◯年」など）は入れない。次回も本文の更新だけで使い回す。
export const DERBY_GUIDE_SECTION: Section = {
  key: DERBY_GUIDE_KEY,
  title: 'ダービー案内（お客さん向け・/derby で公開）',
  kind: 'blocks',
  note: 'この項目と「番号表」は、馬券のQRから開くお客さん向けページ /derby にそのまま表示されます。',
  items: [
    {
      id: 'dg-rule',
      title: '遊び方',
      body: 'メニューダービーは、人気になるメニューを競馬のように予想して当てる遊びです。馬券は1口200円。メニューの番号で予想してください。前半は料理、後半はドリンクが対象です。',
    },
    { id: 'dg-tansho', title: '単勝', body: '1位になるメニューを当てる。的中すると一品サービス。' },
    { id: 'dg-sanrentan', title: '3連単', body: '1位〜3位を順番どおりに当てる。的中すると新メニューの命名権（半年間掲出）。' },
    { id: 'dg-ooana', title: '大穴（後半）', body: 'シャンパンの本数を当てる。的中すると次回のイベントに無料でご参加いただけます。' },
    {
      id: 'dg-prize',
      title: '特賞',
      body: 'シャンパン。前半に馬券を買った方のうち、的中者の中から抽選します。1人最大10口（前半5・後半5）まで。',
    },
    { id: 'dg-deadline', title: '締切時刻', body: '【未定】' },
    {
      id: 'dg-miss',
      title: '外れた馬券',
      body: '外れた馬券は、後日のイベントで使える100円券になります。捨てずに保管して、次回お持ちください。当たり馬券は当日スタッフが回収します。',
    },
  ],
}

export const DERBY_MENU_SECTION: Section = {
  key: DERBY_MENU_KEY,
  title: '番号表（お客さん向け・/derby で公開）',
  kind: 'table',
  columns: ['番号', '品名'],
  note: '番号とメニューの対応です。お店の掲示と同じ番号にしてください。',
  rows: [
    ['1', 'となりにトロロ'],
    ['2', '紅の焼豚'],
    ['3', '桃の白和えず'],
    ['4', '生エビフライ'],
    ['5', 'ローストビーフ'],
  ],
}

// 公開してよいセクションだけを取り出す（キーの許可リスト方式）
export function pickDerby(content: Content): Section[] {
  return PUBLIC_KEYS.map((k) => content.sections.find((s) => s.key === k)).filter((s): s is Section => !!s)
}
