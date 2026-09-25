import type { CapacitorConfig } from '@capacitor/cli'

/**
 * 暖枫 App Capacitor 配置
 *
 * 关键点：
 * - appId：com.warmfeng.app（与 D3 init 命令保持一致）
 * - appName：暖枫
 * - webDir：out（Next.js 静态导出目录）
 * - androidScheme：https（让 PWA API、localStorage 等在 WebView 内稳定工作）
 * - 背景色：#FBF7F2（暖纸色，与亮色主题状态栏一致，避免启动瞬间白屏）
 * - StatusBar：亮色模式默认显示，背景 #FBF7F2，图标深色
 *   暗色由 MobileStatusBar 组件运行时动态切换（读 warmFengDarkMode）
 * - SplashScreen：原生启动屏为纯色暖纸背景（styles.xml 的 @color/splashBg，亮/暗自动切换）
 *   不显示模板遗留的占位图；1 秒后淡出，由 Web 端手绘 PageLoader 接力
 */
const config: CapacitorConfig = {
  appId: 'com.warmfeng.app',
  appName: '暖枫',
  webDir: 'out',
  backgroundColor: '#FBF7F2',
  server: {
    // 让 PWA API、localStorage、Service Worker 等在 WebView 内稳定工作
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      // 启动时默认按亮色主题配置；运行后由 MobileStatusBar 跟随暗色模式切换
      backgroundColor: '#FBF7F2',
      style: 'DARK',
      overlaysWebView: false,
    },
    SplashScreen: {
      // 不设 backgroundColor：让原生启动屏沿用 styles.xml 的 @color/splashBg（亮 #FBF7F2 / 暗 #1C1722）
      // drawable/splash.png 是模板遗留占位图，不使用；缩短至 1 秒让 Web 端手绘 PageLoader 尽早接力
      launchShowDuration: 1000,
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
}

export default config
