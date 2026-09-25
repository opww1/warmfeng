/**
 * 营养目标计算 —— 纯函数 + localStorage 档案
 *
 * 说明：这里的数字是基于公开公式（Mifflin-St Jeor BMR、WHO 宏量占比、中国 DRIs 微量推荐）
 * 算出来的「人群平均值估算」，不是医疗建议，也不是对你身体的精确读数。
 *
 * v0.1.102 升级：活动量从 4 档系数改为「日常基础 2 选 + 运动清单 MET 量化累加」
 */

export type Gender = "male" | "female"
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active"
export type Goal = "maintain" | "lose" | "gain"

/* ==================== 运动数据类型（v0.1.102 新增） ==================== */

export type ExerciseType = "run" | "weights" | "bodyweight" | "rope" | "walk" | "cycle" | "swim" | "other"
export type Intensity = "low" | "mid" | "high"
export type MeasureType = "duration" | "distance"

export interface ExerciseItem {
  id: string
  type: ExerciseType
  intensity: Intensity
  measure: MeasureType
  value: number
  sessionsPerWeek: number
}

/** MET 参考表（Compendium of Physical Activities 公开学术数据） */
export const MET_TABLE: Record<ExerciseType, Record<Intensity, number>> = {
  run:        { low: 8.3,  mid: 9.8,  high: 11.0 },
  weights:    { low: 3.5,  mid: 5.0,  high: 6.0 },
  bodyweight: { low: 3.0,  mid: 3.5,  high: 4.0 },
  rope:       { low: 8.8,  mid: 11.0, high: 12.3 },
  walk:       { low: 2.5,  mid: 3.5,  high: 4.5 },
  cycle:      { low: 4.0,  mid: 6.8,  high: 8.5 },
  swim:       { low: 6.0,  mid: 8.3,  high: 9.8 },
  other:      { low: 3.0,  mid: 5.0,  high: 7.0 },
}

/** 运动类型中文标签 */
export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  run: "跑步",
  weights: "力量训练",
  bodyweight: "徒手训练",
  rope: "跳绳",
  walk: "散步",
  cycle: "骑车",
  swim: "游泳",
  other: "其他",
}

/** 强度中文标签 */
export const INTENSITY_LABELS: Record<Intensity, string> = {
  low: "低",
  mid: "中",
  high: "高",
}

/** 距离→时长折算配速 */
export const PACE_MAP: Partial<Record<ExerciseType, number>> = {
  run: 6,
  cycle: 20,
}

/* ==================== 数据结构（v0.1.102 扩展） ==================== */

export interface UserProfile {
  gender: Gender
  age: number
  heightCm: number
  weightKg: number
  activity: ActivityLevel

  /* v0.1.102 新增字段 */
  neatLevel: "sedentary" | "light"
  goal: Goal
  goalRate: "slow" | "standard" | "aggressive"
  exercises: ExerciseItem[]
  mealsPerDay: number
  allergens: string[]
  vegetarian: boolean
}

/** 默认档案（演示用，未填写时回退） */
export const DEFAULT_PROFILE: UserProfile = {
  gender: "female",
  age: 30,
  heightCm: 165,
  weightKg: 60,
  activity: "light",
  neatLevel: "sedentary",
  goal: "maintain",
  goalRate: "standard",
  exercises: [],
  mealsPerDay: 3,
  allergens: [],
  vegetarian: false,
}

/** 未成年判断：18 岁以下走成长逻辑（不出现热量赤字、需求上调） */
export function isMinor(age: number): boolean {
  return age < 18
}

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
}

/** 旧 activity → 新 neatLevel 映射（向后兼容） */
function mapActivityToNeat(activity: ActivityLevel): "sedentary" | "light" {
  return activity === "light" || activity === "active" ? "light" : "sedentary"
}

/* ==================== 计算引擎（v0.1.102 升级） ==================== */

export interface NutritionTargets {
  calorie: number
  protein: number
  fat: number
  carb: number
  fiber: number
  vc: number
  calcium: number
  iron: number
}

