'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  MoodIcon,
  MOOD_COLORS,
  MOOD_OPTIONS,
  MOOD_LABELS,
  getTodayKey,
  getHomeMood,
  getHomeNote,
  type MoodSymbol
} from '@/lib/moods'

/* ============================================================
 * 心迹 · 翻页手帐（MindTraceBook）
 * 真实日记模式：每天自动新增一页，右滑看历史
 * ============================================================ */

/* ---------- 类型定义 ---------- */
interface DayEntry {
  dateKey: string
  date: string
  weekday: string
  mood: MoodSymbol | null
  moodLabel: string
  note: string
  quote: string
  sealed: boolean
}

/* ---------- 存储 Key ---------- */
const MIND_RECORDS_KEY = 'mindTraceRecords'

/* ---------- 引言 ---------- */
const quotes = [
  '风吹哪页就读哪页。',
  '把节奏放慢，生活不是赶路。',
  '做自己就很好，不必成为别人。',
  '允许一切发生，是温柔的开始。',
  '今天也要好好吃饭，好好睡觉。',
  '慢一点没关系，你一直都在路上。',
  '把心里的褶皱，一点点抚平。',
  '愿你眼里有光，心中有暖。',
  '每一个平凡的日子，都值得被记录。',
  '慢慢来，比较快。',
]

/* ---------- 工具函数 ---------- */
const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const formatDate = (d: Date): string => {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const formatDateKey = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getPreviousDay = (dateKey: string): string | null => {
  const d = new Date(dateKey)
  d.setDate(d.getDate() - 1)
  // 最多往前推30天
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays > 30) return null
  return formatDateKey(d)
}

/* ---------- 数据管理 ---------- */
interface MindRecords {
  [dateKey: string]: DayEntry
}

const loadRecords = (): MindRecords => {
  try {
    const stored = localStorage.getItem(MIND_RECORDS_KEY)
    if (!stored) return {}
    const parsed = JSON.parse(stored)
    return (parsed && typeof parsed === 'object') ? parsed : {}
  } catch {
    return {}
  }
}

const saveRecords = (records: MindRecords): void => {
  try {
    localStorage.setItem(MIND_RECORDS_KEY, JSON.stringify(records))
  } catch {
    // ignore
  }
}

const createTodayEntry = (): DayEntry => {
  const today = new Date()
  const dateKey = formatDateKey(today)
  const homeMood = getHomeMood()
  const homeNote = getHomeNote()
  
  return {
    dateKey,
    date: formatDate(today),
    weekday: weekdays[today.getDay()],
    mood: homeMood,
    moodLabel: homeMood ? MOOD_LABELS[homeMood] : '',
    note: homeNote,
    quote: quotes[Math.floor(Math.random() * quotes.length)],
    sealed: false,
  }
}

const getOrCreateEntry = (dateKey: string): DayEntry | null => {
  const records = loadRecords()
  const todayKey = getTodayKey()
  
  // 如果是今天，检查首页是否有最新数据需要更新
  if (dateKey === todayKey) {
    const homeMood = getHomeMood()
    const homeNote = getHomeNote()
    
    if (records[dateKey]) {
      // 已存在记录，如果未封存，用首页最新数据更新
      const existing = records[dateKey]
      if (!existing.sealed) {
        const updated = {
          ...existing,
          mood: homeMood || existing.mood,
          moodLabel: homeMood ? MOOD_LABELS[homeMood] : existing.moodLabel,
          note: homeNote || existing.note,
        }
        records[dateKey] = updated
        saveRecords(records)
        return updated
      }
      return existing
    }
    
    // 不存在记录，创建新记录
    const entry = createTodayEntry()
    records[dateKey] = entry
    saveRecords(records)
    return entry
  }
  
  // 历史日期，返回 null（表示没有记录）
  return null
}

