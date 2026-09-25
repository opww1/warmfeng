'use client'

/**
 * Capacitor 状态栏适配组件（独立监听版）
 *
 * 作用：
 * - 在 Capacitor 原生壳里，让 Android 状态栏背景与暖枫主题融合
 * - 自己读 localStorage(warmFengDarkMode) + 监听存储事件
 * - 不依赖 warm-feng-app.tsx，零侵入
 * - 底部导航遮挡改由原生层处理（capacitor.config 的 adjustMarginsForEdgeToEdge:force），不再在 JS 层检测
 *
 * 仅在 Capacitor 运行时生效；普通浏览器中为 no-op。
 */

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean
      Plugins?: {
        StatusBar?: {
          setBackgroundColor: (opts: { color: string }) => Promise<void>
          setStyle: (opts: { style: 'LIGHT' | 'DARK' | 'DEFAULT' }) => Promise<void>
        }
      }
    }
  }
}

const DARK_MODE_KEY = 'warmFengDarkMode'
const LIGHT_BG = '#FBF7F2'
const DARK_BG = '#1C1722'

export function MobileStatusBar() {
  const [isDark, setIsDark] = useState(false)

  // 初次读取 + 监听其他标签页的暗色模式切换
  useEffect(() => {
    const readDark = () => {
      try {
        setIsDark(localStorage.getItem(DARK_MODE_KEY) === '1')
      } catch {
        /* ignore */
      }
    }
    readDark()
    window.addEventListener('storage', readDark)
    return () => window.removeEventListener('storage', readDark)
  }, [])

  // 暗色变化时同步状态栏
  useEffect(() => {
    const capacitor = typeof window !== 'undefined' ? window.Capacitor : undefined
    if (!capacitor?.isNativePlatform?.()) return
    const StatusBar = capacitor.Plugins?.StatusBar
    if (!StatusBar) return

    try {
      StatusBar.setBackgroundColor({ color: isDark ? DARK_BG : LIGHT_BG }).catch(() => {})
    } catch {
      /* ignore */
    }
    try {
      StatusBar.setStyle({ style: isDark ? 'LIGHT' : 'DARK' }).catch(() => {})
    } catch {
      /* ignore */
    }
  }, [isDark])

  return null
}