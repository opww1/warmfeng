/**
 * 温柔提醒核心 Hook
 *
 * 功能：
 * 1. 提醒列表 CRUD（增删改查 + 开关切换）
 * 2. 定时检查：每分钟检查是否有到点的提醒
 * 3. 触发通知：到点时通过 notification-bus 发送系统通知
 * 4. 去重：同一条提醒同一分钟内只触发一次
 * 5. 通知权限管理：请求权限、查询状态
 *
 * SSR 安全：localStorage 读取在 useEffect 内，不在渲染期调用
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import type { WarmReminder } from './reminder-storage'
import {
  loadReminders,
  addReminder as storageAdd,
  updateReminder as storageUpdate,
  deleteReminder as storageDelete,
  toggleReminder as storageToggle,
  shouldTrigger,
} from './reminder-storage'
import {
  sendReminder,
  requestNotificationPermission,
  getNotificationStatus,
  syncNativeReminderSchedules,
} from './notification-bus'

// ── Hook 返回值类型 ───────────────────────────────

export interface UseRemindersReturn {
  /** 全部提醒列表 */
  reminders: WarmReminder[]
  /** 当前触发的提醒（用于应用内弹窗显示，仅权限拒绝时降级使用） */
  activeReminder: WarmReminder | null
  /** 通知权限状态 */
  notificationStatus: 'granted' | 'denied' | 'default'
  /** 请求系统通知权限 */
  requestPermission: () => Promise<void>
  /** 添加提醒 */
  addReminder: (input: Omit<WarmReminder, 'id' | 'createdAt'>) => Promise<WarmReminder>
  /** 更新提醒 */
  updateReminder: (id: string, updates: Partial<Omit<WarmReminder, 'id' | 'createdAt'>>) => Promise<void>
  /** 删除提醒 */
  deleteReminder: (id: string) => Promise<void>
  /** 切换提醒开关 */
  toggleReminder: (id: string) => Promise<void>
  /** 关闭当前触发的弹窗 */
  dismissActive: () => void
}

// ── Hook 实现 ─────────────────────────────────────

export function useReminders(): UseRemindersReturn {
  // 初始为空数组，挂载后从 localStorage 读取，避免 SSR 水合不匹配
  const [reminders, setReminders] = useState<WarmReminder[]>([])
  // 当前触发的提醒（弹窗显示用，仅权限拒绝时降级使用）
  const [activeReminder, setActiveReminder] = useState<WarmReminder | null>(null)
  // 通知权限状态，初始 default，挂载后读取真实值
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'default'>('default')
  // 已触发的提醒记录（防止同分钟重复触发）key: `${id}-${date}-${time}`
  const triggeredRef = useRef<Set<string>>(new Set())

  // 挂载时读取存储 + 通知权限状态，并把提醒写入系统级定时调度
  //（原生端杀掉后台后，只有系统调度能保证到点弹出通知）
  useEffect(() => {
    loadReminders().then(list => {
      setReminders(list)
      void syncNativeReminderSchedules(list)
    })
    setNotificationStatus(getNotificationStatus())
  }, [])

  // ── 权限管理 ──

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission()
    setNotificationStatus(granted ? 'granted' : 'denied')
    if (granted) {
      // 授权成功后才能写入系统定时通知，立即同步一次
      const list = await loadReminders()
      void syncNativeReminderSchedules(list)
    }
  }, [])

  // ── CRUD 操作 ──

  const addReminder = useCallback(async (input: Omit<WarmReminder, 'id' | 'createdAt'>): Promise<WarmReminder> => {
    const reminder = await storageAdd(input)
    setReminders(prev => [...prev, reminder])
    const list = await loadReminders()
    void syncNativeReminderSchedules(list)
    return reminder
  }, [])

  const updateReminder = useCallback(async (id: string, updates: Partial<Omit<WarmReminder, 'id' | 'createdAt'>>) => {
    const updated = await storageUpdate(id, updates)
    if (updated) {
      setReminders(prev => prev.map(r => r.id === id ? updated : r))
    }
    const list = await loadReminders()
    void syncNativeReminderSchedules(list)
  }, [])

  const deleteReminder = useCallback(async (id: string) => {
    await storageDelete(id)
    setReminders(prev => prev.filter(r => r.id !== id))
    const list = await loadReminders()
    void syncNativeReminderSchedules(list)
  }, [])

  const toggleReminder = useCallback(async (id: string) => {
    const updated = await storageToggle(id)
    if (updated) {
      setReminders(prev => prev.map(r => r.id === id ? updated : r))
    }
    const list = await loadReminders()
    void syncNativeReminderSchedules(list)
  }, [])

  const dismissActive = useCallback(() => {
    setActiveReminder(null)
  }, [])

  // ── 定时检查（双保险的应用内兑底层） ──

  useEffect(() => {
    // 每 15 秒检查一次：系统闹钟是主通道，但部分手机厂商会拦截后台闹钟，
    // 所以只要 App 开着，轮询就始终兖底，保证提醒不会彻底失踪
    const interval = setInterval(async () => {
      const now = new Date()
      // 延后 8 秒再兑底：给系统闹钟先触发的机会（闹钟准点触发后会通过
      // warm-reminder-fired 事件标记已触发，轮询就不会重复弹）
      if (now.getSeconds() < 8) return
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      // 从存储读取最新数据（避免闭包旧值）
      const allReminders = await loadReminders()

      for (const reminder of allReminders) {
        if (!reminder.enabled) continue
        if (reminder.repeatDays.length > 0 && !reminder.repeatDays.includes(now.getDay())) continue
        // 只在精确匹配的那一分钟内触发（不再用 ±1 分钟容差，避免与系统闹钟双弹）
        if (reminder.time !== currentTime) continue
        // 去重：同一条提醒同一天同一分钟只触发一次（系统闹钟先弹过也会标记）
        const triggerKey = `${reminder.id}-${today}-${reminder.time}`
        if (triggeredRef.current.has(triggerKey)) continue

        triggeredRef.current.add(triggerKey)
        sendReminder(reminder)
        break // 一次只触发一条
      }

      // 清理过期的触发记录（保留当天）
      const newSet = new Set<string>()
      triggeredRef.current.forEach(key => {
        if (key.includes(today)) {
          newSet.add(key)
        }
      })
      triggeredRef.current = newSet
    }, 15000) // 15秒检查一次

    return () => clearInterval(interval)
  }, [])

  // ── 监听通知事件（权限拒绝时的降级应用内弹窗） ──

  useEffect(() => {
    const handler = (e: Event) => {
      const reminder = (e as CustomEvent<WarmReminder>).detail
      setActiveReminder(reminder)
    }
    window.addEventListener('warm-reminder', handler as EventListener)
    return () => window.removeEventListener('warm-reminder', handler as EventListener)
  }, [])

  // ── 监听系统闹钟真实触发事件（双保险去重） ──

  useEffect(() => {
    // 系统闹钟到点触发时，notification-bus 会广播对应提醒 id；
    // 标记为已触发，应用内轮询就不会在同一分钟再弹一次
    const handler = async (e: Event) => {
      const reminderId = (e as CustomEvent<string>).detail
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const reminder = (await loadReminders()).find(r => r.id === reminderId)
      if (reminder) {
        triggeredRef.current.add(`${reminderId}-${today}-${reminder.time}`)
      }
    }
    window.addEventListener('warm-reminder-fired', handler as EventListener)
    return () => window.removeEventListener('warm-reminder-fired', handler as EventListener)
  }, [])

  return {
    reminders,
    activeReminder,
    notificationStatus,
    requestPermission,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    dismissActive,
  }
}
