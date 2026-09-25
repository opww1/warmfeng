"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { Minus, Plus, Settings2, Sparkles, Trash2, TriangleAlert, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  calcExerciseDailyKcal,
  calcPlan,
  calcTargets,
  EXERCISE_TYPE_LABELS,
  INTENSITY_LABELS,
  isMinor,
  type ExerciseItem,
  type ExerciseType,
  type Gender,
  type Goal,
  type Intensity,
  type MeasureType,
  type UserProfile,
} from "@/lib/nutrition-targets"

const GENDER_OPTIONS: { key: Gender; label: string }[] = [
  { key: "male", label: "男" },
  { key: "female", label: "女" },
]

const NEAT_OPTIONS: { key: "sedentary" | "light"; label: string; hint: string }[] = [
  { key: "sedentary", label: "久坐办公", hint: "系数 1.2" },
  { key: "light", label: "日常走动多", hint: "系数 1.375" },
]

const EXERCISE_TYPES: { key: ExerciseType; label: string }[] = [
  { key: "run", label: "跑步" },
  { key: "weights", label: "力量训练" },
  { key: "bodyweight", label: "徒手训练" },
  { key: "rope", label: "跳绳" },
  { key: "walk", label: "散步" },
  { key: "cycle", label: "骑车" },
  { key: "swim", label: "游泳" },
  { key: "other", label: "其他" },
]

const INTENSITY_OPTIONS: { key: Intensity; label: string }[] = [
  { key: "low", label: "低" },
  { key: "mid", label: "中" },
  { key: "high", label: "高" },
]

const WALK_INTENSITY_OPTIONS: { key: Intensity; label: string }[] = [
  { key: "low", label: "散步" },
  { key: "mid", label: "快走" },
  { key: "high", label: "竞走" },
]

function getIntensityOptions(type: ExerciseType): { key: Intensity; label: string }[] {
  return type === "walk" ? WALK_INTENSITY_OPTIONS : INTENSITY_OPTIONS
}

const DISTANCE_TYPES: ExerciseType[] = ["run", "cycle"]

function goalOptions(minor: boolean): { key: Goal; label: string; hint?: string }[] {
  if (minor) {
    return [
      { key: "maintain", label: "维持", hint: "保持当前状态" },
      { key: "gain", label: "长身体", hint: "支持成长发育" },
    ]
  }
  return [
    { key: "maintain", label: "维持体重", hint: "保持当前状态" },
    { key: "lose", label: "减脂塑形", hint: "减少体脂" },
    { key: "gain", label: "增肌", hint: "增加肌肉量" },
  ]
}

function goalRateOptions(goal: Goal, minor: boolean): { key: string; label: string; hint?: string }[] {
  if (minor) return []
  if (goal === "lose") {
    return [
      { key: "slow", label: "慢", hint: "每周约半斤，不反弹" },
      { key: "standard", label: "标准", hint: "每周约1斤，效果明显" },
      { key: "aggressive", label: "快", hint: "每周约2斤，需严格控制" },
    ]
  }
  if (goal === "gain") {
    return [
      { key: "slow", label: "慢", hint: "每月约增1斤" },
      { key: "standard", label: "标准", hint: "每月约增2-3斤" },
      { key: "aggressive", label: "快", hint: "每月约增4-5斤，需配合训练" },
    ]
  }
  return []
}

function createEmptyExercise(): ExerciseItem {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: "run",
    intensity: "mid",
    measure: "duration",
    value: 30,
    sessionsPerWeek: 3,
  }
}

