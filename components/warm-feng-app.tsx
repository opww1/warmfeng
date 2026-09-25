'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, type KeyboardEvent, useMemo, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Keyboard } from '@capacitor/keyboard'
import { App } from '@capacitor/app'
import { migrateLocalStorageToPreferences } from '@/lib/data-migration'
import { APP_VERSION } from '@/lib/app-version'
import {
  ArrowLeft,
  Bed,
  Bold,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CloudRain,
  Coffee,
  Compass,
  Droplets,
  Dumbbell,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Footprints,
  Frown,
  Glasses,
  GraduationCap,
  Heart,
  History,
  Home,
  Image as ImageIcon,
  Italic,
  Underline,
  Languages,
  Layers,
  Leaf,
  Lightbulb,
  List,
  Milestone,
  Moon,
  MoreHorizontal,
  Music,
  NotebookPen,
  Pause,
  Pencil,
  PenTool,
  Pin,
  Plane,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  Repeat1,
  Save,
  Search,
  Settings,
  Share2,
  ShoppingBag,
  Shuffle,
  SkipBack,
  SkipForward,
  Smile,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Tag,
  Target,
  Timer,
  Trash2,
  Undo2,
  UtensilsCrossed,
  UserRound,
  Wind,
  X,
  Zap,
  CheckSquare,
  Cloud,
  Mic,
  Type,
} from 'lucide-react'
import { LucideDrawIcon } from './LucideDrawIcon'
import { SunflowerVaseIllustration } from './sunflower-vase-illustration'
import { PaperStackCard } from './paper-stack-card'
import { TargetDart } from './TargetDart'
import { LinearProgress, PageLoader } from '@/components/hand-drawn'
import { TimeWeatherCard } from '@/components/time-weather-card'
import { MindTraceBook } from '@/components/mind-trace-book'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { StatusBar } from '@capacitor/status-bar'

// 兼容非安全上下文或旧浏览器的 UUID 生成（crypto.randomUUID 在 http 或不支持的浏览器中会报错）
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // fallthrough
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

import { DietModule } from '@/components/diet-module'
import { SleepDiaryPage } from '@/components/sleep-diary-page'
import { CountdownPage } from '@/components/countdown-page'
import { CountUp } from '@/components/reactbits/count-up'
import { OptionWheel } from '@/components/reactbits/option-wheel'
import { ScrollReveal } from '@/components/reactbits/scroll-reveal'
import * as GoalData from '@/lib/goal-data'
import { BreathingPage } from '@/components/BreathingPage'
import { useArticleFavorites } from '@/lib/article-favorites'
import { useReminders } from '@/lib/use-reminders'
import { ReminderPopup } from '@/components/reminder-popup'
import { ReminderSettings } from '@/components/reminder-settings'
import { presetQuotes } from '@/lib/quotes'
import type { Quote, QuoteCategory } from '@/lib/quotes'
import { storageGet, storageSet, storageRemove } from '@/lib/storage'

const quotes = [
  '不必着急，花会沿路盛开\n你也会慢慢成为自己喜欢的模样。',
  '认真生活的人\n总会在平凡的日子里遇见小小的光。',
  '今天走得慢一点也没关系\n你仍然在向喜欢的方向靠近。',
]

function CardTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-end justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">{eyebrow}</span>
        <h2 className="font-serif text-[20px] font-semibold tracking-wide text-card-foreground">{title}</h2>
      </div>
    </div>
  )
}

type SegmentKey = 'morning' | 'noon' | 'evening'

interface SegmentRecord {
  quoteId: string | null
  date: string
}

interface QuoteConfig {
  mode: 'random' | 'fixed'
  fixedQuoteId: string | null
  todayQuoteId: string | null // 保留兼容旧配置
  todayDate: string // 保留兼容旧配置
  segments: Record<SegmentKey, SegmentRecord> // 新增：早中晚分时段记录
}

// 一天内最近展示过的语录历史（用于「近期不重复」去重）
interface QuoteHistory {
  date: string
  ids: string[]
}

interface BannerConfig {
  type: 'color' | 'image'
  value: string
  gradient?: boolean // 默认 true，image 类型底部渐隐融入页面
}

// 精选语录已抽到 lib/quotes.ts（首页语录卡片与每日随机推送共用同一份）

// 顶部问候语分组清单（AI 原创撰写，无版权风险）
// 按 four 个时段分组，每组多条；每天按「日期+时段」随机抽 1 条显示（当天稳定、跨天变化）。
// 想自己加问候语：复制其中一条、改一下文字即可（详见 产品/优化功能/语录更新.md）。
// 注意：subtitle 若换行用 \n，\n 前不要带逗号/句号（与精选语录断句规范一致）。
type GreetingItem = { greeting: string; subtitle: string }
type GreetingPeriod = 'morning' | 'noon' | 'evening' | 'night'
const greetingPresets: Record<GreetingPeriod, GreetingItem[]> = {
  // 早 6:00–11:00
  morning: [
    { greeting: '早安 朋友', subtitle: '愿你从容开启当下的时光' },
    { greeting: '清晨好', subtitle: '新的一天\n慢慢来也可以' },
    { greeting: '早呀', subtitle: '今天也请好好照顾自己' },
    { greeting: '晨光里问好', subtitle: '把期待放进小事里\n一天会轻盈些' },
  ],
  // 午 11:00–13:00
  noon: [
    { greeting: '午安 朋友', subtitle: '忙了一上午\n记得好好吃顿饭' },
    { greeting: '日正当空', subtitle: '留一点午休的空隙\n给身体喘口气' },
    { greeting: '午时问好', subtitle: '喝口水 歇一歇\n下午会更轻快' },
    { greeting: '午餐时光', subtitle: '这一刻属于你\n不必惦记待办' },
  ],
  // 下午向晚 13:00–18:00
  evening: [
    { greeting: '下午好 朋友', subtitle: '午后时光\n按自己的节奏稳步走' },
    { greeting: '日色正暖', subtitle: '余下的事慢慢来\n不必追赶谁' },
    { greeting: '午后问好', subtitle: '把心事放轻些\n专注此刻便好' },
    { greeting: '向晚之前', subtitle: '无论进度如何\n你都已在前行' },
  ],
  // 夜晚 18:00 后 / 深夜
  night: [
    { greeting: '晚叙 朋友', subtitle: '不妨在此刻\n整理心中所思所想' },
    { greeting: '夜色温柔', subtitle: '这一天你已尽力\n可以安心歇下了' },
    { greeting: '夜深了 朋友', subtitle: '请多留意自己的休息' },
    { greeting: '今夜安', subtitle: '把烦忧留到天亮\n先给身体一个拥抱' },
  ],
}

// 当前小时归属哪个问候时段（与 greetingPresets 的键对齐）
function getGreetingPeriod(hour: number): GreetingPeriod {
  if (hour >= 6 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 13) return 'noon'
  if (hour >= 13 && hour < 18) return 'evening'
  return 'night'
}

// 基于「日期 + 时段」的确定性随机种子：保证同一天同一时段稳定、跨天自然变化（无需存储）
function dateSeed(period: GreetingPeriod): number {
  const d = new Date()
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${period}`
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0
  }
  return h
}

const getTimeGreeting = (): GreetingItem => {
  const period = getGreetingPeriod(new Date().getHours())
  const group = greetingPresets[period]
  // 同一天同段固定抽同一条；跨天/跨段重新按种子抽取
  return group[dateSeed(period) % group.length]
}

// 顶部 HomeHeader 背景图：按时间段自动切换（仅当用户未手动换图时生效）
const HOME_BG_DAY = '/default-banner.jpg' // 6:00–18:00
const HOME_BG_EVENING = '/home-bg-evening.jpg' // 18:00–19:30
const HOME_BG_NIGHT = '/home-bg-night.jpg' // 19:30–次日 6:00

// 依据当前时间返回应使用的时段背景图路径
function getTimeBasedHomeBg(): string {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const t = h * 60 + m
  if (t >= 6 * 60 && t < 18 * 60) return HOME_BG_DAY
  if (t >= 18 * 60 && t < 19 * 60 + 30) return HOME_BG_EVENING
  return HOME_BG_NIGHT
}

// 方案 B：顶部背景支持"按时段分别设置"，每个时段可单独选图/颜色，到点自动切换
type PeriodKey = 'day' | 'evening' | 'night'
interface PeriodConfig {
  day: BannerConfig | null
  evening: BannerConfig | null
  night: BannerConfig | null
}

// 顶部背景独立存储键（与 HeroBanner 的 heroBannerConfig_v2 解耦，避免互相影响）
const HOME_BG_PERIOD_KEY = 'homeBgPeriodConfig_v1'

// 根据当前时间返回所属时段
function getCurrentPeriod(): PeriodKey {
  const now = new Date()
  const t = now.getHours() * 60 + now.getMinutes()
  if (t >= 6 * 60 && t < 18 * 60) return 'day'
  if (t >= 18 * 60 && t < 19 * 60 + 30) return 'evening'
  return 'night'
}

// 读取顶部背景时段配置；兼容旧版单对象 heroBannerConfig_v2（仅作用于"当前时段"）
function loadHomeBgPeriodConfig(): PeriodConfig {
  const empty: PeriodConfig = { day: null, evening: null, night: null }
  try {
    const raw = localStorage.getItem(HOME_BG_PERIOD_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PeriodConfig>
      return {
        day: parsed.day ?? null,
        evening: parsed.evening ?? null,
        night: parsed.night ?? null,
      }
    }
  } catch {
    // 忽略损坏数据，走下面的迁移逻辑
  }
  // 旧版兼容：若仅存在旧的单一 heroBannerConfig_v2，迁移到当前时段（其余时段跟随默认）
  try {
    const legacy = localStorage.getItem('heroBannerConfig_v2')
    if (legacy) {
      const cfg = JSON.parse(legacy) as BannerConfig
      const period = getCurrentPeriod()
      const migrated: PeriodConfig = { day: null, evening: null, night: null }
      migrated[period] = cfg
      return migrated
    }
  } catch {
    // 忽略
  }
  return empty
}

function saveHomeBgPeriodConfig(cfg: PeriodConfig) {
  try {
    localStorage.setItem(HOME_BG_PERIOD_KEY, JSON.stringify(cfg))
  } catch {
    // 存储超限时静默失败，避免应用崩溃
  }
}

// 依据实际显示的背景图推导文字颜色：浅底用深字，深图用白字
function getHomeTextColor(image: string | null): string {
  if (!image) return '#3D3D3D'
  if (
    image === HOME_BG_EVENING ||
    image === HOME_BG_NIGHT
  ) {
    return '#FFFFFF'
  }
  // 默认浅图 / 纯色浅底(transparent、oklch 浅色) / 用户上传图：统一用深字
  return '#3D3D3D'
}

/* getMeTextColor：仅"我的"页壁纸文字色使用。2026-08-04 随 MePage 下线，
   2026-08 已恢复。 */
function getMeTextColor(imageDataUrl: string | null): Promise<string> {
  if (!imageDataUrl) return Promise.resolve('#3D3D3D')
  return new Promise((resolve) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        // 缩小采样以提高性能（最多 50x50）
        const sampleSize = 50
        const ratio = Math.min(sampleSize / img.width, sampleSize / img.height)
        canvas.width = Math.max(1, Math.round(img.width * ratio))
        canvas.height = Math.max(1, Math.round(img.height * ratio))
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve('#3D3D3D'); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

        let totalLuminance = 0
        const pixelCount = data.length / 4
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          // 相对亮度公式（sRGB 感知亮度）
          const lum = 0.299 * r + 0.587 * g + 0.114 * b
          totalLuminance += lum
        }
        const avgLuminance = totalLuminance / pixelCount
        // 亮度 < 100 → 深色背景 → 白色文字；否则 → 深色文字
        resolve(avgLuminance < 100 ? '#FFFFFF' : '#3D3D3D')
      } catch {
        resolve('#3D3D3D')
      }
    }
    img.onerror = () => resolve('#3D3D3D')
    img.src = imageDataUrl
  })
}

// 计算到下一个时段边界（6:00 / 18:00 / 19:30 / 次日 6:00）的毫秒数，用于自动切换背景
function getNextHomeBgSwitchDelay(): number {
  const now = new Date()
  const tMin = now.getHours() * 60 + now.getMinutes()
  const boundaries = [6 * 60, 18 * 60, 19 * 60 + 30, 30 * 60] // 30*60 = 次日 6:00（跨午夜）
  let next = boundaries.find((b) => b > tMin)
  let targetMin: number
  if (next === undefined) {
    targetMin = 30 * 60 // 已过后，下一边界是次日 6:00
  } else {
    targetMin = next > 24 * 60 ? next - 24 * 60 : next // 30*60 → 6*60
  }
  let diffMin = targetMin - tMin
  if (diffMin <= 0) diffMin += 24 * 60
  const ms = diffMin * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds()
  return Math.max(1000, ms)
}

function useTimeGreeting() {
  // 固定初始问候语（避免 SSR 与客户端时间差导致 Hydration Mismatch）
  // SSR 没有 localStorage 也没有真实时间，必须用确定性常量；客户端水合后再切到实时值
  const [greeting, setGreeting] = useState<GreetingItem>(greetingPresets.morning[0])

  useEffect(() => {
    // 水合完成后立即对齐到当前真实时间的问候语
    setGreeting(getTimeGreeting())
    // 仅在「日期或时段」变化时重抽，避免每分钟无效重渲染
    let lastKey = `${new Date().toDateString()}-${getGreetingPeriod(new Date().getHours())}`
    const timer = setInterval(() => {
      const key = `${new Date().toDateString()}-${getGreetingPeriod(new Date().getHours())}`
      if (key !== lastKey) {
        lastKey = key
        setGreeting(getTimeGreeting())
      }
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  return greeting
}

// —— 精选语录：时段划分与近期不重复辅助函数 ——

// 按小时划分时段：早 6–11 / 中 12–17 / 晚 18–次日5
function getSegment(hour: number): SegmentKey {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'noon'
  return 'evening'
}

// 默认空时段记录
function emptySegments(): Record<SegmentKey, SegmentRecord> {
  return {
    morning: { quoteId: null, date: '' },
    noon: { quoteId: null, date: '' },
    evening: { quoteId: null, date: '' },
  }
}

// 读取近期展示历史（最近 days 天），用于「近期不重复」去重
function loadQuoteHistory(days = 7): QuoteHistory[] {
  const stored = localStorage.getItem('dailyQuoteHistory')
  if (!stored) return []
  try {
    const list = JSON.parse(stored) as QuoteHistory[]
    return Array.isArray(list) ? list.slice(-days) : []
  } catch {
    return []
  }
}

// 把今天展示的语录 id 写入历史（按日期聚合，裁剪到最近 days 天）
function saveQuoteHistory(date: string, id: string, days = 7) {
  const list = loadQuoteHistory(days)
  const todayEntry = list.find(h => h.date === date)
  if (todayEntry) {
    if (!todayEntry.ids.includes(id)) todayEntry.ids.push(id)
  } else {
    list.push({ date, ids: [id] })
  }
  const trimmed = list.slice(-days)
  localStorage.setItem('dailyQuoteHistory', JSON.stringify(trimmed))
}

// 从池中挑选一条「近期未重复」的语录：
// 排除今天其他时段 + 最近两天出现过的 id；若排除后为空则退化为全池随机
function pickNonRepeating(
  pool: Quote[],
  history: QuoteHistory[],
  excludeTodayIds: string[],
): Quote {
  const recent = history.slice(-2).flatMap(h => h.ids) // 最近两天
  const banned = new Set([...excludeTodayIds, ...recent])
  const candidates = pool.filter(q => !banned.has(q.id))
  const source = candidates.length > 0 ? candidates : pool
  return source[Math.floor(Math.random() * source.length)]
}

// 读取语录配置，兼容旧版（缺 segments 字段时安全降级）
function loadQuoteConfig(): QuoteConfig {
  const today = getTodayDate()
  const fallback: QuoteConfig = {
    mode: 'random',
    fixedQuoteId: null,
    todayQuoteId: null,
    todayDate: today,
    segments: emptySegments(),
  }
  const stored = localStorage.getItem('dailyQuoteConfig')
  if (!stored) return fallback
  try {
    const parsed = JSON.parse(stored) as Partial<QuoteConfig>
    return {
      mode: parsed.mode ?? 'random',
      fixedQuoteId: parsed.fixedQuoteId ?? null,
      todayQuoteId: parsed.todayQuoteId ?? null,
      todayDate: parsed.todayDate ?? today,
      segments: { ...emptySegments(), ...(parsed.segments ?? {}) },
    }
  } catch {
    return fallback
  }
}

// 合并预设与用户自定义语录
function getMergedQuotes(): Quote[] {
  const stored = localStorage.getItem('dailyQuotes')
  if (!stored) return [...presetQuotes]
  try {
    const saved = JSON.parse(stored) as Quote[]
    const custom = saved.filter(q => q.type === 'custom')
    return [...presetQuotes, ...custom]
  } catch {
    return [...presetQuotes]
  }
}

function useDailyQuote() {
  /**
   * 实现说明：
   * 1. 初始状态设为第一个预设手记，避免 Next.js 在客户端挂载前的 UI 坍塌（图一现象）。
   * 2. 在 useEffect 中从 localStorage 读取用户配置或生成今日随机手记。
   * 3. 增加 text 校验，确保渲染的内容始终有效。
   */
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(presetQuotes[0])

  useEffect(() => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const segment = getSegment(now.getHours())

    const mergedQuotes = getMergedQuotes()
    const config = loadQuoteConfig()

    let selectedQuote: Quote | null = null

    if (config.mode === 'fixed' && config.fixedQuoteId) {
      // 固定模式：整页固定一条，不分时段
      selectedQuote = mergedQuotes.find(q => q.id === config.fixedQuoteId) || mergedQuotes[0] || null
    } else {
      const segRecord = config.segments[segment]
      if (segRecord.date === today && segRecord.quoteId) {
        // 今天该时段已选过，直接复用（当天不跳变）
        selectedQuote = mergedQuotes.find(q => q.id === segRecord.quoteId) || null
      }

      if (!selectedQuote || !selectedQuote.text) {
        // 今天其他时段已展示的 id，保证一天内早中晚互不重复
        const otherSegIds = (Object.keys(config.segments) as SegmentKey[])
          .filter(k => k !== segment && config.segments[k].date === today)
          .map(k => config.segments[k].quoteId)
          .filter((id): id is string => !!id)

        const history = loadQuoteHistory(7)
        selectedQuote = pickNonRepeating(mergedQuotes, history, otherSegIds)

        const newSegments = {
          ...config.segments,
          [segment]: { quoteId: selectedQuote.id, date: today },
        }
        const newConfig: QuoteConfig = { ...config, todayDate: today, segments: newSegments }
        localStorage.setItem('dailyQuoteConfig', JSON.stringify(newConfig))
        saveQuoteHistory(today, selectedQuote.id, 7)
      }
    }

    if (selectedQuote && selectedQuote.text) {
      setCurrentQuote(selectedQuote)
    }
  }, [])

  return currentQuote
}

function HomeHeader({ textColor }: { textColor: string }) {
  const { greeting, subtitle } = useTimeGreeting()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('homeGreetingVisible')
    if (stored !== null) setVisible(stored === 'true')
  }, [])

  const toggleGreeting = () => {
    const next = !visible
    setVisible(next)
    localStorage.setItem('homeGreetingVisible', String(next))
  }

  return (
    <section className="relative pt-3 pb-1">
      <button
        onClick={toggleGreeting}
        style={{ color: textColor }}
        className="absolute right-0 top-3 z-20 flex size-7 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
        title={visible ? '隐藏问候语' : '显示问候语'}
        aria-label={visible ? '隐藏问候语' : '显示问候语'}
      >
        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <div
        className={`relative z-10 flex flex-col gap-1 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!visible}
      >
        <motion.h2
          className="font-serif text-[28px] font-medium tracking-[0.04em]"
          style={{ color: textColor }}
          animate={visible ? { opacity: [0.92, 1, 0.92] } : { opacity: 0 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {greeting}
        </motion.h2>
        <p
          className="font-serif text-[16px] leading-7 tracking-[0.02em] font-medium"
          style={{ color: textColor }}
        >
          {subtitle}
        </p>
      </div>
    </section>
  )
}

const TEXT_COLORS = [
  { name: '墨黑', value: '#3D3D3D' },
  { name: '暖棕', value: '#8B6F4E' },
  { name: '墨绿', value: '#5C7A5A' },
  { name: '砖红', value: '#A0522D' },
  { name: '灰蓝', value: '#6B7B8C' },
  { name: '紫灰', value: '#8B7E8A' },
  { name: '白色', value: '#FFFFFF' },
]

const HERO_BANNER_LONG_PRESS_MS = 1500
const HERO_BANNER_CORNER_RADIUS = 5

const getBorderPathLength = (w: number, h: number) =>
  2 * (w + h) - 8 * HERO_BANNER_CORNER_RADIUS + 2 * Math.PI * HERO_BANNER_CORNER_RADIUS

const getBorderPathD = (w: number, h: number) =>
  `M${HERO_BANNER_CORNER_RADIUS},0 L${w - HERO_BANNER_CORNER_RADIUS},0 A${HERO_BANNER_CORNER_RADIUS},${HERO_BANNER_CORNER_RADIUS} 0 0 1 ${w},${HERO_BANNER_CORNER_RADIUS} L${w},${h - HERO_BANNER_CORNER_RADIUS} A${HERO_BANNER_CORNER_RADIUS},${HERO_BANNER_CORNER_RADIUS} 0 0 1 ${w - HERO_BANNER_CORNER_RADIUS},${h} L${HERO_BANNER_CORNER_RADIUS},${h} A${HERO_BANNER_CORNER_RADIUS},${HERO_BANNER_CORNER_RADIUS} 0 0 1 0,${h - HERO_BANNER_CORNER_RADIUS} L0,${HERO_BANNER_CORNER_RADIUS} A${HERO_BANNER_CORNER_RADIUS},${HERO_BANNER_CORNER_RADIUS} 0 0 1 ${HERO_BANNER_CORNER_RADIUS},0 Z`

function HeroBanner() {
  const currentQuote = useDailyQuote()
  const [showSettings, setShowSettings] = useState(false)
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>({ type: 'image', value: '/default-banner.jpg' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressMovedRef = useRef(false)
  const sectionRef = useRef<HTMLElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [sectionSize, setSectionSize] = useState({ w: 0, h: 0 })

  const [textColor, setTextColor] = useState('#3D3D3D')
  const [textVisible, setTextVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [customQuoteText, setCustomQuoteText] = useState('')
  const [customLabelText, setCustomLabelText] = useState('')

  const MAX_QUOTE_LENGTH = 40
  const MAX_LABEL_LENGTH = 20

  useEffect(() => {
    const stored = localStorage.getItem('heroBannerConfig_v2')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') setBannerConfig(parsed)
      } catch (e) {
        console.error('Failed to parse banner config', e)
      }
    }

    const storedTextColor = localStorage.getItem('dailyQuoteTextColor')
    if (storedTextColor) setTextColor(storedTextColor)

    const storedVisible = localStorage.getItem('dailyQuoteTextVisible')
    if (storedVisible !== null) setTextVisible(storedVisible === 'true')

    const storedQuote = localStorage.getItem('heroBannerCustomQuote')
    if (storedQuote) setCustomQuoteText(storedQuote)

    const storedLabel = localStorage.getItem('heroBannerCustomLabel')
    if (storedLabel) setCustomLabelText(storedLabel)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSectionSize({ w: rect.width, h: rect.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const path = pathRef.current
    if (!path || sectionSize.w === 0 || sectionSize.h === 0) return
    const totalLen = getBorderPathLength(sectionSize.w, sectionSize.h)
    path.style.strokeDasharray = String(totalLen)
    path.style.strokeDashoffset = String(totalLen)
    path.style.transition = 'none'
  }, [sectionSize])

  const updateBannerConfig = (newConfig: BannerConfig) => {
    setBannerConfig(newConfig)
    localStorage.setItem('heroBannerConfig_v2', JSON.stringify(newConfig))
    window.dispatchEvent(new Event('bannerConfigChanged'))
  }

  const updateTextColor = (color: string) => {
    setTextColor(color)
    localStorage.setItem('dailyQuoteTextColor', color)
  }

  const updateTextVisible = (visible: boolean) => {
    setTextVisible(visible)
    localStorage.setItem('dailyQuoteTextVisible', String(visible))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateBannerConfig({ type: 'image', value: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const presetBanners = [
    { type: 'image' as const, name: '默认', value: '/default-banner.jpg' },
    { type: 'color' as const, name: '纯色', value: 'transparent' },
    { type: 'color' as const, name: '樱花', value: 'oklch(0.97 0.015 15)' },
    { type: 'color' as const, name: '嫩叶', value: 'oklch(0.97 0.02 148)' },
    { type: 'color' as const, name: '晴空', value: 'oklch(0.97 0.015 230)' },
  ]

  const isDefaultColor = textColor === '#3D3D3D'

  const displayedQuote = customQuoteText || (currentQuote?.text ?? '')
  const displayedLabel = customLabelText || ''

  const handleQuoteBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.target.innerText.trim()
    if (text) {
      const limited = text.slice(0, MAX_QUOTE_LENGTH)
      setCustomQuoteText(limited)
      localStorage.setItem('heroBannerCustomQuote', limited)
    } else {
      setCustomQuoteText('')
      localStorage.removeItem('heroBannerCustomQuote')
    }
  }

  const handleLabelBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    const text = e.target.innerText.trim()
    if (text) {
      const limited = text.slice(0, MAX_LABEL_LENGTH)
      setCustomLabelText(limited)
      localStorage.setItem('heroBannerCustomLabel', limited)
    } else {
      setCustomLabelText('')
      localStorage.removeItem('heroBannerCustomLabel')
    }
  }

  const toggleEditMode = () => {
    setShowSettings(false)
    if (!isEditing) {
      if (!customQuoteText && currentQuote) {
        setCustomQuoteText(currentQuote.text)
      }
      if (!customLabelText) {
        setCustomLabelText('— 今日手记')
      }
    }
    setIsEditing(!isEditing)
  }

  const handleSaveAndClose = () => {
    setIsEditing(false)
    setShowSettings(false)
  }

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const resetAnimationPath = () => {
    const path = pathRef.current
    if (!path) return
    const totalLen = getBorderPathLength(sectionSize.w, sectionSize.h)
    path.style.transition = 'none'
    path.style.strokeDashoffset = String(totalLen)
    path.getBoundingClientRect()
  }

  const handlePointerDown = () => {
    longPressMovedRef.current = false
    clearLongPressTimer()
    resetAnimationPath()
    setIsAnimating(true)
    const path = pathRef.current
    if (path) {
      const totalLen = getBorderPathLength(sectionSize.w, sectionSize.h)
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 1.5s linear'
        path.style.strokeDashoffset = '0'
      })
    }
    longPressTimerRef.current = setTimeout(() => {
      if (!longPressMovedRef.current) {
        setShowSettings(true)
        setIsAnimating(false)
        resetAnimationPath()
      }
    }, HERO_BANNER_LONG_PRESS_MS)
  }

  const handlePointerMove = () => {
    longPressMovedRef.current = true
    clearLongPressTimer()
    setIsAnimating(false)
    resetAnimationPath()
  }

  const handlePointerUp = () => {
    clearLongPressTimer()
    setIsAnimating(false)
    resetAnimationPath()
  }

  return (
    <div className="relative mb-2">
      <section
        ref={sectionRef}
        className={`relative w-full paper-texture border border-stone-200/60 rounded-[15px] transition-colors duration-500 active:scale-[0.98] transition-transform duration-150 ${isEditing ? 'ring-2 ring-sakura/40 ring-offset-2' : ''}`}
        style={{
          height: '194px',
          backgroundColor: bannerConfig.type === 'color' ? bannerConfig.value : 'transparent',
          backgroundImage: bannerConfig.type === 'image' ? `url(${bannerConfig.value})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '8px',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {isEditing && (
          <div className="absolute right-2 top-2 z-30 flex gap-1">
            <button
              onClick={() => {
                setIsEditing(false)
                setCustomQuoteText('')
                setCustomLabelText('')
                localStorage.removeItem('heroBannerCustomQuote')
                localStorage.removeItem('heroBannerCustomLabel')
              }}
              className="flex size-6 items-center justify-center rounded-full border border-stone-200/60 bg-white/80 text-muted-foreground/60 transition-colors hover:text-muted-foreground dark:border-border dark:bg-surface-1"
            >
              <Plus size={12} strokeWidth={2} className="rotate-45" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
              }}
              className="flex size-6 items-center justify-center rounded-full border border-stone-200/60 bg-white/80 text-muted-foreground/60 transition-colors hover:text-muted-foreground dark:border-border dark:bg-surface-1"
            >
              <Check size={12} strokeWidth={2} />
            </button>
          </div>
        )}

        {(textVisible || isEditing) && (isEditing || displayedQuote) && (
          isEditing ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={handleQuoteBlur}
              className="relative z-10 whitespace-pre-line font-serif text-[23px] leading-7 tracking-wide outline-none cursor-text focus:bg-surface-2/40 rounded px-1 -mx-1"
              style={{ color: isDefaultColor ? undefined : textColor }}
            >
              {displayedQuote}
            </div>
          ) : (
            <blockquote
              className="relative z-10 whitespace-pre-line font-serif text-[23px] leading-7 tracking-wide"
              style={{ color: isDefaultColor ? undefined : textColor }}
            >
              {displayedQuote}
            </blockquote>
          )
        )}
        {(textVisible || isEditing) && (
          isEditing ? (
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={handleLabelBlur}
              className="absolute bottom-0 right-0 flex h-[60px] w-[100px] flex-col font-serif text-[17px] outline-none cursor-text focus:bg-surface-2/40 rounded px-1 -mx-1 z-10"
              style={{ paddingTop: '22px', paddingBottom: '22px', color: isDefaultColor ? undefined : textColor }}
            >
              {displayedLabel}
            </span>
          ) : (
            <span
              className="absolute bottom-0 right-0 flex h-[60px] w-[100px] flex-col font-serif text-[17px] z-10"
              style={{ paddingTop: '22px', paddingBottom: '22px', color: isDefaultColor ? undefined : textColor }}
            >
              {displayedLabel}
            </span>
          )
        )}
      </section>

      {sectionSize.w > 0 && sectionSize.h > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 overflow-visible z-10"
          width={sectionSize.w}
          height={sectionSize.h}
          viewBox={`0 0 ${sectionSize.w} ${sectionSize.h}`}
        >
          <path
            ref={pathRef}
            d={getBorderPathD(sectionSize.w, sectionSize.h)}
            fill="none"
            stroke="#4A4A4A"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={handleSaveAndClose}
        >
          <div
            className="mx-4 w-72 rounded-2xl bg-card p-4 shadow-lg max-h-[85vh] overflow-y-auto dark:bg-surface-1"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-xs font-medium text-muted-foreground">背景设置</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {presetBanners.map((item) => (
                <button
                  key={item.name}
                  onClick={() => updateBannerConfig({ type: item.type, value: item.value })}
                  className={`size-7 rounded-lg border border-stone-200 transition-transform active:scale-90 overflow-hidden ${
                    bannerConfig.value === item.value ? 'ring-1 ring-sakura ring-offset-1' : ''
                  }`}
                  style={item.type === 'image' ? {
                    backgroundImage: `url(${item.value})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  } : { backgroundColor: item.value === 'transparent' ? 'var(--surface-1)' : item.value }}
                  title={item.name}
                />
              ))}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-stone-200 py-2 text-xs text-muted-foreground hover:bg-stone-50 transition-colors mb-4"
            >
              <Plus size={14} />
              <span>上传背景图</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="border-t border-stone-200/70 pt-3 mb-3" />

            <p className="mb-3 text-xs font-medium text-muted-foreground">文字颜色</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => updateTextColor(color.value)}
                  className={`size-7 rounded-lg border border-stone-200 transition-transform active:scale-90 ${
                    textColor === color.value ? 'ring-1 ring-sakura ring-offset-1' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>

            <div className="border-t border-stone-200/70 pt-3 mb-3" />

            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground">修改内容</p>
              <button
                onClick={toggleEditMode}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  isEditing ? 'bg-sakura/20 text-sakura' : 'text-muted-foreground hover:bg-stone-50'
                }`}
                title="点击进入编辑模式"
              >
                <Edit2 size={12} />
                <span>{isEditing ? '完成' : '修改'}</span>
              </button>
            </div>
            {isEditing && (
              <p className="mb-3 text-[11px] text-muted-foreground">点击卡片上的文字直接编辑，失焦自动保存</p>
            )}

            <div className="border-t border-stone-200/70 pt-3 mb-3" />

            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">显示内容</p>
              <button
                onClick={() => updateTextVisible(!textVisible)}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-stone-50 transition-colors"
                title={textVisible ? '点击隐藏文字' : '点击显示文字'}
              >
                {textVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{textVisible ? '隐藏' : '显示'}</span>
              </button>
            </div>

            <div className="border-t border-stone-200/70 mt-4 pt-3" />

            <button
              onClick={handleSaveAndClose}
              className="w-full rounded-xl bg-sakura py-2.5 text-sm font-medium text-white hover:bg-sakura/90 transition-colors active:scale-[0.98]"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureNav({ onFeature }: { onFeature: (module: string) => void }) {
  const features = [
    { icon: Lightbulb, label: '灵感', target: '灵感' },
    { icon: CalendarDays, label: '盼兮', target: '盼兮' },
    { icon: Heart, label: '心迹', target: '心迹' },
    { icon: Wind, label: '深呼吸', target: '深呼吸' },
  ]

  return (
    <section className="relative mt-4 mb-7 pb-5">
      <div className="flex items-center justify-between gap-3 px-4">
        {features.map(({ icon: Icon, label, target }) => (
          <button
            key={label}
            aria-label={label}
            onClick={() => onFeature(target)}
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
          >
            <div className="flex w-14 h-14 items-center justify-center rounded-full border border-stone-200/60 bg-[#F6EBDD] dark:border-border dark:bg-surface-2">
              <Icon size={26} strokeWidth={1.5} className="text-muted-foreground/80" />
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>
      {/* 工具栏下的手绘直线下划线（纯装饰，绝对定位，不影响布局） */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-2" aria-hidden="true">
        <svg width="100%" height="10" viewBox="0 0 300 10" preserveAspectRatio="none" fill="none">
          <path d="M2 6 C 60 3, 120 8, 180 5 S 280 7, 298 4" stroke="#6B5E58" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
        </svg>
      </div>
    </section>
  )
}

function TodayPlanCard({ onClick }: { onClick?: () => void }) {
  const [stats, setStats] = useState({ total: 0, completed: 0 })

  const refreshStats = useCallback(() => {
    const todayKey = toKey(new Date())
    // 优先读取「这周的小日子」周计划（warmFengPlan）中今天的完成情况，
    // 这才是用户真正在用的计划系统；旧的 todayTasks 仅作 fallback
    const planStored = localStorage.getItem('warmFengPlan')
    if (planStored) {
      try {
        const plan = JSON.parse(planStored) as PlanDay[]
        const todayDay = plan.find(d => d.date === todayKey)
        if (todayDay && Array.isArray(todayDay.items)) {
          const items = todayDay.items
          setStats({
            total: items.length,
            completed: items.filter(i => i.done).length,
          })
          return
        }
      } catch {
        /* 解析失败则继续走 fallback */
      }
    }
    // fallback：旧的简单任务列表（todayTasks）
    const stored = localStorage.getItem('todayTasks')
    if (stored) {
      try {
        const tasks = JSON.parse(stored) as { completed: boolean }[]
        setStats({
          total: tasks.length,
          completed: tasks.filter(t => t.completed).length,
        })
      } catch {
        setStats({ total: 0, completed: 0 })
      }
    } else {
      setStats({ total: 0, completed: 0 })
    }
  }, [])

  useEffect(() => {
    refreshStats()
    // 监听任务数据更新，回到首页时也能正确刷新 0/0 计数
    window.addEventListener('data-updated', refreshStats)
    window.addEventListener('storage', refreshStats)
    return () => {
      window.removeEventListener('data-updated', refreshStats)
      window.removeEventListener('storage', refreshStats)
    }
  }, [refreshStats])

  const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="查看今日计划详情"
      className="block w-full cursor-pointer rounded-xl border border-stone-200/80 bg-background/60 px-5 py-2 text-left shadow-sm transition-colors hover:bg-stone-50/80 dark:border-border dark:bg-surface-1 dark:hover:bg-surface-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[17px] font-medium tracking-wide text-foreground">今日计划</span>
        </div>
        {stats.total > 0 && (
          <span className="font-serif text-[13px] text-muted-foreground">
            {stats.completed}/{stats.total}
          </span>
        )}
      </div>
      {stats.total === 0 ? (
        <p className="mt-1 text-[12px] text-muted-foreground/50 italic">还没有计划，点击添加</p>
      ) : (
        <>
          <LinearProgress value={percent} size={6} aria-label="今日计划完成度" />
          <div className="mt-0.5 flex justify-end">
            <span className="text-[11px] text-muted-foreground/60">{percent}% 完成</span>
          </div>
        </>
      )}
    </button>
  )
}

/** 将 react-easy-crop 裁剪区域通过 canvas 输出为 dataURL（头像/壁纸裁剪共用） */
function cropAreaToDataURL(imageSrc: string, pixelCrop: Area): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.src = imageSrc
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
  })
}

function useShare() {
  const share = useCallback(async (data: { title?: string; text: string; url?: string }) => {
    if (typeof navigator === 'undefined') return
    const shareData = {
      title: data.title?.slice(0, 100),
      // 不再截断正文（旧版截 500 字导致分享文章只剩标题简介）
      text: data.text.slice(0, 10000),
      url: data.url,
    }
    try {
      // 原生 App：走 Capacitor Share 插件弹出系统分享面板（WebView 的 navigator.share 不可靠）
      if (Capacitor.isNativePlatform()) {
        await Share.share(shareData)
        return
      }
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
    } catch {
      // 用户取消或分享失败，降级到复制
    }
    try {
      const copyText = `${shareData.title ? shareData.title + '\n' : ''}${shareData.text}${shareData.url ? '\n' + shareData.url : ''}`
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText)
        toast('已复制到剪贴板')
      } else {
        const ta = document.createElement('textarea')
        ta.value = copyText
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        toast('已复制到剪贴板')
      }
    } catch {
      toast('分享失败，请手动复制')
    }
  }, [])

  return share
}

function toast(message: string) {
  const el = document.createElement('div')
  el.textContent = message
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);padding:10px 20px;background:rgba(0,0,0,0.75);color:#fff;border-radius:8px;font-size:13px;z-index:9999;pointer-events:none;transition:opacity 0.3s'
  document.body.appendChild(el)
  requestAnimationFrame(() => { el.style.opacity = '1' })
  setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => document.body.removeChild(el), 300)
  }, 1800)
}

function HealingQuotes() {
  // 使用预设第一条作为初始值（SSR 与客户端首渲染一致，同时避免首屏空闪）
  // 真正当天/时段的语录在 useEffect 中异步获取并替换
  const [quote, setQuote] = useState<Quote | null>(presetQuotes[0])

  useEffect(() => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const segment = getSegment(now.getHours())

    const mergedQuotes = getMergedQuotes()
    const config = loadQuoteConfig()

    let selected: Quote | null = null

    if (config.mode === 'fixed' && config.fixedQuoteId) {
      selected = mergedQuotes.find(q => q.id === config.fixedQuoteId) || mergedQuotes[0] || null
    } else {
      const segRecord = config.segments[segment]
      if (segRecord.date === today && segRecord.quoteId) {
        selected = mergedQuotes.find(q => q.id === segRecord.quoteId) || null
      }

      if (!selected) {
        const otherSegIds = (Object.keys(config.segments) as SegmentKey[])
          .filter(k => k !== segment && config.segments[k].date === today)
          .map(k => config.segments[k].quoteId)
          .filter((id): id is string => !!id)
        const history = loadQuoteHistory(7)
        selected = pickNonRepeating(mergedQuotes, history, otherSegIds)

        const newSegments = { ...config.segments, [segment]: { quoteId: selected.id, date: today } }
        localStorage.setItem('dailyQuoteConfig', JSON.stringify({ ...config, todayDate: today, segments: newSegments }))
        saveQuoteHistory(today, selected.id, 7)
      }
    }

    setQuote(selected)
  }, [])

  const share = useShare()

  return (
    <div className="relative -mx-5 px-5 py-2 paper-texture">
      <div className="flex items-center gap-2">
        <Sparkles size={14} strokeWidth={1.5} style={{ color: '#B8956A' }} />
        <span className="font-serif text-[16px] font-medium tracking-wide text-foreground">精选语录</span>
      </div>
      {quote && (
        <div className="relative mt-2">
          <div className="border-l-2 pl-3 pr-20" style={{ borderColor: '#C4A882' }}>
            <blockquote className="whitespace-pre-line font-serif text-[22px] leading-9 tracking-[0.04em] font-medium text-muted-foreground">
              {quote.text}
            </blockquote>
            <div className="mt-2 flex items-center justify-end gap-2 relative z-10">
              <button
                onClick={(e) => { e.stopPropagation(); share({ text: `${quote.text}\n——${quote.source ?? '暖枫社区分享'}\n——来自暖枫` }) }}
                aria-label="分享语录"
                className="flex size-6 items-center justify-center rounded-full transition-colors active:scale-90 hover:bg-stone-100"
              >
                <Share2 size={14} strokeWidth={1.8} style={{ color: '#B8956A' }} />
              </button>
              <span className="text-[12px] font-semibold text-foreground -mr-14">——{quote.source ?? '暖枫社区分享'}</span>
            </div>
          </div>
          <SunflowerVaseIllustration size={75} className="absolute bottom-0 right-0 opacity-95 z-0" />
        </div>
      )}
    </div>
  )
}

type ContentTab = '学习法' | '歇一会儿' | '成长指南' | '生活节奏' | '关系与人际'
type ArticleBlock = { h?: string; p: string }
type Article = {
  title: string
  desc: string
  date: string
  category: ContentTab
  cover?: string // 占位阶段留空，阅读器用渐变块
  body: ArticleBlock[]
}

const contentData: Record<ContentTab, Article[]> = {
  '学习法': [
    {
      title: '费曼学习法',
      desc: '高效学习的最强方法论',
      date: '2026.07.28',
      category: '学习法',
      body: [
        { p: '费曼学习法由物理学家理查德·费曼的实践总结而来。他的同事曾回忆：费曼能把最艰深的概念，用连外行都能听懂的话讲清楚——这背后不是天赋，而是一套可复制的学习流程。' },
        { h: '第一步：选一个概念，假装教给小孩', p: '拿出一张白纸，写下你要理解的概念，然后用最朴素的语言解释它，就像在给一个完全没基础的孩子讲课。一旦你不得不"绕弯子"或用行话糊弄，就说明这里你其实没真懂。' },
        { h: '第二步：找出卡壳的地方', p: '解释过程中卡住、说不清的细节，正是你的知识盲区。回到教材或原始资料，把这些漏洞补上，再重新用大白话讲一遍。' },
        { h: '第三步：简化并打比方', p: '好的理解往往能用类比表达。把抽象概念映射到生活经验里（比如把"电流"比作"水流"），记忆与迁移都会变容易。' },
        { h: '第四步：复述与迭代', p: '合上书，完整讲一遍。能流畅讲清楚，才算真正掌握。这套方法的核心不是"学更多"，而是"暴露不懂"。' },
      ],
    },
    {
      title: '番茄工作法',
      desc: '专注时间管理的经典实践',
      date: '2026.07.26',
      category: '学习法',
      body: [
        { p: '番茄工作法由意大利人弗朗西斯科·西里洛（Francesco Cirillo）在 1980 年代提出。名字来自他当年用一个番茄形状的厨房计时器来掐时间——"番茄"（pomodoro）由此得名。' },
        { h: '核心节奏：25 分钟专注 + 5 分钟休息', p: '把一个番茄钟设为 25 分钟，期间只做一件事、隔绝干扰；钟响后休息 5 分钟，起身走动、喝水。每完成 4 个番茄钟，休息 15–30 分钟。' },
        { h: '为什么有效', p: '它把"庞大的任务"切成可吞咽的小段，降低了开始的心理门槛；固定节奏也训练大脑进入"专注—放松"的节律，减少拖延。' },
        { h: '使用小贴士', p: '记录每天完成的番茄数，能帮你客观估量任务量；遇到被打断，要么记下来稍后处理，要么把这个番茄作废重来——守护"专注时段"本身是方法的关键。' },
      ],
    },
    {
      title: '思维导图法',
      desc: '结构化思考与记忆技巧',
      date: '2026.07.24',
      category: '学习法',
      body: [
        { p: '思维导图由英国大脑研究学者东尼·博赞（Tony Buzan）在 1970 年代推广。他受达·芬奇笔记的启发，提出用"放射性思考"把信息画成树状网络，而非线性罗列。' },
        { h: '从中心出发，向四周发散', p: '在纸中央写下主题，向外引出主分支（关键词），再逐层细分。用颜色、图像、曲线，让大脑对"形状与关联"更敏感。' },
        { h: '它适合什么场景', p: '读书笔记、头脑风暴、项目规划、复习梳理——凡是需要"看清结构、记住关系"的任务都好用。它逼你把信息压缩成关键词，本身就是一个加工理解的过程。' },
        { h: '和线性笔记的区别', p: '线性笔记按时间顺序记，回忆时容易断点；思维导图按"层级与关联"记，一个节点能激活整张网，提取更快。' },
      ],
    },
    {
      title: '康奈尔笔记法',
      desc: '结构化记录与高效复习',
      date: '2026.07.22',
      category: '学习法',
      body: [
        { p: '康奈尔笔记法由美国康奈尔大学的教育学者在 1950 年代整理推广，核心是把一页纸分成三个区域，让"记录"和"复习"一次完成，而不是抄完就再也不看。' },
        { h: '右上：笔记区', p: '上课或阅读时，只在右侧大块区域随手记关键词、要点、疑问。不必求工整，重点是先把信息接住。' },
        { h: '左下：线索区', p: '课后用一两句话概括右侧每一段，写在左边窄栏。这些短句就是你日后复习时的"检索钩子"。' },
        { h: '底部：总结区', p: '在页面最下方用自己话写一句总体收获。能写明白，说明你真的消化了；写不出，就该回头再读。' },
        { h: '怎么用最高效', p: '遮住右侧笔记，只看左边线索区，试着复述内容。说得出，就过关；说不出，重点就找到了。' },
      ],
    },
    {
      title: '西蒙学习法',
      desc: '集中突破一门知识的策略',
      date: '2026.07.20',
      category: '学习法',
      body: [
        { p: '西蒙学习法源自诺贝尔经济学奖得主赫伯特·西蒙的观点：一门知识所需的信息量，大约只要投入持续专注的精力，就能在一段时间内真正掌握，关键在于"聚焦"而非"广撒网"。' },
        { h: '一次只攻一门', p: '同时学五样，样样都浅。把一段时间只留给一个领域，让相关知识在脑中连成网络，而不是散落各处。' },
        { h: '拆成可啃的小块', p: '把这门学问切成若干小模块，每天稳定推进一块。模块之间要有逻辑顺序，前面的是后面的地基。' },
        { h: '持续专注，不中断', p: '西蒙提出，真正掌握一门学问需要长期、连续的专注投入。断断续续最容易前学后忘，连续性比总时长更关键。' },
        { h: '用输出检验', p: '学完一个模块就讲给别人听、写下来或做出来。能向外交付，才算这块知识真正长在了你身上。' },
      ],
    },
    {
      title: '间隔重复法',
      desc: '用遗忘曲线对抗健忘',
      date: '2026.08.11',
      category: '学习法',
      body: [
        { p: '19 世纪末，德国心理学家赫尔曼·艾宾浩斯（Hermann Ebbinghaus）用自己的记忆做实验，记了大量无意义音节，画出了著名的"遗忘曲线"：刚学完的东西，头几天忘得最快，之后趋于平缓。' },
        { h: '遗忘先快后慢', p: '这条曲线告诉我们：不复习，一天后可能就只剩两三成；但如果在快要忘记的节点及时复习，记忆就会被"加固"，下次忘得更慢。' },
        { h: '什么是间隔重复', p: '简单说，就是别一次性死磕，而是按"当天→隔天→一周后→一个月后"这样递增的间隔反复回想。每次间隔拉长，记忆却越来越牢。' },
        { h: '怎么用起来', p: '可以用卡片工具辅助，也可以自己排复习日程。关键是主动"提取"（合上书能不能复述），而不是盯着笔记重读——回想本身才是记忆的锻炼。' },
      ],
    },
    {
      title: '交错练习法',
      desc: '混着练，比死磕一门更牢',
      date: '2026.08.11',
      category: '学习法',
      body: [
        { p: '很多人习惯这一小时只练题型 A、下一小时只练 B，这叫"集中练习"。但学习与记忆研究发现，把不同内容混在一起交替练——"交错练习"（interleaving）——长期效果更好。' },
        { h: '当下更难，长期更牢', p: '交错练习时大脑要不断切换、辨别"这题该用哪招"，当下会显得更吃力、更慢。但正是这种"辨别"的费力，让知识在脑中扎得更深。' },
        { h: '适合什么时候用', p: '它不是取代基础练习，而是在每种都练过一点之后用来复习巩固：比如把几种题型混在一张卷子里做，或几门科目穿插着复习。' },
        { h: '一个提醒', p: '初学者如果连单一题型都没熟练，先集中练打底；等有了基础，再用交错练习把知识"焊"在一起，效果最好。' },
      ],
    },
    {
      title: 'SQ3R 阅读法',
      desc: '把书读透的五步法',
      date: '2026.08.11',
      category: '学习法',
      body: [
        { p: 'SQ3R 由美国教育学者弗朗西斯·罗宾逊（Francis P. Robinson）在 1946 年的《Effective Study》中提出，是一套经典的课本阅读流程，目的是把"读过"变成"读懂、记住"。' },
        { h: 'S 概览 Survey', p: '先别扎进细节。翻看目录、标题、图表和小结，花几分钟弄清这章在讲什么骨架。' },
        { h: 'Q 提问 Question', p: '把标题改成问题："这一节想回答什么？"带着问题读，大脑会更主动地搜寻答案。' },
        { h: 'R 读·复述·复习', p: 'Read 带着问题细读；Recite 读完用自己的话讲一遍（最好出声）；Review 隔段时间回看，把碎片连成网。五步下来，书才真正读过。' },
      ],
    },
  ],
  '歇一会儿': [
    {
      title: '那些停不下来的担心，不是你的错',
      desc: '脑子总在转，停不下来的时候',
      date: '2026.08.10',
      category: '歇一会儿',
      body: [
        { p: '有时候脑子就是停不下来。睡前反复回放白天说错的某句话，醒来又预演明天可能出错的每个环节。明明知道"想这么多也没用"，可就是关不掉。' },
        { h: '担心，其实是大脑在试着保护你', p: '它提前把坏情况都演练一遍，本意是想让你有所准备。只是这个警报系统有时调得太灵敏，明明没有真正的危险，它也响个不停。' },
        { h: '不是你太脆弱，是它太用力了', p: '容易担心的人，往往也是最在意"别出事"的人。你的大脑不是坏了，而是过于负责。' },
        { h: '试试不和自己较劲', p: '越压着"别想了"，念头反弹得越厉害。不如允许它在那儿转一会儿，你不必跟着每一个念头走。能看见"我正在担心"，就已经比被它卷走进了一步。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '身体有时候比嘴更诚实',
      desc: '说不出口的累，身体替你记着',
      date: '2026.08.09',
      category: '歇一会儿',
      body: [
        { p: '明明嘴上说"我没事"，胸口却闷得慌，胃也时不时揪着疼，头也晕。检查一圈，身体又查不出什么大问题。' },
        { h: '说不出口的，身体替你记着', p: '当我们把情绪压下去、假装没事，那些没被处理的紧张并不会消失，它们会找别的出口——肩膀、胃、胸口、头。身体比嘴诚实。' },
        { h: '不是"装病"，也不是"想太多"', p: '这些不舒服是真实的，不是你矫情。同时它也多半不是什么重病的信号，而是身体在替你表达你还没说出口的疲惫。' },
        { h: '和身体说说话', p: '把手轻轻放在不舒服的地方，告诉自己"我知道了，我听到你了"。不用急着消除它，先承认它在那里。被看见的紧张，往往会慢慢松一点。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '提不起劲的那些天，不是因为你懒',
      desc: '想做却做不到，和懒不一样',
      date: '2026.08.08',
      category: '歇一会儿',
      body: [
        { p: '有些天就是没力气。明明有一堆事要做，身体却像灌了铅，连起床都觉得难。别人一句"你怎么这么懒"，听得心里发酸。' },
        { h: '懒是"不想做"，没力气是"想做却做不到"', p: '两者的区别在于"想不想"。懒是心安理得地选择不做；而你，是明明想做、明明着急，却怎么也动不起来。那不是懒。' },
        { h: '能量槽空了，不是人坏了', p: '像手机电量见底，再好的功能也跑不动。这时候需要的不是责怪手机"你怎么不开机"，而是充电。' },
        { h: '先把目标降到最低', p: '今天能照顾好自己——喝口水、拉开窗帘、晒几分钟太阳——就已经很了不起了。别拿状态最好的那天的标准，来要求今天的自己。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '乱的时候，用五官把自己找回来',
      desc: '心慌脑乱时，一个简单的小方法',
      date: '2026.08.07',
      category: '歇一会儿',
      body: [
        { p: '有时候会突然心慌、脑子乱成一团，感觉自己"飘着"，和眼前的一切隔着一层。这时候可以试着用一个简单的小方法，把自己拉回当下。' },
        { h: '看 5 样', p: '说出眼前能看到的 5 样东西——桌子、杯子、窗帘、灯、一本书。慢慢说，看清它们的颜色和形状。' },
        { h: '听 4 样、摸 3 样、闻 2 样、尝 1 样', p: '再听听 4 种声音，摸摸身边的 3 样东西（衣角、桌面、水杯），闻 2 种气味，最后尝 1 种味道（含颗糖或喝口水）。' },
        { h: '不用做得完美', p: '顺序、数量都不重要。能把注意力从脑子里拉回到眼前一点点，就够了。多练几次，会越来越快。也可以打开 App 里的呼吸练习一起做。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '和紧绷的身体说说话',
      desc: '一直耸着肩咬着牙，松不下来',
      date: '2026.08.06',
      category: '歇一会儿',
      body: [
        { p: '你有没有发现，自己经常耸着肩、咬着牙、攥着拳，明明没什么事，身体却一直紧着。' },
        { h: '心里紧，身体也紧', p: '当情绪一直绷着，身体会跟着一起扛。它在替你承担那些你没说出口的压力。' },
        { h: '花三分钟，从上到下扫一遍', p: '闭上眼，从头顶开始，慢慢往下感觉到脚趾。哪里紧，就停一会儿，在心里对那里说"放松"。不用强求立刻松开，只是看见它。' },
        { h: '不评判，只是看见', p: '发现肩膀很紧，不用责怪自己"又紧张了"。看见本身就是放松的开始。也可以配合 App 的呼吸练习，跟着节奏一起松。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '脑子里的声音，不一定都是真的',
      desc: '那个说"你不行"的声音，别全信',
      date: '2026.08.05',
      category: '歇一会儿',
      body: [
        { p: '脑子里常有个声音："完了""你不行""别人肯定觉得你很差"。它一说，我们就信，然后整个人往下沉。' },
        { h: '想法 ≠ 事实', p: '想法只是大脑冒出来的一句话，不代表它就是真的。它说"你不行"，不等于你真的不行。' },
        { h: '给念头贴个标签', p: '下次它又冒出来，试着在心里说："我又在想\'完了\'了。"给念头起个名字，你就不那么容易被它卷走。' },
        { h: '看着它飘过', p: '把念头当成天上飘过的云，你不用跟着每朵云跑。它来，你看见它；它走，你也不必留。也可以打开脑图，把这些念头记下来，看着它们，会比在脑子里转清楚得多。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '睡不着的夜里',
      desc: '越想睡越清醒的时候',
      date: '2026.08.04',
      category: '歇一会儿',
      body: [
        { p: '夜深了，身体很累，脑子却越来越清醒。翻来覆去，越想睡越睡不着，越睡不着越着急。' },
        { h: '不强迫自己睡', p: '越是"我必须马上睡着"，身体越紧张。睡不着时，与其在床上较劲，不如告诉自己"躺着休息也可以"。' },
        { h: '做点安心的小事', p: '把灯光调暗，听一段白噪音或轻音乐，翻一本不太刺激的书。让身体知道：现在是安静的时间了。App 里也有助眠的白噪音可以试试。' },
        { h: '实在躺不住，就起来一下', p: '在床上翻滚半小时以上反而更焦虑。不如起来坐一会儿，等有了困意再回床上。把"床"和"睡着"重新连起来。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '没力气的一天，也能好好过',
      desc: '今天没电，就把目标降到最低',
      date: '2026.08.03',
      category: '歇一会儿',
      body: [
        { p: '今天就是没电。别的事先放一放，我们把今天的目标降到最低。' },
        { h: '能照顾好身体，今天就算赢', p: '喝够水、吃点东西、洗个脸、拉开窗帘透透气。听起来都是小事，但没力气的时候，做到这些已经很不容易。' },
        { h: '晒几分钟太阳', p: '走到窗边或阳台，让阳光照一照。光对身体节律有温柔的帮助，哪怕只是站着发几分钟呆。' },
        { h: '不和昨天的自己比', p: '昨天能做到的，今天做不到，不代表你退步了，只是今天的电量不一样。今天有今天的过法。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '今天也可以不那么努力',
      desc: '一闲下来就愧疚的时候',
      date: '2026.08.02',
      category: '歇一会儿',
      body: [
        { p: '好像总有个声音在催：要高效、要进步、要有用。一闲下来就愧疚，觉得自己在浪费时间。' },
        { h: '休息不是偷懒，是续航', p: '连机器都要停下来散热，何况是人。一直运转的零件磨损最快。休息不是在浪费生命，而是在让生命能走得更远。' },
        { h: '允许"无用"的时间', p: '发呆、闲晃、看窗外、做点"没用"的事，这些看起来什么都没产出的时刻，往往是灵感和平静藏身的地方。' },
        { h: '你不必时刻有用', p: '你的价值，不是靠"今天产出了多少"来证明的。你存在着，本身就是完整的。今天可以不那么努力。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '你不用一直当那个"没事"的人',
      desc: '装没事很累，可以先对自己诚实',
      date: '2026.08.01',
      category: '歇一会儿',
      body: [
        { p: '"你最近还好吗？""还好，没事。"——这句话我们说了多少遍。其实没那么好，但说不出口，也怕说了麻烦别人。' },
        { h: '装没事，很累', p: '一边撑着正常运转，一边藏起里面的难受，要花双倍的力气。能在人前演"没事"，本身就已经很辛苦了。' },
        { h: '承认"我在撑"，不是软弱', p: '能说出"其实我最近不太好"，不是认输，反而是松了一道紧绷的阀门。承认本身，就是一种照顾自己的方式。' },
        { h: '可以先对自己诚实', p: '不用对所有人都坦诚。可以先从自己开始——在心迹里写下"我今天其实很难受"，先让自己看见自己。被自己看见，就没那么孤单了。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '怕麻烦别人，其实是一种温柔的误会',
      desc: '你以为的负担，对方可能觉得是被需要',
      date: '2026.07.31',
      category: '歇一会儿',
      body: [
        { p: '难受的时候，第一反应往往是"别告诉别人，别给人添麻烦"。我们怕自己的情绪会成为别人的负担。' },
        { h: '你以为的负担，对方可能觉得是被需要', p: '真正在意你的人，知道你愿意开口，反而会觉得被信任。一直独自扛，对方知道了可能还会心疼——"为什么不早说"。' },
        { h: '关系是双向的，不是单方消耗', p: '你担心拖累别人，可你难受时也愿意陪别人，不是吗？能接住彼此的关系，才走得远。一直一个人撑，反而慢慢把距离拉远了。' },
        { h: '试一次小小的开口', p: '不用一上来就掏心掏肺。从最小的事开始："今天有点累，能陪我待一会儿吗？"你会发现，世界没有因此塌下来。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '为了不影响别人，把苦悄悄咽下去',
      desc: '咽下去的苦，需要一个出口',
      date: '2026.07.30',
      category: '歇一会儿',
      body: [
        { p: '难受的时候，反而更安静。怕自己的坏情绪传染别人，怕一张嘴就收不住，于是把苦咽下去，笑着说不重要。' },
        { h: '这份克制，是善意', p: '你替别人想了，怕他们跟着难受。这份小心翼翼里，藏着你的温柔。' },
        { h: '但一直咽着，会满', p: '情绪不会因为咽下去就消失。它会攒在心里，攒到某天一件小事就溢出来。我们需要一个不伤人的出口。' },
        { h: '先倒一点点出来', p: '写下来，是最安全的方式之一。在心迹里把堵着的话写出来，不用给谁看，只是让自己倒一倒。也可以找个不会评判你的树洞。倒一点，就轻一点。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '怎么开口说"我最近不太好"',
      desc: '想找人说说，又不知道怎么开口',
      date: '2026.07.29',
      category: '歇一会儿',
      body: [
        { p: '想找人说说，又不知道怎么开口。怕太突然，怕对方接不住，怕说完反而更尴尬。' },
        { h: '不用解释全部，一句就够了', p: '你不必把来龙去脉讲清楚。一句"我最近状态不太好"，已经是很勇敢的开始了。' },
        { h: '几个低压力的开场', p: '"最近有点累，想找你说说话。""不用给我建议，听我说说就好。""我最近不太好，你方便的时候能陪我待会儿吗？"——把对方需要做什么说清楚，双方都轻松。' },
        { h: '挑对人和时机', p: '选一个你信任、平时能接住你情绪的人。不用挑对方正忙的时候。也可以先在心迹里写一写，理清自己想说什么，再开口会容易些。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
    {
      title: '撑不住的时候，不是只有你一个人',
      desc: '有些路，有人一起走会稳一点',
      date: '2026.07.28',
      category: '歇一会儿',
      body: [
        { p: '有些时候，光靠自己撑可能不够。这不是认输，而是有些路，有人一起走会稳一点。' },
        { h: '几个温柔的信号', p: '如果低落、紧张、睡不好已经持续两周以上，影响了吃饭、上学、和人相处；或者脑子里出现过伤害自己的念头——这些都是身体在说"我们需要帮把手"。' },
        { h: '求助不是认输，是给自己找队友', p: '找心理咨询师或医生，和生病了去看病一样正常。它不代表你"有问题"，只代表你在认真照顾自己。' },
        { h: '你可以慢慢来', p: '不用逼自己立刻就去。可以先告诉一个信任的人，让他陪你一起找。你不用一个人扛着这些。' },
        { p: '本文是情绪陪伴内容，不是医疗建议。如果情绪持续困扰生活，请寻求专业帮助。' },
      ],
    },
  ],
  '成长指南': [
    {
      title: '如何建立自律习惯',
      desc: '从依赖到自主的转变之路',
      date: '2026.07.28',
      category: '成长指南',
      body: [
        { p: '自律常被误解为"靠意志力硬扛"。但大量行为研究表明：真正可持续的自律，靠的是环境设计，而不是咬牙死撑。' },
        { h: '先把环境变"顺手"', p: '想读书，就把书放在枕头边；想少刷手机，就给娱乐 App 设时限。让好习惯的阻力最小、坏习惯的阻力最大。' },
        { h: '用身份驱动行为', p: '《原子习惯》里有个思路：别只定"我要跑步"，而是"我是一个跑步的人"。当行为贴合自我认同，坚持就不再靠逼迫。' },
        { h: '允许回落，不求完美', p: '中断一两天不是失败，连续链条偶尔断开很正常。关键是尽快回到节奏，而不是因一次失误就全盘放弃。' },
      ],
    },
    {
      title: '情绪管理手册',
      desc: '温柔对待自己的五个练习',
      date: '2026.07.27',
      category: '成长指南',
      body: [
        { p: '情绪管理不是"把情绪压下去"，而是学会与情绪共处，既不伤人、也不伤己。以下五个小练习可以日常随手做。' },
        { h: '练习一：深呼吸三次', p: '情绪上头时，先慢慢吸气—屏息—呼气，重复三轮。这能激活副交感神经，给冲动降降温。' },
        { h: '练习二：写"情绪日记"', p: '用三句话记下：发生了什么、我感受到了什么、我真正在意的是什么。书写本身就有梳理作用。' },
        { h: '练习三到五', p: '三是给自己一句温和的话（像安慰朋友那样）；四是区分"情绪"与"事实"，不把感受当真相；五是定一个"暂停暗号"，比如离开现场倒杯水，给自己物理缓冲。' },
      ],
    },
    {
      title: '慢成长的力量',
      desc: '在快节奏世界里保持耐心',
      date: '2026.07.22',
      category: '成长指南',
      body: [
        { p: '我们身处一个"速成"叙事盛行的时代：7 天学会、30 天逆袭。但真实的成长往往更像种树——前几年只长根，地面上看不出变化，之后才突然抽枝展叶。' },
        { h: '警惕"虚假进度"', p: '刷了很多课、收藏了很多文章，会制造"我在进步"的错觉。真正的成长看的是"能不能用出来"，而不是"看了多少"。' },
        { h: '建立自己的节奏', p: '别人的时间表不是你的。把目标拆小、把周期看长，允许自己用更慢但更稳的方式往前走。' },
        { h: '耐心是一种能力', p: '耐心不是被动等待，而是明知结果会晚到，仍愿意每天做正确的事。这种定力，本身就是慢成长送给你的最贵重礼物。' },
      ],
    },
    {
      title: '深度工作法',
      desc: '如何在信息爆炸时代保持专注',
      date: '2026.07.28',
      category: '成长指南',
      body: [
        { p: '"深度工作"（Deep Work）一词由计算机科学教授卡尔·纽波特（Cal Newport）在 2016 年的同名书中系统提出。他定义为：在无干扰状态下进行的、高度认知投入的专注活动。' },
        { h: '为什么它稀缺又值钱', p: '纽波特指出：高质量产出 = 时间 × 专注度。在随时被消息打断的环境里，能长时间专注的人越来越少，因而这种能力也愈发珍贵。' },
        { h: '几条可落地的原则', p: '①给深度工作排固定时段，像开会一样写进日程；②工作时远离社交软件与通知；③用"浅层工作"批量处理邮件等琐事；④结束时有明确的收尾仪式，让大脑下线。' },
        { h: '从小处开始', p: '不必一上来就苦修数小时。每天先守住一段 60–90 分钟的无干扰时间，逐步拉长，专注力会像肌肉一样被练出来。' },
      ],
    },
    {
      title: '原子习惯',
      desc: '微小改变带来复利效应',
      date: '2026.07.25',
      category: '成长指南',
      body: [
        { p: '《原子习惯》（Atomic Habits）是行为科学作家詹姆斯·克利尔（James Clear）2018 年的畅销书。核心主张：真正改变命运的，不是偶发的大决心，而是每天 1% 的微小改进。' },
        { h: '习惯四步模型', p: '克利尔把习惯拆成：提示（cue）→ 渴望（craving）→ 反应（response）→ 奖赏（reward）。想养成或戒除习惯，都从改造这四步入手。' },
        { h: '让好习惯更容易', p: '他提出"让提示显眼、让行动轻松"——比如想晨跑，就睡前把跑鞋摆在门口。降低阻力，行为才容易发生。' },
        { h: '复利视角', p: '每天进步 1%，一年后约是原来的 37 倍；每天退步 1%，一年后趋近于零。系统的微小偏差，长期会被放大。' },
      ],
    },
    {
      title: '认知觉醒',
      desc: '打破思维定势的觉察练习',
      date: '2026.07.20',
      category: '成长指南',
      body: [
        { p: '"认知觉醒"是近年来个人成长领域的高频词，指从"自动反应"走向"自觉觉察"——看清楚自己为何这样想、这样活，从而拥有更多选择的自由。' },
        { h: '方法一：给情绪命名', p: '当焦虑或愤怒升起，先准确说出它的名字。心理学中的"情绪标注"能降低杏仁核的过度反应，让你从被情绪裹挟回到可以思考的状态。' },
        { h: '方法二：区分"事实"与"判断"', p: '对方迟到是事实，"他不在乎我"是判断。把两者分开，很多内耗会自然消解。' },
        { h: '方法三：留出「第三视角」', p: '遇到纠结，想象旁观者会怎么看。抽离一点点，决策往往更清醒。其余方法（如正念呼吸、写复盘日记、主动接触不同观点）也都是为了让大脑「慢半拍」、少些惯性。' },
      ],
    },
    {
      title: '两分钟法则',
      desc: '小事不积压，大事先启动',
      date: '2026.08.11',
      category: '成长指南',
      body: [
        { p: '时间管理经典《搞定》（Getting Things Done，简称 GTD）里有一条实用的"两分钟原则"，由戴维·艾伦（David Allen）提出：如果一件事能在两分钟内做完，就立刻去做，别把它塞进待办清单。' },
        { h: '为什么有效', p: '很多"小任务"一旦进了清单，反而要花更多精力去记、去排、去回想。两分钟内顺手做了，反而省下了管理它的成本。' },
        { h: '更大的用处：启动', p: '面对大任务无从下手时，把它拆出一个"两分钟就能做"的第一步——比如"打开文档写个标题"。启动最难，一旦动了，惯性会推着你继续。' },
        { h: '不是逼自己勤快', p: '它不要求你凡事立刻做，只是帮你把真正微小的行动当场消化，别让零碎小事悄悄堆成心理负担。' },
      ],
    },
    {
      title: '微习惯',
      desc: '小到不可能失败的坚持',
      date: '2026.08.11',
      category: '成长指南',
      body: [
        { p: '《微习惯》（Mini Habits）作者斯蒂芬·盖斯（Stephen Guise）提出一个反直觉的思路：把目标缩到"小到不可能失败"，比如每天只做 1 个俯卧撑、只读 1 页书。' },
        { h: '为什么这么小', p: '目标越小，大脑越不会抵抗，启动门槛几乎为零。而一旦开始，你往往会顺着多做一点——但哪怕只做了那"1 个"，今天也算成功，不会因没达标而挫败。' },
        { h: '靠完成感建惯性', p: '习惯的敌人是"中断带来的愧疚"。微习惯几乎不会中断，每天稳定的"我做到了"，会慢慢把行动变成不需要意志力的默认项。' },
        { h: '适合谁', p: '如果你总在立 flag 又倒，不妨把 flag 降到地板价。先让"做"发生，再谈"做多少"。' },
      ],
    },
    {
      title: '心流',
      desc: '全神贯注的忘我状态',
      date: '2026.08.11',
      category: '成长指南',
      body: [
        { p: '“心流”（flow）由心理学家米哈里·契克森米哈赖（Mihaly Csikszentmihalyi）在 1990 年的同名著作中系统描述：当做的事难度刚好匹配你的能力，目标清晰、反馈及时，就会进入一种全神贯注、忘记时间的忘我状态。' },
        { h: '为什么珍贵', p: '在心流里，效率和创造力都更高，而且过程本身就很愉快——不是"忍完才有奖励"，而是"做着就充实"。很多人有过画画、写代码、运动到忘我的体验。' },
        { h: '怎么更容易进入', p: '给任务设清晰的小目标、让难度略高于当前水平（太简单会无聊，太难会焦虑）、减少打断、把大块时间留给它。环境安静、手机离远点，心流才来得了。' },
        { h: '不是拼命硬扛', p: '心流是"顺畅的挑战"，不是自我压榨。它提醒我们：好的状态不是靠意志力死撑，而是把任务和环境调到刚刚好。' },
      ],
    },
  ],
  '生活节奏': [
    {
      title: '精力管理',
      desc: '比时间管理更底层的自律',
      date: '2026.07.21',
      category: '生活节奏',
      body: [
        { p: '我们习惯用"时间表"安排一切，却忽略了时间再满，精力跟不上也白搭。真正可持续的产出，靠的是管理精力，而不是塞满时钟。' },
        { h: '识别你的能量曲线', p: '有人清晨清醒，有人夜里敏锐。把最重要的任务，放在你一天里最清醒的那段，琐事留到低谷期。' },
        { h: '用节奏代替硬撑', p: '专注一段时间后主动休息，像潮汐一样有涨有落。连续硬扛只会让效率断崖式下跌，休息不是偷懒，是续航。' },
        { h: '守护身体的底座', p: '睡眠、饮食、活动，是精力的三根支柱。任何一根塌了，再好的方法也托不住你。先稳住底座，再谈技巧。' },
        { h: '学会主动断电', p: '一天结束给自己一个明确的"收工仪式"——关电脑、洗个澡、调暗灯。让身心知道：今天到此为止，可以卸下了。' },
      ],
    },
    {
      title: '数字极简',
      desc: '在信息洪流里留一块空地',
      date: '2026.07.18',
      category: '生活节奏',
      body: [
        { p: '手机一亮，注意力就被撕走一片。数字极简不是扔掉科技，而是有意识地为自己的注意力"减肥"，把被侵占的心力夺回来。' },
        { h: '关掉非必要通知', p: '除了少数真正重要的人和信息，其余App的红点提醒统统关掉。你不必时刻待命，信息可以等你准备好再去取。' },
        { h: '给App分zone', p: '把社交、娱乐、工作类应用收进文件夹或移到次屏，增加"顺手点开"的阻力。多一道步骤，就少一次无意识刷屏。' },
        { h: '设一段离线时间', p: '每天挑一段（如吃饭、睡前）彻底放下屏幕，留给真实的人和事。那段空白，往往是灵感与松弛藏身的地方。' },
        { h: '定期清理订阅', p: '取消关注让你焦虑或无关的内容源。你的信息流越干净，心里的噪音就越少。' },
      ],
    },
    {
      title: '周末充电',
      desc: '让休息真正恢复元气',
      date: '2026.07.15',
      category: '生活节奏',
      body: [
        { p: '很多人把周末过成了"补觉加补剧"，周一反而更累。好的休息不是瘫着，而是让身心以不同方式被滋养，周一回来时是满的。' },
        { h: '留白，别排满', p: '别把两天塞成第二个工作日。刻意留出几段无事可做的空白，让大脑有空间发呆、游走、自己慢慢回血。' },
        { h: '动起来，也静下来', p: '散个步、做顿饭、侍弄花草，是身体的充电；读闲书、听音乐、发会儿呆，是精神的充电。两者都要有。' },
        { h: '为下周做一点缓冲', p: '周日下午花十分钟想想明天，准备好衣物和待办。这点提前量，能替周一早晨消去大半慌乱。' },
        { h: '把"玩"当正事', p: '真正喜欢的事，值得写进日程。滋养你的活动不是浪费时间，而是让你走得动更远的必要补给。' },
      ],
    },
    {
      title: '昼夜节律',
      desc: '顺着生物钟作息更轻松',
      date: '2026.08.11',
      category: '生活节奏',
      body: [
        { p: '人体内有一套约 24 小时的"生物钟"，叫昼夜节律（circadian rhythm），由大脑里的视交叉上核主导，受光照调节。它管着什么时候清醒、什么时候想睡，以及体温和激素的起伏。' },
        { h: '光照是关键开关', p: '早晨的蓝光会抑制褪黑素、帮你清醒；入夜后光线变暗，褪黑素上升、催你犯困。所以睁眼见光、睡前少看亮屏，是在顺着节律走。' },
        { h: '固定作息比时长更稳', p: '每天差不多时间睡、差不多时间起，比偶尔补觉更重要。生物钟喜欢可预测，乱掉的作息会让你陷入白天困、晚上精神的恶性循环。' },
        { h: '小调整有大用', p: '起床后去窗边站几分钟、下午少喝咖啡、睡前一小时调暗灯光——不必大改生活，顺着节律微调，睡眠和精力都会更听话。' },
      ],
    },
    {
      title: '微休息',
      desc: '几分钟，就能回血',
      date: '2026.08.11',
      category: '生活节奏',
      body: [
        { p: '职业健康心理学里有个概念叫"微休息"（micro-break）：工作间隙里那些几十秒到几分钟的小停顿——伸个懒腰、远眺、喝口水、闭眼歇一会儿。研究发现，它们能实实在在地帮注意力回血。' },
        { h: '为什么有用', p: '长时间盯着一件事，注意力和情绪都会慢慢耗竭。短暂的抽离让大脑从"聚焦模式"切换出来，回来时更清醒，也更不容易烦躁。' },
        { h: '别把休息当偷懒', p: '很多人觉得"歇一会儿=不努力"。但微休息不是逃避，而是续航。就像长跑的人也要调整呼吸，脑子也需要喘口气的空隙。' },
        { h: '怎么嵌进日常', p: '每 45–60 分钟，给自己两三分钟：站起来走两步、看看远处、深呼吸几次。设个轻提醒也行，关键是别一直绷到精疲力竭才停。' },
      ],
    },
    {
      title: '散步与灵感',
      desc: '走一走，思路就通了',
      date: '2026.08.11',
      category: '生活节奏',
      body: [
        { p: '斯坦福大学 2014 年的一项研究发现：无论是室内原地走还是户外散步，相比坐着，人在"发散性思维"测试上的创意产出都明显更高。也就是说，走路真的更容易冒出好点子。' },
        { h: '为什么走路开窍', p: '走路时身体在动、环境在变，大脑反而从紧绷的"钻牛角尖"里松开来，进入更松弛、更自由的联想状态——很多卡住的问题，走着走着就通了。' },
        { h: '适合什么场景', p: '写不出东西、想不通方案、情绪有点堵的时候，别硬扛在桌前。去走个十来分钟，让身体带脑子转一转，回来再写往往顺多了。' },
        { h: '一个小习惯', p: '卡住就起身，别等"想好再动"。边走边在手机里记两句灵感，回来立刻落地。散步是你随手就能用的"灵感开关"。' },
      ],
    },
  ],
  '关系与人际': [
    {
      title: '如何温和地说不',
      desc: '守住边界也不伤感情',
      date: '2026.07.20',
      category: '关系与人际',
      body: [
        { p: '我们常怕拒绝会伤和气，于是硬着头皮答应，最后自己委屈、对方也没得到最好的你。温和而清晰地说不，其实是对关系更诚实的照顾。' },
        { h: '先接住，再回应', p: '开口前先认可对方的请求："我知道这事对你挺重要"。被理解的人，更容易接住后面的拒绝。' },
        { h: '说"现在不行"，而非"我不行"', p: '把拒绝限定在当下情境，而不是否定自己或对方。比如："这周实在排满了，下月我可以。"留有余地，关系不僵。' },
        { h: '给个替代或理由', p: '简单说明难处，或推荐更合适的人。对方感受到你的在意，拒绝就不再是冷冰冰的推脱。' },
        { h: '不必过度解释', p: '解释一两句足够，越补越多反而显得心虚。温和地停在边界上，是你的权利，也是成熟关系的一部分。' },
      ],
    },
    {
      title: '独处不孤单',
      desc: '学会和自己好好相处',
      date: '2026.07.16',
      category: '关系与人际',
      body: [
        { p: '独处常被误读成"没人陪"。其实能安心和自己待着，是一种值得练习的能力——它让你在人群中不迷失，在安静里也不慌张。' },
        { h: '把独处变成仪式', p: '泡一杯茶、散一段步、写几行字，给独处一个温柔的入口。当它有形状，你就不再急着逃离它。' },
        { h: '听见自己的声音', p: '少了外界嘈杂，内心那些被忽略的感受会浮上来。不评判、只是看看它们，你会更懂自己真正想要什么。' },
        { h: '用创造代替消耗', p: '独处时与其无意识刷屏，不如做点小手作、听张专辑、侍弄绿植。创造让人充实，消耗只会更空。' },
        { h: '独处好了，相处才真', p: '和自己相处舒服的人，和别人相处也更从容。独处不是远离世界，而是先把自己填满，再走向他人。' },
      ],
    },
    {
      title: '非暴力沟通',
      desc: '把冲突变成彼此看见',
      date: '2026.07.14',
      category: '关系与人际',
      body: [
        { p: '非暴力沟通由心理学家马歇尔·卢森堡提出，核心不是"忍让"，而是换一种方式表达，让彼此的需求都被看见，而不是在争吵里互相消耗。' },
        { h: '第一步：说事实，不说评判', p: '把"你总是不管家务"换成"这周有三天碗没洗"。描述具体行为，对方才不会被防御情绪挡住，听得进去。' },
        { h: '第二步：说感受，不怪对方', p: '表达"我有点累和委屈"，而不是"你真懒"。感受是你的，说出来，对方更容易生出体谅，而非反击。' },
        { h: '第三步：说需要', p: '委屈背后往往是"我需要被分担、被尊重"。把需要摊开，对话才从指责转向共同想办法。' },
        { h: '第四步：提具体请求', p: '说"今晚能不能一起收拾"比"你以后勤快点"有用得多。清晰可行的请求，让改变真正可能发生。' },
      ],
    },
    {
      title: '积极倾听',
      desc: '让人真正被听见的艺术',
      date: '2026.08.11',
      category: '关系与人际',
      body: [
        { p: '人本主义心理学家卡尔·罗杰斯（Carl Rogers）提出的"积极倾听"（active listening），核心不是"等对方说完轮到我讲"，而是真正试着听懂对方在说什么、以及在意什么。' },
        { h: '先别急着给建议', p: '多数人倾诉时，要的不是解决方案，而是"被听见"。一上来就支招，反而容易让对方觉得你没接住他的情绪。先听，再应。' },
        { h: '复述与确认', p: '用"你的意思是……？""听起来你有点……"把对方的话轻轻回放一遍。这既确认你没理解错，也让对方感到：你是真的在听。' },
        { h: '关注情绪，不只事实', p: '同样一句话，背后可能是委屈、不安或兴奋。积极倾听要求你听见"话外之音"——对方此刻的感受，往往比字面信息更重要。' },
      ],
    },
    {
      title: '健康的边界感',
      desc: '温柔地守住自己的底线',
      date: '2026.08.11',
      category: '关系与人际',
      body: [
        { p: '心理学里常说的"边界感"（boundaries），指一个人清楚哪些是自己的责任、哪些是别人的，并能温和地维护这条线。它不是疏远，而是让关系更健康的前提。' },
        { h: '边界不是自私', p: '很多人怕说"不"会伤感情，于是一再退让，最后自己委屈、关系也失衡。守住边界，其实是在保护这段关系不被过度消耗。' },
        { h: '区分"我"和"你"', p: '成年人的情绪，终究要自己负责。你可以关心、可以陪伴，但不必为别人的心情买单；同样，你也不必因为拒绝了别人而愧疚。' },
        { h: '怎么温和地立边界', p: '用"我"开头表达：比如"我这两天精力有限，可能没法帮你，但下周可以"。清晰、具体、不带攻击，边界就立得既坚定又体面。' },
      ],
    },
    {
      title: '常说谢谢',
      desc: '感恩，是最便宜的滋养',
      date: '2026.08.11',
      category: '关系与人际',
      body: [
        { p: '心理学家罗伯特·埃蒙斯（Robert Emmons）与同事的研究发现：经常记录并表达感恩的人，主观幸福感和人际关系满意度都更高；后续研究还观察到，规律地写感恩日记也能改善睡眠。感恩不是客套，而是一种被研究支持的"心理滋养"。' },
        { h: '具体，比笼统更打动人', p: '"谢谢"两个字很好，但加上"谢谢你帮我拿了快递，我正腾不开手"会更暖。具体说出对方做了什么、对你意味着什么，对方会感到被真正看见。' },
        { h: '对自己也管用', p: '写"感恩日记"——每天记两三件值得感谢的小事——能慢慢把注意力从"缺什么"转向"有什么"，心境会轻一点。' },
        { h: '它改善关系', p: '关系里最怕的是"付出被当成应该"。一句及时的感谢，能让对方觉得值得，也让这段连接在双向的善意里越走越稳。' },
      ],
    },
  ],
}

function ArticleReader({
  article,
  onBack,
  onSelect,
}: {
  article: Article
  onBack: () => void
  onSelect: (a: Article) => void
}) {
  const allArticles = useMemo(
    () => [...contentData['学习法'], ...contentData['歇一会儿'], ...contentData['成长指南'], ...contentData['生活节奏'], ...contentData['关系与人际']],
    [],
  )
  const related = useMemo(
    () => allArticles.filter(a => a.title !== article.title).slice(0, 3),
    [allArticles, article.title],
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const { isFav, toggle } = useArticleFavorites()
  const fav = isFav(article.category, article.title)
  const share = useShare()

  return (
    <div ref={scrollRef} className="app-scrollbar flex h-full flex-col overflow-y-auto bg-card">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-stone-200 bg-card/95 px-4 py-3 backdrop-blur">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground"
          aria-label="返回"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
          <span className="text-[13px]">返回</span>
        </button>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: 'rgba(212,83,126,0.12)', color: '#D4537E' }}
        >
          {article.category}
        </span>
        <div className="flex w-24 items-center justify-end gap-1">
          <button
            onClick={() => toggle(article)}
            aria-label={fav ? '取消收藏' : '收藏'}
            className="flex size-8 items-center justify-center rounded-full transition-colors active:scale-90 hover:bg-stone-100"
          >
            <Heart
              size={18}
              strokeWidth={1.8}
              style={{ fill: fav ? '#D4537E' : 'none', color: fav ? '#D4537E' : '#999999' }}
            />
          </button>
          <button
            onClick={() => {
              // 分享完整文章：标题 + 简介 + 全部正文，末尾附 App 署名
              const fullBody = (article.body ?? []).map(b => `${b.h ? b.h + '\n' : ''}${b.p}`).join('\n\n')
              share({ title: `《${article.title}》`, text: `${article.desc}\n\n${fullBody}\n\n—— 来自暖枫 App 的分享` })
            }}
            aria-label="分享"
            className="flex size-8 items-center justify-center rounded-full transition-colors active:scale-90 hover:bg-stone-100"
          >
            <Share2 size={18} strokeWidth={1.8} style={{ color: '#999999' }} />
          </button>
        </div>
      </div>

      {/* 可滚动内容 */}
      <div className="flex-1">
        {/* 封面占位 */}
        <div className="flex h-[180px] items-center justify-center bg-gradient-to-br from-leaf/20 to-sakura/20 px-6">
          <ScrollReveal
            scrollContainerRef={scrollRef}
            enableBlur={true}
            baseOpacity={0}
            baseRotation={0}
            blurStrength={6}
          >
            <h2 className="text-center font-serif text-[24px] font-semibold leading-snug text-foreground">
              {article.title}
            </h2>
          </ScrollReveal>
        </div>

        {/* 元信息 */}
        <ScrollReveal
          scrollContainerRef={scrollRef}
          enableBlur={true}
          baseOpacity={0}
          baseRotation={0}
          blurStrength={4}
          containerClassName="px-5 pt-5"
        >
          <p className="text-[13px] leading-6 text-muted-foreground">{article.desc}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground/50">
            <span>{article.date}</span>
            <span>·</span>
            <span>暖枫阅读</span>
          </div>
        </ScrollReveal>

        {/* 正文 */}
        <div className="px-5 py-5">
          {article.body.map((block, i) => (
            <ScrollReveal
              key={i}
              scrollContainerRef={scrollRef}
              enableBlur={true}
              baseOpacity={0}
              baseRotation={0}
              blurStrength={4}
              containerClassName={i > 0 ? 'mt-5' : ''}
            >
              {block.h && (
                <h3 className="mb-2 font-serif text-[16px] font-medium text-foreground">
                  {block.h}
                </h3>
              )}
              <p className="text-[15px] leading-7 text-[#555555]">{block.p}</p>
            </ScrollReveal>
          ))}
        </div>

        {/* 相关推荐 */}
        <div className="border-t border-stone-200 px-5 py-5">
          <ScrollReveal
            scrollContainerRef={scrollRef}
            enableBlur={true}
            baseOpacity={0}
            baseRotation={0}
            blurStrength={3}
          >
            <h4 className="mb-3 font-serif text-[14px] font-medium text-foreground">相关推荐</h4>
          </ScrollReveal>
          <div className="flex flex-col gap-2">
            {related.map((a, ri) => (
              <ScrollReveal
                key={a.title}
                scrollContainerRef={scrollRef}
                enableBlur={true}
                baseOpacity={0}
                baseRotation={0}
                blurStrength={3}
                containerClassName="w-full"
              >
                <button
                  onClick={() => onSelect(a)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2.5 text-left transition-colors hover:bg-stone-100"
                >
                  <div className="flex-1">
                    <h5 className="font-serif text-[14px] text-foreground">{a.title}</h5>
                    <span className="text-[11px] text-muted-foreground/60">{a.category}</span>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-muted-foreground/40" />
                </button>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentStream({ onSelectArticle }: { onSelectArticle: (a: Article) => void }) {
  const [activeTab, setActiveTab] = useState<ContentTab>('学习法')
  const tabs: ContentTab[] = ['学习法', '歇一会儿', '成长指南', '生活节奏', '关系与人际']
  const { isFav, toggle } = useArticleFavorites()

  return (
    <div className="relative -mx-5 px-5 py-2 paper-texture">
      <div className="flex items-center gap-3 overflow-x-auto border-b border-stone-300 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative shrink-0 pb-2 font-serif text-[13px] transition-colors ${
              activeTab === tab
                ? 'text-foreground'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-sakura" />
            )}
          </button>
        ))}
      </div>
      <motion.div
        key={activeTab}
        className="mt-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
        }}
      >
        {contentData[activeTab].map((article, idx) => {
          const fav = isFav(article.category, article.title)
          return (
          <motion.div
            key={idx}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            <div className="flex w-full items-start justify-between gap-2 py-2">
              <button
                onClick={() => onSelectArticle(article)}
                className="flex flex-1 items-start justify-between gap-3 text-left transition-colors hover:text-muted-foreground"
              >
                <div className="flex-1">
                  <h3 className="font-serif text-[17px] font-medium tracking-wide text-foreground">{article.title}</h3>
                  <p className="mt-0.5 text-[11px] leading-5" style={{ color: '#888888' }}>{article.desc}</p>
                  <span className="mt-0.5 inline-block text-[10px] text-muted-foreground/40">{article.date}</span>
                </div>
                <ChevronRight size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-muted-foreground/40" />
              </button>
              <button
                onClick={() => toggle(article)}
                aria-label={fav ? '取消收藏' : '收藏'}
                className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full transition-colors active:scale-90 hover:bg-stone-100"
              >
                <Heart
                  size={16}
                  strokeWidth={1.8}
                  style={{ fill: fav ? '#D4537E' : 'none', color: fav ? '#D4537E' : '#999999' }}
                />
              </button>
            </div>
            {idx < contentData[activeTab].length - 1 && (
              <div className="h-px w-full" style={{ backgroundColor: '#E5E5E5' }} />
            )}
          </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

function QuoteCard() {
  const [quotes, setQuotes] = useState<Quote[]>(presetQuotes)
  const [config, setConfig] = useState<QuoteConfig>({ mode: 'random', fixedQuoteId: null, todayQuoteId: null, todayDate: '', segments: emptySegments() })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showAddInput, setShowAddInput] = useState(false)
  const [newQuoteText, setNewQuoteText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const getTodayDate = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  useEffect(() => {
    const now = new Date()
    const today = getTodayDate()
    const segment = getSegment(now.getHours())

    const mergedQuotes = getMergedQuotes()

    const storedConfig = localStorage.getItem('dailyQuoteConfig')
    let loadedConfig: QuoteConfig
    if (storedConfig) {
      try {
        loadedConfig = JSON.parse(storedConfig) as QuoteConfig
        loadedConfig.segments = { ...emptySegments(), ...(loadedConfig.segments ?? {}) }
      } catch {
        loadedConfig = { mode: 'random', fixedQuoteId: null, todayQuoteId: null, todayDate: today, segments: emptySegments() }
      }
    } else {
      loadedConfig = { mode: 'random', fixedQuoteId: null, todayQuoteId: null, todayDate: today, segments: emptySegments() }
    }

    let initialIndex = 0
    if (loadedConfig.mode === 'fixed' && loadedConfig.fixedQuoteId) {
      const idx = mergedQuotes.findIndex(q => q.id === loadedConfig.fixedQuoteId)
      initialIndex = idx >= 0 ? idx : 0
    } else if (loadedConfig.mode === 'random') {
      const segRecord = loadedConfig.segments[segment]
      if (segRecord.date === today && segRecord.quoteId) {
        const idx = mergedQuotes.findIndex(q => q.id === segRecord.quoteId)
        initialIndex = idx >= 0 ? idx : 0
      } else {
        // 与首页精选语录共用分时段 + 近期不重复逻辑
        const otherSegIds = (Object.keys(loadedConfig.segments) as SegmentKey[])
          .filter(k => k !== segment && loadedConfig.segments[k].date === today)
          .map(k => loadedConfig.segments[k].quoteId)
          .filter((id): id is string => !!id)
        const history = loadQuoteHistory(7)
        const picked = pickNonRepeating(mergedQuotes, history, otherSegIds)
        initialIndex = mergedQuotes.findIndex(q => q.id === picked.id)
        loadedConfig = {
          ...loadedConfig,
          todayDate: today,
          segments: { ...loadedConfig.segments, [segment]: { quoteId: picked.id, date: today } },
        }
        saveQuoteHistory(today, picked.id, 7)
      }
    }

    setQuotes(mergedQuotes)
    setConfig(loadedConfig)
    setCurrentIndex(initialIndex)
    localStorage.setItem('dailyQuoteConfig', JSON.stringify(loadedConfig))
  }, [])

  const initDoneRef = useRef(false)
  
  useEffect(() => {
    if (initDoneRef.current) return
    if (quotes.length === 0) return
    if (config.mode === 'random') {
      const now = new Date()
      const today = getTodayDate()
      const segment = getSegment(now.getHours())
      const segRecord = config.segments[segment]
      // 若当天该时段尚无记录，则补一次分时段+近期不重复的选取
      if (!(segRecord.date === today && segRecord.quoteId)) {
        const otherSegIds = (Object.keys(config.segments) as SegmentKey[])
          .filter(k => k !== segment && config.segments[k].date === today)
          .map(k => config.segments[k].quoteId)
          .filter((id): id is string => !!id)
        const history = loadQuoteHistory(7)
        const picked = pickNonRepeating(quotes, history, otherSegIds)
        const newConfig: QuoteConfig = {
          ...config,
          todayDate: today,
          segments: { ...config.segments, [segment]: { quoteId: picked.id, date: today } },
        }
        initDoneRef.current = true
        setConfig(newConfig)
        saveQuoteHistory(today, picked.id, 7)
      }
    }
  }, [quotes, config])

  useEffect(() => {
    localStorage.setItem('dailyQuotes', JSON.stringify(quotes))
  }, [quotes])

  useEffect(() => {
    localStorage.setItem('dailyQuoteConfig', JSON.stringify(config))
  }, [config])

  const saveQuotes = (newQuotes: Quote[]) => {
    setQuotes(newQuotes)
  }

  const saveConfig = (newConfig: QuoteConfig) => {
    setConfig(newConfig)
  }

  const handleAddQuote = () => {
    setErrorMessage('')
    const trimmed = newQuoteText.trim()
    if (!trimmed) {
      setErrorMessage('请输入语录内容')
      return
    }
    if (trimmed.length > 200) {
      setErrorMessage('语录不能超过200个字符')
      return
    }
    const newQuote: Quote = {
      id: generateId(),
      text: trimmed,
      type: 'custom',
      createdAt: new Date().toISOString(),
    }
    saveQuotes([...quotes, newQuote])
    setNewQuoteText('')
    setShowAddInput(false)
  }

  const handleDeleteQuote = (id: string) => {
    const quote = quotes.find(q => q.id === id)
    if (!quote || quote.type === 'preset') return
    saveQuotes(quotes.filter(q => q.id !== id))
    if (config.fixedQuoteId === id) {
      saveConfig({ ...config, mode: 'random', fixedQuoteId: null })
    }
  }

  const handleSetFixed = (id: string) => {
    saveConfig({ ...config, mode: 'fixed', fixedQuoteId: id })
    const idx = quotes.findIndex(q => q.id === id)
    if (idx >= 0) {
      setCurrentIndex(idx)
    }
    setShowLibrary(false)
  }

  const handleToggleMode = (mode: 'random' | 'fixed') => {
    if (mode === 'fixed' && !config.fixedQuoteId && quotes.length > 0) {
      saveConfig({ ...config, mode: 'fixed', fixedQuoteId: quotes[currentIndex].id })
    } else {
      saveConfig({ ...config, mode, fixedQuoteId: mode === 'fixed' ? config.fixedQuoteId : null })
    }
  }

  const handleRefresh = () => {
    if (quotes.length === 0) return
    let newIndex = currentIndex
    while (newIndex === currentIndex && quotes.length > 1) {
      newIndex = Math.floor(Math.random() * quotes.length)
    }
    setCurrentIndex(newIndex)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddQuote()
    }
  }

  const currentQuote = quotes[currentIndex]
  const presetList = quotes.filter(q => q.type === 'preset')
  const customList = quotes.filter(q => q.type === 'custom')

  return (
    <section className="relative overflow-hidden rounded-md border border-sakura/30 bg-card p-5">
      <CardTitle eyebrow="DAILY WORDS" title="每日一言" />
      <blockquote className="mt-4 whitespace-pre-line font-serif text-[15px] leading-7 tracking-wide text-foreground">
        {currentQuote?.text || '暂无语录'}
      </blockquote>
      <div className="mt-4 flex items-center justify-between border-t border-dashed border-sakura/20 pt-3">
        <span className="text-[10px] tracking-[0.16em] text-muted-foreground">四月 · 春日手记</span>
        <div className="flex gap-2">
          <button onClick={() => setShowLibrary(true)} aria-label="我的语录库" className="flex h-8 items-center gap-1.5 rounded-md bg-muted px-3 text-[11px] text-muted-foreground transition-transform active:scale-95">
            <List size={13} /> 语录库
          </button>
          <button onClick={handleRefresh} aria-label="换一句" className="flex h-8 items-center gap-1.5 rounded-md bg-muted px-3 text-[11px] text-muted-foreground transition-transform active:scale-95">
            <RefreshCw size={13} /> 换一句
          </button>
        </div>
      </div>

      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowLibrary(false)}>
          <div className="w-full max-w-[320px] max-h-[70vh] rounded-md border border-stone-200 shadow-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-sakura/10">
              <h3 className="font-serif text-lg font-semibold">我的语录库</h3>
              <button onClick={() => setShowLibrary(false)} className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform active:scale-95">
                ×
              </button>
            </div>

            <div className="px-5 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 140px)' }}>
              <div className="mb-4 rounded-md bg-background p-3">
                <p className="mb-3 text-[11px] font-medium text-muted-foreground">显示方式</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleToggleMode('random')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-sm transition-transform ${config.mode === 'random' ? 'bg-sakura-soft text-sakura' : 'bg-muted text-muted-foreground'} active:scale-95`}
                  >
                    <span className={`flex size-4 items-center justify-center rounded-full border ${config.mode === 'random' ? 'border-sakura bg-sakura' : 'border-muted-foreground/30'}`}>
                      {config.mode === 'random' && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                    每日随机
                  </button>
                  <button
                    onClick={() => handleToggleMode('fixed')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-sm transition-transform ${config.mode === 'fixed' ? 'bg-sakura-soft text-sakura' : 'bg-muted text-muted-foreground'} active:scale-95`}
                  >
                    <span className={`flex size-4 items-center justify-center rounded-full border ${config.mode === 'fixed' ? 'border-sakura bg-sakura' : 'border-muted-foreground/30'}`}>
                      {config.mode === 'fixed' && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                    固定一句
                  </button>
                </div>
              </div>

              <div className="space-y-3 pb-4">
                <div>
                  <p className="mb-2 text-[10px] font-medium text-muted-foreground">预设语录</p>
                  <div className="space-y-2">
                    {presetList.map((quote) => (
                      <div key={quote.id} className="flex items-center gap-3 rounded-xl bg-background px-4 py-3 border border-sakura/10">
                        <span className="flex-1 text-sm">{quote.text}</span>
                        <div className="flex items-center gap-1">
                          {config.mode === 'fixed' && config.fixedQuoteId === quote.id && (
                            <span className="rounded-md bg-sakura-soft px-2 py-0.5 text-[10px] text-sakura mr-2">当前</span>
                          )}
                          <button onClick={() => handleSetFixed(quote.id)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-sakura hover:bg-sakura-soft transition-colors">
                            设为每日一言
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {customList.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-medium text-muted-foreground">我的语录</p>
                    <div className="space-y-2">
                      {customList.map((quote) => (
                        <div key={quote.id} className="flex items-center gap-3 rounded-xl bg-background px-4 py-3">
                          <span className="flex-1 text-sm">{quote.text}</span>
                          <div className="flex items-center gap-1">
                            {config.mode === 'fixed' && config.fixedQuoteId === quote.id && (
                              <span className="rounded-md bg-sakura-soft px-2 py-0.5 text-[10px] text-sakura mr-1">当前</span>
                            )}
                            <button onClick={() => handleDeleteQuote(quote.id)} aria-label="删除" className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={10} /> 删除
                            </button>
                            <button onClick={() => handleSetFixed(quote.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-sakura hover:bg-sakura-soft transition-colors">
                              设为每日一言
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-sakura/10 bg-card">
              {showAddInput ? (
                <div>
                  <textarea
                    value={newQuoteText}
                    onChange={(e) => setNewQuoteText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入你喜欢的语录..."
                    className="w-full rounded-lg bg-background px-3 py-2 text-sm resize-none outline-none"
                    rows={2}
                    maxLength={200}
                  />
                  {errorMessage && (
                    <p className="mt-1 text-[10px] text-red-500">{errorMessage}</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => { setShowAddInput(false); setErrorMessage(''); }} className="flex-1 rounded-lg bg-muted py-1.5 text-sm text-muted-foreground transition-transform active:scale-95">
                      取消
                    </button>
                    <button onClick={handleAddQuote} className="flex-1 rounded-lg bg-sakura-soft py-1.5 text-sm text-sakura transition-transform active:scale-95">
                      添加
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddInput(true)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-sakura-soft py-2.5 text-sm text-sakura transition-transform active:scale-95">
                  <Plus size={15} /> 添加语录
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

type TaskTag = '学习' | '工作' | '运动' | '生活' | '其他'

interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  tag?: TaskTag
}

const tagIconMap: Record<TaskTag, { icon: typeof BookOpen; tone: string; bg: string; text: string }> = {
  '学习': { icon: BookOpen, tone: 'bg-sky-soft text-sky', bg: 'bg-sky-soft', text: 'text-sky' },
  '工作': { icon: Briefcase, tone: 'bg-sun/20 text-sun', bg: 'bg-sun/20', text: 'text-sun' },
  '运动': { icon: Dumbbell, tone: 'bg-leaf-soft text-leaf', bg: 'bg-leaf-soft', text: 'text-leaf' },
  '生活': { icon: Heart, tone: 'bg-sakura-soft text-sakura', bg: 'bg-sakura-soft', text: 'text-sakura' },
  '其他': { icon: MoreHorizontal, tone: 'bg-muted text-muted-foreground', bg: 'bg-muted', text: 'text-muted-foreground' },
}

const defaultTag: TaskTag = '其他'

type PlanTag = 'self' | 'charge' | 'others'
const PLAN_TAG_LABEL: Record<PlanTag, string> = {
  self: '照顾自己',
  charge: '充电',
  others: '身边的他',
}
type PlanSlot = 'any' | 'morning' | 'noon' | 'afternoon' | 'evening'
const PLAN_SLOT_LABEL: Record<PlanSlot, string> = {
  any: '随心',
  morning: '早上',
  noon: '中午',
  afternoon: '下午',
  evening: '晚上',
}
// 分区顺序：随心在最上方，其余四个时段紧随其后
const PLAN_SLOTS: PlanSlot[] = ['any', 'morning', 'noon', 'afternoon', 'evening']
// 待做数为 0 时各时段的副文案（早上沿用原「都安排好啦」）
const PLAN_SLOT_EMPTY_HINT: Record<PlanSlot, string> = {
  any: '想做的时候再来加就好',
  morning: '都安排好啦',
  noon: '不错嘛，继续加油',
  afternoon: '我不知道了你帮我想想',
  evening: '我不知道了你帮我想想',
}
interface PlanItem {
  id: string
  date: string
  text: string
  tag?: PlanTag
  slot?: PlanSlot
  done: boolean
  createdAt: number
  // 每日固定：勾选完成后第二天仍会自动出现，等你每日重新完成
  repeat?: boolean
}
interface PlanDay {
  date: string
  items: PlanItem[]
}

function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}
function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}
const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']
function weekRange(anchor: Date): Date[] {
  const dow = anchor.getDay()
  const start = addDays(anchor, -dow)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

function buildMockPlan(): PlanDay[] {
  const today = new Date()
  const t = toKey(today)
  const yesterday = toKey(addDays(today, -1))
  const tomorrow = toKey(addDays(today, 1))
  const y2 = toKey(addDays(today, 2))
  return [
    {
      date: yesterday,
      items: [
        { id: 'm1', date: yesterday, text: '给阳台的绿萝浇了水，看它舒展开叶子', tag: 'self', slot: 'morning', done: true, createdAt: 1 },
        { id: 'm2', date: yesterday, text: '陪妈妈打了通电话，听她讲菜市场的见闻', tag: 'others', slot: 'noon', done: true, createdAt: 2 },
      ],
    },
    {
      date: t,
      items: [
        { id: 't1', date: t, text: '早起拉伸十分钟，让肩膀松一松', tag: 'self', slot: 'morning', done: false, createdAt: 3 },
        { id: 't2', date: t, text: '读二十页一直想看的那本书', tag: 'charge', slot: 'noon', done: false, createdAt: 4 },
        { id: 't3', date: t, text: '给伴侣带一份他爱吃的草莓', tag: 'others', slot: 'afternoon', done: false, createdAt: 5 },
        { id: 't4', date: t, text: '把攒了一周的碗碟慢慢洗完', slot: 'evening', done: false, createdAt: 6 },
      ],
    },
    {
      date: tomorrow,
      items: [
        { id: 'tm1', date: tomorrow, text: '约朋友去公园走走，晒晒傍晚的太阳', tag: 'others', slot: 'afternoon', done: false, createdAt: 7 },
      ],
    },
    {
      date: y2,
      items: [
        { id: 'y2a', date: y2, text: '整理书桌，只留下真正用得上的东西', tag: 'self', slot: 'morning', done: false, createdAt: 8 },
        { id: 'y2b', date: y2, text: '学一小节喜欢的乐器曲子', tag: 'charge', slot: 'evening', done: false, createdAt: 9 },
      ],
    },
  ]
}

function CheckboxTick({ done }: { done: boolean }) {
  const len = 26
  return (
    <span
      role="checkbox"
      aria-checked={done}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200"
      style={{
        borderColor: done ? 'var(--color-sakura)' : 'var(--color-foreground)',
        background: done ? 'var(--color-sakura)' : 'transparent',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 13l4 4L19 7"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: len,
            strokeDashoffset: done ? 0 : len,
            transition: 'stroke-dashoffset 200ms ease',
          }}
        />
      </svg>
    </span>
  )
}

function PlanList({
  items,
  onToggle,
  isEditMode,
  onDelete,
}: {
  items: PlanItem[]
  onToggle: (id: string) => void
  isEditMode?: boolean
  onDelete?: (id: string) => void
}) {
  // 正在淡出过渡的项（勾选瞬间先淡出，再真正翻转分区）
  const [leaving, setLeaving] = useState<Set<string>>(new Set())
  // 被折叠收起的时段（默认全部展开）
  const [collapsed, setCollapsed] = useState<Set<PlanSlot>>(new Set())
  const toggleCollapse = (slot: PlanSlot) => {
    setCollapsed(prev => {
      const n = new Set(prev)
      n.has(slot) ? n.delete(slot) : n.add(slot)
      return n
    })
  }
  const handleToggle = (id: string) => {
    setLeaving(prev => new Set(prev).add(id))
    window.setTimeout(() => {
      onToggle(id)
      setLeaving(prev => {
        const n = new Set(prev)
        n.delete(id)
        return n
      })
    }, 180)
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <svg width="72" height="48" viewBox="0 0 96 64" fill="none" aria-hidden="true">
          <path
            d="M28 44c-9 0-16-7-16-16 0-8 6-15 14-16 3-9 11-14 20-14 11 0 20 8 21 19 8 1 14 8 14 16 0 9-7 16-16 16"
            stroke="var(--color-muted-foreground)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            opacity="0.55"
          />
        </svg>
        <p className="mt-4 font-serif text-[15px] text-foreground">今天还空着呢</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          不用急着填满。想做点什么的时候，<br />就轻轻加一件吧。
        </p>
      </div>
    )
  }
  // 单条事项（还想做 / 已做完 通用）
  const ItemRow = ({ item }: { item: PlanItem }) => {
    const isLeaving = leaving.has(item.id)
    return (
      <li
        key={item.id}
        className="animate-[fadeIn_200ms_ease] transition-all duration-200"
        style={{
          opacity: isLeaving ? 0 : 1,
          transform: isLeaving ? 'scale(0.96)' : 'scale(1)',
        }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggle(item.id)}
            className="flex flex-1 items-center gap-3 rounded-xl border border-sakura/25 bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-[#FBF4E9] active:bg-[#F3E9DB] dark:hover:bg-surface-2 dark:active:bg-surface-2"
          >
            <CheckboxTick done={item.done} />
            <span
              className="flex-1 text-[14px] leading-snug transition-colors duration-300"
              style={{ color: item.done ? 'var(--color-muted-foreground)' : 'var(--color-foreground)' }}
            >
              {item.text}
            </span>
            {item.tag && (
              <span className="shrink-0 rounded-full bg-sakura-soft px-2 py-0.5 text-[11px] text-sakura">
                {PLAN_TAG_LABEL[item.tag]}
              </span>
            )}
            {item.repeat && (
              <span className="shrink-0 rounded-full border border-sakura/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                每日固定
              </span>
            )}
          </button>
          {isEditMode && onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
              aria-label="删除任务"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100 active:scale-90"
            >
              <Trash2 size={16} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </li>
    )
  }
  return (
    <>
      {PLAN_SLOTS.map(slot => {
        const inSlot = items.filter(i => (i.slot ?? 'morning') === slot)
        if (inSlot.length === 0) return null
        const todo = inSlot.filter(i => !i.done)
        const done = inSlot.filter(i => i.done)
        const isCollapsed = collapsed.has(slot)
        return (
          <section key={slot} className="mb-4">
            <button
              type="button"
              onClick={() => toggleCollapse(slot)}
              aria-expanded={!isCollapsed}
              className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-[#F3E9DB] dark:hover:bg-surface-2/60"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-sakura" />
              <span className="font-serif text-[15px] font-medium text-foreground">
                {PLAN_SLOT_LABEL[slot]}
              </span>
              {todo.length > 0 ? (
                <span className="text-[12px] font-normal text-muted-foreground">
                  {todo.length} 件待做
                </span>
              ) : (
                <span className="text-[12px] font-normal text-muted-foreground">
                  {PLAN_SLOT_EMPTY_HINT[slot]}
                </span>
              )}
              <ChevronDown
                size={16}
                strokeWidth={2.2}
                className="ml-auto text-muted-foreground transition-transform duration-200"
                style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                aria-hidden="true"
              />
            </button>
            {!isCollapsed && (
              <>
                {todo.length > 0 && (
                  <ul className="mb-2 mt-1 flex flex-col gap-2">
                    {todo.map(item => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </ul>
                )}
                {done.length > 0 && (
                  <ul className="mt-1 flex flex-col gap-2 opacity-80">
                    {done.map(item => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        )
      })}
    </>
  )
}

function AddSheet({
  open,
  onClose,
  onSave,
  presetText,
}: {
  open: boolean
  onClose: () => void
  onSave: (text: string, tag?: PlanTag, slot?: PlanSlot, repeat?: boolean) => void
  presetText?: string
}) {
  const [text, setText] = useState('')
  const [tag, setTag] = useState<PlanTag | undefined>(undefined)
  const [slot, setSlot] = useState<PlanSlot>('morning')
  const [repeat, setRepeat] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      setText(presetText ?? '')
      setTag(undefined)
      setSlot('morning')
      setRepeat(false)
      const t = setTimeout(() => inputRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
    closeRef.current?.focus()
  }, [open, presetText])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const root = document.getElementById('plan-sheet')
        if (!root) return
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey as unknown as (e: Event) => void)
    return () => window.removeEventListener('keydown', onKey as unknown as (e: Event) => void)
  }, [open, onClose])

  if (!open) return null
  const canSave = text.trim().length > 0
  const tagOptions: PlanTag[] = ['self', 'charge', 'others']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 animate-[fadeIn_200ms_ease_forwards]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="加一件事"
        id="plan-sheet"
        className="relative w-full max-w-[420px] rounded-2xl border border-sakura/30 bg-card p-5 pb-6 shadow-2xl animate-[sheetCenter_220ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        <h2 className="mb-3 font-serif text-[17px] font-medium text-foreground">加一件事</h2>
        <label className="mb-1 block text-[13px] text-muted-foreground" htmlFor="plan-input">
          今天想为自己安排点什么？
        </label>
        <input
          id="plan-input"
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && canSave) onSave(text.trim(), tag, slot, repeat)
          }}
          placeholder="例如：给自己泡一杯热茶"
          className="mb-4 w-full rounded-xl border border-sakura/30 bg-white px-4 py-3 text-[14px] text-foreground outline-none transition-colors focus:border-sakura dark:bg-surface-1"
        />
        <p className="mb-1.5 text-[13px] text-muted-foreground">安排在</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {PLAN_SLOTS.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setSlot(opt)}
              aria-pressed={slot === opt}
              className="rounded-full border px-3 py-1.5 text-[13px] transition-colors"
              style={{
                borderColor: slot === opt ? 'var(--color-sakura)' : 'var(--color-sakura)',
                background: slot === opt ? 'var(--color-sakura-soft)' : 'transparent',
                color: slot === opt ? 'var(--color-sakura)' : 'var(--color-muted-foreground)',
              }}
            >
              {PLAN_SLOT_LABEL[opt]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRepeat(v => !v)}
          aria-pressed={repeat}
          className="mb-5 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] transition-colors"
          style={{
            borderColor: repeat ? 'var(--color-sakura)' : 'var(--color-sakura)',
            background: repeat ? 'var(--color-sakura-soft)' : 'transparent',
            color: repeat ? 'var(--color-sakura)' : 'var(--color-muted-foreground)',
          }}
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors"
            style={{ borderColor: repeat ? 'var(--color-sakura)' : 'var(--color-sakura)' }}
            aria-hidden="true"
          >
            {repeat && <span className="h-2 w-2 rounded-full bg-sakura" />}
          </span>
          设为每日计划
        </button>
        <p className="mb-1.5 text-[13px] text-muted-foreground">这件事关于</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {tagOptions.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setTag(tag === opt ? undefined : opt)}
              aria-pressed={tag === opt}
              className="rounded-full border px-3 py-1.5 text-[13px] transition-colors"
              style={{
                borderColor: tag === opt ? 'var(--color-sakura)' : 'var(--color-sakura)',
                background: tag === opt ? 'var(--color-sakura-soft)' : 'transparent',
                color: tag === opt ? 'var(--color-sakura)' : 'var(--color-muted-foreground)',
              }}
            >
              {PLAN_TAG_LABEL[opt]}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-sakura/30 py-3 text-[14px] text-muted-foreground transition-colors hover:bg-[#F3E9DB] dark:hover:bg-surface-2"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(text.trim(), tag, slot, repeat)}
            className="flex-1 rounded-full bg-sakura py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#C8466F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function TodayPlanPage({ onBack }: { onBack: () => void }) {
  const today = new Date()
  // 从本地存储读取计划与每日计划模板，没有则使用内置示例
  const [plan, setPlan] = useState<PlanDay[]>(() => {
    try {
      const stored = localStorage.getItem('warmFengPlan')
      if (stored) {
        const parsed = JSON.parse(stored) as PlanDay[]
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      /* 读取失败则回退到示例数据 */
    }
    return []
  })
  // 每日计划模板：设为每日计划后，每天都会重新出现，等你来完成
  const [fixedTemplates, setFixedTemplates] = useState<PlanItem[]>(() => {
    try {
      const stored = localStorage.getItem('warmFengPlanFixed')
      if (stored) {
        const parsed = JSON.parse(stored) as PlanItem[]
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      /* 读取失败则回退到空 */
    }
    return []
  })
  const [weekAnchor, setWeekAnchor] = useState<Date>(today)
  const [selectedKey, setSelectedKey] = useState<string>(toKey(today))
  const [sheetOpen, setSheetOpen] = useState(false)
  // 打开新增弹窗时预填的文本
  const [sheetPreset, setSheetPreset] = useState<string | undefined>(undefined)
  // 切周方向：上一周(dir=-1)向左滑、下一周(dir=1)向右滑
  const [weekDir, setWeekDir] = useState<-1 | 1>(-1)
  // 编辑模式：点击三点按钮后显示删除按钮
  const [isEditMode, setIsEditMode] = useState(false)
  // 历史记录页面显示
  const [showHistory, setShowHistory] = useState(false)

  const days = weekRange(weekAnchor)
  const dayMap = new Map(plan.map(d => [d.date, d]))
  const current = dayMap.get(selectedKey) ?? { date: selectedKey, items: [] }
  const hasPlans = (k: string) => (dayMap.get(k)?.items.length ?? 0) > 0

  // 把每日固定模板按「当天实例」注入当前日期（不重复注入）
  const syncFixedToDay = (key: string) => {
    if (fixedTemplates.length === 0) return
    setPlan(prev => {
      const existed = prev.some(d => d.date === key)
      const injected = fixedTemplates.map(t => ({
        ...t,
        id: `fx${t.id}@${key}`,
        date: key,
        done: false,
        createdAt: Date.now(),
      }))
      let next: PlanDay[]
      if (existed) {
        next = prev.map(d => {
          if (d.date !== key) return d
          const haveIds = new Set(d.items.map(i => i.id))
          const add = injected.filter(i => !haveIds.has(i.id))
          return { ...d, items: [...d.items, ...add] }
        })
      } else {
        next = [...(Array.isArray(prev) ? prev : []), { date: key, items: injected }]
      }
      return next
    })
  }

  // 切换日期时同步当天的固定项
  useEffect(() => {
    syncFixedToDay(selectedKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey])

  // 计划与每日计划模板持久化到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('warmFengPlan', JSON.stringify(plan))
    } catch {
      /* 存储失败忽略 */
    }
  }, [plan])
  useEffect(() => {
    try {
      localStorage.setItem('warmFengPlanFixed', JSON.stringify(fixedTemplates))
    } catch {
      /* 存储失败忽略 */
    }
  }, [fixedTemplates])

  const toggle = (id: string) => {
    setPlan(prev =>
      prev.map(d =>
        d.date === selectedKey
          ? {
              ...d,
              items: d.items.map(it => (it.id === id ? { ...it, done: !it.done } : it)),
            }
          : d,
      ),
    )
    // 通知首页「今日计划」卡片刷新进度
    window.dispatchEvent(new Event('data-updated'))
  }

  const deleteItem = (id: string) => {
    // 先检查是否是固定任务实例（id 格式为 fx{tplId}@{date}）
    // 例如：fxt1234567890@2026-08-08
    const tplMatch = id.match(/^fx(t[^@]+)@/)
    if (tplMatch) {
      const tplId = tplMatch[1]
      // 从固定模板中彻底移除
      setFixedTemplates(prev => prev.filter(t => t.id !== tplId))
    }
    // 从当前日期的 items 中移除任务
    setPlan(prev =>
      prev.map(d =>
        d.date === selectedKey
          ? { ...d, items: d.items.filter(it => it.id !== id) }
          : d,
      ),
    )
    window.dispatchEvent(new Event('data-updated'))
  }

  const addItem = (text: string, tag?: PlanTag, slot?: PlanSlot, repeat?: boolean) => {
    const baseSlot = slot ?? 'morning'
    if (repeat) {
      const tplId = `t${Date.now()}`
      const tpl: PlanItem = {
        id: tplId,
        date: selectedKey,
        text,
        tag,
        slot: baseSlot,
        done: false,
        createdAt: Date.now(),
        repeat: true,
      }
      setFixedTemplates(prev => [...(Array.isArray(prev) ? prev : []), tpl])
      const inst: PlanItem = { ...tpl, id: `fx${tplId}@${selectedKey}` }
      setPlan(prev => {
        const existing = prev.find(d => d.date === selectedKey)
        if (existing) {
          return prev.map(d => (d.date === selectedKey ? { ...d, items: [...d.items, inst] } : d))
        }
        return [...(Array.isArray(prev) ? prev : []), { date: selectedKey, items: [inst] }]
      })
    } else {
      const item: PlanItem = {
        id: `u${Date.now()}`,
        date: selectedKey,
        text,
        tag,
        slot: baseSlot,
        done: false,
        createdAt: Date.now(),
      }
      setPlan(prev => {
        const existing = prev.find(d => d.date === selectedKey)
        if (existing) {
          return prev.map(d => (d.date === selectedKey ? { ...d, items: [...d.items, item] } : d))
        }
        return [...(Array.isArray(prev) ? prev : []), { date: selectedKey, items: [item] }]
      })
    }
    // 通知首页「今日计划」卡片刷新进度
    window.dispatchEvent(new Event('data-updated'))
    setSheetOpen(false)
  }

  const allDone = current.items.length > 0 && current.items.every(i => i.done)

  // 获取当前周的年月信息
  const weekYear = weekAnchor.getFullYear()
  const weekMonth = weekAnchor.getMonth() + 1

  // 历史记录页面
  if (showHistory) {
    return (
      <PlanHistoryPage
        plan={plan}
        onBack={() => setShowHistory(false)}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-11 items-center justify-between border-b border-sakura/20 bg-background/95 px-3 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回首页"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-[#F2E4D2] dark:hover:bg-surface-2"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="font-serif text-[17px] font-medium text-foreground">今日计划</h1>
        <button
          type="button"
          onClick={() => setIsEditMode(!isEditMode)}
          aria-label={isEditMode ? '完成编辑' : '编辑'}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors dark:hover:bg-surface-2 ${isEditMode ? 'bg-sakura-soft text-sakura' : 'text-muted-foreground hover:bg-[#F2E4D2]'}`}
        >
          <MoreHorizontal size={20} strokeWidth={2} />
        </button>
      </header>

      <div className="mx-auto w-full max-w-[480px] flex-1 px-4 pb-6 pt-3">
        <div
          key={`week-${toKey(weekAnchor)}`}
          className={`mb-4 rounded-xl border-2 border-sakura/30 bg-white p-3 shadow-sm dark:bg-surface-1 ${
            weekDir < 0
              ? 'animate-[weekSlideL_260ms_cubic-bezier(0.22,1,0.36,1)]'
              : 'animate-[weekSlideR_260ms_cubic-bezier(0.22,1,0.36,1)]'
          }`}
          style={{ borderRadius: '12px 14px 12px 14px' }}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setWeekDir(-1)
                setWeekAnchor(addDays(weekAnchor, -7))
              }}
              aria-label="上一周"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[#F2E4D2] dark:hover:bg-surface-2"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1 rounded-md px-2 py-1 font-serif text-[13px] text-muted-foreground transition-colors hover:bg-[#F2E4D2] hover:text-foreground dark:hover:bg-surface-2"
            >
              <span>这周的小日子</span>
              <span className="text-[11px] text-muted-foreground/60">· {weekYear}年{weekMonth}月</span>
              <ChevronRight size={14} strokeWidth={2} className="text-muted-foreground/40" />
            </button>
            <button
              type="button"
              onClick={() => {
                setWeekDir(1)
                setWeekAnchor(addDays(weekAnchor, 7))
              }}
              aria-label="下一周"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[#F2E4D2] dark:hover:bg-surface-2"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
          <div role="group" aria-label="一周日期" className="flex justify-between gap-1">
            {days.map(d => {
              const key = toKey(d)
              const isToday = key === toKey(today)
              const selected = key === selectedKey
              const planned = hasPlans(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  aria-label={`${d.getMonth() + 1}月${d.getDate()}日${isToday ? ' 今天' : ''}${planned ? ' 有计划' : ''}`}
                  aria-pressed={selected}
                  className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 transition-all duration-200"
                  style={{
                    background: selected ? 'var(--color-sakura-soft)' : 'transparent',
                    animation: selected ? 'dayPop 240ms ease' : undefined,
                  }}
                >
                  <span className="text-[11px] text-muted-foreground">周{WEEK_CN[d.getDay()]}</span>
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[13px] transition-all duration-200"
                    style={{
                      border: isToday ? '2px solid var(--color-sakura)' : '2px solid transparent',
                      color: isToday ? 'var(--color-sakura)' : 'var(--color-foreground)',
                      fontWeight: isToday ? 600 : 400,
                      transform: selected ? 'scale(1.06)' : 'scale(1)',
                    }}
                  >
                    {d.getDate()}
                  </span>
                  <span
                    className="h-1 w-1 rounded-full transition-colors duration-200"
                    style={{ background: planned ? 'var(--color-sakura)' : 'transparent' }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {allDone && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-sakura-soft px-4 py-3 text-sakura">
            <Star size={16} strokeWidth={2} className="fill-sakura text-sakura" />
            <span className="font-serif text-[14px]">今天都做完啦，辛苦你啦。</span>
          </div>
        )}

        <div key={`day-${selectedKey}`} className="animate-[fadeIn_200ms_ease]">
          <PlanList items={current.items} onToggle={toggle} isEditMode={isEditMode} onDelete={deleteItem} />
        </div>

        {/* 正式的新增入口（用户要求保留为常驻入口，不使用底部胶囊） */}
        <button
          type="button"
          onClick={() => {
            setSheetPreset(undefined)
            setSheetOpen(true)
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sakura/40 py-3 text-[14px] text-muted-foreground transition-colors hover:bg-[#F3E9DB] dark:hover:bg-surface-2"
        >
          <Plus size={16} strokeWidth={2.5} />
          要干点什么呢~
        </button>
      </div>

      {/*
        底部胶囊（常驻加一件事）：用户要求暂不使用，先注释保留，后续需要时取消注释即可。
        <div className="sticky top-11 z-10 flex justify-center border-b border-sakura/15 bg-background/90 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 rounded-full bg-sakura px-6 py-3 text-[15px] font-medium text-white shadow-lg transition-all duration-200 hover:bg-[#C8466F] active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.5} />
            {current.items.length === 0
              ? '想做点什么，加一件？'
              : allDone
                ? '今天都做完啦，再加一件？'
                : '加一件事'}
          </button>
        </div>
      */}

      <AddSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={addItem}
        presetText={sheetPreset}
      />
    </div>
  )
}

// 计划历史记录页面
function PlanHistoryPage({ plan, onBack }: { plan: PlanDay[]; onBack: () => void }) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  // 按日期分组计划
  const groupedPlans = useMemo(() => {
    const map: Record<string, PlanDay> = {}
    plan.forEach(p => {
      // 只显示有计划的日期
      if (p.items.length > 0) {
        map[p.date] = p
      }
    })
    return map
  }, [plan])

  // 过滤当前年月的计划
  const monthPlans = useMemo(() => {
    const result: { date: string; day: number; items: PlanItem[]; completedCount: number; totalCount: number }[] = []
    Object.entries(groupedPlans).forEach(([date, planDay]) => {
      const d = new Date(date + 'T00:00:00')
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        const completedCount = planDay.items.filter(i => i.done).length
        result.push({
          date,
          day: d.getDate(),
          items: planDay.items,
          completedCount,
          totalCount: planDay.items.length,
        })
      }
    })
    return result.sort((a, b) => a.day - b.day)
  }, [groupedPlans, viewYear, viewMonth])

  // 年份选项（从2026年开始，到当前年份）
  const years = useMemo(() => {
    const startYear = 2026
    const currentYear = now.getFullYear()
    const result: number[] = []
    for (let y = startYear; y <= currentYear; y++) {
      result.push(y)
    }
    return result
  }, [])

  // 月份选项
  const monthOptions = useMemo(() => {
    const currentMonth = now.getMonth()
    const months: number[] = []
    if (viewYear === now.getFullYear()) {
      // 当前年份只显示从1月到当前月
      for (let m = 0; m <= currentMonth; m++) {
        months.push(m)
      }
    } else if (viewYear > now.getFullYear()) {
      // 未来年份不显示（不应出现）
    } else {
      // 过去年份显示全部12个月
      for (let m = 0; m < 12; m++) {
        months.push(m)
      }
    }
    return months
  }, [viewYear])

  const viewLabel = `${viewYear}年${viewMonth + 1}月`

  return (
    <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto bg-background">
      <header className="sticky top-0 z-20 flex h-11 items-center justify-between border-b border-sakura/20 bg-background/95 px-3 backdrop-blur">
        <button
          onClick={onBack}
          aria-label="返回"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-[#F2E4D2]"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="font-serif text-[17px] font-medium text-foreground">我的计划轨迹</h1>
        <div className="w-9" />
      </header>

      <div className="mx-auto w-full max-w-[480px] px-4 pb-28 pt-4">
        {/* 年月选择器 */}
        <div className="mb-6 rounded-xl border border-sakura/30 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif text-[15px] font-medium text-foreground">{viewLabel}</span>
          </div>
          
          {/* 年份选择栏 */}
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {years.map(year => (
              <button
                key={year}
                onClick={() => {
                  setSelectedYear(year)
                  setViewYear(year)
                }}
                className={`shrink-0 rounded-md px-3 py-1 text-[12px] transition-colors ${
                  selectedYear === year
                    ? 'bg-sakura-soft text-sakura font-medium'
                    : 'text-muted-foreground hover:bg-[#FBF4E9]'
                }`}
              >
                {year}年
              </button>
            ))}
          </div>

          {/* 月份网格 */}
          <div className="grid grid-cols-4 gap-1.5">
            {monthOptions.map(m => {
              const active = m === viewMonth
              return (
                <button
                  key={m}
                  onClick={() => setViewMonth(m)}
                  className={`rounded-lg px-2 py-1.5 text-[12px] transition-colors ${
                    active
                      ? 'bg-sakura-soft text-sakura font-medium'
                      : 'text-muted-foreground hover:bg-[#FBF4E9]'
                  }`}
                >
                  {m + 1}月
                </button>
              )
            })}
          </div>
        </div>

        {/* 计划列表 */}
        {monthPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
            <div className="mb-4">
              <Cloud className="h-12 w-12" strokeWidth={1.5} />
            </div>
            <p className="font-serif text-[14px]">这个月还没有计划</p>
            <p className="mt-1 text-[12px]">计划会悄悄藏在这里</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthPlans.map(({ date, day, items, completedCount, totalCount }) => (
              <div
                key={date}
                className="rounded-xl border border-sakura/20 bg-white p-3 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-[15px] font-medium text-foreground">
                      {day}日
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {WEEK_CN[new Date(date + 'T00:00:00').getDay()]}
                    </span>
                  </div>
                  <span className="text-[12px] text-muted-foreground">
                    {completedCount}/{totalCount} 完成
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                        item.done ? 'bg-sakura-soft/30' : 'bg-[#FBF9F1]'
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          item.done
                            ? 'border-sakura bg-sakura'
                            : 'border-stone-300'
                        }`}
                      >
                        {item.done && <Check size={10} strokeWidth={3} className="text-white" />}
                      </span>
                      <span
                        className={`flex-1 text-[13px] ${
                          item.done
                            ? 'text-muted-foreground/50 line-through'
                            : 'text-foreground'
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PlanCard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectedTag, setSelectedTag] = useState<TaskTag>(defaultTag)

  useEffect(() => {
    const stored = localStorage.getItem('todayTasks')
    if (stored) {
      try {
        const savedTasks = JSON.parse(stored) as Task[]
        const migratedTasks = savedTasks.map(task => ({
          ...task,
          tag: (task.tag as TaskTag) || defaultTag
        }))
        setTasks(migratedTasks)
      } catch {
        setTasks([])
      }
    }
  }, [])

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks)
    localStorage.setItem('todayTasks', JSON.stringify(newTasks))
  }

  const addTask = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      alert('请输入计划内容')
      return
    }
    if (trimmed.length > 100) {
      alert('计划不能超过100个字符')
      return
    }
    const newTask: Task = {
      id: generateId(),
      title: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
      tag: selectedTag,
    }
    const newTasks = [...tasks, newTask]
    saveTasks(newTasks)
    
    const today = getTodayDate()
    saveDailySummary({
      date: today,
      tasks: {
        total: newTasks.length,
        completed: newTasks.filter(t => t.completed).length,
        items: newTasks.map(t => ({ id: t.id, text: t.title, completed: t.completed }))
      }
    })
    
    window.dispatchEvent(new Event('data-updated'))
    
    setInputValue('')
    setSelectedTag(defaultTag)
    setShowInput(false)
  }

  const deleteTask = (id: string) => {
    const newTasks = tasks.filter((task) => task.id !== id)
    saveTasks(newTasks)
    
    const today = getTodayDate()
    saveDailySummary({
      date: today,
      tasks: {
        total: newTasks.length,
        completed: newTasks.filter(t => t.completed).length,
        items: newTasks.map(t => ({ id: t.id, text: t.title, completed: t.completed }))
      }
    })
    
    window.dispatchEvent(new Event('data-updated'))
  }

  const toggleTask = (id: string) => {
    const newTasks = tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t)
    saveTasks(newTasks)
    
    const today = getTodayDate()
    const completedCount = newTasks.filter(t => t.completed).length
    
    saveDailySummary({
      date: today,
      tasks: {
        total: newTasks.length,
        completed: completedCount,
        items: newTasks.map(t => ({ id: t.id, text: t.title, completed: t.completed }))
      }
    })
    
    window.dispatchEvent(new Event('data-updated'))
    
    if (completedCount === newTasks.length && newTasks.length > 0) {
      saveGrowthEvent(getTodayDate(), 'plan')

      const currentWeek = getWeekNumber(today)
      const events = getGrowthEvents()
      const weekPlanEvents = events.filter(e => e.type === 'plan' && getWeekNumber(e.date) === currentWeek)
      if (weekPlanEvents.length >= 1) {
        saveGrowthEvent(getTodayDate(), 'weekly_plan')
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask()
    }
  }

  return (
    <section className="rounded-md border border-sakura/30 bg-card p-5">
      <div className="flex items-center justify-between">
        <CardTitle eyebrow="TODAY'S PLAN" title="今日计划" />
        <button onClick={() => setShowInput(true)} aria-label="添加计划" className="flex size-9 items-center justify-center rounded-full bg-sakura-soft text-accent-foreground transition-transform active:scale-90"><Plus size={17} /></button>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {showInput && (
          <>
            <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入计划..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/75"
                autoFocus
                maxLength={100}
              />
              <button onClick={addTask} className="flex size-8 items-center justify-center rounded-full bg-sakura-soft text-accent-foreground transition-transform active:scale-90"><Plus size={15} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(tagIconMap) as TaskTag[]).map((tag) => {
                const { icon: Icon, bg, text } = tagIconMap[tag]
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-transform ${selectedTag === tag ? `${bg} ${text} ring-1 ring-sakura` : 'bg-muted'}`}
                  >
                    <Icon size={12} />
                    <span className={selectedTag === tag ? text : 'text-muted-foreground'}>{tag}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
        {tasks.map((task) => {
          const { icon: Icon, tone } = tagIconMap[task.tag || defaultTag]
          const completed = task.completed
          return (
            <div key={task.id} className="flex min-h-12 items-center gap-3 rounded-2xl bg-background px-3 text-left transition-transform active:scale-[.98]">
              <button onClick={() => toggleTask(task.id)} className="flex-1 flex items-center gap-3">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={15} strokeWidth={1.8} /></span>
                <span className={`flex-1 text-sm ${completed ? 'text-muted-foreground line-through decoration-sakura/60' : 'text-foreground'}`}>{task.title}</span>
                <span className="relative flex h-8 w-14 items-center justify-center">
                  {completed ? <span key={`stamp-${task.id}`} className="animate-stamp rotate-[-6deg] rounded-md border-2 border-sakura px-1.5 py-0.5 font-serif text-[10px] font-bold tracking-widest text-sakura">完成</span> : <span className="text-[10px] text-muted-foreground">轻触盖章</span>}
                </span>
              </button>
              <button onClick={() => deleteTask(task.id)} aria-label="删除计划" className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-red-500 active:scale-90"><Trash2 size={14} strokeWidth={1.8} /></button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

interface DailyReview {
  content: string
  date: string
  createdAt: string
}

function ReviewCard() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [tomorrowContent, setTomorrowContent] = useState('')

  const getTodayDate = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  useEffect(() => {
    const storedReview = localStorage.getItem('dailyReview')
    if (storedReview) {
      try {
        const review = JSON.parse(storedReview) as DailyReview
        if (review.date === getTodayDate()) {
          setContent(review.content)
        }
      } catch {
        setContent('')
      }
    }

    const storedTomorrow = localStorage.getItem('dailyTomorrow')
    if (storedTomorrow) {
      try {
        const tomorrow = JSON.parse(storedTomorrow) as DailyReview
        if (tomorrow.date === getTodayDate()) {
          setTomorrowContent(tomorrow.content)
        }
      } catch {
        setTomorrowContent('')
      }
    }
  }, [])

  const saveReview = () => {
    const today = getTodayDate()
    if (!content.trim()) {
      localStorage.removeItem('dailyReview')
      saveDailySummary({
        date: today,
        review: {
          content: '',
          tomorrow: tomorrowContent
        }
      })
      window.dispatchEvent(new Event('data-updated'))
      return
    }
    const review: DailyReview = {
      content: content.trim(),
      date: today,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('dailyReview', JSON.stringify(review))
    
    saveDailySummary({
      date: today,
      review: {
        content: content.trim(),
        tomorrow: tomorrowContent
      }
    })
    
    saveGrowthEvent(getTodayDate(), 'review')
    window.dispatchEvent(new Event('data-updated'))
  }

  const saveTomorrow = () => {
    const today = getTodayDate()
    if (!tomorrowContent.trim()) {
      localStorage.removeItem('dailyTomorrow')
      saveDailySummary({
        date: today,
        review: {
          content: content.trim(),
          tomorrow: ''
        }
      })
      window.dispatchEvent(new Event('data-updated'))
      return
    }
    const tomorrow: DailyReview = {
      content: tomorrowContent.trim(),
      date: today,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('dailyTomorrow', JSON.stringify(tomorrow))
    
    saveDailySummary({
      date: today,
      review: {
        content: content.trim(),
        tomorrow: tomorrowContent.trim()
      }
    })
    window.dispatchEvent(new Event('data-updated'))
  }

  const getSummary = () => {
    if (!content.trim()) return '今天最大的收获……'
    return content.length > 30 ? content.slice(0, 30) + '...' : content
  }

  return (
    <section className="rounded-md border border-sun/40 bg-card p-5">
      <div className="flex items-center justify-between">
        <CardTitle eyebrow="DAILY REVIEW" title="今日复盘" />
        {isExpanded && (
          <button onClick={() => setIsExpanded(false)} className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform active:scale-95">
            ×
          </button>
        )}
      </div>

      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-4 w-full text-left"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 transition-colors hover:bg-muted/50">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-sakura" />
            <span className="text-sm text-muted-foreground">{getSummary()}</span>
          </div>
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-start gap-3 rounded-2xl bg-background px-4 py-3">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-sakura" />
            <span className="sr-only">今天最大的收获</span>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={saveReview}
              placeholder="今天最大的收获……"
              className="min-h-6 w-full resize-none bg-transparent text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/75"
            />
          </label>
          <label className="flex items-start gap-3 rounded-2xl bg-background px-4 py-3">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-leaf" />
            <span className="sr-only">明天第一件事</span>
            <textarea
              rows={3}
              value={tomorrowContent}
              onChange={(e) => setTomorrowContent(e.target.value)}
              onBlur={saveTomorrow}
              placeholder="明天第一件事……"
              className="min-h-6 w-full resize-none bg-transparent text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/75"
            />
          </label>
          <button onClick={() => {
            saveReview()
            setIsExpanded(false)
          }} className="w-full rounded-xl bg-sun/20 py-2.5 text-sm text-sun transition-transform active:scale-95">
            完成复盘
          </button>
        </div>
      )}
    </section>
  )
}

const navItems = [
  { label: '首页', icon: Home },
  { label: '目标', icon: TargetDart, stagger: true },
  { label: '专注', icon: Timer },
  { label: '我的', icon: UserRound },
]

const focusTags = [
  { id: 1, name: '学习' },
  { id: 2, name: '阅读' },
  { id: 3, name: '健身' },
]

const planColors = [
  'bg-sky-soft text-sky',
  'bg-sakura-soft text-sakura',
  'bg-leaf-soft text-leaf',
  'bg-sun/10 text-sun',
]

interface WeeklyPlan {
  id: string
  title: string
  completed: boolean
  color: string
  createdAt: string
  weekStart?: string
}

interface MyDream {
  title: string
  description: string
  deadline: string
  createdAt: string
  updatedAt: string
  checkInDays: string[]
}

interface DailyMessage {
  content: string
  date: string
  updatedAt: string
}

type HabitCategory = 'study' | 'self' | 'life' | 'emotion'

interface Habit {
  id: string
  name: string
  icon: string
  category: HabitCategory
  goalDuration: number
  currentDuration: number
  streakDays: number
  lastCheckDate: string
  checkInHistory: string[]
  createdAt: string
}

type IconDef = { name: string; label: string; Component: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }

const studyIcons: IconDef[] = [
  { name: 'BookOpen', label: '书本', Component: BookOpen },
  { name: 'GraduationCap', label: '学士帽', Component: GraduationCap },
  { name: 'PenTool', label: '钢笔', Component: PenTool },
  { name: 'Pencil', label: '铅笔', Component: Pencil },
  { name: 'FileText', label: '笔记', Component: FileText },
  { name: 'NotebookPen', label: '手账', Component: NotebookPen },
  { name: 'Brain', label: '大脑', Component: Brain },
  { name: 'Lightbulb', label: '灵感', Component: Lightbulb },
  { name: 'Languages', label: '语言', Component: Languages },
  { name: 'Calculator', label: '计算', Component: Calculator },
  { name: 'Compass', label: '探索', Component: Compass },
  { name: 'Glasses', label: '阅读', Component: Glasses },
]

const selfIcons: IconDef[] = [
  { name: 'Dumbbell', label: '哑铃', Component: Dumbbell },
  { name: 'Flame', label: '火焰', Component: Flame },
  { name: 'Zap', label: '闪电', Component: Zap },
  { name: 'Leaf', label: '叶子', Component: Leaf },
  { name: 'Sunrise', label: '早起', Component: Sunrise },
  { name: 'Moon', label: '早睡', Component: Moon },
  { name: 'Bed', label: '睡眠', Component: Bed },
  { name: 'Droplets', label: '饮水', Component: Droplets },
  { name: 'Footprints', label: '跑步', Component: Footprints },
  { name: 'Target', label: '靶心', Component: Target },
  { name: 'Timer', label: '计时', Component: Timer },
  { name: 'Smile', label: '心情', Component: Smile },
]

const lifeIcons: IconDef[] = [
  { name: 'Home', label: '居家', Component: Home },
  { name: 'Coffee', label: '咖啡', Component: Coffee },
  { name: 'UtensilsCrossed', label: '餐饮', Component: UtensilsCrossed },
  { name: 'ShoppingBag', label: '购物', Component: ShoppingBag },
  { name: 'Briefcase', label: '工作', Component: Briefcase },
  { name: 'Camera', label: '摄影', Component: Camera },
  { name: 'Plane', label: '旅行', Component: Plane },
  { name: 'Music', label: '音乐', Component: Music },
  { name: 'Heart', label: '关爱', Component: Heart },
  { name: 'Sparkles', label: '闪光', Component: Sparkles },
  { name: 'Star', label: '星星', Component: Star },
  { name: 'Sun', label: '太阳', Component: Sun },
]

const iconMap: Record<HabitCategory, IconDef[]> = {
  study: studyIcons,
  self: selfIcons,
  life: lifeIcons,
  // 存量「情绪」习惯兼容：编辑时回退到生活图标（UI 已不提供该分类选项）
  emotion: lifeIcons,
}

const getAllIcons = () => [...studyIcons, ...selfIcons, ...lifeIcons]

const getIconComponent = (iconName: string) => {
  const all = getAllIcons()
  return all.find(i => i.name === iconName)?.Component || BookOpen
}

function GoalsPage({ onBack, onOpenWeeklyPlan, onOpenHistory, onOpenTodayPlan }: { onBack: () => void; onOpenWeeklyPlan?: () => void; onOpenHistory?: () => void; onOpenTodayPlan?: () => void }) {
  // 今日计划统计（与 TodayPlanCard 内部逻辑一致）
  const todayStats = useMemo(() => {
    const todayKey = toKey(new Date())
    const planStored = localStorage.getItem('warmFengPlan')
    if (planStored) {
      try {
        const plan = JSON.parse(planStored) as PlanDay[]
        const todayDay = plan.find(d => d.date === todayKey)
        if (todayDay && Array.isArray(todayDay.items)) {
          return { total: todayDay.items.length, completed: todayDay.items.filter(i => i.done).length }
        }
      } catch { /* ignore */ }
    }
    const stored = localStorage.getItem('todayTasks')
    if (stored) {
      try {
        const tasks = JSON.parse(stored) as { completed: boolean }[]
        return { total: tasks.length, completed: tasks.filter(t => t.completed).length }
      } catch { /* ignore */ }
    }
    return { total: 0, completed: 0 }
  }, [])
  const todayPercent = todayStats.total > 0 ? Math.round((todayStats.completed / todayStats.total) * 100) : 0

  const [dreamTitle, setDreamTitle] = useState('考上本科')
  const [dreamDescription, setDreamDescription] = useState('')
  const [dreamDeadline, setDreamDeadline] = useState('')
  const [dreamCreatedAt, setDreamCreatedAt] = useState('')
  const [dreamCheckInDays, setDreamCheckInDays] = useState<string[]>([])
  const [dailyMessage, setDailyMessage] = useState('今天也离梦想近了一点。')
  const [activeCategory, setActiveCategory] = useState<'study' | 'self' | 'life' | 'emotion'>('study')
  const [plans, setPlans] = useState<WeeklyPlan[]>([])
  const [editing, setEditing] = useState(false)
  const [habits, setHabits] = useState<Habit[]>([])
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitIcon, setNewHabitIcon] = useState('BookOpen')
  const [newHabitDuration, setNewHabitDuration] = useState(30)
  const [isCustomDuration, setIsCustomDuration] = useState(false)
  const [customDurationInput, setCustomDurationInput] = useState('')
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('study')
  const [menuHabitId, setMenuHabitId] = useState<string | null>(null)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showMessage, setShowMessage] = useState(true)
  const [showArchiveAlert, setShowArchiveAlert] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showDeleteHabitConfirm, setShowDeleteHabitConfirm] = useState(false)
  const [pendingDeleteHabitId, setPendingDeleteHabitId] = useState<string | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const categories = [
    { key: 'study' as const, label: '学习', Icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-50/60', bar: 'bg-blue-300' },
    { key: 'self' as const, label: '自律', Icon: Leaf, color: 'text-green-500', bg: 'bg-green-50/60', bar: 'bg-green-300' },
    { key: 'life' as const, label: '生活', Icon: Home, color: 'text-orange-400', bg: 'bg-orange-50/60', bar: 'bg-orange-300' },
  ]

  useEffect(() => {
    const dream = GoalData.loadDream()
    setDreamTitle(dream.title || '')
    setDreamDescription(dream.description || '')
    setDreamDeadline(dream.deadline || '')
    setDreamCreatedAt(dream.createdAt || '')
    setDreamCheckInDays(dream.checkInDays)

    setPlans(GoalData.loadPlans())

    const message = GoalData.loadDailyMessage()
    setDailyMessage(message.content)

    setHabits(GoalData.loadHabits())
  }, [])

  const saveHabits = (newHabits: Habit[]) => {
    setHabits(newHabits)
    GoalData.saveHabits(newHabits)
  }

  const addHabit = () => {
    const trimmed = newHabitName.trim()
    if (!trimmed) return
    const updated = GoalData.addHabit(trimmed, newHabitIcon, newHabitCategory, newHabitDuration)
    setHabits(updated)
    setNewHabitName('')
    setNewHabitIcon(iconMap[newHabitCategory][0].name)
    setNewHabitDuration(30)
    setIsCustomDuration(false)
    setCustomDurationInput('')
    setShowAddHabit(false)
  }

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id))
    GoalData.saveHabits(habits.filter(h => h.id !== id))
  }

  const toggleHabitCheckIn = (habitId: string) => {
    const updated = GoalData.toggleHabitCheckIn(habitId)
    setHabits(updated)
    const habit = updated.find(h => h.id === habitId)
    if (habit && habit.lastCheckDate === GoalData.getTodayDate()) {
      saveGrowthEvent(GoalData.getTodayDate(), 'habit')
    }
  }

  useEffect(() => {
    const currentIcons = iconMap[newHabitCategory]
    if (!currentIcons.find(i => i.name === newHabitIcon)) {
      setNewHabitIcon(currentIcons[0].name)
    }
  }, [newHabitCategory])

  const habitsByCategory = (cat: HabitCategory) => habits.filter(h => h.category === cat)

  const handleLongPressStart = (habitId: string) => {
    longPressTimer.current = setTimeout(() => {
      setMenuHabitId(habitId)
    }, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleDeleteHabit = (habitId: string) => {
    setPendingDeleteHabitId(habitId)
    setShowDeleteHabitConfirm(true)
  }

  const confirmDeleteHabit = () => {
    if (pendingDeleteHabitId) {
      deleteHabit(pendingDeleteHabitId)
      setMenuHabitId(null)
    }
    setPendingDeleteHabitId(null)
    setShowDeleteHabitConfirm(false)
  }

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
    setMenuHabitId(null)
  }

  const updateHabit = (updated: Habit) => {
    saveHabits(habits.map(h => h.id === updated.id ? updated : h))
    setEditingHabit(null)
  }

  const saveDream = () => {
    const dream: MyDream = {
      title: dreamTitle.trim(),
      description: dreamDescription.trim(),
      deadline: dreamDeadline,
      createdAt: dreamCreatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkInDays: dreamCheckInDays,
    }
    GoalData.saveDream(dream)
    window.dispatchEvent(new Event('data-updated'))
  }

  const doArchiveDream = () => {
    const dream: MyDream = {
      title: dreamTitle.trim(),
      description: dreamDescription.trim(),
      deadline: dreamDeadline,
      createdAt: dreamCreatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkInDays: dreamCheckInDays,
    }
    GoalData.archiveDream(dream)
    setDreamTitle('')
    setDreamDescription('')
    setDreamDeadline('')
    setDreamCreatedAt('')
    setDreamCheckInDays([])
    setEditing(false)
    window.dispatchEvent(new Event('data-updated'))
  }

  const handleArchiveDream = () => {
    if (!dreamTitle.trim()) {
      setShowArchiveAlert(true)
      return
    }
    setShowArchiveConfirm(true)
  }

  const calculateDaysRemaining = () => {
    return GoalData.calculateRemainingDays(dreamDeadline)
  }

  const totalCheckInDays = GoalData.getValidCheckInCount()
  const isCheckedInToday = dreamCheckInDays.includes(GoalData.getTodayDate())

  const toggleCheckIn = () => {
    // 已打卡则不允许取消（避免误操作）
    if (isCheckedInToday) return
    const today = GoalData.getTodayDate()
    const newCheckInDays = [...dreamCheckInDays, today]
    setDreamCheckInDays(newCheckInDays)
    const dream: MyDream = {
      title: dreamTitle.trim(),
      description: dreamDescription.trim(),
      deadline: dreamDeadline,
      createdAt: dreamCreatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkInDays: newCheckInDays,
    }
    GoalData.saveDream(dream)
    // 写入打卡日志
    GoalData.logCheckIn({
      id: `dream-${today}`,
      date: today,
      type: 'dream',
      dreamTitle: dreamTitle.trim() || '未命名梦想',
      createdAt: new Date().toISOString(),
    })
    window.dispatchEvent(new Event('data-updated'))
    saveGrowthEvent(getTodayDate(), 'dream')
  }

  const completedCount = plans.filter(p => p.completed).length
  const totalCount = plans.length
  const weeklyProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const last14Days = GoalData.getLast14Days()
  const today = GoalData.getTodayDate()

  return (
    <>
      <div className="app-scrollbar flex-1 overflow-y-auto px-5 pb-28 paper-texture pt-3">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between py-1">
          <button onClick={onBack} aria-label="返回首页" className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-serif text-[24px] font-medium tracking-[0.04em]">目标</h1>
          </div>
          <button
            onClick={() => onOpenHistory?.()}
            aria-label="目标历史记录"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:text-sakura hover:bg-stone-100 transition-colors"
          >
            <History size={15} strokeWidth={1.5} />
            历史
          </button>
        </div>

        {/* 梦想大卡 - 堆叠纸张效果 */}
        <PaperStackCard className="mb-6" layers={2} tornEdge={true} showTape={false} padding="py-3 px-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={dreamTitle}
                    onChange={(e) => setDreamTitle(e.target.value)}
                    className="w-full rounded-sm bg-white/60 border border-stone-200/70 px-3 py-1.5 font-serif text-[17px] font-medium tracking-wide text-foreground outline-none focus:border-sakura/40"
                    placeholder="梦想标题"
                    maxLength={30}
                    autoFocus
                  />
                  <div className="relative">
                    <textarea
                      value={dreamDescription}
                      onChange={(e) => setDreamDescription(e.target.value)}
                      className="w-full rounded-sm bg-white/60 border border-stone-200/70 px-3 py-1.5 text-[12px] text-foreground outline-none focus:border-sakura/40 resize-none pr-12"
                      placeholder="描述你的目标..."
                      rows={2}
                      maxLength={100}
                    />
                    <span className={`absolute right-2 bottom-1.5 text-[10px] tabular-nums ${dreamDescription.length >= 90 ? 'text-red-400' : dreamDescription.length >= 75 ? 'text-amber-500' : 'text-muted-foreground/60'}`}>
                      {dreamDescription.length}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dreamDeadline}
                      onChange={(e) => setDreamDeadline(e.target.value)}
                      className="flex-1 rounded-sm bg-white/60 border border-stone-200/70 px-2 py-1 text-[12px] text-foreground outline-none focus:border-sakura/40"
                    />
                    <button
                      onClick={() => { saveDream(); setEditing(false) }}
                      className="px-3 py-1 rounded-sm bg-sakura-soft text-sakura text-[12px] font-medium border border-sakura/30 hover:bg-sakura-soft/80 transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-3 py-1 rounded-sm text-muted-foreground text-[12px] hover:text-foreground transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-serif text-[20px] font-medium tracking-[0.04em] text-foreground truncate">
                    {dreamTitle || '设置你的梦想'}
                  </h2>
                  <p className="font-serif text-[14px] leading-6 tracking-wide text-muted-foreground/80 mt-0.5 break-all">
                    {dreamDescription || '添加目标描述...'}
                  </p>
                </>
              )}
            </div>
            {!editing ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleArchiveDream}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-green-50/70 flex items-center justify-center text-green-600 hover:text-green-700 transition-colors border border-green-200/60"
                  aria-label="标记目标完成"
                  title="标记完成"
                >
                  <CheckCircle2 size={14} strokeWidth={1.5} />
                  <span className="text-[12px] font-medium">完成</span>
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="w-7 h-7 rounded-sm hover:bg-stone-100/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="编辑梦想"
                >
                  <Edit2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div className="w-7 h-7" />
            )}
          </div>

          {/* 本周进度 — 始终显示 */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground/70">本周进度</span>
              <span className="text-[11px] text-sakura font-medium tabular-nums">{weeklyProgress}%</span>
            </div>
            <LinearProgress value={weeklyProgress} size={6} aria-label="本周进度" />
            <p className="text-[10px] text-muted-foreground/60 mt-1">{completedCount}/{totalCount} 计划完成</p>
          </div>

          {/* 底部信息行 — 始终显示 */}
          <div className="flex items-center gap-4 pt-2.5 text-[12px] text-muted-foreground/70"
            style={{ borderTop: '1px dashed rgba(196, 168, 130, 0.3)' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-sakura/70" />
              {dreamDeadline ? `${dreamDeadline}截止 · ${calculateDaysRemaining()}天` : '未设置截止'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-sakura/70" />
              已坚持 {totalCheckInDays} 天
            </span>
          </div>
        </PaperStackCard>

        {/* 今日计划 + 本周计划 */}
        <div className="w-full mb-6 rounded-xl border border-stone-200/80 bg-background/60 shadow-sm dark:border-border dark:bg-surface-1">
          {/* 今日计划区域 */}
          <button
            type="button"
            onClick={() => onOpenTodayPlan?.()}
            className="flex w-full cursor-pointer flex-col px-4 py-3 text-left transition-colors hover:bg-stone-50/50 active:scale-[.99] dark:hover:bg-surface-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-serif text-[15px] font-medium tracking-wide text-foreground">今日计划</span>
              </div>
              {todayStats.total > 0 && (
                <span className="font-serif text-[12px] text-muted-foreground">{todayStats.completed}/{todayStats.total}</span>
              )}
            </div>
            {todayStats.total === 0 ? (
              <p className="mt-1 text-[11px] text-muted-foreground/50 italic">还没有计划，点击添加</p>
            ) : (
              <>
                <LinearProgress value={todayPercent} size={6} aria-label="今日计划完成度" />
                <div className="mt-0.5 flex justify-end">
                  <span className="text-[10px] text-muted-foreground/60">{todayPercent}% 完成</span>
                </div>
              </>
            )}
          </button>

          {/* 手绘风格分隔线 */}
          <div className="mx-3 border-t border-stone-300/40 dark:border-border/60"
            style={{
              borderRadius: '2px 0 3px 1px / 1px 2px 0 3px',
              transform: 'rotate(-0.3deg)',
              opacity: 0.6,
            }}
          />

          {/* 本周计划区域 */}
          <button
            onClick={() => onOpenWeeklyPlan?.()}
            className="flex w-full cursor-pointer flex-col px-4 py-3 text-left transition-colors hover:bg-stone-50/50 active:scale-[.99] dark:hover:bg-surface-2"
          >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-serif text-[15px] font-medium tracking-wide text-foreground">本周计划</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sakura-soft text-sakura">WEEKLY</span>
            </div>
            <ChevronRight size={16} strokeWidth={1.5} className="text-muted-foreground/60" />
          </div>
          {plans.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/50 italic">还没有计划，点击添加</p>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground/70 truncate">
                {plans.slice(0, 2).map(p => p.title).join('、')}
                {plans.length > 2 && ` 等 ${plans.length} 项`}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1">
                  <LinearProgress value={plans.length > 0 ? Math.round((completedCount / plans.length) * 100) : 0} size={6} aria-label="本周计划完成度" />
                </div>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">{completedCount}/{plans.length}</span>
              </div>
            </>
          )}
        </button>
        </div>

        {/* 分类书签栏 */}
        <div className="flex gap-1 mb-2 px-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-1 flex flex-row items-center justify-center gap-1 py-1.5 rounded-md font-serif text-[13px] font-medium tracking-wide transition-all duration-200 ${
                activeCategory === cat.key
                  ? 'bg-stone-100 border border-stone-200 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <cat.Icon size={14} strokeWidth={1.5} className={activeCategory === cat.key ? cat.color : ''} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* 分类迷你进度条 */}
        <div className="flex items-center justify-between gap-1.5 mb-4 px-1">
          {categories.map((cat) => {
            const catHabits = habitsByCategory(cat.key)
            const total = catHabits.length
            const done = catHabits.filter(h => h.lastCheckDate === today).length
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div key={cat.key} className="flex flex-1 flex-col items-center gap-0.5 min-w-0">
                <div className="w-full overflow-hidden rounded-full">
                  <LinearProgress value={pct} size={6} aria-label={`${cat.label}完成度`} />
                </div>
                <span className="text-[9px] text-muted-foreground/60 tabular-nums">{done}/{total}</span>
              </div>
            )
          })}
        </div>

        {/* 习惯列表区域 */}
        <div className="space-y-3">
          {/* 当前分类的习惯 */}
          {habitsByCategory(activeCategory).length > 0 ? (
            <div className="space-y-2">
              {habitsByCategory(activeCategory).map((habit) => {
                const IconComponent = getIconComponent(habit.icon)
                const isDoneToday = habit.lastCheckDate === today
                const showMenu = menuHabitId === habit.id
                return (
                  <div key={habit.id} className="relative">
                    <div
                      className={`flex items-center gap-3 rounded-md bg-white/60 border border-stone-200/60 px-3 py-2.5 transition-colors dark:border-border dark:bg-surface-1 ${showMenu ? 'border-sakura/40 bg-sakura-soft/20' : ''}`}
                      onMouseDown={() => handleLongPressStart(habit.id)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => handleLongPressStart(habit.id)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchMove={handleLongPressEnd}
                      onContextMenu={(e) => { e.preventDefault(); setMenuHabitId(habit.id) }}
                    >
                      <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                        <IconComponent size={15} className="text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-[15px] font-medium tracking-wide text-foreground truncate">{habit.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground/60">{habit.goalDuration}分钟</span>
                          {habit.streakDays > 0 && (
                            <span className="text-[10px] text-sakura flex items-center gap-0.5">
                              <Flame size={10} className="inline" />
                              连续{habit.streakDays}天
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleHabitCheckIn(habit.id)}
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors active:scale-95 ${
                          isDoneToday ? 'bg-sakura-soft text-sakura' : 'bg-stone-100 text-muted-foreground hover:text-foreground'
                        }`}
                        title={isDoneToday ? '取消打卡' : '打卡'}
                      >
                        {isDoneToday ? <Check size={14} strokeWidth={2} /> : <Circle size={14} strokeWidth={1.5} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuHabitId(menuHabitId === habit.id ? null : habit.id) }}
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-muted-foreground/60 hover:text-foreground hover:bg-stone-100 transition-colors"
                      >
                        <MoreHorizontal size={14} strokeWidth={1.5} />
                      </button>
                    </div>

                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuHabitId(null)} />
                        <div className="absolute right-0 top-full mt-1 z-50 w-28 rounded-md bg-white border border-stone-200 shadow-lg overflow-hidden dark:border-border dark:bg-surface-1">
                          <button
                            onClick={() => handleEditHabit(habit)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-stone-50 transition-colors"
                          >
                            <Edit2 size={13} strokeWidth={1.5} />
                            编辑
                          </button>
                          <div className="h-px bg-stone-100" />
                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50/50 transition-colors"
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                            删除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ) : null}

          {/* 添加习惯入口 */}
          <button
            onClick={() => { setNewHabitCategory(activeCategory); setShowAddHabit(true) }}
            className="w-full rounded-md border border-dashed border-stone-200 py-2.5 font-serif text-[14px] tracking-wide text-muted-foreground/70 hover:text-foreground hover:border-stone-300 hover:bg-stone-50/40 transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={14} strokeWidth={1.5} />
            添加{categories.find(c => c.key === activeCategory)?.label}习惯
          </button>
        </div>

        {/* 今日寄语 */}
        {showMessage && dailyMessage && (
          <div className="mt-4 rounded-md bg-sakura-soft/50 border border-sakura-soft/80 px-4 py-2.5 flex items-center gap-2">
            <Leaf size={14} className="text-sakura shrink-0" strokeWidth={1.5} />
            <p className="flex-1 font-serif text-[14px] leading-5 tracking-wide text-muted-foreground italic truncate">{dailyMessage}</p>
            <button
              onClick={() => setShowMessage(false)}
              className="w-5 h-5 rounded hover:bg-white/50 flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
            >
              <span className="text-sm leading-none">×</span>
            </button>
          </div>
        )}
      </div>

{/* 添加习惯弹窗 */}
      {showAddHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddHabit(false)} />
          <div className="relative w-full max-w-xs rounded-md shadow-sm border border-stone-200 bg-white dark:border-border dark:bg-surface-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-[18px] font-medium tracking-wide text-foreground">添加习惯</h3>
              <button
                onClick={() => setShowAddHabit(false)}
                className="w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center text-muted-foreground"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            {/* 分类选择 */}
            <div className="mb-3">
              <span className="text-[11px] text-muted-foreground mb-1.5 block">选择分类</span>
              <div className="flex gap-1">
                {categories.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setNewHabitCategory(cat.key)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                      newHabitCategory === cat.key
                        ? 'bg-stone-100 border border-stone-200 text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <cat.Icon size={13} strokeWidth={1.5} className={newHabitCategory === cat.key ? cat.color : ''} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 习惯名称 */}
            <div className="mb-3">
              <span className="text-[11px] text-muted-foreground mb-1.5 block">习惯名称</span>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="如：英语听力"
                className="w-full rounded-md bg-stone-50 border border-stone-200 px-3 py-2 text-[13px] text-foreground outline-none focus:border-sakura/40"
                maxLength={20}
                autoFocus
              />
            </div>

            {/* 图标选择 */}
            <div className="mb-3">
              <span className="text-[11px] text-muted-foreground mb-1.5 block">选择图标</span>
              <div className="grid grid-cols-6 gap-1.5">
                {iconMap[newHabitCategory].map(ic => (
                  <button
                    key={ic.name}
                    onClick={() => setNewHabitIcon(ic.name)}
                    className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                      newHabitIcon === ic.name
                        ? 'bg-stone-200 text-foreground'
                        : 'text-muted-foreground hover:bg-stone-100'
                    }`}
                    title={ic.label}
                  >
                    <ic.Component size={15} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
            </div>

            {/* 目标时长 */}
            <div className="mb-5">
              <span className="text-[11px] text-muted-foreground mb-1.5 block">每日目标时长（分钟）</span>
              <div className="flex items-center gap-2">
                {[10, 20, 30, 45].map(d => (
                  <button
                    key={d}
                    onClick={() => { setNewHabitDuration(d); setIsCustomDuration(false) }}
                    className={`flex-1 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                      !isCustomDuration && newHabitDuration === d
                        ? 'bg-sakura-soft border border-sakura/30 text-sakura'
                        : 'bg-stone-50 border border-stone-200 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={() => { setIsCustomDuration(true); setCustomDurationInput(String(newHabitDuration)) }}
                  className={`flex-1 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                    isCustomDuration
                      ? 'bg-sakura-soft border border-sakura/30 text-sakura'
                      : 'bg-stone-50 border border-stone-200 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  自定义
                </button>
              </div>
              {isCustomDuration && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={customDurationInput}
                    onChange={(e) => {
                      const v = e.target.value
                      setCustomDurationInput(v)
                      const num = parseInt(v, 10)
                      if (num >= 1 && num <= 600) setNewHabitDuration(num)
                    }}
                    placeholder="输入分钟数"
                    className="flex-1 rounded-md bg-stone-50 border border-stone-200 px-3 py-1.5 text-[13px] text-foreground outline-none focus:border-sakura/40"
                    autoFocus
                  />
                  <span className="text-[12px] text-muted-foreground">分钟</span>
                </div>
              )}
            </div>

            {/* 确认按钮 */}
            <button
              onClick={addHabit}
              disabled={!newHabitName.trim()}
              className="w-full py-2.5 rounded-md bg-sakura-soft border border-sakura/30 text-sakura font-medium text-[13px] transition-colors hover:bg-sakura-soft/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              创建习惯
            </button>
          </div>
        </div>
      )}

      {/* 编辑习惯弹窗 */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditingHabit(null)} />
          <EditHabitModal
            habit={editingHabit}
            onSave={updateHabit}
            onCancel={() => setEditingHabit(null)}
          />
        </div>
      )}

      {/* 归档提示弹窗 */}
      <AnimatePresence>
        {showArchiveAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/25"
            onClick={() => setShowArchiveAlert(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[280px] border border-stone-200/80 bg-background/95 p-5 shadow-lg paper-texture"
              style={{ borderRadius: '14px 18px 14px 18px' }}
            >
              <p className="mb-3 text-center font-serif text-[15px] font-semibold text-foreground">提示</p>
              <p className="mb-5 text-center text-[13px] leading-relaxed text-muted-foreground">还没有设定目标，无法标记完成。</p>
              <button
                onClick={() => setShowArchiveAlert(false)}
                className="w-full rounded-md bg-sakura py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ borderRadius: '9px 11px 9px 11px' }}
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 归档确认弹窗 */}
      <AnimatePresence>
        {showArchiveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/25"
            onClick={() => setShowArchiveConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[280px] border border-stone-200/80 bg-background/95 p-5 shadow-lg paper-texture"
              style={{ borderRadius: '14px 18px 14px 18px' }}
            >
              <p className="mb-1 text-center font-serif text-[15px] font-semibold text-foreground">确认保存</p>
              <p className="mb-5 text-center text-[13px] leading-relaxed text-muted-foreground">把它收进历史目标里，留作温暖的纪念吧。</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="flex-1 border border-stone-200/80 bg-transparent py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  style={{ borderRadius: '9px 11px 9px 11px' }}
                >
                  取消
                </button>
                <button
                  onClick={() => { doArchiveDream(); setShowArchiveConfirm(false) }}
                  className="flex-1 bg-sakura py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ borderRadius: '9px 11px 9px 11px' }}
                >
                  确定
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除习惯确认弹窗 */}
      <AnimatePresence>
        {showDeleteHabitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/25"
            onClick={() => setShowDeleteHabitConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[280px] border border-stone-200/80 bg-background/95 p-5 shadow-lg paper-texture"
              style={{ borderRadius: '14px 18px 14px 18px' }}
            >
              <p className="mb-1 text-center font-serif text-[15px] font-semibold text-foreground">确认删除</p>
              <p className="mb-5 text-center text-[13px] leading-relaxed text-muted-foreground">确定要删除这个习惯吗？</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteHabitConfirm(false)}
                  className="flex-1 border border-stone-200/80 bg-transparent py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  style={{ borderRadius: '9px 11px 9px 11px' }}
                >
                  取消
                </button>
                <button
                  onClick={confirmDeleteHabit}
                  className="flex-1 bg-red-400 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ borderRadius: '9px 11px 9px 11px' }}
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

/** 计算某月包含的所有周的周一日期（YYYY-MM-DD），可能跨到上/下月 */
function weeksOfMonth(year: number, month: number): string[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)) // 回退到本周一
  const end = new Date(last)
  end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7))) // 推进到本周日
  const weeks: string[] = []
  const cur = new Date(start)
  while (cur <= end) {
    weeks.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`)
    cur.setDate(cur.getDate() + 7)
  }
  return weeks
}

/** 可选月份列表：当前年份只显示从当前月开始的月份，其他年份显示全部 12 个月 */
function monthOptions(year: number): { year: number; month: number; label: string }[] {
  const now = new Date()
  const isCurrentYear = year === now.getFullYear()
  const startMonth = isCurrentYear ? now.getMonth() : 0
  const opts: { year: number; month: number; label: string }[] = []
  for (let m = startMonth; m < 12; m++) {
    opts.push({ year, month: m, label: `${year}年${m + 1}月` })
  }
  return opts
}

/** 可选年份列表：从 2026 年开始，到当前年份（到2027年后自动显示2026、2027） */
function yearOptions(): number[] {
  const now = new Date()
  const startYear = 2026
  const years: number[] = []
  for (let y = startYear; y <= now.getFullYear(); y++) {
    years.push(y)
  }
  return years
}

function WeeklyPlanPage({ onBack }: { onBack: () => void }) {
  const [plans, setPlans] = useState<WeeklyPlan[]>(GoalData.loadPlans())
  const [newTitle, setNewTitle] = useState('')
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const now = new Date()
  const [view, setView] = useState<{ year: number; month: number }>({ year: now.getFullYear(), month: now.getMonth() })
  const [basketOpen, setBasketOpen] = useState(false)
  const [addPanelOpen, setAddPanelOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const persist = (next: WeeklyPlan[]) => {
    setPlans(next)
    GoalData.savePlans(next)
  }

  const todayMonday = GoalData.mondayOf(now)

  const weeks = useMemo(() => weeksOfMonth(view.year, view.month), [view])
  const weekOptions = useMemo(() => monthOptions(selectedYear), [selectedYear])
  const years = useMemo(() => yearOptions(), [])

  // 按 weekStart 分组
  const grouped = useMemo(() => {
    const map: Record<string, WeeklyPlan[]> = {}
    weeks.forEach(w => { map[w] = [] })
    const orphan: WeeklyPlan[] = []
    plans.forEach(p => {
      const ws = p.weekStart || GoalData.mondayOf(p.createdAt)
      if (map[ws]) map[ws].push(p)
      else orphan.push(p)
    })
    return { map, orphan }
  }, [plans, weeks])

  const addPlan = () => {
    const t = newTitle.trim()
    if (!t) return
    const weekStart = selectedWeek || todayMonday
    const updated = GoalData.addPlan(t, 'sakura', weekStart)
    setPlans(updated)
    setNewTitle('')
    setAddPanelOpen(false)
    // 确保新增的周在视图内
    const d = new Date(weekStart + 'T00:00:00')
    if (d.getFullYear() !== view.year || d.getMonth() !== view.month) {
      setView({ year: d.getFullYear(), month: d.getMonth() })
    }
  }

  const toggle = (id: string) => {
    const updated = plans.map(p => p.id === id ? { ...p, completed: !p.completed } : p)
    const target = updated.find(p => p.id === id)
    persist(updated)
    // 周计划直接勾选完成时记录成长事件
    if (target?.completed) {
      saveGrowthEvent(getTodayDate(), 'weekly_plan')
    }
  }

  const remove = (id: string) => {
    persist(plans.filter(p => p.id !== id))
  }

  const moveToWeek = (id: string, toWeek: string | undefined) => {
    persist(plans.map(p => p.id === id ? { ...p, weekStart: toWeek } : p))
  }

  const viewLabel = `${view.year}年${view.month + 1}月`

  const PlanItemRow = ({ plan }: { plan: WeeklyPlan }) => (
    <div
      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
        plan.completed ? 'bg-sakura-soft/20' : 'hover:bg-[#FBF4E9]'
      }`}
    >
      <button
        onClick={() => toggle(plan.id)}
        className={`w-[18px] h-[18px] rounded border-2 shrink-0 flex items-center justify-center transition-all ${
          plan.completed ? 'bg-sakura border-sakura text-white' : 'border-stone-300 hover:border-sakura hover:bg-sakura-soft/50'
        }`}
        aria-label={plan.completed ? '取消完成' : '标记完成'}
      >
        {plan.completed && <Check size={11} strokeWidth={3} />}
      </button>
      <span className={`flex-1 text-[13px] leading-snug ${plan.completed ? 'text-muted-foreground/50 line-through' : 'text-foreground'}`}>
        {plan.title}
      </span>
      <button
        onClick={() => remove(plan.id)}
        className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-muted-foreground/30 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="删除"
      >
        <Trash2 size={12} strokeWidth={1.5} />
      </button>
    </div>
  )

  const weekRangeLabel = (ws: string) => {
    const d = new Date(ws + 'T00:00:00')
    const sun = new Date(d)
    sun.setDate(d.getDate() + 6)
    return `${d.getMonth() + 1}月${d.getDate()}日 - ${sun.getMonth() + 1}月${sun.getDate()}日`
  }

  return (
    <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto bg-background">
      <header className="sticky top-0 z-20 flex h-11 items-center justify-between border-b border-sakura/20 bg-background/95 px-3 backdrop-blur">
        <button
          onClick={onBack}
          aria-label="返回首页"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-[#F2E4D2]"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="font-serif text-[17px] font-medium text-foreground">本周计划</h1>
        <button
          onClick={() => {
            setView({ year: now.getFullYear(), month: now.getMonth() })
            setAddPanelOpen(true)
          }}
          aria-label="新增计划"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-sakura text-white shadow-sm transition-colors hover:bg-sakura/90"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </header>

      <div className="mx-auto w-full max-w-[480px] px-4 pb-28 pt-4">

        {/* 折叠篮：月份选择器 */}
        <div className="relative mb-6">
          <button
            onClick={() => setBasketOpen(o => !o)}
            className="w-full flex items-center justify-between rounded-xl border border-sakura/30 bg-white px-4 py-3 shadow-sm transition-colors hover:border-sakura/50"
            aria-expanded={basketOpen}
          >
            <span className="font-serif text-[15px] font-medium text-foreground">{viewLabel}</span>
            <ChevronDown
              size={18}
              strokeWidth={2}
              className={`text-muted-foreground transition-transform duration-200 ${basketOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {basketOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBasketOpen(false)} aria-hidden="true" />
              <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-sakura/30 bg-white p-3 shadow-lg animate-[fadeIn_0.15s_ease-out]">
                {/* 年份选择栏 */}
                <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {years.map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`shrink-0 rounded-md px-3 py-1 text-[12px] transition-colors ${
                        selectedYear === year
                          ? 'bg-sakura-soft text-sakura font-medium'
                          : 'text-muted-foreground hover:bg-[#FBF4E9]'
                      }`}
                    >
                      {year}年
                    </button>
                  ))}
                </div>
                {/* 月份网格 */}
                <div className="grid grid-cols-3 gap-2">
                  {weekOptions.map(opt => {
                    const active = opt.year === view.year && opt.month === view.month
                    return (
                      <button
                        key={`${opt.year}-${opt.month}`}
                        onClick={() => { setView({ year: opt.year, month: opt.month }); setBasketOpen(false) }}
                        className={`rounded-lg px-2 py-2 text-[12px] transition-colors ${
                          active
                            ? 'bg-sakura-soft text-sakura font-medium'
                            : 'text-muted-foreground hover:bg-[#FBF4E9]'
                        }`}
                      >
                        {opt.label.replace(`${opt.year}年`, '')}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-center text-[10px] text-muted-foreground/50">全年可回溯 · 点击切换月份</p>
              </div>
            </>
          )}
        </div>

        {/* 新增计划面板 */}
        {addPanelOpen && (
          <div className="mb-6 rounded-xl border border-dashed border-sakura/40 bg-[#F9F7F2] px-4 py-3.5 animate-[fadeIn_0.15s_ease-out]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[12px] font-medium text-foreground">新增计划</span>
              <button
                onClick={() => setAddPanelOpen(false)}
                className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground/40 hover:bg-stone-200/50 transition-colors"
                aria-label="关闭"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addPlan() }}
                placeholder="这一周想做什么…"
                maxLength={50}
                className="min-w-0 flex-1 rounded-lg bg-white border border-stone-200 px-3 py-2 text-[13px] text-foreground outline-none focus:border-sakura/50 placeholder:text-muted-foreground/50"
              />
              <button
                onClick={addPlan}
                disabled={!newTitle.trim()}
                className="shrink-0 px-4 py-2 rounded-lg bg-sakura text-white text-[13px] font-medium hover:bg-sakura/90 disabled:opacity-35 transition-colors"
              >
                添加
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="shrink-0 text-[11px] text-muted-foreground/60">分配到</span>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-2 py-2 text-[12px] text-muted-foreground outline-none focus:border-sakura/50 cursor-pointer"
              >
                <option value="">本周</option>
                {weeks.map(ws => (
                  <option key={ws} value={ws}>{weekRangeLabel(ws)}</option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-2">
              可分配到本月某周 · 最多 50 字
            </p>
          </div>
        )}

        {/* 路径图：本月各周 */}
        <div className="relative pl-9">
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-sakura/20" aria-hidden="true" />

          {weeks.map(ws => {
            const weekPlans = grouped.map[ws] ?? []
            const allDone = weekPlans.length > 0 && weekPlans.every(p => p.completed)
            const isCurrent = ws === todayMonday

            if (weekPlans.length === 0) return null

            return (
              <div key={ws} className="relative mb-5 last:mb-0">
                <div
                  className={`absolute left-[-25px] top-[9px] w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                    isCurrent
                      ? 'border-sakura bg-sakura-soft'
                      : allDone
                        ? 'border-sakura bg-sakura-soft'
                        : weekPlans.length > 0
                          ? 'border-sakura/60 bg-white'
                          : 'border-stone-200 bg-white'
                  }`}
                  aria-hidden="true"
                >
                  {weekPlans.length > 0 ? (
                    <span className={`text-[10px] font-medium ${allDone ? 'text-sakura' : isCurrent ? 'text-sakura' : 'text-muted-foreground'}`}>
                      {weekPlans.length}
                    </span>
                  ) : (
                    <span className="w-[3px] h-[3px] rounded-full bg-stone-300" />
                  )}
                </div>

                <div
                  className={`rounded-xl border-2 bg-white p-4 shadow-sm transition-all ${
                    isCurrent ? 'border-sakura/40' : 'border-sakura/25'
                  }`}
                  style={{ borderRadius: '12px 14px 12px 14px' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-serif text-[14px] font-medium text-foreground">
                      {weekRangeLabel(ws)}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-sakura-soft text-sakura font-medium">
                        本周
                      </span>
                    )}
                  </div>

                  {weekPlans.length > 0 && (
                    <div className="space-y-0.5 -mx-1">
                      {weekPlans.map(plan => (
                        <PlanItemRow key={plan.id} plan={plan} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 未归属区域（旧数据 / 跨月数据） */}
        {grouped.orphan.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
              <span className="text-[12px] font-medium text-muted-foreground/70">其他月份的计划</span>
              <span className="text-[11px] text-muted-foreground/40">（可归类到上方某周）</span>
            </div>
            <div className="rounded-xl border border-dashed border-stone-250 bg-white/60 px-4 py-3">
              <div className="space-y-0.5">
                {grouped.orphan.map(plan => (
                  <div key={plan.id} className="group flex items-center gap-3">
                    <div className="flex-1">
                      <PlanItemRow plan={plan} />
                    </div>
                    <select
                      value={plan.weekStart ?? ''}
                      onChange={e => moveToWeek(plan.id, e.target.value || undefined)}
                      className="text-[11px] border border-stone-200 rounded px-1.5 py-1 bg-white text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <option value="">归类到…</option>
                      {weeks.map(ws => (
                        <option key={ws} value={ws}>{weekRangeLabel(ws)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function EditHabitModal({ habit, onSave, onCancel }: { habit: Habit; onSave: (h: Habit) => void; onCancel: () => void }) {
  const [name, setName] = useState(habit.name)
  const [icon, setIcon] = useState(habit.icon)
  const [duration, setDuration] = useState(habit.goalDuration)
  const [category, setCategory] = useState<HabitCategory>(habit.category)
  const presetDurations = [10, 20, 30, 45]
  const [isCustomDuration, setIsCustomDuration] = useState(!presetDurations.includes(habit.goalDuration))
  const [customDurationInput, setCustomDurationInput] = useState(String(habit.goalDuration))

  const categories = [
    { key: 'study' as const, label: '学习', Icon: BookOpen, color: 'text-blue-400' },
    { key: 'self' as const, label: '自律', Icon: Leaf, color: 'text-green-500' },
    { key: 'life' as const, label: '生活', Icon: Home, color: 'text-orange-400' },
  ]

  useEffect(() => {
    const currentIcons = iconMap[category]
    if (!currentIcons.find(i => i.name === icon)) {
      setIcon(currentIcons[0].name)
    }
  }, [category])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      ...habit,
      name: name.trim(),
      icon,
      category,
      goalDuration: duration,
    })
  }

  return (
    <div className="relative w-full max-w-xs rounded-md shadow-lg border border-stone-200 bg-white dark:bg-surface-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-[16px] font-semibold text-foreground">编辑习惯</h3>
        <button onClick={onCancel} className="w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center text-muted-foreground">
          <span className="text-lg leading-none">×</span>
        </button>
      </div>

      <div className="mb-3">
        <span className="text-[11px] text-muted-foreground mb-1.5 block">习惯名称</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md bg-stone-50 border border-stone-200 px-3 py-2 text-[13px] text-foreground outline-none focus:border-sakura/40"
          maxLength={20}
          autoFocus
        />
      </div>

      <div className="mb-3">
        <span className="text-[11px] text-muted-foreground mb-1.5 block">选择分类</span>
        <div className="flex gap-1">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                category === cat.key
                  ? 'bg-stone-100 border border-stone-200 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <cat.Icon size={13} strokeWidth={1.5} className={category === cat.key ? cat.color : ''} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <span className="text-[11px] text-muted-foreground mb-1.5 block">选择图标</span>
        <div className="grid grid-cols-6 gap-1.5">
          {iconMap[category].map(ic => (
            <button
              key={ic.name}
              onClick={() => setIcon(ic.name)}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                icon === ic.name ? 'bg-stone-200 text-foreground' : 'text-muted-foreground hover:bg-stone-100'
              }`}
            >
              <ic.Component size={15} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <span className="text-[11px] text-muted-foreground mb-1.5 block">每日目标时长（分钟）</span>
        <div className="flex items-center gap-2">
          {presetDurations.map(d => (
            <button
              key={d}
              onClick={() => { setDuration(d); setIsCustomDuration(false) }}
              className={`flex-1 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                !isCustomDuration && duration === d ? 'bg-sakura-soft border border-sakura/30 text-sakura' : 'bg-stone-50 border border-stone-200 text-muted-foreground hover:text-foreground'
              }`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => { setIsCustomDuration(true); setCustomDurationInput(String(duration)) }}
            className={`flex-1 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              isCustomDuration ? 'bg-sakura-soft border border-sakura/30 text-sakura' : 'bg-stone-50 border border-stone-200 text-muted-foreground hover:text-foreground'
            }`}
          >
            自定义
          </button>
        </div>
        {isCustomDuration && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={600}
              value={customDurationInput}
              onChange={(e) => {
                const v = e.target.value
                setCustomDurationInput(v)
                const num = parseInt(v, 10)
                if (num >= 1 && num <= 600) setDuration(num)
              }}
              placeholder="输入分钟数"
              className="flex-1 rounded-md bg-stone-50 border border-stone-200 px-3 py-1.5 text-[13px] text-foreground outline-none focus:border-sakura/40"
              autoFocus
            />
            <span className="text-[12px] text-muted-foreground">分钟</span>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={!name.trim()}
        className="w-full py-2.5 rounded-md bg-sakura-soft border border-sakura/30 text-sakura font-medium text-[13px] transition-colors hover:bg-sakura-soft/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        保存修改
      </button>
    </div>
  )
}

// AboutPage 函数 - 关于暖枫页面
// 2026-08-11 新增，从设置页"关于暖枫"按钮进入，展示应用/作者/声明/图片来源/隐私说明
function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative flex h-full flex-col bg-card">
      {/* 顶部导航：返回 + 标题 */}
      <div className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b border-border/50 bg-card/95 px-3 py-3 backdrop-blur">
        <button
          onClick={onBack}
          aria-label="返回"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground transition-transform active:scale-95"
        >
          <span className="text-[18px] leading-none">←</span>
        </button>
        <span className="font-serif text-[17px] font-semibold text-foreground">关于暖枫</span>
      </div>

      {/* 内容区 - 卡片列表风格 */}
      <div className="app-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-20">
        {/* 顶部标识 */}
        <div className="rounded-2xl bg-background px-4 py-6 text-center">
          <p className="font-serif text-[20px] font-semibold text-foreground">暖枫</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Warm Feng · v{APP_VERSION}</p>
        </div>

        {/* 应用声明 */}
        <div className="rounded-2xl bg-background px-4 py-4">
          <p className="mb-2 font-medium">应用声明</p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            所有数据均存储在你的设备本地，不会上传到任何服务器。
          </p>
        </div>

        {/* 图片来源声明 */}
        <div className="rounded-2xl bg-background px-4 py-4">
          <p className="mb-2 font-medium">图片来源声明</p>
          <ul className="space-y-1 text-[13px] leading-relaxed text-muted-foreground">
            <li>· 首页背景图由 AI 生成</li>
            <li>· 饮食页食谱图片由 AI 生成</li>
            <li>· APP 图标由 AI 生成</li>
          </ul>
        </div>

        {/* 隐私说明 */}
        <div className="rounded-2xl bg-background px-4 py-4">
          <p className="mb-2 font-medium">隐私说明</p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            暖枫不收集、不共享、不出售你的任何个人内容。应用内不包含任何第三方分析或广告 SDK，所有记录（日记、计划、专注、饮食等）仅保存在你的设备本地。卸载应用即等于数据清空，请及时使用「数据备份」导出重要内容。
          </p>
        </div>

        {/* 免责声明 */}
        <div className="rounded-2xl bg-background px-4 py-4">
          <p className="mb-2 font-medium">免责声明</p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            本应用提供的所有内容（包括但不限于文字、图片、建议）仅供参考，不构成任何专业意见。使用者应自行判断并承担使用风险。开发者不对因使用本应用而产生的任何直接或间接损失负责。
          </p>
        </div>

        {/* 版权声明 */}
        <div className="rounded-2xl bg-background px-4 py-4 text-center">
          <p className="text-[12px] leading-relaxed text-muted-foreground/70">
            © 2026 暖枫 Warm Feng. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

// SettingsPage 函数 - 独立的设置页面
// 2026-08-08 从 MePage 中分离出来，作为独立导航页面，解决嵌套滚动问题
function SettingsPage({ onBack, isDark, onToggleDark, onChangeMeBg, meBgImage, onOpenReminders, reminderCount }: { onBack: () => void; isDark: boolean; onToggleDark: () => void; onChangeMeBg: (dataUrl: string | null) => void; meBgImage: string | null; onOpenReminders: () => void; reminderCount: number }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [importChoice, setImportChoice] = useState<Record<string, string> | null>(null)
  const [importToast, setImportToast] = useState<string | null>(null)
  const backupFileRef = useRef<HTMLInputElement>(null)
  const meBgInputRef = useRef<HTMLInputElement>(null)

  // 壁纸裁剪状态（与头像裁剪同机制：选图 → 拖动/缩放裁剪 → 确认后保存）
  const [bgCropMode, setBgCropMode] = useState(false)
  const [bgCropSrc, setBgCropSrc] = useState<string | null>(null)
  const [bgCrop, setBgCrop] = useState({ x: 0, y: 0 })
  const [bgZoom, setBgZoom] = useState(1)
  const [bgCroppedPixels, setBgCroppedPixels] = useState<Area | null>(null)

  const handleBgCropConfirm = async () => {
    if (!bgCropSrc || !bgCroppedPixels) return
    const result = await cropAreaToDataURL(bgCropSrc, bgCroppedPixels)
    onChangeMeBg(result)
    setBgCropMode(false)
    setBgCropSrc(null)
    setBgZoom(1)
    setBgCrop({ x: 0, y: 0 })
  }

  const handleBgCropCancel = () => {
    setBgCropMode(false)
    setBgCropSrc(null)
    setBgZoom(1)
    setBgCrop({ x: 0, y: 0 })
  }

  // 温柔提醒在原生端走 Preferences（@capacitor/preferences），备份需用统一存储层读写
  const REMINDERS_KEY = 'warmFengReminders'
  // 暖枫所有需要备份的 localStorage key（导出/导入按此清单打包）
  // 按模块分组，新增功能如使用 localStorage 请同步在此登记
  // 注意：REMINDERS_KEY 也在清单内，但导出/导入会单独走 storageGet/storageSet
  const BACKUP_KEYS = [
    // 首页 / 横幅 / 语录
    'homeBgPeriodConfig_v1', 'heroBannerConfig_v2', 'heroBannerCustomQuote', 'heroBannerCustomLabel',
    'dailyQuoteTextColor', 'dailyQuoteTextVisible', 'homeGreetingVisible', 'dailyQuotes', 'dailyQuoteConfig', 'dailyQuoteHistory',
    // 计划 / 任务 / 复盘
    'warmFengPlan', 'warmFengPlanFixed', 'todayTasks', 'dailyReview', 'dailyTomorrow', 'dailySummary', 'warmFengDailyPlans',
    // 目标 / 梦想 / 习惯
    'myDream', 'weeklyPlans', 'dailyMessage', 'habits', 'nuanYu_checkInLog', 'nuanYu_completedDreams', 'warmFengDream',
    // 专注
    'focusBg', 'currentFocus', 'focusRecords',
    // 成长 / 登录 / 标识
    'growthEvents', 'warmFengLoginDays', 'warmFengUID', 'warmFengFirstOpen', 'warmFengVisitedPages',
    // 日记 / 灵感 / 心绪
    'warmFengDiaries', 'warmFengInspirations', 'mindTraceRecords',
    // 倒计时
    'warmFengCountdowns', 'warmFengCountdowns_backup',
    // 运动
    'warmFengSportsRecords', 'warmFengTrainingPlans', 'warmFengCurrentRun', 'warmFengWeeklyGoal',
    // 饮食 / 营养
    'warmfeng-meal-log', 'warmfeng-food-library', 'warmisle.nutrition.profile', 'warmFengMyRecipes',
    // 睡眠
    'warmFengSleepRecords',
    // 温柔提醒
    'warmFengReminders',
    // 呼吸训练
    'warmFengBreathingHistory',
    // 备忘录
    'warmFengMemo', 'warmFengMemoCategories',
    // 文章收藏
    'warmFengArticleFavorites',
    // 首页心情 / 笔记
    'homeMood', 'homeNote',
    // 我的页 / 主题
    'warmFengMeBg', 'warmFengMeTextColor', 'warmFengMeAvatar', 'warmFengMeName',
    'warmFengMeSign', 'warmFengMeGender', 'warmFengDarkMode',
  ]

  const handleExportData = async () => {
    const data: Record<string, string | null> = {}
    BACKUP_KEYS.forEach(k => { data[k] = localStorage.getItem(k) })
    // 温柔提醒在原生端走 Preferences，localStorage 读不到，改用统一存储层
    data[REMINDERS_KEY] = await storageGet(REMINDERS_KEY)
    // 精确到分钟，避免同一天多次导出文件名冲突
    const exportedAt = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
    const payload = {
      app: '暖枫',
      version: 1,
      exportedAt,
      data,
    }
    const json = JSON.stringify(payload, null, 2)
    const fileName = `暖枫数据备份-${exportedAt}.json`
  
    if (Capacitor.isNativePlatform()) {
      // Android 原生平台：使用系统分享面板，让用户选择保存位置
      // 用户可以选择：文件管理器、微信、QQ、网盘等任意应用
      try {
        // 先写入应用专属 Documents 目录（无需存储权限）
        const uri = await Filesystem.writeFile({
          path: fileName,
          data: json,
          encoding: Encoding.UTF8,
          directory: Directory.Documents,
          recursive: true,
        })
        // 弹出系统分享面板，用户自己选择保存到哪里
        await Share.share({
          title: '暖枫数据备份',
          text: `暖枫数据备份（${exportedAt}）\n\n请选择保存位置：\n• 文件管理器 → 保存到手机任意文件夹\n• 微信/QQ → 发送到聊天或收藏\n• 网盘 → 上传到云端`,
          url: uri.uri,
          dialogTitle: '选择保存位置',
        })
        setImportToast('备份已生成，请在分享面板中选择保存位置')
      } catch {
        setImportToast('导出失败，请重试')
      }
    } else {
      // Web 端：直接下载
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setImportToast('已导出备份文件，请到下载目录查收')
    }
    setTimeout(() => setImportToast(null), 3500)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!parsed || typeof parsed !== 'object'
            || parsed.app !== '暖枫'
            || typeof parsed.data !== 'object' || parsed.data === null) {
          setImportToast('文件无效：不是暖枫备份文件')
          return
        }
        setImportChoice(parsed.data as Record<string, string>)
      } catch {
        setImportToast('文件解析失败，请确认是有效的备份文件')
      }
    }
    reader.onerror = () => setImportToast('文件读取失败')
    reader.readAsText(file)
  }

  const applyImport = async (incoming: Record<string, string>, mode: 'overwrite' | 'merge') => {
    if (mode === 'overwrite') {
      BACKUP_KEYS.forEach(k => {
        if (k === REMINDERS_KEY) return // 温柔提醒走统一存储层，单独处理
        if (k in incoming && incoming[k] != null) localStorage.setItem(k, incoming[k])
        else if (k in incoming) localStorage.removeItem(k) // 备份中显式为 null → 视为空
        else localStorage.removeItem(k) // 备份中不存在该 key → 清空
      })
      // 温柔提醒在原生端走 Preferences，用统一存储层写入
      if (REMINDERS_KEY in incoming && incoming[REMINDERS_KEY] != null) {
        await storageSet(REMINDERS_KEY, incoming[REMINDERS_KEY])
      } else {
        await storageRemove(REMINDERS_KEY)
      }
    } else {
      BACKUP_KEYS.forEach(k => {
        if (k === REMINDERS_KEY) return
        // 仅当备份中非空且当前本地为空时才写入，避免 null 写入与覆盖已有数据
        if (k in incoming && incoming[k] != null && localStorage.getItem(k) == null) {
          localStorage.setItem(k, incoming[k])
        }
      })
      // 温柔提醒 merge：仅当备份非空且当前为空时写入
      if (REMINDERS_KEY in incoming && incoming[REMINDERS_KEY] != null) {
        const current = await storageGet(REMINDERS_KEY)
        if (current == null) await storageSet(REMINDERS_KEY, incoming[REMINDERS_KEY])
      }
    }
    setImportChoice(null)
    setImportToast('已恢复数据，正在重新加载…')
    setTimeout(() => location.reload(), 700)
  }

  const doResetData = () => {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k) keys.push(k)
      }
      keys.forEach(k => { try { localStorage.removeItem(k) } catch { /* 忽略 */ } })
      // 主动写入空数组，避免 CountdownPage/PlanPage 在 localStorage 为空时回退到 mock 示例数据
      try { localStorage.setItem('warmFengCountdowns', '[]') } catch { /* 忽略 */ }
      try { localStorage.setItem('warmFengCountdowns_backup', '[]') } catch { /* 忽略 */ }
      try { localStorage.setItem('warmFengPlan', '[]') } catch { /* 忽略 */ }
    } catch { /* 忽略 */ }
    setShowResetConfirm(false)
    window.location.reload()
  }

  const handleMeBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // 先裁剪再保存：让用户选择壁纸想保留的区域（旧版直接原图写入，无法裁剪）
        setBgCropSrc(reader.result)
        setBgCropMode(true)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // 关于暖枫页面 - 从设置页进入，覆盖在设置页之上
  if (showAbout) {
    return <AboutPage onBack={() => setShowAbout(false)} />
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-card">
      {/* 顶部导航：返回 + 标题 */}
      <div className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b border-border/50 bg-card/95 px-3 py-3 backdrop-blur">
        <button
          onClick={onBack}
          aria-label="返回"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground transition-transform active:scale-95"
        >
          <span className="text-[18px] leading-none">←</span>
        </button>
        <span className="font-serif text-[17px] font-semibold text-foreground">设置</span>
      </div>

      {/* 设置项列表 - 独立滚动容器 */}
      <div className="app-scrollbar flex-1 space-y-2 overflow-y-auto px-4 py-4 pb-20">
        {/* 背景：更换"我的"页壁纸 */}
        <button
          onClick={() => meBgInputRef.current?.click()}
          className="w-full flex items-center justify-between rounded-2xl bg-background px-4 py-3 text-left text-sm transition-transform active:scale-[.98]"
        >
          <span className="font-medium">背景</span>
          <span className="text-[12px] text-muted-foreground">更换壁纸</span>
        </button>
        <input
          ref={meBgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleMeBgFile}
        />

        {/* 壁纸裁剪层（Portal 到 body 全屏覆盖，矩形自由裁剪） */}
        {bgCropMode && bgCropSrc && createPortal(
          <div className="fixed inset-0 z-[70] flex flex-col bg-black/95">
            {/* 顶部提示（避让状态栏） */}
            <div className="flex shrink-0 items-center justify-between px-4 py-3 pt-[calc(0.75rem+var(--wi-sb,0px))]">
              <span className="text-[14px] font-medium text-white/80">拖动、双指缩放调整壁纸显示区域</span>
            </div>
            {/* 裁剪区域 */}
            <div className="relative flex-1">
              <Cropper
                image={bgCropSrc}
                crop={bgCrop}
                zoom={bgZoom}
                cropShape="rect"
                showGrid={true}
                onCropChange={setBgCrop}
                onZoomChange={setBgZoom}
                onCropComplete={(_, px) => setBgCroppedPixels(px)}
              />
            </div>
            {/* 底部操作栏（避让底部安全区） */}
            <div className="flex shrink-0 items-center justify-between px-6 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <button
                onClick={handleBgCropCancel}
                className="rounded-full px-6 py-2.5 text-[15px] font-medium text-white/70 transition-colors active:text-white"
              >
                取消
              </button>
              <button
                onClick={handleBgCropConfirm}
                className="rounded-full bg-sakura px-8 py-2.5 text-[15px] font-semibold text-white transition-transform active:scale-95"
              >
                确定
              </button>
            </div>
          </div>,
          document.body,
        )}

        {/* 主题切换（暂时隐藏，后续可作为 VIP 功能上线） */}
        {/* <button
          onClick={onToggleDark}
          className="w-full flex items-center justify-between rounded-2xl bg-background px-4 py-3 text-left text-sm transition-transform active:scale-[.98]"
        >
          <span className="font-medium">主题</span>
          <span className="flex items-center gap-3">
            <span className="text-[12px] text-muted-foreground">{isDark ? '深色' : '浅色'}</span>
            <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isDark ? 'bg-sakura' : 'bg-muted-foreground/30'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform bg-surface-1 ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </span>
          </span>
        </button> */}

        <button
          onClick={onOpenReminders}
          className="w-full flex items-center justify-between rounded-2xl bg-background px-4 py-3 text-left text-sm transition-transform active:scale-[.98]"
        >
          <span className="font-medium">提醒</span>
          <span className="text-[12px] text-muted-foreground">
            {reminderCount > 0 ? `${reminderCount} 个提醒` : '点击设置'}
          </span>
        </button>

        <button
          onClick={() => setShowAbout(true)}
          className="w-full flex items-center justify-between rounded-2xl bg-background px-4 py-3 text-left text-sm transition-transform active:scale-[.98]"
        >
          <span className="font-medium">关于暖枫</span>
          <span className="text-[12px] text-muted-foreground">了解更多</span>
        </button>

        {/* 数据备份：导出 / 导入 */}
        <div className="rounded-2xl bg-background px-4 py-3">
          <p className="mb-2 font-medium">数据备份</p>
          <div className="flex gap-2">
            <button
              onClick={handleExportData}
              className="flex-1 rounded-full bg-sakura px-3 py-2 text-[13px] font-medium text-white transition-transform active:scale-[.98]"
            >
              导出备份
            </button>
            <button
              onClick={() => backupFileRef.current?.click()}
              className="flex-1 rounded-full border border-border/50 bg-background px-3 py-2 text-[13px] font-medium text-foreground transition-transform active:scale-[.98]"
            >
              导入备份
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
            导出会保存全部本地数据为一个文件，换手机或清缓存前请先备份；导入时可选择覆盖或合并。
          </p>
          {/* 数据风险警告 */}
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
            <p className="text-[12px] font-medium text-amber-800">⚠️ 注意：清除应用缓存会丢失数据</p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
              在手机设置中“清除应用缓存”会删除所有日记、计划、睡眠、食谱、专注、倒数日等记录。
              操作前请务必先点击「导出备份」保存数据。
            </p>
          </div>
        </div>
        <input
          ref={backupFileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportFile}
        />

        {/* 重置数据 */}
        <button onClick={() => setShowResetConfirm(true)} className="w-full flex items-center justify-between rounded-2xl bg-background px-4 py-3 text-left text-sm transition-transform active:scale-[.98]">
          <span className="font-medium text-red-400">重置数据</span>
          <span className="text-[12px] text-muted-foreground">清空所有记录</span>
        </button>

        {/* 恢复默认背景 */}
        <button onClick={() => onChangeMeBg(null)} className="w-full flex items-center justify-between rounded-2xl bg-background px-4 py-3 text-left text-sm transition-transform active:scale-[.98]">
          <span className="font-medium">恢复默认背景</span>
          <span className="text-[12px] text-muted-foreground">使用渐变壁纸</span>
        </button>
      </div>

      {/* 重置数据确认弹窗 */}
      {showResetConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-8" onClick={() => setShowResetConfirm(false)}>
          <div className="w-full max-w-[320px] rounded-3xl bg-background p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="font-serif text-[16px] font-semibold text-foreground">清空所有数据？</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">此操作将删除全部记录（日记、专注、习惯、饮食、成就等），且不可恢复。确定继续吗？</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-full border border-border/50 bg-background px-4 py-2.5 text-[14px] text-muted-foreground transition-transform active:scale-[.98]"
              >
                取消
              </button>
              <button
                onClick={doResetData}
                className="flex-1 rounded-full bg-red-400 px-4 py-2.5 text-[14px] font-medium text-white transition-transform active:scale-[.98]"
              >
                确定清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入备份：覆盖 / 合并 选择弹窗 */}
      {importChoice && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-8" onClick={() => setImportChoice(null)}>
          <div className="w-full max-w-[320px] rounded-3xl bg-background p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="font-serif text-[16px] font-semibold text-foreground">如何导入备份？</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">「覆盖」将用备份替换当前全部数据；「合并」保留现有数据，仅补充备份中缺失的项。</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => applyImport(importChoice, 'overwrite')}
                className="w-full rounded-full bg-sakura px-4 py-2.5 text-[14px] font-medium text-white transition-transform active:scale-[.98]"
              >
                覆盖当前数据
              </button>
              <button
                onClick={() => applyImport(importChoice, 'merge')}
                className="w-full rounded-full border border-border/50 bg-background px-4 py-2.5 text-[14px] text-foreground transition-transform active:scale-[.98]"
              >
                合并（保留现有）
              </button>
              <button
                onClick={() => setImportChoice(null)}
                className="w-full rounded-full px-4 py-2.5 text-[14px] text-muted-foreground transition-transform active:scale-[.98]"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入结果提示 */}
      {importToast && (
        <div className="absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 justify-center px-8" onClick={() => setImportToast(null)}>
          <div className="rounded-2xl bg-foreground/90 px-5 py-3 text-[13px] text-background shadow-xl">
            {importToast}
          </div>
        </div>
      )}
    </div>
  )
}

// MePage 函数（含总览/成就展柜/收藏记录 Tab、编辑资料页）
// 2026-08-08 设置页面已分离为独立的 SettingsPage 组件
function MePage({ onBack, isDark, onToggleDark, onChangeMeBg, editProfileOpen, onCloseEditProfile, meAvatar, meName, meSign, meGender, onSaveProfile, onOpenArticle }: { onBack: () => void; isDark: boolean; onToggleDark: () => void; onChangeMeBg: (dataUrl: string | null) => void; editProfileOpen: boolean; onCloseEditProfile: () => void; meAvatar: string | null; meName: string; meSign: string; meGender: string; onSaveProfile: (avatar: string | null, name: string, sign: string, gender: string) => void; onOpenArticle: (a: { title: string; desc: string; date: string; category: string }) => void }) {
  // 占位常量：后续接真实数据时只改这里
  const ME = {
    uid: getUID(), // 真实数据：首次生成后持久化
    name: '暖枫',
    sign: '每一步小小的足迹，都是未来的你。',
    focusHours: calculateTotalFocusHours(), // 真实数据：从 focusRecords 聚合
  }

  type MeTab = '总览' | '收藏记录'
  const [meTab, setMeTab] = useState<MeTab>('总览')
  const { favorites, remove } = useArticleFavorites()

  // 编辑资料表单临时值
  const [editAvatar, setEditAvatar] = useState<string | null>(meAvatar)
  const [editName, setEditName] = useState(meName)
  const [editSign, setEditSign] = useState(meSign)
  const [editGender, setEditGender] = useState(meGender)
  const editAvatarInputRef = useRef<HTMLInputElement>(null)

  // 头像 / 背景裁剪状态
  const [cropMode, setCropMode] = useState(false)
  const [cropTarget, setCropTarget] = useState<'avatar' | 'bg'>('avatar')
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  /** 将裁剪区域通过 canvas 输出为 dataURL */
  const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.src = imageSrc
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
    })
  }

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return
    const result = await getCroppedImg(cropImageSrc, croppedAreaPixels)
    if (cropTarget === 'avatar') {
      setEditAvatar(result)
    } else {
      onChangeMeBg(result)
    }
    setCropMode(false)
    setCropImageSrc(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  const handleCropCancel = () => {
    setCropMode(false)
    setCropImageSrc(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  // 头像选图后进入圆形裁剪模式
  const handleEditAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropTarget('avatar')
        setCropImageSrc(reader.result)
        setCropMode(true)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleMeBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropTarget('bg')
        setCropImageSrc(reader.result)
        setCropMode(true)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="app-scrollbar relative flex-1 overflow-y-auto pb-28">
      {/* 沉浸式背景墙已下沉到外层（覆盖状态栏），此处仅保留 Tab + 内容 */}

      {/* Tab 切换（极简，一次只看一个重点） */}
      <div className="sticky top-0 z-10 flex items-center gap-6 border-b border-border/30 bg-background/80 px-5 py-2 backdrop-blur-md">
        {(['总览', '收藏记录'] as MeTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setMeTab(t)}
            className={`relative pb-1.5 text-[14px] font-medium transition-colors ${
              meTab === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
            {meTab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-sakura" />}
          </button>
        ))}
      </div>

      {/* 面板内容 */}
      <div className="px-5 py-5">
        {meTab === '总览' && (
          <div className="space-y-5">
            {/* 核心数据一行横排 */}
            <div className="flex items-center justify-between rounded-2xl bg-card px-5 py-4">
              <div className="flex flex-col items-center">
                <span className="font-serif text-[18px] font-bold text-foreground">{ME.focusHours}h</span>
                <span className="text-[11px] text-muted-foreground">专注时长</span>
              </div>
              <div className="h-8 w-px bg-border/40" />
              <div className="flex flex-col items-center">
                <span className="text-[11px] text-muted-foreground">已陪伴你</span>
                <span className="font-serif text-[18px] font-bold text-foreground">{getLoginDays().length} 天</span>
              </div>
            </div>

          </div>
        )}

        {meTab === '收藏记录' && (
          favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="mb-3 text-[40px] opacity-40">📥</span>
              <p className="text-[14px] text-muted-foreground">暂无收藏</p>
              <p className="mt-1 text-[11px] text-muted-foreground">在「首页」读到喜欢的文章，点右上角♥就能收在这里</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {favorites.map((f) => (
                <div
                  key={`${f.category}::${f.title}`}
                  className="flex items-start gap-3 rounded-2xl bg-card px-4 py-3"
                >
                  <button
                    onClick={() => onOpenArticle(f)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: 'rgba(212,83,126,0.12)', color: '#D4537E' }}
                      >
                        {f.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">{f.date}</span>
                    </div>
                    <h5 className="mt-1 font-serif text-[15px] text-foreground">{f.title}</h5>
                    <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground/70">{f.desc}</p>
                  </button>
                  <button
                    onClick={() => remove(f.category, f.title)}
                    aria-label="删除收藏"
                    className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-stone-100 hover:text-red-500 active:scale-90"
                  >
                    <Trash2 size={14} strokeWidth={1.8} />
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* 背景裁剪模式（矩形裁剪框，无宽高比限制）。
          Portal 到 body 固定层级：旧版 absolute 覆盖层底部按钮被底部导航（z-40）遮挡导致无法确认 */}
      {cropMode && cropImageSrc && cropTarget === 'bg' && createPortal(
        <div className="fixed inset-0 z-[70] flex flex-col bg-black/95">
          {/* 顶部提示（避让状态栏） */}
          <div className="flex shrink-0 items-center justify-between px-4 py-3 pt-[calc(0.75rem+var(--wi-sb,0px))]">
            <span className="text-[14px] font-medium text-white/80">拖动、双指缩放调整背景区域</span>
          </div>
          {/* 裁剪区域 */}
          <div className="relative flex-1">
            <Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          {/* 底部操作栏（避让底部安全区） */}
          <div className="flex shrink-0 items-center justify-between px-6 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <button
              onClick={handleCropCancel}
              className="rounded-full px-6 py-2.5 text-[15px] font-medium text-white/70 transition-colors active:text-white"
            >
              取消
            </button>
            <button
              onClick={handleCropConfirm}
              className="rounded-full bg-sakura px-8 py-2.5 text-[15px] font-semibold text-white transition-transform active:scale-95"
            >
              确定
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* 编辑资料独立界面（全屏覆盖） */}
      {editProfileOpen && (
        <div className="absolute inset-0 z-30 flex flex-col bg-card">
          {/* 顶部导航：返回 + 保存 */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-3">
            <button
              onClick={onCloseEditProfile}
              aria-label="返回"
              className="flex size-9 items-center justify-center rounded-full bg-background text-foreground transition-transform active:scale-95"
            >
              <span className="text-[18px] leading-none">←</span>
            </button>
            <span className="font-serif text-[17px] font-semibold text-foreground">编辑资料</span>
            <button
              onClick={() => onSaveProfile(editAvatar, editName, editSign, editGender)}
              className="rounded-full bg-sakura px-4 py-1.5 text-[13px] font-semibold text-white transition-transform active:scale-95"
            >
              保存
            </button>
          </div>

          {/* 头像裁剪模式（覆盖整个编辑页，圆形裁剪框）。
              Portal 到 body 固定层级：旧版底部确定/取消按钮被底部导航遮挡导致无法确认 */}
          {cropMode && cropImageSrc && cropTarget === 'avatar' && createPortal(
            <div className="fixed inset-0 z-[70] flex flex-col bg-black/95">
              {/* 顶部提示（避让状态栏） */}
              <div className="flex shrink-0 items-center justify-between px-4 py-3 pt-[calc(0.75rem+var(--wi-sb,0px))]">
                <span className="text-[14px] font-medium text-white/80">拖动、双指缩放调整头像位置</span>
              </div>
              {/* 裁剪区域 */}
              <div className="relative flex-1">
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              {/* 底部操作栏（避让底部安全区） */}
              <div className="flex shrink-0 items-center justify-between px-6 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <button
                  onClick={handleCropCancel}
                  className="rounded-full px-6 py-2.5 text-[15px] font-medium text-white/70 transition-colors active:text-white"
                >
                  取消
                </button>
                <button
                  onClick={handleCropConfirm}
                  className="rounded-full bg-sakura px-8 py-2.5 text-[15px] font-semibold text-white transition-transform active:scale-95"
                >
                  确定
                </button>
              </div>
            </div>,
            document.body,
          )}

          {/* 编辑内容 */}
          <div className="app-scrollbar flex-1 overflow-y-auto px-5 py-6 space-y-5">
            {/* 头像 */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => editAvatarInputRef.current?.click()}
                className="relative shrink-0"
              >
                {editAvatar ? (
                  <img src={editAvatar} alt="头像" className="size-24 rounded-full object-cover ring-4 ring-sakura/30 shadow-md" />
                ) : (
                  <div className="size-24 rounded-full bg-muted-foreground/20 ring-4 ring-sakura/30 shadow-md" />
                )}
              </button>
              <input
                ref={editAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleEditAvatarFile}
              />
              <span className="text-[12px] text-muted-foreground">点击更换头像</span>
            </div>

            {/* 昵称 */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">昵称</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={12}
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-[15px] text-foreground outline-none transition-colors focus:border-sakura/60"
                placeholder="请输入昵称"
              />
            </div>

            {/* 简介 */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">简介</label>
              <textarea
                value={editSign}
                onChange={(e) => setEditSign(e.target.value)}
                maxLength={60}
                rows={2}
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-[14px] text-foreground outline-none transition-colors focus:border-sakura/60 resize-none"
                placeholder="写一句话介绍自己..."
              />
            </div>

            {/* 性别 */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground">性别</label>
              <div className="flex gap-2">
                {([
                  { v: '', label: '保密' },
                  { v: '男', label: '♂ 男' },
                  { v: '女', label: '♀ 女' },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setEditGender(opt.v)}
                    className={`flex-1 rounded-xl border py-2.5 text-[13px] font-medium transition-colors active:scale-[.98] ${
                      editGender === opt.v
                        ? 'border-sakura/60 bg-sakura/10 text-sakura'
                        : 'border-border/50 bg-background text-muted-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface FocusRecord {
  id: string
  type: string
  customType: string | null
  duration: number
  completedDuration: number
  status: 'completed' | 'cancelled'
  startTime: string
  endTime: string
  date: string
}

// 秒数 → 中文时长（如 30分钟 / 1小时45分 / 45秒）
function formatFocusDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}秒`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hours === 0) return secs === 0 ? `${mins}分钟` : `${mins}分${secs}秒`
  return remMins === 0 ? `${hours}小时` : `${hours}小时${remMins}分`
}

// Steam 风进度条颜色：占比越高，色相从蓝(210°)向暖橙(15°)偏移，像 Steam 按投入时长变色
function focusBarColor(ratio: number): string {
  const r = Math.max(0, Math.min(1, ratio))
  const hue = 210 - r * 195 // 210°(蓝) → 15°(橙红)
  return `hsl(${hue}, 78%, 55%)`
}

interface CurrentFocus {
  type: string
  customType: string | null
  duration: number
  remainingSeconds: number
  startTime: string
  status: 'running' | 'paused'
  // v0.1.42 时间戳内核（防后台被杀丢进度）
  startTimestamp?: number
  accumulatedPauseMs?: number
  pauseStartTimestamp?: number
  totalSeconds?: number
}

const focusTypes = ['学习', '阅读', '健身']
const durationPresets = [15, 25, 40, 60, 90]

function TodayTotalFocus({ records, getTodayDate }: { records: FocusRecord[]; getTodayDate: () => string }) {
  const todayTotal = records
    .filter(r => r.date === getTodayDate() && r.status === 'completed')
    .reduce((sum, r) => sum + r.completedDuration, 0)
  const hours = Math.floor(todayTotal / 3600)
  const mins = Math.floor((todayTotal % 3600) / 60)
  const secs = todayTotal % 60

  if (todayTotal === 0) {
    return <span>还没有记录</span>
  }

  return (
    <span>
      {hours > 0 && (
        <>
          <CountUp to={hours} from={0} duration={0.6} />
          <span className="mx-0.5">时</span>
        </>
      )}
      <CountUp to={mins} from={0} duration={0.6} />
      <span className="mx-0.5">分</span>
      {secs > 0 && <><CountUp to={secs} from={0} duration={0.4} /><span>秒</span></>}
    </span>
  )
}

function FocusPage({ onBack, showNav, onToggleNav, onOpenMusic, onOpenHistory }: { onBack: () => void; showNav: boolean; onToggleNav: () => void; onOpenMusic: () => void; onOpenHistory: () => void }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle')
  const [selectedType, setSelectedType] = useState('学习')
  const [customType, setCustomType] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(25) // 分钟
  const [freeTimer, setFreeTimer] = useState(false)
  const [customDurationActive, setCustomDurationActive] = useState(false)
  const [customDurationInput, setCustomDurationInput] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [musicOn, setMusicOn] = useState(false)
  const [bgImage, setBgImage] = useState<string>('') // SSR 安全：初始化恒为空，hydration 完成后在 useEffect 中读 localStorage 回填，避免 #418 mismatch
  const [startTime, setStartTime] = useState('')
  const [records, setRecords] = useState<FocusRecord[]>([])
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryFocus, setRecoveryFocus] = useState<CurrentFocus | null>(null)
  const [showComplete, setShowComplete] = useState(false)
  const [showDisc, setShowDisc] = useState(false)

  const [displayRemaining, setDisplayRemaining] = useState(1500)
  const [displayElapsed, setDisplayElapsed] = useState(0)

  // 镜像 ref，供计时闭包读取最新值（避免每帧重建）
  const timingRef = useRef<{ startTs: number | null; accPauseMs: number; pauseStartTs: number | null; totalMs: number }>({
    startTs: null, accPauseMs: 0, pauseStartTs: null, totalMs: 1500000,
  })
  const metaRef = useRef<{ selectedType: string; customType: string; selectedDuration: number; freeTimer: boolean; startTime: string }>({
    selectedType: '学习', customType: '', selectedDuration: 25, freeTimer: false, startTime: '',
  })
  const uiRef = useRef({ displayRemaining: 1500, displayElapsed: 0 })
  const statusRef = useRef(status)
  statusRef.current = status

  const getTodayDate = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  useEffect(() => {
    const storedBg = localStorage.getItem('focusBg')
    if (storedBg && storedBg.startsWith('data:')) {
      setBgImage(storedBg)
    }
  }, [])

  useEffect(() => {
    const storedRecords = localStorage.getItem('focusRecords')
    if (storedRecords) {
      try {
        const parsed = JSON.parse(storedRecords)
        setRecords(Array.isArray(parsed) ? parsed : [])
      } catch {
        setRecords([])
      }
    }

    const storedCurrent = localStorage.getItem('currentFocus')
    if (storedCurrent) {
      try {
        const current = JSON.parse(storedCurrent) as CurrentFocus
        if (current.status === 'running' || current.status === 'paused') {
          setRecoveryFocus(current)
          setShowRecovery(true)
        }
      } catch {
        localStorage.removeItem('currentFocus')
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}秒`
    if (secs === 0) return `${mins}分钟`
    return `${mins}分${secs}秒`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) {
      return `${secs}秒`
    }
    if (secs === 0) {
      return `${mins}分钟`
    }
    return `${mins}分${secs}秒`
  }

  const calculateTodayTotal = () => {
    const today = getTodayDate()
    const todayRecords = records.filter(r => r.date === today && r.status === 'completed')
    const totalSeconds = todayRecords.reduce((sum, r) => {
      return sum + r.completedDuration
    }, 0)
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    if (hours > 0) {
      return `${hours}小时${mins}分钟${secs > 0 ? `${secs}秒` : ''}`
    }
    if (mins > 0) {
      return `${mins}分钟${secs > 0 ? `${secs}秒` : ''}`
    }
    return `${secs}秒`
  }

  const saveCurrentFocus = (current: CurrentFocus) => {
    localStorage.setItem('currentFocus', JSON.stringify(current))
  }

  const clearCurrentFocus = () => {
    localStorage.removeItem('currentFocus')
  }

  const saveRecord = (record: FocusRecord) => {
    const currentRecords = Array.isArray(records) ? records : []
    const newRecords = [...currentRecords, record]
    setRecords(newRecords)
    localStorage.setItem('focusRecords', JSON.stringify(newRecords))
    window.dispatchEvent(new Event('data-updated'))
  }

  const handleComplete = useCallback(() => {
    if (statusRef.current === 'completed') return
    // 用真实已用时间记录专注时长：自由计时与定时模式都取自计时器实时累加的 displayElapsed，
    // 防止"提前手动完成"时把整段设定时长虚记进去
    const completedSeconds = uiRef.current.displayElapsed
    const record: FocusRecord = {
      id: generateId(),
      type: selectedType,
      customType: customType || null,
      duration: freeTimer ? 0 : selectedDuration,
      completedDuration: completedSeconds,
      status: 'completed',
      startTime,
      endTime: new Date().toISOString(),
      date: getTodayDate(),
    }
    saveRecord(record)
    if (completedSeconds >= 300) {
      saveGrowthEvent(getTodayDate(), 'focus')
    }
    clearCurrentFocus()
    setStatus('completed')
    setShowComplete(true)
  }, [freeTimer, selectedDuration, selectedType, customType, startTime, saveRecord])

  const handleCompleteRef = useRef(handleComplete)
  useEffect(() => { handleCompleteRef.current = handleComplete }, [handleComplete])

  // 时间戳内核：tick 仅基于时间戳重算显示，不累减；防后台被杀
  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(() => {
      const t = timingRef.current
      if (t.startTs == null) return
      const elapsedMs = Date.now() - t.startTs - t.accPauseMs
      const remainingMs = t.totalMs - elapsedMs
      if (remainingMs <= 0) {
        const done = Math.round(t.totalMs / 1000)
        setDisplayRemaining(0)
        setDisplayElapsed(done)
        uiRef.current = { displayRemaining: 0, displayElapsed: done }
        handleCompleteRef.current()
        return
      }
      const rem = Math.ceil(remainingMs / 1000)
      const el = Math.floor(elapsedMs / 1000)
      setDisplayRemaining(rem)
      setDisplayElapsed(el)
      uiRef.current = { displayRemaining: rem, displayElapsed: el }
    }, 250)

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const t = timingRef.current
      if (t.startTs == null) return
      const remainingMs = t.totalMs - (Date.now() - t.startTs - t.accPauseMs)
      if (remainingMs <= 0) handleCompleteRef.current()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [status])

  const [bgUploading, setBgUploading] = useState(false)
  const [bgToast, setBgToast] = useState<string | null>(null)

  const buildSnapshot = (st: 'running' | 'paused'): CurrentFocus => {
    const t = timingRef.current
    const now = t.pauseStartTs != null ? t.pauseStartTs : Date.now()
    const elapsedMs = t.startTs != null ? Math.max(0, now - t.startTs - t.accPauseMs) : 0
    const rem = Math.max(0, Math.ceil((t.totalMs - elapsedMs) / 1000))
    return {
      type: selectedType,
      customType: customType || null,
      duration: freeTimer ? 0 : selectedDuration,
      remainingSeconds: freeTimer ? uiRef.current.displayElapsed : rem,
      startTime,
      status: st,
      startTimestamp: t.startTs ?? undefined,
      accumulatedPauseMs: t.accPauseMs,
      pauseStartTimestamp: t.pauseStartTs ?? undefined,
      totalSeconds: Math.round(t.totalMs / 1000),
    }
  }

  const beginSession = (st: 'running' | 'paused') => {
    const now = Date.now()
    const durMs = freeTimer ? 0 : selectedDuration * 60000
    timingRef.current = { startTs: now, accPauseMs: 0, pauseStartTs: null, totalMs: durMs }
    const startIso = new Date().toISOString()
    metaRef.current = {
      selectedType, customType, selectedDuration, freeTimer, startTime: startIso,
    }
    setStartTime(startIso)
    setDisplayRemaining(freeTimer ? 0 : selectedDuration * 60)
    setDisplayElapsed(0)
    uiRef.current = { displayRemaining: freeTimer ? 0 : selectedDuration * 60, displayElapsed: 0 }
    setStatus(st)
    saveCurrentFocus(buildSnapshot(st))
  }

  const handleConfirmStart = () => {
    setShowDisc(false)
    setPanelOpen(false)
    setCustomDurationActive(false)
    setCustomDurationInput('')
    beginSession('running')
  }

  const handlePause = () => {
    const t = timingRef.current
    if (t.startTs == null || t.pauseStartTs != null) return
    t.pauseStartTs = Date.now()
    timingRef.current = { ...t }
    setStatus('paused')
    saveCurrentFocus(buildSnapshot('paused'))
  }

  const handleResume = () => {
    const t = timingRef.current
    if (t.startTs == null || t.pauseStartTs == null) return
    t.accPauseMs += Date.now() - t.pauseStartTs
    t.pauseStartTs = null
    timingRef.current = { ...t }
    setStatus('running')
    saveCurrentFocus(buildSnapshot('running'))
  }

  const handleEnd = () => {
    handleComplete()
  }

  const handleRecoveryResume = () => {
    if (!recoveryFocus) return
    const rf = recoveryFocus
    const isFree = (rf.duration ?? 0) === 0
    setSelectedType(rf.type)
    setCustomType(rf.customType || '')
    setFreeTimer(isFree)
    setSelectedDuration(rf.duration || 25)
    setShowRecovery(false)
    setRecoveryFocus(null)
    const t = timingRef.current
    if (rf.startTimestamp && rf.totalSeconds != null) {
      t.startTs = rf.startTimestamp
      t.accPauseMs = rf.accumulatedPauseMs || 0
      t.pauseStartTs = rf.status === 'paused' ? Date.now() : null
      t.totalMs = rf.totalSeconds * 1000
    } else {
      const total = (rf.duration || 25) * 60
      const rem = rf.remainingSeconds || 0
      t.startTs = Date.now() - (total - rem) * 1000
      t.accPauseMs = 0
      t.pauseStartTs = null
      t.totalMs = total * 1000
    }
    timingRef.current = { ...t }
    metaRef.current = {
      selectedType: rf.type, customType: rf.customType || '', selectedDuration: rf.duration || 25,
      freeTimer: isFree, startTime: rf.startTime,
    }
    if (rf.status === 'running') {
      setStatus('running')
      saveCurrentFocus(buildSnapshot('running'))
    } else {
      setStatus('paused')
      const tot = rf.totalSeconds || (rf.duration || 25) * 60
      const rem = rf.remainingSeconds || 0
      setDisplayRemaining(rem)
      setDisplayElapsed(tot - rem)
      uiRef.current = { displayRemaining: rem, displayElapsed: tot - rem }
      saveCurrentFocus(buildSnapshot('paused'))
    }
  }

  const handleRecoveryAbandon = () => {
    if (!recoveryFocus) return
    const rf = recoveryFocus
    const isFree = (rf.duration ?? 0) === 0
    const total = isFree ? (rf.remainingSeconds || 0) : (rf.duration || 25) * 60
    const done = isFree ? (rf.remainingSeconds || 0) : total - (rf.remainingSeconds || 0)
    if (done > 0) {
      const record: FocusRecord = {
        id: generateId(),
      type: rf.type, customType: rf.customType, duration: rf.duration || 0,
        completedDuration: done, status: 'completed',
        startTime: rf.startTime, endTime: new Date().toISOString(), date: getTodayDate(),
      }
      saveRecord(record)
      if (done >= 300) saveGrowthEvent(getTodayDate(), 'focus')
    }
    clearCurrentFocus()
    setShowRecovery(false)
    setRecoveryFocus(null)
  }

  const handleCloseComplete = () => {
    setShowComplete(false)
    setStatus('idle')
    setFreeTimer(false)
    setDisplayRemaining(selectedDuration * 60)
    setDisplayElapsed(0)
    uiRef.current = { displayRemaining: selectedDuration * 60, displayElapsed: 0 }
    timingRef.current = { startTs: null, accPauseMs: 0, pauseStartTs: null, totalMs: selectedDuration * 60000 }
  }

  const handleBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBgUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        try {
          const maxW = 1280
          const scale = Math.min(1, maxW / img.width)
          const w = Math.round(img.width * scale)
          const h = Math.round(img.height * scale)
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) { setBgUploading(false); return }
          ctx.drawImage(img, 0, 0, w, h)
          const data = canvas.toDataURL('image/jpeg', 0.82)
          setBgImage(data)
          try { localStorage.setItem('focusBg', data) } catch {
            setBgToast('图片太大，仅本次有效')
          }
          setBgUploading(false)
          setBgToast('背景已更新')
          setTimeout(() => setBgToast(null), 2200)
        } catch {
          setBgUploading(false)
          setBgToast('上传失败，请重试')
          setTimeout(() => setBgToast(null), 2200)
        }
      }
      img.onerror = () => { setBgUploading(false); setBgToast('图片加载失败'); setTimeout(() => setBgToast(null), 2200) }
      img.src = reader.result as string
    }
    reader.onerror = () => { setBgUploading(false); setBgToast('文件读取失败'); setTimeout(() => setBgToast(null), 2200) }
    reader.readAsDataURL(file)
    // 重置 input，允许重复上传同一文件
    e.target.value = ''
  }
  const handleBgClear = () => {
    setBgImage('')
    localStorage.removeItem('focusBg')
    setBgToast('背景已恢复默认')
    setTimeout(() => setBgToast(null), 1800)
  }

  const isCustomType = selectedType === '自定义'

  // 温润纸感圆环倒计时（道林纸描边 + 暖金进度环 + 拖尾 + 刻度 + 做旧）
  const FocusRing = ({ status, progress, freeMode }: { status: 'idle' | 'running' | 'paused' | 'completed'; progress: number; freeMode?: boolean }) => {
    const size = 300
    const stroke = 10
    const r = (size - stroke) / 2
    const c = 2 * Math.PI * r
    const offset = freeMode ? c * 0.3 : c * (1 - progress)
    const cx = size / 2
    const cy = size / 2
    // 进度弧末端角度（-90° 起点 + progress * 360°）
    const endAngle = -Math.PI / 2 + progress * 2 * Math.PI
    const endX = cx + r * Math.cos(endAngle)
    const endY = cy + r * Math.sin(endAngle)
    // 拖尾起点（沿进度弧反向退 25px）
    const tailAngle = endAngle - (25 / r)
    const tailX = cx + r * Math.cos(tailAngle)
    const tailY = cy + r * Math.sin(tailAngle)

    // 刻度线（12 根，像怀表表盘）
    const ticks = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * 2 * Math.PI - Math.PI / 2
      const inner = r - 14
      const outer = r - 10
      return {
        x1: cx + inner * Math.cos(angle),
        y1: cy + inner * Math.sin(angle),
        x2: cx + outer * Math.cos(angle),
        y2: cy + outer * Math.sin(angle),
      }
    })

    return (
      <div className="fz-ring-wrap" data-status={status}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="fz-ring-svg"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            <linearGradient id="fzRingGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F4D06F" />
              <stop offset="100%" stopColor="#E09F3E" />
            </linearGradient>
            <radialGradient id="fzRingGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF6D8" />
              <stop offset="45%" stopColor="#F4D06F" />
              <stop offset="100%" stopColor="rgba(224,159,62,0)" />
            </radialGradient>
            {/* 拖尾渐变：从暖金到透明 */}
            <linearGradient id="fzRingTrail" x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${endAngle * 180 / Math.PI}, ${tailX}, ${tailY})`}>
              <stop offset="0%" stopColor="#F4D06F" stopOpacity="0" />
              <stop offset="100%" stopColor="#F4D06F" stopOpacity="0.7" />
            </linearGradient>
            {/* 做旧底环：用 feTurbulence 产生不规则边缘 */}
            <filter id="fzDistress" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
            </filter>
            {/* 墨迹渗透：轻微高斯模糊 */}
            <filter id="fzInkBleed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.6" />
            </filter>
          </defs>

          {/* 底环：道林纸淡棕描边 + 做旧效果 */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(74,59,50,0.12)"
            strokeWidth={stroke}
            filter="url(#fzDistress)"
          />

          {/* 刻度线：12 根极细刻度 */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="rgba(74,59,50,0.10)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          ))}

          {/* 自由计时模式：缓慢旋转的等宽环 */}
          {freeMode ? (
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="url(#fzRingGold)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray="40 10"
              className="fz-free-ring"
              style={{
                animation: 'fz-free-spin 12s linear infinite',
              }}
            />
          ) : (
            <>
              {/* 进度环拖尾：从弧末端向后延伸的渐变笔触 */}
              {progress > 0.02 && (
                <line
                  x1={tailX} y1={tailY}
                  x2={endX} y2={endY}
                  stroke="url(#fzRingTrail)"
                  strokeWidth={stroke + 2}
                  strokeLinecap="round"
                  opacity="0.8"
                />
              )}
              {/* 进度环：暖金渐变描边 */}
              <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke="url(#fzRingGold)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </>
          )}

          {/* 发光拖尾光点：进度弧末端 */}
          {progress > 0 && !freeMode && (
            <circle
              className="fz-ring-glow-dot"
              cx={endX}
              cy={endY}
              r={stroke / 2 + 2}
              fill="url(#fzRingGlow)"
            />
          )}

          {/* 自由计时模式的固定光点 */}
          {freeMode && (
            <circle
              className="fz-ring-glow-dot"
              cx={cx + r} cy={cy}
              r={stroke / 2 + 2}
              fill="url(#fzRingGlow)"
            />
          )}
        </svg>
      </div>
    )
  }

  return (
    <div
      className="fz-root absolute inset-0 z-[60] overflow-hidden flex flex-col"
      data-status={status}
      style={{ bottom: showNav ? 74 : 0, backgroundColor: '#FBF9F1' }}
    >
      {/* 背景层：用户自定义图 + 可读性蒙版 或 道林纸米色 + 纸纤维纹理 */}
      {bgImage ? (
        <>
          <div className="absolute inset-0" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(251,249,241,0.55) 0%, rgba(251,249,241,0.35) 40%, rgba(251,249,241,0.55) 100%)' }} />
        </>
      ) : (
        <div className="fz-bg-paper absolute inset-0" />
      )}

      {/* 中心暖光：径向渐变光斑 */}
      {!bgImage && (
        <div className="fz-center-glow-bg" aria-hidden="true" />
      )}

      {/* C. 背景星尘：极淡暖金微粒缓慢漂浮上升（additive 氛围层） */}
      <div className="fz-stardust" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`fz-dust fz-dust-${i}`} />
        ))}
      </div>

      {/* ===== 中央圆环倒计时区（温润纸感，数字嵌于环中央） ===== */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-[68px]">
        {/* 中心暖光：灯下专注的氛围光斑 */}
        <div className="fz-center-glow" aria-hidden="true" />

        <div className="fz-ring-container">
          {/* 完成时光辉扩散环 */}
          <div className="fz-complete-ring fz-complete-ring-1" style={{ width: 300, height: 300 }} aria-hidden="true" />
          <div className="fz-complete-ring fz-complete-ring-2" style={{ width: 300, height: 300 }} aria-hidden="true" />
          <FocusRing
            status={status}
            progress={(() => {
              if (freeTimer) return 0
              const total = selectedDuration * 60
              return total > 0 ? (total - displayRemaining) / total : 0
            })()}
            freeMode={freeTimer}
          />
          {/* 手绘波浪装饰线：圆环上方 */}
          <svg className="fz-wave-deco fz-wave-top" viewBox="0 0 120 8" aria-hidden="true">
            <path d="M2 4 Q 15 0, 30 4 T 58 4 T 88 4 T 118 4" fill="none" stroke="rgba(74,59,50,0.12)" strokeWidth="0.8" strokeLinecap="round" />
          </svg>

          <div className="fz-ring-center">
            {/* 墨迹渗透层：底层模糊副本 + 上层清晰文字 */}
            <span className="fz-time-display fz-time-ink">
              {freeTimer && status === 'idle' ? '自由' : formatTime(displayRemaining)}
            </span>
            <span className="fz-time-sub fz-time-sub-hand">
              {status === 'idle'
                ? `${selectedDuration} 分钟 · 点击设置`
                : (isCustomType && customType ? customType : selectedType)}
            </span>
          </div>

          {/* 手绘波浪装饰线：圆环下方 */}
          <svg className="fz-wave-deco fz-wave-bottom" viewBox="0 0 120 8" aria-hidden="true">
            <path d="M2 4 Q 15 8, 30 4 T 58 4 T 88 4 T 118 4" fill="none" stroke="rgba(74,59,50,0.08)" strokeWidth="0.6" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 音乐开启时顶部光线 */}
      {musicOn && (
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #8B6F5E, transparent)' }} />
      )}

      <button onClick={onBack} aria-label="返回首页" className="fz-corner-btn absolute left-4 top-[calc(1rem+var(--wi-sb,0px))] z-20">
        <ChevronLeft size={22} />
      </button>

      <button onClick={onOpenMusic} aria-label="打开音乐" className="fz-corner-btn absolute right-4 top-[calc(1rem+var(--wi-sb,0px))] z-20">
        <Music size={18} style={{ color: musicOn ? '#B8956A' : '#4A3B32' }} />
      </button>

      <button onClick={onToggleNav} aria-label={showNav ? '隐藏底部导航栏' : '显示底部导航栏'} className="fz-corner-btn absolute right-4 top-[calc(60px+var(--wi-sb,0px))] z-20" style={{ width: 34, height: 34 }}>
        {showNav ? <EyeOff size={15} style={{ color: '#4A3B32' }} /> : <Eye size={15} style={{ color: '#4A3B32' }} />}
      </button>

      {status === 'idle' && (
        <button onClick={() => setPanelOpen((v) => !v)} aria-label="信息栏" aria-expanded={panelOpen} className="fz-corner-btn absolute left-0 top-1/2 z-20" style={{ width: 30, height: 48, borderRadius: '0 999px 999px 0' }}>
          {panelOpen ? <ChevronLeft size={16} style={{ color: '#4A3B32' }} /> : <ChevronRight size={16} style={{ color: '#4A3B32' }} />}
        </button>
      )}

      <div
        className="fz-card absolute left-0 top-0 z-30 h-full w-[56%] max-w-[220px] transition-transform duration-200 ease-out"
        style={{ borderRight: 'none', borderTop: 'none', borderBottom: 'none', borderRadius: '0 18px 18px 0', transform: panelOpen ? 'translateX(0)' : 'translateX(-100%)', pointerEvents: panelOpen ? 'auto' : 'none' }}
      >
        <>
          <button onClick={() => { setPanelOpen(false) }} aria-label="关闭信息栏" className="fz-corner-btn absolute right-2 top-2 z-10"><span className="text-lg">×</span></button>
          <div className="flex flex-col gap-3 p-4 pt-14">
            <div>
              <p className="text-[11px] tracking-[0.18em]" style={{ color: 'rgba(74,59,50,0.5)' }}>今日已专注</p>
              <p className="mt-1 font-medium" style={{ fontSize: '20px', color: '#4A3B32' }}>
                <TodayTotalFocus records={records} getTodayDate={getTodayDate} />
              </p>
            </div>
              <button onClick={() => setShowDisc(true)} className="fz-press-btn-ghost w-full px-3.5 py-2.5 text-left text-[14px]" style={{ height: 'auto', justifyContent: 'flex-start', borderRadius: 12 }}>
                专注时长：{selectedDuration}分钟
              </button>
              <label className="fz-press-btn-ghost w-full px-3.5 py-2.5 text-left text-[14px] cursor-pointer" style={{ height: 'auto', justifyContent: 'flex-start', borderRadius: 12, opacity: bgUploading ? 0.6 : 1 }}>
                <input type="file" accept="image/*" style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} onChange={handleBgFile} />
                {bgUploading ? '正在上传…' : (bgImage ? '✓ 背景已设置（点按更换）' : '✎ 上传背景图')}
              </label>
              {bgImage && (
                <button onClick={handleBgClear} className="text-right text-[12px]" style={{ color: 'rgba(74,59,50,0.5)' }}>清除背景</button>
              )}
              <button onClick={() => { setPanelOpen(false); onOpenHistory() }} className="fz-press-btn-ghost mt-1 flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px]" style={{ height: 'auto', justifyContent: 'flex-start', borderRadius: 12 }}>
                <History size={16} style={{ color: '#B8956A' }} />
                历史记录
              </button>
            </div>
          </>
      </div>


      {/* 底部操作区：flex 流固定底部安全区，不遮挡中央沙漏 */}
      <div className="relative z-40 flex-none px-8 pb-[calc(28px+env(safe-area-inset-bottom))]">
        {status === 'idle' ? (
          <button onClick={() => setShowDisc(true)} className="fz-press-btn relative w-full text-[15px] font-medium" style={{ border: 'none' }}>
            开始专注
          </button>
        ) : status === 'running' ? (
          <div className="flex gap-3">
            <button onClick={handlePause} className="fz-press-btn relative flex-1 text-[15px] font-medium" style={{ border: 'none' }}>暂停</button>
            <button onClick={handleEnd} className="fz-press-btn-ghost relative flex-1 text-[15px] font-medium">结束</button>
          </div>
        ) : status === 'paused' ? (
          <div className="flex gap-3">
            <button onClick={handleResume} className="fz-press-btn relative flex-1 text-[15px] font-medium" style={{ border: 'none' }}>继续</button>
            <button onClick={handleEnd} className="fz-press-btn-ghost relative flex-1 text-[15px] font-medium">结束</button>
          </div>
        ) : null}
      </div>

      {showDisc && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center" style={{ background: 'rgba(74,59,50,0.25)' }}>
          <div className="fz-card mx-5 w-full max-w-[340px] p-6" style={{ borderRadius: 24 }}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[15px] font-medium" style={{ color: '#4A3B32' }}>星轨圆盘 · 设置时长</h3>
              <button onClick={() => { setShowDisc(false); setCustomDurationActive(false); setCustomDurationInput('') }} aria-label="关闭" className="rounded-full p-1.5 hover:bg-black/5" style={{ color: 'rgba(74,59,50,0.7)' }}><span className="text-lg">×</span></button>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {[...focusTypes, '自定义'].map((tp) => (
                <button key={tp} onClick={() => { setSelectedType(tp); if (tp !== '自定义') setCustomType('') }} className="rounded-full px-4 py-1.5 text-[12px] transition-colors" style={selectedType === tp ? { background: '#4A3B32', color: '#FBF9F1' } : { background: 'rgba(74,59,50,0.06)', color: 'rgba(74,59,50,0.62)' }}>{tp}</button>
              ))}
            </div>
            {isCustomType && (
              <input type="text" value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder="输入专注对象..." maxLength={20} className="mb-5 w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: 'rgba(74,59,50,0.05)', color: '#4A3B32', border: '1px solid rgba(74,59,50,0.15)' }} />
            )}
            <div className="relative mx-auto mb-5 flex h-44 w-44 items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(74,59,50,0.1)" strokeWidth="3" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#4A3B32" strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - Math.min(selectedDuration, 600) / 600)} />
              </svg>
              <div className="text-center">
                <div className="font-medium tabular-nums" style={{ fontSize: '40px', color: '#4A3B32' }}>{selectedDuration}</div>
                <div className="text-[12px]" style={{ color: 'rgba(74,59,50,0.62)' }}>分钟</div>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap justify-center gap-2">
              {durationPresets.map((d) => (
                <button key={d} onClick={() => { setSelectedDuration(d); setCustomDurationActive(false) }} className="rounded-full px-3 py-1 text-[12px] transition-colors" style={!customDurationActive && selectedDuration === d ? { background: 'rgba(74,59,50,0.15)', color: '#4A3B32' } : { background: 'rgba(74,59,50,0.06)', color: 'rgba(74,59,50,0.62)' }}>{d}</button>
              ))}
              <button onClick={() => { setCustomDurationActive(false); setSelectedDuration((d) => Math.max(5, d - 5)) }} className="rounded-full px-3 py-1 text-[12px]" style={{ background: 'rgba(74,59,50,0.06)', color: 'rgba(74,59,50,0.62)' }}>−5</button>
              <button onClick={() => { setCustomDurationActive(false); setSelectedDuration((d) => Math.min(600, d + 5)) }} className="rounded-full px-3 py-1 text-[12px]" style={{ background: 'rgba(74,59,50,0.06)', color: 'rgba(74,59,50,0.62)' }}>+5</button>
              <button onClick={() => setCustomDurationActive((v) => !v)} className="rounded-full px-3 py-1 text-[12px] transition-colors" style={customDurationActive ? { background: 'rgba(74,59,50,0.15)', color: '#4A3B32' } : { background: 'rgba(74,59,50,0.06)', color: 'rgba(74,59,50,0.62)' }}>自定义</button>
            </div>
            {customDurationActive && (
              <input
                type="number"
                value={customDurationInput}
                onChange={(e) => {
                  const raw = e.target.value
                  setCustomDurationInput(raw)
                  const n = parseInt(raw, 10)
                  if (!isNaN(n) && n >= 1 && n <= 600) setSelectedDuration(n)
                }}
                placeholder="1–600 分钟"
                min={1}
                max={600}
                className="mb-3 w-full rounded-xl px-3 py-2 text-center text-sm outline-none"
                style={{ background: 'rgba(74,59,50,0.05)', color: '#4A3B32', border: '1px solid rgba(74,59,50,0.15)' }}
              />
            )}
            <button onClick={handleConfirmStart} className="w-full rounded-2xl py-3.5 text-[15px] font-medium transition-transform active:scale-[0.98]" style={{ background: '#4A3B32', color: '#FBF9F1', border: 'none' }}>开始专注</button>
          </div>
        </div>
      )}

      {showRecovery && recoveryFocus && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center" style={{ background: 'rgba(74,59,50,0.25)' }}>
          <div className="fz-card mx-5 w-full max-w-[320px] p-6" style={{ borderRadius: 18 }}>
            <h3 className="text-center text-[18px] font-medium" style={{ color: '#4A3B32' }}>检测到未完成的专注</h3>
            <p className="mt-2 text-center text-[12px]" style={{ color: 'rgba(74,59,50,0.62)' }}>{(recoveryFocus.customType || recoveryFocus.type)} · 剩余 {formatTime(recoveryFocus.remainingSeconds)}</p>
            <div className="mt-5 flex gap-3">
              <button onClick={handleRecoveryResume} className="flex-1 rounded-full py-2.5 font-medium transition-transform active:scale-95" style={{ background: '#4A3B32', color: '#FBF9F1' }}>恢复专注</button>
              <button onClick={handleRecoveryAbandon} className="flex-1 rounded-full py-2.5 font-medium transition-transform active:scale-95" style={{ background: 'rgba(74,59,50,0.06)', color: 'rgba(74,59,50,0.7)' }}>放弃</button>
            </div>
          </div>
        </div>
      )}

      {showComplete && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center" style={{ background: 'rgba(74,59,50,0.25)' }}>
          <div className="fz-card mx-5 w-full max-w-[320px] p-6 text-center" style={{ borderRadius: 18 }}>
            <div className="mb-3 text-4xl" style={{ color: '#B8956A' }}>✦</div>
            <h3 className="text-[18px] font-medium" style={{ color: '#4A3B32' }}>今日专注完成</h3>
            <p className="mt-2 text-[12px]" style={{ color: 'rgba(74,59,50,0.62)' }}>
              {(isCustomType && customType ? customType : selectedType)} · {formatTime(freeTimer ? displayElapsed : (selectedDuration * 60 - displayRemaining))}
            </p>
            <button onClick={handleCloseComplete} className="relative mt-5 w-full rounded-2xl py-3.5 text-[15px] font-medium" style={{ background: '#4A3B32', color: '#FBF9F1', border: 'none' }}>好的</button>
          </div>
        </div>
      )}

      {/* 上传状态 Toast */}
      {bgToast && (
        <div className="absolute left-1/2 top-[12%] z-[80] -translate-x-1/2 rounded-full px-4 py-2 text-[13px]" style={{ background: 'rgba(74,59,50,0.92)', color: '#FBF9F1', boxShadow: '0 4px 20px rgba(74,59,50,0.3)' }}>
          {bgToast}
        </div>
      )}
    </div>
  )
}

// 目标历史页：浅色芍药风，只读展示已归档（已完成）的目标，数据来自 GoalData.loadCompletedDreams()
function GoalHistoryPage({ onBack }: { onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const completed = ((): GoalData.CompletedDream[] => {
    try {
      return GoalData.loadCompletedDreams()
    } catch {
      return []
    }
  })()

  const filtered = searchTerm.trim()
    ? completed.filter((d) => (d.title + d.description).includes(searchTerm.trim()))
    : completed

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus()
  }, [searchOpen])

  const fmtDate = (date: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || '')
    if (!m) return date || '未知日期'
    const month = parseInt(m[2], 10)
    const day = parseInt(m[3], 10)
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`)
    const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
    return `${month}月${day}日 ${week}`
  }

  return (
    <div className="app-scrollbar absolute inset-x-0 w-full overflow-y-auto paper-texture" style={{ top: '36px', bottom: '73px' }}>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-stone-200/70 bg-background/80 px-4 pb-3 pt-4 backdrop-blur-md">
        <button
          onClick={onBack}
          aria-label="返回目标页"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="min-w-0 flex-1 font-serif text-[17px] font-semibold text-foreground">目标历史</h1>
        {completed.length > 0 && (
          searchOpen ? (
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索目标…"
              className="h-9 w-40 rounded-xl border border-stone-200 bg-stone-50 px-3 text-[13px] text-foreground outline-none transition-all focus:w-48 focus:border-sakura/40"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="搜索"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground"
            >
              <Search size={17} />
            </button>
          )
        )}
      </div>

      {completed.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-8 pt-24 text-center">
          <History size={40} className="text-sakura/50" />
          <p className="text-[15px] font-medium text-foreground">还没有已完成的目标</p>
          <p className="text-[12px] leading-relaxed text-muted-foreground/70">
            当你在目标页点「完成」归档一个目标后，<br />它会出现在这里留作纪念。
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-8 pt-24 text-center">
          <Search size={36} className="text-muted-foreground/40" />
          <p className="text-[14px] text-muted-foreground/70">没有匹配「{searchTerm.trim()}」的目标</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-1 rounded-md border border-stone-200 px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-stone-50 hover:text-foreground"
          >
            清除搜索
          </button>
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          <p className="px-1 text-[12px] text-muted-foreground/60">共 {filtered.length} 个已完成的目标</p>
          {filtered.map((d, idx) => (
            <div
              key={d.completedAt + idx}
              className="rounded-xl border border-stone-200/80 bg-background/60 px-4 py-3.5 transition-colors hover:bg-stone-50/70"
            >
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <h2 className="font-serif text-[16px] font-semibold leading-snug text-foreground">{d.title}</h2>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600 border border-green-200/60">
                  <CheckCircle2 size={12} strokeWidth={1.8} />
                  已完成
                </span>
              </div>
              {d.description && (
                <p className="mb-2.5 text-[12px] leading-relaxed text-muted-foreground/80 break-all">{d.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-200/60 pt-2 text-[11px] text-muted-foreground/70">
                {d.deadline && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-sakura/70" />
                    截止 {fmtDate(d.deadline)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-green-400/70" />
                  完成于 {fmtDate(d.completedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-sakura/70" />
                  坚持 {d.totalCheckInDays} 天
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 专注历史页：Steam 风格总览（一级）+ 标签明细（二级），数据只读自 localStorage.focusRecords
interface FocusGroup {
  key: string
  label: string
  totalSeconds: number
  count: number
  lastDate: string
}

function FocusHistoryPage({ onBack }: { onBack: () => void }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const records = ((): FocusRecord[] => {
    try {
      const raw = localStorage.getItem('focusRecords')
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  const groups = useMemo<FocusGroup[]>(() => {
    const map = new Map<string, FocusGroup>()
    for (const r of records) {
      if (r.status !== 'completed') continue
      const key = r.customType || r.type
      if (!key) continue
      const existing = map.get(key)
      if (existing) {
        existing.totalSeconds += r.completedDuration || 0
        existing.count += 1
        if (r.date > existing.lastDate) existing.lastDate = r.date
      } else {
        map.set(key, {
          key,
          label: key,
          totalSeconds: r.completedDuration || 0,
          count: 1,
          lastDate: r.date || '',
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSeconds - a.totalSeconds)
  }, [records])

  // 以投入总时长最高的标签为满格基准，用于进度条占比
  const maxTotal = groups.length ? groups[0].totalSeconds : 0

  // 搜索过滤：按标签名实时模糊匹配（含系统标签与自定义标签）
  const filteredGroups = searchTerm.trim()
    ? groups.filter((g) => g.label.includes(searchTerm.trim()))
    : groups

  const selectedGroup = selectedKey ? groups.find((g) => g.key === selectedKey) || null : null
  const detailRecords = useMemo(() => {
    if (!selectedGroup) return []
    return records
      .filter((r) => (r.customType || r.type) === selectedGroup.key && r.status === 'completed')
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [records, selectedGroup])

  // 月份+日（如 "8月1日"）+ 周几
  const fmtDate = (date: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || '')
    if (!m) return date || '未知日期'
    const month = parseInt(m[2], 10)
    const day = parseInt(m[3], 10)
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`)
    const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
    return `${month}月${day}日 ${week}`
  }

  return (
    <div className="absolute inset-x-0 w-full overflow-y-auto app-scrollbar" style={{ top: '0', bottom: '0', background: '#1C1722' }}>
      {/* 一级总览（Steam 风） */}
      {!selectedKey && (
        <>
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 pt-[calc(1rem+var(--wi-sb,0px))] pb-3" style={{ background: 'rgba(28,23,34,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(243,226,192,0.12)' }}>
            <button onClick={onBack} aria-label="返回专注页" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/5" style={{ color: 'rgba(247,241,232,0.8)' }}>
              <ChevronLeft size={22} />
            </button>
            <h1 className="min-w-0 flex-1 text-[17px] font-semibold" style={{ color: '#F7F1E8' }}>专注历史</h1>
            {/* 搜索按钮 / 输入框 */}
            {searchOpen ? (
              <div className="flex items-center gap-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索标签…"
                  className="h-9 w-36 rounded-xl border px-3 text-[13px] outline-none transition-all focus:w-48 placeholder:text-[rgba(247,241,232,0.35)]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(217,179,106,0.35)',
                    color: '#F7F1E8',
                  }}
                  autoFocus
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchTerm('') }}
                  aria-label="关闭搜索"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/5"
                  style={{ color: 'rgba(247,241,232,0.6)' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="搜索标签"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/5"
                style={{ color: 'rgba(247,241,232,0.65)' }}
              >
                <Search size={20} />
              </button>
            )}
          </div>

          <div className="px-4 py-4">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 pt-24 text-center">
                <History size={40} style={{ color: 'rgba(217,179,106,0.6)' }} />
                <p className="text-[14px]" style={{ color: 'rgba(247,241,232,0.6)' }}>还没有专注记录</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 pt-16 text-center">
                <Search size={32} style={{ color: 'rgba(217,179,106,0.45)' }} />
                <p className="text-[14px]" style={{ color: 'rgba(247,241,232,0.5)' }}>未找到匹配「{searchTerm}」的标签</p>
                <p className="text-[12px]" style={{ color: 'rgba(247,241,232,0.35)' }}>试试其他关键词</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredGroups.map((g) => {
                  const ratio = maxTotal > 0 ? g.totalSeconds / maxTotal : 0
                  return (
                  <button
                    key={g.key}
                    onClick={() => setSelectedKey(g.key)}
                    className="flex flex-col rounded-2xl px-4 py-4 text-left transition-all duration-150 hover:-translate-y-0.5"
                    style={{ background: '#2A2622', border: '1px solid rgba(243,226,192,0.10)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(217,179,106,0.5)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(243,226,192,0.10)')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium" style={{ color: '#FFFFFF' }}>{g.label}</p>
                        <p className="mt-1 text-[12px]" style={{ color: 'rgba(247,241,232,0.5)' }}>
                          近一次 {g.lastDate ? fmtDate(g.lastDate) : '—'} · 共 {g.count} 次
                        </p>
                      </div>
                      <p className="ml-3 shrink-0 font-serif text-[26px] leading-none" style={{ color: '#D9B36A' }}>
                        {formatFocusDuration(g.totalSeconds)}
                      </p>
                    </div>
                    {/* Steam 风投入进度条：占比越高，颜色从蓝偏移到暖橙 */}
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-[width,background-color] duration-500"
                        style={{ width: `${ratio * 100}%`, background: focusBarColor(ratio) }}
                      />
                    </div>
                  </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 二级明细 */}
      {selectedKey && selectedGroup && (
        <>
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 pt-[calc(1rem+var(--wi-sb,0px))] pb-3" style={{ background: 'rgba(28,23,34,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(243,226,192,0.12)' }}>
            <button onClick={() => setSelectedKey(null)} aria-label="返回总览" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/5" style={{ color: 'rgba(247,241,232,0.8)' }}>
              <ChevronLeft size={22} />
            </button>
            <h1 className="text-[17px] font-semibold" style={{ color: '#F7F1E8' }}>{selectedGroup.label}</h1>
            <span className="ml-auto text-[12px]" style={{ color: 'rgba(247,241,232,0.5)' }}>共 {selectedGroup.count} 次 · {formatFocusDuration(selectedGroup.totalSeconds)}</span>
          </div>

          <div className="px-4 py-4">
            <div className="flex flex-col gap-2.5">
              {detailRecords.map((r) => (
                <div key={r.id} className="rounded-xl border p-3" style={{ background: 'rgba(246,235,221,0.06)', borderColor: 'rgba(243,226,192,0.14)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px]" style={{ color: '#F7F1E8' }}>{fmtDate(r.date)}</span>
                    <span className="text-[14px] font-medium" style={{ color: '#B8956A' }}>{formatFocusDuration(r.completedDuration || 0)}</span>
                  </div>
                  <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[11px]" style={{ background: 'rgba(217,179,106,0.15)', color: '#E8C98A' }}>{selectedGroup.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// —— 备忘录模块 ——
type MemoCategory = string  // 分类为开放字符串，允许用户自定义
type MemoTab = '全部' | '置顶' | MemoCategory

type NoteType = 'text' | 'todo' | 'inspiration'

interface MemoItem {
  id: string
  title: string
  content: string    // 正文，checkbox 行用 - [ ] / - [x]  开头
  tags: string[]     // 自由标签
  category: MemoCategory
  pinned: boolean
  createdAt: number
  updatedAt: number
  noteType?: NoteType  // 笔记类型（可选保持兼容）
}

// 默认分类（不可删除）
const DEFAULT_CATEGORIES: MemoCategory[] = ['工作', '生活']
const isDefaultCategory = (c: string) => DEFAULT_CATEGORIES.includes(c)
const MEMO_KEY = 'warmFengMemo'
const CATEGORIES_KEY = 'warmFengMemoCategories'

function loadCategories(): MemoCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY)
    if (!raw) return [...DEFAULT_CATEGORIES]
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return [...DEFAULT_CATEGORIES]
    // 默认分类始终保留 + 追加用户自定义的（去重）
    const custom = arr.filter((c): c is string => typeof c === 'string' && !isDefaultCategory(c))
    const merged = [...DEFAULT_CATEGORIES]
    for (const c of custom) if (!merged.includes(c)) merged.push(c)
    return merged
  } catch {
    return [...DEFAULT_CATEGORIES]
  }
}

function saveCategories(list: MemoCategory[]) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list))
}

function loadMemos(): MemoItem[] {
  try {
    const raw = localStorage.getItem(MEMO_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    const inferNoteType = (content: string): NoteType => {
      if (/^- \[[ x]\] /m.test(content)) return 'todo'
      return 'text'
    }
    return arr.map((m: Record<string, unknown>) => {
      // 迁移旧版数据（曾含 type / items）
      if (typeof m.content !== 'string') {
        const oldItems = Array.isArray((m as { items?: unknown[] }).items) ? (m as { items?: unknown[] }).items! : []
        const content = oldItems.map((it: unknown) => {
          const i = it as Record<string, unknown>
          return `- [${i.done ? 'x' : ' '}] ${i.text || ''}`
        }).join('\n')
        return {
          id: m.id as string,
          title: (m.title as string) || '',
          content,
          tags: Array.isArray(m.tags) ? m.tags as string[] : [],
          category: (m.category as MemoCategory) || '工作',
          pinned: Boolean(m.pinned),
          createdAt: (m.createdAt as number) || Date.now(),
          updatedAt: (m.updatedAt as number) || Date.now(),
          noteType: inferNoteType(content),
        }
      }
      const content = (m.content as string) || ''
      return {
        id: m.id as string,
        title: (m.title as string) || '',
        content,
        tags: Array.isArray(m.tags) ? m.tags as string[] : [],
        category: (m.category as MemoCategory) || '工作',
        pinned: Boolean(m.pinned),
        createdAt: (m.createdAt as number) || Date.now(),
        updatedAt: (m.updatedAt as number) || Date.now(),
        noteType: (m.noteType as NoteType | undefined) || inferNoteType(content),
      }
    })
  } catch {
    return []
  }
}

function saveMemos(list: MemoItem[]) {
  localStorage.setItem(MEMO_KEY, JSON.stringify(list))
}

function fmtMemoTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const yDay = new Date(now)
  yDay.setDate(yDay.getDate() - 1)
  const sameY = yDay.toDateString() === d.toDateString()
  const sameYear = d.getFullYear() === now.getFullYear()
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  const HM = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (sameDay) return `今天 ${HM}`
  if (sameY) return `昨天 ${HM}`
  if (sameYear) return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${HM}`
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${HM}`
}

export interface MemoPageHandle {
  triggerNew: () => void
  toggleSearch: () => void
  isSearchOpen: () => boolean
  toggleCategoryMgr: () => void
}

const MemoPage = forwardRef<MemoPageHandle, { onBack: () => void; embedded?: boolean }>(function MemoPage({ onBack, embedded }, ref) {
  const [memos, setMemos] = useState<MemoItem[]>(() => loadMemos())
  const [searchTerm, setSearchTerm] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [tab, setTab] = useState<MemoTab>('全部')
  const [actionTarget, setActionTarget] = useState<MemoItem | null>(null)
  const [categoryMgrOpen, setCategoryMgrOpen] = useState(false)
  const [editing, setEditing] = useState<MemoItem | null>(null)
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null)
  const [categories, setCategories] = useState<MemoCategory[]>(() => loadCategories())
  const tabScrollRef = useRef<HTMLDivElement>(null)
  const [showRightFade, setShowRightFade] = useState(false)

  const updateTabFade = useCallback(() => {
    const el = tabScrollRef.current
    if (!el) return
    const { scrollWidth, clientWidth, scrollLeft } = el
    setShowRightFade(scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  // 弹窗通过 portal 渲染到画布层（绕开 MemoPage 的 absolute 中间层）
  useEffect(() => {
    setPortalHost(document.getElementById('app-canvas'))
  }, [])

  // 标签数量/搜索展开变化后，重新计算右侧渐变遮罩
  useEffect(() => {
    updateTabFade()
  }, [categories, searchOpen, updateTabFade])

  // 暴露方法给父组件（DiaryModule tab 行按钮调用）
  useImperativeHandle(ref, () => ({
    triggerNew: handleNew,
    toggleSearch: () => setSearchOpen(v => !v),
    isSearchOpen: () => searchOpen,
    toggleCategoryMgr: () => setCategoryMgrOpen(v => !v),
  }), [searchOpen])

  const addCategory = (name: string) => {
    const next = [...categories, name]
    setCategories(next)
    saveCategories(next)
  }
  const removeCategory = (name: string) => {
    const next = categories.filter((c) => c !== name)
    setCategories(next)
    saveCategories(next)
  }

  const persist = (next: MemoItem[]) => {
    setMemos(next)
    saveMemos(next)
  }

  const removeMemo = (id: string) => {
    persist(memos.filter((m) => m.id !== id))
    setActionTarget(null)
  }

  const togglePin = (id: string) => {
    persist(memos.map((m) => (m.id === id ? { ...m, pinned: !m.pinned, updatedAt: Date.now() } : m)))
    setActionTarget(null)
  }

  const toggleContentCheckbox = (memoId: string, lineIdx: number) => {
    persist(memos.map((m) => {
      if (m.id !== memoId) return m
      const lines = m.content.split('\n')
      const line = lines[lineIdx] || ''
      if (/^- \[ \] /.test(line)) lines[lineIdx] = line.replace('- [ ] ', '- [x] ')
      else if (/^- \[x\] /.test(line)) lines[lineIdx] = line.replace('- [x] ', '- [ ] ')
      else return m
      return { ...m, content: lines.join('\n'), updatedAt: Date.now() }
    }))
  }

  const changeCategory = (id: string, category: MemoCategory) => {
    persist(memos.map((m) => (m.id === id ? { ...m, category, updatedAt: Date.now() } : m)))
    setActionTarget(null)
  }

  const handleEdit = (m: MemoItem) => setEditing(m)
  const handleNew = () => setEditing({
    id: '',
    title: '',
    content: '',
    tags: [],
    category: DEFAULT_CATEGORIES[0],
    pinned: false,
    createdAt: 0,
    updatedAt: 0,
  })
  const handleSave = (draft: Omit<MemoItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: number }) => {
    const now = Date.now()
    if (draft.id) {
      // 编辑
      persist(memos.map((m) => (m.id === draft.id
        ? { ...m, ...draft, id: m.id, createdAt: m.createdAt, updatedAt: now } as MemoItem
        : m)))
    } else {
      // 新建
      const newMemo: MemoItem = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        title: draft.title,
        content: draft.content,
        tags: draft.tags,
        category: draft.category,
        pinned: draft.pinned,
        createdAt: now,
        updatedAt: now,
      }
      persist([newMemo, ...memos])
    }
    setEditing(null)
  }

  const filtered = useMemo(() => {
    let list = memos
    if (tab === '置顶') list = memos.filter((m) => m.pinned)
    else if (tab !== '全部') list = memos.filter((m) => m.category === tab)
    const term = searchTerm.trim().toLowerCase()
    if (term) {
      list = list.filter((m) => {
        const fields = [m.title, m.content, m.category, ...m.tags]
        return fields.some((f) => f.toLowerCase().includes(term))
      })
    }
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
  }, [memos, tab, searchTerm])

  const tabs: MemoTab[] = ['全部', '置顶', ...categories]

  return (
    <div className={embedded ? 'flex flex-col flex-1' : 'app-scrollbar absolute inset-x-0 w-full overflow-y-auto paper-texture'} style={embedded ? undefined : { top: '36px', bottom: '73px' }}>
      {/* 顶栏：独立模式完整顶栏；embedded模式下不渲染（由外层DiaryModule的tab行提供） */}
      {!embedded && (
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200/70 bg-background/85 px-4 pb-3 pt-4 backdrop-blur-md">
        <button
          onClick={onBack}
          aria-label="返回首页"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="min-w-0 flex-1 font-serif text-[17px] font-semibold text-foreground">备忘录</h1>
        <button
          onClick={() => setSearchOpen(v => !v)}
          aria-label="搜索备忘录"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${searchOpen ? 'bg-stone-100 text-foreground' : 'text-muted-foreground hover:bg-stone-100 hover:text-foreground'}`}
        >
          {searchOpen ? <X size={18} strokeWidth={2} /> : <Search size={18} strokeWidth={2} />}
        </button>
        <button
          onClick={handleNew}
          aria-label="新建备忘录"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground"
        >
          <Plus size={18} strokeWidth={2} />
        </button>
        <button
          onClick={() => setCategoryMgrOpen(true)}
          aria-label="分类管理"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-stone-100 hover:text-foreground"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
      )}

      {/* 搜索框：点击搜索图标后展开 */}
      {searchOpen && (
        <div className="border-b border-stone-200/50 bg-background/90 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
            <Search size={15} className="text-muted-foreground/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索备忘录、标签、内容…"
              autoFocus
              className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} aria-label="清空搜索" className="text-muted-foreground/50 hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className={embedded ? 'bg-background/85 relative' : 'sticky top-[61px] z-10 bg-background/85 backdrop-blur-md relative'}>
        <div
          ref={tabScrollRef}
          onScroll={updateTabFade}
          className="scrollbar-x items-center gap-2 px-4 py-2"
        >
          {tabs.map((t) => {
            const selected = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${selected ? 'bg-sakura text-white' : 'border border-stone-200 bg-card text-muted-foreground'}`}
              >
                {t}
              </button>
            )
          })}
          <button
            onClick={() => setCategoryMgrOpen(true)}
            aria-label="分类管理"
            className="shrink-0 rounded-full border border-stone-200 bg-card px-2 py-1.5 text-muted-foreground"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        {showRightFade && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background/90 to-transparent" />
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-28 pt-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 pt-24 text-center">
            <NotebookPen size={40} className="text-muted-foreground/30" />
            <p className="text-[14px] text-muted-foreground/70">
              {searchTerm.trim()
                ? `未找到匹配「${searchTerm}」的备忘`
                : tab === '置顶'
                  ? '还没有置顶的备忘'
                  : '写下第一条备忘录'}
            </p>
            {!searchTerm.trim() && tab !== '置顶' && (
              <p className="text-[12px] text-muted-foreground/40">点右下角 + 新建，或长按卡片操作</p>
            )}
          </div>
        ) : (
          filtered.map((m) => (
            <MemoCard
              key={m.id}
              memo={m}
              onEdit={() => handleEdit(m)}
              onLongPress={() => setActionTarget(m)}
              onToggleCheckbox={(lineIdx) => toggleContentCheckbox(m.id, lineIdx)}
            />
          ))
        )}
      </div>

      {portalHost && actionTarget && createPortal(
        <MemoActionSheet
          memo={actionTarget}
          categories={categories}
          onClose={() => setActionTarget(null)}
          onTogglePin={() => togglePin(actionTarget.id)}
          onEdit={() => { handleEdit(actionTarget); setActionTarget(null) }}
          onDelete={() => removeMemo(actionTarget.id)}
          onChangeCategory={(c) => changeCategory(actionTarget.id, c)}
        />,
        portalHost,
      )}

      {portalHost && categoryMgrOpen && createPortal(
        <CategoryManager
          categories={categories}
          onClose={() => setCategoryMgrOpen(false)}
          onAdd={addCategory}
          onRemove={removeCategory}
        />,
        portalHost,
      )}

      {portalHost && editing && createPortal(
        <MemoEditor
          initial={editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />,
        portalHost,
      )}
    </div>
  )
})

function MemoCard({
  memo, onEdit, onLongPress, onToggleCheckbox,
}: {
  memo: MemoItem
  onEdit: () => void
  onLongPress: () => void
  onToggleCheckbox: (lineIdx: number) => void
}) {
  const longPressFiredRef = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePointerDown = () => {
    longPressFiredRef.current = false
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      longPressFiredRef.current = true
      onLongPress()
      timer.current = null
    }, 500)
  }
  const handlePointerEnd = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }
  const handleClick = (e: React.MouseEvent) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      e.preventDefault()
      return
    }
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    onEdit()
  }

  // 待办模式：优先看 noteType 字段，若缺失则检查 content 是否包含 checkbox 语法（兼容旧数据）
  const inferIsTodo = (m: MemoItem): boolean => {
    const nt = m.noteType
    if (nt === 'todo') return true
    if (nt === 'text' || nt === 'inspiration') return false
    // noteType 缺失时，检查 content 格式
    return /^- \[[ x]\] /m.test(m.content || '')
  }
  const isTodo = inferIsTodo(memo)
  const rawLines = isTodo && memo.content ? memo.content.split('\n') : []
  const checkboxLines: { lineIdx: number; text: string; done: boolean }[] = []
  const plainLines: string[] = []

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]
    const m = line.match(/^- \[([ x])\] (.+)$/)
    if (m) {
      checkboxLines.push({ lineIdx: i, text: m[2], done: m[1] === 'x' })
    } else {
      plainLines.push(line)
    }
  }

  const hasCheckbox = isTodo && checkboxLines.length > 0
  const pending = checkboxLines.filter((c) => !c.done)
  const done = checkboxLines.filter((c) => c.done)
  const [showDone, setShowDone] = useState(false)
  const plainText = plainLines.filter((l) => l.trim()).join('\n')
  // 文本模式正文（富文本 HTML，兼容旧纯文本：无标签时直接当文本渲染）
  const memoHtml = isTodo ? '' : (memo.content || '')

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={handleClick}
      className={`relative cursor-pointer rounded-2xl border bg-card px-4 py-3.5 transition-colors ${memo.pinned ? 'border-sakura/30' : 'border-stone-200/70'}`}
      style={memo.pinned ? { boxShadow: '0 6px 18px -10px rgba(217,179,106,0.45)' } : undefined}
    >
      {memo.pinned && <span aria-hidden className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-sakura" />}
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 break-words text-[15px] font-semibold text-foreground">{memo.title || '（无标题）'}</h3>
        {memo.pinned && <Pin size={14} className="mt-1 shrink-0 text-sakura" />}
      </div>

      {/* 文本/灵感模式：渲染富文本 HTML（限定 memo-content 作用域样式，兼容旧纯文本） */}
      {!isTodo && memoHtml && (
        <div
          className="memo-content mt-1.5 line-clamp-3 break-words text-[14px] leading-relaxed text-foreground/85 empty:hidden"
          dangerouslySetInnerHTML={{ __html: memoHtml }}
        />
      )}

      {/* 待办模式下的普通文本（非 checkbox 行） */}
      {isTodo && plainText && (
        <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-foreground/85">{plainText}</p>
      )}

      {/* checkbox 行，未展开时只显示两行 */}
      {hasCheckbox && (
        <div className={`flex flex-col gap-1.5 line-clamp-2 ${plainText ? 'mt-2' : 'mt-1.5'}`}>
          {pending.map((c) => (
            <button
              key={c.lineIdx}
              onClick={(e) => { e.stopPropagation(); onToggleCheckbox(c.lineIdx) }}
              className="flex items-start gap-2 text-left"
            >
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-stone-300" />
              <span className="text-[14px] leading-relaxed break-words text-foreground">{c.text}</span>
            </button>
          ))}
          {done.length > 0 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setShowDone((v) => !v) }}
                className="mt-1 self-start text-[12px] text-muted-foreground/60 hover:text-foreground"
              >
                {showDone ? '收起已完成' : `查看已完成 (${done.length})`}
              </button>
              {showDone && done.map((c) => (
                <button
                  key={c.lineIdx}
                  onClick={(e) => { e.stopPropagation(); onToggleCheckbox(c.lineIdx) }}
                  className="flex items-start gap-2 text-left"
                >
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-sakura bg-sakura">
                    <Check size={10} strokeWidth={3} className="text-white" />
                  </span>
                  <span className="text-[14px] leading-relaxed text-muted-foreground/45 break-words line-through">{c.text}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/60">
        <span>{fmtMemoTime(memo.updatedAt)}</span>
        <span className="text-muted-foreground/30">·</span>
        <span>#{memo.category}</span>
      </div>
    </div>
  )
}

// 备忘录工具栏样式按钮：图标或文字 + 防止点击时编辑区失焦
function MemoToolButton({
  icon: Icon, label, active, onClick,
}: {
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className={`flex h-9 min-w-[26px] flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[11px] font-semibold transition-colors ${
        active ? 'bg-[#FFF0D4] text-[#E0A93B]' : 'text-[#8B7355] hover:text-[#FFC145]'
      }`}
    >
      {Icon ? <Icon size={17} strokeWidth={1.8} /> : <span>{label}</span>}
      {Icon && <span className="text-[9px] font-normal">{label}</span>}
    </button>
  )
}

function MemoEditor({
  initial, categories, onCancel, onSave,
}: {
  initial: MemoItem
  categories: MemoCategory[]
  onCancel: () => void
  onSave: (draft: Omit<MemoItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: number }) => void
}) {
  const isNew = !initial.id

  const inferNoteType = (content: string): NoteType => {
    if (/^- \[[ x]\] /m.test(content)) return 'todo'
    return 'text'
  }

  const parseTodos = (content: string): { text: string; done: boolean }[] => {
    return content.split('\n').map((line) => {
      const m = line.match(/^- \[([ x])\] (.+)$/)
      if (m) return { text: m[2], done: m[1] === 'x' }
      return { text: line, done: false }
    }).filter((t) => t.text.trim() || !t.done)
  }

  const [noteType, setNoteType] = useState<NoteType>(initial.noteType || inferNoteType(initial.content))
  const [title, setTitle] = useState(initial.title)
  const [textContent, setTextContent] = useState('') // 文本模式富文本 HTML（或旧纯文本，渲染时兼容）
  const [textInitialized, setTextInitialized] = useState(false)
  const [todoItems, setTodoItems] = useState<{ text: string; done: boolean }[]>([])
  const [tags, setTags] = useState<string[]>(initial.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [tagInputOpen, setTagInputOpen] = useState(false)
  const [category, setCategory] = useState<MemoCategory>(initial.category)
  const [pinned, setPinned] = useState(initial.pinned)
  const [showTypePicker, setShowTypePicker] = useState(false)

  // 富文本编辑区引用与激活态
  const memoEditRef = useRef<HTMLDivElement | null>(null)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [activeHeading, setActiveHeading] = useState<'' | 'H1' | 'H2' | 'H3'>('')

  // 同步当前选区样式激活态
  const syncMemoState = () => {
    const el = memoEditRef.current
    if (!el) return
    setIsBold(document.queryCommandState('bold'))
    setIsItalic(document.queryCommandState('italic'))
    setIsUnderline(document.queryCommandState('underline'))
    // 检查光标当前是否处于行内 H1/H2/H3 预设（span.h-tag）内 —— 用于工具栏高亮
    let tag: '' | 'H1' | 'H2' | 'H3' = ''
    try {
      const node = window.getSelection()?.anchorNode
      let el2: HTMLElement | null = node?.parentElement || null
      while (el2 && el2 !== el) {
        if (el2.classList?.contains('h-tag')) {
          const fs = (el2 as HTMLElement).style.fontSize
          if (fs === '20px') tag = 'H1'
          else if (fs === '17px') tag = 'H2'
          else if (fs === '15px') tag = 'H3'
          break
        }
        el2 = el2.parentElement
      }
    } catch { /* ignore */ }
    setActiveHeading(tag)
  }

  // 执行富文本命令（粗体/斜体/下划线）
  const execMemo = (cmd: string) => {
    const el = memoEditRef.current
    if (!el) return
    el.focus()
    document.execCommand(cmd, false)
    syncMemoState()
  }

  // 标题：行内预设，不换行、不新建段落。
  // 点 H：从光标处开始套用内联大字号（span.h-tag），之后输入的字变大，
  // 光标之前已输入的文字完全不变；同一行可混排（前正常 + 后 H 字号）。
  // 再点同一标题 = 取消：已输入的 H 文字保留原字号，光标移到其后方，之后输入恢复标准。
  const MEMO_HEADING_SIZES: Record<'H1' | 'H2' | 'H3', string> = { H1: '20px', H2: '17px', H3: '15px' }

  // 找到光标所在的行内标题 span（h-tag），不在其中则返回 null
  const findMemoHeadingSpan = (root: HTMLElement): HTMLElement | null => {
    const node = window.getSelection()?.anchorNode ?? null
    let cur: HTMLElement | null = node instanceof HTMLElement ? node : node?.parentElement || null
    while (cur && cur !== root) {
      if (cur.classList?.contains('h-tag')) return cur
      cur = cur.parentElement
    }
    return null
  }

  // 把光标移出行内标题 span：已输入内容保留原字号；span 为空则整体移除。
  // 移出后在 span 后补一个零宽字符，避免浏览器让后续输入继承大字号
  const exitMemoHeadingSpan = (span: HTMLElement) => {
    const sel = window.getSelection()
    if (!sel) return
    const doc = span.ownerDocument
    const isEmpty = !(span.textContent || '').replace(/\u200B/g, '').trim()
    const range = doc.createRange()
    if (isEmpty) {
      // 还没输入过内容：整个 span 移除，光标放回原位
      range.setStartBefore(span)
      span.parentNode?.removeChild(span)
      range.collapse(true)
    } else {
      // 已有内容：保留 span，光标移到其后的零宽字符之后
      const stopper = doc.createTextNode('\u200B')
      span.parentNode?.insertBefore(stopper, span.nextSibling)
      range.setStart(stopper, 1)
      range.collapse(true)
    }
    sel.removeAllRanges()
    sel.addRange(range)
  }

  const execMemoHeading = (h: 'H1' | 'H2' | 'H3') => {
    const el = memoEditRef.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    // 仅处理编辑区内的光标
    if (!el.contains(sel.getRangeAt(0).commonAncestorContainer)) return

    const current = findMemoHeadingSpan(el)
    // 再点同一标题 = 取消，回到标准字号输入
    if (current && current.style.fontSize === MEMO_HEADING_SIZES[h]) {
      exitMemoHeadingSpan(current)
      syncMemoState()
      return
    }
    // 正处于其他标题中：先退出（保留已输入内容），再应用新标题
    if (current) exitMemoHeadingSpan(current)

    const doc = el.ownerDocument
    const range = sel.getRangeAt(0)
    const span = doc.createElement('span')
    span.className = 'h-tag'
    span.style.fontSize = MEMO_HEADING_SIZES[h]
    span.style.fontWeight = '600'

    const caret = doc.createRange()
    if (!range.collapsed) {
      // 有选中文本：把选区内容包进标题 span，光标停在其末尾
      span.appendChild(range.extractContents())
      range.insertNode(span)
      caret.selectNodeContents(span)
      caret.collapse(false)
    } else {
      // 无选区：在光标处插入含零宽占位符的标题 span，之后输入即进入其中
      span.appendChild(doc.createTextNode('\u200B'))
      range.insertNode(span)
      caret.setStart(span.firstChild as Text, 1)
      caret.collapse(true)
    }
    sel.removeAllRanges()
    sel.addRange(caret)
    syncMemoState()
  }

  // 初始化内容
  useEffect(() => {
    const type = initial.noteType || inferNoteType(initial.content)
    setNoteType(type)
    setTitle(initial.title)
    setTags(initial.tags || [])
    setCategory(initial.category)
    setPinned(initial.pinned)
    setTextInitialized(false)
    if (type === 'todo') {
      setTodoItems(parseTodos(initial.content))
    } else {
      setTextContent(initial.content)
    }
  }, [initial.id])

  // 类型切换时转换内容
  const handleTypeChange = (newType: NoteType) => {
    if (newType === noteType) return
    if (noteType === 'todo' && newType !== 'todo') {
      // 待办 → 文本/灵感：拼接纯文本（去掉 checkbox 标记）
      const plain = todoItems.map((t) => t.text).filter(Boolean).join('\n')
      setTextContent(plain)
      setTextInitialized(false)
    } else if (noteType !== 'todo' && newType === 'todo') {
      // 文本/灵感 → 待办：把富文本 HTML 里的文本按行拆分（去除标签取纯文本）
      const plain = textContent
        .replace(/<br\s*\/?>(?=)/gi, '\n')
        .replace(/<\/(p|div|h1|h2|h3|li)>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .split('\n')
        .map((l) => l.trim().replace(/^- \[[ x]\] /, ''))
        .filter((l) => l.trim())
        .map((l) => ({ text: l, done: false }))
      // 正文为空时也要保留一条空白待办项作为输入入口，否则无可编辑的 input
      setTodoItems(plain.length > 0 ? plain : [{ text: '', done: false }])
    }
    setNoteType(newType)
    setShowTypePicker(false)
  }

  // 保存
  const handleSave = () => {
    let content = ''
    if (noteType === 'todo') {
      content = todoItems
        .filter((t) => t.text.trim())
        .map((t) => `- [${t.done ? 'x' : ' '}] ${t.text.trim()}`)
        .join('\n')
    } else {
      // 文本/灵感模式：优先取富文本编辑区当前 HTML，未初始化则回退到 state
      // 去掉编辑期插入的零宽占位符，避免空标题 span 的残留字符进入保存内容
      const html = (memoEditRef.current?.innerHTML ?? textContent).replace(/\u200B/g, '')
      content = html && html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() ? html : ''
    }
    if (!title.trim() && !content.trim()) return
    onSave({
      id: initial.id || undefined,
      createdAt: initial.createdAt || undefined,
      title: title.trim(),
      content,
      tags,
      category,
      pinned,
      noteType,
    })
  }

  // 标签处理
  const addTag = (raw: string) => {
    const t = raw.trim().replace(/^#/, '').replace(/[\s,]/g, '')
    if (t && !tags.includes(t)) setTags([...tags, t])
  }
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  // 待办操作
  const toggleTodo = (idx: number) => {
    const next = [...todoItems]
    next[idx] = { ...next[idx], done: !next[idx].done }
    setTodoItems(next)
  }
  const updateTodoText = (idx: number, text: string) => {
    const next = [...todoItems]
    next[idx] = { ...next[idx], text }
    // 最后一行有内容时自动追加空行
    if (idx === next.length - 1 && text.trim() && next.length < 50) {
      next.push({ text: '', done: false })
    }
    // 清理中间的空行（但保留最后一行空行供输入）
    const cleaned = next.filter((t, i) => i === next.length - 1 || t.text.trim() || t.done)
    if (cleaned.length !== next.length) {
      // 如果被删的行是当前行，重新追加一行
      if (idx >= cleaned.length) cleaned.push({ text: '', done: false })
    }
    setTodoItems(cleaned)
  }
  const handleTodoKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = [...todoItems]
      if (idx === next.length - 1) {
        next.push({ text: '', done: false })
      }
      setTodoItems(next)
      // 聚焦下一行
      setTimeout(() => {
        const el = document.getElementById(`todo-input-${idx + 1}`) as HTMLInputElement | null
        el?.focus()
      }, 0)
    }
  }

  // 首次挂载时把 pure/HTML 内容写入富文本编辑区（兼容旧纯文本：转义后作为文本节点）
  const initMemoEdit = (node: HTMLDivElement | null) => {
    memoEditRef.current = node
    if (node && !textInitialized) {
      const raw = textContent || ''
      // 若已是 HTML（含标签）则直接写入，否则作为纯文本写入（自动转义，避免 XSS）
      if (/<[a-z][\s\S]*>/i.test(raw)) {
        node.innerHTML = raw
      } else {
        node.textContent = raw
      }
      setTextInitialized(true)
      syncMemoState()
    }
  }

  const typeLabels: Record<NoteType, string> = {
    text: '文本笔记',
    todo: '待办清单',
    inspiration: '灵感笔记',
    }

  const typeIcons: Record<NoteType, React.ReactNode> = {
    text: <FileText size={14} />,
    todo: <CheckSquare size={14} />,
    inspiration: <Lightbulb size={14} />,
    }

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: '#FFF8E7', paddingTop: 'var(--wi-sb, 0px)' }}
    >
      {/* 顶部栏：返回 + 完成 */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#E8D5B7]/40 px-4 py-3">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-[#5C4D3C] transition-colors hover:text-[#333]"
        >
          <ChevronLeft size={20} strokeWidth={2} />
          <span className="text-[14px]">返回</span>
        </button>
        <button
          onClick={handleSave}
          className="rounded-full px-5 py-2 text-[13px] font-semibold text-[#333] shadow-sm transition-transform active:scale-95"
          style={{ background: '#FFC145', boxShadow: '0 4px 12px -4px rgba(255,193,69,0.5)' }}
        >
          完成
        </button>
      </div>

      {/* 可滚动内容区 */}
      <div className="flex-1 overflow-y-auto app-scrollbar px-5 py-4">
        {/* 标题 */}
        <input
          autoFocus={isNew}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题"
          className="mb-3 w-full bg-transparent text-[18px] font-semibold text-[#333] outline-none placeholder:text-[#C4B49A]"
        />

        {/* 正文编辑区 */}
        {noteType === 'todo' ? (
          <div className="flex flex-col gap-2">
            {todoItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <button
                  onClick={() => toggleTodo(idx)}
                  className={`flex size-[20px] shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    item.done
                      ? 'border-[#FFC145]'
                      : 'border-[#D4C4A8] hover:border-[#FFC145]/60'
                  }`}
                  style={item.done ? { background: '#FFC145' } : undefined}
                >
                  {item.done && <Check size={11} className="text-white" strokeWidth={3} />}
                </button>
                <input
                  id={`todo-input-${idx}`}
                  value={item.text}
                  onChange={(e) => updateTodoText(idx, e.target.value)}
                  onKeyDown={(e) => handleTodoKeyDown(idx, e)}
                  placeholder={idx === todoItems.length - 1 ? '添加任务…' : ''}
                  className={`flex-1 bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-[#C4B49A] ${
                    item.done ? 'text-[#B8A88A] line-through' : 'text-[#333]'
                  }`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={initMemoEdit}
            contentEditable
            suppressContentEditableWarning
            onInput={syncMemoState}
            onKeyUp={syncMemoState}
            onMouseUp={syncMemoState}
            data-placeholder="写点什么…"
            className="memo-content min-h-[50vh] w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#333] outline-none placeholder:text-[#C4B49A] empty:before:text-[#C4B49A] empty:before:content-[attr(data-placeholder)]"
          />
        )}

        {/* 分类 + 置顶 + 标签（紧凑排列在内容区底部） */}
        <div className="mt-8 pt-5 border-t border-[#E8D5B7]/40">
          {/* 分类 */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="shrink-0 text-[11px] text-[#B8A88A]">分类</span>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] transition-all ${
                  category === c
                    ? 'font-medium text-[#333]'
                    : 'border border-[#E8D5B7] text-[#8B7355]'
                }`}
                style={category === c ? { background: '#FFC145' } : undefined}
              >
                {c}
              </button>
            ))}
          </div>

          {/* 置顶 */}
          <label className="mb-3 flex cursor-pointer items-center gap-1.5 text-[11px] text-[#8B7355]">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="size-3.5 accent-[#FFC145]"
            />
            <Pin size={12} className="text-[#B8A88A]" />
            置顶此备忘
          </label>

          {/* 标签：显式「新建标签」入口，点击展开输入 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                onClick={() => removeTag(tag)}
                className="inline-flex cursor-pointer items-center gap-0.5 rounded-full bg-[#FFF0D4] px-2 py-0.5 text-[11px] text-[#8B6914] transition-colors hover:bg-[#FFE4B8]"
              >
                #{tag}
                <X size={9} strokeWidth={2.5} />
              </span>
            ))}
            {tagInputOpen ? (
              <div className="flex items-center gap-0.5">
                <Tag size={11} className="text-[#C4B49A]" />
                <input
                  autoFocus
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      addTag(tagInput)
                      setTagInput('')
                      setTagInputOpen(false)
                    } else if (e.key === 'Escape') {
                      setTagInput('')
                      setTagInputOpen(false)
                    }
                  }}
                  onBlur={() => { if (!tagInput.trim()) setTagInputOpen(false) }}
                  placeholder="输入标签名"
                  className="w-24 bg-transparent text-[11px] text-[#8B7355] outline-none placeholder:text-[#C4B49A]"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTagInputOpen(true)}
                className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-[#D4C4A8] px-2 py-0.5 text-[11px] text-[#8B7355] transition-colors hover:border-[#FFC145] hover:text-[#8B6914]"
              >
                <Plus size={10} strokeWidth={2.5} />
                新建标签
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="shrink-0 border-t border-[#E8D5B7]/40 px-2 py-2.5" style={{ background: '#FFF8E7' }}>
        <div className="relative flex items-center justify-around">
          {/* 待办模式切换 */}
          <button
            onClick={() => { if (noteType !== 'todo') handleTypeChange('todo') }}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              noteType === 'todo' ? 'text-[#FFC145]' : 'text-[#8B7355]'
            }`}
          >
            <CheckSquare size={18} strokeWidth={1.8} />
            <span className="text-[10px]">待办</span>
          </button>

          {/* 富文本样式按钮（待办模式下禁用） */}
          {noteType !== 'todo' && (
            <>
              <MemoToolButton icon={Bold} label="B" active={isBold} onClick={() => execMemo('bold')} />
              <MemoToolButton icon={Italic} label="I" active={isItalic} onClick={() => execMemo('italic')} />
              <MemoToolButton icon={Underline} label="U" active={isUnderline} onClick={() => execMemo('underline')} />
              <MemoToolButton label="H1" active={activeHeading === 'H1'} onClick={() => execMemoHeading('H1')} />
              <MemoToolButton label="H2" active={activeHeading === 'H2'} onClick={() => execMemoHeading('H2')} />
              <MemoToolButton label="H3" active={activeHeading === 'H3'} onClick={() => execMemoHeading('H3')} />
            </>
          )}

          {/* 模板 */}
          <button
            onClick={() => setShowTypePicker((v) => !v)}
            className="flex flex-col items-center gap-0.5 text-[#8B7355] transition-colors hover:text-[#FFC145]"
          >
            <List size={18} strokeWidth={1.8} />
            <span className="text-[10px]">模板</span>
          </button>

          {/* 模板切换浮层 */}
          {showTypePicker && (
            <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-xl border border-[#E8D5B7] bg-white p-2 shadow-lg">
              {(['text', 'todo'] as NoteType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] whitespace-nowrap transition-colors ${
                    noteType === t ? 'bg-[#FFF0D4] text-[#333] font-medium' : 'text-[#5C4D3C] hover:bg-[#FFF0D4]/50'
                  }`}
                >
                  {typeIcons[t]}
                  {typeLabels[t]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MemoActionSheet({
  memo, categories, onClose, onTogglePin, onEdit, onDelete, onChangeCategory,
}: {
  memo: MemoItem
  categories: MemoCategory[]
  onClose: () => void
  onTogglePin: () => void
  onEdit: () => void
  onDelete: () => void
  onChangeCategory: (c: MemoCategory) => void
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-3" onClick={onClose}>
      <div
        className="relative w-full max-w-[360px] rounded-2xl bg-card p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-[12px] text-muted-foreground/60">长按操作</div>
        <button
          onClick={onTogglePin}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-stone-100"
        >
          <Pin size={16} className="text-sakura" />
          <span className="text-[14px] text-foreground">{memo.pinned ? '取消置顶' : '置顶'}</span>
        </button>
        <button
          onClick={onEdit}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-stone-100"
        >
          <Pencil size={16} className="text-muted-foreground" />
          <span className="text-[14px] text-foreground">编辑</span>
        </button>
        <div className="my-2 h-px bg-stone-200/70" />
        <div className="mb-1.5 px-3 text-[12px] text-muted-foreground/60">移到分类</div>
        <div className="flex flex-wrap gap-1.5 px-3">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onChangeCategory(c)}
              className={`rounded-full px-3 py-1 text-[12px] transition-colors ${memo.category === c ? 'bg-sakura text-white' : 'border border-stone-200 bg-card text-muted-foreground'}`}
            >
              #{c}
            </button>
          ))}
        </div>
        <div className="my-2 h-px bg-stone-200/70" />
        <button
          onClick={onDelete}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-red-500 transition-colors hover:bg-red-50"
        >
          <Trash2 size={16} />
          <span className="text-[14px]">删除</span>
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl bg-stone-100 py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-stone-200"
        >取消</button>
      </div>
    </div>
  )
}

function CategoryManager({
  categories, onClose, onAdd, onRemove,
}: {
  categories: MemoCategory[]
  onClose: () => void
  onAdd: (name: string) => void
  onRemove: (name: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const submit = () => {
    const t = draft.trim().replace(/\s+/g, '')
    if (!t) {
      setAdding(false)
      return
    }
    if (categories.includes(t)) {
      setDraft('')
      setAdding(false)
      return
    }
    onAdd(t)
    setDraft('')
    setAdding(false)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={onClose}>
      <div
        className="w-full max-w-[380px] rounded-2xl bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 font-serif text-[16px] font-semibold text-foreground">分类管理</h2>
        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <div key={c} className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-[14px] text-foreground">
                <Tag size={14} className="text-sakura" />
                {c}
              </span>
              {isDefaultCategory(c) ? (
                <span className="rounded-full bg-stone-200/70 px-2 py-0.5 text-[10px] text-muted-foreground/70">默认</span>
              ) : (
                <button
                  onClick={() => onRemove(c)}
                  aria-label={`删除分类 ${c}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              )}
            </div>
          ))}

          {/* 添加分类输入/卡片 */}
          {adding ? (
            <div className="flex items-center gap-2 rounded-xl border border-sakura/40 bg-sakura-soft/50 px-3.5 py-2">
              <Tag size={14} className="text-sakura" />
              <input
                autoFocus
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submit()
                  } else if (e.key === 'Escape') {
                    setDraft('')
                    setAdding(false)
                  }
                }}
                onBlur={submit}
                placeholder="输入新分类名"
                maxLength={8}
                className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <button
                onClick={submit}
                className="text-[12px] font-medium text-sakura"
              >
                完成
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-left text-[14px] text-muted-foreground transition-colors hover:border-sakura/40 hover:bg-sakura-soft/30 hover:text-sakura"
            >
              <Plus size={14} strokeWidth={2.2} />
              添加分类
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-stone-100 py-2 text-[13px] text-muted-foreground hover:bg-stone-200"
        >关闭</button>
      </div>
    </div>
  )
}

// 小型 AI 音乐界面：从专注页右上角音乐按钮跳入，独立全屏页。
function MusicPlayerPage({ onBack }: { onBack: () => void }) {
  const [activeCategory, setActiveCategory] = useState<MusicCategory>('钢琴')
  // 从全局单例订阅状态（组件挂载时同步，状态变化时自动更新）
  const [s, setS] = useState<MusicState>(musicPlayer.state)
  useEffect(() => musicPlayer.subscribe(setS), [])

  const { current, playing, progress, mode } = s
  const track = musicPlayer.track()

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s2 = Math.floor(sec % 60)
    return `${m}:${s2 < 10 ? '0' : ''}${s2}`
  }

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-foreground">
      {/* 顶部返回栏 */}
      <header className="flex shrink-0 items-center justify-between px-4 py-4">
        <button onClick={onBack} aria-label="返回专注页" className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(243,226,192,0.18)' }}>
          <ChevronLeft size={20} style={{ color: '#49352f' }} />
        </button>
        <span className="font-serif text-[16px] tracking-wide">音乐</span>
        <span className="flex h-10 w-10 items-center justify-center" /> {/* 占位保持居中 */}
      </header>

      {/* 中部：大封面 + 歌单 */}
      <div className="app-scrollbar flex-1 overflow-y-auto px-5 pb-4">
        {/* 大封面 */}
        <div className="flex flex-col items-center pt-2">
          <motion.div
            key={track.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative h-52 w-52 overflow-hidden rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
            style={{ background: track.cover }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Music size={56} style={{ color: 'rgba(255,255,255,0.85)' }} />
            </div>
            {playing && (
              <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 60px rgba(232,201,138,0.35)', animation: 'pulse 2.4s ease-in-out infinite' }} />
            )}
          </motion.div>
          <div className="mt-4 text-center">
            <p className="font-serif text-[20px] font-semibold">{track.title}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{track.artist}</p>
          </div>
        </div>

        {/* 分类滚轮选择器 */}
        <div className="mt-3 flex items-center justify-center">
          <OptionWheel
            items={MUSIC_CATEGORIES as unknown as string[]}
            defaultSelected={MUSIC_CATEGORIES.indexOf(activeCategory)}
            onChange={(idx) => setActiveCategory(MUSIC_CATEGORIES[idx])}
            side="left"
            fontSize={1}
            spacing={1.3}
            curve={0.5}
            tilt={4}
            blur={0.3}
            fade={0.4}
            minOpacity={0.1}
            smoothing={200}
            inset={20}
            draggable
            className="text-[#49352f]"
          />
        </div>

        {/* 歌单列表（仅显示当前分类） */}
        <div className="mt-3 space-y-1.5">
          {MUSIC_TRACKS.filter(t => t.category === activeCategory).map(t => {
            const i = MUSIC_TRACKS.indexOf(t)
            const active = i === current
            return (
              <button
                key={t.id}
                onClick={() => musicPlayer.play(i)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                style={{
                  background: active ? 'rgba(232,201,138,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(232,201,138,0.28)' : '1px solid transparent',
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px]"
                  style={{
                    background: active ? 'rgba(232,201,138,0.18)' : 'rgba(0,0,0,0.06)',
                    color: active ? '#E8C98A' : 'var(--color-muted-foreground)',
                  }}
                >
                  {active && playing ? <span className="flex items-end gap-[2px]"><i className="block h-3 w-[2px] bg-[#E8C98A] animate-[bounce_0.8s_ease-in-out_infinite]" /><i className="block h-4 w-[2px] bg-[#E8C98A] animate-[bounce_0.8s_ease-in-out_infinite_0.2s]" /><i className="block h-2 w-[2px] bg-[#E8C98A] animate-[bounce_0.8s_ease-in-out_infinite_0.4s]" /></span> : (i + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px]" style={{ color: active ? '#E8C98A' : 'var(--color-foreground)' }}>{t.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{t.artist}</p>
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">{fmt(t.duration)}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-4 text-center text-[11px] opacity-50 text-muted-foreground">
          曲谱来源于 Pixabay，感谢分享
        </p>
      </div>

      {/* 底部控制条 */}
      <div className="shrink-0 px-5 pb-8 pt-3">
        {/* 进度条 */}
        <div className="flex items-center gap-3">
          <span className="w-9 text-right text-[11px] tabular-nums text-muted-foreground">{fmt(progress * track.duration)}</span>
          <input
            type="range" min={0} max={100} value={Math.round(progress * 100)}
            onChange={e => musicPlayer.seekRatio(Number(e.target.value) / 100)}
            aria-label="进度"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
            style={{ background: `linear-gradient(90deg,#E8C98A ${Math.round(progress * 100)}%, rgba(0,0,0,0.08) ${Math.round(progress * 100)}%)`, accentColor: '#E8C98A' }}
          />
          <span className="w-9 text-[11px] tabular-nums text-muted-foreground">{fmt(track.duration)}</span>
        </div>

        {/* 控制按钮 */}
        <div className="mt-4 flex items-center justify-between px-2">
          <button onClick={() => musicPlayer.cycleMode()} aria-label="循环模式" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/5" style={{ color: mode === 'loop' ? '#E8C98A' : 'var(--color-muted-foreground)' }}>
            {mode === 'one' ? <Repeat1 size={20} /> : mode === 'random' ? <Shuffle size={20} /> : <Repeat size={20} />}
          </button>
          <div className="flex items-center gap-6">
            <button onClick={() => musicPlayer.prev()} aria-label="上一首" className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-colors hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(243,226,192,0.18)', color: '#49352f' }}>
              <SkipBack size={20} />
            </button>
            <button onClick={() => musicPlayer.toggle()} aria-label={playing ? '暂停' : '播放'} className="flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95" style={{ background: 'linear-gradient(135deg,#E8C98A,#D8C7E0)', color: '#49352f', boxShadow: '0 8px 24px rgba(232,201,138,0.4)' }}>
              {playing ? <Pause size={26} fill="#49352f" /> : <Play size={26} fill="#49352f" />}
            </button>
            <button onClick={() => musicPlayer.next()} aria-label="下一首" className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-colors hover:bg-white/5" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(243,226,192,0.18)', color: '#49352f' }}>
              <SkipForward size={20} />
            </button>
          </div>
          <button onClick={() => musicPlayer.stop()} aria-label="停止播放" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/5" style={{ color: 'var(--color-muted-foreground)' }}>
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

type IconName = 'sprout' | 'star' | 'book' | 'target' | 'heart' | 'sun' | 'cloud' | 'flame' | 'focus' | 'dream' | 'harvest' | 'goal' | 'leaf' | 'snowflake' | 'feather'

interface HandDrawnIconProps {
  name: IconName
  className?: string
  size?: number
  strokeColor?: string
  fillColor?: string
}

function HandDrawnIcon({ name, className = '', size = 24, strokeColor = '#5C5C5C', fillColor = 'none' }: HandDrawnIconProps) {
  const getPath = () => {
    switch (name) {
      case 'sprout':
        return (
          <g>
            <path d="M12 20 Q12 16 14 12 Q16 8 18 6" stroke={strokeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M14 10 Q10 8 8 12" stroke={strokeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M18 8 Q22 6 24 10" stroke={strokeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <ellipse cx="12" cy="14" rx="3" ry="2" fill="#E8F5E9" stroke={strokeColor} strokeWidth="1" />
            <ellipse cx="20" cy="10" rx="3" ry="2" fill="#E8F5E9" stroke={strokeColor} strokeWidth="1" />
          </g>
        )
      case 'star':
        return (
          <path 
            d="M12 2 L14 9 L21 9 L15 14 L17 21 L12 17 L7 21 L9 14 L3 9 L10 9 Z" 
            stroke={strokeColor} 
            strokeWidth="1.5" 
            fill={fillColor === 'none' ? '#FFF8E1' : fillColor} 
            strokeLinejoin="round"
          />
        )
      case 'book':
        return (
          <g>
            <path d="M4 4 Q4 2 6 2 L18 2 Q20 2 20 4 L20 20 Q20 22 18 22 L6 22 Q4 22 4 20 Z" stroke={strokeColor} strokeWidth="1.5" fill="#FFF8E1" />
            <path d="M12 2 L12 22" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="2 2" />
            <path d="M6 6 L10 6" stroke={strokeColor} strokeWidth="1" strokeDasharray="1 1" />
            <path d="M6 8 L9 8" stroke={strokeColor} strokeWidth="1" strokeDasharray="1 1" />
            <path d="M14 6 L18 6" stroke={strokeColor} strokeWidth="1" strokeDasharray="1 1" />
            <path d="M14 8 L17 8" stroke={strokeColor} strokeWidth="1" strokeDasharray="1 1" />
          </g>
        )
      case 'target':
        return (
          <g>
            <circle cx="12" cy="12" r="8" stroke={strokeColor} strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="5" stroke={strokeColor} strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="2" stroke={strokeColor} strokeWidth="1.5" fill="#FFEBEE" />
            <path d="M12 0 L12 24" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
            <path d="M0 12 L24 12" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
          </g>
        )
      case 'heart':
        return (
          <path 
            d="M12 20 C6 14 2 10 2 6 C2 3 4 1 6 1 C8 1 10 3 12 6 C14 3 16 1 18 1 C20 1 22 3 22 6 C22 10 18 14 12 20" 
            stroke={strokeColor} 
            strokeWidth="1.5" 
            fill={fillColor === 'none' ? '#FFEBEE' : fillColor}
            strokeLinecap="round"
          />
        )
      case 'sun':
        return (
          <g>
            <circle cx="12" cy="12" r="5" stroke={strokeColor} strokeWidth="1.5" fill="#FFF8E1" />
            <path d="M12 1 L12 3" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 21 L12 23" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M1 12 L3 12" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M21 12 L23 12" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4.2 4.2 L5.6 5.6" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M18.4 18.4 L19.8 19.8" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4.2 19.8 L5.6 18.4" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M18.4 5.6 L19.8 4.2" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )
      case 'cloud':
        return (
          <path 
            d="M4 12 Q2 10 4 8 Q6 6 10 6 Q12 6 14 8 Q16 6 20 6 Q22 6 22 8 Q24 8 24 12 Q24 14 22 16 Q18 16 16 14 Q14 16 10 16 Q6 16 4 14 Z" 
            stroke={strokeColor} 
            strokeWidth="1.5" 
            fill="#F5F5F5"
          />
        )
      case 'flame':
        return (
          <g>
            <path d="M12 2 L14 8 Q16 6 16 10 Q16 14 14 18 L12 22 L10 18 Q8 14 8 10 Q8 6 10 8 Z" stroke={strokeColor} strokeWidth="1.5" fill="#FFF8E1" />
            <path d="M12 4 L13 9 Q14 7 14 11 Q14 15 13 19 L12 21 L11 19 Q10 15 10 11 Q10 7 11 9 Z" stroke={strokeColor} strokeWidth="1" fill="#FFECB3" />
          </g>
        )
      case 'focus':
        return (
          <g>
            <circle cx="12" cy="12" r="9" stroke={strokeColor} strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
            <circle cx="12" cy="12" r="5" stroke={strokeColor} strokeWidth="1.5" fill="none" />
            <path d="M12 12 L12 6" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" fill="#E3F2FD" stroke={strokeColor} strokeWidth="1" />
          </g>
        )
      case 'dream':
        return (
          <g>
            <path d="M6 18 Q12 22 18 18" stroke={strokeColor} strokeWidth="1.5" fill="none" />
            <path d="M8 16 Q12 18 16 16" stroke={strokeColor} strokeWidth="1.5" fill="none" />
            <path d="M10 14 Q12 15 14 14" stroke={strokeColor} strokeWidth="1.5" fill="none" />
            <path d="M12 12 Q12 13 12 12" stroke={strokeColor} strokeWidth="1.5" fill={strokeColor} />
          </g>
        )
      case 'harvest':
        return (
          <g>
            <ellipse cx="12" cy="14" rx="6" ry="5" stroke={strokeColor} strokeWidth="1.5" fill="#FFEBEE" />
            <path d="M12 9 Q10 7 12 5 Q14 7 12 9" stroke={strokeColor} strokeWidth="1.5" fill="none" />
            <path d="M8 10 Q6 8 8 6" stroke={strokeColor} strokeWidth="1" fill="none" />
            <path d="M16 10 Q18 8 16 6" stroke={strokeColor} strokeWidth="1" fill="none" />
          </g>
        )
      case 'goal':
        return (
          <g>
            <path d="M4 12 L10 12" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 12 L20 12" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 8 Q12 12 10 16" stroke={strokeColor} strokeWidth="1.5" fill="none" />
            <path d="M14 8 Q12 12 14 16" stroke={strokeColor} strokeWidth="1.5" fill="none" />
          </g>
        )
      case 'leaf':
        return (
          <g>
            <path d="M12 22 Q12 18 14 14 Q16 10 18 8" stroke={strokeColor} strokeWidth="1.5" fill="none" />
            <path d="M6 16 Q10 14 14 12 Q18 10 20 8" stroke={strokeColor} strokeWidth="1.5" fill="#E8F5E9" />
            <path d="M12 14 Q12 18 12 22" stroke={strokeColor} strokeWidth="1" fill="none" />
            <path d="M8 12 Q12 10 16 12" stroke={strokeColor} strokeWidth="1" fill="none" />
            <path d="M10 16 Q12 14 14 16" stroke={strokeColor} strokeWidth="1" fill="none" />
          </g>
        )
      case 'snowflake':
        return (
          <g>
            <path d="M12 2 L12 22" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2 12 L22 12" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5 5 L19 19" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M19 5 L5 19" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" fill="#E3F2FD" stroke={strokeColor} strokeWidth="1" />
            <circle cx="12" cy="2" r="2" fill="#E3F2FD" stroke={strokeColor} strokeWidth="1" />
            <circle cx="12" cy="22" r="2" fill="#E3F2FD" stroke={strokeColor} strokeWidth="1" />
            <circle cx="2" cy="12" r="2" fill="#E3F2FD" stroke={strokeColor} strokeWidth="1" />
            <circle cx="22" cy="12" r="2" fill="#E3F2FD" stroke={strokeColor} strokeWidth="1" />
          </g>
        )
      case 'feather':
        return (
          <g>
            <path d="M12 2 Q14 6 16 10 Q18 14 16 18 Q14 22 12 20" stroke={strokeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M10 4 Q12 8 10 12 Q8 16 10 20" stroke={strokeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M8 6 Q10 10 8 14 Q6 18 8 20" stroke={strokeColor} strokeWidth="1" fill="none" />
            <path d="M6 8 Q8 12 6 16" stroke={strokeColor} strokeWidth="1" fill="none" />
            <path d="M12 2 L12 6" stroke={strokeColor} strokeWidth="1" fill="none" />
          </g>
        )
      default:
        return null
    }
  }

  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      className={className}
      style={{ display: 'inline-block' }}
    >
      {getPath()}
    </svg>
  )
}

interface DailyRecords {
  date: string
  focus: {
    hasRecord: boolean
    totalSeconds: number
    records: FocusRecord[]
    byTag: FocusByTag[]
  }
  goal: {
    hasRecord: boolean
    completedCount: number
    totalCount: number
    tasks: DailyTask[]
  }
  harvest: {
    hasRecord: boolean
    content: string
    tomorrow: string
  }
  dream: {
    hasRecord: boolean
    checkInDays: string[]
  }
}

interface DreamData {
  title: string
  description: string
  deadline: string
  createdAt: string
  updatedAt: string
  checkInDays: string[]
}

// 首页心情类别的展示映射（与 time-weather-card.tsx 的 HOME_MOOD_META 配色保持一致）
// 足迹页「最近心情」模块复用，仅用于展示，不编辑
const HOME_MOOD_VIEW: Record<string, { icon: typeof Smile; label: string; tint: string }> = {
  happy:   { icon: Smile,      label: '开心', tint: '#E8A0A0' },
  calm:    { icon: Moon,       label: '平静', tint: '#9AA0B5' },
  focus:   { icon: Target,     label: '专注', tint: '#7FA98C' },
  tired:   { icon: CloudRain,  label: '疲惫', tint: '#9DB4C0' },
  anxious: { icon: Frown,      label: '焦虑', tint: '#D8B26A' },
}

const getTodayDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 累计登录天数（"已陪伴你 X 天"）：任一天首次打开软件即 +1，按本地日期去重
const LOGIN_DAYS_KEY = 'warmFengLoginDays'
const getLoginDays = (): string[] => {
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LOGIN_DAYS_KEY) : null
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
const recordLoginToday = (): number => {
  const today = getTodayDate()
  const days = getLoginDays()
  if (!days.includes(today)) {
    days.push(today)
    try { localStorage.setItem(LOGIN_DAYS_KEY, JSON.stringify(days)) } catch { /* ignore */ }
  }
  return days.length
}

const formatDate = (dateStr: string): { month: string; day: string; weekday: string } => {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return {
    month: `${date.getMonth() + 1}月`,
    day: `${date.getDate()}`,
    weekday: weekdays[date.getDay()]
  }
}

const getSeasonTheme = (month: number): {
  season: string
  chapter: string
  message: string
  color: string
  bgColor: string
} => {
  if (month >= 3 && month <= 5) {
    return {
      season: '春日篇',
      chapter: `第${month - 2}章`,
      message: '这个春天，万物复苏，我也在悄悄生长。',
      color: 'text-sakura',
      bgColor: 'bg-sakura-soft/30'
    }
  } else if (month >= 6 && month <= 8) {
    return {
      season: '夏日篇',
      chapter: `第${month - 5}章`,
      message: '这个夏天，我正在成为更好的自己。',
      color: 'text-mint',
      bgColor: 'bg-mint-soft/30'
    }
  } else if (month >= 9 && month <= 11) {
    return {
      season: '秋日篇',
      chapter: `第${month - 8}章`,
      message: '这个秋天，收获的不仅是果实，还有成长。',
      color: 'text-warm',
      bgColor: 'bg-warm-soft/30'
    }
  } else {
    return {
      season: '冬日篇',
      chapter: month === 12 ? '第1章' : `第${month + 1}章`,
      message: '这个冬天，积蓄力量，静待春暖花开。',
      color: 'text-blue-300',
      bgColor: 'bg-blue-50/30'
    }
  }
}

interface FocusByTag {
  tag: string
  duration: number
}

interface DailyTask {
  id: string
  text: string
  completed: boolean
}

interface DailySummary {
  date: string
  tasks?: {
    total: number
    completed: number
    items: DailyTask[]
  }
  review?: {
    content: string
    tomorrow: string
  }
}

const getDailySummary = (): DailySummary[] => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('dailySummary') : '[]'
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveDailySummary = (summary: DailySummary) => {
  const summaries = getDailySummary()
  const existingIndex = summaries.findIndex(s => s.date === summary.date)
  if (existingIndex >= 0) {
    const existing = summaries[existingIndex]
    summaries[existingIndex] = {
      ...existing,
      ...summary,
      tasks: summary.tasks || existing.tasks,
      review: summary.review || existing.review
    }
  } else {
    summaries.push(summary)
  }
  localStorage.setItem('dailySummary', JSON.stringify(summaries))
}

interface GrowthEvent {
  date: string
  type: 'plan' | 'focus' | 'weekly_plan' | 'review' | 'dream' | 'habit'
  timestamp: string
}

const getGrowthEvents = (): GrowthEvent[] => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('growthEvents') : '[]'
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveGrowthEvent = (date: string, type: 'plan' | 'focus' | 'weekly_plan' | 'review' | 'dream' | 'habit') => {
  const events = getGrowthEvents()
  events.push({ date, type, timestamp: new Date().toISOString() })
  localStorage.setItem('growthEvents', JSON.stringify(events))
}

const hasGrowthEvent = (date: string, type: 'plan' | 'focus' | 'weekly_plan' | 'review' | 'dream' | 'habit'): boolean => {
  const events = getGrowthEvents()
  return events.some(e => e.date === date && e.type === type)
}

// ========== 真实数据计算函数（替代 ME 中的硬编码）==========

/** 计算累计专注时长（小时），从 focusRecords 聚合已完成记录的秒数 */
const calculateTotalFocusHours = (): number => {
  try {
    const raw = localStorage.getItem('focusRecords')
    if (!raw) return 0
    const records: FocusRecord[] = JSON.parse(raw)
    const totalSeconds = records
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.completedDuration, 0)
    return Math.floor(totalSeconds / 3600)
  } catch {
    return 0
  }
}

/** 收集所有「活跃日期」：当天只要做了以下任一事就算活跃 */

// ===================== 分级成就系统 =====================

// 各主题聚合工具（成就系统已删除，以下函数保留的通用工具另见）

const formatDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const getYesterdayDate = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return formatDateKey(d)
}

// 聚合：计算所有成就的当前进度与达成等级（成就系统已删除）


// Web Audio 合成循环氛围音（零文件、零网络）。返回 stop 函数。
// baseFreq 决定音色，type 决定波形，营造不同曲风的氛围底噪。
const startAmbientLoop = (baseFreq: number, type: OscillatorType = 'sine') => {
  try {
    if (typeof window === 'undefined') return () => {}
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext)
    if (!AudioCtx) return () => {}
    const ac = new AudioCtx()
    const master = ac.createGain()
    master.gain.value = 0.0001
    master.gain.linearRampToValueAtTime(0.12, ac.currentTime + 1.2)
    master.connect(ac.destination)

    const osc = ac.createOscillator()
    const oscGain = ac.createGain()
    osc.type = type
    osc.frequency.value = baseFreq
    oscGain.gain.value = 0.6
    osc.connect(oscGain)
    oscGain.connect(master)

    // 五度叠加，增加层次
    const osc2 = ac.createOscillator()
    const osc2Gain = ac.createGain()
    osc2.type = type
    osc2.frequency.value = baseFreq * 1.5
    osc2Gain.gain.value = 0.25
    osc2.connect(osc2Gain)
    osc2Gain.connect(master)

    // 缓慢颤音 LFO，让氛围音有呼吸感
    const lfo = ac.createOscillator()
    const lfoGain = ac.createGain()
    lfo.frequency.value = 0.15
    lfoGain.gain.value = 0.04
    lfo.connect(lfoGain)
    lfoGain.connect(master.gain)

    osc.start()
    osc2.start()
    lfo.start()

    return () => {
      try {
        master.gain.cancelScheduledValues(ac.currentTime)
        master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4)
        setTimeout(() => {
          try { osc.stop(); osc2.stop(); lfo.stop(); ac.close().catch(() => {}) } catch { /* noop */ }
        }, 500)
      } catch { /* noop */ }
    }
  } catch { return () => {} }
}

// 内置曲目（商用可用，来自 E:/暖枫/音乐/00_商用可用/其他宽松授权）。
// 已复制 mp3 至 public/music/，src 指向真实文件；之前无 src 时才用合成音占位。
export type MusicCategory = '钢琴' | '氛围' | '自然' | '睡眠'
type Track = {
  id: string
  title: string
  artist: string
  cover: string        // 渐变色 css，预留真实图片位
  duration: number     // 秒（估算，进度条参考用）
  src?: string         // public 下 mp3 路径
  synthBaseFreq: number
  synthType: OscillatorType
  category: MusicCategory
}
const MUSIC_TRACKS: Track[] = [
  // —— 钢琴（4）——
  { id: 'p1', title: '柔光轻语', artist: 'leberch', cover: 'linear-gradient(135deg,#D8C7E0,#E8C98A)', duration: 200, src: '/music/leberch-calm-background.mp3', synthBaseFreq: 196, synthType: 'sine', category: '钢琴' },
  { id: 'p2', title: '舒眠钢琴', artist: 'mc_music', cover: 'linear-gradient(135deg,#C9D6E8,#E8C98A)', duration: 184, src: '/music/mc_music-relaxing-piano-music.mp3', synthBaseFreq: 174.61, synthType: 'sine', category: '钢琴' },
  { id: 'p3', title: '暖夜独奏', artist: 'sakartvelo', cover: 'linear-gradient(135deg,#E8C9C0,#E8C98A)', duration: 216, src: '/music/sakartvelo-soft-piano-music.mp3', synthBaseFreq: 220, synthType: 'sine', category: '钢琴' },
  { id: 'p4', title: '挽歌小品', artist: 'sakartvelo', cover: 'linear-gradient(135deg,#B8956A,#6B4E3D)', duration: 198, src: '/music/sakartvelo-elegia-piano-music.mp3', synthBaseFreq: 207.65, synthType: 'sine', category: '钢琴' },
  // —— 氛围（4）——
  { id: 'a1', title: '432Hz 空灵静默', artist: 'gnosticbliss', cover: 'linear-gradient(135deg,#9B8BC4,#4A4063)', duration: 240, src: '/music/gnosticbliss-432hz-ethereal-silence.mp3', synthBaseFreq: 246.94, synthType: 'sine', category: '氛围' },
  { id: 'a2', title: '疗愈灵性', artist: 'viacheslavstarostin', cover: 'linear-gradient(135deg,#A7BED3,#8E9AAF)', duration: 236, src: '/music/viacheslavstarostin-healing-spiritual-music.mp3', synthBaseFreq: 164.81, synthType: 'triangle', category: '氛围' },
  { id: 'a3', title: '我们终将坠落', artist: 'you-are-us', cover: 'linear-gradient(135deg,#8FD3C7,#5E8B8B)', duration: 222, src: '/music/you-are-us-we-all-fall.mp3', synthBaseFreq: 185, synthType: 'triangle', category: '氛围' },
  { id: 'a4', title: '柔静背景', artist: 'hitslab', cover: 'linear-gradient(135deg,#D8C7E0,#A7BED3)', duration: 168, src: '/music/hitslab-soft-calm-background-music.mp3', synthBaseFreq: 174.61, synthType: 'sine', category: '氛围' },
  // —— 自然（4）——
  { id: 'n1', title: '细柔雨声', artist: 'eryliaa', cover: 'linear-gradient(135deg,#A7BED3,#8E9AAF)', duration: 220, src: '/music/eryliaa-gentle-rain.mp3', synthBaseFreq: 174.61, synthType: 'triangle', category: '自然' },
  { id: 'n2', title: '安神雨落', artist: 'liecio', cover: 'linear-gradient(135deg,#8E9AAF,#B8C2CC)', duration: 178, src: '/music/liecio-calming-rain.mp3', synthBaseFreq: 164.81, synthType: 'triangle', category: '自然' },
  { id: 'n3', title: '海浪潮汐', artist: 'siriusparsec', cover: 'linear-gradient(135deg,#8FD3C7,#5E8B8B)', duration: 96, src: '/music/siriusparsec-waves.mp3', synthBaseFreq: 164.81, synthType: 'triangle', category: '自然' },
  { id: 'n4', title: '鸟鸣溪流', artist: 'white_records', cover: 'linear-gradient(135deg,#C9E8B8,#8FD3C7)', duration: 210, src: '/music/white_records-birds-and-stream.mp3', synthBaseFreq: 196, synthType: 'sine', category: '自然' },
  // —— 钢琴（新增 3）——
  { id: 'p5', title: '温和平静', artist: 'krasnoshchok', cover: 'linear-gradient(135deg,#D8C7E0,#E8C98A)', duration: 192, src: '/music/krasnoshchok-gentle-peaceful-soothing-music.mp3', synthBaseFreq: 220, synthType: 'sine', category: '钢琴' },
  { id: 'p6', title: '静夜钢琴', artist: 'piano', cover: 'linear-gradient(135deg,#C9D6E8,#E8C98A)', duration: 240, src: '/music/piano-calm.mp3', synthBaseFreq: 196, synthType: 'sine', category: '钢琴' },
  { id: 'p7', title: '柔月之下', artist: 'soul-studio', cover: 'linear-gradient(135deg,#B8A7D3,#6B4E8B)', duration: 198, src: '/music/soul-studio-under-the-gentle-moon.mp3', synthBaseFreq: 174.61, synthType: 'sine', category: '钢琴' },
  // —— 氛围（新增 2）——
  { id: 'a5', title: '396Hz 疗愈音', artist: 'sonorahealing', cover: 'linear-gradient(135deg,#9B8BC4,#4A4063)', duration: 240, src: '/music/sonorahealing-healing-sound-396hz.mp3', synthBaseFreq: 246.94, synthType: 'sine', category: '氛围' },
  { id: 'a6', title: '安神舒眠', artist: 'light_music', cover: 'linear-gradient(135deg,#A7BED3,#8E9AAF)', duration: 230, src: '/music/light_music-soothing-sleep.mp3', synthBaseFreq: 185, synthType: 'triangle', category: '氛围' },
  // —— 自然（新增 4，原『自然白噪音』子目录）——
  { id: 'n5', title: '潺潺溪流', artist: 'dragon-studio', cover: 'linear-gradient(135deg,#A7BED3,#8E9AAF)', duration: 96, src: '/music/dragon-studio-gentle-stream.mp3', synthBaseFreq: 174.61, synthType: 'triangle', category: '自然' },
  { id: 'n6', title: '纾压细雨', artist: 'dragon-studio', cover: 'linear-gradient(135deg,#8E9AAF,#B8C2CC)', duration: 240, src: '/music/dragon-studio-relaxing-rain.mp3', synthBaseFreq: 164.81, synthType: 'triangle', category: '自然' },
  { id: 'n7', title: '窗边微雨', artist: 'eryliaa', cover: 'linear-gradient(135deg,#8FD3C7,#5E8B8B)', duration: 200, src: '/music/eryliaa-gentle-rain-on-window.mp3', synthBaseFreq: 196, synthType: 'triangle', category: '自然' },
  { id: 'n8', title: '温柔海浪', artist: 'mightuser', cover: 'linear-gradient(135deg,#8FD3C7,#5E8B8B)', duration: 60, src: '/music/mightuser-gentle-ocean-waves.mp3', synthBaseFreq: 164.81, synthType: 'triangle', category: '自然' },
  // —— 睡眠（新增 4，独立新分类）——
  { id: 's1', title: '星空摇篮曲', artist: 'groovyoda', cover: 'linear-gradient(135deg,#4A4063,#2A2350)', duration: 168, src: '/music/groovyoda-sky-and-stars-chill-lofi-lullaby.mp3', synthBaseFreq: 220, synthType: 'sine', category: '睡眠' },
  { id: 's2', title: '森林入梦', artist: 'konstantinpazuzustudio', cover: 'linear-gradient(135deg,#2A3A50,#4A4063)', duration: 240, src: '/music/konstantinpazuzustudio-shhh-the-forest-is-dreaming.mp3', synthBaseFreq: 174.61, synthType: 'triangle', category: '睡眠' },
  { id: 's3', title: '深眠安宁', artist: 'michael-x_studio', cover: 'linear-gradient(135deg,#3A2A50,#1E1A3A)', duration: 240, src: '/music/michael-x_studio-calm-for-deep-sleep.mp3', synthBaseFreq: 196, synthType: 'sine', category: '睡眠' },
  { id: 's4', title: '宝宝安睡', artist: 'the_mountain', cover: 'linear-gradient(135deg,#5A4A6B,#2A2350)', duration: 168, src: '/music/the_mountain-baby-sleep.mp3', synthBaseFreq: 246.94, synthType: 'sine', category: '睡眠' },
]
const MUSIC_CATEGORIES: MusicCategory[] = ['钢琴', '氛围', '自然', '睡眠']

/** 音乐分类 Tab 导航栏（胶囊式，用于 MusicPlayerPage 内） */
function MusicCategoryTabs({ categories, active, onSelect }: { categories: MusicCategory[]; active: MusicCategory; onSelect: (c: MusicCategory) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-black/[0.04] p-1">
      {categories.map(c => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className="flex-1 rounded-xl px-3 py-2 text-center text-[13px] font-medium transition-all"
          style={{
            background: active === c ? 'rgba(255,255,255,0.85)' : 'transparent',
            color: active === c ? '#49352f' : 'var(--color-muted-foreground)',
            boxShadow: active === c ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          {c}
        </button>
      ))}
    </div>
  )
}

/* ============================================================
 * 全局音乐播放器单例（模块级，不依赖组件生命周期）
 * 退出音乐页、切页面、锁屏/后台均不停止播放。
 * MusicPlayerPage 和 GlobalMusicBar 都通过此单例读写状态。
 * ============================================================ */
type MusicState = {
  current: number
  playing: boolean
  progress: number  // 0..1
  mode: 'loop' | 'one' | 'random'
  hasStopped: boolean
}
type MusicListener = (state: MusicState) => void

const musicPlayer = (function () {
  let audio: HTMLAudioElement | null = null
  let stopSynth: (() => void) | null = null
  let rafId: number | null = null
  let startTime = 0
  let baseTime = 0
  const state: MusicState = { current: 0, playing: false, progress: 0, mode: 'loop', hasStopped: true }
  const listeners = new Set<MusicListener>()

  const emit = () => listeners.forEach(fn => fn({ ...state }))
  const track = () => MUSIC_TRACKS[state.current]

  const tickSim = () => {
    const elapsed = baseTime + (Date.now() - startTime) / 1000
    const dur = track().duration
    if (elapsed >= dur) { onEnded(); return }
    state.progress = elapsed / dur
    emit()
    rafId = requestAnimationFrame(tickSim)
  }

  const pauseAll = () => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null }
    if (audio) { try { audio.pause() } catch {} }
    if (stopSynth) { stopSynth(); stopSynth = null }
  }

  const stopAll = () => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null }
    if (audio) { 
      try { 
        audio.pause()
        audio.currentTime = 0
        audio.src = ''
        audio.load()
      } catch {}
      audio = null
    }
    if (stopSynth) { stopSynth(); stopSynth = null }
  }

  const startSynth = (t: Track) => {
    stopSynth = startAmbientLoop(t.synthBaseFreq, t.synthType)
    rafId = requestAnimationFrame(tickSim)
  }

  const onEnded = () => {
    if (state.mode === 'one') { playIdx(state.current); return }
    if (state.mode === 'random') {
      let n = state.current
      if (MUSIC_TRACKS.length > 1) while (n === state.current) n = Math.floor(Math.random() * MUSIC_TRACKS.length)
      playIdx(n)
    } else {
      playIdx((state.current + 1) % MUSIC_TRACKS.length)
    }
  }

  function playIdx(idx: number) {
    stopAll()
    state.current = idx
    state.progress = 0
    state.playing = true
    state.hasStopped = false
    baseTime = 0
    startTime = Date.now()
    const t = MUSIC_TRACKS[idx]
    if (t.src) {
      const a = new Audio(t.src)
      a.loop = state.mode === 'one'
      a.addEventListener('timeupdate', () => { state.progress = a.currentTime / (a.duration || t.duration); emit() })
      a.addEventListener('ended', onEnded)
      audio = a
      a.play().catch(() => { startSynth(t) })
    } else {
      startSynth(t)
    }
    emit()
  }

  function toggle() {
    if (state.playing) {
      pauseAll()
      baseTime += (Date.now() - startTime) / 1000
      state.playing = false
    } else {
      const t = track()
      if (t.src && audio) {
        audio.play().catch(() => {})
        state.playing = true
      } else {
        startTime = Date.now()
        startSynth(t)
        state.playing = true
      }
    }
    emit()
  }

  function prev() { playIdx((state.current - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length) }
  function next() { playIdx((state.current + 1) % MUSIC_TRACKS.length) }
  function cycleMode() { state.mode = state.mode === 'loop' ? 'one' : state.mode === 'one' ? 'random' : 'loop'; emit() }
  function seekRatio(v: number) {
    state.progress = v
    if (audio && audio.duration) { audio.currentTime = v * audio.duration }
    else { baseTime = v * track().duration; startTime = Date.now() }
    emit()
  }
  function stop() { stopAll(); state.playing = false; state.current = 0; state.progress = 0; state.hasStopped = true; emit() }

  // 订阅/取消订阅（用于 React 组件同步状态）
  function subscribe(fn: MusicListener): () => void { listeners.add(fn); return () => listeners.delete(fn) }

  return { get state() { return state }, play: playIdx, toggle, prev, next, cycleMode, seekRatio, stop, subscribe, track }
})()

/** 全局迷你播放器条（悬浮于底部导航上方，任何页面可见） */
function GlobalMusicBar({ onOpen }: { onOpen: () => void }) {
  const [s, setS] = useState<MusicState>(musicPlayer.state)

  useEffect(() => musicPlayer.subscribe(setS), [])

  if (musicPlayer.state.hasStopped) return null

  const t = musicPlayer.track()
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen() }}
      className="absolute inset-x-0 bottom-[calc(68px+var(--wi-nb,0px))] z-[70] flex cursor-pointer items-center gap-3 border-t border-border/50 bg-card/95 px-4 py-2.5 backdrop-blur-sm transition-transform active:scale-[.995]"
      style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}
    >
      {/* 封面缩略 */}
      <div className="size-9 shrink-0 overflow-hidden rounded-lg" style={{ background: t.cover }}>
        <div className="flex h-full w-full items-center justify-center">
          <Music size={16} style={{ color: 'rgba(255,255,255,0.8)' }} />
        </div>
      </div>
      {/* 曲名 + 艺术家 */}
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[13px] font-medium">{t.title}</p>
        <p className="truncate text-[10px] text-muted-foreground">{t.artist}</p>
      </div>
      {/* 播放/暂停按钮 */}
      <button
        onClick={(e) => { e.stopPropagation(); musicPlayer.toggle() }}
        aria-label={s.playing ? '暂停' : '播放'}
        className="flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'linear-gradient(135deg,#E8C98A,#D8C7E0)', color: '#49352f', boxShadow: '0 4px 12px rgba(232,201,138,0.35)' }}
      >
        {s.playing ? <Pause size={14} fill="#49352f" /> : <Play size={14} fill="#49352f" />}
      </button>
      {/* 关闭按钮 */}
      <button
        onClick={(e) => { e.stopPropagation(); musicPlayer.stop() }}
        aria-label="关闭音乐"
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-muted-foreground"
      >
        <X size={14} />
      </button>
    </div>
  )
}

/** 获取/生成用户 UID：首次生成后持久化，之后复用 */
const getUID = (): string => {
  try {
    const stored = localStorage.getItem('warmFengUID')
    if (stored) return stored
    const hex = Math.random().toString(16).slice(2, 6).toUpperCase()
    const uid = `暖枫-${hex}`
    localStorage.setItem('warmFengUID', uid)
    return uid
  } catch {
    return '暖枫-2026'
  }
}

const getWeekNumber = (dateStr: string): number => {
  const date = new Date(dateStr + 'T00:00:00')
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
}

const getDailyRecords = (date: string): DailyRecords => {
  const today = getTodayDate()
  const isToday = date === today

  const focusRecordsStr = typeof window !== 'undefined' ? localStorage.getItem('focusRecords') : '[]'
  let focusRecords: FocusRecord[] = []
  if (focusRecordsStr) {
    try {
      const parsed = JSON.parse(focusRecordsStr)
      focusRecords = Array.isArray(parsed) ? parsed : []
    } catch { /* ignore */ }
  }
  const dayFocusRecords = focusRecords.filter(r => r.date === date && r.status === 'completed')
  
  const focusByTag: FocusByTag[] = []
  const tagDurationMap: Record<string, number> = {}
  dayFocusRecords.forEach(r => {
    const tag = r.customType || r.type || '学习'
    tagDurationMap[tag] = (tagDurationMap[tag] || 0) + r.completedDuration
  })
  Object.entries(tagDurationMap).forEach(([tag, duration]) => {
    focusByTag.push({ tag, duration })
  })
  
  const focus = {
    hasRecord: dayFocusRecords.length > 0,
    totalSeconds: dayFocusRecords.reduce((sum, r) => sum + r.completedDuration, 0),
    records: dayFocusRecords,
    byTag: focusByTag
  }

  const summaries = getDailySummary()
  const daySummary = summaries.find(s => s.date === date)

  let goal = { hasRecord: false, completedCount: 0, totalCount: 0, tasks: [] as DailyTask[] }
  if (daySummary?.tasks) {
    goal = {
      hasRecord: daySummary.tasks.total > 0,
      completedCount: daySummary.tasks.completed,
      totalCount: daySummary.tasks.total,
      tasks: daySummary.tasks.items || []
    }
  } else if (isToday) {
    const todayTasksStr = typeof window !== 'undefined' ? localStorage.getItem('todayTasks') : '[]'
    let todayTasks: { id: string; title: string; completed: boolean }[] = []
    if (todayTasksStr) {
      try {
        const parsed = JSON.parse(todayTasksStr)
        todayTasks = Array.isArray(parsed) ? parsed : []
      } catch {
        todayTasks = []
      }
    }
    goal = {
      hasRecord: todayTasks.length > 0,
      completedCount: todayTasks.filter(t => t.completed).length,
      totalCount: todayTasks.length,
      tasks: todayTasks.map(t => ({ id: t.id, text: t.title, completed: t.completed }))
    }
  }

  let harvest = { hasRecord: false, content: '', tomorrow: '' }
  if (daySummary?.review) {
    harvest = {
      hasRecord: !!daySummary.review.content,
      content: daySummary.review.content || '',
      tomorrow: daySummary.review.tomorrow || ''
    }
  } else if (isToday) {
    const dailyReviewStr = typeof window !== 'undefined' ? localStorage.getItem('dailyReview') : '{}'
    let dailyReview: { content: string; date: string } = { content: '', date: '' }
    if (dailyReviewStr) {
      try {
        const parsed = JSON.parse(dailyReviewStr)
        dailyReview = parsed && typeof parsed === 'object' ? parsed : {}
      } catch {
        dailyReview = { content: '', date: '' }
      }
    }
    const dailyTomorrowStr = typeof window !== 'undefined' ? localStorage.getItem('dailyTomorrow') : '{}'
    let dailyTomorrow: { content: string; date: string } = { content: '', date: '' }
    if (dailyTomorrowStr) {
      try {
        const parsed = JSON.parse(dailyTomorrowStr)
        dailyTomorrow = parsed && typeof parsed === 'object' ? parsed : {}
      } catch {
        dailyTomorrow = { content: '', date: '' }
      }
    }
    harvest = {
      hasRecord: !!(dailyReview.content && dailyReview.date === date),
      content: dailyReview.content || '',
      tomorrow: dailyTomorrow.content || ''
    }
  }

  const myDreamStr = typeof window !== 'undefined' ? localStorage.getItem('myDream') : '{}'
  let myDream: DreamData = { title: '', description: '', deadline: '', createdAt: '', updatedAt: '', checkInDays: [] }
  if (myDreamStr) {
    try {
      const parsed = JSON.parse(myDreamStr)
      if (parsed && typeof parsed === 'object') {
        myDream = {
          title: parsed.title || '',
          description: parsed.description || '',
          deadline: parsed.deadline || '',
          createdAt: parsed.createdAt || '',
          updatedAt: parsed.updatedAt || '',
          checkInDays: Array.isArray(parsed.checkInDays) ? parsed.checkInDays : [],
        }
      }
    } catch { /* ignore */ }
  }
  const dream = {
    hasRecord: myDream.checkInDays.includes(date),
    checkInDays: myDream.checkInDays
  }

  return { date, focus, goal, harvest, dream }
}

// ===================== 日记模块 =====================
// 心情用日系线稿图标表达（lucide 线性图标），不再用 emoji
type DiaryMood = 'sun' | 'smile' | 'moon' | 'heart' | 'rain' | 'flame'
type DiaryView = 'stack' | 'list' | 'timeline'

interface DiaryEntry {
  id: string
  title: string
  preview: string
  date: string
  mood: DiaryMood
  photoCount: number
  photos?: string[]
  html?: string
}

const DIARY_MOODS: DiaryMood[] = ['sun', 'smile', 'moon', 'heart', 'rain', 'flame']

// 心情 key → 线稿图标 + 中文标签
const DIARY_MOOD_META: Record<DiaryMood, { icon: typeof Sun; label: string }> = {
  sun: { icon: Sun, label: '晴朗' },
  smile: { icon: Smile, label: '微笑' },
  moon: { icon: Moon, label: '平静' },
  heart: { icon: Heart, label: '感恩' },
  rain: { icon: CloudRain, label: '低落' },
  flame: { icon: Flame, label: '激动' },
}

// 旧数据（emoji 字符串）兼容：无法识别时回退到晴朗
const normalizeMood = (m: string): DiaryMood =>
  (DIARY_MOODS as string[]).includes(m) ? (m as DiaryMood) : 'sun'

const DIARY_MOCK: DiaryEntry[] = []

// 本地持久化：日记数据存于 localStorage，刷新不丢失
const DIARY_STORAGE_KEY = 'warmFengDiaries'

const loadDiaries = (): DiaryEntry[] => {
  if (typeof window === 'undefined') return DIARY_MOCK
  try {
    const raw = window.localStorage.getItem(DIARY_STORAGE_KEY)
    if (!raw) return DIARY_MOCK
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as DiaryEntry[]) : DIARY_MOCK
  } catch {
    return DIARY_MOCK
  }
}

const saveDiaries = (list: DiaryEntry[]) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* 存储失败（如隐私模式 / 容量满）时静默忽略，不影响使用 */
  }
}

// ─────────────────────────────────────────────────────
// 灵感空间（InspirationModule）
// ─────────────────────────────────────────────────────

const INSP_STORAGE_KEY = 'warmFengInspirations'

type InspStatus = 'incubating' | 'converted' | 'archived'

interface Inspiration {
  id: string
  content: string
  tags: string[]
  status: InspStatus
  catalyst?: string
  createdAt: string
  updatedAt: string
}

const loadInspirations = (): Inspiration[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(INSP_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as Inspiration[]) : []
    }
  } catch { /* ignore */ }
  return []
}

const saveInspirations = (list: Inspiration[]) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(INSP_STORAGE_KEY, JSON.stringify(list))
  } catch { /* ignore */ }
}

const INSP_TAG_PRESETS = ['产品', '写作', '生活']

// 催化器：六何分析法，对任何灵感 / 问题都适用
const UNIVERSAL_CATALYST = {
  framework: '六何分析法',
  by: '拉雅德·吉普林（1902，后广泛用于管理与产品）',
  questions: [
    '是什么：用一句话把这个念头说清楚——它到底是个什么？',
    '为什么：它解决什么痛点？为什么现在想做？（连问几次"为什么"更准）',
    '谁来做：为谁而做？由谁来推进？要不要拉上谁？',
    '何时做：什么时候开始？有没有节奏或截止？',
    '在哪做：会在哪些场景、渠道或地方发生？',
    '怎么做：最小的第一步行动是什么？今天就能做哪一点？',
  ],
}

/**
 * 底部参考：大佬思维模型。
 * 以下描述均来自公开可信资料（非杜撰）：
 *  - 第一性原理：埃隆·马斯克推崇，源自物理学视角
 *  - 卡片笔记法：尼克拉斯·卢曼（德国社会学家，约 9 万张卡片）
 *  - 奔驰法：罗伯特·艾伯尔（1971）
 *  - 五个为什么：丰田佐吉（丰田生产体系）
 *  - 费曼学习法：理查德·费曼（物理诺奖得主）
 *  - 黄金圈法则：西蒙·斯涅克（2009《Start With Why》）
 *  - SWOT 分析：1960s 斯坦福大学
 *  - 峰终定律：丹尼尔·卡尼曼（诺奖得主，行为经济学）
 */
const THINKING_MODELS: { name: string; by: string; fit: string; desc: string; practice: string }[] = [
  {
    name: '六何分析法',
    by: '拉雅德·吉普林（1902）',
    fit: '适合：灵感还很模糊、不知从哪下手时，先把它拆清楚。',
    desc: '由六个疑问词构成一套系统性分析框架：何事、何因、何人、何时、何地、如何。在企业管理、日常工作、生活与学习中都通用，是拆解任何模糊想法的基础工具。',
    practice: '拿你的灵感逐条过这六个问题，每条逼自己写出至少一个具体答案——模糊的念头会迅速变清晰。',
  },
  {
    name: '第一性原理',
    by: '埃隆·马斯克（源自物理学视角）',
    fit: '适合：觉得"行业都这么做"卡住、想跳出常规另辟蹊径时。',
    desc: '抛开"别人怎么做"的类比思维，把事物一层层剥开表象，直到剩下最基础、无法被推翻的"基本事实"，再由此重新向上构建解决方案。马斯克借此将火箭制造成本大幅降低。',
    practice: '①写下你默认的"行业惯例"假设 → ②逐条追问"这真的是必然吗？" → ③用最基础的事实重新拼出方案。',
  },
  {
    name: '卡片笔记法',
    by: '尼克拉斯·卢曼（德国社会学家，约 9 万张卡片）',
    fit: '适合：想法很多、想长期沉淀成自己的知识库或写作素材时。',
    desc: '每条笔记是一张独立"卡片"（一个观点），卡片之间通过编号、索引与引用建立连接，形成可反复进入、不断生长的个人知识网络，而非简单摘抄或堆叠。',
    practice: '①捕捉时只写"一个想法一张卡" → ②写卡时顺手连到已有卡片 → ③定期回看链接，想法会自己长成文章。',
  },
  {
    name: '奔驰法',
    by: '罗伯特·艾伯尔（1971）',
    fit: '适合：灵感已有雏形、想找更多变体或创新点子时。',
    desc: '用七个审视角度——替代、组合、调整、修改、他用、去除、重组，系统激发新思路。',
    practice: '拿你的想法逐条过这七个问题，每条逼自己写出至少一个新答案。',
  },
  {
    name: '五个为什么',
    by: '丰田佐吉（丰田生产体系）',
    fit: '适合：遇到反复出错的问题、想挖出真正根因而不止表面修补时。',
    desc: '对一个问题连续追问 5 个"为什么"，建立通向根本原因的原因—效果链，常用于问题分析阶段，避免只治标。',
    practice: '写下问题 → 连问五次"为什么会这样" → 第五次往往接近真正的根因。',
  },
  {
    name: '费曼学习法',
    by: '理查德·费曼（物理诺奖得主）',
    fit: '适合：想真正搞懂一个概念、或准备把它讲给别人/做成内容时。',
    desc: '用"能把一个概念讲给完全的外行听懂"来检验自己是否真懂。讲不通的地方，就是你知识的盲点。它把"学进去"变成"讲出来"，是检验与巩固理解最有效的方式之一。',
    practice: '①选一个概念 → ②假装教给小学生，只用大白话和类比 → ③卡壳处就是盲点，回去重学 → ④简化语言、去掉术语，再讲一遍。',
  },
  {
    name: '黄金圈法则',
    by: '西蒙·斯涅克（2009《Start With Why》）',
    fit: '适合：想清楚"我到底为什么要做这件事"、让行动更有动力时。',
    desc: '多数人沟通从外到内（做什么→怎么做→为什么），而最有感染力的人反过来：先讲 Why（信念/初心），再 How（方法），最后 What（产品）。先锚定"为什么"，行动才有方向感和说服力。',
    practice: '拿你的灵感问三圈：Why——我到底为什么要做这件事？How——靠什么方法/原则实现？What——最终具体产出是什么？从内圈往外写。',
  },
  {
    name: 'SWOT 分析',
    by: '1960s 斯坦福研究院（SRI）',
    fit: '适合：要在几件事里做选择、或评估一个想法值不值得投入时。',
    desc: '用四个象限系统审视一件事：S 优势、W 劣势（自身内部），O 机会、T 威胁（外部环境）。把模糊的"值不值得做"变成一张可对照的态势图，常用于决策与规划。',
    practice: '画一个四象限，分别填入你的优势/劣势/外部机会/外部威胁，再找"优势×机会"的最佳切入点。',
  },
  {
    name: '峰终定律',
    by: '丹尼尔·卡尼曼（诺奖得主，行为经济学）',
    fit: '适合：打磨产品/活动/服务体验，想让用户记住"好"时。',
    desc: '人对一段体验的记忆，不取决于平均感受，而取决于"峰值"（最强烈的时刻）和"结尾"。也就是说，过程长短不那么重要，关键的高潮与收尾决定了整体评价。',
    practice: '设计灵感落地体验时，刻意制造一个高光时刻（峰值），并安排一个温暖/有成就感的收尾（终），其余过程可精简。',
  },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}

const STATUS_LABEL: Record<InspStatus, string> = {
  incubating: '待孵化',
  converted: '已转化',
  archived: '归档',
}

function InspirationModule() {
  const [list, setList] = useState<Inspiration[]>(loadInspirations)
  const [input, setInput] = useState('')
  const [pickTags, setPickTags] = useState<string[]>([])
  const [customOpen, setCustomOpen] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [filter, setFilter] = useState<string | 'all'>('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [inputOpen, setInputOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Inspiration | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'catalyst'>('list')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [topTab, setTopTab] = useState<'灵感空间' | '分享'>( '灵感空间')
  const [activeModel, setActiveModel] = useState<number | null>(null)
  const [pressingTag, setPressingTag] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTag = useRef<string | null>(null)
  const inspTagScrollRef = useRef<HTMLDivElement>(null)
  const [showInspRightFade, setShowInspRightFade] = useState(false)

  const updateInspTabFade = useCallback(() => {
    const el = inspTagScrollRef.current
    if (!el) return
    const { scrollWidth, clientWidth, scrollLeft } = el
    setShowInspRightFade(scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  useEffect(() => { saveInspirations(list) }, [list])

  // 标签数量变化后，重新计算标签栏右侧渐变遮罩（响应式布局下宽度也会变）
  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }

  const toggleTag = (t: string) => {
    setPickTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const addCustomTag = () => {
    const v = customTag.trim().replace(/^#/, '')
    if (v && !pickTags.includes(v)) setPickTags(prev => [...prev, v])
    setCustomTag('')
    setCustomOpen(false)
  }

  const saveInsp = () => {
    const content = input.trim()
    if (!content) { showToast('先写下一个念头吧'); return }
    let finalTags = [...pickTags]
    const pendingCustom = customTag.trim().replace(/^#/, '')
    if (pendingCustom && !finalTags.includes(pendingCustom)) {
      finalTags.push(pendingCustom)
    }
    if (editTarget) {
      // 编辑模式：更新原灵感
      const id = editTarget.id
      setList(prev => prev.map(x => x.id === id
        ? { ...x, content, tags: finalTags.length ? finalTags : ['生活'], updatedAt: new Date().toISOString() }
        : x))
      setInput('')
      setPickTags([])
      setCustomTag('')
      setCustomOpen(false)
      setEditTarget(null)
      setInputOpen(false)
      showToast('已更新灵感')
      return
    }
    const item: Inspiration = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      content,
      tags: finalTags.length ? finalTags : ['生活'],
      status: 'incubating',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setList(prev => [item, ...prev])
    setInput('')
    setPickTags([])
    setCustomTag('')
    setCustomOpen(false)
    setInputOpen(false)
    showToast('已存入闪念')
  }

  const allTags = useMemo(() => {
    const set = new Set<string>(INSP_TAG_PRESETS)
    list.forEach(it => it.tags.forEach(t => { if (t && t.trim()) set.add(t.trim()) }))
    return [...set]
  }, [list])

  const filtered = list.filter(it => {
    if (filter !== 'all' && !it.tags.includes(filter)) return false
    if (search && !it.content.includes(search) && !it.tags.some(t => t.includes(search))) return false
    return true
  })

  const saveCatalyst = (it: Inspiration) => {
    setList(prev => prev.map(x => x.id === it.id ? { ...x, catalyst: note.trim() || undefined, updatedAt: new Date().toISOString() } : x))
    setView('list')
    showToast('孵化想法已记录')
  }

  const openEditor = (it: Inspiration) => {
    setEditTarget(it)
    setInput(it.content)
    setPickTags(it.tags)
    setCustomTag('')
    setCustomOpen(false)
    setInputOpen(true)
  }

  const remove = (it: Inspiration) => {
    setList(prev => prev.filter(x => x.id !== it.id))
  }

  const getTemplate = () => UNIVERSAL_CATALYST

  const activeItem = list.find(x => x.id === activeId) || null

  const TAG_TABS: { key: string | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    ...allTags.map(t => ({ key: t, label: t })),
  ]

  // 标签数量变化后，重新计算标签栏右侧渐变遮罩（响应式布局下宽度也会变）
  useEffect(() => {
    updateInspTabFade()
    const onResize = () => updateInspTabFade()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [TAG_TABS.length, updateInspTabFade])

  if (view === 'catalyst' && activeItem) {
    return (
      <div className="flex flex-col">
        {/* 孵化灵感界面：顶部返回栏 */}
        <div className="sticky top-0 z-10 -mx-5 mb-3 flex items-center gap-2 border-b border-dashed border-border/40 bg-surface-1/95 px-5 py-3 backdrop-blur" style={{ borderRadius: '0 0 8px 8px' }}>
          <button onClick={() => setView('list')} className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground" aria-label="返回">
            <ArrowLeft size={16} strokeWidth={1.8} />
          </button>
          <span className="font-serif text-[16px] font-semibold text-foreground">孵化灵感</span>
        </div>

        <div className="mb-4 border border-dashed border-border/40 bg-surface-1 p-3" style={{ borderRadius: '10px 14px 12px 16px' }}>
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {activeItem.tags.map(t => (
              <span key={t} className="flex items-center gap-0.5 text-[11px] text-sakura"><Tag size={10} strokeWidth={1.6} />{t}</span>
            ))}
          </div>
          <p className="whitespace-pre-wrap text-[14px] font-medium leading-relaxed text-foreground">{activeItem.content}</p>
        </div>

        <p className="mb-2 text-[14px] font-bold text-sakura">{getTemplate().framework}</p>
        <ul className="space-y-3">
          {getTemplate().questions.map((q, idx) => (
            <li key={idx} className="flex gap-2 text-[15px] font-semibold leading-relaxed text-muted-foreground"><span className="mt-0.5 shrink-0 font-bold text-sakura">{idx + 1}.</span><span>{q}</span></li>
          ))}
        </ul>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="顺着这些问题，把孵化的想法记下来..."
          className="mt-4 max-h-[180px] min-h-[128px] w-full resize-none overflow-y-auto border border-dashed border-border/40 bg-surface-1 p-2.5 text-[15px] font-semibold leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          style={{ borderRadius: '10px 12px 10px 12px' }}
        />
        <div className="mt-4 flex items-center gap-2">
          <button onClick={() => setView('list')} className="flex-1 border border-dashed border-border/40 py-2 text-[14px] font-bold text-muted-foreground hover:text-foreground" style={{ borderRadius: '9px 11px 9px 11px' }}>返回</button>
          <button onClick={() => saveCatalyst(activeItem)} className="flex-1 bg-sakura py-2 text-[14px] font-bold text-white hover:opacity-90" style={{ borderRadius: '9px 11px 9px 11px' }}>记录孵化</button>
        </div>
      </div>
    )
  }

  const deleteTag = (tag: string) => {
    setList(prev => prev.map(it => ({
      ...it,
      tags: it.tags.filter(t => t !== tag).length ? it.tags.filter(t => t !== tag) : ['生活'],
    })))
    if (filter === tag) setFilter('all')
    showToast(`已删除标签「${tag}」`)
  }

  const handleTagPointerDown = (tag: string) => (_e: React.PointerEvent) => {
    if (tag === 'all' || INSP_TAG_PRESETS.includes(tag)) return
    setPressingTag(tag)
    longPressTag.current = tag
    longPressTimer.current = setTimeout(() => {
      if (longPressTag.current === tag) {
        setPressingTag(null)
        setConfirmDelete(tag)
        longPressTag.current = null
      }
    }, 600)
  }

  const handleTagPointerUp = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    setPressingTag(null)
    longPressTag.current = null
  }

  // 编辑 / 新建页（与日记 DiaryEditPage 模式一致：absolute 铺满父容器）
  if (inputOpen) {
    return (
      <div
        className="absolute inset-0 z-50 flex flex-col"
        style={{ background: '#FFF8E7', paddingTop: 'var(--wi-sb, 0px)' }}
      >
        {/* 顶部栏：返回 + 标题 + 完成/删除 */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E8D5B7]/40 px-4 py-3">
          <button
            onClick={() => { setInputOpen(false); setEditTarget(null) }}
            className="flex items-center gap-1 text-[#5C4D3C] transition-colors hover:text-[#333]"
          >
            <ChevronLeft size={20} strokeWidth={2} />
            <span className="text-[14px]">返回</span>
          </button>
          <span className="font-serif text-[16px] font-semibold text-[#5C4D3C]">
            {editTarget ? '编辑灵感' : '灵感诞生'}
          </span>
          <div className="flex items-center gap-2">
            {editTarget && (
              <button
                onClick={() => { remove(editTarget); setEditTarget(null); setInputOpen(false) }}
                className="flex size-8 items-center justify-center rounded-full text-[#C0392B] transition-colors hover:bg-[#C0392B]/10"
                aria-label="删除"
              >
                <Trash2 size={18} strokeWidth={1.8} />
              </button>
            )}
            <button
              onClick={() => { saveInsp(); }}
              className="rounded-full px-5 py-2 text-[13px] font-semibold text-[#333] shadow-sm transition-transform active:scale-95"
              style={{ background: '#FFC145', boxShadow: '0 4px 12px -4px rgba(255,193,69,0.5)' }}
            >
              {editTarget ? '保存' : '存入闪念'}
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <textarea
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="随时记录一个模糊的想法、脑洞或碎片..."
            className="min-h-[50vh] w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#333] outline-none placeholder:text-[#C4B49A]"
          />

          {/* 标签选择 */}
          <div className="mt-6 pt-5 border-t border-[#E8D5B7]/40">
            <div className="flex flex-wrap items-center gap-1.5">
              {INSP_TAG_PRESETS.map(t => (
                <button key={t} onClick={() => toggleTag(t)} className={`flex items-center gap-1 border px-2.5 py-1 text-[12px] transition-colors ${pickTags.includes(t) ? 'border-[#FFC145] bg-[#FFF0D4] text-[#333] font-medium' : 'border-[#E8D5B7] text-[#8B7355]'}`} style={{ borderRadius: '6px 8px 6px 8px' }}>
                  <Tag size={11} strokeWidth={1.6} />{t}
                </button>
              ))}
              {pickTags.filter(t => !INSP_TAG_PRESETS.includes(t)).map(t => (
                <button key={t} onClick={() => toggleTag(t)} className="flex items-center gap-1 border border-[#FFC145]/40 bg-[#FFF0D4] px-2.5 py-1 text-[12px] text-[#8B6914]" style={{ borderRadius: '6px 8px 6px 8px' }}>
                  <Tag size={11} strokeWidth={1.6} />{t}
                </button>
              ))}
              {customOpen ? (
                <span className="flex items-center gap-1">
                  <input autoFocus value={customTag} onChange={e => setCustomTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomTag()} placeholder="标签名" className="w-20 border border-dashed border-[#E8D5B7] bg-transparent px-2 py-1 text-[12px] text-[#333] focus:outline-none" style={{ borderRadius: '6px 8px 6px 8px' }} />
                  <button onClick={addCustomTag} className="text-[#FFC145]"><Check size={14} strokeWidth={2} /></button>
                </span>
              ) : (
                <button onClick={() => setCustomOpen(true)} className="flex items-center gap-0.5 border border-dashed border-[#E8D5B7] px-2.5 py-1 text-[12px] text-[#8B7355]" style={{ borderRadius: '6px 8px 6px 8px' }}>+自定义</button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col min-h-full">
      {/* 顶部导航栏：左双 tab（灵感空间/分享）+ 右操作按钮 */}
      <div className="sticky top-0 z-10 -mx-5 mb-3 flex items-center justify-between border-b border-dashed border-border/40 bg-surface-1/95 px-5 py-3 backdrop-blur" style={{ borderRadius: '0 0 8px 8px' }}>
        <div className="-mx-1 flex items-center gap-6 overflow-x-auto app-scrollbar">
          {(['灵感空间', '分享'] as const).map(tab => {
            const active = topTab === tab
            return (
              <button key={tab} onClick={() => setTopTab(tab)} className="relative shrink-0 px-1 pb-1 text-[16px] font-serif transition-colors" style={{ color: active ? '#49352f' : '#B7B2AC', fontWeight: active ? 700 : 400 }}>
                <span>{tab}</span>
                {active && <motion.span layoutId="insp-tab" className="absolute -bottom-0.5 left-0 right-0 h-[2.5px] rounded-full bg-sakura" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(v => !v)} className={`flex size-8 items-center justify-center rounded-full border border-[#e9ddc8] bg-[#f3ebdc] transition-all active:scale-90 ${searchOpen ? 'text-sakura' : 'text-[#8a7d6b] hover:bg-[#ece1cf]'}`} aria-label="搜索">
            <Search size={16} strokeWidth={1.7} />
          </button>
          <button onClick={() => setInputOpen(true)} className="flex size-8 items-center justify-center rounded-full border border-[#e9ddc8] bg-[#f3ebdc] text-[#8a7d6b] transition-all hover:bg-[#ece1cf] active:scale-90" aria-label="记录新灵感">
            <Plus size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {topTab === '灵感空间' && (
        <>
          {searchOpen && (
            <div className="mb-3 flex items-center gap-2 border border-dashed border-border/40 bg-surface-1 px-3 py-2" style={{ borderRadius: '8px 10px 8px 10px' }}>
              <Search size={14} strokeWidth={1.6} className="text-muted-foreground/60" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索灵感..." className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
            </div>
          )}

          {/* 标签筛选（横向滑动） */}
          <div className="relative -mx-1 mb-2">
            <div
              ref={inspTagScrollRef}
              onScroll={updateInspTabFade}
              className="scrollbar-x snap-x snap-mandatory items-center gap-1.5 px-1 py-0.5"
            >
              {TAG_TABS.map(tab => {
                const active = filter === tab.key
                const isCustom = tab.key !== 'all' && !INSP_TAG_PRESETS.includes(tab.key)
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    onPointerDown={handleTagPointerDown(tab.label)}
                    onPointerUp={handleTagPointerUp}
                    onPointerLeave={handleTagPointerUp}
                    onContextMenu={(e) => { e.preventDefault() }}
                    className={`relative z-10 shrink-0 border px-2.5 py-1 text-[12px] transition-all duration-150 select-none snap-start ${active ? 'border-sakura/40 text-sakura' : 'border-border/40 bg-surface-1 text-muted-foreground hover:text-foreground'} ${isCustom && pressingTag === tab.label ? 'border-red-300/60 bg-red-50/40 text-red-400 scale-95' : ''}`}
                    style={{ borderRadius: '6px 8px 6px 8px', touchAction: 'manipulation' }}
                    title={isCustom ? '长按删除标签' : undefined}
                  >
                    {active && <motion.span layoutId="insp-pill" className="absolute inset-0 -z-10 rounded-[6px_8px_6px_8px] bg-sakura-soft/60" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                    {tab.label}
                  </button>
                )
              })}
            </div>
            {/* 右侧渐变提示：标签超出屏幕、且未滑到底时显示 */}
            <div
              className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-1/80 to-transparent transition-opacity ${showInspRightFade ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>

          {/* 灵感卡片流 */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Lightbulb size={32} strokeWidth={1.3} className="text-muted-foreground/40" />
              <p className="mt-3 font-serif text-[14px] text-muted-foreground">还没有灵感</p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">点右上角的 + 记录第一个闪念</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(it => {
                return (
                  <div key={it.id} onClick={() => openEditor(it)} className="cursor-pointer border border-dashed border-border/40 bg-surface-1 p-3 transition-colors hover:border-sakura/40" style={{ borderRadius: '10px 14px 12px 16px' }}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {it.tags.map(t => (
                          <span key={t} className="flex items-center gap-0.5 text-[11px] text-sakura"><Tag size={10} strokeWidth={1.6} />{t}</span>
                        ))}
                        {it.status !== 'incubating' && (
                          <span className="rounded-full bg-sakura-soft/70 px-2 py-0.5 text-[10px] text-sakura">{STATUS_LABEL[it.status]}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground/60">
                        <span className="text-[10px]">{timeAgo(it.createdAt)}</span>
                        <button onClick={(e) => { e.stopPropagation(); remove(it) }} className="ml-0.5 flex size-5 items-center justify-center hover:text-sakura" aria-label="删除"><Trash2 size={12} strokeWidth={1.6} /></button>
                      </div>
                    </div>
                    <p className="line-clamp-2 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{it.content}</p>
                    {it.catalyst && (
                      <p className="mt-2 border-l-2 border-sakura/40 pl-2 text-[12px] leading-relaxed text-muted-foreground"><span className="text-sakura">已孵化 · </span>{it.catalyst}</p>
                    )}
                    <div className="mt-2.5 flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setActiveId(it.id); setNote(it.catalyst || ''); setView('catalyst') }} className="flex flex-1 items-center justify-center gap-1.5 border border-dashed border-border/40 py-1.5 text-[12px] text-foreground transition-colors hover:bg-sakura-soft/30" style={{ borderRadius: '7px 9px 7px 9px' }}>
                        <Sparkles size={13} strokeWidth={1.7} className="text-sakura" />孵化灵感
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {topTab === '分享' && (
        <div className="flex flex-col">
          {activeModel === null ? (
            // 灵感催化工具箱：2 列卡片并列（同首页学习法）
            <div className="px-1 py-3">
              <p className="mb-4 px-1 text-[13px] leading-relaxed text-muted-foreground/70">点开任意一张卡片，学习用思维模型把模糊的灵感孵化成清晰的行动。</p>
              <div className="grid grid-cols-2 gap-3">
                {THINKING_MODELS.map((m, i) => (
                  <button key={m.name} onClick={() => setActiveModel(i)} className="flex min-h-[96px] flex-col items-start border border-dashed border-border/40 bg-surface-1 p-3.5 text-left transition-colors hover:border-sakura/40" style={{ borderRadius: '12px 14px 12px 16px' }}>
                    <span className="mb-1.5 flex items-center gap-1 text-[11px] text-sakura"><Sparkles size={12} strokeWidth={1.6} />思维模型</span>
                    <span className="font-serif text-[16px] font-semibold leading-snug text-foreground">{m.name}</span>
                    <span className="mt-1.5 text-[11px] leading-snug text-muted-foreground/60">— {m.by}</span>
                    <span className="mt-2 line-clamp-2 text-[11px] leading-snug text-muted-foreground/70">{m.fit}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // 思维模型详情
            <div className="px-1 py-3">
              <button onClick={() => setActiveModel(null)} className="mb-3 flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft size={15} strokeWidth={1.8} />返回工具箱
              </button>
              {(() => {
                const m = THINKING_MODELS[activeModel]
                return (
                  <div className="border border-dashed border-border/40 bg-surface-1 p-5" style={{ borderRadius: '12px 16px 12px 18px' }}>
                    <h2 className="font-serif text-[22px] font-semibold leading-snug text-foreground">{m.name}</h2>
                    <p className="mb-3.5 mt-1.5 text-[12px] leading-snug text-muted-foreground/60">— {m.by}</p>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">{m.desc}</p>
                    <div className="mt-4 border-l-2 border-sakura/40 pl-3.5">
                      <p className="text-[15px] leading-relaxed text-foreground"><span className="font-medium text-sakura">适合做什么：</span>{m.fit}</p>
                    </div>
                    <div className="mt-4 border-l-2 border-sakura/40 pl-3.5">
                      <p className="text-[15px] leading-relaxed text-foreground"><span className="font-medium text-sakura">练习：</span>{m.practice}</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/25" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={e => e.stopPropagation()} className="w-full max-w-[280px] border border-border/40 bg-surface-1 p-5 shadow-lg" style={{ borderRadius: '14px 18px 14px 18px' }}>
              <p className="mb-1 text-center font-serif text-[15px] font-semibold text-foreground">确认删除</p>
              <p className="mb-5 text-center text-[13px] leading-relaxed text-muted-foreground">确定要删除标签「<span className="font-medium text-sakura">{confirmDelete}</span>」吗？<br />所有灵感中的该标签都会被移除。</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-border/40 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground" style={{ borderRadius: '9px 11px 9px 11px' }}>取消</button>
                <button onClick={() => { deleteTag(confirmDelete); setConfirmDelete(null) }} className="flex-1 bg-sakura py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90" style={{ borderRadius: '9px 11px 9px 11px' }}>确认删除</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-x-0 bottom-[calc(2rem+var(--wi-nb,0px))] z-50 flex justify-center px-4">
            <div className="border border-sakura/40 bg-surface-1 px-4 py-2 text-[12px] text-foreground shadow-sm" style={{ borderRadius: '10px 12px 10px 12px' }}>{toast}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DiaryPhotoBlock({ src, className = '' }: { src?: string; className?: string }) {
  if (!src) return null
  return (
    <div className={`relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden bg-[#E7E0D4] dark:bg-surface-2 ${className}`}>
      <img src={src} alt="" className="h-full w-full object-cover" />
    </div>
  )
}

function DiaryModule({ initialSubPage = 'diary' }: { initialSubPage?: 'diary' | 'memo' }) {
  const [subPage, setSubPage] = useState<'diary' | 'memo'>(initialSubPage)
  const [view, setView] = useState<DiaryView>('stack')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(true)
  const [moodFilter, setMoodFilter] = useState<'all' | DiaryMood>('all')
  const [editId, setEditId] = useState<string | null>(null)
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date())
  const [diaries, setDiaries] = useState<DiaryEntry[]>(loadDiaries)
  const memoPageRef = useRef<MemoPageHandle>(null)
  const share = useShare()

  // 任意日记变更后持久化到 localStorage
  useEffect(() => {
    saveDiaries(diaries)
  }, [diaries])

  const diaryRecordDates = new Set(diaries.map(d => d.date))
  const todayStr = getTodayDate()
  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  const calendarDays = (() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: { date: string; isToday: boolean; hasRecord: boolean }[] = []
    for (let i = 0; i < firstDay; i++) days.push({ date: '', isToday: false, hasRecord: false })
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push({ date: dateStr, isToday: dateStr === todayStr, hasRecord: diaryRecordDates.has(dateStr) })
    }
    return days
  })()

  const filtered = diaries.filter(d => {
    if (moodFilter !== 'all' && d.mood !== moodFilter) return false
    if (dateFilter && d.date !== dateFilter) return false
    if (search && !d.title.includes(search) && !d.preview.includes(search)) return false
    return true
  })

  // 编辑 / 新建页
  if (editId) {
    const isNew = editId === 'new'
    const entry = diaries.find(d => d.id === editId)
    return (
      <DiaryEditPage
        key={editId}
        existingId={isNew ? undefined : editId ?? undefined}
        title={isNew ? '' : entry?.title || ''}
        preview={isNew ? '' : entry?.html || entry?.preview || ''}
        date={isNew ? getTodayDate() : entry?.date || ''}
        mood={isNew ? 'sun' : normalizeMood(entry?.mood || 'sun')}
        photos={isNew ? [] : entry?.photos || []}
        onBack={() => setEditId(null)}
        onSave={(saved) => {
          if (isNew) {
            setDiaries(prev => [saved, ...prev])
          } else {
            setDiaries(prev => prev.map(d => (d.id === saved.id ? saved : d)))
          }
          // 关闭编辑页时清掉过滤条件，避免新建/修改的条目因 mood/日期/搜索被过滤掉、看起来"没保存"
          setMoodFilter('all')
          setDateFilter(null)
          setSearch('')
          setEditId(null)
        }}
      />
    )
  }

  const views: { key: DiaryView; icon: typeof List; label: string }[] = [
    { key: 'stack', icon: Layers, label: '堆叠' },
    { key: 'list', icon: List, label: '列表' },
    { key: 'timeline', icon: Milestone, label: '时间线' },
  ]

  return (
    <div className="relative flex flex-col min-h-full">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 -mx-5 mb-3 flex items-center justify-between border-b border-dashed border-border/40 bg-surface-1/95 px-5 py-3 backdrop-blur" style={{ borderRadius: '0 0 8px 8px' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSubPage('diary')}
            className={`relative pb-1 text-[15px] font-medium transition-colors ${subPage === 'diary' ? 'text-foreground' : 'text-muted-foreground/50'}`}
          >
            日记
            {subPage === 'diary' && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-sakura" />}
          </button>
          <button
            onClick={() => setSubPage('memo')}
            className={`relative pb-1 text-[15px] font-medium transition-colors ${subPage === 'memo' ? 'text-foreground' : 'text-muted-foreground/50'}`}
          >
            备忘录
            {subPage === 'memo' && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-sakura" />}
          </button>
        </div>
        {subPage === 'diary' && (
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(v => !v)} className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground" aria-label="搜索">
              <Search size={16} strokeWidth={1.7} />
            </button>
            <button onClick={() => setShowCalendar(v => !v)} className={`flex size-8 items-center justify-center transition-colors hover:text-foreground ${showCalendar ? 'text-sakura' : 'text-muted-foreground'}`} aria-label="按日期查询">
              <Calendar size={16} strokeWidth={1.7} />
            </button>
            <button onClick={() => setEditId('new')} className="flex size-8 items-center justify-center text-sakura transition-colors hover:bg-sakura-soft/40" aria-label="新建笔记">
              <Plus size={16} strokeWidth={1.8} />
            </button>
          </div>
        )}
        {subPage === 'memo' && (
          <div className="flex items-center gap-1">
            <button onClick={() => memoPageRef.current?.toggleSearch()} className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground" aria-label="搜索备忘录">
              <Search size={16} strokeWidth={1.7} />
            </button>
            <button onClick={() => memoPageRef.current?.triggerNew()} className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground" aria-label="新建备忘录">
              <Plus size={16} strokeWidth={1.8} />
            </button>
            <button onClick={() => memoPageRef.current?.toggleCategoryMgr()} className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground" aria-label="分类管理">
              <MoreHorizontal size={16} strokeWidth={1.7} />
            </button>
          </div>
        )}
      </div>

      {subPage === 'diary' && (
        <div className="flex flex-col gap-3">
      {searchOpen && (
        <div className="mb-3 flex items-center gap-2 border border-dashed border-border/40 bg-surface-1 px-3 py-2" style={{ borderRadius: '8px 10px 8px 10px' }}>
          <Search size={14} strokeWidth={1.6} className="text-muted-foreground/60" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索笔记..."
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
      )}

      {/* 日历查询面板 */}
      {showCalendar && (
        <div className="mb-4 border border-dashed border-border/40 bg-surface-1 px-4 py-3" style={{ borderRadius: '10px 14px 12px 16px' }}>
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => prevMonth()}><ChevronLeft size={16} strokeWidth={1.8} className="text-muted-foreground hover:text-foreground" /></button>
            <span className="font-serif text-[14px] font-semibold text-foreground">{currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月</span>
            <button onClick={nextMonth}><ChevronLeft size={16} strokeWidth={1.8} className="rotate-180 text-muted-foreground hover:text-foreground" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['日','一','二','三','四','五','六'].map(day => (
              <span key={day} className="py-1 text-[10px] text-muted-foreground">{day}</span>
            ))}
            {calendarDays.map((day, idx) => {
              const isSel = day.date === dateFilter
              return (
                <button
                  key={idx}
                  onClick={() => day.date && setDateFilter(prev => ( prev === day.date ? null : day.date ))}
                  className={`relative flex aspect-square items-center justify-center rounded-lg text-[12px] transition-colors ${!day.date ? 'pointer-events-none opacity-0' : isSel ? 'bg-sakura text-white' : day.isToday ? 'bg-sakura-soft text-sakura' : day.hasRecord ? 'bg-white text-foreground hover:bg-sakura-soft/60 dark:bg-surface-1 dark:hover:bg-surface-2' : 'text-muted-foreground/40 hover:bg-surface-2'}`}
                >
                  {day.date && new Date(day.date).getDate()}
                  {day.hasRecord && !day.isToday && !isSel && (
                    <span className="absolute bottom-1 size-1 rounded-full bg-sakura" />
                  )}
                </button>
              )
            })}
          </div>
          {dateFilter && (
            <button onClick={() => setDateFilter(null)} className="mt-3 flex w-full items-center justify-center gap-1 border border-dashed border-sakura/40 bg-sakura-soft/30 py-1.5 text-[12px] text-sakura" style={{ borderRadius: '6px 8px 6px 8px' }}>
              清除日期筛选 · {dateFilter}
            </button>
          )}
        </div>
      )}

      {/* 心情筛选 + 视图切换 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <div className="app-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-0.5">
            <button
              onClick={() => setMoodFilter('all')}
              className={`relative z-10 shrink-0 border px-2.5 py-1 text-[12px] transition-colors ${moodFilter === 'all' ? 'border-sakura/40 text-sakura' : 'border-border/40 bg-surface-1 text-muted-foreground hover:text-foreground'}`}
              style={{ borderRadius: '6px 8px 6px 8px' }}
            >
              {moodFilter === 'all' && <motion.span layoutId="mood-pill" className="absolute inset-0 -z-10 rounded-[6px_8px_6px_8px] bg-sakura-soft/60" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              全部
            </button>
            {DIARY_MOODS.map(m => {
              const MoodIcon = DIARY_MOOD_META[m].icon
              return (
              <button
                key={m}
                onClick={() => setMoodFilter(m)}
                className={`relative z-10 flex size-8 shrink-0 items-center justify-center border text-[14px] transition-colors ${moodFilter === m ? 'border-sakura/40 text-sakura' : 'border-border/40 bg-surface-1 text-muted-foreground hover:bg-sakura-soft/30'}`}
                style={{ borderRadius: '6px 8px 6px 8px' }}
                aria-label={DIARY_MOOD_META[m].label}
              >
                {moodFilter === m && <motion.span layoutId="mood-pill" className="absolute inset-0 -z-10 rounded-[6px_8px_6px_8px] bg-sakura-soft/60" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <MoodIcon size={16} strokeWidth={1.6} />
              </button>
              )
            })}
          </div>
          {/* 右侧渐隐遮罩：提示可向右滑动查看更多心情 */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--surface-1)] to-transparent" />
          </div>
        <div className="flex shrink-0 items-center gap-1 border border-dashed border-border/40 bg-surface-1 p-1" style={{ borderRadius: '6px 8px 6px 8px' }}>
          {views.map(v => {
            const Icon = v.icon
            const active = view === v.key
            return (
              <button key={v.key} onClick={() => setView(v.key)} aria-label={v.label} className={`flex size-7 items-center justify-center transition-colors ${active ? 'bg-sakura-soft/70 text-sakura' : 'text-muted-foreground hover:text-foreground'}`} style={{ borderRadius: '4px 5px 4px 5px' }}>
                <Icon size={14} strokeWidth={active ? 2 : 1.6} />
              </button>
            )
          })}
        </div>
      </div>

      {/* 列表区 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ImageIcon size={32} strokeWidth={1.3} className="text-muted-foreground/40" />
          <p className="mt-3 font-serif text-[14px] text-muted-foreground">还没有日记</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">点击右上角 + 写下第一篇</p>
        </div>
      ) : view === 'stack' ? (
        /* 方案一：竖向堆叠（单张照片卡片） */
        <div className="space-y-4">
          {filtered.map(d => (
            <div
              key={d.id}
              className="relative border border-dashed border-border/40 bg-surface-1 p-3 transition-all hover:bg-surface-1/70"
              style={{ borderRadius: '10px 14px 12px 16px' }}
            >
              <button
                onClick={() => setEditId(d.id)}
                className="block w-full text-left"
              >
                <DiaryPhotoBlock src={d.photos?.[0]} />
                <h3 className={`font-serif text-[15px] font-semibold text-foreground ${d.photoCount > 0 ? 'mt-3' : ''}`}>{d.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">{d.preview}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground/70">
                  <Calendar size={12} strokeWidth={1.6} className="text-muted-foreground/70" /><span>{d.date}</span>
                  <span className="mx-1">·</span>
                  {(() => { const M = DIARY_MOOD_META[normalizeMood(d.mood)].icon; return <M size={14} strokeWidth={1.6} /> })()}
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  share({ title: d.title ? `《${d.title}》` : undefined, text: `${d.preview}\n${d.date}\n——来自暖枫` })
                }}
                aria-label="分享"
                className="absolute bottom-2 right-2 flex size-6 items-center justify-center rounded-full bg-white/70 transition-colors active:scale-90 hover:bg-stone-100"
              >
                <Share2 size={14} strokeWidth={1.8} style={{ color: '#999999' }} />
              </button>
            </div>
          ))}
        </div>
      ) : view === 'list' ? (
        /* 方案二：纯文字列表 */
        <div className="space-y-3">
          {filtered.map(d => (
            <div
              key={d.id}
              className="relative border border-dashed border-border/40 bg-surface-1 p-3 transition-all hover:bg-surface-1/70"
              style={{ borderRadius: '10px 14px 12px 16px' }}
            >
              <button
                onClick={() => setEditId(d.id)}
                className="block w-full text-left pr-8"
              >
                <h3 className="font-serif text-[14px] font-semibold text-foreground">{d.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">{d.preview}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground/70">
                  {(() => { const M = DIARY_MOOD_META[normalizeMood(d.mood)].icon; return <M size={14} strokeWidth={1.6} /> })()}
                  {d.photoCount > 0 && (
                    <>
                      <span>·</span>
                      <span><ImageIcon size={12} strokeWidth={1.6} className="text-muted-foreground/70" />{d.photoCount}张</span>
                    </>
                  )}
                  <span className="ml-auto flex items-center gap-1"><Calendar size={12} strokeWidth={1.6} className="text-muted-foreground/70" />{d.date}</span>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  share({ title: d.title ? `《${d.title}》` : undefined, text: `${d.preview}\n${d.date}\n——来自暖枫` })
                }}
                aria-label="分享"
                className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-white/70 transition-colors active:scale-90 hover:bg-stone-100"
              >
                <Share2 size={14} strokeWidth={1.8} style={{ color: '#999999' }} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* 方案三：竖向时间线 */
        <div className="flex flex-col">
          {filtered.map((d, idx) => {
            const selected = selectedTimelineId === d.id
            const day = d.date.slice(-2)
            return (
              <div key={d.id} className="relative flex gap-3">
                <div className="flex flex-col items-center pt-0.5">
                  <button
                    onClick={() => setSelectedTimelineId(d.id)}
                    className={`flex size-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-all ${selected ? 'border-sakura bg-sakura text-white' : 'border-border/50 bg-surface-1 text-muted-foreground hover:text-foreground'}`}
                    aria-label={`选中 ${d.date}`}
                  >{day}</button>
                  {idx < filtered.length - 1 && (
                    <div className="mt-1 w-px flex-1 border-l border-dashed border-border/40" style={{ minHeight: '28px' }} />
                  )}
                </div>
                <div className={`relative mb-3 flex-1 border border-dashed bg-surface-1 p-3 transition-all hover:bg-surface-1/70 ${selected ? 'border-sakura/40' : 'border-border/40'}`}
                  style={{ borderRadius: '8px 12px 10px 14px' }}
                >
                  <button
                    onClick={() => setEditId(d.id)}
                    className="block w-full text-left pr-8"
                  >
                    <div className="flex items-center justify-between">
                    <h3 className="font-serif text-[14px] font-semibold text-foreground">{d.title}</h3>
                    {(() => { const M = DIARY_MOOD_META[normalizeMood(d.mood)].icon; return <M size={14} strokeWidth={1.6} /> })()}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">{d.preview}</p>
                  {d.photoCount > 0 && (
                    <div className="mt-1.5 text-[11px] text-muted-foreground/70"><ImageIcon size={12} strokeWidth={1.6} className="text-muted-foreground/70" />{d.photoCount}张</div>
                  )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      share({ title: d.title ? `《${d.title}》` : undefined, text: `${d.preview}\n${d.date}\n——来自暖枫` })
                    }}
                    aria-label="分享"
                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-white/70 transition-colors active:scale-90 hover:bg-stone-100"
                  >
                    <Share2 size={14} strokeWidth={1.8} style={{ color: '#999999' }} />
                  </button>
                </div>
              </div>
            )
          })}
          {(() => {
            const sel = diaries.find(d => d.id === selectedTimelineId) || filtered[0]
            if (!sel) return null
            return (
              <div className="mt-3 border-t border-dashed border-border/40 pt-4">
                <p className="mb-3 text-[11px] tracking-[0.18em] text-muted-foreground/60">详情卡片</p>
                <div className="border border-dashed border-border/40 bg-surface-1 p-3" style={{ borderRadius: '10px 14px 12px 16px' }}>
                  <DiaryPhotoBlock src={sel.photos?.[0]} />
                  <h3 className={`font-serif text-[15px] font-semibold text-foreground ${sel.photoCount > 0 ? 'mt-3' : ''}`}>{sel.title}</h3>
                  <p
                    className="mt-1 text-[12px] leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: sel.html || sel.preview }}
                  />
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground/70">
                    <Calendar size={12} strokeWidth={1.6} className="text-muted-foreground/70" /><span>{sel.date}</span>
                    <span className="mx-1">·</span>
                    <span>{sel.mood}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
        </div>
      )}

      {subPage === 'memo' && (
        <MemoPage ref={memoPageRef} embedded onBack={() => setSubPage('diary')} />
      )}

    </div>
  )
}

// 编辑 / 新建页
function DiaryEditPage({ existingId, title, preview, date, mood, photos: initialPhotos = [], onBack, onSave }: {
  existingId?: string
  title: string
  preview: string
  date: string
  mood: DiaryMood
  photos?: string[]
  onBack: () => void
  onSave: (entry: DiaryEntry) => void
}) {
  const [titleValue, setTitleValue] = useState(title)
  const [contentHtml, setContentHtml] = useState(preview)
  const [moodValue, setMoodValue] = useState<DiaryMood>(mood)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [isBold, setIsBold] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  // 仅在首次挂载时把初始内容写入可编辑区，避免重渲染时 React 重置用户输入
  const initializedRef = useRef(false)
  const share = useShare()

  // 操作历史快照，用于"撤销上一步"
  type Snapshot = { title: string; content: string; mood: DiaryMood; photos: string[] }
  const historyRef = useRef<Snapshot[]>([{ title, content: preview, mood, photos: initialPhotos }])
  const historyIndexRef = useRef(0)

  const pushHistory = useCallback((next: Snapshot) => {
    // 丢弃当前位置之后的 redo 分支，追加新快照
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(next)
    historyIndexRef.current += 1
  }, [])

  const getHtml = () => contentRef.current?.innerHTML ?? contentHtml

  const handleTitleBlur = () => {
    pushHistory({ title: titleValue, content: getHtml(), mood: moodValue, photos })
  }
  const handleContentBlur = () => {
    pushHistory({ title: titleValue, content: getHtml(), mood: moodValue, photos })
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const remaining = 6 - photos.length
    const slice = Array.from(files).slice(0, remaining)
    let loaded = 0
    const newPhotos: string[] = []
    slice.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newPhotos.push(reader.result)
          loaded += 1
          if (loaded === slice.length) {
            const next = [...photos, ...newPhotos].slice(0, 6)
            setPhotos(next)
            pushHistory({ title: titleValue, content: getHtml(), mood: moodValue, photos: next })
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (idx: number) => {
    const next = photos.filter((_, i) => i !== idx)
    setPhotos(next)
    pushHistory({ title: titleValue, content: getHtml(), mood: moodValue, photos: next })
  }

  const handleSave = () => {
    const buildEntry = (rawHtml: string): DiaryEntry => {
      // 去掉编辑期插入的零宽占位符，避免空标题 span 的残留字符进入保存内容
      const html = rawHtml.replace(/\u200B/g, '')
      const plain = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
      return {
        // 编辑已有日记时复用原 id，否则新建；这是修复"再编辑不保存/只保存纯文本"的关键
        id: existingId || `d-${Date.now()}`,
        title: titleValue.trim() || '无标题日记',
        preview: plain || '（没有内容）',
        date,
        mood: moodValue,
        photoCount: photos.length,
        photos,
        html,
      }
    }
    try {
      onSave(buildEntry(getHtml()))
    } catch (err) {
      // 即便读取内容出错，也确保把当前状态保存并关闭编辑页，避免"完成没反应"
      console.error('[diary] handleSave failed', err)
      onSave(buildEntry(''))
    }
  }

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const snap = historyRef.current[historyIndexRef.current]
    setTitleValue(snap.title)
    setContentHtml(snap.content)
    if (contentRef.current) contentRef.current.innerHTML = snap.content
    setMoodValue(snap.mood)
    setPhotos(snap.photos)
    setIsBold(document.queryCommandState('bold'))
  }

  const handleBold = () => {
    const el = contentRef.current
    if (!el) return
    el.focus()
    document.execCommand('bold', false)
    const active = document.queryCommandState('bold')
    setIsBold(active)
    // 选区变化后记录一次历史
    pushHistory({ title: titleValue, content: el.innerHTML, mood: moodValue, photos })
  }

  // 斜体 / 下划线 / 标题激活态
  const [isItalicD, setIsItalicD] = useState(false)
  const [isUnderlineD, setIsUnderlineD] = useState(false)
  const [activeHeadingD, setActiveHeadingD] = useState<'' | 'H1' | 'H2' | 'H3'>('')

  // 同步日记编辑区选区样式激活态
  const syncDiaryState = () => {
    const el = contentRef.current
    if (!el) return
    setIsBold(document.queryCommandState('bold'))
    setIsItalicD(document.queryCommandState('italic'))
    setIsUnderlineD(document.queryCommandState('underline'))
    // 检查光标当前是否处于行内 H1/H2/H3 预设（font.h-tag）内 —— 用于工具栏高亮
    let tag: '' | 'H1' | 'H2' | 'H3' = ''
    try {
      const node = window.getSelection()?.anchorNode
      let el2: HTMLElement | null = node?.parentElement || null
      while (el2 && el2 !== el) {
        if (el2.classList?.contains('h-tag')) {
          const fs = (el2 as HTMLElement).style.fontSize
          if (fs === '20px') tag = 'H1'
          else if (fs === '17px') tag = 'H2'
          else if (fs === '15px') tag = 'H3'
          break
        }
        el2 = el2.parentElement
      }
    } catch { /* ignore */ }
    setActiveHeadingD(tag)
  }

  // 通用格式命令（斜体/下划线）
  const execDiary = (cmd: string) => {
    const el = contentRef.current
    if (!el) return
    el.focus()
    document.execCommand(cmd, false)
    syncDiaryState()
    pushHistory({ title: titleValue, content: el.innerHTML, mood: moodValue, photos })
  }

  // 标题：行内预设，不换行、不新建段落。
  // 点 H：从光标处开始套用内联大字号（span.h-tag），之后输入的字变大，
  // 光标之前已输入的文字完全不变；同一行可混排（前正常 + 后 H 字号）。
  // 再点同一标题 = 取消：已输入的 H 文字保留原字号，光标移到其后方，之后输入恢复标准。
  const DIARY_HEADING_SIZES: Record<'H1' | 'H2' | 'H3', string> = { H1: '20px', H2: '17px', H3: '15px' }

  // 找到光标所在的行内标题 span（h-tag），不在其中则返回 null
  const findDiaryHeadingSpan = (root: HTMLElement): HTMLElement | null => {
    const node = window.getSelection()?.anchorNode ?? null
    let cur: HTMLElement | null = node instanceof HTMLElement ? node : node?.parentElement || null
    while (cur && cur !== root) {
      if (cur.classList?.contains('h-tag')) return cur
      cur = cur.parentElement
    }
    return null
  }

  // 把光标移出行内标题 span：已输入内容保留原字号；span 为空则整体移除。
  // 移出后在 span 后补一个零宽字符，避免浏览器让后续输入继承大字号
  const exitDiaryHeadingSpan = (span: HTMLElement) => {
    const sel = window.getSelection()
    if (!sel) return
    const doc = span.ownerDocument
    const isEmpty = !(span.textContent || '').replace(/\u200B/g, '').trim()
    const range = doc.createRange()
    if (isEmpty) {
      // 还没输入过内容：整个 span 移除，光标放回原位
      range.setStartBefore(span)
      span.parentNode?.removeChild(span)
      range.collapse(true)
    } else {
      // 已有内容：保留 span，光标移到其后的零宽字符之后
      const stopper = doc.createTextNode('\u200B')
      span.parentNode?.insertBefore(stopper, span.nextSibling)
      range.setStart(stopper, 1)
      range.collapse(true)
    }
    sel.removeAllRanges()
    sel.addRange(range)
  }

  const execDiaryHeading = (h: 'H1' | 'H2' | 'H3') => {
    const el = contentRef.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    // 仅处理编辑区内的光标
    if (!el.contains(sel.getRangeAt(0).commonAncestorContainer)) return

    const current = findDiaryHeadingSpan(el)
    // 再点同一标题 = 取消，回到标准字号输入
    if (current && current.style.fontSize === DIARY_HEADING_SIZES[h]) {
      exitDiaryHeadingSpan(current)
      syncDiaryState()
      pushHistory({ title: titleValue, content: el.innerHTML, mood: moodValue, photos })
      return
    }
    // 正处于其他标题中：先退出（保留已输入内容），再应用新标题
    if (current) exitDiaryHeadingSpan(current)

    const doc = el.ownerDocument
    const range = sel.getRangeAt(0)
    const span = doc.createElement('span')
    span.className = 'h-tag'
    span.style.fontSize = DIARY_HEADING_SIZES[h]
    span.style.fontWeight = '600'

    const caret = doc.createRange()
    if (!range.collapsed) {
      // 有选中文本：把选区内容包进标题 span，光标停在其末尾
      span.appendChild(range.extractContents())
      range.insertNode(span)
      caret.selectNodeContents(span)
      caret.collapse(false)
    } else {
      // 无选区：在光标处插入含零宽占位符的标题 span，之后输入即进入其中
      span.appendChild(doc.createTextNode('\u200B'))
      range.insertNode(span)
      caret.setStart(span.firstChild as Text, 1)
      caret.collapse(true)
    }
    sel.removeAllRanges()
    sel.addRange(caret)
    syncDiaryState()
    pushHistory({ title: titleValue, content: el.innerHTML, mood: moodValue, photos })
  }

  const actions = [
    { icon: Bold, label: '加粗', onClick: handleBold, keepFocus: true },
    { icon: Share2, label: '分享', onClick: () => {
      const html = getHtml()
      const plain = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
      share({ title: titleValue ? `《${titleValue}》` : undefined, text: `${plain}\n${date}\n——来自暖枫` })
    }},
    { icon: Save, label: '保存', onClick: handleSave },
    { icon: Undo2, label: '撤销', onClick: handleUndo },
    { icon: X, label: '返回', onClick: onBack },
  ]

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ background: '#FFF8E7', paddingTop: 'var(--wi-sb, 0px)' }}>
      {/* 隐藏的文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
      />

      {/* 顶部栏：返回 + 完成 */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#E8D5B7]/40 px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-1 text-[#5C4D3C] transition-colors hover:text-[#333]" aria-label="返回">
          <ChevronLeft size={20} strokeWidth={2} />
          <span className="text-[14px]">返回</span>
        </button>
        <button
          onClick={handleSave}
          className="rounded-full px-5 py-2 text-[13px] font-semibold text-[#333] shadow-sm transition-transform active:scale-95"
          style={{ background: '#FFC145', boxShadow: '0 4px 12px -4px rgba(255,193,69,0.5)' }}
        >
          完成
        </button>
      </div>

      {/* 可滚动主体 */}
      <div className="app-scrollbar flex-1 overflow-y-auto px-5 py-4">
        {/* 标题输入框（大字号无边框） */}
        <input
          value={titleValue}
          onChange={e => setTitleValue(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="标题"
          className="mb-3 w-full bg-transparent font-serif text-[18px] font-semibold text-[#333] placeholder:text-[#C4B49A] focus:outline-none"
        />

        {/* 日期 + 心情（一行，无边框） */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] text-[#8B7355]">
            <Calendar size={12} strokeWidth={1.6} />
            <span>{date}</span>
          </div>
          <button onClick={() => setShowMoodPicker(v => !v)} className="flex items-center gap-1.5 text-[12px] text-[#8B7355] transition-colors hover:text-[#333]" aria-label="切换心情">
{(() => { const M = DIARY_MOOD_META[normalizeMood(moodValue)].icon; return <M size={14} strokeWidth={1.6} /> })()}
            <span>心情</span>
            <span className="text-[11px] text-[#E0A93B]">[更改]</span>
          </button>
        </div>
        {showMoodPicker && (
          <div className="mb-4 flex flex-wrap gap-1.5 bg-[#FFF3DD] p-2.5" style={{ borderRadius: '8px 10px 8px 10px' }}>
            {DIARY_MOODS.map(m => (
              <button
                key={m}
                onClick={() => {
                  const next = { title: titleValue, content: getHtml(), mood: m, photos }
                  setMoodValue(m)
                  setShowMoodPicker(false)
                  pushHistory(next)
                }}
                className={`flex size-9 items-center justify-center border text-[16px] transition-colors ${moodValue === m ? 'border-[#FFC145] text-[#E0A93B] bg-[#FFF0D4]' : 'border-[#E8D5B7] text-[#8B7355] hover:bg-[#FFF0D4]'}`}
                style={{ borderRadius: '5px 7px 5px 7px' }}
              >{DIARY_MOOD_META[m].icon && (() => { const P = DIARY_MOOD_META[m].icon; return <P size={16} strokeWidth={1.6} /> })()}</button>
            ))}
          </div>
        )}

        {/* 正文编辑区（大面积，无边框） */}
        <div
          ref={(node) => {
            contentRef.current = node
            if (node && !initializedRef.current) {
              node.innerHTML = contentHtml
              initializedRef.current = true
            }
          }}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleContentBlur}
          onInput={syncDiaryState}
          onKeyUp={syncDiaryState}
          onMouseUp={syncDiaryState}
          data-placeholder="可以输入很多内容..."
          className="diary-content min-h-[50vh] w-full bg-transparent text-[15px] leading-relaxed text-[#333] focus:outline-none empty:before:text-[#C4B49A] empty:before:content-[attr(data-placeholder)]"
        />

        {/* 图片 */}
        <div className="mt-6 mb-1.5 flex items-center gap-1.5 text-[11px] text-[#8B7355]">
          <ImageIcon size={12} strokeWidth={1.6} />
          <span>图片（{photos.length}/6）</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {photos.map((src, i) => (
            <div key={i} className="group relative aspect-[3/2] overflow-hidden bg-[#FFF3DD]" style={{ borderRadius: '8px 10px 8px 10px' }}>
              <img src={src} alt={`图片 ${i + 1}`} className="h-full w-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="删除图片"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          ))}
          {photos.length < 6 && (
            <button onClick={() => fileInputRef.current?.click()} className="flex aspect-[3/2] items-center justify-center bg-[#FFF0D4] text-[#E0A93B] transition-colors hover:bg-[#FFE6BE]" style={{ borderRadius: '8px 10px 8px 10px' }} aria-label="添加图片">
              <Plus size={20} strokeWidth={1.6} />
            </button>
          )}
        </div>
      </div>

      {/* 底部工具栏：加粗 斜体 下划线 H1 H2 H3 撤销 */}
      <div className="flex shrink-0 items-stretch border-t border-[#E8D5B7]/40 bg-[#FFF3DD] px-1 py-2">
        {/* 加粗 */}
        <button
          onClick={handleBold}
          onMouseDown={e => e.preventDefault()}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] transition-colors ${isBold ? 'bg-[#FFF0D4] text-[#E0A93B]' : 'text-[#8B7355] hover:text-[#333]'}`}
        >
          <Bold size={18} strokeWidth={isBold ? 2.2 : 1.7} />
          <span>B</span>
        </button>
        {/* 斜体 */}
        <button
          onClick={() => execDiary('italic')}
          onMouseDown={e => e.preventDefault()}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] transition-colors ${isItalicD ? 'bg-[#FFF0D4] text-[#E0A93B]' : 'text-[#8B7355] hover:text-[#333]'}`}
        >
          <Italic size={18} strokeWidth={isItalicD ? 2.2 : 1.7} />
          <span>I</span>
        </button>
        {/* 下划线 */}
        <button
          onClick={() => execDiary('underline')}
          onMouseDown={e => e.preventDefault()}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] transition-colors ${isUnderlineD ? 'bg-[#FFF0D4] text-[#E0A93B]' : 'text-[#8B7355] hover:text-[#333]'}`}
        >
          <Underline size={18} strokeWidth={isUnderlineD ? 2.2 : 1.7} />
          <span>U</span>
        </button>
        {/* 标题 H1/H2/H3（点按切换：再点同一标题取消回标准大小） */}
        {(['H1', 'H2', 'H3'] as const).map(h => (
          <button
            key={h}
            onClick={() => execDiaryHeading(h)}
            onMouseDown={e => e.preventDefault()}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold transition-colors ${activeHeadingD === h ? 'bg-[#FFF0D4] text-[#E0A93B]' : 'text-[#8B7355] hover:text-[#333]'}`}
          >
            <span className={h === 'H1' ? 'text-[15px]' : h === 'H2' ? 'text-[13px]' : 'text-[11px]'}>{h}</span>
          </button>
        ))}
        {/* 撤销 */}
        <button
          onClick={handleUndo}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] transition-colors text-[#8B7355] hover:text-[#333]`}
        >
          <Undo2 size={18} strokeWidth={1.7} />
          <span>撤销</span>
        </button>
      </div>
    </div>
  )
}

function FootprintPage({ onBack, initialModule = '日记', initialDiarySubPage = 'diary' }: { onBack: () => void; initialModule?: string; initialDiarySubPage?: 'diary' | 'memo' }) {
  const [module, setModule] = useState(initialModule)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const renderPlaceholder = (
    Icon: typeof BookOpen,
    title: string,
    desc: string,
  ) => (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E7E0D4] text-foreground dark:bg-surface-2">
        <Icon size={28} strokeWidth={1.6} />
      </div>
      <h3 className="mt-4 font-serif text-[18px] font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground/70">{desc}</p>
      <p className="mt-6 text-[11px] tracking-[0.2em] text-muted-foreground/40">即将上线</p>
    </div>
  )
  const [showCalendar, setShowCalendar] = useState(false)
  const [footprintTab, setFootprintTab] = useState<'all' | 'record' | 'mark'>('all')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set([getTodayDate()]))
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [focusRecords, setFocusRecords] = useState<FocusRecord[]>([])
  const [myDream, setMyDream] = useState<DreamData>({ title: '', description: '', deadline: '', createdAt: '', updatedAt: '', checkInDays: [] })
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([])
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const contentRef = useRef<HTMLDivElement>(null)

  const today = getTodayDate()
  const theme = getSeasonTheme(new Date().getMonth() + 1)

  // 最近心情回看：复用首页首页心情的 localStorage（homeMood / homeNote）
  const [selectedMoodDate, setSelectedMoodDate] = useState<string>(today)
  const recentMoods = useMemo(() => {
    if (typeof window === 'undefined') return []
    const moods: Record<string, string> = {}
    const notes: Record<string, string> = {}
    try {
      const m = window.localStorage.getItem('homeMood')
      if (m) Object.assign(moods, JSON.parse(m) as Record<string, string>)
    } catch { /* ignore */ }
    try {
      const n = window.localStorage.getItem('homeNote')
      if (n) Object.assign(notes, JSON.parse(n) as Record<string, string>)
    } catch { /* ignore */ }
    // 最近 7 天（含今天），从老到新
    const days: { date: string; mood: string | null; note: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({ date, mood: moods[date] ?? null, note: notes[date] ?? '' })
    }
    return days.map((d) => ({ ...d, moods, notes }))
  }, [today, module])

  useEffect(() => {
    const refreshData = () => {
      const focusRecordsStr = typeof window !== 'undefined' ? localStorage.getItem('focusRecords') : '[]'
      let newFocusRecords: FocusRecord[] = []
      if (focusRecordsStr) {
        try {
          const parsed = JSON.parse(focusRecordsStr)
          newFocusRecords = Array.isArray(parsed) ? parsed : []
        } catch { /* ignore */ }
      }
      setFocusRecords(newFocusRecords)
      
      const myDreamStr = typeof window !== 'undefined' ? localStorage.getItem('myDream') : '{}'
      let newMyDream: DreamData = { title: '', description: '', deadline: '', createdAt: '', updatedAt: '', checkInDays: [] }
      if (myDreamStr) {
        try {
          const parsed = JSON.parse(myDreamStr)
          newMyDream = (parsed && typeof parsed === 'object') ? {
            title: parsed.title || '',
            description: parsed.description || '',
            deadline: parsed.deadline || '',
            createdAt: parsed.createdAt || '',
            updatedAt: parsed.updatedAt || '',
            checkInDays: Array.isArray(parsed.checkInDays) ? parsed.checkInDays : [],
          } : newMyDream
        } catch { /* ignore */ }
      }
      setMyDream(newMyDream)
      
      setDailySummaries(getDailySummary())
    }
    
    refreshData()
    
    const handleStorageChange = () => {
      refreshData()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    const handleBadgeEarned = () => {
      refreshData()
    }
    window.addEventListener('badge-earned', handleBadgeEarned)
    
    const handleDataUpdated = () => {
      refreshData()
    }
    window.addEventListener('data-updated', handleDataUpdated)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('badge-earned', handleBadgeEarned)
      window.removeEventListener('data-updated', handleDataUpdated)
    }
  }, [])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [module])

  const getSeasonIcon = (month: number): IconName => {
    if (month >= 3 && month <= 5) return 'sprout'
    if (month >= 6 && month <= 8) return 'sun'
    if (month >= 9 && month <= 11) return 'leaf'
    return 'snowflake'
  }

  const getSeasonName = (month: number): string => {
    if (month >= 3 && month <= 5) return '春日成长篇'
    if (month >= 6 && month <= 8) return '夏日成长篇'
    if (month >= 9 && month <= 11) return '秋日成长篇'
    return '冬日成长篇'
  }

  const getDaysInMonth = (date: Date): { date: string; isToday: boolean; hasRecord: boolean }[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const days: { date: string; isToday: boolean; hasRecord: boolean }[] = []
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: '', isToday: false, hasRecord: false })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const records = getDailyRecords(dateStr)
      days.push({
        date: dateStr,
        isToday: dateStr === today,
        hasRecord: records.focus.hasRecord || records.goal.hasRecord || records.harvest.hasRecord || records.dream.hasRecord
      })
    }
    
    return days
  }

  const calendarDays = getDaysInMonth(currentMonth)

  const stats = useMemo(() => {
    let currentFocusRecords: FocusRecord[] = focusRecords
    if (currentFocusRecords.length === 0 && typeof window !== 'undefined') {
      try {
        const parsed = JSON.parse(localStorage.getItem('focusRecords') || '[]')
        currentFocusRecords = Array.isArray(parsed) ? parsed : []
      } catch { currentFocusRecords = [] }
    }
    const currentDailySummaries = dailySummaries.length > 0 
      ? dailySummaries 
      : getDailySummary()
    let currentDream: DreamData | { checkInDays: string[] } = myDream
    if (!(myDream.checkInDays.length > 0 || myDream.title) && typeof window !== 'undefined') {
      try {
        const parsed = JSON.parse(localStorage.getItem('myDream') || '{}')
        currentDream = (parsed && typeof parsed === 'object') ? parsed : { checkInDays: [] }
      } catch { currentDream = { checkInDays: [] } }
    }

    const completedFocusRecords = currentFocusRecords.filter(r => r.status === 'completed')
    const focusDates = [...new Set(completedFocusRecords.map(r => r.date))]
    
    const dreamDates = currentDream.checkInDays || []
    const allDates = [...new Set([...focusDates, ...currentDailySummaries.map(s => s.date)])]
    
    const uniqueDates = allDates.filter(dateStr => {
      const hasFocus = focusDates.includes(dateStr)
      const summary = currentDailySummaries.find(s => s.date === dateStr)
      const hasPlan = summary?.tasks && summary.tasks.completed > 0
      const hasReview = summary?.review && summary.review.content
      const hasDream = dreamDates.includes(dateStr)
      return hasFocus || hasPlan || hasReview || hasDream
    })
    
    const sortedDates = uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    
    let streak = 0
    const todayDate = new Date()
    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`
    
    if (!uniqueDates.includes(todayStr)) {
      streak = 0
    } else {
      streak = 1
      for (let i = 1; i < 365; i++) {
        const checkDate = new Date(todayDate)
        checkDate.setDate(checkDate.getDate() - i)
        const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
        if (uniqueDates.includes(checkDateStr)) {
          streak++
        } else {
          break
        }
      }
    }
    
    const recordCount = uniqueDates.length
    
    const groupedByMonth: Record<string, string[]> = {}
    sortedDates.forEach(dateStr => {
      const date = new Date(dateStr)
      const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = []
      }
      groupedByMonth[monthKey].push(dateStr)
    })
    
    const monthKeys = Object.keys(groupedByMonth).sort((a, b) => {
      const [yearA, monthA] = a.match(/(\d+)年(\d+)月/)!.slice(1).map(Number)
      const [yearB, monthB] = b.match(/(\d+)年(\d+)月/)!.slice(1).map(Number)
      return yearB * 12 + monthB - (yearA * 12 + monthA)
    })

    const todayDateObj = new Date()
    const currentMonthKey = `${todayDateObj.getFullYear()}年${todayDateObj.getMonth() + 1}月`
    
    const totalGrowthDays = uniqueDates.length
    let chapter = 1
    if (totalGrowthDays >= 8 && totalGrowthDays <= 30) chapter = 2
    else if (totalGrowthDays >= 31 && totalGrowthDays <= 90) chapter = 3
    else if (totalGrowthDays > 90) chapter = 4
    
    return {
      streak,
      totalDays: totalGrowthDays,
      totalRecords: recordCount,
      groupedByMonth,
      monthKeys,
      currentMonthKey,
      chapter
    }
  }, [focusRecords, myDream, dailySummaries])

  const processedRef = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    const dreamDates = myDream.checkInDays
    
    const datesToProcess = new Set<string>()
    dailySummaries.forEach(s => datesToProcess.add(s.date))
    focusRecords.filter(r => r.status === 'completed').forEach(r => datesToProcess.add(r.date))
    dreamDates.forEach(d => datesToProcess.add(d))
    
    datesToProcess.forEach(dateStr => {
      if (processedRef.current.has(dateStr)) return
      const dayRecords = getDailyRecords(dateStr)
      if (dayRecords.goal.hasRecord && dayRecords.goal.completedCount === dayRecords.goal.totalCount && dayRecords.goal.totalCount > 0) {
        saveGrowthEvent(dateStr, 'plan')
      }
      if (dayRecords.focus.hasRecord && dayRecords.focus.totalSeconds >= 300) {
        saveGrowthEvent(dateStr, 'focus')
      }
      if (dayRecords.harvest.hasRecord) {
        saveGrowthEvent(dateStr, 'review')
      }
      if (dayRecords.dream.hasRecord) {
        saveGrowthEvent(dateStr, 'dream')
      }
      processedRef.current.add(dateStr)
    })

    const weekPlanMap: Record<string, string[]> = {}
    dailySummaries.forEach(s => {
      const week = getWeekNumber(s.date)
      if (!weekPlanMap[week]) weekPlanMap[week] = []
      if (hasGrowthEvent(s.date, 'plan')) {
        weekPlanMap[week].push(s.date)
      }
    })
    Object.values(weekPlanMap).forEach(dates => {
      if (dates.length >= 7) {
        const lastDate = dates[dates.length - 1]
        if (!processedRef.current.has(`weekly_${lastDate}`)) {
          saveGrowthEvent(lastDate, 'weekly_plan')
          processedRef.current.add(`weekly_${lastDate}`)
        }
      }
    })
  }, [focusRecords, myDream, dailySummaries])

  useEffect(() => {
    setExpandedMonth(stats.currentMonthKey)
  }, [stats.currentMonthKey])
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}秒`
    return secs === 0 ? `${mins}分钟` : `${mins}分钟${secs}秒`
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const toggleMonth = (monthKey: string) => {
    if (expandedMonth === monthKey) {
      setExpandedMonth(null)
    } else {
      setExpandedMonth(monthKey)
      setTimeout(() => {
        const el = monthRefs.current[monthKey]
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  const toggleDate = (dateStr: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev)
      if (next.has(dateStr)) {
        next.delete(dateStr)
      } else {
        next.add(dateStr)
      }
      return next
    })
  }

  const handleCalendarDateClick = (dateStr: string) => {
    const date = new Date(dateStr)
    const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`
    setExpandedMonth(monthKey)
    setExpandedDates(new Set([dateStr]))
    setShowCalendar(false)
    setTimeout(() => {
      const el = monthRefs.current[monthKey]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  return (
    <div className="flex min-h-0 flex-1">
      <aside className={`flex shrink-0 flex-col overflow-hidden bg-surface-1 transition-all duration-200 ${sidebarOpen ? 'w-[70px] border-r border-[#E0D7C9] dark:border-border' : 'w-0'}`}>
        {sidebarOpen && (
          <>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="收起导航栏"
              className="mx-2 mt-3 mb-1 flex items-center justify-center rounded-xl py-2 text-[#888780] transition-colors hover:text-[#D9B36A] dark:text-muted-foreground"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <div className="flex flex-1 flex-col gap-1 py-2">
            {[
              { key: '日记', icon: BookOpen, label: '日记' },
              { key: '灵感', icon: Lightbulb, label: '灵感' },
              { key: '饮食', icon: Coffee, label: '饮食' },
              { key: '睡眠', icon: Moon, label: '睡眠' },
            ].map(({ key, icon: Icon, label }) => {
              const selected = module === key
              return (
                <button
                  key={key}
                  onClick={() => setModule(key)}
                  aria-current={selected ? 'page' : undefined}
                  className={`relative mx-2 flex min-h-[44px] justify-center px-0 items-center rounded-xl py-2.5 transition-colors ${selected ? 'text-[#D9B36A] dark:text-sakura' : 'text-[#888780] hover:bg-surface-2 hover:text-[#5C5C5C] dark:text-muted-foreground dark:hover:text-foreground'}`}
                >
                  {selected && <motion.span layoutId="nav-bg" className="absolute inset-0 rounded-xl bg-[#FAF4E6] z-0 dark:bg-surface-2" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                  {selected && <motion.span layoutId="nav-indicator" className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-[#D9B36A] z-10" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                  <span className={`relative z-10 flex items-center justify-center`}>
                  <LucideDrawIcon icon={Icon} active={selected} size={20} strokeWidth={2} />
                  </span>
                </button>
              )
            })}
            </div>
          </>
        )}
      </aside>
      <div
        ref={contentRef}
        className={`app-scrollbar min-h-0 flex-1 paper-texture bg-background overflow-y-auto px-5 pb-24`}
      >
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="展开导航栏"
            className="mt-5 mb-1.5 flex items-center gap-1.5 self-start rounded-xl px-3 py-2 text-[13px] text-[#888780] transition-colors hover:text-[#D9B36A] dark:text-muted-foreground"
          >
            <ChevronRight size={16} strokeWidth={2} />
            导航
          </button>
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={module}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={''}
          >
{module === '日记' ? (
          <DiaryModule initialSubPage={initialDiarySubPage} />
        ) : module === '灵感' ? (
          <InspirationModule />
        ) : module === '饮食' ? (
          <DietModule />
        ) : module === '睡眠' ? (
          <SleepDiaryPage onBack={() => setModule('日记')} />
        ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export function WarmFengApp() {
  const [nav, setNav] = useState('首页')
  const [readingArticle, setReadingArticle] = useState<Article | null>(null)
  const [footprintModule, setFootprintModule] = useState('日记')
  const [diarySubPage, setDiarySubPage] = useState<'diary' | 'memo'>('diary')
  const [focusShowNav, setFocusShowNav] = useState(true)
  const [starting, setStarting] = useState(true)
  const [homeBgImage, setHomeBgImage] = useState<string | null>(null)
  const [homeTextColor, setHomeTextColor] = useState<string>('#3D3D3D')
  const [showHomeBgSettings, setShowHomeBgSettings] = useState(false)
  // 当前时段（day/evening/night）：初始固定 'day' 避免 SSR/CSR 水合不匹配，挂载后由 useEffect 按真实时间回填
  const [currentPeriod, setCurrentPeriod] = useState<PeriodKey>('day')
  // 用户 UID：初始固定占位值，挂载后由 useEffect 从 localStorage 读取/生成（避免渲染期调用 getUID 触发 mismatch）
  const [uid, setUid] = useState<string>('暖枫 -2026')
  // "我的"页壁纸与文字色（2026-08 已恢复，见 关于我的界面/meState.ts）
  // 初始值使用固定默认值（避免 SSR/CSR 水合不匹配），实际数据在 useEffect 中读取
  const [meBgImage, setMeBgImage] = useState<string | null>(null)
  const [meTextColor, setMeTextColor] = useState<string>('#3D3D3D')
  // 自动保存提示
  const [autoSaveToast, setAutoSaveToast] = useState<string | null>(null)

  // 深夜模式（深色主题）：true=深色，持久化于 localStorage
  // 初始值使用固定默认值 false（避免 SSR/CSR 水合不匹配），实际数据在 useEffect 中读取
  const DARK_MODE_KEY = 'warmFengDarkMode'
  const [isDark, setIsDark] = useState<boolean>(false)
  // "我的"页相关状态与持久化（2026-08-08 设置页已分离为独立 SettingsPage）
  const [meEditProfileOpen, setMeEditProfileOpen] = useState(false)
  // 温柔提醒
  const [showReminderSettings, setShowReminderSettings] = useState(false)
  const {
    reminders: reminderList,
    activeReminder,
    notificationStatus,
    requestPermission: requestReminderPermission,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    dismissActive,
  } = useReminders()
  const [meAvatar, setMeAvatar] = useState<string | null>(null)
  const [meName, setMeName] = useState<string>('暖枫')
  const [meSign, setMeSign] = useState<string>('每一步小小的足迹，都是未来的你。')
  const [meGender, setMeGender] = useState<string>('')
  // 持久化"我的"页壁纸
  useEffect(() => {
    try {
      if (meBgImage) localStorage.setItem('warmFengMeBg', meBgImage)
      else localStorage.removeItem('warmFengMeBg')
    } catch {
      /* 存储失败忽略 */
    }
  }, [meBgImage])
  // 根据"我的"页壁纸自适应文字颜色
  useEffect(() => {
    getMeTextColor(meBgImage).then((color) => {
      setMeTextColor(color)
      try { localStorage.setItem('warmFengMeTextColor', color) } catch { /* ignore */ }
    })
  }, [meBgImage])
  // 持久化"我的"页档案
  useEffect(() => {
    try {
      if (meAvatar) localStorage.setItem('warmFengMeAvatar', meAvatar)
      else localStorage.removeItem('warmFengMeAvatar')
      localStorage.setItem('warmFengMeName', meName)
      localStorage.setItem('warmFengMeSign', meSign)
      localStorage.setItem('warmFengMeGender', meGender)
    } catch {
      /* 存储失败忽略 */
    }
  }, [meAvatar, meName, meSign, meGender])

  // 记录今日登录天数（"已陪伴你 X 天"），App 启动即计一次，按本地日期去重
  // 初始化：组件挂载后从 localStorage 读取实际数据（避免 SSR/CSR 水合不匹配）
  useEffect(() => {
    // 首次原生启动时迁移 localStorage 数据到 Preferences（清缓存不丢数据）
    void migrateLocalStorageToPreferences()

    try {
      // 深夜模式
      const savedDarkMode = localStorage.getItem(DARK_MODE_KEY) === '1'
      setIsDark(savedDarkMode)
      if (savedDarkMode) {
        document.documentElement.classList.add('dark')
      }

      // "我的"页数据
      const savedBg = localStorage.getItem('warmFengMeBg')
      if (savedBg) setMeBgImage(savedBg)

      const savedTextColor = localStorage.getItem('warmFengMeTextColor')
      if (savedTextColor) setMeTextColor(savedTextColor)

      const savedAvatar = localStorage.getItem('warmFengMeAvatar')
      if (savedAvatar) setMeAvatar(savedAvatar)

      const savedName = localStorage.getItem('warmFengMeName')
      if (savedName) setMeName(savedName)

      const savedSign = localStorage.getItem('warmFengMeSign')
      if (savedSign) setMeSign(savedSign)

      const savedGender = localStorage.getItem('warmFengMeGender')
      if (savedGender) setMeGender(savedGender)

      // 回填当前时段与用户 UID（均为客户端专属数据，必须挂载后再读取）
      setCurrentPeriod(getCurrentPeriod())
      setUid(getUID())
    } catch {
      // 忽略读取失败（如隐私模式）
    }
  }, [])

  // 键盘处理：原生平台监听键盘事件，设置 CSS 变量供布局适配
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleKeyboardShow = (info: { keyboardHeight: number }) => {
      document.documentElement.style.setProperty('--wi-kb', `${info.keyboardHeight}px`)
    }
    const handleKeyboardHide = () => {
      document.documentElement.style.removeProperty('--wi-kb')
    }

    const showListener = Keyboard.addListener('keyboardWillShow', handleKeyboardShow)
    const hideListener = Keyboard.addListener('keyboardWillHide', handleKeyboardHide)

    return () => {
      showListener.then(l => l.remove())
      hideListener.then(l => l.remove())
    }
  }, [])

  useEffect(() => {
    recordLoginToday()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setStarting(false), 1100)
    const safety = setTimeout(() => setStarting(false), 2500)
    return () => {
      clearTimeout(t)
      clearTimeout(safety)
    }
  }, [])

  // 获取系统状态栏高度（真机用），写入全局 CSS 变量 --wi-sb：
  // CSS env() 在部分设备上失效，改用原生返回的 dp 值；
  // 变量挂在 documentElement 上，全屏布局页面（专注/盼兮/编辑器浮层）也能自行避让；
  // getInfo 异步返回前先写入估算值（Android 标准状态栏 24dp × 屏幕密度），
  // 避免页面首帧以 0 偏移渲染后再跳动/被遮挡
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const est = Math.round(24 * (window.devicePixelRatio || 2))
    document.documentElement.style.setProperty('--wi-sb', `${est}px`)
    StatusBar.getInfo()
      .then((info) => {
        if (info.height > 0) {
          document.documentElement.style.setProperty('--wi-sb', `${info.height}px`)
        }
      })
      .catch(() => {
        // 失败时保留估算值（比 CSS env() 兜底更可靠）
      })
  }, [])

  // 自动保存：应用切换到后台或退出时，自动保存所有数据
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handleAppStateChange = ({ isActive }: { isActive: boolean }) => {
      if (!isActive) {
        // 应用进入后台，触发自动保存
        console.log('[暖枫] 应用进入后台，自动保存数据...')
        // 数据已在每次操作时实时保存，这里只是确保所有待写入数据落盘
        // 显示自动保存提示
        setAutoSaveToast('数据已自动保存')
        setTimeout(() => setAutoSaveToast(null), 2000)
      }
    }

    App.addListener('appStateChange', handleAppStateChange)

    return () => {
      App.removeAllListeners()
    }
  }, [])

  // 同步深夜模式到 html 元素 class + 持久化
  useEffect(() => {
    const html = document.documentElement
    html.classList.toggle('dark', isDark)
    try {
      localStorage.setItem(DARK_MODE_KEY, isDark ? '1' : '0')
    } catch {
      /* 忽略隐私模式下的写入失败 */
    }
  }, [isDark])

  // 顶部 HomeHeader 背景图（方案 B）：按当前时段读取对应配置；
  // 若该时段为 null → 使用时段默认图；否则使用用户为该时段设置的图/颜色。
  // 无论是否手动设置，都安排到点自动切换到下一时段。
  const syncHomeBg = useCallback(() => {
    let image: string | null = null
    let textColor: string = '#3D3D3D'
    try {
      const periodCfg = loadHomeBgPeriodConfig()
      const period = getCurrentPeriod()
      const cfg = periodCfg[period]
      if (cfg) {
        image = cfg.type === 'image' ? cfg.value : null
      } else {
        image = getTimeBasedHomeBg()
      }
    } catch {
      image = getTimeBasedHomeBg()
    }
    setHomeBgImage(image)
    setHomeTextColor(getHomeTextColor(image))
    setCurrentPeriod(getCurrentPeriod())
    // 始终安排到下一时段边界的自动切换
    const delay = getNextHomeBgSwitchDelay()
    if (homeBgSwitchTimer.current) clearTimeout(homeBgSwitchTimer.current)
    homeBgSwitchTimer.current = setTimeout(() => syncHomeBg(), delay)
  }, [])

  const homeBgSwitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    syncHomeBg()
    const handler = () => syncHomeBg()
    // 页面从后台切回前台时，立即按当前时间重新对齐背景：
    // 否则 App 在后台（锁屏/最小化）跨过 6:00、18:00、19:30 边界后，
    // 后台被节流的 setTimeout 可能不及时触发，回到前台会卡在旧时段的图。
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') syncHomeBg()
    }
    window.addEventListener('homeBgPeriodChanged', handler)
    window.addEventListener('storage', handler)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('homeBgPeriodChanged', handler)
      window.removeEventListener('storage', handler)
      document.removeEventListener('visibilitychange', onVisible)
      if (homeBgSwitchTimer.current) clearTimeout(homeBgSwitchTimer.current)
    }
  }, [syncHomeBg])

  // HomeHeader 长按 1 秒换背景
  const homeBgLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const homeBgLongPressMoved = useRef(false)

  const clearHomeBgTimer = () => {
    if (homeBgLongPressTimer.current) {
      clearTimeout(homeBgLongPressTimer.current)
      homeBgLongPressTimer.current = null
    }
  }

  const handleHomeBgPointerDown = () => {
    homeBgLongPressMoved.current = false
    clearHomeBgTimer()
    homeBgLongPressTimer.current = setTimeout(() => {
      if (!homeBgLongPressMoved.current) {
        setShowHomeBgSettings(true)
      }
    }, 1000)
  }
  const handleHomeBgPointerMove = () => {
    homeBgLongPressMoved.current = true
    clearHomeBgTimer()
  }
  const handleHomeBgPointerUp = () => {
    clearHomeBgTimer()
  }

  const homeBgFileRef = useRef<HTMLInputElement>(null)

  const updateHomeBgConfig = (newConfig: BannerConfig) => {
    // 方案 B：写入"当前时段"的槽位，而非覆盖全局
    const periodCfg = loadHomeBgPeriodConfig()
    const period = getCurrentPeriod()
    periodCfg[period] = newConfig
    saveHomeBgPeriodConfig(periodCfg)
    window.dispatchEvent(new Event('homeBgPeriodChanged'))
  }

  // 恢复"当前时段"为跟随默认自动图
  const resetCurrentPeriodHomeBg = () => {
    const periodCfg = loadHomeBgPeriodConfig()
    const period = getCurrentPeriod()
    periodCfg[period] = null
    saveHomeBgPeriodConfig(periodCfg)
    window.dispatchEvent(new Event('homeBgPeriodChanged'))
  }

  const handleHomeBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateHomeBgConfig({ type: 'image', value: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const homePresetBanners = [
    { type: 'image' as const, name: '默认', value: '/default-banner.jpg' },
    { type: 'color' as const, name: '纯色', value: 'transparent' },
  ]

  useEffect(() => {
    // 首次打开/访问页面：补写入基础数据源键
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('warmFengFirstOpen')) {
        localStorage.setItem('warmFengFirstOpen', getTodayDate())
      }
      try {
        if (!localStorage.getItem('warmFengVisitedPages')) {
          localStorage.setItem('warmFengVisitedPages', JSON.stringify([]))
        }
      } catch { /* 忽略 */ }
    }
  }, [])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted px-0 py-0 sm:px-6 sm:py-8">
      <div
        id="app-canvas"
        className={`relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden ${(nav === '首页' || nav === '我的' || nav === '专注' || nav === '专注历史' || nav === '盼兮') ? '' : 'pt-[max(env(safe-area-inset-top),var(--wi-sb,0px))]'} shadow-2xl sm:h-[820px] sm:rounded-[42px] sm:border-[7px] sm:border-foreground/90 ${nav === '音乐' ? 'bg-transparent' : 'bg-background'}`}
      >
        {starting && <PageLoader variant="light" showProgress position="absolute" />}
        {/* 顶部间距占位（保持布局） */}
        {nav !== '首页' && nav !== '我的' && nav !== '专注' && nav !== '专注历史' && nav !== '目标' && nav !== '目标历史' && nav !== '本周计划' && nav !== '今日计划' && nav !== '阅读' && nav !== '心迹' && nav !== '音乐' && nav !== '深呼吸' && nav !== '足迹' && nav !== '备忘录' && nav !== '盼兮' && nav !== '设置' && (
          <div className="shrink-0 h-10" aria-hidden="true" />
        )}
        {/* 首页常驻固定头部：背景图盖住头部，不随内容滚动 */}
        {nav === '首页' && (
          <div
            className="relative z-20 shrink-0"
            onPointerDown={handleHomeBgPointerDown}
            onPointerMove={handleHomeBgPointerMove}
            onPointerUp={handleHomeBgPointerUp}
            onPointerCancel={handleHomeBgPointerUp}
            onPointerLeave={handleHomeBgPointerUp}
          >
            {/* 顶部背景图：固定高度，从头部顶端铺下，高度与原本一致 */}
            {homeBgImage && (
              <div
                className="absolute inset-x-0 top-0 z-0 h-[170px] overflow-hidden pointer-events-none"
                style={{
                  backgroundImage: `url(${homeBgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            {homeBgImage && (
              <div
                className="absolute inset-x-0 top-0 z-0 h-[170px] overflow-hidden pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(var(--home-fade),0) 0%, rgba(var(--home-fade),0) 60%, rgba(var(--home-fade),0.9) 92%, rgba(var(--home-fade),1) 100%)',
                }}
              />
            )}
            {/* 深色模式：在亮色背景图上叠加暗色蒙版，避免顶部一片亮白 */}
            {homeBgImage && (
              <div
                className="absolute inset-x-0 top-0 z-0 h-[170px] overflow-hidden pointer-events-none dark:block hidden"
                style={{
                  background: 'linear-gradient(to bottom, rgba(16,14,20,0.62) 0%, rgba(16,14,20,0.5) 50%, rgba(16,14,20,0.85) 92%, rgba(16,14,20,1) 100%)',
                }}
              />
            )}
            {/* 问候语 */}
            <div className="relative z-10 shrink-0 h-10" aria-hidden="true" />
            <div className="relative z-10 px-6">
              <HomeHeader textColor={homeTextColor} />
            </div>
          </div>
        )}
          <div
            key={nav}
            className="flex min-h-0 flex-1 flex-col page-nav-enter"
          >
        {nav === '首页' ? (
          <div className="app-scrollbar flex-1 overflow-y-auto px-5 pb-28 paper-texture pt-6">
            {/* TimeWeather：实时时间 + 当地真实天气（默认地球占位，原大卡片位置，工具栏上方） */}
            <div className="mt-6">
              <TimeWeatherCard onNavigate={setNav} />
            </div>
            {/* FeatureNav */}
            <FeatureNav
              onFeature={(module) => {
                if (module === '心迹') {
                  setNav('心迹')
                  return
                }
                if (module === '深呼吸') {
                  setNav('深呼吸')
                  return
                }
                if (module === '盼兮') {
                  setNav('盼兮')
                  return
                }
                if (module === '备忘录') {
                  setDiarySubPage('memo')
                  setFootprintModule('日记')
                  setNav('足迹')
                  return
                }
                setDiarySubPage('diary')
                setFootprintModule(module)
                setNav('足迹')
              }}
            />
            {/* HealingQuotes */}
            <HealingQuotes />
            {/* ContentStream */}
            <ContentStream
              onSelectArticle={(article) => {
                setReadingArticle(article)
                setNav('阅读')
              }}
            />
          </div>
        ) : nav === '目标' ? (
          <GoalsPage
            onBack={() => setNav('首页')}
            onOpenWeeklyPlan={() => setNav('本周计划')}
            onOpenHistory={() => setNav('目标历史')}
            onOpenTodayPlan={() => setNav('今日计划')}
          />
        ) : nav === '目标历史' ? (
          <GoalHistoryPage onBack={() => setNav('目标')} />
        ) : nav === '本周计划' ? (
          <WeeklyPlanPage onBack={() => setNav('目标')} />
        ) : nav === '专注' ? (
          <FocusPage onBack={() => setNav('首页')} showNav={focusShowNav} onToggleNav={() => setFocusShowNav(v => !v)} onOpenMusic={() => setNav('音乐')} onOpenHistory={() => setNav('专注历史')} />
        ) : nav === '专注历史' ? (
          <FocusHistoryPage onBack={() => setNav('专注')} />
        ) : nav === '音乐' ? (
          <MusicPlayerPage onBack={() => setNav('专注')} />
        ) : nav === '深呼吸' ? (
          <BreathingPage onBack={() => setNav('首页')} />
        ) : nav === '我的' ? (
          <>
            {/* 沉浸式头部：背景墙从屏幕顶端铺下，覆盖状态栏 */}
            <div className="relative z-20 shrink-0">
              <div className="relative h-[180px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-sakura/40 via-sakura-soft/30 to-leaf/20" />
                <div className="me-orb absolute -left-10 top-10 h-44 w-44 rounded-full bg-sakura/30 blur-3xl" />
                <div className="me-orb-delayed absolute -right-10 bottom-0 h-52 w-52 rounded-full bg-leaf/25 blur-3xl" />
                {/* 用户上传的"我的"页壁纸（铺满背景墙）。未上传时回退到渐变 */}
                {meBgImage && (
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${meBgImage})` }}
                  />
                )}

                {/* 设置按钮（悬浮右上角） */}
                <div className="absolute inset-x-0 top-9 z-20 flex items-center justify-end px-4">
                  <button
                    onClick={() => setNav('设置')}
                    aria-label="设置"
                    className="flex size-9 items-center justify-center rounded-full bg-white/30 backdrop-blur-md transition-transform active:scale-95"
                    style={{ color: meTextColor }}
                  >
                    <Settings size={18} strokeWidth={1.8} />
                  </button>
                </div>

                {/* 伙伴档案信息（叠加于背景，整体偏下，全部在背景墙内可见） */}
                <div className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-4 px-5 pb-[calc(var(--wi-nb,0px)+1.5rem)]">
                  {/* 头像：可点击进入编辑资料页 */}
                  <button
                    onClick={() => setMeEditProfileOpen(true)}
                    className="relative shrink-0"
                    aria-label="编辑资料"
                  >
                    {meAvatar ? (
                      <img src={meAvatar} alt="头像" className="size-[88px] rounded-full object-cover ring-4 ring-white/80 shadow-md" />
                    ) : (
                      <div className="size-[88px] rounded-full bg-white/40 backdrop-blur-md ring-4 ring-white/80 shadow-md" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-serif text-[30px] font-medium tracking-[0.04em] leading-none drop-shadow-md" style={{ color: meTextColor }}>{meName}</p>
                    </div>
                    <p className="mt-1.5 font-serif text-[13px] leading-snug tracking-wide opacity-80" style={{ color: meTextColor }}>UID: {uid}</p>
                    <p className="mt-1.5 font-serif text-[14px] leading-5 tracking-[0.02em] opacity-85" style={{ color: meTextColor }}>{meSign}</p>
                  </div>
                </div>
              </div>
            </div>
            <MePage
              onBack={() => setNav('首页')}
              isDark={isDark}
              onToggleDark={() => setIsDark(v => !v)}
              onChangeMeBg={setMeBgImage}
              editProfileOpen={meEditProfileOpen}
              onCloseEditProfile={() => setMeEditProfileOpen(false)}
              meAvatar={meAvatar}
              meName={meName}
              meSign={meSign}
              meGender={meGender}
              onSaveProfile={(avatar, name, sign, gender) => {
                setMeAvatar(avatar)
                setMeName(name)
                setMeSign(sign)
                setMeGender(gender)
                setMeEditProfileOpen(false)
              }}
              onOpenArticle={(ref) => {
                const found = [...contentData['学习法'], ...contentData['歇一会儿'], ...contentData['成长指南'], ...contentData['生活节奏'], ...contentData['关系与人际']].find(
                  (a) => a.title === ref.title && a.category === ref.category,
                )
                setReadingArticle(
                  found ?? { title: ref.title, desc: ref.desc, date: ref.date, category: ref.category as ContentTab, body: [] },
                )
                setNav('阅读')
              }}
            />
          </>
        ) : nav === '足迹' ? (
          <FootprintPage onBack={() => setNav('首页')} initialModule={footprintModule} initialDiarySubPage={diarySubPage} />
        ) : nav === '备忘录' ? (
          <MemoPage onBack={() => setNav('首页')} />
        ) : nav === '盼兮' ? (
          <CountdownPage onBack={() => setNav('首页')} />
        ) : nav === '心迹' ? (
          <MindTraceBook onNavigate={setNav} />
        ) : nav === '今日计划' ? (
          <TodayPlanPage onBack={() => setNav('首页')} />
        ) : nav === '阅读' && readingArticle ? (
          <ArticleReader
            article={readingArticle}
            onBack={() => setNav('首页')}
            onSelect={(article) => setReadingArticle(article)}
          />
        ) : nav === '设置' ? (
          <SettingsPage
            onBack={() => setNav('我的')}
            isDark={isDark}
            onToggleDark={() => setIsDark(v => !v)}
            onChangeMeBg={setMeBgImage}
            meBgImage={meBgImage}
            onOpenReminders={() => setShowReminderSettings(true)}
            reminderCount={reminderList.length}
          />
        ) : (
          <div className="app-scrollbar flex-1 overflow-y-auto px-5 pb-28 paper-texture flex items-center justify-center text-center text-muted-foreground">
            <p>页面开发中...</p>
          </div>
        )}
          </div>
        {nav !== '阅读' && nav !== '心迹' && nav !== '音乐' && nav !== '专注历史' && (
          <>
            {/* 全局迷你音乐播放器（悬浮于底部导航上方，任何页面可见） */}
            <GlobalMusicBar onOpen={() => setNav('音乐')} />

            <nav aria-label="主导航" className={`absolute inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card px-3 pt-3 pb-[calc(var(--wi-nb,0px)+env(safe-area-inset-bottom)+1.25rem)] sm:rounded-b-[35px]`}>
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const selected = nav === item.label
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={() => { setNav(item.label) }}
                  aria-label={item.label}
                  aria-current={selected ? 'page' : undefined}
                  className={`flex items-center justify-center transition-colors ${selected ? 'text-sakura' : 'text-muted-foreground'}`}
                >
                  <motion.span
                    className="flex size-10 items-center justify-center"
                    animate={{ scale: selected ? [1, 1.12, 0.97, 1] : 1 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <LucideDrawIcon icon={Icon} active={selected} size={22} strokeWidth={selected ? 2.2 : 1.7} stagger={item.stagger} />
                  </motion.span>
                </button>
              )
            })}
          </div>
        </nav>
          </>
        )}

        {/* 顶部背景长按设置面板：按当前时段换图，支持恢复自动 */}
        {showHomeBgSettings && (
          <div
            className="absolute inset-0 z-[60] flex items-end justify-center bg-black/30"
            onPointerDown={(e) => { if (e.target === e.currentTarget) setShowHomeBgSettings(false) }}
          >
            <div className="mb-24 w-[88%] max-w-[380px] rounded-2xl bg-card p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">更换顶部背景</p>
                <button
                  onClick={() => setShowHomeBgSettings(false)}
                  className="flex size-6 items-center justify-center rounded-full border border-stone-200/60 text-muted-foreground/60"
                  aria-label="关闭"
                >
                  <Plus size={12} strokeWidth={2} className="rotate-45" />
                </button>
              </div>
              <p className="mb-2 text-[10px] font-medium text-muted-foreground">
                预设背景（应用于「{currentPeriod === 'day' ? '白天' : currentPeriod === 'evening' ? '傍晚' : '夜晚'}」时段）
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                {homePresetBanners.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      updateHomeBgConfig({ type: item.type, value: item.value })
                      setShowHomeBgSettings(false)
                    }}
                    className={`size-12 overflow-hidden rounded-lg border border-stone-200 transition-transform active:scale-90 ${homeBgImage === item.value ? 'ring-1 ring-sakura ring-offset-1' : ''}`}
                    style={item.type === 'image' ? {
                      backgroundImage: `url(${item.value})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    } : { backgroundColor: item.value === 'transparent' ? '#FBF6EE' : item.value }}
                    aria-label={item.name}
                  />
                ))}
              </div>
              <button
                onClick={() => homeBgFileRef.current?.click()}
                className="w-full rounded-lg border border-stone-200 bg-white/60 py-2.5 text-sm font-medium text-muted-foreground transition-colors active:scale-[0.98] dark:border-border dark:bg-surface-1"
              >
                从相册上传背景图（本时段）
              </button>
              <input
                ref={homeBgFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHomeBgFileUpload}
              />
              <button
                onClick={() => {
                  resetCurrentPeriodHomeBg()
                  setShowHomeBgSettings(false)
                }}
                className="mt-2 w-full rounded-lg border border-dashed border-sakura/50 bg-sakura/5 py-2.5 text-sm font-medium text-sakura transition-colors active:scale-[0.98]"
              >
                本时段恢复「跟随自动切换」
              </button>
            </div>
          </div>
        )}

        {/* 温柔提醒弹窗（全局，任何页面都可触发） */}
        <ReminderPopup reminder={activeReminder} onDismiss={dismissActive} />

        {/* 温柔提醒设置面板 */}
        <ReminderSettings
          open={showReminderSettings}
          reminders={reminderList}
          notificationStatus={notificationStatus}
          onRequestPermission={requestReminderPermission}
          onClose={() => setShowReminderSettings(false)}
          onAdd={addReminder}
          onUpdate={updateReminder}
          onDelete={deleteReminder}
          onToggle={toggleReminder}
        />

        {/* 自动保存提示 */}
        {autoSaveToast && (
          <div className="fixed inset-x-0 bottom-20 z-[100] flex justify-center px-4">
            <div className="rounded-full bg-foreground/90 px-4 py-2 text-[13px] font-medium text-background shadow-lg backdrop-blur-sm">
              {autoSaveToast}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
