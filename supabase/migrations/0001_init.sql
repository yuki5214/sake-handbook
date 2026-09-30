-- 酒祭イベント運営ハンドブック
-- Supabase SQL エディタでそのまま実行してください（何度実行しても安全）。

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  event_date  date
);

-- 共有本文は 1イベント=1レコードの jsonb（MVP）
create table if not exists public.handbook (
  event_id    uuid primary key references public.events(id) on delete cascade,
  content     jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- RLS: 閲覧は誰でも（anon）可。INSERT/UPDATE/DELETE のポリシーは作らない
-- ＝ 書き込みは Vercel の API ルート（service role・passcode 検証後）だけが行う。
alter table public.events   enable row level security;
alter table public.handbook enable row level security;

drop policy if exists "events readable by anyone"   on public.events;
drop policy if exists "handbook readable by anyone" on public.handbook;
create policy "events readable by anyone"   on public.events   for select to anon, authenticated using (true);
create policy "handbook readable by anyone" on public.handbook for select to anon, authenticated using (true);

-- Realtime: 大きい jsonb が TOAST されても変更通知に全文が載るよう REPLICA IDENTITY FULL
alter table public.handbook replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'handbook'
  ) then
    alter publication supabase_realtime add table public.handbook;
  end if;
end $$;

insert into public.events (slug, title, event_date)
values ('sakematsuri-2026', '酒祭（AZUKIYA × くうかい はなれ）', '2026-10-11')
on conflict (slug) do nothing;
