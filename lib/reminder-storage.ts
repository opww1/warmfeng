/**
 * 温柔提醒数据存储层
 *
 * 统一管理提醒项的读取和保存
 * - 原生平台：使用 @capacitor/preferences（清缓存不丢数据）
 * - Web/开发环境：降级使用 localStorage
 *
 * SSR 安全：所有存储读取都在函数内调用，不在模块顶层执行
 */

import { storageGet, storageSet } from './storage'

// ── 类型定义 ──────────────────────────────────────

/**
 * 温柔提醒项
 * 与平台无关的数据结构，Web 和原生 App 共用
 */
export interface WarmReminder {
  id: string              // 唯一标识
  title: string           // 提醒标题（如"喝杯温水"）
  time: string            // 触发时间 "HH:mm" 格式
  repeatDays: number[]    // 重复日期 [0-6]，0=周日，[]表示每天
  customMessage?: string  // 温柔文案（可选）
  enabled: boolean        // 是否开启
  createdAt: string       // 创建时间 ISO
}

// ── localStorage key 常量 ─────────────────────────

const STORAGE_KEY = 'warmFengReminders'

// ── 工具函数 ──────────────────────────────────────

/**
 * 生成唯一 ID
 * 不使用 crypto.randomUUID()，避免手机端兼容性问题（参考 Task-058 教训）
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // fallthrough
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

// ── 读取/保存 ─────────────────────────────────────

/**
 * 从 LocalStorage 读取全部提醒
 * 注意：仅在客户端调用（useEffect 内），不在渲染期调用
 */
export async function loadReminders(): Promise<WarmReminder[]> {
  try {
    const raw = await storageGet(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed as WarmReminder[]
      }
    }
  } catch {
    /* 解析失败返回空数组 */
  }
  return []
}

/**
 * 保存全部提醒到存储
 */
async function persistReminders(reminders: WarmReminder[]): Promise<void> {
  try {
    await storageSet(STORAGE_KEY, JSON.stringify(reminders))
  } catch {
    /* 存储满或禁用时忽略 */
  }
}

// ── CRUD 操作 ─────────────────────────────────────

/**
 * 新增提醒
 *
 * @param input 部分字段（无需提供 id/createdAt，由函数自动填充）
 * @returns 保存后的完整提醒项
 */
export async function addReminder(
  input: Omit<WarmReminder, 'id' | 'createdAt'>
): Promise<WarmReminder> {
  const reminders = await loadReminders()

  const reminder: WarmReminder = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }

  reminders.push(reminder)
  await persistReminders(reminders)

  return reminder
}

/**
 * 更新提醒
 *
 * @param id 提醒 ID
 * @param updates 需要更新的字段
 * @returns 更新后的提醒项，未找到返回 null
 */
export async function updateReminder(
  id: string,
  updates: Partial<Omit<WarmReminder, 'id' | 'createdAt'>>
): Promise<WarmReminder | null> {
  const reminders = await loadReminders()
  const index = reminders.findIndex(r => r.id === id)

  if (index < 0) return null

  reminders[index] = { ...reminders[index], ...updates }
  await persistReminders(reminders)

  return reminders[index]
}

/**
 * 删除提醒
 *
 * @param id 提醒 ID
 * @returns 是否删除成功
 */
export async function deleteReminder(id: string): Promise<boolean> {
  const reminders = await loadReminders()
  const filtered = reminders.filter(r => r.id !== id)

  if (filtered.length === reminders.length) return false

  await persistReminders(filtered)
  return true
}

/**
 * 切换提醒开关
 *
 * @param id 提醒 ID
 * @returns 更新后的提醒项，未找到返回 null
 */
export async function toggleReminder(id: string): Promise<WarmReminder | null> {
  const reminders = await loadReminders()
  const index = reminders.findIndex(r => r.id === id)

  if (index < 0) return null

  reminders[index].enabled = !reminders[index].enabled
  await persistReminders(reminders)

  return reminders[index]
}

// ── 查询辅助 ──────────────────────────────────────

/**
 * 获取今日待触发的提醒（按时间排序）
 *
 * @param dayOfWeek 当前星期几（0=周日，1-6=周一至周六）
 * @returns 今日启用的提醒列表
 */
export async function getTodayReminders(dayOfWeek: number): Promise<WarmReminder[]> {
  const reminders = await loadReminders()
  return reminders
    .filter(r => {
      if (!r.enabled) return false
      // repeatDays 为空数组表示每天
      if (r.repeatDays.length === 0) return true
      return r.repeatDays.includes(dayOfWeek)
    })
    .sort((a, b) => a.time.localeCompare(b.time))
}

/**
 * 检查某个提醒是否在当前时间应该触发
 * 误差范围 ±1 分钟，避免轮询间隙错过
 *
 * @param reminder 提醒项
 * @param currentTime 当前 "HH:mm" 时间
 * @returns 是否应该触发
 */
export function shouldTrigger(reminder: WarmReminder, currentTime: string): boolean {
  if (!reminder.enabled) return false

  const [curH, curM] = currentTime.split(':').map(Number)
  const [remH, remM] = reminder.time.split(':').map(Number)

  const curMin = (curH || 0) * 60 + (curM || 0)
  const remMin = (remH || 0) * 60 + (remM || 0)

  // 误差 ±1 分钟
  return Math.abs(curMin - remMin) <= 1
}
