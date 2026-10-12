# 酒祭 運営ハンドブック

10/11「酒祭」の運営資料を、スタッフ・アズキヤと共有する Next.js + Upstash Redis アプリ。

- トップ（`/`）は目次。各項目は別ページ（`/overview` `/procurement` `/sales` …。一覧は `lib/routes.ts`）。旧い `/#sec-<key>` のリンクは新しいページへ転送される。`/derby` はお客さん向けの公開ページ（別物）。
- 本文は Redis のキー1つ（JSON）。オーナーが保存すると 数秒以内に全閲覧者へ反映（表示中の画面が 5秒ごとに取得）。
- 📝メモと要確定リストの 決定／保留／不要 は **localStorage のみ**（DBに送らない）。「自分のメモを書き出し」で全部コピー。
- 閲覧はログイン不要。編集は「オーナー編集」→ passcode。

## セットアップ

1. Vercel プロジェクトに Marketplace の Upstash Redis を接続（`KV_REST_API_URL` / `KV_REST_API_TOKEN` が自動で入る）。
2. Vercel の環境変数に `EDIT_PASSCODE`（サーバー専用）を登録。
3. `vercel deploy --prod`。初期本文は `lib/seed.ts` が表示され、オーナーが最初に保存した時点で Redis に書かれる（seed 投入は不要）。
4. ローカル開発は接続情報なしでもメモリ保存で動く（再起動で消える）。

## 設計メモ

- **構成**: [ticket-roster](https://github.com/yuki5214/ticket-roster) と同じ。DB は Upstash Redis、同期はポーリング。Supabase・kintai とは無関係。
- **保存**: キー `handbook:<slug>` に `{ content, updated_at, updated_by }`。各ページの保存は「そのセクションだけ」を差し替える（`lib/saveSection.ts`）。サーバーが最新の本文を読み、編集を始めたときのセクションと比べて、同じなら Lua（EVAL）の比較つき書き込みで保存する（読んでから書くまでに他の保存が入ったら読み直す）。別のセクションが先に保存されていても、そのまま両方残る。同じセクションが先に変わっていたら 409 で保存しない。本文全体を書く旧い方式（`content` のみ）は、一回限りの移行スクリプト用に残してある。
- **認証**: passcode を `/api/auth` `/api/save` でサーバー検証（timing-safe）。閲覧は認証なし。
- **同期**: 表示中のみ 5秒ごとに `/api/handbook?since=<updated_at>` を取得（変更なしなら本文を返さない）。保存は楽観的に表示→成功でサーバー時刻を確定、失敗時は再取得。編集中に他者の更新が来たら警告。
- **メモ**: 📝メモと 決定／保留／不要 は localStorage のみ。
- 別イベントに流用: `NEXT_PUBLIC_EVENT_SLUG` と `lib/seed.ts`・`lib/config.ts` を差し替え。

## バックアップと復元（本文）

- `npm run backup` … 本番の本文を `backups/handbook-<日時>.json` に保存する（閲覧は公開なので、パスコードも接続情報も要らない）。デプロイの前や、大きな編集の前に実行する。
- `npm run restore -- backups/<ファイル> --dry-run` … 何も書かずに、いまの本番との違い（同じ／違う／無い）を表示する。
- `npm run restore -- backups/<ファイル>` … パスコードを実行時に入力して、本番を丸ごと戻す（読み込み後に本文が更新されていたら止まる）。
- 別のURLを使うときは `HANDBOOK_URL=https://… npm run backup`。`backups/` は個人情報を含みうるので git には入れない。
