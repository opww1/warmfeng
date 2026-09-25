'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Wind, ArrowLeft, Heart, Moon, Sparkles, Sun, RotateCcw, Home } from 'lucide-react'

// ============================================================
// 类型定义
// ============================================================
type Phase = '准备' | '吸气' | '屏息' | '呼气'
type PatternId = '478' | 'box' | 'calm' | 'symmetric' | 'relax' | 'extend' | 'beginner'
type SceneId = 'anxiety' | 'tired' | 'sleep' | 'wake'

interface BreathingRecord {
  id: string
  date: string // ISO 日期
  patternId: PatternId
  sceneId: SceneId
  duration: number // 秒
  cycles: number
}

// ============================================================
// 呼吸节奏配置
// ============================================================
const PATTERNS = [
  { id: '478' as PatternId, label: '4-7-8', desc: '吸 4 · 屏 7 · 呼 8' },
  { id: 'box' as PatternId, label: '箱式', desc: '吸 4 · 屏 4 · 呼 4 · 屏 4' },
  { id: 'calm' as PatternId, label: '平稳', desc: '吸 5 · 呼 5' },
  { id: 'symmetric' as PatternId, label: '4-4-4', desc: '吸 4 · 屏 4 · 呼 4' },
  { id: 'relax' as PatternId, label: '6-3-6', desc: '吸 6 · 屏 3 · 呼 6' },
  { id: 'extend' as PatternId, label: '延长呼气', desc: '吸 4 · 呼 8' },
  { id: 'beginner' as PatternId, label: '入门', desc: '吸 3 · 屏 4 · 呼 5' },
] as const

// ============================================================
// 呼吸法详细说明
// ============================================================
const PATTERN_DETAILS: Record<PatternId, {
  purpose: string
  suitable: string
  limited: string
}> = {
  '478': {
    purpose: '快速激活副交感神经，缓解焦虑和紧张',
    suitable: '焦虑发作前、紧张时、睡前难以平静时',
    limited: '孕妇、哮喘患者不宜过度屏息；首次练习可能不适应长呼气',
  },
  'box': {
    purpose: '训练注意力和节律感，帮助心智聚焦',
    suitable: '工作前调整状态、需要快速专注时、冥想入门',
    limited: '需要良好的计时感；对于完全坐不住的人可能太枯燥',
  },
  'calm': {
    purpose: '建立呼吸节律，维持身心平衡',
    suitable: '日常练习、不追求特殊效果、温和放松',
    limited: '效果相对温和，对于强烈情绪需要更极端的节奏',
  },
  'symmetric': {
    purpose: '最简单的三段式呼吸，身体记忆负担低',
    suitable: '紧急时刻、没有时间思考时、快速平复',
    limited: '效果短暂，不适合深度放松需求',
  },
  'relax': {
    purpose: '长吸气配合适中屏息，缓解胸口闷胀',
    suitable: '情绪低落时、胸口发闷、需要深度放松',
    limited: '屏息较短，对于需要深度屏息的场景可能不足',
  },
  'extend': {
    purpose: '延长呼气快速触发放松反射，帮助入睡',
    suitable: '失眠、交感神经兴奋、睡前快速平静',
    limited: '吸气较短，需要练习才能舒适完成',
  },
  'beginner': {
    purpose: '最温和的入门模式，建立对呼吸的感知',
    suitable: '第一次练习、儿童、身体感知较弱的人',
    limited: '练习多后可能觉得太简单，需要进阶',
  },
}

const SEQUENCE: Record<PatternId, { phase: Phase; seconds: number }[]> = {
  '478': [
    { phase: '吸气', seconds: 4 },
    { phase: '屏息', seconds: 7 },
    { phase: '呼气', seconds: 8 },
  ],
  'box': [
    { phase: '吸气', seconds: 4 },
    { phase: '屏息', seconds: 4 },
    { phase: '呼气', seconds: 4 },
    { phase: '屏息', seconds: 4 },
  ],
  'calm': [
    { phase: '吸气', seconds: 5 },
    { phase: '呼气', seconds: 5 },
  ],
  'symmetric': [
    { phase: '吸气', seconds: 4 },
    { phase: '屏息', seconds: 4 },
    { phase: '呼气', seconds: 4 },
  ],
  'relax': [
    { phase: '吸气', seconds: 6 },
    { phase: '屏息', seconds: 3 },
    { phase: '呼气', seconds: 6 },
  ],
  'extend': [
    { phase: '吸气', seconds: 4 },
    { phase: '呼气', seconds: 8 },
  ],
  'beginner': [
    { phase: '吸气', seconds: 3 },
    { phase: '屏息', seconds: 4 },
    { phase: '呼气', seconds: 5 },
  ],
}

