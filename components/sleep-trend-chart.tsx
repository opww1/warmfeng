'use client'

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { SleepRecord } from '@/lib/sleep-storage'

/* ============================================================
 * 睡眠日记 · 趋势图（SleepTrendChart）
 *
 * 设计风格：治愈系手绘风（与 sports-chart 一致）
 * - 柱状图：睡眠时长（月光蓝渐变色块）
 * - 折线图：精神评分（薰衣草虚线 + 圆点）
 * - 手绘风网格线、柔和过渡动画
 *
 * 布局：
 * - 图表高度固定（≤200px），避免撑破布局
 * - 柱体宽度自适应手机屏宽
 * - 月视图支持横向滚动
 * - X 轴字体 ≥10px
 * ============================================================ */

export type TrendViewMode = 'week' | 'month'

export interface SleepTrendChartProps {
  /** 全部记录（按日期正序，最早在前） */
  records: SleepRecord[]
  /** 初始视图模式，默认 week */
  defaultMode?: TrendViewMode
  /** 图表高度，默认 180 */
  height?: number
}

interface DayData {
  date: string       // "YYYY-MM-DD"
  dayLabel: string   // "一" / "二" / ... / "12日"
  duration: number   // 睡眠时长（小时）
  mood: number       // 精神评分 1-5
  hasRecord: boolean
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

/* ---------- 工具函数 ---------- */

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDayLabel(dateStr: string, mode: TrendViewMode): string {
  const d = new Date(dateStr)
  if (mode === 'week') {
    return WEEKDAY_LABELS[d.getDay()]
  }
  // 月视图显示日期数字
  return `${d.getDate()}`
}

/**
 * 生成最近 N 天的日期序列（含今天，倒序）
 */
function generateDateRange(days: number): string[] {
  const today = new Date()
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(formatDateKey(d))
  }
  return dates
}

/**
 * 将记录映射到日期序列，无记录的日期用占位数据
 */
function buildDayDataList(
  records: SleepRecord[],
  dateRange: string[],
  mode: TrendViewMode
): DayData[] {
  const recordMap = new Map<string, SleepRecord>()
  records.forEach(r => {
    recordMap.set(r.date, r)
  })

  return dateRange.map(date => {
    const record = recordMap.get(date)
    if (record) {
      return {
        date,
        dayLabel: getDayLabel(date, mode),
        duration: record.sleepDuration,
        mood: record.mood,
        hasRecord: true,
      }
    }
    return {
      date,
      dayLabel: getDayLabel(date, mode),
      duration: 0,
      mood: 0,
      hasRecord: false,
    }
  })
}

/* ---------- 主组件 ---------- */