export interface NutritionPlan {
  bmr: number
  tdee: number
  targetKcal: number
  protein: { g: number; kcal: number }
  fat: { g: number; kcal: number }
  carb: { g: number; kcal: number }
  dailyExerciseKcal: number
  mealSplit: number[]
}

/**
 * 计算单条运动的日均消耗（kcal）
 * 公式：MET × weight(kg) × duration(小时) × sessionsPerWeek ÷ 7
 */
export function calcExerciseDailyKcal(exercise: ExerciseItem, weightKg: number): number {
  const met = MET_TABLE[exercise.type]?.[exercise.intensity] ?? 3.0
  let durationHours: number

  if (exercise.measure === "distance") {
    const pace = PACE_MAP[exercise.type]
    if (!pace) return 0
    durationHours = exercise.value / pace
  } else {
    durationHours = exercise.value / 60
  }

  const singleKcal = met * weightKg * durationHours
  const weeklyKcal = singleKcal * exercise.sessionsPerWeek
  return Math.round(weeklyKcal / 7)
}

/**
 * 纯函数：计算完整营养计划
 * 便于单测与手动重算复用
 */
export function calcPlan(profile: UserProfile): NutritionPlan {
  const p = profile
  const minor = isMinor(p.age)

  // ① BMR（Mifflin-St Jeor）
  const bmrRaw = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.gender === "male" ? 5 : -161)
  const bmr = Math.max(bmrRaw, 0)

  // ② NEAT（日常基础代谢）
  const neatFactor = p.neatLevel === "sedentary" ? 1.2 : 1.375
  const neat = bmr * neatFactor

  // ③ 运动消耗（MET 量化累加）
  const dailyExerciseKcal = p.exercises.reduce(
    (sum, ex) => sum + calcExerciseDailyKcal(ex, p.weightKg),
    0,
  )

  // ④ TDEE
  const tdee = neat + dailyExerciseKcal

  // ⑤ 目标热量
  let targetKcal: number
  if (minor) {
    targetKcal = p.goal === "gain" ? tdee * 1.1 : tdee
  } else {
    if (p.goal === "lose") {
      const rateMap = { slow: 300, standard: 500, aggressive: 1000 }
      const deficit = rateMap[p.goalRate] ?? 500
      targetKcal = Math.max(tdee - deficit, tdee * 0.8)
    } else if (p.goal === "gain") {
      const rateMap = { slow: 0.05, standard: 0.1, aggressive: 0.15 }
      const surplus = rateMap[p.goalRate] ?? 0.1
      targetKcal = tdee * (1 + surplus)
    } else {
      targetKcal = tdee
    }
  }
  targetKcal = Math.round(targetKcal)

  // ⑥ 三大营养素
  const proteinGPerKg = minor ? 1.8 : p.goal === "lose" ? 2.0 : p.goal === "gain" ? 2.2 : 1.8
  const fatGPerKg = minor ? 1.0 : p.goal === "lose" ? 1.2 : p.goal === "gain" ? 1.0 : 0.8
  const proteinG = Math.round(proteinGPerKg * p.weightKg)
  let fatG = Math.round(fatGPerKg * p.weightKg)
  const proteinKcal = proteinG * 4
  let fatKcal = fatG * 9
  let carbG = Math.round((targetKcal - proteinKcal - fatKcal) / 4)

  if (carbG < 0) {
    const minFatG = Math.round(0.8 * p.weightKg)
    fatG = minFatG
    fatKcal = fatG * 9
    carbG = Math.round((targetKcal - proteinKcal - fatKcal) / 4)
    if (carbG < 0) carbG = 0
  }

  // ⑦ 餐次拆分
  const mealSplit = getMealSplit(p.mealsPerDay)

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetKcal,
    protein: { g: proteinG, kcal: proteinKcal },
    fat: { g: fatG, kcal: fatG * 9 },
    carb: { g: carbG, kcal: carbG * 4 },
    dailyExerciseKcal,
    mealSplit,
  }
}

