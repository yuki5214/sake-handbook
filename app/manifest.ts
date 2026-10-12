import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '酒祭',
    short_name: '酒祭',
    description: '酒祭の運営情報（スタッフ・AZUKIYA共有）',
    start_url: '/',
    display: 'standalone',
    background_color: '#d9381e',
    theme_color: '#d9381e',
    lang: 'ja',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
