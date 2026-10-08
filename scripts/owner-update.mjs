// 一回限りの移行：オーナーが編集した保存済み本文に、2026-10-08 の決定事項（置換案 1〜9）を反映する。
//
//   npm run owner-update -- --dry-run   … 何も書かずに、変更内容だけを表示（パスコード不要）
//   npm run owner-update                … パスコードを実行時に入力して、本番に保存
//
// 安全装置：
//  - 分析した時点（BASE_UPDATED_AT）から本文が更新されていたら、何も書かずに止める。
//  - 各変更は「今の文面が想定どおりか」を確認し、違っていたら止める（黙って上書きしない）。
//  - 保存時もサーバー側で更新時刻を照合し（expectedUpdatedAt）、食い違えば保存しない。
//  - パスコードは画面に表示せず、ファイル・ログにも残さない。
import { writeFileSync } from 'node:fs'
import readline from 'node:readline'
import { migrate } from '../lib/migrate.ts'
import { isContent } from '../lib/types.ts'
import { BEER_GUIDE, DERBY_BODY, DERBY_GUIDE, PARTICIPANTS, PARTICIPANTS_AT } from '../lib/seed.ts'

const BASE_URL = process.env.HANDBOOK_URL ?? 'https://sake-handbook.vercel.app'
const BASE_UPDATED_AT = '2026-10-06T01:50:46.020Z'
const DRY = process.argv.includes('--dry-run')

const log = []
class Abort extends Error {}
const fail = (msg) => {
  throw new Abort(msg)
}

