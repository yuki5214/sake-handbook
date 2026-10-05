import type { Content, Section, SubBlock } from './types'

// チケット金種（券面の組み合わせ）。保存済みの本文に無い場合は migrate() が概要の次に挿入する。
export const TICKETS_SECTION: Section = {
  key: 'tickets',
  title: 'チケット金種',
  kind: 'table',
  columns: ['券種', '内訳（金種×枚数）', '備考'],
  rows: [
    ['当日券 1,000円', '500×1・100×5', ''],
    ['当日券 3,000円', '500×5・300×1・200×1', ''],
    ['前売り 3,000円', '500×6・300×1', '3,300円分'],
    ['前売り 5,000円', '1,000×4・500×3', '5,500円分'],
    ['前売り 10,000円', '1,000×7・2,000×1・500×4', '11,000円分／VIP'],
  ],
}

// 仕入れ表。保存済みの本文に無い場合は migrate() が予算の次に挿入する。
export const PROCURE_SECTION: Section = {
  key: 'procure',
  title: '仕入れ表',
  kind: 'table',
  columns: ['品名', '数量', '金額(円)', 'メモ'],
  rows: [],
  sumCol: 2,
  numericCols: [2],
  note: '会議・当日に追加できます。金額は後から入力でき、合計は入力済みの金額だけで計算します。メモに担当・店など。',
}

// 企画ごとの小項目（お客さん用説明＋スタッフ用オペ）。保存済みの本文で subs が未設定のときだけ migrate() が補う。
const guide = (id: string, body: string): SubBlock => ({ id: `${id}-guide`, title: 'お客さん用 説明一例', body })
const ops = (id: string, body: string): SubBlock => ({ id: `${id}-ops`, title: 'スタッフ用 オペレーション', body })

const DERBY_SUBS: SubBlock[] = [
  guide(
    'ev-derby',
    'メニューダービーは、売れるメニューの番号を競馬みたいに予想して当てる遊びです。馬券は1口200円。単勝=1位を当てて一品サービス、3連単=1〜3位を順番で当てて新メニュー命名権、大穴(後半)=シャンパンの本数を当てて次回ご招待。外れても次回使える100円券になります。前半=料理/後半=ドリンクで予想。前半に買うと特賞シャンパン抽選の対象。参加は自由、1人最大10口(前半5・後半5)。',
  ),
  ops(
    'ev-derby',
    '①ファーストオーダー時は説明のみ(ここでは売らない)。②頃合いを見て『馬券どうです？』と促す。③買うと言われたら券種(単勝/3連単/大穴)と賭けるメニュー番号を聞き、名刺サイズの馬券に記入。使わない券種は斜線で消す。④口数確認(前半5・後半5=最大10口)、1口200円を受取。⑤前半購入者はメモ紙に名前を書いてもらい抽選箱へ(特賞シャンパンの対象)。⑥外れ券は客に渡す(次回100円券)、当たり券は当日回収。締切後は購入・変更不可。締切〜発表の間は特定メニューを勧めない。メニューは番号で予想するので、番号⇔メニュー対応表を受付/カウンターに掲示。',
  ),
]

const BEER_SUBS: SubBlock[] = [
  guide(
    'ev-beer',
    '『祝・完飲祭』は、みんなで飲んだ瓶ビールの本数でお店全体に特典が出る企画です。飲むほど全員がお得に。乾杯は瓶ビールでぜひ！',
  ),
  ops(
    'ev-beer',
    '①瓶ビールが出るたび本数をカウント(カウンター担当1名固定)。②店内ボードの本数メーターを随時更新(20→50→80→100本)。③節目が近づいたら『あと◯本で全員に特典！』と煽る。④到達したら全員に還元(還元方式はAZUKIYA相談中=確定後に差し替え)。⑤100本は隠しゴール(80本まで表示→達成後に解禁)。⑥無料ドリンクは原価の軽いものへ誘導。',
  ),
]

const EVENT_SUBS: Record<string, SubBlock[]> = { 'ev-derby': DERBY_SUBS, 'ev-beer': BEER_SUBS }

// 古い保存データを新しい形に補う（項目の追加は常に「足すだけ」で、既存の値は変えない）
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
  return { ...c, sections: sections.map(addEventSubs) }
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

