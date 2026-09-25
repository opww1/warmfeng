/**
 * 目标数据层 — 统一入口
 * 所有目标/打卡/习惯/计划相关的读取和保存都通过这里，
 * 保证其他页面可以直接 import 复用，数据格式一致。
 */

// ── 类型 ──────────────────────────────────────────

export type HabitCategory = 'study' | 'self' | 'life' | 'emotion'

export interface WeeklyPlan {
  id: string
  title: string
  completed: boolean
  color: string
  createdAt: string
  /** 该计划所属周的周一日期 "YYYY-MM-DD"，缺失时从 createdAt 推算（旧数据兼容） */
  weekStart?: string
}

export interface MyDream {
  title: string
  description: string
  deadline: string       // "YYYY-MM-DD"
  createdAt: string      // ISO
  updatedAt: string      // ISO
  checkInDays: string[]  // ["YYYY-MM-DD", ...]
}

export interface DailyMessage {
  content: string
  date: string
  updatedAt: string
}

export interface Habit {
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

/** 每次打卡的详细记录（写入 check-in log） */
export interface CheckInLogEntry {
  id: string           // "dream-2026-08-03" 或 "habit-{habitId}-2026-08-03"
  date: string         // "YYYY-MM-DD"
  type: 'dream' | 'habit'
  dreamTitle?: string
  habitId?: string
  habitName?: string
  category?: HabitCategory
  createdAt: string    // ISO 时间戳
}

/** 完成归档的目标 */
export interface CompletedDream {
  title: string
  description: string
  deadline: string
  createdAt: string
  completedAt: string       // ISO 时间戳
  totalCheckInDays: number
  checkInDays: string[]     // 完整的打卡日期列表
}

// ── localStorage key 常量 ─────────────────────────

const KEYS = {
  myDream: 'myDream',
  weeklyPlans: 'weeklyPlans',
  dailyMessage: 'dailyMessage',
  habits: 'habits',
  checkInLog: 'nuanYu_checkInLog',          // 新增：打卡记录日志
  completedDreams: 'nuanYu_completedDreams', // 新增：已完成目标存档
} as const

// ── 工具函数 ──────────────────────────────────────

export function getTodayDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function getLast14Days(): string[] {
  const days: string[] = []
  const today = new Date()
  // 从今天开始，向前推 13 天（最新日期在最左）
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return days
}

export function calculateRemainingDays(deadline: string): number {
  if (!deadline) return 0
  const today = new Date(getTodayDate() + 'T00:00:00')
  const end = new Date(deadline + 'T00:00:00')
  const diff = end.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function getYesterdayDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** 返回某日期所在周的周一（YYYY-MM-DD，本地时区） */
export function mondayOf(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : new Date(isoOrDate)
  if (isNaN(d.getTime())) {
    const t = new Date()
    d.setDate(t.getDate() - ((t.getDay() + 6) % 7))
  } else {
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── 梦想（MyDream）────────────────────────────────

export function loadDream(): MyDream {
  try {
    const raw = localStorage.getItem(KEYS.myDream)
    if (raw) {
      const dream = JSON.parse(raw) as any
      if (!dream || typeof dream !== 'object') return defaultDream()
      return {
        title: dream.title || dream.content || '',
        description: dream.description || '',
        deadline: dream.deadline || '',
        createdAt: dream.createdAt || '',
        updatedAt: dream.updatedAt || '',
        checkInDays: Array.isArray(dream.checkInDays) ? dream.checkInDays : [],
      }
    }
  } catch { /* ignore */ }
  return defaultDream()
}

export function defaultDream(): MyDream {
  return {
    title: '',
    description: '',
    deadline: '',
    createdAt: '',
    updatedAt: '',
    checkInDays: [],
  }
}

export function saveDream(dream: MyDream): void {
  const data = { ...dream, updatedAt: new Date().toISOString() }
  localStorage.setItem(KEYS.myDream, JSON.stringify(data))
}

// ── 梦想完成归档 ──────────────────────────────────

export function archiveDream(dream: MyDream): CompletedDream {
  const completed: CompletedDream = {
    title: dream.title,
    description: dream.description,
    deadline: dream.deadline,
    createdAt: dream.createdAt,
    completedAt: new Date().toISOString(),
    totalCheckInDays: dream.checkInDays.length,
    checkInDays: [...dream.checkInDays],
  }
  const existing = loadCompletedDreams()
  existing.push(completed)
  localStorage.setItem(KEYS.completedDreams, JSON.stringify(existing))
  // 清除当前梦想
  localStorage.removeItem(KEYS.myDream)
  return completed
}

export function loadCompletedDreams(): CompletedDream[] {
  try {
    const raw = localStorage.getItem(KEYS.completedDreams)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch { /* ignore */ }
  return []
}

// ── 每周计划（WeeklyPlan）─────────────────────────

export function loadPlans(): WeeklyPlan[] {
  try {
    const raw = localStorage.getItem(KEYS.weeklyPlans)
    if (raw) {
      const plans = JSON.parse(raw) as WeeklyPlan[]
      if (!Array.isArray(plans)) return []
      return plans.map(p => p.weekStart ? p : { ...p, weekStart: mondayOf(p.createdAt) })
    }
  } catch { /* ignore */ }
  return []
}

export function savePlans(plans: WeeklyPlan[]): void {
  localStorage.setItem(KEYS.weeklyPlans, JSON.stringify(plans))
}

export function addPlan(title: string, color: string, weekStart?: string): WeeklyPlan[] {
  const plans = loadPlans()
  const newPlan: WeeklyPlan = {
    id: generateId(),
    title: title.trim(),
    completed: false,
    color: color || 'sakura',
    createdAt: new Date().toISOString(),
    weekStart,
  }
  const updated = [newPlan, ...plans]
  savePlans(updated)
  return updated
}

export function togglePlanItem(planId: string): WeeklyPlan[] {
  const plans = loadPlans()
  const updated = plans.map(p => p.id === planId ? { ...p, completed: !p.completed } : p)
  savePlans(updated)
  return updated
}

export function deletePlanItem(planId: string): WeeklyPlan[] {
  const plans = loadPlans().filter(p => p.id !== planId)
  savePlans(plans)
  return plans
}

// ── 每日寄语（DailyMessage）───────────────────────

export function loadDailyMessage(): DailyMessage {
  try {
    const raw = localStorage.getItem(KEYS.dailyMessage)
    if (raw) {
      const msg = JSON.parse(raw) as DailyMessage
      if (msg && typeof msg === 'object' && msg.date === getTodayDate()) return msg
    }
  } catch { /* ignore */ }
  return { content: '今天也离梦想近了一点。', date: getTodayDate(), updatedAt: new Date().toISOString() }
}

export function saveDailyMessage(content: string): void {
  const msg: DailyMessage = {
    content: content.trim() || '今天也离梦想近了一点。',
    date: getTodayDate(),
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(KEYS.dailyMessage, JSON.stringify(msg))
}

// ── 习惯（Habit）───────────────────────────────────

export function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(KEYS.habits)
    if (raw) {
      const parsed = JSON.parse(raw) as Habit[]
      if (!Array.isArray(parsed)) return []
      return parsed.map(h => ({
        ...h,
        checkInHistory: Array.isArray(h.checkInHistory) ? h.checkInHistory : [],
      }))
    }
  } catch { /* ignore */ }
  return []
}

export function saveHabits(habits: Habit[]): void {
  localStorage.setItem(KEYS.habits, JSON.stringify(habits))
}

export function addHabit(name: string, icon: string, category: HabitCategory, duration: number): Habit[] {
  const habits = loadHabits()
  const newHabit: Habit = {
    id: generateId(),
    name: name.trim(),
    icon,
    category,
    goalDuration: duration,
    currentDuration: 0,
    streakDays: 0,
    lastCheckDate: '',
    checkInHistory: [],
    createdAt: new Date().toISOString(),
  }
  const updated = [...habits, newHabit]
  saveHabits(updated)
  return updated
}

export function toggleHabitCheckIn(habitId: string): Habit[] {
  const today = getTodayDate()
  const habits = loadHabits()
  const updated = habits.map(h => {
    if (h.id !== habitId) return h
    const isChecked = h.lastCheckDate === today
    let newHistory: string[]
    if (isChecked) {
      newHistory = h.checkInHistory.filter(d => d !== today)
    } else {
      newHistory = [...h.checkInHistory, today]
      // 写入打卡日志
      logCheckIn({
        id: `habit-${h.id}-${today}`,
        date: today,
        type: 'habit',
        habitId: h.id,
        habitName: h.name,
        category: h.category,
        createdAt: new Date().toISOString(),
      })
    }
    return {
      ...h,
      lastCheckDate: isChecked ? (newHistory.length > 0 ? newHistory[newHistory.length - 1] : '') : today,
      checkInHistory: newHistory,
      streakDays: calculateHabitStreak(newHistory),
    }
  })
  saveHabits(updated)
  return updated
}

export function calculateHabitStreak(checkInHistory: string[]): number {
  if (checkInHistory.length === 0) return 0
  let streak = 0
  const today = getTodayDate()
  const sorted = [...checkInHistory].sort().reverse()
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(today + 'T00:00:00')
    d.setDate(d.getDate() - i)
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (sorted[i] === expected) {
      streak++
    } else {
      break
    }
  }
  return streak
}

// ── 打卡日志（供其他页面查询）─────────────────────

export function logCheckIn(entry: CheckInLogEntry): void {
  try {
    const raw = localStorage.getItem(KEYS.checkInLog)
    let log: CheckInLogEntry[] = []
    if (raw) {
      const parsed = JSON.parse(raw)
      log = Array.isArray(parsed) ? parsed : []
    }
    // 避免重复
    if (!log.some(e => e.id === entry.id)) {
      log.unshift(entry)
      // 保留最近 365 条
      if (log.length > 365) log.length = 365
      localStorage.setItem(KEYS.checkInLog, JSON.stringify(log))
    }
  } catch { /* ignore */ }
}

export function loadCheckInLog(): CheckInLogEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.checkInLog)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch { /* ignore */ }
  return []
}

/** 查询某一天的梦想打卡 */
export function hasDreamCheckIn(date: string): boolean {
  const dream = loadDream()
  return dream.checkInDays.includes(date)
}

/** 查询某一天的习惯打卡 */
export function getHabitCheckInsOnDate(date: string): CheckInLogEntry[] {
  return loadCheckInLog().filter(e => e.date === date)
}

// ── 梦想打卡操作 ──────────────────────────────────

export function toggleDreamCheckIn(): MyDream {
  const dream = loadDream()
  const today = getTodayDate()
  const isChecked = dream.checkInDays.includes(today)
  let newCheckInDays: string[]
  if (isChecked) {
    newCheckInDays = dream.checkInDays.filter(d => d !== today)
  } else {
    newCheckInDays = [...dream.checkInDays, today]
    // 写入打卡日志
    logCheckIn({
      id: `dream-${today}`,
      date: today,
      type: 'dream',
      dreamTitle: dream.title,
      createdAt: new Date().toISOString(),
    })
  }
  dream.checkInDays = newCheckInDays
  saveDream(dream)
  return dream
}

/** 获取连续打卡天数（只算最近 30 天窗口内） */
export function getValidCheckInCount(): number {
  const dream = loadDream()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const threshold = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`
  return dream.checkInDays.filter(d => d >= threshold).length
}

// ── 今日计划（warmFengPlan，按日期）─────────────────
// 与 TodayPlanPage / TodayPlanCard 共用 localStorage['warmFengPlan'] 结构

export interface PlanItem {
  id: string
  date: string
  text: string
  tag: string
  slot: string
  done: boolean
  createdAt: number
}

export interface PlanDay {
  date: string
  items: PlanItem[]
}

const WARM_ISLE_PLAN_KEY = 'warmFengPlan'

function loadWarmIslePlan(): PlanDay[] {
  try {
    const raw = localStorage.getItem(WARM_ISLE_PLAN_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch { /* ignore */ }
  return []
}

function saveWarmIslePlan(plan: PlanDay[]): void {
  localStorage.setItem(WARM_ISLE_PLAN_KEY, JSON.stringify(plan))
}

/** 把一条内容加入「今日计划」（首页今日计划卡片可实时刷新） */
export function addTodayPlanItem(text: string): void {
  const today = getTodayDate()
  const content = text.trim()
  if (!content) return
  const plan = loadWarmIslePlan()
  const day = plan.find(d => d.date === today)
  const item: PlanItem = {
    id: generateId(),
    date: today,
    text: content,
    tag: '',
    slot: '随时',
    done: false,
    createdAt: Date.now(),
  }
  if (day) day.items.push(item)
  else plan.push({ date: today, items: [item] })
  saveWarmIslePlan(plan)
  window.dispatchEvent(new Event('data-updated'))
}