async function main() {
// ---- 取得 ----
const res = await fetch(`${BASE_URL}/api/handbook`, { cache: 'no-store' })
const live = await res.json()
if (!live.published) fail('本番に保存済みの本文がありません')
if (live.updated_at !== BASE_UPDATED_AT) {
  fail(
    `本番の本文が、分析した時点（${BASE_UPDATED_AT}）から更新されています（現在 ${live.updated_at}）。\n` +
      '編集内容を上書きしないため止めました。最新の本文で置換案を作り直します。',
  )
}

// 読み込み時補正（アプリと同じ migrate）をかけた状態を土台にする
const c = migrate(structuredClone(live.content))
const sec = (key) => c.sections.find((s) => s.key === key) ?? fail(`セクション ${key} が見つかりません`)
const item = (key, id) => sec(key).items.find((i) => i.id === id) ?? fail(`${key} の項目 ${id} が見つかりません`)
const rowBy = (key, test, what) => sec(key).rows.find(test) ?? fail(`${key} の行「${what}」が想定の状態で見つかりません`)

// ---- 1. 概要：参加者数 ----
{
  const r = rowBy('overview', (r) => r[0] === '参加者数' && r[1] === '56名（10/5時点）', '参加者数 56名（10/5時点）')
  r[1] = `${PARTICIPANTS}名（${PARTICIPANTS_AT}）`
  log.push('1. 概要 参加者数 → ' + r[1])
}

// ---- 2. タイムスケジュール：ビールチャレンジの行 ----
{
  const r = rowBy('schedule', (r) => r[1].startsWith('瓶ビールチャレンジ') && r[1].includes('結果発表'), '瓶ビールチャレンジ 結果発表')
  r[1] = '瓶ビールチャレンジ集計（50本達成ならマグナム開栓・乾杯）'
  log.push(`2. スケジュール ${r[0]} の行 → ${r[1]}（時刻・担当は変更なし）`)
}

// ---- 3. イベント内容 メニューダービー本文：3連単・大穴の行だけ差し替え（他の行は保持） ----
{
  const it = item('events', 'ev-derby')
  const fresh = DERBY_BODY.split('\n')
  const lines = it.body.split('\n')
  const tri = lines.findIndex((l) => l.startsWith('3連単＝') && l.includes('次回イベント招待券'))
  const ooana = lines.findIndex((l) => l.startsWith('大穴＝') && l.includes('次回イベント参加無料'))
  if (tri < 0 || ooana < 0) fail('メニューダービー本文の3連単／大穴の行が想定の旧文面ではありません')
  lines[tri] = fresh.find((l) => l.startsWith('3連単＝'))
  lines[ooana] = fresh.find((l) => l.startsWith('大穴'))
  it.body = lines.join('\n')
  log.push('3. メニューダービー本文の 3連単・大穴 の行を差し替え')
}

// ---- 4. お客さん用説明一例（ダービー）：3連単〜大穴の部分だけ差し替え ----
{
  const sub = item('events', 'ev-derby').subs?.find((t) => t.id === 'ev-derby-guide') ?? fail('ダービーのお客さん用説明が見つかりません')
  const re = /3連単=.*?(?=外れても)/s
  if (!re.test(sub.body)) fail('ダービーのお客さん用説明の3連単〜大穴の部分が想定の旧文面ではありません')
  const fresh = DERBY_GUIDE.match(re)?.[0] ?? fail('新しい説明文の組み立てに失敗しました')
  sub.body = sub.body.replace(re, () => fresh)
  log.push('4. お客さん用説明一例（ダービー）の 3連単・大穴 の部分を差し替え')
}

// ---- 5. お客さん用説明一例（ビール）：指定の文面に ----
{
  const sub = item('events', 'ev-beer').subs?.find((t) => t.id === 'ev-beer-guide') ?? fail('ビールのお客さん用説明が見つかりません')
  if (!sub.body.includes('お客さん全体に特典が出る')) fail('ビールのお客さん用説明が想定の旧文面ではありません')
  sub.body = BEER_GUIDE
  log.push('5. お客さん用説明一例（ビール）→ 指定の文面')
}

// ---- 6. 要確定リスト：還元方式 → 決定 ----
{
  const it = item('todo', 'td-beer')
  if (it.title !== '瓶ビールチャレンジの還元内容' || it.status === 'decided') fail('要確定リストの「還元内容」が想定の状態ではありません')
  it.title = 'ビールチャレンジの還元方式'
  it.body = ''
  it.status = 'decided'
  it.decision = '還元方式は廃止。達成時はマグナムを開栓して全員で少しずつ乾杯。未達成なら開栓しない'
  log.push('6. 要確定リスト「還元内容」→「還元方式」・決定（旧メモ「%オフではなくどうするか」は削除）')
}

// ---- 7. 収支：参加費を64名に、行を追加 ----
{
  const r = rowBy('revenue', (r) => r[0] === '参加費（500円×50名）', '参加費（500円×50名）')
  r[0] = `参加費（500円×${PARTICIPANTS}名）`
  r[1] = (500 * PARTICIPANTS).toLocaleString('ja-JP')
  r[2] = PARTICIPANTS_AT
  const bets = PARTICIPANTS * 4
  sec('revenue').rows.push(
    [`馬券（平均4口×200円×${PARTICIPANTS}名＝${bets}口）`, (bets * 200).toLocaleString('ja-JP'), '平均口数は想定'],
    [`飲食売上（試算：客単価3,500円×${PARTICIPANTS}名）`, (3500 * PARTICIPANTS).toLocaleString('ja-JP'), '客単価は未確定'],
    ['マグナム3本（原価・スパークリングワイン）', '', '単価未確定'],
  )
  log.push(`7. 収支 参加費 → ${r[1]}円。馬券・飲食売上（試算）・マグナム原価の3行を追加`)
}

// ---- 8. ドリンク：瓶ビール 500円 ----
{
  const r = rowBy('drinks', (r) => r[0] === '瓶ビール' && r[1] === '600円', '瓶ビール 600円')
  r[1] = '500円'
  log.push('8. ドリンク 瓶ビール 600円 → 500円（メモは保持）')
}

// ---- 9. 準備物 ----
{
  const prep = sec('prep')
  const board = rowBy('prep', (r) => r[0] === 'ホワイトボード', 'ホワイトボード')
  board[0] = '黒板（目標50本・残り本数）'
  if (!board[3]) board[3] = '瓶ビールの本数を更新'
  const ticket = rowBy('prep', (r) => r[0] === '馬券・投票箱', '馬券・投票箱')
  ticket[0] = '馬券（名刺サイズ91×55mm・1枚＝1口）'
  ticket[1] = '300枚（グラフィックに発注済み・上質135kg）'
  ticket[3] = `目安は${PARTICIPANTS}名×平均4口＝${PARTICIPANTS * 4}口＋書き損じ予備`
  const champ = rowBy('prep', (r) => r[0] === 'シャンパン' && r[3] === '特賞・大穴用', 'シャンパン（特賞・大穴用）')
  champ[3] = '特賞・3連単用'
  prep.rows.push(['投票箱', '【未定】', '', ''], ['乾杯用カップ', '【未定】', '', '参加者＋スタッフ分・数量は要確定'])
  log.push('9. 準備物：ホワイトボード→黒板／馬券・投票箱→馬券（300枚・発注済み）＋投票箱を別行に／シャンパンのメモ更新／乾杯用カップ追加')
}

if (!isContent(c)) fail('変更後の本文が正しい形式になりませんでした（実装の不具合の可能性）')

console.log(`\n本番（${BASE_URL}）に反映する変更：`)
log.forEach((l) => console.log('  ' + l))
console.log('\n※ 仕入れ表の瓶ビール「100本」と、準備物・仕入れ表のマグナム行は、そのまま残します。')

if (process.env.OWNER_UPDATE_DUMP) writeFileSync(process.env.OWNER_UPDATE_DUMP, JSON.stringify(c))
if (DRY) {
  console.log('\n--dry-run のため、何も保存していません。')
  return
}

// ---- パスコード入力（画面に表示しない）→ 確認 → 保存 ----
function ask(question, hidden) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) process.stdout.write(s)
      }
    }
    rl.question(question, (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      resolve(answer)
    })
  })
}

if ((await ask('\nこの内容で保存します。よければ y を入力: ', false)).trim().toLowerCase() !== 'y') fail('キャンセルしました')
const passcode = await ask('オーナーのパスコード（入力は表示されません）: ', true)

const save = await fetch(`${BASE_URL}/api/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ passcode, content: c, by: 'owner-update', expectedUpdatedAt: BASE_UPDATED_AT }),
})
const out = await save.json().catch(() => ({}))
if (!save.ok) {
  console.error(`\n保存されませんでした（${save.status}）: ${out.error ?? '不明なエラー'}`)
  process.exitCode = 1
  return
}
console.log(`\n保存しました（更新時刻 ${out.updated_at}）。画面は数秒で更新されます。`)
}

main().catch((e) => {
  process.exitCode = 1
  if (e instanceof Abort) console.error(`\n中止: ${e.message}\n（本番には何も書き込んでいません）`)
  else console.error(e)
})
