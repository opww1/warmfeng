import type { Metadata, Viewport } from 'next'
import './globals.css'
import { MobileStatusBar } from '@/components/mobile-status-bar'

export const metadata: Metadata = {
  title: '暖枫（Warm Feng）',
  description: '一个温暖、安静的成长陪伴空间。',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '暖枫',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
  themeColor: '#E8A0A8',
  viewportFit: 'cover', // Capacitor 模式下让内容延伸到刘海/手势条区域
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="bg-background">
      <body className="font-sans antialiased">
        <MobileStatusBar />
        {children}
      </body>
    </html>
  )
}