export function SleepTrendChart({
  records,
  defaultMode = 'week',
  height = 180,
}: SleepTrendChartProps) {
  const [mode, setMode] = useState<TrendViewMode>(defaultMode)

  const days = mode === 'week' ? 7 : 30

  const dayDataList = useMemo(() => {
    const dateRange = generateDateRange(days)
    return buildDayDataList(records, dateRange, mode)
  }, [records, days, mode])

  // 计算柱状图高度比例（睡眠时长 0-10h 映射到 0-100%）
  const MAX_DURATION = 10 // 小时
  const getBarHeightPercent = (duration: number): number => {
    if (duration <= 0) return 0
    const ratio = Math.min(duration / MAX_DURATION, 1)
    return 15 + ratio * 75 // 15% - 90% 范围，避免太矮
  }

  // 折线图 Y 轴位置（精神评分 1-5 映射到图表底部到顶部 20%-80%）
  const MOOD_MIN = 1
  const MOOD_MAX = 5
  const getMoodYPercent = (mood: number): number => {
    if (mood <= 0) return 50 // 无数据时居中
    const ratio = (mood - MOOD_MIN) / (MOOD_MAX - MOOD_MIN)
    return 80 - ratio * 60 // 80%（底部） → 20%（顶部）
  }

  // 生成折线 path（仅连接有记录的点）
  const moodPoints = dayDataList.filter(d => d.hasRecord)
  const moodPathD = useMemo(() => {
    if (moodPoints.length < 2) return ''
    return moodPoints
      .map((point, idx) => {
        const xPercent = ((dayDataList.indexOf(point) + 0.5) / dayDataList.length) * 100
        const yPercent = getMoodYPercent(point.mood)
        return `${idx === 0 ? 'M' : 'L'} ${xPercent} ${yPercent}`
      })
      .join(' ')
  }, [moodPoints, dayDataList])

  // 统计数据
  const validRecords = dayDataList.filter(d => d.hasRecord)
  const avgDuration = validRecords.length > 0
    ? validRecords.reduce((sum, d) => sum + d.duration, 0) / validRecords.length
    : 0
  const avgMood = validRecords.length > 0
    ? validRecords.reduce((sum, d) => sum + d.mood, 0) / validRecords.length
    : 0

  // 判断最长睡眠（用于柱状图强调）
  const maxDuration = Math.max(...validRecords.map(d => d.duration), 0)
  const isBestDuration = (duration: number): boolean => {
    return duration > 0 && duration === maxDuration
  }

  return (
    <div className="w-full">
      {/* 标题 + 周/月切换 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-[#4A4A4A]">这周的小睡眠</span>
          <span className="text-[10px] text-[#8B7E76]">
            · {new Date().getMonth() + 1}月
          </span>
        </div>
        <div className="flex gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => setMode('week')}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              mode === 'week'
                ? 'bg-[#D8E7F6] text-[#4A4A4A] font-semibold'
                : 'text-[#8B7E76]'
            }`}
            aria-label="周视图"
          >
            周
          </button>
          <button
            type="button"
            onClick={() => setMode('month')}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              mode === 'month'
                ? 'bg-[#D8E7F6] text-[#4A4A4A] font-semibold'
                : 'text-[#8B7E76]'
            }`}
            aria-label="月视图"
          >
            月
          </button>
        </div>
      </div>

      {/* 图表主体 - 支持横向滚动（月视图） */}
      <div
        className={`relative ${mode === 'month' ? 'overflow-x-auto scrollbar-hide' : ''}`}
        style={{ maxHeight: `${height + 40}px` }}
      >
        <div
          className="relative"
          style={{
            height: `${height}px`,
            minWidth: mode === 'month' ? '600px' : '100%',
          }}
        >
          {/* SVG 图层：网格线 + 折线 */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* 网格线（3 条横线：9h / 6h / 3h） */}
            {[20, 50, 80].map((y, i) => (
              <line
                key={i}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#E8E0D8"
                strokeWidth="0.3"
                strokeDasharray="1.5,1"
              />
            ))}

            {/* 精神评分折线 */}
            {moodPathD && (
              <motion.path
                d={moodPathD}
                fill="none"
                stroke="#E6E0F0"
                strokeWidth="0.8"
                strokeDasharray="1.5,1"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            )}
          </svg>

          {/* 精神评分折线圆点（绝对定位，在 SVG 之上） */}
          {moodPoints.map((point) => {
            const idx = dayDataList.indexOf(point)
            const xPercent = ((idx + 0.5) / dayDataList.length) * 100
            const yPercent = getMoodYPercent(point.mood)
            return (
              <div
                key={`mood-${point.date}`}
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4A4A4A]"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  background: '#E6E0F0',
                }}
              />
            )
          })}

          {/* Y 轴标签（左侧） */}
          <div className="pointer-events-none absolute left-0 top-0 flex h-full flex-col justify-between py-0 text-[9px] text-[#8B7E76]/70">
            <span>9h</span>
            <span>6h</span>
            <span>3h</span>
          </div>

          {/* 柱状图（HTML 层，便于响应式宽度） */}
          <div className="relative flex h-full items-end justify-between gap-1 pl-6">
            {dayDataList.map((day, index) => {
              const barHeight = getBarHeightPercent(day.duration)
              const isBest = isBestDuration(day.duration)

              return (
                <div
                  key={day.date}
                  className="relative flex h-full flex-1 flex-col items-center justify-end"
                >
                  {/* 柱子 */}
                  {day.hasRecord ? (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.6,
                        ease: 'easeOut',
                      }}
                      className="relative w-full rounded-t-md"
                      style={{
                        background: isBest
                          ? 'linear-gradient(180deg, #FFD6A3 0%, #FFE8C4 100%)'
                          : 'linear-gradient(180deg, #D8E7F6 0%, #E8F0FA 100%)',
                        minHeight: '6px',
                      }}
                    >
                      {/* 手绘纹理叠加 */}
                      <div
                        className="absolute inset-0 rounded-t-md opacity-25"
                        style={{
                          backgroundImage: `repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 2px,
                            rgba(255,255,255,0.15) 2px,
                            rgba(255,255,255,0.15) 4px
                          )`,
                        }}
                      />

                      {/* 最佳睡眠标记（小月亮） */}
                      {isBest && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                            <path
                              d="M8.5 5.5 A3.5 3.5 0 1 1 5 2 A2.8 2.8 0 0 0 8.5 5.5 Z"
                              fill="#FFD6A3"
                              stroke="#4A4A4A"
                              strokeWidth="0.6"
                            />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    /* 无记录日期：浅灰占位线 */
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: '2px',
                        background: '#E8E0D8',
                        opacity: 0.5,
                      }}
                    />
                  )}

                  {/* X 轴日期标签 */}
                  <span
                    className="mt-1.5 text-[10px] leading-none"
                    style={{
                      color: day.hasRecord ? '#8B7E76' : '#C4B8AE',
                    }}
                  >
                    {day.dayLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 图例和统计 */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-[#8B7E76]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-sm"
              style={{ background: 'linear-gradient(180deg, #D8E7F6, #E8F0FA)' }}
            />
            <span>睡眠时长</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full border border-[#4A4A4A]"
              style={{ background: '#E6E0F0' }}
            />
            <span>精神评分</span>
          </div>
        </div>
        {validRecords.length > 0 && (
          <div className="flex items-center gap-3">
            <span>均睡 {avgDuration.toFixed(1)}h</span>
            <span>均分 {avgMood.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- scrollbar-hide 样式（若无全局定义则补充） ---------- */
// 注：若项目 globals.css 已定义 .scrollbar-hide，此处无需重复定义
// 为确保兼容，在组件层补充内联样式（不影响全局）