/* ---------- 数字步进器 ---------- */
function NumberField({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  unit: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const [text, setText] = React.useState(String(value))

  React.useEffect(() => {
    setText(String(value))
  }, [value])

  const commit = () => {
    const raw = text.trim()
    if (raw === "" || Number.isNaN(Number(raw))) {
      setText(String(value))
      return
    }
    const c = clamp(Number(raw))
    onChange(c)
    setText(String(c))
  }

  const bump = (dir: 1 | -1) => {
    const c = clamp(value + dir * step)
    onChange(c)
    setText(String(c))
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/30 bg-surface-1/60 px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-foreground/45">单位：{unit}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={`减少${label}`}
          onClick={() => bump(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground/70 shadow-sm transition active:scale-90"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={text}
          min={min}
          max={max}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur()
          }}
          className="w-14 bg-transparent text-center text-lg font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`增加${label}`}
          onClick={() => bump(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground/70 shadow-sm transition active:scale-90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ---------- 分段选择器 ---------- */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { key: T; label: string; hint?: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {options.map((o) => {
        const active = o.key === value
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              "rounded-xl border px-3 py-2 text-left text-sm transition active:scale-[0.97]",
              active
                ? "border-leaf/40 bg-leaf-soft text-leaf"
                : "border-border/30 bg-surface-1/60 text-foreground/70",
            )}
          >
            <span className="block font-medium">{o.label}</span>
            {o.hint && <span className="block text-[11px] opacity-70">{o.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- 运动类型选择（横向滚动标签） ---------- */
function ExerciseTypePicker({
  value,
  onChange,
}: {
  value: ExerciseType
  onChange: (v: ExerciseType) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {EXERCISE_TYPES.map((t) => {
        const active = t.key === value
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition active:scale-95",
              active
                ? "border-leaf/40 bg-leaf-soft text-leaf font-medium"
                : "border-border/30 bg-surface-1/60 text-foreground/60",
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- 单条运动编辑卡片 ---------- */
function ExerciseItemCard({
  exercise,
  weightKg,
  onChange,
  onDelete,
}: {
  exercise: ExerciseItem
  weightKg: number
  onChange: (next: ExerciseItem) => void
  onDelete: () => void
}) {
  const supportsDistance = DISTANCE_TYPES.includes(exercise.type)
  const dailyKcal = calcExerciseDailyKcal(exercise, weightKg)

  const update = (patch: Partial<ExerciseItem>) => {
    const next = { ...exercise, ...patch }
    if (patch.type && !DISTANCE_TYPES.includes(patch.type) && next.measure === "distance") {
      next.measure = "duration"
    }
    onChange(next)
  }

  return (
    <div className="rounded-2xl border border-border/25 bg-surface-1/40 p-3">
      {/* 顶部：类型选择 + 删除 */}
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <ExerciseTypePicker value={exercise.type} onChange={(v) => update({ type: v })} />
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="删除运动"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground/35 transition hover:bg-red-50 hover:text-red-400 active:scale-90"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 强度 */}
      <div className="mb-2.5">
        <p className="mb-1 text-[11px] text-foreground/45">强度</p>
        <div className="flex gap-1">
          {getIntensityOptions(exercise.type).map((i) => {
            const active = i.key === exercise.intensity
            return (
              <button
                key={i.key}
                type="button"
                onClick={() => update({ intensity: i.key })}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1 text-xs transition active:scale-95",
                  active
                    ? "border-leaf/40 bg-leaf-soft text-leaf font-medium"
                    : "border-border/25 bg-card text-foreground/60",
                )}
              >
                {i.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 计量方式 */}
      {supportsDistance && (
        <div className="mb-2.5">
          <p className="mb-1 text-[11px] text-foreground/45">计量方式</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => update({ measure: "duration" })}
              className={cn(
                "flex-1 rounded-lg border px-2 py-1 text-xs transition active:scale-95",
                exercise.measure === "duration"
                  ? "border-leaf/40 bg-leaf-soft text-leaf font-medium"
                  : "border-border/25 bg-card text-foreground/60",
              )}
            >
              时长
            </button>
            <button
              type="button"
              onClick={() => update({ measure: "distance" })}
              className={cn(
                "flex-1 rounded-lg border px-2 py-1 text-xs transition active:scale-95",
                exercise.measure === "distance"
                  ? "border-leaf/40 bg-leaf-soft text-leaf font-medium"
                  : "border-border/25 bg-card text-foreground/60",
              )}
            >
              距离
            </button>
          </div>
        </div>
      )}

      {/* 数值 + 频次 */}
      <div className="mb-2 flex gap-2">
        <div className="flex-1">
          <p className="mb-1 text-[11px] text-foreground/45">
            {exercise.measure === "distance" ? "公里/次" : "分钟/次"}
          </p>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={exercise.measure === "distance" ? 0.5 : 5}
            value={exercise.value}
            onChange={(e) => update({ value: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full rounded-lg border border-border/25 bg-card px-2.5 py-1.5 text-sm font-medium text-foreground outline-none focus:border-leaf/40"
          />
        </div>
        <div className="w-20">
          <p className="mb-1 text-[11px] text-foreground/45">每周次</p>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={7}
            value={exercise.sessionsPerWeek}
            onChange={(e) => {
              const v = Math.min(7, Math.max(1, Number(e.target.value) || 1))
              update({ sessionsPerWeek: v })
            }}
            className="w-full rounded-lg border border-border/25 bg-card px-2.5 py-1.5 text-sm font-medium text-foreground outline-none focus:border-leaf/40"
          />
        </div>
      </div>

      {/* 预估消耗 */}
      <div className="flex items-center justify-between rounded-lg bg-leaf-soft/40 px-2.5 py-1.5">
        <span className="text-[11px] text-foreground/50">预估日均消耗</span>
        <span className="text-sm font-semibold text-leaf">{dailyKcal} kcal</span>
      </div>
    </div>
  )
}

/* ---------- 自包含入口（按钮 + 弹层） ---------- */
export function NutritionProfileEntry({
  profile,
  onChange,
}: {
  profile: UserProfile
  onChange: (next: UserProfile) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<UserProfile>(profile)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [canConfirm, setCanConfirm] = React.useState(false)

  React.useEffect(() => {
    if (open) setDraft(profile)
  }, [open, profile])

  React.useEffect(() => {
    if (!showConfirm) return
    setCanConfirm(false)
    const t = setTimeout(() => setCanConfirm(true), 3000)
    return () => clearTimeout(t)
  }, [showConfirm])

  const minor = isMinor(draft.age)
  const targets = calcTargets(draft)
  const plan = React.useMemo(() => calcPlan(draft), [draft])

  const patch = (p: Partial<UserProfile>) => setDraft((d) => ({ ...d, ...p }))

  const updateExercise = (id: string, next: ExerciseItem) => {
    patch({ exercises: draft.exercises.map((ex) => (ex.id === id ? next : ex)) })
  }

  const addExercise = () => {
    patch({ exercises: [...draft.exercises, createEmptyExercise()] })
  }

  const removeExercise = (id: string) => {
    patch({ exercises: draft.exercises.filter((ex) => ex.id !== id) })
  }

  const save = () => {
    onChange(draft)
    setShowConfirm(false)
    setOpen(false)
  }

  const rateOptions = goalRateOptions(draft.goal, minor)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-medium text-foreground/55 transition active:scale-95"
      >
        <Settings2 className="h-3.5 w-3.5" />
        营养档案
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="flex max-h-[88vh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px] bg-card shadow-2xl"
            >
              {/* 顶部 */}
              <div className="flex items-center justify-between border-b border-border/20 px-5 py-4">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-foreground">我的营养档案</h2>
                  <p className="text-xs text-foreground/45">填完会按你的情况算每日参考目标</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="关闭"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-1 text-foreground/60 transition active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 内容（可滚动） */}
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {minor && (
                  <div className="flex items-start gap-2 rounded-2xl bg-sun-soft/70 p-3 text-[12px] leading-relaxed text-foreground/75">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-sun" />
                    <span>你还在长身体，我们会按成长需要来算，不会建议你少吃或控制热量。多吃、吃多样最重要。</span>
                  </div>
                )}

                {/* 性别 */}
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">性别</p>
                  <Segmented options={GENDER_OPTIONS} value={draft.gender} onChange={(v) => patch({ gender: v })} />
                </div>

                {/* 年龄 / 身高 / 体重 */}
                <div className="space-y-2.5">
                  <NumberField label="年龄" unit="岁" value={draft.age} min={12} max={60} step={1} onChange={(v) => patch({ age: v })} />
                  <NumberField label="身高" unit="cm" value={draft.heightCm} min={100} max={220} step={1} onChange={(v) => patch({ heightCm: v })} />
                  <NumberField label="体重" unit="kg" value={draft.weightKg} min={25} max={200} step={1} onChange={(v) => patch({ weightKg: v })} />
                </div>

                {/* 日常基础活动 */}
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">日常基础活动</p>
                  <Segmented options={NEAT_OPTIONS} value={draft.neatLevel} onChange={(v) => patch({ neatLevel: v })} />
                </div>

                {/* 运动清单 */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">运动消耗</p>
                    <button
                      type="button"
                      onClick={addExercise}
                      className="flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-1 text-xs font-medium text-leaf transition active:scale-95"
                    >
                      <Plus className="h-3 w-3" />
                      添加
                    </button>
                  </div>

                  {draft.exercises.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/30 bg-surface-1/30 p-4 text-center">
                      <p className="text-xs text-foreground/45">还没有添加运动哦</p>
                      <p className="mt-0.5 text-[11px] text-foreground/35">日常基础代谢已帮你算好</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {draft.exercises.map((ex) => (
                        <ExerciseItemCard
                          key={ex.id}
                          exercise={ex}
                          weightKg={draft.weightKg}
                          onChange={(next) => updateExercise(ex.id, next)}
                          onDelete={() => removeExercise(ex.id)}
                        />
                      ))}
                      <div className="flex items-center justify-between rounded-xl bg-surface-1/60 px-3 py-2">
                        <span className="text-xs text-foreground/55">日均运动额外消耗</span>
                        <span className="text-sm font-semibold text-leaf">+{plan.dailyExerciseKcal} kcal</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 目标 */}
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">你的目标</p>
                  <Segmented options={goalOptions(minor)} value={draft.goal} onChange={(v) => patch({ goal: v })} />
                </div>

                {/* 目标速率（减脂/增肌时显示） */}
                {rateOptions.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">目标速率</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {rateOptions.map((r) => {
                        const active = r.key === draft.goalRate
                        return (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => patch({ goalRate: r.key as "slow" | "standard" | "aggressive" })}
                            className={cn(
                              "rounded-xl border px-2.5 py-2 text-left transition active:scale-95",
                              active
                                ? "border-leaf/40 bg-leaf-soft text-leaf"
                                : "border-border/30 bg-surface-1/60 text-foreground/70",
                            )}
                          >
                            <span className="block text-xs font-medium">{r.label}</span>
                            {r.hint && <span className="block text-[10px] opacity-60 leading-tight mt-0.5">{r.hint}</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 实时预览 */}
                <div className="rounded-2xl border border-border/30 bg-surface-1/60 p-3.5">
                  <div className="mb-2.5 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-leaf" />
                    <p className="text-xs font-medium text-foreground/55">为你算出的每日参考</p>
                  </div>
                  <div className="mb-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <PreviewRow label="热量" value={`${targets.calorie} kcal`} />
                    <PreviewRow label="蛋白质" value={`${targets.protein} g`} />
                    <PreviewRow label="脂肪" value={`${targets.fat} g`} />
                    <PreviewRow label="碳水" value={`${targets.carb} g`} />
                  </div>
                  <div className="border-t border-border/20 pt-2.5">
                    <div className="mb-1.5 grid grid-cols-2 gap-x-4 text-sm">
                      <PreviewRow label="膳食纤维" value={`${targets.fiber} g`} />
                      <PreviewRow label="钙" value={`${targets.calcium} mg`} />
                      <PreviewRow label="铁" value={`${targets.iron} mg`} />
                      <PreviewRow label="维C" value={`${targets.vc} mg`} />
                    </div>
                  </div>
                  {draft.exercises.length > 0 && (
                    <div className="mt-2.5 rounded-xl bg-leaf-soft/40 px-2.5 py-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/50">运动额外消耗</span>
                        <span className="font-medium text-leaf">+{plan.dailyExerciseKcal} kcal/天</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 底部保存 */}
              <div className="border-t border-border/20 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="w-full rounded-2xl bg-leaf py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
                >
                  保存并应用
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 保存后的温柔小提示（强制读 3 秒才能确认） */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="w-full max-w-[340px] rounded-3xl bg-card p-6 text-center shadow-2xl"
            >
              <p className="text-[15px] leading-7 text-foreground/80">
                💌 小提示：这份营养数值是温柔测算出来的参考小依据哦，每个人的身体都是独一无二的小星球，不用硬卡数字吃饭，顺着身体舒服的感觉好好吃饭就好啦，身体不舒服记得去找专业的医生姐姐/哥哥看一看～
              </p>
              <button
                type="button"
                disabled={!canConfirm}
                onClick={save}
                className={cn(
                  "mt-5 w-full rounded-2xl py-3 text-sm font-semibold transition active:scale-[0.98]",
                  canConfirm
                    ? "bg-leaf text-white shadow-sm"
                    : "cursor-not-allowed bg-surface-2 text-foreground/40",
                )}
              >
                {canConfirm ? "确认" : "请先读完小提示…"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/55">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
