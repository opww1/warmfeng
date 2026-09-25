"use client"

import { useEffect, useRef, useState } from "react"
import {
  Beef,
  Bone,
  BookOpen,
  ChevronRight,
  Citrus,
  Droplets,
  Egg,
  Flame,
  Plus,
  Soup,
  Sprout,
  Sun,
  Wheat,
} from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { CircularProgress } from "@/components/ui/circular-progress"
import { ProgressBar } from "@/components/ui/progress-bar"
import { calcTargets, isMinor, type UserProfile } from "@/lib/nutrition-targets"
import { NutritionProfileEntry } from "@/components/nutrition-profile"
import { useMealLog, todayKey, sumFoods, sumMicros } from "@/lib/food-data"

interface MacroItem {
  key: string
  label: string
  current: number
  target: number
  unit: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface MicroItem {
  key: string
  label: string
  current: number
  target: number
  unit: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const COLOR_MAP: Record<string, { text: string; bg: string; soft: string; fill: string }> = {
  leaf: { text: "text-leaf", bg: "bg-leaf", soft: "bg-leaf-soft", fill: "fill-leaf" },
  sakura: { text: "text-sakura", bg: "bg-sakura", soft: "bg-sakura-soft", fill: "fill-sakura" },
  sun: { text: "text-sun", bg: "bg-sun", soft: "bg-sun-soft", fill: "fill-sun" },
  sky: { text: "text-sky", bg: "bg-sky", soft: "bg-sky-soft", fill: "fill-sky" },
}

const MEAL_CARDS: {
  key: "breakfast" | "lunch" | "dinner" | "snack"
  label: string
  icon: React.ComponentType<{ className?: string }>
  tint: string
  suggest: string
}[] = [
  { key: "breakfast", label: "早餐", icon: Sun, tint: "bg-sun/15 text-sun", suggest: "400-500 kcal" },
  { key: "lunch", label: "午餐", icon: Beef, tint: "bg-leaf/15 text-leaf", suggest: "500-650 kcal" },
  { key: "dinner", label: "晚餐", icon: Wheat, tint: "bg-sakura/15 text-sakura", suggest: "450-600 kcal" },
  { key: "snack", label: "加餐", icon: Sprout, tint: "bg-sky/15 text-sky", suggest: "100-200 kcal" },
]

function MacroRow({ item }: { item: MacroItem }) {
  const Icon = item.icon
  const percent = Math.round((item.current / item.target) * 100)
  const colors = COLOR_MAP[item.color]

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-foreground/80">
          <Icon className={cn("h-4 w-4", colors.text)} />
          <span>{item.label}</span>
        </span>
        <span className="ml-auto shrink-0 whitespace-nowrap text-foreground/90">
          <span className="font-medium">{item.current}</span>
          <span className="text-foreground/40"> / {item.target}{item.unit}</span>
        </span>
        <span className="flex shrink-0 items-center whitespace-nowrap text-xs font-medium text-foreground/60">
          {percent}%
          <ChevronRight className="h-3.5 w-3.5 text-foreground/30" />
        </span>
      </div>
      <ProgressBar
        value={percent}
        fillClassName={cn("rounded-full", colors.bg)}
        trackClassName="bg-muted/60"
        height={5}
      />
    </div>
  )
}

function MicroRow({ item }: { item: MicroItem }) {
  const Icon = item.icon
  const percent = Math.round((item.current / item.target) * 100)
  const colors = COLOR_MAP[item.color]

  return (
    <div className="flex items-center gap-3">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", colors.soft)}>
        <Icon className={cn("h-4 w-4", colors.text)} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm text-foreground">{item.label}</span>
        <span className="text-xs text-foreground/50">
          {item.current} / {item.target} {item.unit}
        </span>
      </div>
      <span className={cn("shrink-0 text-sm font-medium", colors.text)}>{percent}%</span>
    </div>
  )
}

export function NutritionPageV2({
  profile,
  onProfileChange,
  onViewDetail,
  onOpenLibrary,
  onOpenRecipe,
  tab,
}: {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
  onViewDetail?: () => void
  onOpenLibrary?: () => void
  onOpenRecipe?: () => void
  tab?: React.ReactNode
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const minor = isMinor(profile.age)
  const targets = calcTargets(profile)
  const [log, addFood, removeFood] = useMealLog()
  const today = todayKey()
  const dayFoods = Object.values(log[today] ?? {}).flat()
  const totals = sumFoods(dayFoods)
  const micros = sumMicros(dayFoods)
  const hasRecord = totals.kcal > 0
  const score = hasRecord
    ? Math.round(
        ((Math.min(totals.kcal / targets.calorie, 1) +
          Math.min(totals.p / targets.protein, 1) +
          Math.min(totals.f / targets.fat, 1) +
          Math.min(totals.c / targets.carb, 1)) /
          4) *
          100,
      )
    : null

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const isNarrow = width > 0 && width <= 340

  const MACROS: MacroItem[] = [
    { key: "calorie", label: "热量", current: totals.kcal, target: targets.calorie, unit: "kcal", icon: Flame, color: "leaf" },
    { key: "protein", label: "蛋白质", current: Math.round(totals.p), target: targets.protein, unit: "g", icon: Egg, color: "sakura" },
    { key: "fat", label: "脂肪", current: Math.round(totals.f), target: targets.fat, unit: "g", icon: Beef, color: "sun" },
    { key: "carb", label: "碳水化合物", current: Math.round(totals.c), target: targets.carb, unit: "g", icon: Wheat, color: "sky" },
  ]

  const MICROS: MicroItem[] = [
    { key: "fiber", label: "膳食纤维", current: Math.round(micros.fiber), target: targets.fiber, unit: "g", icon: Sprout, color: "leaf" },
    { key: "vc", label: "维生素C", current: Math.round(micros.vitC), target: targets.vc, unit: "mg", icon: Citrus, color: "sun" },
    { key: "calcium", label: "钙", current: Math.round(micros.calcium), target: targets.calcium, unit: "mg", icon: Bone, color: "sky" },
    { key: "iron", label: "铁", current: Math.round(micros.iron), target: targets.iron, unit: "mg", icon: Droplets, color: "sakura" },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* 顶部标题区 */}
      <header className="flex items-start justify-between pt-0">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">饮食与营养</h1>
          <p className="mt-0.5 text-sm text-foreground/50">记录每一餐，遇见更好的自己</p>
        </div>
        <NutritionProfileEntry profile={profile} onChange={onProfileChange} />
      </header>

      {/* 今日/统计 tab（标题下方） */}
      {tab}

      {/* 今日营养：单张大卡片 */}
      <section
        ref={cardRef}
        className="rounded-[--radius] border border-border/30 bg-card p-4 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-base font-medium text-foreground">今日营养</h2>
          <button
            type="button"
            onClick={onViewDetail}
            className="flex items-center gap-0.5 text-sm text-foreground/50 transition active:scale-95"
          >
            查看详情
            <ChevronRight className="h-3.5 w-3.5 text-foreground/35" />
          </button>
        </div>

        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "flex gap-4",
            isNarrow ? "flex-col items-center" : "flex-row items-center"
          )}
        >
          {/* 左侧圆环 */}
          <motion.div layout className="shrink-0">
            <CircularProgress
              value={score ?? 0}
              size={116}
              strokeWidth={10}
              indicatorClassName="text-leaf"
              trackClassName="text-surface-2/70"
            >
              <span className="font-serif text-4xl font-semibold text-foreground">{score ?? "--"}</span>
              <span className="mt-0.5 text-xs text-foreground/50">营养得分</span>
              <span className="mt-1.5 rounded-full bg-leaf-soft px-2.5 py-0.5 text-[11px] font-medium text-leaf">
                {minor ? "正在长身体" : "优秀"}
              </span>
            </CircularProgress>
          </motion.div>

