// 保存済みの本文（共有本文）のバックアップ。デプロイの前や、大きな編集の前に実行する。
//
//   npm run backup                          … backups/handbook-<日時>.json に保存（本番 sake-handbook.vercel.app）
//   HANDBOOK_URL=https://… npm run backup   … 別のURLを指定
//
// 閲覧は公開なので、パスコードも接続情報も要らない（本文を読むだけで、何も書き換えない）。
// 戻したいときは、`npm run restore -- backups/<ファイル>`（先に --dry-run で内容を確認できる）。
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE_URL = process.env.HANDBOOK_URL ?? 'https://sake-handbook.vercel.app'

const res = await fetch(`${BASE_URL}/api/handbook`, { cache: 'no-store' })
if (!res.ok) {
  console.error(`取得に失敗しました（${res.status}）`)
  process.exit(1)
}
const live = await res.json()
if (!live.published) {
  console.error('本番に保存済みの本文がありません（初期値のまま）。バックアップするものがありません')
  process.exit(1)
}

const text = JSON.stringify({ content: live.content, updated_at: live.updated_at }, null, 2)
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
mkdirSync('backups', { recursive: true })
const file = `backups/handbook-${stamp}.json`
writeFileSync(file, text)

console.log(`保存しました: ${file}`)
console.log(`  本文の最終更新: ${live.updated_at}`)
console.log(`  セクション数: ${live.content.sections.length}`)
console.log(`  サイズ: ${Buffer.byteLength(text)} バイト`)
console.log(`  sha256: ${createHash('sha256').update(text).digest('hex').slice(0, 16)}…`)
