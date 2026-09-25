/**
 * 睡眠日记数据存储层
 *
 * 统一管理睡眠记录的读取和保存，支持 LocalStorage 持久化
 * 自动派生指标：睡眠时长、睡眠效率（失眠干预最看重的两个指标）
 *
 * SSR 安全：所有 localStorage 读取都在函数内调用，不在模块顶层执行
 */

// ── 类型定义 ──────────────────────────────────────

/**
 * 精神状态评分（1-5）
 * 1 = 很累 / 2 = 一般累 / 3 = 还行 / 4 = 还不错 / 5 = 精力充沛
 * 注意：UI 上只显示手绘表情和文字标签，不显示数字
 */
export type MoodScore = 1 | 2 | 3 | 4 | 5

export interface SleepRecord {
  id: string
  date: string           // "YYYY-MM-DD"（记录的是哪天的睡眠，通常为前一天晚上）

  // 必填字段
  bedtime: string        // "HH:mm" 上床时间
  wakeTime: string       // "HH:mm" 起床时间
  wakeCount: number      // 夜间醒来次数（0/1/2/3/4，4 表示 4+）
  mood: MoodScore        // 起床后精神状态自评 1-5

  // 可选字段
  sleepLatency?: number  // 入睡时长（分钟），可选避免压力
  medication?: boolean   // 是否吃药
  dream?: boolean        // 是否做梦
  note?: string          // 一句备注，最多 100 字

  // 自动派生字段（保存时由系统计算填入）
  sleepDuration: number  // 睡眠时长（小时，保留 1 位小数）
  sleepEfficiency: number // 睡眠效率（%，保留 1 位小数）

  createdAt: string      // ISO 时间戳
  updatedAt?: string     // ISO 时间戳
}

// ── localStorage key 常量 ─────────────────────────

const STORAGE_KEY = 'warmFengSleepRecords'

// ── 工具函数 ──────────────────────────────────────

/**
 * 生成唯一 ID
 * 不使用 crypto.randomUUID()，避免手机端兼容性问题（参考 Task-058 教训）
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/**
 * 获取今日日期 key（YYYY-MM-DD）
 * 注意：此函数仅在客户端调用，不在渲染期使用
 */
export function getTodayDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * 将 "HH:mm" 时间字符串转换为分钟数
 */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// ── 指标计算 ──────────────────────────────────────

/**
 * 计算睡眠时长（小时）
 * 处理跨日情况：若起床时间 ≤ 上床时间，视为跨日（如 23:30 → 07:00）
 *
 * @param bedtime  "HH:mm" 上床时间
 * @param wakeTime "HH:mm" 起床时间
 * @returns 睡眠时长（小时，保留 1 位小数）
 */
export function calcSleepDuration(bedtime: string, wakeTime: string): number {
  const bedMin = parseTimeToMinutes(bedtime)
  const wakeMin = parseTimeToMinutes(wakeTime)

  let durationMin: number
  if (wakeMin > bedMin) {
    // 同一天内（如午睡 13:00 → 14:00）
    durationMin = wakeMin - bedMin
  } else {
    // 跨日（如 23:30 → 07:00）
    durationMin = (24 * 60 - bedMin) + wakeMin
  }

  // 保留 1 位小数
  return Math.round((durationMin / 60) * 10) / 10
}

/**
 * 计算睡眠效率（%）
 * 估算实际清醒时间 = 夜醒次数 × 10 分钟（假设每次醒来约10分钟重新入睡）
 * 睡眠效率 = (睡眠时长 - 夜醒次数×10min) / 睡眠时长 × 100%
 *
 * 注意：这是用户友好的估算公式，非医学精确计算。
 * UI 上通过 EfficiencyInfo 组件向用户解释此算法。
 *
 * @param sleepHours 睡眠时长（小时）
 * @param wakeCount  夜间醒来次数
 * @returns 睡眠效率（%，保留 1 位小数，范围 0-100）
 */
export function calcSleepEfficiency(sleepHours: number, wakeCount: number): number {
  const sleepMin = sleepHours * 60
  if (sleepMin <= 0) return 0

  const wakeMin = wakeCount * 10
  const efficiency = ((sleepMin - wakeMin) / sleepMin) * 100

  // 限制范围 0-100，保留 1 位小数
  const clamped = Math.max(0, Math.min(100, efficiency))
  return Math.round(clamped * 10) / 10
}

