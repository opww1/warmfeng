"use client"

import type { FoodEntry } from "@/lib/food-data"

/** Open Food Facts 接口地址（生产环境，CORS 开放、读操作免密钥） */
export const OFF_BASE = "https://world.openfoodfacts.org"

/**
 * OFF 官方要求带自定义 User-Agent 标识调用方。
 * ⚠️ 注意：浏览器禁止 JS 修改 User-Agent 请求头（forbidden header），
 * 强行设置会被忽略、且可能触发 CORS 预检导致请求失败。
 * 因此这里改用查询参数 app_name/app_version/app_uuid 标识（OFF 官方支持的替代方案）。
 * 日后若加服务端代理，可在服务端补真正的 User-Agent 头。
 */
export const OFF_APP_NAME = "WarmMaple"
export const OFF_APP_VERSION = "0.1.99"
export const OFF_CONTACT = "contact@warmmaple.app"

/** 本地条码缓存 id（写入「我的食物」useFoodLibrary，按条码去重） */
export function barcodeCacheId(barcode: string): string {
  return `bc-${barcode}`
}

/** OFF 产品接口的精简类型（只取我们用到的字段） */
export interface OffRaw {
  status: number
  product?: {
    code?: string
    product_name?: string
    product_name_zh?: string
    brands?: string
    quantity?: string
    serving_size?: string
    image_front_url?: string
    nutriments?: Record<string, number | string | undefined>
  }
}

/** 按每 100g 取数值，缺失 / 非数字返回 0 */
function numPer100(raw: OffRaw, key: string): number {
  const v = raw.product?.nutriments?.[`${key}_100g`]
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * 查询条码对应的食品。
 * - 读操作免密钥，通过 app_name/app_version/app_uuid 查询参数标识调用方
 * - 失败 / 超时(8s) / 未找到 都返回 null（调用方走手动兜底）
 */
export async function lookupBarcode(barcode: string): Promise<OffRaw | null> {
  const fields =
    "product_name,product_name_zh,brands,quantity,serving_size,image_front_url,nutriments,code,status"
  const url =
    `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json` +
    `?fields=${fields}` +
    `&app_name=${encodeURIComponent(OFF_APP_NAME)}` +
    `&app_version=${encodeURIComponent(OFF_APP_VERSION)}` +
    `&app_uuid=${encodeURIComponent(OFF_CONTACT)}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as OffRaw
    if (data.status !== 1 || !data.product) return null
    return data
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 把 OFF 原始数据映射成暖枫的 FoodEntry。
 * 营养取「每 100g」值；膳食纤维若可得则带上，其余微量留空。
 */
export function offToFoodEntry(raw: OffRaw): FoodEntry {
  const p = raw.product!
  const barcode = p.code ?? ""
  const name = (p.product_name_zh?.trim() || p.product_name?.trim()) ?? "未命名食品"
  const entry: FoodEntry = {
    id: barcodeCacheId(barcode || name),
    name,
    emoji: "📦",
    category: "snack",
    portion: "100g",
    kcal: Math.round(numPer100(raw, "energy-kcal")),
    p: round1(numPer100(raw, "proteins")),
    f: round1(numPer100(raw, "fat")),
    c: round1(numPer100(raw, "carbohydrates")),
    source: "user",
    image: p.image_front_url,
    barcode,
  }
  const fiber = numPer100(raw, "fiber")
  if (fiber) entry.fiber = round1(fiber)
  return entry
}
