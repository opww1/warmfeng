'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Calendar as CalendarIcon, Trash2, CircleHelp } from 'lucide-react'
import { OptionWheel } from './reactbits/option-wheel'
import { MoodFaceSlider, getMoodFace } from './mood-face-slider'
import { SleepTrendChart } from './sleep-trend-chart'
import {
  type SleepRecord,
  type MoodScore,
  loadSleepRecords,
  saveSleepRecord,
  deleteSleepRecord,
  getTodayRecord,
  calcSleepDuration,
  calcSleepEfficiency,
  getTodayDate,
  getAllRecords,
} from '@/lib/sleep-storage'

/* ============================================================
 * 睡眠日记主页面（SleepDiaryPage）
 *
 * 作为心迹（MindTraceBook）的子页，从心迹顶部栏 Moon 图标进入
 *
 * 布局：全屏手机端单页
 * - 顶部栏（适配安全区域）+ Tab 切换 + 内容区
 * - 3 个 Tab：记录 / 历史 / 趋势
 * - 所有弹窗适配手机端（85% 宽度，圆角 24px，按钮高 ≥44px）
 *
 * SSR 安全：初始 state 为空，useEffect 读取 localStorage
 * ============================================================ */

type TabKey = 'record' | 'history' | 'trend'

export interface SleepDiaryPageProps {
  onBack: () => void
}

/* ---------- 时间滚轮数据 ---------- */

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function parseTimeToIndices(time: string): { h: number; m: number } {
  const [h, m] = time.split(':').map(Number)
  return { h: h || 0, m: m || 0 }
}

/* ---------- 温柔回应文案池 ----------
 * 按睡眠情况分类，让回应更有温度、更贴合当下状态
 * 不评判好坏，只表达陪伴
 */

// 睡得不错（时长 ≥7h 且效率 ≥85%）
const REPLIES_GOOD = [
  '今夜好像睡得还不错，真好',
  '看来休息够了，慢慢醒来就好',
  '这样的睡眠很温柔，继续珍惜',
  '身体在悄悄修复，你做得很好',
  '今夜的月光陪你睡得很安稳',
  '醒来精神不错吧，今天慢慢来',
  '睡得好这件事，本身就值得被看见',
  '今夜的休息，是对自己最好的温柔',
]

// 睡得一般（时长 5-7h 或效率 60-85%）
const REPLIES_OK = [
  '记下来了，今夜好好休息',
  '不必苛责自己，慢慢就好',
  '睡眠像潮汐，有起有落都很正常',
  '今夜辛苦了，让一切随风',
  '慢一点没关系，你已经很好了',
  '无论睡得多或少，都是被允许的',
  '今夜的你，值得被温柔以待',
  '不必和昨晚比较，今夜就是今夜',
  '睡得不够也没关系，今天可以慢慢来',
  '记下来，就放下了',
]

// 睡得不太好（时长 <5h 或效率 <60%）
const REPLIES_HARD = [
  '今夜辛苦了，慢慢来',
  '没睡好也没关系，今天可以轻一点',
  '难熬的夜已经过去了，天亮了',
  '身体在努力，别太勉强自己',
  '今夜的你很勇敢，辛苦了',
  '睡不好的夜里，你也不孤单',
  '今夜就算难，也已经被你熬过来了',
  '允许自己今天慢一点，不必逞强',
  '没睡好的早晨，可以先喝口温水',
  '今夜的疲惫，会被白天的温柔慢慢抚平',
]

// 通用兜底
const REPLIES_ANY = [
  '愿你今夜被温柔包围',
  '记下来的瞬间，就已经在照顾自己了',
  '今夜的月色和你都很温柔',
]

