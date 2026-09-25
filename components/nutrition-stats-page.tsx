"use client"

import { useRef, useState } from "react"
import { Calendar, ChevronRight, Flame, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { CircularProgress } from "@/components/ui/circular-progress"
import { ProgressBar } from "@/components/ui/progress-bar"
import { useMealLog, sumFoods, todayKey } from "@/lib/food-data"
import { useNutritionProfile, calcTargets } from "@/lib/nutrition-targets"

const COLOR_HEX = {
  leaf: "var(--leaf)",
  sakura: "var(--sakura)",
  sun: "var(--sun)",
  sky: "var(--sky)",
}

const COLOR_TEXT = {
  leaf: "text-leaf",
  sakura: "text-sakura",
  sun: "text-sun",
  sky: "text-sky",
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"]

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** 生成以 anchor 所在周日为起点的 7 天，返回便于展示的日期信息 */
function buildWeek(anchor: Date): { wd: string; date: number; key: string; isToday: boolean }[] {
  const day = anchor.getDay()
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = formatDateKey(d)
    return {
      wd: WEEKDAYS[d.getDay()],
      date: d.getDate(),
      key,
      isToday: key === todayKey(),
    }
  })
}

/** 生成最近 7 天（含今天）的日期 key 与展示标签 */
function buildLast7Days(): { key: string; label: string }[] {
  const arr: { key: string; label: string }[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = formatDateKey(d)
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`
    arr.push({ key, label })
  }
  return arr
}

function WeekStrip({
  week,
  selectedKey,
  onSelect,
  onPrevWeek,
  onNextWeek,
  isCurrentWeek,
}: {
  week: { wd: string; date: number; key: string; isToday: boolean }[]
  selectedKey: string
  onSelect: (key: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  isCurrentWeek: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrevWeek}
        aria-label="上一周"
        className="flex h-10 w-8 shrink-0 items-center justify-center rounded-2xl text-foreground/55 transition active:scale-95 hover:bg-surface-1"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
      </button>
      <div className="flex flex-1 items-center justify-between">
        {week.map((d) => {
          const selected = d.key === selectedKey
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onSelect(d.key)}
              className={cn(
                "flex w-10 flex-col items-center gap-0.5 rounded-2xl py-2 transition active:scale-95",
                selected ? "bg-leaf text-white shadow-sm" : "text-foreground/55 hover:bg-surface-1",
              )}
            >
              <span className="text-[11px]">{d.wd}</span>
              <span className="text-sm font-medium">{d.date}</span>
              {selected && <span className="h-1 w-1 rounded-full bg-white/80" />}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onNextWeek}
        aria-label="下一周"
        className={cn(
          "flex h-10 w-8 shrink-0 items-center justify-center rounded-2xl transition active:scale-95 hover:bg-surface-1",
          isCurrentWeek ? "invisible" : "text-foreground/55",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function CalorieCard({ current, goal, label, empty }: { current: number; goal: number; label: string; empty?: boolean }) {
  const percent = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0
  const over = current > goal
  if (empty) {
    return (
      <section className="rounded-[--radius] border border-border/30 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-1">
          <h2 className="font-serif text-base font-medium text-foreground">{label}</h2>
          <Info className="h-4 w-4 text-foreground/35" />
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-1 py-6 text-center">
          <Flame className="h-8 w-8 text-foreground/20" />
          <p className="text-sm text-foreground/55">这天还没有饮食记录哦～</p>
          <p className="text-xs text-foreground/40">记得在「今日」页面添加你吃的食物吧</p>
        </div>
      </section>
    )
  }
  return (
    <section className="rounded-[--radius] border border-border/30 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h2 className="font-serif text-base font-medium text-foreground">{label}</h2>
          <Info className="h-4 w-4 text-foreground/35" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <p className="font-serif text-5xl font-semibold text-foreground">{percent}%</p>
          <p className="text-sm text-foreground/60">
            <span className={cn("font-medium", over ? COLOR_TEXT.sun : COLOR_TEXT.leaf)}>{current.toLocaleString()}</span>
            <span className="text-foreground/40"> / {goal.toLocaleString()} kcal</span>
          </p>
          <p className="text-xs text-foreground/50">{over ? "今天稍微吃多了一点点～" : "继续保持，你很棒！"}</p>
          <div className="mt-1">
            <ProgressBar
              value={percent}
              className="h-1.5"
              fillClassName={over ? "bg-sun" : "bg-leaf"}
              trackClassName="bg-surface-2/70"
            />
          </div>
        </div>

        <CircularProgress
          value={percent}
          size={128}
          strokeWidth={12}
          indicatorClassName={over ? "text-sun" : "text-leaf"}
          trackClassName="text-surface-2/70"
        >
          <Flame className="h-7 w-7 text-leaf" />
          <span className="mt-1 font-serif text-xl font-semibold text-foreground">
            {current.toLocaleString()}
          </span>
          <span className="text-[10px] text-foreground/45">kcal</span>
        </CircularProgress>
      </div>
    </section>
  )
}

function MacroDonut({ dist }: { dist: { label: string; percent: number; color: keyof typeof COLOR_HEX }[] }) {
  const size = 150
  const stroke = 26
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let acc = 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {dist.map((m) => {
          const len = (m.percent / 100) * c
          const seg = (
            <circle
              key={m.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
              stroke={COLOR_HEX[m.color]}
            />
          )
          acc += len
          return seg
        })}
      </svg>

      {/* 中心文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[11px] font-medium leading-tight text-foreground/70">三大营养素</p>
          <p className="text-[11px] font-medium leading-tight text-foreground/70">比例分布</p>
        </div>
      </div>

      {/* 百分比标签（压在圆环上，0% 不画避免重叠） */}
      {dist.map((m) => {
        if (m.percent <= 0) return null
        const idx = dist.indexOf(m)
        const prevAcc = dist.slice(0, idx).reduce((s, x) => s + x.percent, 0)
        const startAngle = -Math.PI / 2 + (prevAcc / 100) * 2 * Math.PI
        const endAngle = startAngle + (m.percent / 100) * 2 * Math.PI
        const midAngle = (startAngle + endAngle) / 2
        const labelR = r
        const x = size / 2 + labelR * Math.cos(midAngle)
        const y = size / 2 + labelR * Math.sin(midAngle)
        return (
          <div
            key={`label-${m.label}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-white drop-shadow"
            style={{ left: x, top: y, textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
          >
            {m.percent}%
          </div>
        )
      })}
    </div>
  )
}

