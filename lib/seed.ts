import { DERBY_GUIDE_SECTION, DERBY_MENU_SECTION } from './derby'
import type { Block, Content, Section, SubBlock } from './types'

// 初期本文（DBに行が無いときの表示）と、読み込み時補正（migrate.ts）が足す項目の定義。
// 「【未定】」はAZUKIYA回答待ちなどのプレースホルダ。

// ---- 人数に依存する値は、ここの定数から計算する（直書きしない） ----
export const PARTICIPANTS = 64
export const PARTICIPANTS_AT = '10/7時点'
const ENTRY_FEE = 500
const BETS_PER_PERSON = 4 // 馬券の平均口数（想定）
const BET_PRICE = 200
const SPEND_PER_PERSON = 3500 // 飲食の客単価（未確定の試算値）
const BET_COUNT = PARTICIPANTS * BETS_PER_PERSON
const yen = (n: number) => String(n)

/** 一度だけ補う補正の記録名。変えると、保存済み本文にもう一度かかる。 */
export const BEER_FINAL_ID = 'beer-final-2026-10-08'

// ---- 瓶ビールチャレンジ「祝・完飲祭」（目標50本の単一目標・達成でマグナム開栓） ----
export const BEER_BODY =
  '目標：瓶ビール50本（単一目標）。\n達成したら、マグナムのスパークリングワインを開栓して全員で少しずつ乾杯。\n未達成なら開栓しない（未開封のまま持ち越し）。\n瓶ビールの売値は500円（ドリンク全品500円）。'
export const BEER_GUIDE =
  '今日は瓶ビール50本が目標です。次回のイベント時に酒屋さんに協力してもらうために、今日はなんとしても50本は売りたいので、協力お願いします！黒板に『あと何本』を書いていきます。50本達成したら、マグナムボトルのスパークリングを開けて、みんなで少しずつ乾杯します！'
export const BEER_OPS =
  '①黒板に目標50本・残り本数を表示（瓶ビールが出るたびにカウントして更新）。②要所で、お客さん用説明の声かけをする。③達成したらマグナムを開栓して、全員に少しずつ配る。④未達成なら開栓しない。'

// ---- メニューダービー（3連単・大穴） ----
const TRI_PRIZE = '次回ご招待券＋シャンパン1本＋スタッフ全員と乾杯'
export const DERBY_BODY =
  `馬券1口200円・1人5口・単勝は最大3口。\n当たり券＝当日回収／ハズレ券＝後日使える100円券。\n3連単＝${TRI_PRIZE}（複数人が的中した場合は、的中者の人数分を進呈）。\n大穴（後半のみ）＝お題「モエ・シャンドンが何本出るか」。景品＝次回ご招待券（当選者全員）＋スパークリングワイン（マグナム）1本を当選者全員で分けて開栓。\n特賞＝シャンパン（店内売価15,000円〜／原価6,000円〜）を前半的中者から抽選。現金別会計。`
export const DERBY_GUIDE =
  `メニューダービーは、売れるメニューの番号を競馬みたいに予想して当てる遊びです。馬券は1口200円。単勝=1位を当てて一品サービス、3連単=1〜3位を順番で当てて${TRI_PRIZE}(複数人が的中した場合は人数分進呈)、大穴(後半のみ)=モエ・シャンドンが何本出るかを当てて次回ご招待券＋マグナムのスパークリングワインを当選者全員で乾杯。外れても次回使える100円券になります。前半=料理/後半=ドリンクで予想。前半に買うと特賞シャンパン抽選の対象。参加は自由、1人最大10口(前半5・後半5)。`
const DERBY_OPS =
  '①ファーストオーダー時は説明のみ(ここでは売らない)。②頃合いを見て『馬券どうです？』と促す。③買うと言われたら券種(単勝/3連単/大穴)と賭けるメニュー番号を聞き、名刺サイズの馬券に記入。使わない券種は斜線で消す。④口数確認(前半5・後半5=最大10口)、1口200円を受取。⑤前半購入者はメモ紙に名前を書いてもらい抽選箱へ(特賞シャンパンの対象)。⑥外れ券は客に渡す(次回100円券)、当たり券は当日回収。締切後は購入・変更不可。締切〜発表の間は特定メニューを勧めない。メニューは番号で予想するので、番号⇔メニュー対応表を受付/カウンターに掲示。'

// 企画ごとの小項目（お客さん用説明＋スタッフ用オペ）
const guide = (id: string, body: string): SubBlock => ({ id: `${id}-guide`, title: 'お客さん用 説明一例', body })
const ops = (id: string, body: string): SubBlock => ({ id: `${id}-ops`, title: 'スタッフ用 オペレーション', body })
export const EVENT_SUBS: Record<string, SubBlock[]> = {
  'ev-derby': [guide('ev-derby', DERBY_GUIDE), ops('ev-derby', DERBY_OPS)],
  'ev-beer': [guide('ev-beer', BEER_GUIDE), ops('ev-beer', BEER_OPS)],
}

// ---- マグナム（スパークリングワイン）。シャンパンではない ----
export const MAGNUM_ROW = [
  'マグナム（ボッテガ ゴールド・暫定 1.5L）',
  '3本',
  '',
  'スパークリングワイン（プロセッコ）／在庫・単価・納期は未確認／用途：大穴の景品・ビールチャレンジ達成時の乾杯',
]
export const COUNT_ROLE_ROW = ['瓶ビール本数カウント・黒板更新', '', '']

