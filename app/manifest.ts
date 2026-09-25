export const dynamic = 'force-static'

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '暖枫',
    short_name: '暖枫',
    description: '一个温暖、安静的成长陪伴空间。',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FBF7F2',
    theme_color: '#E8A0A8',
    lang: 'zh-CN',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: '首页',
        url: '/',
        description: '回到暖枫首页',
      },
    ],
  }
}
