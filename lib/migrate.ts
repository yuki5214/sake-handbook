import { DERBY_GUIDE_SECTION, DERBY_MENU_SECTION, DERBY_OOANA_BODY, DERBY_TRI_BODY, NEW_NOTE, OLD_NOTE } from './derby'
import {
  BEER_BODY,
  BEER_FINAL_ID,
  BEER_GUIDE,
  BEER_OPS,
  BEER_TODOS,
  COUNT_ROLE_ROW,
  DERBY_BODY,
  DERBY_GUIDE,
  EVENT_SUBS,
  MAGNUM_ROW,
  PROCURE_SECTION,
  TICKETS_SECTION,
} from './seed'
import type { Content, Section, SubBlock } from './types'

// 古い保存データを新しい形に補う。
//  - セクション/項目の追加は「足すだけ」で、既存の値は変えない。
//  - 文面の差し替えは、旧い初期文面と完全に一致するもの（＝オーナーが編集していないもの）にだけ行う。
//    オーナーが編集した文面は黙って上書きしない。
export function migrate(c: Content): Content {
  const sections = c.sections.map(normalizeSection)
  if (!sections.some((s) => s.key === TICKETS_SECTION.key)) {
    const i = sections.findIndex((s) => s.key === 'overview')
    sections.splice(i + 1, 0, TICKETS_SECTION)
  }
  if (!sections.some((s) => s.key === PROCURE_SECTION.key)) {
    const i = sections.findIndex((s) => s.key === 'budget')
    sections.splice(i + 1, 0, PROCURE_SECTION)
  }
  // /derby 用の2セクション。保存済みの本文に無いときだけ、企画（events）の次に補う。
  for (const add of [DERBY_GUIDE_SECTION, DERBY_MENU_SECTION]) {
    if (sections.some((s) => s.key === add.key)) continue
    const at = Math.max(sections.findIndex((s) => s.key === 'events'), sections.findIndex((s) => s.key === 'derby'))
    sections.splice(at + 1, 0, add)
  }
  let out = sections.map(addEventSubs).map(updateDerbyDefaults).map(renameDerbyMenu)
  const applied = [...(c.applied ?? [])]
  if (!applied.includes(BEER_FINAL_ID)) {
    out = out.map(applyBeerFinal)
    applied.push(BEER_FINAL_ID)
  }
  return { ...c, sections: out, applied }
}

// ---- 瓶ビールチャレンジ最新方針（目標50本・達成でマグナム開栓）・3連単/大穴の更新（一度だけ） ----

// 旧い初期文面 → 新しい文面。完全一致したときだけ差し替える（編集済みは対象外）。
const LEGACY_TEXT = new Map<string, string>([
  ["馬券1口200円・1人5口・単勝は最大3口。\n当たり券＝当日回収／ハズレ券＝後日使える100円券。\n3連単＝次回ご招待券＋シャンパン1本＋スタッフ全員と乾杯。\n大穴＝シャンパン本数当て→的中で次回イベント参加無料。\n特賞＝シャンパン（店内売価15,000円〜／原価6,000円〜）を前半的中者から抽選。現金別会計。", DERBY_BODY],
  ["メニューダービーは、売れるメニューの番号を競馬みたいに予想して当てる遊びです。馬券は1口200円。単勝=1位を当てて一品サービス、3連単=1〜3位を順番で当てて次回ご招待券＋シャンパン1本＋スタッフ全員と乾杯、大穴(後半)=シャンパンの本数を当てて次回ご招待。外れても次回使える100円券になります。前半=料理/後半=ドリンクで予想。前半に買うと特賞シャンパン抽選の対象。参加は自由、1人最大10口(前半5・後半5)。", DERBY_GUIDE],
  ["20／50／80／100本で全員還元。\n※【未定】還元内容。現状の「%オフ」はチケット制と整合しないため、チケット配布等に置換予定（AZUKIYA相談中）。", BEER_BODY],
  ["『祝・完飲祭』は、みんなで飲んだ瓶ビールの本数でお店全体に特典が出る企画です。飲むほど全員がお得に。乾杯は瓶ビールでぜひ！", BEER_GUIDE],
  ["①瓶ビールが出るたび本数をカウント(カウンター担当1名固定)。②店内ボードの本数メーターを随時更新(20→50→80→100本)。③節目が近づいたら『あと◯本で全員に特典！』と煽る。④到達したら全員に還元(還元方式はAZUKIYA相談中=確定後に差し替え)。⑤100本は隠しゴール(80本まで表示→達成後に解禁)。⑥無料ドリンクは原価の軽いものへ誘導。", BEER_OPS],
  ["①瓶ビールが出るたび本数をカウント(カウンター担当1名固定)。②店内ボードの本数メーターを随時更新(20→50→80→100本)。③節目が近づいたら『あと◯本で全員に特典！』と煽る。④到達したら全員に還元(還元方式はAZUKIYA相談中=確定後に差し替え)。⑤100本は隠しゴール(80本まで表示→達成後に解禁)。⑥無料ドリンクは原価の軽いものへ誘導。⑦乾杯用スパークリングの用意：マグナム(1.5L)を3本用意。内訳は大穴の景品1本、ビールチャレンジ達成時の乾杯に1本(足りなければ2本目を開栓)、予備1本。念のため安価スパークリング750mlを1本用意。", BEER_OPS],
  ["1位〜3位を順番どおりに当てる。的中すると、次回ご招待券＋シャンパン1本＋スタッフ全員と乾杯！", DERBY_TRI_BODY],
  ["シャンパンの本数を当てる。的中すると次回のイベントに無料でご参加いただけます。", DERBY_OOANA_BODY],
])
const swapLegacy = (t: string) => LEGACY_TEXT.get(t) ?? t

