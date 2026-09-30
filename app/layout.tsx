import type { Metadata, Viewport } from 'next'
import { EVENT_TITLE } from '@/lib/config'
import './globals.css'

export const metadata: Metadata = {
  title: EVENT_TITLE,
  description: '酒祭の運営情報（スタッフ・AZUKIYA共有）',
  // URLを知っている人だけが使う前提なので、検索エンジンに載せない
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
