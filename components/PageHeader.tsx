import Link from 'next/link'
import type { ReactNode } from 'react'

// 各ページの上に固定する「← 目次」とページ名。右に操作ボタンなどを置ける。
export default function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-2 py-1.5">
        <Link href="/" className="flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-accent">
          ← 目次
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-base font-bold">{title}</h1>
        {right}
      </div>
    </header>
  )
}