const getAllEntries = (): DayEntry[] => {
  const records = loadRecords()
  const todayKey = getTodayKey()
  const homeMood = getHomeMood()
  const homeNote = getHomeNote()
  
  // 确保今天有记录，并用首页最新数据更新
  if (!records[todayKey]) {
    records[todayKey] = createTodayEntry()
  } else {
    // 已存在记录，如果未封存，用首页最新数据更新
    const existing = records[todayKey]
    if (!existing.sealed) {
      records[todayKey] = {
        ...existing,
        mood: homeMood || existing.mood,
        moodLabel: homeMood ? MOOD_LABELS[homeMood] : existing.moodLabel,
        note: homeNote || existing.note,
      }
    }
  }
  saveRecords(records)
  
  // 按日期排序（最新在前）
  const entries = Object.values(records).sort((a, b) => 
    b.dateKey.localeCompare(a.dateKey)
  )
  
  return entries
}

/* ============================================================
 * 移动端 · 今天页（可编辑）
 * ============================================================ */
function MobileTodayPage({
  entry,
  onMoodSelect,
  onNoteChange,
  onSeal,
}: {
  entry: DayEntry
  onMoodSelect: (mood: MoodSymbol) => void
  onNoteChange: (note: string) => void
  onSeal: () => void
}) {
  const isSealed = entry.sealed

  return (
    <div className="mind-mobile-page mind-paper-bg h-full w-full flex flex-col pt-[calc(env(safe-area-inset-top,60px)+48px)] pb-[calc(env(safe-area-inset-bottom,80px)+64px)] px-6 select-none overflow-y-auto">
      {/* 日期 - 大号衬线左对齐 */}
      <div className="mb-2 gentle-in">
        <h1 className="mind-date-display text-5xl text-stone-800">
          {entry.date}
        </h1>
        <p className="text-sm text-stone-500 mt-3 font-serif-sc tracking-wider">
          {entry.weekday} · 今天
        </p>
      </div>

      {/* 手绘分割线 */}
      <div className="my-6 flex items-center gap-3">
        <span className="w-12 h-px" style={{ background: 'linear-gradient(90deg, rgba(160,137,108,0.4), rgba(160,137,108,0.1))' }} />
        <span className="w-1 h-1 rounded-full bg-stone-400/50" />
        <span className="w-2 h-px bg-stone-300/40" />
      </div>

      {/* 心情选择 - 左对齐横排 */}
      <div className="mb-6 gentle-in" style={{ animationDelay: '0.1s' }}>
        <p className="text-xs text-stone-400 mb-4 font-serif-sc tracking-[0.15em]">此刻心情</p>
        <div className="flex gap-3 flex-wrap">
          {MOOD_OPTIONS.map((mood) => {
            const colors = MOOD_COLORS[mood]
            const isSelected = entry.mood === mood
            return (
              <button
                key={mood}
                onClick={() => !isSealed && onMoodSelect(mood)}
                disabled={isSealed}
                className={`
                  mood-option relative flex flex-col items-center gap-1.5 p-3 rounded-lg cursor-pointer
                  ${isSelected ? 'mood-option-active' : 'hover:bg-stone-100/50'}
                  ${isSealed ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}
                `}
                style={{ '--mood-color': colors.color, '--mood-bg': colors.bg } as React.CSSProperties}
              >
                <MoodIcon type={mood} size={24} selected={isSelected} />
                <span 
                  className="text-[10px] font-serif-sc tracking-wider"
                  style={{ color: isSelected ? colors.color : '#9B8E82' }}
                >
                  {MOOD_LABELS[mood]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 引言 - 衬线斜体偏左 */}
      {entry.quote && (
        <div className="mb-6 gentle-in pl-4" style={{ animationDelay: '0.2s' }}>
          <p className="mind-quote text-base text-stone-500">
            &ldquo;{entry.quote}&rdquo;
          </p>
        </div>
      )}

      {/* 输入框 - 无边框手写风 */}
      <div className="flex-1 min-h-0 flex flex-col gentle-in" style={{ animationDelay: '0.3s' }}>
        <p className="text-xs text-stone-400 mb-3 font-serif-sc tracking-[0.15em]">想对自己说的话</p>
        <textarea
          value={entry.note}
          onChange={(e) => !isSealed && onNoteChange(e.target.value)}
          disabled={isSealed}
          placeholder="写点什么给今天的自己..."
          className="mind-textarea w-full flex-1 resize-none outline-none"
          maxLength={200}
        />
        {!isSealed && entry.note && (
          <div className="text-right text-xs text-stone-300 mt-1 font-serif-sc">
            {entry.note.length} / 200
          </div>
        )}
      </div>

      {/* 封存按钮 */}
      <div className="mt-6 flex justify-end gentle-in" style={{ animationDelay: '0.4s' }}>
        {!isSealed ? (
          <button
            onClick={onSeal}
            disabled={!entry.mood || !entry.note.trim()}
            className={`
              mind-seal-btn px-8 py-3 rounded-sm border transition-all duration-400
              text-sm font-serif-sc tracking-[0.3em]
              ${entry.mood && entry.note.trim()
                ? 'border-stone-400/60 text-stone-600 hover:bg-stone-50 hover:border-stone-500/80 shadow-sm cursor-pointer active:scale-[0.98]'
                : 'border-stone-200/50 text-stone-300 cursor-not-allowed'
              }
            `}
          >
            轻轻封存
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-stone-400 font-serif-sc tracking-wider">
            <svg width="14" height="14" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="0.8" />
              <path d="M5 3V5.5L6.5 6.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
            </svg>
            <span>已封存 · 不可更改</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
 * 移动端 · 历史页（只读）
 * ============================================================ */
function MobileHistoryPage({ entry }: { entry: DayEntry }) {
  const moodColors = entry.mood ? MOOD_COLORS[entry.mood] : null

  return (
    <div className="mind-mobile-page mind-paper-bg-alt h-full w-full flex flex-col pt-[calc(env(safe-area-inset-top,60px)+48px)] pb-[calc(env(safe-area-inset-bottom,80px)+64px)] px-6 select-none overflow-y-auto">
      {/* 日期 */}
      <div className="mb-6 gentle-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-start justify-between">
          <h1 className="mind-date-display text-4xl text-stone-700">
            {entry.date}
          </h1>
          <span className="text-[10px] tracking-widest text-stone-300 font-serif-sc mt-2">
            {entry.weekday}
          </span>
        </div>
      </div>

      {/* 心情标签 */}
      {entry.mood && moodColors && (
        <div className="mb-5 gentle-in" style={{ animationDelay: '0.15s' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" 
               style={{ background: moodColors.bg, border: `1px solid ${moodColors.color}20` }}>
            <MoodIcon type={entry.mood} size={18} selected={true} />
            <span className="text-xs font-serif-sc tracking-wider" style={{ color: moodColors.color }}>
              {entry.moodLabel}
            </span>
          </div>
        </div>
      )}

      {/* 引言 */}
      {entry.quote && (
        <div className="mb-6 pl-6 gentle-in" style={{ animationDelay: '0.2s' }}>
          <div className="relative">
            <span className="absolute -left-4 top-0 text-3xl text-stone-300/50 font-serif-sc leading-none">&ldquo;</span>
            <p className="mind-quote text-lg text-stone-500">
              {entry.quote}
            </p>
            <span className="absolute -right-1 bottom-0 text-3xl text-stone-300/50 font-serif-sc leading-none">&rdquo;</span>
          </div>
        </div>
      )}

      {/* 碎碎念 */}
      {entry.note && (
        <div className="flex-1 min-h-0 gentle-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-stone-400 font-serif-sc tracking-[0.15em]">那天的碎碎念</span>
            <span className="flex-1 h-px bg-stone-200/50" />
          </div>
          <div className="overflow-y-auto pr-2">
            <p className="mind-handwrite-text text-[17px] text-stone-600/90 indent-8">
              {entry.note}
            </p>
          </div>
        </div>
      )}

      {/* 底部印章装饰 */}
      {entry.sealed && (
        <div className="mt-6 flex items-center justify-between gentle-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-1.5 text-[10px] text-stone-300 font-serif-sc tracking-wider">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="0.8" />
              <path d="M5 3V5.5L6.5 6.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
            </svg>
            <span>已封存</span>
          </div>
          <div className="mind-stamp">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="#8B7355" strokeWidth="0.6" strokeDasharray="2 2" />
              <text x="20" y="24" textAnchor="middle" fontSize="10" fill="#8B7355" fontFamily="Noto Serif SC, serif" fontWeight="300">
                心迹
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
 * 空日期页（无记录的历史日期）
 * ============================================================ */
function EmptyDatePage({ dateKey, date, weekday }: { dateKey: string; date: string; weekday: string }) {
  return (
    <div className="mind-mobile-page mind-paper-bg h-full w-full flex flex-col pt-[calc(env(safe-area-inset-top,60px)+48px)] pb-[calc(env(safe-area-inset-bottom,80px)+64px)] px-6 select-none overflow-y-auto">
      <div className="mb-6">
        <h1 className="mind-date-display text-4xl text-stone-400">
          {date}
        </h1>
        <p className="text-sm text-stone-400 mt-3 font-serif-sc tracking-wider">
          {weekday}
        </p>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="mb-4 opacity-50">
          <path d="M30 10C30 10 18 18 18 30C18 42 24 50 30 50C36 50 42 42 42 30C42 18 30 10 30 10Z" 
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 50V20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <p className="text-sm font-serif-sc tracking-wider">这一天还没有记录</p>
        <p className="text-xs text-stone-300 mt-2 font-serif-sc">只有今天可以写下心迹</p>
      </div>
    </div>
  )
}

/* ============================================================
 * 筛选面板（居中弹窗）
 * ============================================================ */
function FilterPanel({ 
  entries, 
  currentDateKey,
  onSelect,
  onClose 
}: { 
  entries: DayEntry[]
  currentDateKey: string
  onSelect: (dateKey: string) => void
  onClose: () => void
}) {
  const [filterMood, setFilterMood] = useState<MoodSymbol | 'all'>('all')
  
  const filtered = entries.filter(e => {
    if (filterMood === 'all') return true
    return e.mood === filterMood
  })

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* 面板内容 - 居中弹窗 */}
      <div 
        className="relative w-full max-w-[380px] bg-[#FBF9F1] rounded-2xl shadow-2xl max-h-[80%] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200/50 transition-all"
            aria-label="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        
        {/* 标题 */}
        <div className="px-6 pb-4">
          <h3 className="text-lg text-stone-700 font-serif-sc">筛选 · 所有心情</h3>
          <p className="text-xs text-stone-400 mt-1">共 {entries.length} 条记录</p>
        </div>
        
        {/* 心情筛选 */}
        <div className="px-6 pb-4 border-b border-stone-200/50">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterMood('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-serif-sc whitespace-nowrap transition-all ${
                filterMood === 'all' 
                  ? 'bg-stone-700 text-white' 
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              全部
            </button>
            {MOOD_OPTIONS.map((mood) => {
              const colors = MOOD_COLORS[mood]
              const count = entries.filter(e => e.mood === mood).length
              return (
                <button
                  key={mood}
                  onClick={() => setFilterMood(mood)}
                  className={`px-3 py-1.5 rounded-full text-xs font-serif-sc whitespace-nowrap transition-all flex items-center gap-1 ${
                    filterMood === mood 
                      ? 'text-white' 
                      : 'text-stone-500 hover:bg-stone-100'
                  }`}
                  style={filterMood === mood ? { background: colors.color } : {}}
                >
                  <MoodIcon type={mood} size={14} selected={filterMood === mood} />
                  <span>{MOOD_LABELS[mood]} ({count})</span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* 记录列表 */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(70vh - 180px)' }}>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-stone-400 font-serif-sc">
              <p>暂无符合条件的记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry) => {
                const colors = entry.mood ? MOOD_COLORS[entry.mood] : null
                const isCurrent = entry.dateKey === currentDateKey
                return (
                  <button
                    key={entry.dateKey}
                    onClick={() => {
                      onSelect(entry.dateKey)
                      onClose()
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isCurrent 
                        ? 'border-stone-400 bg-stone-50' 
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-sm text-stone-600 font-serif-sc">{entry.date}</span>
                        <span className="text-xs text-stone-400 ml-2">{entry.weekday}</span>
                        {isCurrent && <span className="text-[10px] text-stone-500 ml-2 bg-stone-200 px-1.5 py-0.5 rounded">当前</span>}
                      </div>
                      {entry.mood && colors && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: colors.bg }}>
                          <MoodIcon type={entry.mood} size={14} selected={true} />
                          <span className="text-[10px] font-serif-sc" style={{ color: colors.color }}>
                            {entry.moodLabel}
                          </span>
                        </div>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {entry.note}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * 主组件
 * ============================================================ */
interface MindTraceBookProps {
  onNavigate?: (page: string) => void
}

export function MindTraceBook({ onNavigate }: MindTraceBookProps) {
  const [currentDateKey, setCurrentDateKey] = useState<string>(getTodayKey())
  const [entries, setEntries] = useState<Record<string, DayEntry>>({})
  const [historyDates, setHistoryDates] = useState<string[]>([])
  const [isClientReady, setIsClientReady] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  
  /* ---------- 翻页状态 ---------- */
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [pendingDirection, setPendingDirection] = useState<'forward' | 'backward' | null>(null)

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const containerWidth = useRef(0)

  /* ---------- 初始化 ---------- */
  useEffect(() => {
    const allEntries = getAllEntries()
    const entriesMap: Record<string, DayEntry> = {}
    allEntries.forEach(e => { entriesMap[e.dateKey] = e })
    
    // 只显示有记录的日期
    const todayKey = getTodayKey()
    const history = allEntries.map(e => e.dateKey)
    
    setEntries(entriesMap)
    setHistoryDates(history)
    setCurrentDateKey(todayKey)
    setIsClientReady(true)
  }, [])

  /* ---------- 数据操作 ---------- */
  const handleMoodSelect = useCallback((mood: MoodSymbol) => {
    const todayKey = getTodayKey()
    if (currentDateKey !== todayKey) return
    
    setEntries(prev => {
      const next = { ...prev }
      const entry = next[currentDateKey]
      if (entry) {
        next[currentDateKey] = { ...entry, mood, moodLabel: MOOD_LABELS[mood] }
        // 保存到 localStorage
        const records = loadRecords()
        records[currentDateKey] = next[currentDateKey]
        saveRecords(records)
      }
      return next
    })
  }, [currentDateKey])

  const handleNoteChange = useCallback((note: string) => {
    const todayKey = getTodayKey()
    if (currentDateKey !== todayKey) return
    
    setEntries(prev => {
      const next = { ...prev }
      const entry = next[currentDateKey]
      if (entry) {
        next[currentDateKey] = { ...entry, note }
        const records = loadRecords()
        records[currentDateKey] = next[currentDateKey]
        saveRecords(records)
      }
      return next
    })
  }, [currentDateKey])

  const handleSeal = useCallback(() => {
    const todayKey = getTodayKey()
    if (currentDateKey !== todayKey) return
    
    setEntries(prev => {
      const next = { ...prev }
      const entry = next[currentDateKey]
      if (entry) {
        next[currentDateKey] = { ...entry, sealed: true }
        const records = loadRecords()
        records[currentDateKey] = next[currentDateKey]
        saveRecords(records)
      }
      return next
    })
  }, [currentDateKey])

  /* ---------- 翻页逻辑 ---------- */
  const currentIndex = historyDates.indexOf(currentDateKey)
  const canFlipBackward = currentIndex > 0  // 右滑看历史
  const canFlipForward = currentIndex < historyDates.length - 1  // 左滑回今天

  const goToPrevDay = useCallback(() => {
    if (isAnimating || !canFlipBackward) return
    setIsAnimating(true)
    setPendingDirection('backward')
    setTimeout(() => {
      setCurrentDateKey(prev => {
        const idx = historyDates.indexOf(prev)
        return historyDates[idx - 1] || prev
      })
      setIsAnimating(false)
      setPendingDirection(null)
      setDragOffset(0)
    }, 280)
  }, [isAnimating, canFlipBackward, historyDates])

  const goToNextDay = useCallback(() => {
    if (isAnimating || !canFlipForward) return
    setIsAnimating(true)
    setPendingDirection('forward')
    setTimeout(() => {
      setCurrentDateKey(prev => {
        const idx = historyDates.indexOf(prev)
        return historyDates[idx + 1] || prev
      })
      setIsAnimating(false)
      setPendingDirection(null)
      setDragOffset(0)
    }, 280)
  }, [isAnimating, canFlipForward, historyDates])

  /* ---------- 手势处理 ---------- */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    containerWidth.current = (e.currentTarget as HTMLElement).offsetWidth
    setIsDragging(true)
  }, [isAnimating])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || touchStartX.current === null || touchStartY.current === null) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current

    // 垂直滑动，取消翻页
    if (Math.abs(deltaY) > Math.abs(deltaX) + 10) {
      setIsDragging(false)
      setDragOffset(0)
      touchStartX.current = null
      touchStartY.current = null
      return
    }

    // 右滑 = 看历史（向前一天），左滑 = 看今天（向后一天）
    let offset = deltaX
    if ((deltaX > 0 && !canFlipBackward) || (deltaX < 0 && !canFlipForward)) {
      offset = deltaX * 0.3
    }
    setDragOffset(offset)
  }, [isDragging, canFlipForward, canFlipBackward])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    
    const width = containerWidth.current || 375
    const threshold = width * 0.25  // 滑动距离超过25%翻页
    const edgeWidth = width * 0.2
    
    if (dragOffset > threshold && canFlipBackward) {
      // 右滑，翻到前一天
      setPendingDirection('backward')
      setIsAnimating(true)
      setDragOffset(width * 0.3)
      setTimeout(() => {
        setCurrentDateKey(prev => {
          const idx = historyDates.indexOf(prev)
          return historyDates[idx - 1] || prev
        })
        setDragOffset(0)
        setIsAnimating(false)
        setPendingDirection(null)
      }, 280)
    } else if (dragOffset < -threshold && canFlipForward) {
      // 左滑，翻到后一天
      setPendingDirection('forward')
      setIsAnimating(true)
      setDragOffset(-width * 0.3)
      setTimeout(() => {
        setCurrentDateKey(prev => {
          const idx = historyDates.indexOf(prev)
          return historyDates[idx + 1] || prev
        })
        setDragOffset(0)
        setIsAnimating(false)
        setPendingDirection(null)
      }, 280)
    } else {
      setDragOffset(0)
    }
  }, [isDragging, dragOffset, canFlipForward, canFlipBackward, historyDates])

  /* ---------- 点击边缘翻页 ---------- */
  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || isAnimating) return
    const target = e.target as HTMLElement
    if (target.closest('button, textarea, input')) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const edgeWidth = width * 0.25

    if (x < edgeWidth && canFlipBackward) {
      goToPrevDay()
    } else if (x > width - edgeWidth && canFlipForward) {
      goToNextDay()
    }
  }, [isDragging, isAnimating, canFlipForward, canFlipBackward, goToPrevDay, goToNextDay])

  /* ---------- 返回首页 ---------- */
  const handleBack = useCallback(() => {
    if (onNavigate) {
      onNavigate('首页')
    } else {
      window.location.href = '/'
    }
  }, [onNavigate])

  /* ---------- 跳转到指定日期 ---------- */
  const handleJumpToDate = useCallback((dateKey: string) => {
    setCurrentDateKey(dateKey)
  }, [])

  /* ---------- 获取当前页面内容 ---------- */
  const currentEntry = entries[currentDateKey]
  const todayKey = getTodayKey()
  const isToday = currentDateKey === todayKey
  
  // 获取前一天和后一天的日期
  const prevDateKey = canFlipBackward ? historyDates[currentIndex - 1] : null
  const nextDateKey = canFlipForward ? historyDates[currentIndex + 1] : null
  
  const prevEntry = prevDateKey ? entries[prevDateKey] : null
  const nextEntry = nextDateKey ? entries[nextDateKey] : null

  /* ---------- 加载状态 ---------- */
  if (!isClientReady) {
    return <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm font-serif-sc" style={{ background: '#FBF9F1' }}>加载中...</div>
  }

  /* ---------- 渲染页面 ---------- */
  const renderPage = (dateKey: string, entry: DayEntry | null | undefined, isTodayPage: boolean) => {
    if (!entry) {
      const d = new Date(dateKey)
      return <EmptyDatePage dateKey={dateKey} date={formatDate(d)} weekday={weekdays[d.getDay()]} />
    }
    if (isTodayPage) {
      return (
        <MobileTodayPage
          entry={entry}
          onMoodSelect={handleMoodSelect}
          onNoteChange={handleNoteChange}
          onSeal={handleSeal}
        />
      )
    }
    return <MobileHistoryPage entry={entry} />
  }

  return (
    <div className="w-full h-full overflow-hidden relative flex flex-col" style={{ background: '#FBF9F1' }}>
      <div className="w-full h-full relative flex flex-col">
        {/* 顶部导航栏 - 适配安全区域 */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2 bg-gradient-to-b from-[#FBF9F1] to-transparent">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-stone-100/80 active:scale-95 transition-all"
            aria-label="返回"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#6B5E58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600 font-serif-sc tracking-[0.2em]">心 · 迹</span>
          </div>
          
          <button
            onClick={() => setShowFilter(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-stone-100/80 active:scale-95 transition-all"
            aria-label="筛选"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6H20M7 12H17M10 18H14" stroke="#6B5E58" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 翻页容器 */}
        <div
          className="relative flex-1 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleTap}
          style={{ touchAction: 'pan-y' }}
        >
          {/* 底层：前一天（右滑时可见） */}
          {canFlipBackward && (
            <div
              className="absolute inset-0"
              style={{
                transform: `translateX(${pendingDirection === 'backward' || dragOffset > 50 ? 0 : '-30%'})`,
                transition: isAnimating ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
                opacity: isAnimating && pendingDirection === 'backward' ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              {renderPage(prevDateKey!, prevEntry, prevDateKey === todayKey)}
            </div>
          )}

          {/* 顶层：当前页 */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translateX(${dragOffset}px)`,
              transition: isAnimating ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
              willChange: isDragging ? 'transform' : 'auto',
              boxShadow: isDragging
                ? dragOffset > 0
                  ? '-8px 0 30px rgba(139,115,85,0.12)'
                  : '8px 0 30px rgba(139,115,85,0.12)'
                : 'none',
            }}
          >
            {renderPage(currentDateKey, currentEntry, isToday)}
          </div>

          {/* 右侧：后一天（左滑时可见） */}
          {canFlipForward && (
            <div
              className="absolute inset-0"
              style={{
                transform: `translateX(${pendingDirection === 'forward' || dragOffset < -50 ? 0 : '30%'})`,
                transition: isAnimating ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
                opacity: isAnimating && pendingDirection === 'forward' ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              {renderPage(nextDateKey!, nextEntry, nextDateKey === todayKey)}
            </div>
          )}
        </div>

        {/* 底部页码指示器 - 适配安全区域 */}
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom,16px)+8px)] left-0 right-0 flex justify-center items-center gap-3 pointer-events-none z-20">
          <span className="text-[10px] text-stone-400 tracking-widest font-serif-sc">{String(currentIndex + 1).padStart(2, '0')}</span>
          <div className="flex gap-1">
            {historyDates.map((dateKey, i) => (
              <button
                key={dateKey}
                onClick={(e) => { e.stopPropagation(); handleJumpToDate(dateKey) }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 pointer-events-auto ${
                  i === currentIndex 
                    ? 'bg-stone-500 w-3.5' 
                    : i < currentIndex 
                      ? 'bg-stone-300' 
                      : 'bg-stone-200'
                }`}
                aria-label={`跳转到 ${dateKey}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-stone-300 tracking-widest font-serif-sc">{String(historyDates.length).padStart(2, '0')}</span>
        </div>

        {/* 左右边缘提示（可视化翻页区域） */}
        {canFlipBackward && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-[20%] pointer-events-none z-10 flex items-center"
            style={{ background: 'linear-gradient(90deg, rgba(139,115,85,0.06) 0%, transparent 100%)' }}
          >
            <span className="text-stone-300 text-xs ml-2 font-serif-sc writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>← 历史</span>
          </div>
        )}
        {canFlipForward && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-[20%] pointer-events-none z-10 flex items-center justify-end"
            style={{ background: 'linear-gradient(-90deg, rgba(139,115,85,0.06) 0%, transparent 100%)' }}
          >
            <span className="text-stone-300 text-xs mr-2 font-serif-sc" style={{ writingMode: 'vertical-rl' }}>今天 →</span>
          </div>
        )}

        {/* 翻页提示（首次使用） */}
        {currentIndex === historyDates.length - 1 && !isAnimating && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-20 animate-pulse">
            <span className="text-xs text-stone-400 font-serif-sc tracking-widest">← 右滑查看历史</span>
          </div>
        )}
      </div>

      {/* 筛选面板 */}
      {showFilter && (
        <FilterPanel
          entries={Object.values(entries).sort((a, b) => b.dateKey.localeCompare(a.dateKey))}
          currentDateKey={currentDateKey}
          onSelect={handleJumpToDate}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  )
}
