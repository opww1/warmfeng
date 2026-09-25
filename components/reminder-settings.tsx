/**
 * 提醒设置主面板
 *
 * 从底部滑入的半屏面板，展示所有提醒列表
 * 功能：
 * - 查看全部提醒
 * - 开关提醒
 * - 编辑提醒（点击列表项）
 * - 删除提醒（长按）
 * - 添加新提醒
 * - 系统通知权限管理（请求授权/显示状态）
 *
 * 风格：沿用暖枫 Design System
 */

'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { WarmReminder } from '@/lib/reminder-storage'
import { ReminderEditDialog } from './reminder-edit-dialog'

// ── 手绘铃铛 SVG 图标 ─────────────────────────────

function BellIcon({ className, enabled = true }: { className?: string; enabled?: boolean }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3C8.5 3 6 5.5 6 9V13L4.5 15.5C4.2 16 4.5 16.5 5 16.5H19C19.5 16.5 19.8 16 19.5 15.5L18 13V9C18 5.5 15.5 3 12 3Z"
        stroke={enabled ? '#B8956A' : '#C0BBB0'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={enabled ? '#FBF0E0' : 'none'}
      />
      <path
        d="M10 19C10 20.1 10.9 21 12 21C13.1 21 14 20.1 14 19"
        stroke={enabled ? '#B8956A' : '#C0BBB0'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── 手绘加号 SVG 图标 ─────────────────────────────

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ── 星期标签 ──────────────────────────────────────

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function formatRepeat(days: number[]): string {
  if (days.length === 0) return '每天'
  if (days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d))) return '工作日'
  if (days.length === 2 && days.includes(0) && days.includes(6)) return '周末'
  return `每周${days.map(d => DAY_LABELS[d]).join('、')}`
}

// ── 组件 Props ────────────────────────────────────

interface ReminderSettingsProps {
  /** 是否显示 */
  open: boolean
  /** 提醒列表 */
  reminders: WarmReminder[]
  /** 通知权限状态 */
  notificationStatus: 'granted' | 'denied' | 'default'
  /** 请求通知权限 */
  onRequestPermission: () => void
  /** 关闭面板 */
  onClose: () => void
  /** 添加提醒 */
  onAdd: (input: Omit<WarmReminder, 'id' | 'createdAt'>) => void
  /** 更新提醒 */
  onUpdate: (id: string, updates: Partial<Omit<WarmReminder, 'id' | 'createdAt'>>) => void
  /** 删除提醒 */
  onDelete: (id: string) => void
  /** 切换开关 */
  onToggle: (id: string) => void
}

// ── 组件实现 ──────────────────────────────────────

export function ReminderSettings({
  open,
  reminders,
  notificationStatus,
  onRequestPermission,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}: ReminderSettingsProps) {
  // 编辑面板状态
  const [editOpen, setEditOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<WarmReminder | null>(null)
  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<WarmReminder | null>(null)

  // 今日待触发数量
  const todayCount = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    return reminders.filter(r => {
      if (!r.enabled) return false
      if (r.repeatDays.length === 0) return true
      return r.repeatDays.includes(dayOfWeek)
    }).length
  }, [reminders])

  // 按时间排序的提醒列表
  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => a.time.localeCompare(b.time))
  }, [reminders])

  // 打开新增面板
  const handleAdd = () => {
    setEditingReminder(null)
    setEditOpen(true)
  }

  // 打开编辑面板
  const handleEdit = (reminder: WarmReminder) => {
    setEditingReminder(reminder)
    setEditOpen(true)
  }

  // 保存（新增或编辑）
  const handleSave = (data: { title: string; time: string; repeatDays: number[]; customMessage?: string }) => {
    if (editingReminder) {
      onUpdate(editingReminder.id, data)
    } else {
      onAdd({ ...data, enabled: true })
    }
    setEditOpen(false)
  }

  // 确认删除
  const handleDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  // 权限状态文案
  const permissionText = {
    granted: '系统通知已开启',
    denied: '系统通知被拒绝',
    default: '点击开启系统通知',
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] flex items-end justify-center bg-black/40"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
              className="flex max-h-[80vh] w-full max-w-[420px] flex-col rounded-t-3xl bg-card px-5 pb-6 pt-4 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* 顶部拖动条 */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border/60" />

              {/* 标题 */}
              <div className="mb-4 flex items-center justify-between">
                <span className="font-serif text-[17px] font-semibold text-foreground">
                  温柔提醒
                </span>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground transition-transform active:scale-95"
                >
                  <span className="text-[16px] leading-none">×</span>
                </button>
              </div>

              {/* 系统通知权限管理 */}
              {notificationStatus !== 'granted' && (
                <button
                  onClick={onRequestPermission}
                  className={`mb-3 flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition-transform active:scale-[.98] ${
                    notificationStatus === 'denied'
                      ? 'bg-red-50/60'
                      : 'bg-sakura-soft/30'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BellIcon enabled={notificationStatus === 'default'} />
                    <span className="text-[13px] font-medium text-foreground">
                      {permissionText[notificationStatus]}
                    </span>
                  </span>
                  {notificationStatus === 'denied' ? (
                    <span className="text-[11px] text-muted-foreground">点这里重试或去系统设置开启</span>
                  ) : (
                    <span className="text-[12px] text-sakura">开启</span>
                  )}
                </button>
              )}

              {/* 总览 */}
              <div className="mb-4 rounded-2xl bg-sakura-soft/20 px-4 py-3">
                <p className="text-[13px] text-muted-foreground">
                  已设置 <span className="font-medium text-foreground">{reminders.length}</span> 个提醒
                  {todayCount > 0 && (
                    <span>，今天有 <span className="font-medium text-foreground">{todayCount}</span> 个待触发</span>
                  )}
                </p>
              </div>

              {/* 提醒列表 */}
              <div className="app-scrollbar flex-1 space-y-2 overflow-y-auto">
                {sortedReminders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <p className="text-[14px] text-muted-foreground">还没有提醒</p>
                    <p className="mt-1 text-[12px] text-muted-foreground/70">添加一个温柔的小事吧</p>
                  </div>
                ) : (
                  sortedReminders.map(reminder => (
                    <div
                      key={reminder.id}
                      className="group flex items-center gap-3 rounded-2xl bg-background px-4 py-3 transition-transform active:scale-[.98]"
                    >
                      {/* 铃铛图标 */}
                      <BellIcon enabled={reminder.enabled} />

                      {/* 文字区 */}
                      <button
                        className="flex-1 text-left"
                        onClick={() => handleEdit(reminder)}
                        onContextMenu={(e) => { e.preventDefault(); setDeleteTarget(reminder) }}
                      >
                        <p className={`text-[14px] font-medium ${reminder.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {reminder.title}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {formatRepeat(reminder.repeatDays)} · {reminder.time}
                        </p>
                      </button>

                      {/* 开关 */}
                      <button
                        onClick={() => onToggle(reminder.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                          reminder.enabled ? 'bg-sakura' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform ${
                            reminder.enabled ? 'translate-x-4 bg-white' : 'translate-x-0.5 bg-surface-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* 添加按钮 */}
              <button
                onClick={handleAdd}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-sakura px-4 py-2.5 text-[14px] font-medium text-white transition-transform active:scale-[.98]"
              >
                <PlusIcon />
                添加温柔提醒
              </button>

              {/* 说明文字 */}
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground/70">
                {notificationStatus === 'granted'
                  ? '系统通知已开启，即使 App 在后台也能收到提醒'
                  : '开启系统通知后，即使 App 在后台也能收到提醒推送'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 编辑/新增面板 */}
      <ReminderEditDialog
        open={editOpen}
        editingReminder={editingReminder}
        onSave={handleSave}
        onCancel={() => setEditOpen(false)}
      />

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 px-8"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-[280px] rounded-3xl bg-background p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <p className="font-serif text-[16px] font-semibold text-foreground">删除这个提醒？</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                「{deleteTarget.title}」将被移除，无法恢复。
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-full border border-border/50 bg-background px-4 py-2.5 text-[14px] text-muted-foreground transition-transform active:scale-[.98]"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-full bg-red-400 px-4 py-2.5 text-[14px] font-medium text-white transition-transform active:scale-[.98]"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
