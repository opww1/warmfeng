/**
 * 提醒触发弹窗组件
 *
 * 当提醒到点时，在页面中央温柔弹出
 * 风格：暖枫治愈系，圆润字体，手绘云朵图标
 *
 * 不使用 emoji，使用手绘线稿 SVG
 */

'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { WarmReminder } from '@/lib/reminder-storage'

// ── 手绘云朵 SVG 图标 ─────────────────────────────

function CloudIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="28"
      viewBox="0 0 40 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 22C5.5 22 2.5 19 2.5 15C2.5 11.5 5 8.5 8.5 8C9.5 4 12.5 1.5 16.5 1.5C20 1.5 23 3.5 24.5 6.5C25.5 5.5 27 5 28.5 5C32 5 35 8 35 11.5C37.5 12 38.5 14 38.5 16.5C38.5 19.5 36 22 33 22H10Z"
        stroke="#B8956A"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="#FBF9F1"
      />
    </svg>
  )
}

// ── 组件 Props ────────────────────────────────────

interface ReminderPopupProps {
  /** 当前触发的提醒，null 时不显示 */
  reminder: WarmReminder | null
  /** 关闭弹窗 */
  onDismiss: () => void
}

// ── 组件实现 ──────────────────────────────────────

export function ReminderPopup({ reminder, onDismiss }: ReminderPopupProps) {
  return (
    <AnimatePresence>
      {reminder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-8"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-[300px] rounded-3xl bg-background p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* 顶部云朵图标 */}
            <div className="mb-4 flex justify-center">
              <CloudIcon />
            </div>

            {/* 提醒标题 */}
            <p className="text-center font-serif text-[13px] text-muted-foreground">
              暖枫轻轻提醒你
            </p>

            {/* 提醒内容 */}
            <p className="mt-3 text-center font-serif text-[18px] font-semibold text-foreground">
              {reminder.title}
            </p>

            {/* 温柔文案（如果有） */}
            {reminder.customMessage && (
              <p className="mt-2 text-center text-[13px] leading-relaxed text-muted-foreground">
                {reminder.customMessage}
              </p>
            )}

            {/* 按钮 */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={onDismiss}
                className="rounded-full bg-sakura px-8 py-2.5 text-[14px] font-medium text-white transition-transform active:scale-[.98]"
              >
                知道了
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
