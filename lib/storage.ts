/**
 * 暖枫统一存储层
 * - 原生平台：使用 @capacitor/preferences（SharedPreferences，清缓存不丢数据）
 * - Web/开发环境：降级使用 localStorage
 */
import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform()

/** 读取 */
export async function storageGet(key: string): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key })
    return value
  }
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/** 写入 */
export async function storageSet(key: string, value: string): Promise<void> {
  if (isNative) {
    await Preferences.set({ key, value })
    return
  }
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

/** 删除 */
export async function storageRemove(key: string): Promise<void> {
  if (isNative) {
    await Preferences.remove({ key })
    return
  }
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** 同步版本（用于非 async 场景，仅 web 端可用） */
export function storageGetSync(key: string): string | null {
  if (isNative) {
    // 原生端无法同步读取，返回 null 调用方需降级处理
    return null
  }
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function storageSetSync(key: string, value: string): void {
  if (isNative) {
    // 原生端无法同步写入，静默忽略（调用方应使用 async 版本）
    return
  }
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}