function pickGentleReply(duration: number, efficiency: number, mood: MoodScore): string {
  let pool: string[]

  // 优先按精神状态判断（用户主观感受最重要）
  if (mood >= 4) {
    pool = REPLIES_GOOD
  } else if (mood <= 2) {
    pool = REPLIES_HARD
  } else if (duration >= 7 && efficiency >= 85) {
    pool = REPLIES_GOOD
  } else if (duration < 5 || efficiency < 60) {
    pool = REPLIES_HARD
  } else {
    pool = REPLIES_OK
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

/* ---------- 趋势洞察文案生成 ----------
 * 多维度温柔解读：时长变化、效率变化、精神变化
 * 不使用"达标/优秀/不合格/警告"等词
 */

function generateInsight(records: SleepRecord[]): string {
  if (records.length === 0) return ''

  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-7)
  const previous = sorted.slice(-14, -7)

  if (recent.length === 0) return ''

  const avgRecentDuration = recent.reduce((s, r) => s + r.sleepDuration, 0) / recent.length
  const avgRecentMood = recent.reduce((s, r) => s + r.mood, 0) / recent.length

  // 不足 7 天，仅展示当前数据
  if (recent.length < 7) {
    return `最近 ${recent.length} 天平均睡了 ${avgRecentDuration.toFixed(1)} 小时，继续记录就能看到完整趋势`
  }

  // 不足两周，仅展示本周数据 + 精神状态
  if (previous.length === 0) {
    const moodLabel = avgRecentMood >= 4 ? '精神还不错' : avgRecentMood >= 3 ? '精神还算平稳' : '精神有些疲惫'
    return `这周平均睡了 ${avgRecentDuration.toFixed(1)} 小时，${moodLabel}，继续记录就会看到趋势`
  }

  const avgPreviousDuration = previous.reduce((s, r) => s + r.sleepDuration, 0) / previous.length
  const avgPreviousMood = previous.reduce((s, r) => s + r.mood, 0) / previous.length
  const durationDiff = avgRecentDuration - avgPreviousDuration
  const moodDiff = avgRecentMood - avgPreviousMood

  // 时长变化为主轴
  if (durationDiff > 0.3) {
    // 时长明显增加
    if (moodDiff > 0.3) {
      return `这周比上周多睡了 ${durationDiff.toFixed(1)} 小时，精神也好了一些，辛苦自己了`
    }
    return `这周比上周多睡了 ${durationDiff.toFixed(1)} 小时，身体在慢慢恢复`
  }

  if (durationDiff < -0.3) {
    // 时长明显减少
    if (moodDiff < -0.3) {
      return `这周睡得少了一些，精神也累了一点，别太勉强自己`
    }
    return `这周睡得少了一些，但精神还算稳，慢慢调整就好`
  }

  // 时长持平，看精神变化
  if (moodDiff > 0.3) {
    return `睡眠时长差不多，但精神好像好了一些，这是好事`
  }
  if (moodDiff < -0.3) {
    return `睡眠时长差不多，但精神有些疲惫，今天可以轻一点`
  }

  // 全部持平
  const replies = [
    '睡眠节奏很稳，继续保持就好',
    '这周的睡眠很平稳，像潮汐有节律',
    '身体找到了自己的节奏，继续记录',
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}

/* ---------- 主组件 ---------- */

export function SleepDiaryPage({ onBack }: SleepDiaryPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('record')
  const [records, setRecords] = useState<SleepRecord[]>([])
  const [todayRecord, setTodayRecord] = useState<SleepRecord | null>(null)
  const [mounted, setMounted] = useState(false)

  // 记录表单状态
  const [bedtime, setBedtime] = useState('23:30')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [wakeCount, setWakeCount] = useState(0)
  const [mood, setMood] = useState<MoodScore | null>(null)
  const [showOptional, setShowOptional] = useState(false)
  const [sleepLatency, setSleepLatency] = useState('')
  const [medication, setMedication] = useState(false)
  const [dream, setDream] = useState(false)
  const [note, setNote] = useState('')

  // 弹窗状态
  const [gentleReply, setGentleReply] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<SleepRecord | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDate, setCustomDate] = useState<string | null>(null)

  // SSR 安全：mounted 后才读 localStorage
  useEffect(() => {
    setMounted(true)
    const all = loadSleepRecords()
    setRecords(all)
    const today = getTodayRecord()
    setTodayRecord(today)
    if (today) {
      // 预填今日记录
      setBedtime(today.bedtime)
      setWakeTime(today.wakeTime)
      setWakeCount(today.wakeCount)
      setMood(today.mood)
      if (today.sleepLatency !== undefined) setSleepLatency(String(today.sleepLatency))
      if (today.medication !== undefined) setMedication(today.medication)
      if (today.dream !== undefined) setDream(today.dream)
      if (today.note) setNote(today.note)
    }
  }, [])

  // 实时计算睡眠时长
  const sleepDuration = useMemo(() => {
    return calcSleepDuration(bedtime, wakeTime)
  }, [bedtime, wakeTime])

  const sleepEfficiency = useMemo(() => {
    return calcSleepEfficiency(sleepDuration, wakeCount)
  }, [sleepDuration, wakeCount])

  // 保存记录
  const handleSave = useCallback(() => {
    if (!mood) return

    const recordDate = customDate || getTodayDate()
    const saved = saveSleepRecord({
      id: todayRecord?.id,
      date: recordDate,
      bedtime,
      wakeTime,
      wakeCount,
      mood,
      sleepLatency: sleepLatency ? Number(sleepLatency) : undefined,
      medication: medication || undefined,
      dream: dream || undefined,
      note: note.trim() || undefined,
    })

    // 更新状态
    const all = getAllRecords()
    setRecords(all)
    setTodayRecord(saved)
    setGentleReply(pickGentleReply(saved.sleepDuration, saved.sleepEfficiency, saved.mood))
  }, [mood, customDate, todayRecord, bedtime, wakeTime, wakeCount, sleepLatency, medication, dream, note])

  // 删除记录
  const handleDelete = useCallback((record: SleepRecord) => {
    const remaining = deleteSleepRecord(record.id)
    setRecords(remaining)
    if (todayRecord?.id === record.id) {
      setTodayRecord(null)
      // 重置表单
      setBedtime('23:30')
      setWakeTime('07:00')
      setWakeCount(0)
      setMood(null)
      setSleepLatency('')
      setMedication(false)
      setDream(false)
      setNote('')
    }
    setShowDeleteConfirm(null)
  }, [todayRecord])

  // 补记日期选择（过去 3 天内）
  const recentDates = useMemo(() => {
    const dates: { value: string; label: string }[] = []
    const today = new Date()
    for (let i = 1; i <= 3; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const label = `${d.getMonth() + 1}月${d.getDate()}日`
      dates.push({ value, label })
    }
    return dates
  }, [])

  const handleSelectCustomDate = useCallback((date: string) => {
    setCustomDate(date)
    setShowDatePicker(false)
    // 加载该日期已有记录
    const existing = records.find(r => r.date === date)
    if (existing) {
      setBedtime(existing.bedtime)
      setWakeTime(existing.wakeTime)
      setWakeCount(existing.wakeCount)
      setMood(existing.mood)
      if (existing.sleepLatency !== undefined) setSleepLatency(String(existing.sleepLatency))
      if (existing.medication !== undefined) setMedication(existing.medication)
      if (existing.dream !== undefined) setDream(existing.dream)
      if (existing.note) setNote(existing.note)
    } else {
      setBedtime('23:30')
      setWakeTime('07:00')
      setWakeCount(0)
      setMood(null)
      setSleepLatency('')
      setMedication(false)
      setDream(false)
      setNote('')
    }
  }, [records])

  // 长按删除
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleLongPressStart = useCallback((record: SleepRecord) => {
    longPressTimer.current = setTimeout(() => {
      setShowDeleteConfirm(record)
    }, 500)
  }, [])
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'record', label: '今晚记录' },
    { key: 'history', label: '历史' },
    { key: 'trend', label: '趋势' },
  ]

  return (
    <div
      className="flex h-full flex-col bg-[#FBF9F1]"
      style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}
    >
      {/* 顶部栏 */}
      <header className="flex items-center justify-between border-b border-stone-200/70 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B5E58] transition-colors active:bg-stone-200/50"
          aria-label="返回心迹"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h1 className="font-serif text-base font-semibold text-[#4A4A4A]">睡眠日记</h1>
        <div className="w-10" />
      </header>

      {/* Tab 切换 */}
      <div className="flex gap-1 px-4 py-3">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-full px-3 py-2 text-xs transition-colors ${
              activeTab === tab.key
                ? 'bg-[#D8E7F6] font-semibold text-[#4A4A4A]'
                : 'text-[#8B7E76]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div
        className="flex-1 overflow-y-auto px-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom,16px)' }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'record' && (
            <motion.div
              key="record"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <RecordTab
                mounted={mounted}
                bedtime={bedtime}
                wakeTime={wakeTime}
                wakeCount={wakeCount}
                mood={mood}
                showOptional={showOptional}
                sleepLatency={sleepLatency}
                medication={medication}
                dream={dream}
                note={note}
                sleepDuration={sleepDuration}
                sleepEfficiency={sleepEfficiency}
                todayRecord={todayRecord}
                customDate={customDate}
                recentDates={recentDates}
                onBedtimeChange={setBedtime}
                onWakeTimeChange={setWakeTime}
                onWakeCountChange={setWakeCount}
                onMoodChange={setMood}
                onToggleOptional={() => setShowOptional(!showOptional)}
                onSleepLatencyChange={setSleepLatency}
                onMedicationChange={setMedication}
                onDreamChange={setDream}
                onNoteChange={setNote}
                onSave={handleSave}
                onShowDatePicker={() => setShowDatePicker(true)}
                onClearCustomDate={() => {
                  setCustomDate(null)
                  // 重新加载今日记录
                  const today = getTodayRecord()
                  setTodayRecord(today)
                  if (today) {
                    setBedtime(today.bedtime)
                    setWakeTime(today.wakeTime)
                    setWakeCount(today.wakeCount)
                    setMood(today.mood)
                  } else {
                    setBedtime('23:30')
                    setWakeTime('07:00')
                    setWakeCount(0)
                    setMood(null)
                  }
                }}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryTab
                mounted={mounted}
                records={records}
                onLongPressStart={handleLongPressStart}
                onLongPressEnd={handleLongPressEnd}
              />
            </motion.div>
          )}

          {activeTab === 'trend' && (
            <motion.div
              key="trend"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TrendTab mounted={mounted} records={records} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 温柔回应弹窗 */}
      <AnimatePresence>
        {gentleReply && (
          <GentleReplyOverlay reply={gentleReply} onClose={() => setGentleReply(null)} />
        )}
      </AnimatePresence>

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmOverlay
            record={showDeleteConfirm}
            onCancel={() => setShowDeleteConfirm(null)}
            onConfirm={() => handleDelete(showDeleteConfirm)}
          />
        )}
      </AnimatePresence>

      {/* 补记日期选择弹窗 */}
      <AnimatePresence>
        {showDatePicker && (
          <DatePickerOverlay
            dates={recentDates}
            selected={customDate}
            onSelect={handleSelectCustomDate}
            onCancel={() => setShowDatePicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================================================
 * Tab 1：记录
 * ============================================================ */

interface RecordTabProps {
  mounted: boolean
  bedtime: string
  wakeTime: string
  wakeCount: number
  mood: MoodScore | null
  showOptional: boolean
  sleepLatency: string
  medication: boolean
  dream: boolean
  note: string
  sleepDuration: number
  sleepEfficiency: number
  todayRecord: SleepRecord | null
  customDate: string | null
  recentDates: { value: string; label: string }[]
  onBedtimeChange: (v: string) => void
  onWakeTimeChange: (v: string) => void
  onWakeCountChange: (v: number) => void
  onMoodChange: (v: MoodScore) => void
  onToggleOptional: () => void
  onSleepLatencyChange: (v: string) => void
  onMedicationChange: (v: boolean) => void
  onDreamChange: (v: boolean) => void
  onNoteChange: (v: string) => void
  onSave: () => void
  onShowDatePicker: () => void
  onClearCustomDate: () => void
}

function RecordTab(props: RecordTabProps) {
  const {
    mounted,
    bedtime,
    wakeTime,
    wakeCount,
    mood,
    showOptional,
    sleepLatency,
    medication,
    dream,
    note,
    sleepDuration,
    sleepEfficiency,
    todayRecord,
    customDate,
    recentDates,
    onBedtimeChange,
    onWakeTimeChange,
    onWakeCountChange,
    onMoodChange,
    onToggleOptional,
    onSleepLatencyChange,
    onMedicationChange,
    onDreamChange,
    onNoteChange,
    onSave,
    onShowDatePicker,
    onClearCustomDate,
  } = props

  const bedtimeIdx = parseTimeToIndices(bedtime)
  const wakeIdx = parseTimeToIndices(wakeTime)

  return (
    <div className="pb-6">
      {/* 补记提示 */}
      {customDate && (
        <div className="mb-3 flex items-center justify-between rounded-2xl bg-[#FFE8C4]/60 px-3 py-2 text-xs text-[#8B7E76]">
          <span>正在补记：{recentDates.find(d => d.value === customDate)?.label}</span>
          <button
            type="button"
            onClick={onClearCustomDate}
            className="text-[#6B5E58] underline active:opacity-60"
          >
            改回今日
          </button>
        </div>
      )}

      {/* 温柔标题 */}
      <div className="mb-5 mt-2 text-center">
        <p className="font-serif text-base text-[#4A4A4A]">
          {todayRecord && !customDate ? '今晚过得还好吗' : '昨晚过得还好吗'}
        </p>
        <p className="mt-1 text-[11px] text-[#8B7E76]">不急，想记的时候再记</p>
      </div>

      {/* 上床/起床时间 - 双滚轮 */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-stone-200/60 bg-white/60 p-3">
          <div className="mb-2 text-center text-[11px] text-[#8B7E76]">上床时间</div>
          {mounted && (
            <div className="flex justify-center">
              <OptionWheel
                items={HOURS}
                defaultSelected={bedtimeIdx.h}
                onChange={(i) => onBedtimeChange(`${HOURS[i]}:${bedtime.split(':')[1]}`)}
                side="left"
                fontSize={1.1}
                spacing={1.3}
                inset={8}
                textColor="#C4B8AE"
                activeColor="#4A4A4A"
                className="rounded-lg"
              />
              <OptionWheel
                items={MINUTES}
                defaultSelected={bedtimeIdx.m}
                onChange={(i) => onBedtimeChange(`${bedtime.split(':')[0]}:${MINUTES[i]}`)}
                side="right"
                fontSize={1.1}
                spacing={1.3}
                inset={8}
                textColor="#C4B8AE"
                activeColor="#4A4A4A"
                className="rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200/60 bg-white/60 p-3">
          <div className="mb-2 text-center text-[11px] text-[#8B7E76]">起床时间</div>
          {mounted && (
            <div className="flex justify-center">
              <OptionWheel
                items={HOURS}
                defaultSelected={wakeIdx.h}
                onChange={(i) => onWakeTimeChange(`${HOURS[i]}:${wakeTime.split(':')[1]}`)}
                side="left"
                fontSize={1.1}
                spacing={1.3}
                inset={8}
                textColor="#C4B8AE"
                activeColor="#4A4A4A"
                className="rounded-lg"
              />
              <OptionWheel
                items={MINUTES}
                defaultSelected={wakeIdx.m}
                onChange={(i) => onWakeTimeChange(`${wakeTime.split(':')[0]}:${MINUTES[i]}`)}
                side="right"
                fontSize={1.1}
                spacing={1.3}
                inset={8}
                textColor="#C4B8AE"
                activeColor="#4A4A4A"
                className="rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* 夜间醒来次数 */}
      <div className="mb-5">
        <p className="mb-2 text-xs text-[#8B7E76]">夜里醒了几次？</p>
        <div className="flex items-center justify-between gap-1.5">
          {[0, 1, 2, 3, 4].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onWakeCountChange(n)}
              className={`flex h-9 flex-1 items-center justify-center rounded-full text-xs transition-all active:scale-95 ${
                wakeCount === n
                  ? 'bg-[#FFD6A3] font-semibold text-[#4A4A4A]'
                  : 'border border-stone-200/60 bg-white/60 text-[#8B7E76]'
              }`}
              aria-label={`醒来 ${n} 次`}
            >
              {n === 4 ? '4+' : n}
            </button>
          ))}
        </div>
      </div>

      {/* 精神状态 */}
      <div className="mb-5">
        <p className="mb-2 text-xs text-[#8B7E76]">起床后感觉如何？</p>
        <MoodFaceSlider value={mood} onChange={onMoodChange} />
      </div>

      {/* 可选字段折叠 */}
      <button
        type="button"
        onClick={onToggleOptional}
        className="mb-3 w-full rounded-xl bg-stone-100/60 py-2.5 text-xs text-[#8B7E76] transition-colors active:bg-stone-200/60"
      >
        {showOptional ? '▾ 收起可选项' : '▸ 再说一点（可选）'}
      </button>

      <AnimatePresence>
        {showOptional && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-5 overflow-hidden"
          >
            <div className="space-y-3 rounded-2xl border border-stone-200/60 bg-white/40 p-3">
              {/* 入睡时长 */}
              <div>
                <label className="mb-1.5 block text-[11px] text-[#8B7E76]">入睡时长（分钟）</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={sleepLatency}
                  onChange={e => onSleepLatencyChange(e.target.value)}
                  placeholder="可选"
                  className="w-full rounded-lg border border-stone-200/60 bg-white/80 px-3 py-2 text-sm text-[#4A4A4A] outline-none focus:border-[#D8E7F6]"
                />
              </div>

              {/* 开关组 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onMedicationChange(!medication)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                    medication
                      ? 'bg-[#E6E0F0] text-[#4A4A4A]'
                      : 'border border-stone-200/60 bg-white/60 text-[#8B7E76]'
                  }`}
                >
                  {medication ? '✓ ' : ''}吃了助眠药
                </button>
                <button
                  type="button"
                  onClick={() => onDreamChange(!dream)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                    dream
                      ? 'bg-[#E6E0F0] text-[#4A4A4A]'
                      : 'border border-stone-200/60 bg-white/60 text-[#8B7E76]'
                  }`}
                >
                  {dream ? '✓ ' : ''}做梦了
                </button>
              </div>

              {/* 备注 */}
              <div>
                <label className="mb-1.5 block text-[11px] text-[#8B7E76]">一句备注</label>
                <textarea
                  value={note}
                  onChange={e => onNoteChange(e.target.value.slice(0, 100))}
                  placeholder="想说点什么..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-stone-200/60 bg-white/80 px-3 py-2 text-sm text-[#4A4A4A] outline-none focus:border-[#D8E7F6]"
                />
                <div className="mt-1 text-right text-[10px] text-[#C4B8AE]">
                  {note.length}/100
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 实时计算结果 */}
      <div className="mb-4 rounded-2xl bg-[#D8E7F6]/70 px-4 py-3 text-center">
        <div className="text-sm font-semibold text-[#4A4A4A]">
          睡了 {sleepDuration.toFixed(1)} 小时
        </div>
        <div className="mt-0.5 flex items-center justify-center text-[11px] text-[#6B5E58]">
          效率 {sleepEfficiency.toFixed(1)}%
          <EfficiencyInfo />
        </div>
      </div>

      {/* 补记按钮 */}
      {!todayRecord && !customDate && (
        <button
          type="button"
          onClick={onShowDatePicker}
          className="mb-3 w-full text-center text-[11px] text-[#8B7E76] underline active:opacity-60"
        >
          想补记前几天的？点这里
        </button>
      )}

      {/* 保存按钮 */}
      <button
        type="button"
        onClick={onSave}
        disabled={!mood}
        className="w-full rounded-2xl bg-[#FFD6A3] py-3.5 text-sm font-semibold text-[#4A4A4A] shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {todayRecord && !customDate ? '更新今日记录' : '轻轻封存'}
      </button>
    </div>
  )
}

/* ============================================================
 * 小组件：睡眠效率解释图标
 * ============================================================ */

function EfficiencyInfo() {
  const [show, setShow] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShow(true)}
        className="ml-1 inline-flex items-center justify-center rounded-full text-[#8B7E76] active:opacity-60"
        aria-label="睡眠效率如何计算"
      >
        <CircleHelp size={13} strokeWidth={1.5} />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            onClick={() => setShow(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="mx-6 w-full max-w-[280px] rounded-3xl bg-[#FFFDF8] p-5 shadow-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-center">
                <CircleHelp size={22} strokeWidth={1.5} className="text-[#D8E7F6]" />
              </div>
              <p className="mb-2 text-center font-serif text-sm text-[#4A4A4A]">睡眠效率怎么算？</p>
              <p className="text-center text-[11px] leading-relaxed text-[#8B7E76]">
                我们根据你夜里醒来的次数估算：
                <br />
                每次醒来大约花 10 分钟重新入睡。
                <br />
                效率 = 实际睡着的时间 ÷ 总卧床时间。
                <br />
                <span className="text-[#C4B8AE]">这是一个温柔的参考，不是医学诊断哦～</span>
              </p>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="mt-4 h-10 w-full rounded-xl bg-[#D8E7F6]/60 text-xs text-[#6B5E58] transition-colors active:scale-95"
              >
                明白了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ============================================================
 * Tab 2：历史
 * ============================================================ */

interface HistoryTabProps {
  mounted: boolean
  records: SleepRecord[]
  onLongPressStart: (record: SleepRecord) => void
  onLongPressEnd: () => void
}

function HistoryTab({ mounted, records, onLongPressStart, onLongPressEnd }: HistoryTabProps) {
  if (!mounted) {
    return <div className="py-10 text-center text-xs text-[#8B7E76]">加载中...</div>
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        {/* 手绘月亮 SVG */}
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
          <path
            d="M55 40 A20 20 0 1 1 35 20 A16 16 0 0 0 55 40 Z"
            fill="#FBF9F1"
            stroke="#4A4A4A"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="18" r="1" fill="#FFD6A3" />
          <circle cx="62" cy="22" r="1.2" fill="#FFD6A3" />
          <circle cx="14" cy="48" r="0.8" fill="#FFD6A3" />
          <circle cx="68" cy="58" r="1" fill="#FFD6A3" />
        </svg>
        <p className="mt-4 font-serif text-sm text-[#4A4A4A]">还没记过</p>
        <p className="mt-1 text-[11px] text-[#8B7E76]">今晚要不要试试？</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 pb-6">
      {records.map(record => {
        const MoodFace = getMoodFace(record.mood)
        const d = new Date(record.date)
        const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
        return (
          <div
            key={record.id}
            className="rounded-2xl border border-stone-200/60 bg-white/70 p-3.5"
            onTouchStart={() => onLongPressStart(record)}
            onTouchEnd={onLongPressEnd}
            onTouchMove={onLongPressEnd}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-sm text-[#4A4A4A]">
                  {d.getMonth() + 1}月{d.getDate()}日
                </span>
                <span className="text-[10px] text-[#8B7E76]">周{weekday}</span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center">
                <MoodFace />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[11px] text-[#6B5E58]">
              <span>{record.bedtime} → {record.wakeTime}</span>
              <span className="font-semibold text-[#4A4A4A]">{record.sleepDuration.toFixed(1)}h</span>
              <span className="flex items-center">效率 {record.sleepEfficiency.toFixed(0)}%<EfficiencyInfo /></span>
            </div>
            {record.note && (
              <p className="mt-2 rounded-lg bg-[#FBF9F1] px-2.5 py-1.5 text-[11px] italic text-[#8B7E76]">
                {record.note}
              </p>
            )}
          </div>
        )
      })}
      <p className="pt-2 text-center text-[10px] text-[#C4B8AE]">长按可删除记录</p>
    </div>
  )
}

/* ============================================================
 * Tab 3：趋势
 * ============================================================ */

interface TrendTabProps {
  mounted: boolean
  records: SleepRecord[]
}

function TrendTab({ mounted, records }: TrendTabProps) {
  if (!mounted) {
    return <div className="py-10 text-center text-xs text-[#8B7E76]">加载中...</div>
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="font-serif text-sm text-[#4A4A4A]">还没有趋势可看</p>
        <p className="mt-1 text-[11px] text-[#8B7E76]">先记几天，就能看到变化了</p>
      </div>
    )
  }

  if (records.length < 7) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden="true">
          <path
            d="M40 30 A14 14 0 1 1 26 16 A11 11 0 0 0 40 30 Z"
            fill="#FBF9F1"
            stroke="#8B7E76"
            strokeWidth="1.2"
          />
        </svg>
        <p className="mt-3 font-serif text-sm text-[#4A4A4A]">
          再记 {7 - records.length} 天就能看到趋势了
        </p>
        <p className="mt-1 text-[11px] text-[#8B7E76]">不急，慢慢来</p>
      </div>
    )
  }

  const insight = generateInsight(records)

  return (
    <div className="pb-6">
      <div className="rounded-2xl border border-stone-200/60 bg-white/70 p-4">
        <div className="mb-1 flex items-center justify-end">
          <EfficiencyInfo />
        </div>
        <SleepTrendChart records={records} defaultMode="week" height={180} />
      </div>

      {insight && (
        <div className="mt-3 rounded-2xl bg-[#E6E0F0]/60 px-4 py-3">
          <p className="text-xs leading-relaxed text-[#4A4A4A]">
            {insight}
          </p>
        </div>
      )}
    </div>
  )
}

/* ============================================================
 * 弹窗：温柔回应
 * ============================================================ */

function GentleReplyOverlay({ reply, onClose }: { reply: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="mx-6 w-full max-w-[320px] rounded-3xl bg-[#FFFDF8] p-6 text-center shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-3" aria-hidden="true">
          <path
            d="M32 24 A12 12 0 1 1 20 12 A9 9 0 0 0 32 24 Z"
            fill="#FFD6A3"
            stroke="#4A4A4A"
            strokeWidth="1.5"
          />
        </svg>
        <p className="font-serif text-sm leading-relaxed text-[#4A4A4A]">{reply}</p>
        <p className="mt-2 text-[10px] text-[#8B7E76]">轻触关闭</p>
      </motion.div>
    </motion.div>
  )
}

/* ============================================================
 * 弹窗：删除确认
 * ============================================================ */

function DeleteConfirmOverlay({
  record,
  onCancel,
  onConfirm,
}: {
  record: SleepRecord
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="mx-6 w-full max-w-[320px] rounded-3xl bg-[#FFFDF8] p-5 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-center">
          <Trash2 size={24} strokeWidth={1.5} className="text-[#8B7E76]" />
        </div>
        <p className="mb-1 text-center font-serif text-sm text-[#4A4A4A]">删除这条记录？</p>
        <p className="mb-4 text-center text-[11px] text-[#8B7E76]">
          {record.date} · 睡了 {record.sleepDuration.toFixed(1)} 小时
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl border border-stone-200/60 bg-white/60 text-sm text-[#6B5E58] transition-colors active:scale-95"
          >
            再想想
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-xl bg-[#E8C4B8] text-sm font-semibold text-[#4A4A4A] transition-all active:scale-95"
          >
            删除
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ============================================================
 * 弹窗：补记日期选择
 * ============================================================ */

function DatePickerOverlay({
  dates,
  selected,
  onSelect,
  onCancel,
}: {
  dates: { value: string; label: string }[]
  selected: string | null
  onSelect: (date: string) => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="mx-6 w-full max-w-[320px] rounded-3xl bg-[#FFFDF8] p-5 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-center gap-1.5">
          <CalendarIcon size={16} strokeWidth={1.5} className="text-[#8B7E76]" />
          <p className="font-serif text-sm text-[#4A4A4A]">补记哪一天？</p>
        </div>
        <p className="mb-4 text-center text-[11px] text-[#8B7E76]">仅支持过去 3 天</p>
        <div className="space-y-2">
          {dates.map(d => (
            <button
              key={d.value}
              type="button"
              onClick={() => onSelect(d.value)}
              className={`h-12 w-full rounded-xl text-sm transition-all active:scale-95 ${
                selected === d.value
                  ? 'bg-[#D8E7F6] font-semibold text-[#4A4A4A]'
                  : 'border border-stone-200/60 bg-white/60 text-[#6B5E58]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 h-11 w-full rounded-xl text-xs text-[#8B7E76] transition-colors active:opacity-60"
        >
          取消
        </button>
      </motion.div>
    </motion.div>
  )
}
