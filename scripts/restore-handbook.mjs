// バックアップ（backup-handbook.mjs のファイル）から、共有本文を丸ごと戻す。
//
//   npm run restore -- backups/<ファイル> --dry-run   … 何も書かずに、いまの本文との違いだけを表示
//   npm run restore -- backups/<ファイル>             … パスコードを実行時に入力して、本番に書き戻す
//
// 安全装置：読み込んだ時点から本文が更新されていたら、書かずに止める（他の人の編集を消さないため）。
// パスコードは画面に表示せず、ファイル・ログにも残さない。
import { readFileSync } from 'node:fs'
import readline from 'node:readline'

const BASE_URL = process.env.HANDBOOK_URL ?? 'https://sake-handbook.vercel.app'
const file = process.argv.slice(2).find((a) => !a.startsWith('--'))
const DRY = process.argv.includes('--dry-run')
const fail = (msg) => {
  console.error(msg)
  process.exit(1)
}
if (!file) fail('使い方: npm run restore -- backups/<ファイル> [--dry-run]')

const backup = JSON.parse(readFileSync(file, 'utf8'))
if (backup?.content?.version !== 1 || !Array.isArray(backup.content.sections)) fail('バックアップのファイルの形式が不正です')

const res = await fetch(`${BASE_URL}/api/handbook`, { cache: 'no-store' })
const live = await res.json()
if (!live.published) fail('本番に保存済みの本文がありません')

const liveByKey = new Map(live.content.sections.map((s) => [s.key, JSON.stringify(s)]))
const backupByKey = new Map(backup.content.sections.map((s) => [s.key, JSON.stringify(s)]))
console.log(`バックアップ: ${file}（取得時の更新 ${backup.updated_at}）`)
console.log(`いまの本番   : 更新 ${live.updated_at}`)
for (const [k, v] of backupByKey) {
  console.log(`  ${k.padEnd(12)} ${!liveByKey.has(k) ? '本番に無い（戻すと追加）' : liveByKey.get(k) === v ? '同じ' : '違う（戻すとバックアップの内容に置き換わる）'}`)
}
for (const k of liveByKey.keys()) if (!backupByKey.has(k)) console.log(`  ${k.padEnd(12)} バックアップに無い（戻すと消える）`)
if (DRY) {
  console.log('\n--dry-run のため、何も書いていません')
  process.exit(0)
}

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

if ((await ask('\n本番の本文を、上のバックアップの内容で置き換えます。よければ y を入力: ', false)).trim().toLowerCase() !== 'y') fail('キャンセルしました')
const passcode = await ask('オーナーのパスコード（入力は表示されません）: ', true)
const save = await fetch(`${BASE_URL}/api/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ passcode, content: backup.content, by: 'restore', expectedUpdatedAt: live.updated_at }),
})
const out = await save.json().catch(() => ({}))
if (!save.ok) fail(`保存できませんでした（${save.status}）: ${out.error ?? ''}`)
console.log(`戻しました（更新 ${out.updated_at}）`)
