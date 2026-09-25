/**
 * 提醒添加/编辑面板
 *
 * 从底部滑入的半屏面板，包含：
 * - 提醒标题输入
 * - 时间选择（时:分）
 * - 重复日期选择（周日~周六）
 * - 温柔文案输入（可选）
 *
 * 风格：沿用暖枫 Design System，圆角卡片 + 暖色系
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { WarmReminder } from '@/lib/reminder-storage'

// ── 组件 Props ────────────────────────────────────

interface ReminderEditDialogProps {
  /** 是否显示 */
  open: boolean
  /** 编辑模式时的初始数据，null 为新增模式 */
  editingReminder: WarmReminder | null
  /** 保存回调 */
  onSave: (data: { title: string; time: string; repeatDays: number[]; customMessage?: string }) => void
  /** 取消回调 */
  onCancel: () => void
}

// ── 星期配置 ──────────────────────────────────────

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const DAY_VALUES = [0, 1, 2, 3, 4, 5, 6]

// ── 组件实现 ──────────────────────────────────────

export function ReminderEditDialog({ open, editingReminder, onSave, onCancel }: ReminderEditDialogProps) {
  const [title, setTitle] = useState('')
  const [hour, setHour] = useState('10')
  const [minute, setMinute] = useState('00')
  const [repeatDays, setRepeatDays] = useState<number[]>([])
  const [customMessage, setCustomMessage] = useState('')

  // 编辑模式时填充表单
  useEffect(() => {
    if (open) {
      if (editingReminder) {
        setTitle(editingReminder.title)
        const [h, m] = editingReminder.time.split(':')
        setHour(h || '10')
        setMinute(m || '00')
        setRepeatDays(editingReminder.repeatDays || [])
        setCustomMessage(editingReminder.customMessage || '')
      } else {
        // 新增模式：清空表单
        setTitle('')
        setHour('10')
        setMinute('00')
        setRepeatDays([])
        setCustomMessage('')
      }
    }
  }, [open, editingReminder])

  // 切换星期选择
  const toggleDay = (day: number) => {
    setRepeatDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  // 保存
  const handleSave = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
    onSave({
      title: trimmedTitle,
      time,
      repeatDays,
      customMessage: customMessage.trim() || undefined,
    })
  }

  // 生成小时选项 00-23
  const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  // 生成分钟选项 00-59
  const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            className="w-full max-w-[420px] rounded-t-3xl bg-card px-5 pb-8 pt-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* 顶部拖动条 */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border/60" />

            {/* 标题 */}
            <div className="mb-5 flex items-center justify-between">
              <span className="font-serif text-[17px] font-semibold text-foreground">
                {editingReminder ? '编辑提醒' : '添加温柔提醒'}
              </span>
              <button
                onClick={onCancel}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground transition-transform active:scale-95"
              >
                <span className="text-[16px] leading-none">×</span>
              </button>
            </div>

            {/* 提醒标题输入 */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[13px] text-muted-foreground">
                温柔的小事
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="喝杯温水"
                maxLength={20}
                className="w-full rounded-2xl bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-sakura/40"
              />
            </div>

            {/* 时间选择 */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[13px] text-muted-foreground">
                什么时候
              </label>
              <div className="flex items-center gap-3">
                {/* 小时选择 */}
                <select
                  value={hour}
                  onChange={e => setHour(e.target.value)}
                  className="flex-1 rounded-2xl bg-background px-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-1 focus:ring-sakura/40"
                >
                  {hourOptions.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-[16px] font-medium text-muted-foreground">:</span>
                {/* 分钟选择 */}
                <select
                  value={minute}
                  onChange={e => setMinute(e.target.value)}
                  className="flex-1 rounded-2xl bg-background px-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-1 focus:ring-sakura/40"
                >
                  {minuteOptions.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 重复日期选择 */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[13px] text-muted-foreground">
                哪天提醒
              </label>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, index) => {
                  const day = DAY_VALUES[index]
                  const selected = repeatDays.includes(day)
                  const isAllDays = repeatDays.length === 0
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`flex h-9 flex-1 items-center justify-center rounded-xl text-[13px] transition-colors ${
                        selected || isAllDays
                          ? 'bg-sakura-soft/60 text-foreground font-medium'
                          : 'bg-background text-muted-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                {repeatDays.length === 0 ? '每天都会提醒' : `每周${repeatDays.map(d => DAY_LABELS[d]).join('、')}提醒`}
              </p>
            </div>

            {/* 温柔文案输入 */}
            <div className="mb-6">
              <label className="mb-1.5 block text-[13px] text-muted-foreground">
                暖枫想悄悄说…（可选）
              </label>
              <input
                type="text"
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="记得照顾自己"
                maxLength={30}
                className="w-full rounded-2xl bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-sakura/40"
              />
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-full border border-border/50 bg-background px-4 py-2.5 text-[14px] text-muted-foreground transition-transform active:scale-[.98]"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="flex-1 rounded-full bg-sakura px-4 py-2.5 text-[14px] font-medium text-white transition-transform active:scale-[.98] disabled:opacity-40"
              >
                {editingReminder ? '保存' : '封存温柔'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
