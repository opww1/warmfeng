// 中国食物成分表（第 6 版）公开数据，经 cn-food-mcp 整理（MIT，可商用）
// 数据从 public/data/china-foods.json 运行时加载（1725 条），不打包进 JS bundle
// 字段：每 100g 可食部营养；kcal=energy、p=protein、f=fat、c=carbohydrate

import type { FoodEntry } from "./food-data"

export type ChinaFood = {
  id: number
  name: string
  category: "staple" | "protein" | "veg" | "fruit" | "snack" | "drink" | "soy_egg" | "nut" | "soup"
  kcal: number
  p: number
  f: number
  c: number
  fiber: number
  vitC: number
  calcium: number
  iron: number
  /** 1-3 道中文家常菜名（不写具体步骤，用户自行搜索做法） */
  pairings?: string[]
}

let _cache: ChinaFood[] | null = null
let _loading: Promise<ChinaFood[]> | null = null

/** 运行期加载（fetch public/data/china-foods.json，浏览器缓存会复用） */
export function loadChinaFoods(): Promise<ChinaFood[]> {
  if (_cache) return Promise.resolve(_cache)
  if (_loading) return _loading
  _loading = fetch("/data/china-foods.json")
    .then((r) => r.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length === 0) throw new Error("china-foods.json 为空")
      _cache = data
      _loading = null
      return _cache!
    })
    .catch((e) => {
      _loading = null
      throw e
    })
  return _loading
}

/** 预加载（可在页面入口调用，避免首次搜索时等待） */
export function preloadChinaFoods(): void {
  loadChinaFoods()
}

/** 按名称模糊匹配已知中国食材的配菜（用户手动添加食物时自动带出菜名） */
export async function matchPairings(name: string): Promise<string[] | undefined> {
  const n = name.trim().toLowerCase()
  if (!n) return undefined
  try {
    const all = await loadChinaFoods()
    const hit =
      all.find((x) => x.name.toLowerCase() === n) ??
      all.find((x) => x.name.toLowerCase().includes(n) || n.includes(x.name.toLowerCase()))
    return hit?.pairings
  } catch {
    return undefined
  }
}

/** 同步获取缓存（仅当缓存已加载时可用，用于保存时的兜底匹配） */
export function getCachedPairings(name: string): string[] | undefined {
  if (!_cache) return undefined
  const n = name.trim().toLowerCase()
  if (!n) return undefined
  const hit =
    _cache.find((x) => x.name.toLowerCase() === n) ??
    _cache.find((x) => x.name.toLowerCase().includes(n) || n.includes(x.name.toLowerCase()))
  return hit?.pairings
}

/** 按名称模糊匹配（需先 loadChinaFoods / preloadChinaFoods） */
export async function searchChinaFoods(q: string, limit = 200): Promise<ChinaFood[]> {
  const all = await loadChinaFoods()
  const s = q.trim().toLowerCase()
  if (!s) return all
  return all.filter((x) => x.name.toLowerCase().includes(s)).slice(0, limit)
}

/** 把一条中国食物成分表数据转成 FoodEntry（详情/卡片/加入某餐复用现有逻辑） */
export function chinaToEntry(cf: ChinaFood): FoodEntry {
  return {
    id: `cf-${cf.id}`,
    name: cf.name,
    category: cf.category,
    portion: "每 100g",
    kcal: cf.kcal,
    p: cf.p,
    f: cf.f,
    c: cf.c,
    fiber: cf.fiber,
    vitC: cf.vitC,
    calcium: cf.calcium,
    iron: cf.iron,
    pairings: cf.pairings,
    source: "recommended",
  }
}