function MacroCard({
  dist,
  empty,
}: {
  dist: { label: string; gram: number; percent: number; kcal: number; color: keyof typeof COLOR_HEX }[]
  empty?: boolean
}) {
  if (empty) {
    return (
      <div>
        <h2 className="font-serif text-base font-medium text-foreground">宏量营养素</h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-1 py-6 text-center">
          <p className="text-sm text-foreground/55">这天还没有记录营养成分～</p>
          <p className="text-xs text-foreground/40">添加饮食后这里会显示三大营养素比例</p>
        </div>
      </div>
    )
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-base font-medium text-foreground">宏量营养素</h2>
        <button
          type="button"
          className="flex items-center gap-0.5 text-sm text-foreground/50 transition active:scale-95"
        >
          详情
          <ChevronRight className="h-3.5 w-3.5 text-foreground/35" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <MacroDonut dist={dist} />
        <div className="flex w-full flex-col gap-3 sm:flex-1">
          {dist.map((m) => (
            <div key={m.label} className="flex items-center gap-2.5">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLOR_HEX[m.color] }} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm text-foreground">{m.label}</span>
                <span className="text-xs text-foreground/45">
                  {m.gram}g <span className="mx-1">|</span> {m.percent}%
                </span>
              </div>
              <span className={cn("shrink-0 text-sm font-semibold", COLOR_TEXT[m.color])}>{m.kcal} kcal</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DailyBars({
  days,
  target,
  onSelectDate,
}: {
  days: { key: string; label: string; value: number; isToday: boolean; isSelected: boolean }[]
  target: number
  onSelectDate: (key: string) => void
}) {
  const [range, setRange] = useState<"7天" | "30天" | "90天">("7天")
  const maxScale = Math.max(2400, ...days.map((d) => d.value), target)
  const chartH = 160

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-base font-medium text-foreground">每日热量波动</h2>
        <div className="flex items-center gap-1 rounded-full bg-surface-1 p-1">
          {(["7天", "30天", "90天"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                range === r ? "bg-card text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {/* Y轴 */}
        <div className="flex flex-col justify-between py-1 text-right" style={{ height: chartH }}>
          {[Math.round(maxScale), Math.round(maxScale * 0.75), Math.round(maxScale * 0.5), Math.round(maxScale * 0.25), 0].map((v) => (
            <span key={v} className="text-[10px] text-foreground/40">
              {v.toLocaleString()}
            </span>
          ))}
        </div>

        {/* 图表区 */}
        <div className="relative flex-1">
          <div className="relative flex items-end justify-between gap-1.5" style={{ height: chartH }}>
            {/* 目标线 */}
            <div
              className="absolute left-0 right-0 z-0 flex items-center justify-end"
              style={{ bottom: `${(target / maxScale) * chartH}px` }}
            >
              <div className="h-px flex-1 border-t border-dashed border-foreground/25" />
              <span className="ml-1.5 shrink-0 text-[10px] text-foreground/40">目标 {target} kcal</span>
            </div>

            {days.map((d) => {
              const h = Math.max(10, (d.value / maxScale) * chartH)
              const over = d.value > target
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => onSelectDate(d.key)}
                  className="relative z-10 flex flex-1 flex-col items-center gap-1 rounded-md outline-none transition active:scale-95"
                >
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      over ? "text-sun" : d.isSelected ? "text-leaf" : "text-foreground/55",
                    )}
                  >
                    {d.value > 0 ? d.value.toLocaleString() : "—"}
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-md transition-all",
                      d.isSelected ? "bg-leaf" : over ? "bg-sun/70" : "bg-surface-2/70",
                    )}
                    style={{ height: h }}
                  />
                  <span className={cn("text-[10px]", d.isSelected ? "font-medium text-leaf" : "text-foreground/45")}>
                    {d.label}
                  </span>
                  {d.isSelected && <span className="text-[9px] text-leaf">{d.isToday ? "今天" : "选中"}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NutritionStatsPage() {
  const [log] = useMealLog()
  const [profile] = useNutritionProfile()
  const today = todayKey()
  const [selectedDate, setSelectedDate] = useState(today)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [weekAnchor, setWeekAnchor] = useState(() => new Date())
  const targets = calcTargets(profile)

  // 选中日期真实营养
  const dayFoods = Object.values(log[selectedDate] ?? {}).flat()
  const totals = sumFoods(dayFoods)

  // 宏量营养素占比（按提供热量占比，蛋白质4/脂肪9/碳水4 kcal/g）
  const pKcal = totals.p * 4
  const fKcal = totals.f * 9
  const cKcal = totals.c * 4
  const macroSum = pKcal + fKcal + cKcal
  const macroDist = [
    { label: "碳水化合物", gram: Math.round(totals.c), kcal: Math.round(cKcal), color: "leaf" as const },
    { label: "蛋白质", gram: Math.round(totals.p), kcal: Math.round(pKcal), color: "sky" as const },
    { label: "脂肪", gram: Math.round(totals.f), kcal: Math.round(fKcal), color: "sakura" as const },
  ].map((m) => ({ ...m, percent: macroSum > 0 ? Math.round((m.kcal / macroSum) * 100) : 0 }))

  // 近 7 天真实热量
  const last7 = buildLast7Days()
  const week = buildWeek(weekAnchor)
  const isCurrentWeek = week.some((d) => d.isToday)
  const shiftWeek = (delta: number) => {
    const next = new Date(weekAnchor)
    next.setDate(weekAnchor.getDate() + delta * 7)
    setWeekAnchor(next)
  }
  const daily = last7.map((d) => {
    const foods = Object.values(log[d.key] ?? {}).flat()
    return { ...d, value: sumFoods(foods).kcal, isToday: d.key === today, isSelected: d.key === selectedDate }
  })

  const isToday = selectedDate === today
  const dateLabel = isToday
    ? "今日"
    : `${Number(selectedDate.slice(5, 7))}月${Number(selectedDate.slice(8))}日`
  const hasRecord = dayFoods.length > 0

  return (
    <div className="flex w-full flex-col gap-5">
      {/* 顶部标题区 */}
      <header className="flex items-start justify-between pt-0">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">营养统计</h1>
          <p className="mt-0.5 text-sm text-foreground/50">科学饮食，健康每一天</p>
        </div>
        <button
          type="button"
          aria-label="选择日期"
          onClick={() => dateInputRef.current?.click()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground/60 shadow-sm transition active:scale-95"
        >
          <Calendar className="h-5 w-5" />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          className="hidden"
        />
      </header>

      <WeekStrip
        week={week}
        selectedKey={selectedDate}
        onSelect={setSelectedDate}
        onPrevWeek={() => shiftWeek(-1)}
        onNextWeek={() => shiftWeek(1)}
        isCurrentWeek={isCurrentWeek}
      />
      <CalorieCard current={totals.kcal} goal={targets.calorie} label={`${dateLabel}热量达成率`} empty={!hasRecord} />
      <section className="overflow-hidden rounded-[--radius] border border-border/30 bg-card shadow-sm">
        <div className="p-5">
          <MacroCard dist={macroDist} empty={!hasRecord} />
        </div>
        <div className="border-t border-border/20 p-5">
          <DailyBars days={daily} target={targets.calorie} onSelectDate={setSelectedDate} />
        </div>
      </section>
    </div>
  )
}
