/**
 * 暖枫数据迁移工具
 *
 * 功能：首次原生启动时，将 localStorage 数据迁移到 @capacitor/preferences
 * 这样即使用户清除应用缓存，数据也不会丢失（Preferences 使用 SharedPreferences）
 *
 * 迁移的 key 列表（覆盖所有用户数据）：
 * - warmFengReminders（温柔提醒）
 * - warmFengMyDream / warmFengCompletedDreams（目标梦想）
 * - warmFengWeeklyPlans / warmFengDailyMessage / warmFengHabits / warmFengCheckInLog（计划习惯）
 * - warmFengSleepRecords（睡眠记录）
 * - warmFengFoodLibrary / warmFengMyRecipes / warmFengFoodLog（饮食记录）
 * - warmFengPlan（今日计划）
 * - warmFengFocusSessions（专注记录）
 * - warmFengCountdowns（倒数日）
 * - homeMood / homeNote（首页心情笔记）
 * - 其他配置项...
 */

import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

const MIGRATION_FLAG = 'warmFengMigratedToPreferences'

/** 需要迁移的 localStorage key 列表 */
const KEYS_TO_MIGRATE = [
  // 温柔提醒
  'warmFengReminders',
  // 目标梦想
  'warmFengMyDream',
  'warmFengCompletedDreams',
  // 计划习惯
  'warmFengWeeklyPlans',
  'warmFengDailyMessage',
  'warmFengHabits',
  'warmFengCheckInLog',
  'warmFengPlan',
  // 睡眠记录
  'warmFengSleepRecords',
  // 饮食记录
  'warmFengFoodLibrary',
  'warmFengMyRecipes',
  'warmFengFoodLog',
  // 专注记录
  'warmFengFocusSessions',
  // 倒数日
  'warmFengCountdowns',
  // 首页心情笔记
  'homeMood',
  'homeNote',
  // 备忘录
  'warmFengMemo',
  'warmFengMemoCategories',
  // 文章收藏
  'warmFengArticleFavorites',
  // 主题设置
  'warmFengTheme',
  'warmFengMeProfile',
  // 首页配置
  'heroBannerConfig_v2',
  'homeBgPeriodConfig',
  'dailyQuoteHistory',
  'dailyQuoteConfig',
  'dailyQuotes',
  'homeGreetingVisible',
  'dailyQuoteTextColor',
  'dailyQuoteTextVisible',
  'heroBannerCustomQuote',
  'heroBannerCustomLabel',
  // 备份
  'warmFengLastBackup',
]

/**
 * 执行数据迁移（仅原生平台，仅首次）
 * 将 localStorage 中的数据复制到 Preferences
 */
export async function migrateLocalStorageToPreferences(): Promise<void> {
  // 非原生平台不执行
  if (!Capacitor.isNativePlatform()) return

  // 检查是否已迁移
  const { value: migrated } = await Preferences.get({ key: MIGRATION_FLAG })
  if (migrated === 'true') return

  console.log('[暖枫] 开始迁移 localStorage 数据到 Preferences...')

  let migratedCount = 0
  let failedCount = 0

  for (const key of KEYS_TO_MIGRATE) {
    try {
      const value = window.localStorage.getItem(key)
      if (value !== null) {
        await Preferences.set({ key, value })
        migratedCount++
      }
    } catch (err) {
      console.warn(`[暖枫] 迁移失败：${key}`, err)
      failedCount++
    }
  }

  // 标记已迁移
  await Preferences.set({ key: MIGRATION_FLAG, value: 'true' })

  console.log(`[暖枫] 迁移完成：成功 ${migratedCount} 项，失败 ${failedCount} 项`)
}

/**
 * 检查是否需要显示数据风险警告
 * 如果用户还未备份且数据量较大，显示警告
 */
export function shouldShowDataRiskWarning(): boolean {
  // 检查是否有重要数据
  const hasReminders = !!window.localStorage.getItem('warmFengReminders')
  const hasSleep = !!window.localStorage.getItem('warmFengSleepRecords')
  const hasFood = !!window.localStorage.getItem('warmFengFoodLog')
  const hasMemo = !!window.localStorage.getItem('warmFengMemo')

  // 有任何重要数据就显示警告
  return hasReminders || hasSleep || hasFood || hasMemo
}