// 初期本文。DBに行が無いときの表示。「【未定】」はAZUKIYA回答待ちのプレースホルダ。
export const SEED: Content = {
  version: 1,
  sections: [
    {
      key: 'overview',
      title: '概要',
      kind: 'table',
      columns: ['項目', '内容'],
      rows: [
        ['日程', '10/11(日) OPEN 17:00 – CLOSE 22:00'],
        ['会場', 'くうかい はなれ（全席立ち飲み）'],
        ['参加費', '500円'],
        ['参加者数', '50名（9/30時点）'],
        ['前売り券', '3,000円券→3,300円分／5,000円券→5,500円分／10,000円券→11,000円分（各+10%・10,000円=VIP認定）'],
        ['前売り実績', '前売り23枚・122,000円（当日含む券面総額124,000円／未入金124,000円）※9/30時点 ticket-roster'],
        ['当日券', '1,000円'],
      ],
    },
    TICKETS_SECTION,
    {
      key: 'schedule',
      title: 'タイムスケジュール',
      kind: 'table',
      columns: ['時間', '内容', '担当'],
      rows: [
        ['16:30', 'VIP先行入店（開店30分前）', '【未定】'],
        ['17:00', 'OPEN／ファーストドリンク', '【未定】'],
        ['【未定】', 'メニューダービー 前半 締切・抽選', '【未定】'],
        ['【未定】', 'じゃんけん大会', '【未定】'],
        ['【未定】', '瓶ビールチャレンジ', '【未定】'],
        ['22:00', 'CLOSE', ''],
      ],
    },
    {
      key: 'events',
      title: 'イベント内容',
      kind: 'blocks',
      items: [
        {
          id: 'ev-derby',
          title: 'メニューダービー',
          body:
            '馬券1口200円・1人5口・単勝は最大3口。\n当たり券＝当日回収／ハズレ券＝後日使える100円券。\n3連単＝新メニュー命名権（半年掲出）。\n大穴＝シャンパン本数当て→的中で次回イベント参加無料。\n特賞＝シャンパン（店内売価15,000円〜／原価6,000円〜）を前半的中者から抽選。現金別会計。',
          subs: DERBY_SUBS,
        },
        {
          id: 'ev-janken',
          title: 'じゃんけん大会',
          body: '食事券20,000円分（両店可・期限3ヶ月・1回5,000円上限）。',
        },
        {
          id: 'ev-beer',
          title: '瓶ビールチャレンジ',
          body:
            '20／50／80／100本で全員還元。\n※【未定】還元内容。現状の「%オフ」はチケット制と整合しないため、チケット配布等に置換予定（AZUKIYA相談中）。',
          subs: BEER_SUBS,
        },
        {
          id: 'ev-vip',
          title: 'VIP（前売り10,000円）',
          body: '特典：開店30分前の先行入店／ファーストドリンク無料／シャンパン3,000円オフ（現金）。',
        },
        { id: 'ev-prize', title: '景品', body: '【未定】' },
      ],
    },
    {
      key: 'flow',
      title: '動線',
      kind: 'text',
      text: '【未定】入口・受付（前売り確認／参加費500円）・ドリンク場所・フード受け渡し・トイレ・クローク・馬券販売/回収場所を記入',
    },
    {
      key: 'prep',
      title: '準備物',
      kind: 'table',
      columns: ['品名', '数量', '金額(円)', 'メモ'],
      rows: [
        ['チケット（100円券）', '【未定】', '', ''],
        ['馬券・投票箱', '【未定】', '', ''],
        ['シャンパン', '【未定】', '', '特賞・大穴用'],
        ['受付用 名簿（ticket-roster）', '1', '', 'スマホで確認'],
      ],
      sumCol: 2,
      numericCols: [2],
      note: '金額は後から入力できます。合計は入力済みの金額だけで計算します。',
    },
    {
      key: 'budget',
      title: '予算',
      kind: 'table',
      columns: ['項目', '金額(円)', '備考'],
      rows: [
        ['食事券（じゃんけん景品）', '20000', '両店可・使用時に按分'],
        ['シャンパン（特賞）', '6000', '原価6,000円〜'],
        ['【未定】', '', ''],
      ],
      sumCol: 1,
    },
    PROCURE_SECTION,
    {
      key: 'revenue',
      title: '収支',
      kind: 'table',
      columns: ['項目', '金額(円)', '備考'],
      rows: [
        ['参加費（500円×50名）', '25000', '9/30時点'],
        ['前売り券（23枚）', '122000', '9/30時点・当日含む券面総額124,000円／未入金124,000円（ticket-roster）'],
        ['当日券', '【未定】', '1,000円'],
      ],
      sumCol: 1,
      note: '合計は数字が入っている行のみ集計されます。',
    },
    {
      key: 'menu',
      title: 'メニュー',
      kind: 'table',
      columns: ['メニュー', '価格(円)', '備考'],
      rows: [
        ['となりにトロロ', '500', 'はなれ'],
        ['紅の焼豚', '500', 'はなれ'],
        ['桃の白和えず', '400', 'はなれ'],
        ['生エビフライ', '300', 'はなれ'],
        ['ローストビーフ', '500', 'はなれ'],
        ['AZUKIYAメニュー', '【未定】', 'AZUKIYA回答待ち'],
      ],
    },
    {
      key: 'drinks',
      title: 'ドリンク',
      kind: 'table',
      columns: ['ドリンク', '価格(円)', '備考'],
      rows: [
        ['ドリンク全品', '500', ''],
        ['シャンパン', '【未定】', 'VIPは3,000円オフ（現金）'],
      ],
    },
    {
      key: 'roles',
      title: '役割分担',
      kind: 'table',
      columns: ['役割', '担当', '備考'],
      rows: [
        ['受付・前売り確認', '【未定】', ''],
        ['馬券販売・回収', '【未定】', ''],
        ['フード（はなれ）', '【未定】', ''],
        ['ドリンク', '【未定】', ''],
        ['司会・進行', '【未定】', ''],
      ],
    },
    {
      key: 'todo',
      title: '要確定リスト',
      kind: 'todo',
      items: [
        { id: 'td-beer', title: '瓶ビールチャレンジの還元内容', body: '%オフではなくチケット配布等に置換。AZUKIYA相談中。' },
        { id: 'td-azukiya-menu', title: 'AZUKIYAのメニュー・価格', body: '' },
        { id: 'td-schedule', title: '各企画の開始時刻', body: '' },
        { id: 'td-prize', title: '景品の内容', body: '' },
        { id: 'td-roles', title: '役割分担・スタッフ人数', body: '' },
        { id: 'td-flow', title: '動線・レイアウト', body: '' },
        {
          id: 'td-vip',
          title: 'VIP対応（前売り10,000円購入者）',
          body: '特別な体験を用意して盛り上げる案。候補＝①開店30分前の先行入店 ②シャンパン3,000円オフ（現金決済）③ファーストドリンク無料 ④専用ゾーン/オーナーが注ぐ等。どこまでやるか・VIP人数上限を会議で決定。',
          status: '',
          decision: '',
        },
      ],
    },
  ],
}
