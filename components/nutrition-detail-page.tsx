"use client"

import * as React from "react"
import {
  Apple,
  Beef,
  Bone,
  ChevronRight,
  Citrus,
  Droplets,
  Egg,
  Flame,
  Plus,
  Soup,
  Sprout,
  Sun,
  UtensilsCrossed,
  Wheat,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CircularProgress } from "@/components/ui/circular-progress"
import { ProgressBar } from "@/components/ui/progress-bar"
import { calcTargets, type UserProfile } from "@/lib/nutrition-targets"
import { NutritionProfileEntry } from "@/components/nutrition-profile"
import { useMealLog, todayKey, sumFoods, sumMicros, type FoodEntry } from "@/lib/food-data"

/* ---------- 颜色映射（暖枫 token） ---------- */
const COLOR_MAP: Record<string, { text: string; bg: string; soft: string; fill: string }> = {
  leaf: { text: "text-leaf", bg: "bg-leaf", soft: "bg-leaf-soft", fill: "fill-leaf" },
  sakura: { text: "text-sakura", bg: "bg-sakura", soft: "bg-sakura-soft", fill: "fill-sakura" },
  sun: { text: "text-sun", bg: "bg-sun", soft: "bg-sun-soft", fill: "fill-sun" },
  sky: { text: "text-sky", bg: "bg-sky", soft: "bg-sky-soft", fill: "fill-sky" },
}

/* ---------- 营养素小知识 ---------- */
interface NutrientInfo {
  role: string
  sources: string
}

const MACRO_INFO: Record<string, NutrientInfo> = {
  calorie: {
    role: "热量就是食物给身体的「电量」。身体像手机一样，吃喝、走路、甚至睡觉都在耗电；吃进来的和消耗掉的平衡了，体重才稳。",
    sources: "米饭、面条、肉、油、水果……几乎所有食物都带着热量。",
  },
  protein: {
    role: "蛋白质是身体的「砖块」：长肌肉、修伤口、做酶和抗体（也就是我们抵抗力的一部分）。掉头发、容易感冒，有时都和蛋白不够有关。",
    sources: "鸡蛋、牛奶、鸡胸肉、鱼虾、豆腐、黄豆。",
  },
  fat: {
    role: "脂肪不是坏东西，它是身体的「备用油箱」：存能量、保护内脏，还帮身体吸收维生素 A、D、E、K，让皮肤和头发更好。",
    sources: "坚果、牛油果、橄榄油、深海鱼。",
  },
  carb: {
    role: "碳水是身体和大脑最喜欢的「燃料」，尤其大脑几乎只靠它运转。粗粮比白米白面更耐饿，血糖也更稳。",
    sources: "糙米、燕麦、红薯、全麦面包、豆类。",
  },
}

const MICRO_INFO: Record<string, NutrientInfo> = {
  fiber: {
    role: "膳食纤维是肠道的「清道夫」：让排便顺畅、增加饱腹感、帮血糖和血脂更平稳。现代人大多都吃不够。",
    sources: "蔬菜、水果、燕麦、豆类、全谷。",
  },
  vc: {
    role: "维生素C是「抗氧化小卫士」：帮伤口长好、增强抵抗力、让皮肤更有弹性（合成胶原蛋白）。身体留不住，得天天吃。",
    sources: "柑橘、猕猴桃、草莓、青椒、西兰花。",
  },
  calcium: {
    role: "钙是骨头和牙齿的「主材料」，年轻时存得多，老了才不容易疏松；它也管肌肉收缩和神经信号传递。",
    sources: "牛奶、酸奶、豆制品、深绿蔬菜、带骨的小鱼干。",
  },
  iron: {
    role: "铁是血液里「运氧快递员」（血红蛋白）的关键。缺铁会累、头晕、气色差；女生因为月经更容易缺。",
    sources: "红肉、动物血、肝脏、菠菜、黑芝麻。",
  },
}

/* ---------- 今日三餐（从本地记录读取） ---------- */
interface MealView {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  foods: FoodEntry[]
}

const MEAL_ORDER: MealView[] = [
  { key: "breakfast", label: "早餐", icon: Sun, foods: [] },
  { key: "lunch", label: "午餐", icon: UtensilsCrossed, foods: [] },
  { key: "dinner", label: "晚餐", icon: Soup, foods: [] },
  { key: "snack", label: "加餐", icon: Apple, foods: [] },
]

interface NutrientBase {
  key: string
  label: string
  current: number
  target: number
  unit: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  info: NutrientInfo
}