// 前回（安価スパークリングを含む版）で自動追加した行・項目。未編集のまま残っていれば取り除く。
const V1_MAGNUM_ROW = ['マグナム（1.5L）', '3本', '', '銘柄未確定／大穴の景品1・乾杯1（足りなければ2本目）・予備1']
const V1_CHEAP_ROW = ['安価スパークリング（750ml）', '1本', '', '念のため用意']
const V1_TODO_TITLE = 'ビールチャレンジ未達時にマグナムを開栓するか'
const sameRow = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])

function applyBeerFinal(s: Section): Section {
  if (s.kind === 'table' && (s.key === 'prep' || s.key === 'procure')) {
    const rows = s.rows.filter((r) => !sameRow(r, V1_MAGNUM_ROW) && !sameRow(r, V1_CHEAP_ROW))
    const has = rows.some((r) => r[0] === MAGNUM_ROW[0])
    return { ...s, rows: has ? rows : [...rows, [...MAGNUM_ROW]] }
  }
  if (s.kind === 'table' && s.key === 'roles') {
    return s.rows.some((r) => r[0] === COUNT_ROLE_ROW[0]) ? s : { ...s, rows: [...s.rows, [...COUNT_ROLE_ROW]] }
  }
  if (s.kind === 'todo') {
    const items = s.items.filter((b) => b.title !== V1_TODO_TITLE || b.decision || b.status !== 'hold')
    const add = BEER_TODOS.filter((t) => !items.some((b) => b.id === t.id))
    return { ...s, items: [...items, ...add] }
  }
  if (s.kind === 'blocks' && (s.key === 'events' || s.key === 'derby')) {
    return {
      ...s,
      items: s.items.map((b) => ({
        ...b,
        body: swapLegacy(b.body),
        subs: b.subs?.map((t) => ({ ...t, body: swapLegacy(t.body) })),
      })),
    }
  }
  return s
}

// ---- 以前の補正（何度かけても同じ結果になる） ----

// 3連単の景品は命名権をやめた。旧い初期文面に残る「命名権」の言い回しだけを差し替える。
const OLD_NAMING = /新メニューの?命名権(（半年間?掲出）)?/g
const TRI_PRIZE = '次回ご招待券＋シャンパン1本＋スタッフ全員と乾杯'
// /derby の遊び方の旧い初期文面（番号表を /derby から外したため、掲示を見る文面に変更）
const OLD_RULE = 'メニューダービーは、人気になるメニューを競馬のように予想して当てる遊びです。馬券は1口200円。メニューの番号で予想してください。前半は料理、後半はドリンクが対象です。'
const NEW_RULE = 'メニューダービーは、人気になるメニューを競馬のように予想して当てる遊びです。馬券は1口200円。お店に掲示している番号表を見て、メニューの番号で予想してください。前半は料理、後半はドリンクが対象です。'
const swapDefault = (t: string) => (t === OLD_RULE ? NEW_RULE : t.replace(OLD_NAMING, TRI_PRIZE))

