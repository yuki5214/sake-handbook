# 酒祭 運営ハンドブック

10/11「酒祭」の運営資料を、スタッフ・アズキヤと共有する Next.js + Supabase アプリ。

- 本文（概要〜要確定リスト）は 1レコードの jsonb。オーナーが保存すると Supabase Realtime で全閲覧者に即反映。
- 📝メモと要確定リストの 決定／保留／不要 は **localStorage のみ**（DBに送らない）。「自分のメモを書き出し」で全部コピー。
- 閲覧はログイン不要。編集は「オーナー編集」→ passcode。

## セットアップ

1. Supabase の SQL エディタで `supabase/migrations/0001_init.sql` を実行。
2. `.env.example` を `.env.local` にコピーして値を入れる（Vercel にも同じ4つを登録）。
3. `npm install` → `npm run seed`（初期本文を投入。既にある場合は何もしない。上書きは `npm run seed -- --force`）。
4. `npm run dev`（本番は `vercel deploy --prod`）。

## 設計メモ

- **データモデル**: `events`（slug/title/date）＋ `handbook`（event_id PK, content jsonb, updated_at, updated_by）。
  正規化（sections テーブル）にしなかった理由：編集は 1人（オーナー）で最後の書き込み優先、Realtime は 1行の変更を購読するだけで済み、
  セクション追加・列変更がマイグレーション不要。同時編集が必要になったら `handbook_sections` へ移行可能。
- **RLS**: anon/authenticated は SELECT のみ許可。INSERT/UPDATE/DELETE のポリシー無し ＝ 書き込みは API ルート（service role）だけ。
- **認証**: passcode を `/api/auth` `/api/save` でサーバー検証（`EDIT_PASSCODE`、timing-safe 比較）。service role キーはブラウザに出ない。
- **同期**: `postgres_changes`（`REPLICA IDENTITY FULL`）を購読。切断・復帰に備え表示中 20秒ごとに再取得。
  保存は楽観的に表示→成功でサーバー時刻を確定、失敗時は最新DB値に戻す。編集中に他者の更新が来たら警告（保存すると上書き）。
- 別イベントに流用: `NEXT_PUBLIC_EVENT_SLUG` と `events` の行、`lib/seed.ts`・`lib/config.ts` を差し替え。