const TOTAL_CYCLES = 3
const STORAGE_KEY = 'warmFengBreathingHistory'
const MAX_HISTORY_DAYS = 30

// ============================================================
// 情绪场景配置
// ============================================================
const SCENES: { id: SceneId; label: string; icon: typeof Heart; hint: string; patternId: PatternId }[] = [
  { id: 'anxiety', label: '焦虑', icon: Heart, hint: '慢慢来，把紧绷一点点放掉', patternId: '478' },
  { id: 'tired', label: '疲惫', icon: Moon, hint: '允许自己慢下来，只在这一刻', patternId: 'relax' },
  { id: 'sleep', label: '睡前', icon: Sparkles, hint: '让身体像晚风一样沉下去', patternId: 'extend' },
  { id: 'wake', label: '醒来', icon: Sun, hint: '轻轻吸气，温柔地唤醒今天', patternId: 'beginner' },
]

// ============================================================
// 动态引导语
// ============================================================
const PHASE_HINT_BASE: Record<Phase | '完成', string[]> = {
  '准备': ['准备好，开始跟随光晕呼吸', '跟着光晕，慢慢来'],
  '吸气': ['慢慢吸气…', '让气息温柔地填满身体…', '像花开一样，轻轻吸气…'],
  '屏息': ['轻轻停住…', '安静地停留一会儿…', '让这一刻慢下来…'],
  '呼气': ['缓缓呼出…', '把紧绷一起放掉…', '像云散开，慢慢呼气…'],
  '完成': ['做得很好', '你为自己停下来了一会儿，真好', '慢慢睁开眼睛'],
}

// ============================================================
// 工具函数
// ============================================================
function getTodayRecords(records: BreathingRecord[]) {
  const today = new Date().toISOString().slice(0, 10)
  return records.filter(r => r.date === today).length
}

function getTotalRecords(records: BreathingRecord[]) {
  return records.length
}

function saveBreathingRecord(record: BreathingRecord) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    let records: BreathingRecord[] = []
    if (raw) {
      const parsed = JSON.parse(raw)
      records = Array.isArray(parsed) ? parsed : []
    }
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - MAX_HISTORY_DAYS)
    const filtered = records.filter(r => new Date(r.date) >= cutoff)
    filtered.push(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch {
    // 存储失败时静默处理，不影响呼吸流程
  }
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} 秒`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m} 分 ${s} 秒` : `${m} 分`
}