function updateDerbyDefaults(s: Section): Section {
  if (s.kind !== 'blocks') return s
  if (s.key === 'derby') {
    // 未入力のままの旧・初期項目「締切時刻」は /derby から外した
    const items = s.items.filter((b) => !(b.id === 'dg-deadline' && b.body === '【未定】'))
    // 注記は、旧い初期文面のままのときだけ差し替える
    return { ...s, note: s.note === OLD_NOTE ? NEW_NOTE : s.note, items: items.map((b) => ({ ...b, body: swapDefault(b.body) })) }
  }
  if (s.key === 'events') {
    return {
      ...s,
      items: s.items.map((b) => ({
        ...b,
        body: swapDefault(b.body),
        subs: b.subs?.map((t: SubBlock) => ({ ...t, body: swapDefault(t.body) })),
      })),
    }
  }
  return s
}

// 番号表は /derby から外し、運営側（掲示用）の項目にした。旧い初期タイトルのままのものだけ付け替える。
function renameDerbyMenu(s: Section): Section {
  return s.key === DERBY_MENU_SECTION.key && s.title.includes('お客さん向け') ? { ...s, title: DERBY_MENU_SECTION.title } : s
}

// subs が未設定（旧データ）の企画にだけ小項目を足す。空配列で保存済み＝削除済みなので復活させない。
function addEventSubs(s: Section): Section {
  if (s.kind !== 'blocks' || s.key !== 'events') return s
  return { ...s, items: s.items.map((b) => (b.subs === undefined && EVENT_SUBS[b.id] ? { ...b, subs: EVENT_SUBS[b.id] } : b)) }
}

// 表記統一：店名は AZUKIYA。金種が複数になったため、メニュー/ドリンクの「枚数」列と概要の「1枚の価値」行は廃止。
const unify = (t: string) => t.replaceAll('アズキヤ', 'AZUKIYA')

function normalizeSection(s: Section): Section {
  switch (s.kind) {
    case 'table': {
      if (s.key === 'prep' && !s.columns.includes('金額(円)')) {
        // 旧: [品目, 数量, 担当・備考] → 新: [品名, 数量, 金額(円), メモ]（金額は空で引き継ぎ）
        return {
          ...s,
          columns: ['品名', '数量', '金額(円)', 'メモ'],
          rows: s.rows.map((r) => [r[0] ?? '', r[1] ?? '', '', unify(r[2] ?? '')]),
          sumCol: 2,
          numericCols: [2],
          note: s.note ?? '金額は後から入力できます。合計は入力済みの金額だけで計算します。',
        }
      }
      const drop = s.key === 'menu' || s.key === 'drinks' ? s.columns.indexOf('枚数') : -1
      const keep = (_: string, j: number) => j !== drop
      return {
        ...s,
        title: unify(s.title),
        columns: s.columns.filter(keep).map(unify),
        rows: s.rows.filter((r) => !(s.key === 'overview' && r[0] === '1枚の価値')).map((r) => r.filter(keep).map(unify)),
        sumCol: s.sumCol !== undefined && drop !== -1 && drop < s.sumCol ? s.sumCol - 1 : s.sumCol,
        note: s.note && unify(s.note),
      }
    }
    case 'text':
      return { ...s, title: unify(s.title), text: unify(s.text), note: s.note && unify(s.note) }
    default:
      return {
        ...s,
        title: unify(s.title),
        note: s.note && unify(s.note),
        items: s.items.map((b) => ({
          ...b,
          title: unify(b.title.replace('・価格・枚数', '・価格')),
          body: unify(b.body),
          ...(b.decision !== undefined ? { decision: unify(b.decision) } : {}),
        })),
      }
  }
}