export const BEER_TODOS: Block[] = [
  {
    id: 'td-beer-target',
    title: '瓶ビールチャレンジの目標本数',
    body: '',
    status: 'decided',
    decision: '50本',
  },
  {
    id: 'td-beer-timing',
    title: 'ビールチャレンジ達成時の乾杯のタイミング',
    body: '達成した時点／21:00の集計時。',
    status: 'hold',
    decision: '',
  },
  {
    id: 'td-magnum-count',
    title: '達成時に開けるマグナムの本数',
    body: '1本か2本。64名に対し1本で約23ml、2本で約47ml。大穴用に1本残すと最大2本。',
    status: 'hold',
    decision: '',
  },
  {
    id: 'td-magnum-stock',
    title: 'マグナム（ボッテガ ゴールド1.5L）の在庫・単価・納期',
    body: '暫定の銘柄。3本分。',
    status: 'hold',
    decision: '',
  },
  {
    id: 'td-cheap-sparkling',
    title: '予備の安価スパークリングの要否',
    body: '「安価スパークリング750ml 1本」は取り消し。要否のみ保留。',
    status: 'hold',
    decision: '',
  },
]
const BEER_METHOD_TODO: Block = {
  id: 'td-beer',
  title: 'ビールチャレンジの還元方式',
  body: '',
  status: 'decided',
  decision: '還元方式は廃止。達成時はマグナムを開栓して全員で少しずつ乾杯。未達成なら開栓しない',
}

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

export const SEED: Content = {
  version: 1,
  applied: [BEER_FINAL_ID],
  sections: [
    {
      key: 'overview',
      title: '概要',
      kind: 'table',
      columns: ['項目', '内容'],
      rows: [
        ['日程', '10/11(日) OPEN 17:00 – CLOSE 22:00'],
        ['会場', 'くうかい はなれ（全席立ち飲み）'],
        ['参加費', `${ENTRY_FEE}円`],
        ['参加者数', `${PARTICIPANTS}名（${PARTICIPANTS_AT}）`],
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
        ['【未定】', '瓶ビールチャレンジ集計（50本達成ならマグナム開栓・乾杯）', '【未定】'],
        ['22:00', 'CLOSE', ''],
      ],
    },
    {
      key: 'events',
      title: 'イベント内容',
      kind: 'blocks',
      items: [
        { id: 'ev-derby', title: 'メニューダービー', body: DERBY_BODY, subs: EVENT_SUBS['ev-derby'] },
        {
          id: 'ev-janken',
          title: 'じゃんけん大会',
          body: '食事券20,000円分（両店可・期限3ヶ月・1回5,000円上限）。',
        },
        { id: 'ev-beer', title: '瓶ビールチャレンジ', body: BEER_BODY, subs: EVENT_SUBS['ev-beer'] },
        {
          id: 'ev-vip',
          title: 'VIP（前売り10,000円）',
          body: '特典：開店30分前の先行入店／ファーストドリンク無料／シャンパン3,000円オフ（現金）。',
        },
        { id: 'ev-prize', title: '景品', body: '【未定】' },
      ],
    },
    DERBY_GUIDE_SECTION,
    DERBY_MENU_SECTION,
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
        [
          '馬券（名刺サイズ91×55mm・1枚＝1口）',
          '300〜400枚',
          '',
          `目安は${PARTICIPANTS}名×平均${BETS_PER_PERSON}口＝${BET_COUNT}口＋書き損じ予備`,
        ],
        ['投票箱', '【未定】', '', ''],
        ['黒板（目標50本・残り本数）', '【未定】', '', '瓶ビールの本数を更新'],
        ['乾杯用カップ', '【未定】', '', '参加者＋スタッフ分・数量は要確定'],
        ['シャンパン', '【未定】', '', '特賞・3連単用'],
        ['受付用 名簿（ticket-roster）', '1', '', 'スマホで確認'],
        [...MAGNUM_ROW],
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
    { ...PROCURE_SECTION, rows: [[...MAGNUM_ROW]] },
    {
      key: 'revenue',
      title: '収支',
      kind: 'table',
      columns: ['項目', '金額(円)', '備考'],
      rows: [
        [`参加費（${ENTRY_FEE}円×${PARTICIPANTS}名）`, yen(ENTRY_FEE * PARTICIPANTS), PARTICIPANTS_AT],
        [
          `馬券（平均${BETS_PER_PERSON}口×${BET_PRICE}円×${PARTICIPANTS}名＝${BET_COUNT}口）`,
          yen(BET_COUNT * BET_PRICE),
          '平均口数は想定',
        ],
        [
          `飲食売上（試算：客単価${SPEND_PER_PERSON.toLocaleString('ja-JP')}円×${PARTICIPANTS}名）`,
          yen(SPEND_PER_PERSON * PARTICIPANTS),
          '客単価は未確定',
        ],
        ['前売り券（23枚）', '122000', '9/30時点・当日含む券面総額124,000円／未入金124,000円（ticket-roster）'],
        ['当日券', '【未定】', '1,000円'],
        ['マグナム3本（原価・スパークリングワイン）', '', '単価未確定'],
      ],
      sumCol: 1,
      note: '合計は数字が入っている行のみ集計されます（原価は含まれません）。',
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
        ['ドリンク全品（瓶ビールも）', '500', ''],
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
        [...COUNT_ROLE_ROW],
      ],
    },
    {
      key: 'todo',
      title: '要確定リスト',
      kind: 'todo',
      items: [
        BEER_METHOD_TODO,
        ...BEER_TODOS,
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