// ── 读取/保存/删除 ─────────────────────────────────

/**
 * 从 LocalStorage 读取全部睡眠记录
 * 注意：仅在客户端调用（useEffect 内），不在渲染期调用
 */
export function loadSleepRecords(): SleepRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const records = JSON.parse(raw) as SleepRecord[]
      if (Array.isArray(records)) {
        return records
      }
    }
  } catch {
    /* 解析失败返回空数组 */
  }
  return []
}

/**
 * 保存全部记录到 LocalStorage
 */
function persistRecords(records: SleepRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    /* 存储满或禁用时忽略 */
  }
}

/**
 * 新增或更新一条睡眠记录（同日期覆盖）
 * 自动计算派生字段（sleepDuration / sleepEfficiency）
 *
 * @param input 部分字段（无需提供 id/派生字段，由函数自动填充）
 * @returns 保存后的完整记录
 */
export function saveSleepRecord(
  input: Omit<SleepRecord, 'id' | 'sleepDuration' | 'sleepEfficiency' | 'createdAt' | 'updatedAt'> & {
    id?: string
  }
): SleepRecord {
  const records = loadSleepRecords()

  // 计算派生字段
  const sleepDuration = calcSleepDuration(input.bedtime, input.wakeTime)
  const sleepEfficiency = calcSleepEfficiency(sleepDuration, input.wakeCount)

  const now = new Date().toISOString()

  // 查找同日期记录（覆盖）
  const existingIndex = records.findIndex(r => r.date === input.date)

  let record: SleepRecord

  if (existingIndex >= 0 && (input.id || records[existingIndex].id === input.id)) {
    // 更新已有记录
    record = {
      ...records[existingIndex],
      ...input,
      id: input.id || records[existingIndex].id,
      sleepDuration,
      sleepEfficiency,
      updatedAt: now,
    }
    records[existingIndex] = record
  } else if (input.id) {
    // 按 id 更新
    const idx = records.findIndex(r => r.id === input.id)
    if (idx >= 0) {
      record = {
        ...records[idx],
        ...input,
        sleepDuration,
        sleepEfficiency,
        updatedAt: now,
      }
      records[idx] = record
    } else {
      // id 不存在，新增
      record = {
        ...input,
        id: input.id,
        sleepDuration,
        sleepEfficiency,
        createdAt: now,
      }
      records.unshift(record)
    }
  } else {
    // 新增记录
    record = {
      ...input,
      id: generateId(),
      sleepDuration,
      sleepEfficiency,
      createdAt: now,
    }
    records.unshift(record)
  }

  persistRecords(records)
  return record
}

/**
 * 删除指定 ID 的睡眠记录
 */
export function deleteSleepRecord(id: string): SleepRecord[] {
  const records = loadSleepRecords()
  const filtered = records.filter(r => r.id !== id)
  persistRecords(filtered)
  return filtered
}

// ── 查询辅助 ──────────────────────────────────────

/**
 * 获取今日睡眠记录
 * 今日记录指的是 date === getTodayDate() 的记录
 */
export function getTodayRecord(): SleepRecord | null {
  const today = getTodayDate()
  const records = loadSleepRecords()
  return records.find(r => r.date === today) || null
}

/**
 * 获取指定日期的睡眠记录
 */
export function getRecordByDate(date: string): SleepRecord | null {
  const records = loadSleepRecords()
  return records.find(r => r.date === date) || null
}

/**
 * 获取最近 N 天的睡眠记录（用于趋势图）
 * 返回按日期正序排列的记录（从最早到最近）
 * 无记录的日期不会出现在结果中
 *
 * @param days 天数（如 7 表示最近 7 天）
 */
export function getRecentRecords(days: number): SleepRecord[] {
  const records = loadSleepRecords()
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setDate(now.getDate() - days)

  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`

  return records
    .filter(r => r.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * 获取全部记录（按日期倒序，最新在前）
 */
export function getAllRecords(): SleepRecord[] {
  const records = loadSleepRecords()
  return [...records].sort((a, b) => b.date.localeCompare(a.date))
}