/* ---------- 营养素概览卡片（可点，进入详解） ---------- */
function NutrientChip({
  item,
  onClick,
}: {
  item: NutrientBase
  onClick: () => void
}) {
  const Icon = item.icon
  const safeTarget = item.target || 1
  const safeCurrent = item.current || 0
  const percent = Math.min(100, Math.round((safeCurrent / safeTarget) * 100))
  const colors = COLOR_MAP[item.color]

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-2xl border border-border/30 bg-card p-3 text-left shadow-sm transition active:scale-[0.97]"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", colors.soft)}>
        <Icon className={cn("h-4 w-4", colors.text)} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
          <span className={cn("shrink-0 text-xs font-semibold", colors.text)}>{percent}%</span>
        </div>
        <div className="mt-1.5">
          <ProgressBar
            value={percent}
            fillClassName={cn("rounded-full", colors.bg)}
            trackClassName="bg-muted/60"
            height={4}
          />
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-foreground/50" />
    </button>
  )
}

/* ---------- 一餐卡片（选项卡内容） ---------- */
function MealCard({ meal, onAddFood }: { meal: MealView; onAddFood?: () => void }) {
  const Icon = meal.icon
  const total = meal.foods.reduce((s, f) => s + f.kcal, 0)

  return (
    <div className="rounded-[--radius] border border-border/30 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-1 text-foreground/70">
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-serif text-base font-medium text-foreground">{meal.label}</span>
        <span className="ml-auto text-sm font-medium text-foreground/60">{total} kcal</span>
      </div>

      {meal.foods.length === 0 ? (
        <p className="py-2 text-center text-xs text-foreground/40">还没吃这顿，去食物库加点吧～</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {meal.foods.map((fd, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-t border-border/15 py-2.5 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{fd.name}</p>
                <p className="text-xs text-foreground/45">{fd.portion}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-foreground">{fd.kcal} kcal</p>
                <p className="text-[11px] text-foreground/45">
                  P{fd.p} · F{fd.f} · C{fd.c}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/50 py-2 text-xs font-medium text-foreground/55 transition active:scale-[0.98]"
        onClick={onAddFood}
      >
        <Plus className="h-3.5 w-3.5" />
        添加食物
      </button>
    </div>
  )
}

/* ---------- 营养素详解（独立界面） ---------- */
function NutrientDetailScreen({
  item,
  onBack,
}: {
  item: NutrientBase
  onBack: () => void
}) {
  const Icon = item.icon
  const safeTarget = item.target || 1
  const safeCurrent = item.current || 0
  const percent = Math.min(100, Math.round((safeCurrent / safeTarget) * 100))
  const colors = COLOR_MAP[item.color]
  const sourceTags = item.info.sources.split(/[、，,]/).filter(Boolean)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-2 pt-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground/70 shadow-sm transition active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-serif text-xl font-semibold text-foreground">{item.label}</h1>
          <p className="text-xs text-foreground/45">营养素详解</p>
        </div>
      </header>

      {/* 进度 hero */}
      <section className="flex items-center gap-4 rounded-[--radius] border border-border/30 bg-card p-4 shadow-sm">
        <CircularProgress
          value={percent}
          size={104}
          strokeWidth={11}
          indicatorClassName={colors.text}
          trackClassName="text-surface-2/70"
        >
          <span className="font-serif text-2xl font-semibold text-foreground">{percent}%</span>
        </CircularProgress>
        <div className="flex-1">
          <p className="font-serif text-base font-medium text-foreground">今日摄入</p>
          <p className="mt-1 text-sm text-foreground/60">
            {item.current} / {item.target}
            {item.unit}
          </p>
          <span
            className={cn(
              "mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              percent >= 90 ? "bg-leaf-soft text-leaf" : "bg-sun-soft text-sun",
            )}
          >
            {percent >= 100 ? "今天吃得挺足" : percent >= 60 ? "蛮均衡的" : "还可以更丰富"}
          </span>
        </div>
      </section>

      {/* 它是什么 / 作用 */}
      <section className="rounded-[--radius] border border-border/30 bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", colors.soft)}>
            <Icon className={cn("h-3.5 w-3.5", colors.text)} />
          </span>
          <h2 className="font-serif text-sm font-medium text-foreground">它是什么 · 有什么用</h2>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/70">{item.info.role}</p>
      </section>

      {/* 常见来源 */}
      <section className="rounded-[--radius] border border-border/30 bg-card p-4 shadow-sm">
        <h2 className="mb-2.5 font-serif text-sm font-medium text-foreground">常见食物来源</h2>
        <div className="flex flex-wrap gap-2">
          {sourceTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-1 px-2.5 py-1 text-xs text-foreground/65"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ---------- 详情主页（概览） ---------- */
export function NutritionDetailPage({
  profile,
  onProfileChange,
  onBack,
  onAddFood,
}: {
  profile: UserProfile
  onProfileChange: (next: UserProfile) => void
  onBack: () => void
  onAddFood?: () => void
}) {
  const [mode, setMode] = React.useState<"overview" | "nutrient">("overview")
  const [activeNutrient, setActiveNutrient] = React.useState<NutrientBase | null>(null)
  const [activeMeal, setActiveMeal] = React.useState("breakfast")
  const targets = calcTargets(profile)
  const [log] = useMealLog()
  const today = todayKey()
  const meals: MealView[] = React.useMemo(
    () => MEAL_ORDER.map((m) => ({ ...m, foods: log[today]?.[m.key] ?? [] })),
    [log, today],
  )
  const totals = React.useMemo(() => sumFoods(meals.flatMap((m) => m.foods)), [meals])

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

  const MACROS: NutrientBase[] = [
    { key: "calorie", label: "热量", current: totals.kcal, target: targets.calorie, unit: "kcal", icon: Flame, color: "leaf", info: MACRO_INFO.calorie },
    { key: "protein", label: "蛋白质", current: Math.round(totals.p), target: targets.protein, unit: "g", icon: Egg, color: "sakura", info: MACRO_INFO.protein },
    { key: "fat", label: "脂肪", current: Math.round(totals.f), target: targets.fat, unit: "g", icon: Beef, color: "sun", info: MACRO_INFO.fat },
    { key: "carb", label: "碳水化合物", current: Math.round(totals.c), target: targets.carb, unit: "g", icon: Wheat, color: "sky", info: MACRO_INFO.carb },
  ]

  const microValues = sumMicros(meals.flatMap((m) => m.foods))
  const MICROS: NutrientBase[] = [
    { key: "fiber", label: "膳食纤维", current: Math.round(microValues.fiber || 0), target: targets.fiber, unit: "g", icon: Sprout, color: "leaf", info: MICRO_INFO.fiber },
    { key: "vc", label: "维生素C", current: Math.round(microValues.vitC || 0), target: targets.vc, unit: "mg", icon: Citrus, color: "sun", info: MICRO_INFO.vc },
    { key: "calcium", label: "钙", current: Math.round(microValues.calcium || 0), target: targets.calcium, unit: "mg", icon: Bone, color: "sky", info: MICRO_INFO.calcium },
    { key: "iron", label: "铁", current: Math.round(microValues.iron || 0), target: targets.iron, unit: "mg", icon: Droplets, color: "sakura", info: MICRO_INFO.iron },
  ]

  const ALL = [...MACROS, ...MICROS]
  const currentMeal = meals.find((m) => m.key === activeMeal) ?? meals[0]

  if (mode === "nutrient" && activeNutrient) {
    return <NutrientDetailScreen item={activeNutrient} onBack={() => setMode("overview")} />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 顶部返回栏 */}
      <header className="flex items-center gap-2 pt-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground/70 shadow-sm transition active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-serif text-xl font-semibold text-foreground">今日营养详情</h1>
          <p className="text-xs text-foreground/45">8月2日 · 周日</p>
        </div>
        <div className="ml-auto">
          <NutritionProfileEntry profile={profile} onChange={onProfileChange} />
        </div>
      </header>

      {/* 营养得分 hero */}
      <section className="flex items-center gap-4 rounded-[--radius] border border-border/30 bg-card p-4 shadow-sm">
        <CircularProgress value={score ?? 0} size={92} strokeWidth={9} indicatorClassName="text-leaf" trackClassName="text-surface-2/70">
          <span className="font-serif text-3xl font-semibold text-foreground">{score ?? "--"}</span>
          <span className="mt-0.5 text-[11px] text-foreground/50">营养得分</span>
        </CircularProgress>
        <div className="flex-1">
          <p className="font-serif text-base font-medium text-foreground">
            {hasRecord ? "今天状态不错" : "今天还没记录"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/55">
            {hasRecord
              ? `已记录 ${meals.filter((m) => m.foods.length).length} 餐，合计约 ${totals.kcal} kcal。蛋白质和膳食纤维今天偏少，明天换着吃就好，不用纠结。`
              : "去食物库挑点好吃的，或者自己加一个，慢慢就把今天补满啦～"}
          </p>
          <span
            className={cn(
              "mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              hasRecord ? "bg-leaf-soft text-leaf" : "bg-surface-1 text-foreground/55",
            )}
          >
            {hasRecord ? "优秀" : "待记录"}
          </span>
        </div>
      </section>

      {/* 营养素概览（点开看详解） */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-0.5">
          <h2 className="font-serif text-base font-medium text-foreground">营养素概览</h2>
          <span className="text-xs text-foreground/40">点开看详解</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {ALL.map((m) => (
            <NutrientChip
              key={m.key}
              item={m}
              onClick={() => {
                setActiveNutrient(m)
                setMode("nutrient")
              }}
            />
          ))}
        </div>
      </section>

      {/* 三餐选项卡 */}
      <section className="flex flex-col gap-3">
        <h2 className="px-0.5 font-serif text-base font-medium text-foreground">今天吃了什么</h2>
        <div className="flex gap-1 rounded-full bg-surface-1 p-1">
          {meals.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveMeal(m.key)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-center text-xs font-medium transition active:scale-95",
                activeMeal === m.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-foreground/50",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <MealCard meal={currentMeal} onAddFood={onAddFood} />
      </section>
    </div>
  )
}