// ============================================================
// 组件
// ============================================================
export function BreathingPage({ onBack }: { onBack: () => void }) {
  const [patternId, setPatternId] = useState<PatternId>(PATTERNS[0].id)
  const [sceneId, setSceneId] = useState<SceneId | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [phase, setPhase] = useState<Phase>('准备')
  const [stepIndex, setStepIndex] = useState(-1)
  const [cycleCount, setCycleCount] = useState(0)
  const [sessionStartAt, setSessionStartAt] = useState<number | null>(null)
  const [history, setHistory] = useState<BreathingRecord[]>([])
  const [hintVariant, setHintVariant] = useState(0)
  const [detailPattern, setDetailPattern] = useState<PatternId | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 读取历史记录
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setHistory(Array.isArray(parsed) ? parsed : [])
      }
    } catch {
      setHistory([])
    }
  }, [])

  // 切换节奏时重置整个练习
  useEffect(() => {
    setIsRunning(false)
    setIsComplete(false)
    setPhase('准备')
    setStepIndex(-1)
    setCycleCount(0)
    setSessionStartAt(null)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [patternId])

  // 呼吸循环状态机
  useEffect(() => {
    if (!isRunning || isComplete) return

    const sequence = SEQUENCE[patternId]

    if (phase === '准备') {
      timerRef.current = setTimeout(() => {
        setPhase(sequence[0].phase)
        setStepIndex(0)
      }, 1000)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }

    const currentItem = sequence[stepIndex]
    const nextStepIndex = (stepIndex + 1) % sequence.length
    const isCycleEnd = nextStepIndex === 0
    const willComplete = isCycleEnd && cycleCount >= TOTAL_CYCLES - 1

    timerRef.current = setTimeout(() => {
      if (willComplete) {
        const duration = sessionStartAt ? Math.round((Date.now() - sessionStartAt) / 1000) : 0
        saveBreathingRecord({
          id: `${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          patternId,
          sceneId: sceneId ?? 'anxiety',
          duration,
          cycles: TOTAL_CYCLES,
        })
        setHistory(prev => {
          const updated = [...prev, {
            id: `${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            patternId,
            sceneId: sceneId ?? 'anxiety',
            duration,
            cycles: TOTAL_CYCLES,
          }]
          return updated.slice(-MAX_HISTORY_DAYS)
        })
        setIsComplete(true)
        setIsRunning(false)
        setPhase('准备')
        setStepIndex(-1)
        setCycleCount(0)
        setSessionStartAt(null)
      } else {
        setPhase(sequence[nextStepIndex].phase)
        setStepIndex(nextStepIndex)
        if (isCycleEnd) {
          setCycleCount((c) => c + 1)
        }
      }
    }, currentItem.seconds * 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isRunning, isComplete, phase, stepIndex, cycleCount, patternId, sessionStartAt, sceneId])

  // 阶段切换时随机引导语
  useEffect(() => {
    const list = PHASE_HINT_BASE[isComplete ? '完成' : phase]
    setHintVariant(Math.floor(Math.random() * list.length))
  }, [phase, isComplete])

  const handleStart = useCallback(() => {
    if (isComplete) {
      setIsComplete(false)
    }
    const nextRunning = !isRunning
    setIsRunning(nextRunning)
    if (nextRunning) {
      setPhase('准备')
      setStepIndex(-1)
      setCycleCount(0)
      setSessionStartAt(Date.now())
    } else {
      setPhase('准备')
      setStepIndex(-1)
      setCycleCount(0)
      setSessionStartAt(null)
    }
  }, [isRunning, isComplete])

  const handleSceneSelect = useCallback((scene: SceneId) => {
    if (isRunning) return
    const config = SCENES.find(s => s.id === scene)
    if (!config) return
    setSceneId(scene)
    setPatternId(config.patternId)
  }, [isRunning])

  const transitionSeconds = phase === '准备' ? 1 : SEQUENCE[patternId][stepIndex]?.seconds ?? 4

  // 圆环缩放：吸气/屏息绽放，呼气回落
  const scale = phase === '吸气' || phase === '屏息' ? 1.28 : phase === '准备' ? 1 : 1
  const innerScale = phase === '吸气' || phase === '屏息' ? 1.15 : 1

  // 呼吸光晕明暗
  const glowOpacity = isComplete
    ? 0.12
    : phase === '准备'
    ? 0.15
    : phase === '吸气'
    ? 0.6
    : phase === '屏息'
    ? 0.52
    : 0.22

  const activeColorClass = phase === '吸气' || phase === '屏息' ? 'border-primary/55' : 'border-foreground/50'
  const textColorClass = phase === '吸气' || phase === '屏息' ? 'text-primary' : 'text-foreground'
  const innerFillClass = phase === '吸气' || phase === '屏息' ? 'bg-primary/[0.09]' : 'bg-foreground/[0.05]'

  const currentHint = useMemo(() => {
    if (sceneId && phase === '准备') {
      const scene = SCENES.find(s => s.id === sceneId)
      if (scene) return scene.hint
    }
    return PHASE_HINT_BASE[isComplete ? '完成' : phase][hintVariant]
  }, [phase, isComplete, sceneId, hintVariant])

  // 计算当前练习时长
  const currentDuration = useMemo(() => {
    if (!sessionStartAt) return 0
    return Math.round((Date.now() - sessionStartAt) / 1000)
  }, [sessionStartAt, phase, stepIndex])

  const durationDisplay = isComplete && sessionStartAt === null
    ? (history.at(-1)?.duration ?? 0)
    : currentDuration

  const todayCount = getTodayRecords(history)
  const totalCount = getTotalRecords(history)

  return (
    <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden bg-background paper-texture">
      {/* 背景呼吸光晕：多层有机光斑 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 transition-opacity ease-in-out"
        style={{
          opacity: glowOpacity,
          transitionDuration: `${transitionSeconds}s`,
          background:
            'radial-gradient(circle at 50% 42%, rgba(232,160,168,0.42) 0%, rgba(242,196,201,0.18) 38%, transparent 72%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-1/3 top-1/4 h-[620px] w-[620px] rounded-full blur-[130px] transition-opacity"
          style={{
            opacity: glowOpacity * 0.55,
            transitionDuration: `${transitionSeconds}s`,
            background: 'radial-gradient(circle, rgba(232,160,168,0.48) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -right-1/3 bottom-1/4 h-[520px] w-[520px] rounded-full blur-[110px] transition-opacity"
          style={{
            opacity: glowOpacity * 0.4,
            transitionDuration: `${transitionSeconds + 0.5}s`,
            background: 'radial-gradient(circle, rgba(205,227,216,0.42) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] transition-all"
          style={{
            opacity: glowOpacity * 0.35,
            transform: `translate(-50%, -50%) scale(${phase === '吸气' || phase === '屏息' ? 1.3 : 1})`,
            transitionDuration: `${transitionSeconds}s`,
            background: 'radial-gradient(circle, rgba(232,160,168,0.35) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* 滚动内容区 */}
      <div className="app-scrollbar relative flex-1 overflow-y-auto pb-28">

      {/* 顶部栏 */}
      <header className="flex items-center gap-3 px-5 pb-2 pt-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="flex size-9 items-center justify-center rounded-full border border-border/50 bg-card text-foreground transition-transform active:scale-95"
        >
          <ArrowLeft size={20} strokeWidth={1.6} />
        </button>
        <h1 className="font-serif text-xl tracking-wide text-foreground">深呼吸</h1>
      </header>

      {/* 引导语 */}
      <p className="px-6 pt-1 text-center text-sm leading-relaxed text-muted-foreground transition-all duration-700">
        心里有点紧的时候，跟着光晕慢下来。
        <br />
        不用做对，只要呼吸就好。
      </p>

      {/* 呼吸圆环 */}
      <div className="mt-3 flex items-center justify-center">
        <div
          className={`relative flex size-[220px] sm:size-[260px] items-center justify-center rounded-full border-2 transition-all ease-in-out will-change-transform ${activeColorClass}`}
          style={{
            transform: `scale(${scale})`,
            transitionDuration: `${transitionSeconds}s`,
            boxShadow: phase === '吸气' || phase === '屏息'
              ? '0 0 60px 12px rgba(232,160,168,0.18), inset 0 0 40px rgba(232,160,168,0.08)'
              : '0 0 30px 4px rgba(74,59,50,0.04), inset 0 0 20px rgba(74,59,50,0.03)',
          }}
        >
          {/* 内层光晕 */}
          <div
            className={`absolute inset-[14px] sm:inset-[18px] rounded-full transition-all duration-700 ${innerFillClass}`}
            style={{
              transform: `scale(${innerScale})`,
              transitionDuration: `${transitionSeconds}s`,
            }}
          />
          {/* 中心内容 */}
          <div className="relative z-10 flex flex-col items-center">
            <Wind
              size={26}
              strokeWidth={1.5}
              className={`mb-2 transition-colors duration-700 ${textColorClass}`}
            />
            <span
              className={`font-serif text-2xl transition-colors duration-700 ${textColorClass}`}
            >
              {isComplete ? '完成' : phase}
            </span>
            {!isComplete && isRunning && (
              <span className="mt-1.5 text-[11px] text-muted-foreground/70">
                {cycleCount + 1} / {TOTAL_CYCLES} 组
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 阶段提示文字 */}
      <p
        key={`${phase}-${hintVariant}-${isComplete}`}
        className="mt-3 min-h-[1.5rem] px-8 text-center text-sm text-muted-foreground/85 animate-fade-in-up"
      >
        {currentHint}
      </p>

      {/* 情绪场景选择 */}
      <div className="mt-3 px-5">
        <p className="mb-2.5 text-center text-xs text-muted-foreground">此刻的你</p>
        <div className="grid grid-cols-4 gap-2">
          {SCENES.map((scene) => {
            const Icon = scene.icon
            const active = scene.id === sceneId
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => handleSceneSelect(scene.id)}
                disabled={isRunning}
                className={`flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all disabled:opacity-60 active:scale-95 ${
                  active
                    ? 'bg-primary/[0.08] text-foreground'
                    : 'bg-card/50 text-muted-foreground hover:bg-card'
                }`}
                style={{ border: active ? '1px solid rgba(232,160,168,0.35)' : '1px solid transparent' }}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="text-[11px]">{scene.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 节奏选择 + 阶段小圆点 */}
      <div className="mt-3 px-4">
        <p className="mb-3 text-center text-xs text-muted-foreground">选择节奏 · 长按 2 秒查看说明</p>
        <div className="grid grid-cols-3 gap-3">
          {PATTERNS.map((p) => {
            const active = p.id === patternId
            const startLongPress = () => {
              longPressRef.current = setTimeout(() => {
                setDetailPattern(p.id)
              }, 2000)
            }
            const cancelLongPress = () => {
              if (longPressRef.current) {
                clearTimeout(longPressRef.current)
                longPressRef.current = null
              }
            }
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (!isRunning) {
                    setPatternId(p.id)
                    setSceneId(null)
                  }
                }}
                onPointerDown={startLongPress}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerMove={cancelLongPress}
                onTouchStart={startLongPress}
                onTouchEnd={cancelLongPress}
                onTouchCancel={cancelLongPress}
                disabled={isRunning}
                className={`flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all disabled:opacity-60 ${
                  active
                    ? 'bg-primary/[0.08] font-semibold text-foreground'
                    : 'bg-card/40 font-normal text-muted-foreground hover:bg-card'
                }`}
                style={{ border: active ? '1px solid rgba(232,160,168,0.35)' : '1px solid transparent' }}
              >
                <span className="text-sm">{p.label}</span>
                <span className="text-[11px] opacity-70 leading-tight">{p.desc}</span>
                <div className="mt-0.5 flex h-2 items-center gap-1">
                  {SEQUENCE[p.id].map((_, i) => (
                    <span
                      key={i}
                      className={`rounded-full transition-all duration-500 ${
                        active && i === stepIndex && isRunning
                          ? 'size-1.5 bg-primary'
                          : 'size-1 bg-primary/25'
                      }`}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground/70">
          长按卡片 2 秒可查看说明 ✨
        </p>
      </div>

      {/* 练习统计（完成时展示） */}
      {isComplete && (
        <div className="mx-5 mt-3 rounded-2xl bg-card/60 px-5 py-4 text-center animate-fade-in-up">
          <p className="font-serif text-base text-foreground">本次练习</p>
          <div className="mt-2 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>时长 {formatDuration(durationDisplay)}</span>
            <span>完成 {TOTAL_CYCLES} 组</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground/80">
            <span>今日 {todayCount} 次</span>
            <span>累计 {totalCount} 次</span>
          </div>
        </div>
      )}

      {/* 底部按钮区 */}
      <div className="mt-6 px-5 pb-10 pt-4">
        {isComplete ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-medium text-primary-foreground transition-transform active:scale-95"
            >
              <RotateCcw size={18} strokeWidth={1.6} />
              再试一次
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card py-3.5 text-base font-medium text-foreground transition-transform active:scale-95"
            >
              <Home size={18} strokeWidth={1.6} />
              返回首页
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            className="w-full rounded-2xl bg-primary py-3.5 text-base font-medium text-primary-foreground transition-transform active:scale-95"
          >
            {isRunning ? '停下来' : '开始一次呼吸'}
          </button>
        )}
      </div>
      </div>

      {/* 呼吸法详情弹窗 */}
      {detailPattern && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setDetailPattern(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
            </div>
            <h3 className="mb-4 text-center font-serif text-xl text-foreground">
              {PATTERNS.find((p) => p.id === detailPattern)?.label} 呼吸法
            </h3>
            <div className="space-y-4">
              <div className="rounded-xl bg-primary/[0.06] p-4">
                <p className="mb-1 text-xs font-medium text-primary">💡 这是什么</p>
                <p className="text-sm leading-relaxed text-foreground">
                  {PATTERN_DETAILS[detailPattern].purpose}
                </p>
              </div>
              <div className="rounded-xl bg-card p-4" style={{ border: '1px solid rgba(205,227,216,0.35)' }}>
                <p className="mb-1 text-xs font-medium text-emerald-700">✨ 适合什么时候</p>
                <p className="text-sm leading-relaxed text-foreground">
                  {PATTERN_DETAILS[detailPattern].suitable}
                </p>
              </div>
              <div className="rounded-xl bg-card p-4" style={{ border: '1px solid rgba(200,180,160,0.35)' }}>
                <p className="mb-1 text-xs font-medium text-amber-700">⚠️ 注意事项</p>
                <p className="text-sm leading-relaxed text-foreground">
                  {PATTERN_DETAILS[detailPattern].limited}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDetailPattern(null)}
              className="mt-5 w-full rounded-2xl bg-foreground/10 py-3.5 text-sm font-medium text-foreground transition-transform active:scale-95"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