          {/* 右侧四项指标 */}
          <motion.div
            layout
            className={cn(
              "flex flex-col justify-center gap-3.5",
              isNarrow ? "w-full" : "flex-1"
            )}
          >
            {MACROS.map((m) => (
              <MacroRow key={m.key} item={m} />
            ))}
          </motion.div>
        </motion.div>

        {/* 微量元素：图一竖向整行列表 */}
        <div className="mt-3 space-y-3 border-t border-border/20 pt-3">
          {MICROS.map((m) => (
            <MicroRow key={m.key} item={m} />
          ))}
        </div>
      </section>

      {/* 三餐快捷添加 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-base font-medium text-foreground">三餐快捷添加</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenRecipe}
              className="flex items-center gap-1 text-sm text-sakura transition active:scale-95"
            >
              <Soup className="h-4 w-4" />
              菜谱
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onOpenLibrary}
              className="flex items-center gap-1 text-sm text-leaf transition active:scale-95"
            >
              <BookOpen className="h-4 w-4" />
              我的食物库
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {MEAL_CARDS.map(({ key, label, icon: Icon, tint, suggest }) => {
            const items = log[todayKey()]?.[key] ?? []
            const kcal = sumFoods(items).kcal
            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card p-3.5 shadow-sm"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    tint,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    {items.length > 0 && (
                      <span className="rounded-full bg-leaf/10 px-1.5 py-0.5 text-[11px] font-medium text-leaf">
                        {items.length} 样 · {Math.round(kcal)} kcal
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-foreground/50">
                    {items.length === 0 ? `建议：${suggest}` : items.map((f) => f.emoji).join(" ")}
                  </p>
                </div>
                {items.length > 0 && (
                  <button
                    type="button"
                    aria-label={`移除${label}记录`}
                    onClick={() => removeFood(todayKey(), key, items.length - 1)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/40 transition active:scale-90 hover:bg-foreground/10 hover:text-foreground/70"
                  >
                    <Plus className="h-4 w-4 rotate-45" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`添加${label}`}
                  onClick={onOpenLibrary}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf text-white shadow-sm transition active:scale-90 hover:bg-leaf/90"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