/** 按餐次数返回各餐占比 */
function getMealSplit(mealsPerDay: number): number[] {
  switch (mealsPerDay) {
    case 2:
      return [0.5, 0.5]
    case 3:
      return [0.3, 0.35, 0.35]
    case 4:
      return [0.3, 0.3, 0.3, 0.1]
    case 5:
      return [0.25, 0.25, 0.25, 0.15, 0.1]
    case 6:
      return [0.2, 0.2, 0.2, 0.15, 0.15, 0.1]
    default:
      return [0.3, 0.35, 0.35]
  }
}

/**
 * 兼容旧接口：根据档案计算每日营养目标
 * 返回四舍五入后的整数，便于直接显示在圆环/进度条上。
 */
export function calcTargets(p: UserProfile): NutritionTargets {
  const profile = ensureProfileShape(p)
  const plan = calcPlan(profile)
  const w = profile.weightKg
  const age = profile.age
  const gender = profile.gender

  // ── 膳食纤维 ──
  // 每1000kcal需14g纤维（WHO/FAO推荐）
  const fiber = Math.round((plan.targetKcal / 1000) * 14)

  // ── 维生素C ──
  // DRI基础: 男性90mg 女性75mg + 0.5mg/kg体重
  const vcBase = gender === "male" ? 90 : 75
  const vc = Math.round(vcBase + w * 0.5)

  // ── 钙 ──
  // 基础10mg/kg，50岁以上+5mg/kg（吸收率下降），女性+2mg/kg（骨密度）
  const calciumPerKg = 10 + (age >= 50 ? 5 : 0) + (gender === "female" ? 2 : 0)
  const calcium = Math.round(w * calciumPerKg)

  // ── 铁 ──
  // DRI基础: 女性15-49岁18mg（经期流失），其余8mg
  // 体重调整: 每kg体重 +0.15mg（血容量随体重增长）
  const ironBase = gender === "female" && age >= 15 && age < 50 ? 18 : 8
  const iron = Math.round(ironBase + w * 0.15)

  return {
    calorie: plan.targetKcal,
    protein: plan.protein.g,
    fat: plan.fat.g,
    carb: plan.carb.g,
    fiber,
    vc,
    calcium,
    iron,
  }
}

/**
 * 确保档案数据结构完整（向后兼容旧数据）
 * 旧档案只有 gender/age/heightCm/weightKg/activity/goal 六个字段
 */
export function ensureProfileShape(p: Partial<UserProfile>): UserProfile {
  const base = { ...DEFAULT_PROFILE, ...p }
  if (!base.neatLevel) {
    base.neatLevel = mapActivityToNeat(base.activity)
  }
  if (!Array.isArray(base.exercises)) {
    base.exercises = []
  }
  if (!base.goalRate) {
    base.goalRate = "standard"
  }
  if (!base.mealsPerDay || base.mealsPerDay < 2 || base.mealsPerDay > 6) {
    base.mealsPerDay = 3
  }
  if (!Array.isArray(base.allergens)) {
    base.allergens = []
  }
  if (base.vegetarian === undefined) {
    base.vegetarian = false
  }
  return base as UserProfile
}

/* ==================== localStorage 档案持久化 ==================== */

import { useEffect, useState } from "react"

const STORAGE_KEY = "warmisle.nutrition.profile"

/**
 * 读取 / 写入用户营养档案（持久化到 localStorage）。
 * 返回当前档案与更新函数；首次使用回退到 DEFAULT_PROFILE。
 */
export function useNutritionProfile(): [UserProfile, (next: UserProfile) => void] {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserProfile>
        setProfile(ensureProfileShape(parsed))
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, [])

  const update = (next: UserProfile) => {
    const shaped = ensureProfileShape(next)
    setProfile(shaped)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shaped))
    } catch {
      /* ignore quota / privacy errors */
    }
  }

  return [profile, update]
}
