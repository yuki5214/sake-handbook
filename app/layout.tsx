import type { Metadata, Viewport } from 'next'
import { APP_NAME } from '@/lib/config'
import './globals.css'

export const metadata: Metadata = {
  title: APP_NAME,
  // iOS のホーム画面に追加したときの名前
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
  description: '酒祭の運営情報（スタッフ・AZUKIYA共有）',
  // URLを知っている人だけが使う前提なので、検索エンジンに載せない
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#d9381e' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
