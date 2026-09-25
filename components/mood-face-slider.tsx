'use client'

import { useCallback, useState } from 'react'
import { motion } from 'motion/react'
import type { MoodScore } from '@/lib/sleep-storage'

/* ============================================================
 * 睡眠日记 · 精神状态表情滑块（MoodFaceSlider）
 *
 * 设计规范：
 * - 5 档手绘线稿表情 SVG（非 emoji，符合项目硬约束）
 * - 描边 1.5px，颜色 #4A4A4A
 * - 选中态填充低饱和度莫兰迪色背景
 * - 满宽布局（justify-between），手机端不拥挤
 * - 每个表情触摸目标 ≥36px
 * - 不显示数字 1-5，仅显示表情和文字标签
 * ============================================================ */

export interface MoodFaceSliderProps {
  /** 当前选中的评分（1-5），未选时传 null */
  value: MoodScore | null
  /** 选中变化回调 */
  onChange?: (value: MoodScore) => void
  /** 是否禁用 */
  disabled?: boolean
}

interface MoodOption {
  score: MoodScore
  label: string
  /** 选中态背景色（低饱和度莫兰迪色） */
  activeBg: string
}

const MOOD_OPTIONS: MoodOption[] = [
  { score: 1, label: '很累', activeBg: '#E8D5C4' },
  { score: 2, label: '一般累', activeBg: '#E8DDC4' },
  { score: 3, label: '还行', activeBg: '#E0E4D0' },
  { score: 4, label: '还不错', activeBg: '#D4E2D8' },
  { score: 5, label: '精力充沛', activeBg: '#D0E0E4' },
]

/* ---------- 5 个手绘线稿表情 SVG ----------
 * 统一 viewBox="0 0 32 32"
 * 描边 stroke="#4A4A4A" stroke-width="1.5"
 * fill="none"，选中态由外层容器填充背景色
 */

function MoodFace1() {
  // 很累：皱眉 + 闭眼 + 下垂嘴角
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="#4A4A4A" strokeWidth="1.5" />
      {/* 皱眉 */}
      <path d="M10 9 Q12 8 14 9.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M18 9.5 Q20 8 22 9" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 闭眼（弧线向下） */}
      <path d="M9 14 Q12 13 15 14" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M17 14 Q20 13 23 14" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 下垂嘴角 */}
      <path d="M11 22 Q16 19 21 22" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function MoodFace2() {
  // 一般累：微皱眉 + 平静眼 + 微下垂嘴角
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="#4A4A4A" strokeWidth="1.5" />
      {/* 微皱眉 */}
      <path d="M10 10 Q12 9.5 14 10" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M18 10 Q20 9.5 22 10" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 平静眼（小圆点） */}
      <circle cx="12" cy="14" r="0.9" fill="#4A4A4A" />
      <circle cx="20" cy="14" r="0.9" fill="#4A4A4A" />
      {/* 微下垂嘴角 */}
      <path d="M11 21 Q16 19.5 21 21" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function MoodFace3() {
  // 还行：平静眉 + 平静眼 + 平直嘴
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="#4A4A4A" strokeWidth="1.5" />
      {/* 平静眉 */}
      <path d="M10 10.5 L14 10.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M18 10.5 L22 10.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 平静眼（小圆点） */}
      <circle cx="12" cy="14" r="0.9" fill="#4A4A4A" />
      <circle cx="20" cy="14" r="0.9" fill="#4A4A4A" />
      {/* 平直嘴 */}
      <path d="M12 21 L20 21" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function MoodFace4() {
  // 还不错：微微笑眉 + 微笑眼 + 微笑嘴
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="#4A4A4A" strokeWidth="1.5" />
      {/* 微微笑眉（轻微上扬） */}
      <path d="M10 10.5 Q12 10 14 10.3" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M18 10.3 Q20 10 22 10.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 微笑眼（弧线向上） */}
      <path d="M9.5 14.5 Q12 13.5 14.5 14.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M17.5 14.5 Q20 13.5 22.5 14.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 微笑嘴 */}
      <path d="M11 20 Q16 22.5 21 20" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function MoodFace5() {
  // 精力充沛：笑眼 + 大笑嘴
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="#4A4A4A" strokeWidth="1.5" />
      {/* 笑眼（弯弧） */}
      <path d="M9 14.5 Q12 12 15 14.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M17 14.5 Q20 12 23 14.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 大笑嘴（开口笑） */}
      <path d="M10 19 Q16 25 22 19" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* 腮红点缀（低饱和度） */}
      <circle cx="9" cy="19" r="1.2" fill="#E8C4B8" opacity="0.7" />
      <circle cx="23" cy="19" r="1.2" fill="#E8C4B8" opacity="0.7" />
    </svg>
  )
}

const MOOD_FACES = [MoodFace1, MoodFace2, MoodFace3, MoodFace4, MoodFace5]

/* ---------- 主组件 ---------- */

export function MoodFaceSlider({ value, onChange, disabled = false }: MoodFaceSliderProps) {
  const [hoveredScore, setHoveredScore] = useState<MoodScore | null>(null)

  const handleSelect = useCallback((score: MoodScore) => {
    if (disabled) return
    onChange?.(score)
  }, [disabled, onChange])

  return (
    <div
      className="flex w-full items-center justify-between gap-1.5 rounded-2xl border border-stone-200/60 bg-[#FBF9F1] px-2 py-2.5"
      role="radiogroup"
      aria-label="起床后精神状态"
    >
      {MOOD_OPTIONS.map((option, index) => {
        const Face = MOOD_FACES[index]
        const isSelected = value === option.score
        const isHovered = hoveredScore === option.score
        const displayScore = hoveredScore ?? value

        return (
          <motion.button
            key={option.score}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            disabled={disabled}
            onClick={() => handleSelect(option.score)}
            onMouseEnter={() => setHoveredScore(option.score)}
            onMouseLeave={() => setHoveredScore(null)}
            onTouchStart={() => setHoveredScore(option.score)}
            className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-xl px-1 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: isSelected ? option.activeBg : 'transparent',
              minHeight: '64px', // 保证触摸目标 ≥36px（含 padding）
            }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: isHovered && !isSelected ? 1.05 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="flex h-8 w-8 items-center justify-center"
              animate={{
                scale: isSelected ? 1.1 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Face />
            </motion.div>
            <span
              className="text-[10px] leading-tight tracking-wide transition-colors"
              style={{
                color: isSelected || isHovered ? '#4A4A4A' : '#8B7E76',
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {option.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

/* ---------- 导出表情组件（供趋势图等场景复用） ---------- */

export { MoodFace1, MoodFace2, MoodFace3, MoodFace4, MoodFace5 }

/* ---------- 导出配置（供历史列表等场景复用） ---------- */

export function getMoodFace(score: MoodScore) {
  return MOOD_FACES[score - 1] || MoodFace3
}

export function getMoodLabel(score: MoodScore): string {
  return MOOD_OPTIONS[score - 1]?.label || ''
}

export function getMoodActiveBg(score: MoodScore): string {
  return MOOD_OPTIONS[score - 1]?.activeBg || '#E0E4D0'
}
