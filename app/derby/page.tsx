import type { Metadata } from 'next'
import DerbyView from '@/components/DerbyView'
import { pickDerby } from '@/lib/derby'
import { migrate } from '@/lib/migrate'
import { SEED } from '@/lib/seed'
import { readHandbook } from '@/lib/store'

// QR の読み取り先。URLは固定で、中身は共有本文（Redis）から毎回読む。
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'メニューダービー',
  description: 'メニューダービーの遊び方',
  robots: { index: false, follow: false },
}

export default async function DerbyPage() {
  // 公開してよいセクションだけをサーバー側で取り出す。運営用の本文はブラウザへ送らない。
  const row = await readHandbook()
  return <DerbyView sections={pickDerby(migrate(row?.content ?? SEED))} />
}
