"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, Plus, Search, X, Check, ChevronRight, Sprout } from "lucide-react"
import { cn } from "@/lib/utils"
import { matchCommonFood, parseFoodInput, computeNutrients, splitComboFood } from "@/lib/common-foods"
import {
  RECOMMENDED,
  REC_GROUP_ORDER,
  useFoodLibrary,
  useMealLog,
  todayKey,
  CAT_IMAGE,
  type FoodEntry,
  type FoodCategory,
} from "@/lib/food-data"
// 扫码功能已封存（暂不用）：组件见 components/barcode-scanner.tsx、条码查询见 lib/barcode-food.ts
// import { BarcodeScannerSheet } from "@/components/barcode-scanner"
// import { lookupBarcode, offToFoodEntry } from "@/lib/barcode-food"
import { searchChinaFoods, chinaToEntry, preloadChinaFoods, getCachedPairings } from "@/lib/china-foods"

const MEAL_TABS = [
  { key: "breakfast", label: "早餐" },
  { key: "lunch", label: "午餐" },
  { key: "dinner", label: "晚餐" },
  { key: "snack", label: "加餐" },
]

const CAT_META: Record<FoodCategory, { label: string; bg: string }> = {
  staple: { label: "主食", bg: "bg-sun-soft" },
  protein: { label: "蛋白", bg: "bg-sakura-soft" },
  veg: { label: "蔬菜", bg: "bg-leaf-soft" },
  fruit: { label: "水果", bg: "bg-sun-soft" },
  snack: { label: "加餐", bg: "bg-sky-soft" },
  drink: { label: "饮品", bg: "bg-sky-soft" },
  soy_egg: { label: "豆制品蛋奶", bg: "bg-cream-soft" },
  nut: { label: "坚果种子", bg: "bg-sand-soft" },
  soup: { label: "汤羹", bg: "bg-mint-soft" },
}


const SCENE_ORDER = [
  { key: "all", label: "全部" },
  { key: "breakfast", label: "元气早餐" },
  { key: "lunch", label: "轻盈午餐" },
  { key: "dinner", label: "暖心晚餐" },
  { key: "grow", label: "长身体加餐" },
  { key: "light", label: "控糖轻食" },
]

export function MacroLine({ food }: { food: FoodEntry }) {
  return (
    <p className="mt-1 text-[11px] text-foreground/45">
      {food.kcal} kcal · 蛋白质 {food.p}g · 脂肪 {food.f}g · 碳水 {food.c}g
    </p>
  )
}

export function FoodThumb({ food, size = "h-14 w-14" }: { food: FoodEntry; size?: string }) {
  // 专属图优先（暖枫推荐食谱 + 常见食物库语义图），否则按分类用卡通代表图
  const thumb = food.image ?? CAT_IMAGE[food.category]
  if (thumb) {
    return (
      <span className={cn("relative shrink-0 overflow-hidden rounded-2xl bg-[#EAECE9]", size)}>
        <img src={thumb} alt={food.name} className="h-full w-full object-cover" />
      </span>
    )
  }
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-2xl text-2xl", CAT_META[food.category].bg, size)}
    >
      {food.emoji ?? "🍽"}
    </span>
  )
}

export function FoodCard({ food, onClick }: { food: FoodEntry; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-border/30 bg-card p-4 text-left shadow-sm transition active:scale-[0.98]"
    >
      <FoodThumb food={food} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-base font-medium text-foreground">{food.name}</p>
          {food.isRecipe && (
            <span className="shrink-0 rounded-full bg-leaf-soft px-1.5 py-0.5 text-[10px] font-medium text-leaf">
              套餐
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-foreground/45">{food.portion}</p>
        <MacroLine food={food} />
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-foreground/30" />
    </button>
  )
}

function NutritionBlurb() {
  return (
    <div className="rounded-2xl bg-surface-1/60 p-3 text-xs leading-relaxed text-foreground/55">
      💡 简单说：<b>热量</b>是身体的小电量，<b>蛋白质</b>是修补身体的小砖块，<b>脂肪</b>是保暖又存能量的小仓库，<b>碳水</b>是跑跳用的快充电池。顺着身体舒服的感觉吃就好，不用硬卡数字～
    </div>
  )
}

export function FoodLibraryPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = React.useState<"mine" | "recommend" | "china">("mine")
  const [search, setSearch] = React.useState("")
  const [sceneFilter, setSceneFilter] = React.useState<string>("all")
  const [myFoods, setMyFoods] = useFoodLibrary()
  const [, addFood] = useMealLog()
  const [detail, setDetail] = React.useState<FoodEntry | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  // 扫码已封存：弹层开关一并移除（恢复时随 handleScanned 一起还原）
  const [addInitialName, setAddInitialName] = React.useState<string | undefined>(undefined)
  // 扫码没查到时暂存条码，手动补录保存时一并写入，实现下次同条码秒出
  const [pendingBarcode, setPendingBarcode] = React.useState<string | undefined>(undefined)
  const [chinaList, setChinaList] = React.useState<FoodEntry[]>([])
  const [chinaLoading, setChinaLoading] = React.useState(false)
  const [toast, setToast] = React.useState<string | null>(null)
  const toastTimer = React.useRef<number | undefined>(undefined)

  const showToast = React.useCallback((m: string) => {
    setToast(m)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1600)
  }, [])

  // 保持最新的「我的食物」引用，供扫码回调稳定读取（避免相机反复重启）
  const myFoodsRef = React.useRef(myFoods)
  React.useEffect(() => {
    myFoodsRef.current = myFoods
  }, [myFoods])

  // 中国食材搜索（异步加载 JSON，不打包进 bundle）
  React.useEffect(() => {
    if (tab !== "china") return
    if (!search.trim()) { setChinaList([]); setChinaLoading(false); return }
    let cancelled = false
    setChinaLoading(true)
    searchChinaFoods(search).then((res) => {
      if (cancelled) return
      setChinaList(res.map(chinaToEntry))
      setChinaLoading(false)
    }).catch(() => {
      if (cancelled) return
      setChinaLoading(false)
    })
    return () => { cancelled = true }
  }, [search, tab])

  // 页面挂载时预加载中国食材 JSON（后续搜索无需等待第一次 fetch）
  React.useEffect(() => { preloadChinaFoods() }, [])

  // 扫码命中后的处理已随扫码功能封存，恢复时取消下方注释即可
  /*
  const handleScanned = React.useCallback(
    async (barcode: string) => {
      // 1) 本地条码缓存命中 → 秒出，不再联网
      const cached = myFoodsRef.current.find((x) => x.barcode === barcode)
      if (cached) {
        setDetail(cached)
        return
      }
      // 2) 联网查 Open Food Facts
      showToast("正在识别…")
      const raw = await lookupBarcode(barcode)
      if (!raw) {
        // 3) 没查到 → 打开手动添加，预填条码名 + 记住条码
        showToast("数据库没这包，补一下，下次同条码直接出")
        setAddInitialName(`[条码 ${barcode}] 手动补营养`)
        setPendingBarcode(barcode)
        setAddOpen(true)
        return
      }
      const entry = offToFoodEntry(raw)
      // 写入本地条码缓存（按条码去重），下次同条码秒出
      const list = myFoodsRef.current
      setMyFoods([...list.filter((x) => x.id !== entry.id), entry])
      setDetail(entry)
    },
    [setMyFoods, setDetail, setAddOpen, setAddInitialName, showToast],
  )
  */

  const joinMeal = (meal: string) => {
    if (!detail) return
    addFood(todayKey(), meal, [detail])
    setDetail(null)
    const label = MEAL_TABS.find((m) => m.key === meal)?.label ?? meal
    showToast(`已加入${label}`)
  }

  const favorite = () => {
    if (!detail) return
    if (myFoods.some((x) => x.id === detail.id)) {
      showToast("已在我的食物库")
      return
    }
    setMyFoods([...myFoods, { ...detail, source: "user" }])
    showToast("已收藏到我的食物")
  }

  const removeMine = () => {
    if (!detail) return
    setMyFoods(myFoods.filter((x) => x.id !== detail.id))
    setDetail(null)
    showToast("已删除")
  }

  const matchScene = (x: FoodEntry) =>
    sceneFilter === "all" || x.scene === sceneFilter || x.group === sceneFilter
  const filteredMine = myFoods.filter(
    (x) => x.name.toLowerCase().includes(search.toLowerCase()) && matchScene(x),
  )
  const filteredRec = RECOMMENDED.filter(
    (x) => x.name.toLowerCase().includes(search.toLowerCase()) && matchScene(x),
  )
  // 中国食物成分表：数据由 useEffect + state 异步加载（不打包进 bundle）

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
          <h1 className="font-serif text-xl font-semibold text-foreground">食物库</h1>
          <p className="text-xs text-foreground/45">我的食物 · 暖枫推荐</p>
        </div>
      </header>

      {/* 搜索 */}
      <div className="flex items-center gap-2 rounded-2xl border border-border/30 bg-surface-1/60 px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-foreground/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜搜想吃的"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="清空">
            <X className="h-4 w-4 text-foreground/40" />
          </button>
        )}
      </div>

      {/* tab 切换 */}
      <div className="flex w-full items-center gap-1 rounded-full bg-surface-1 p-1">
        {(
          [
            { key: "mine", label: "我的食物" },
            { key: "recommend", label: "暖枫推荐" },
            { key: "china", label: "中国食材" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-full px-4 py-1.5 text-[13px] font-medium transition active:scale-95",
              tab === key ? "bg-card text-foreground shadow-sm" : "text-foreground/50 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 场景导航栏（中国食材无场景分组，隐藏） */}
      {tab !== "china" && (
        <div className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-1">
          {SCENE_ORDER.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSceneFilter(s.key)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition active:scale-95",
                sceneFilter === s.key
                  ? "bg-leaf text-white shadow-sm"
                  : "bg-surface-1 text-foreground/55 hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* 列表 */}
      {tab === "mine" ? (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs text-foreground/40">{filteredMine.length} 个食物</span>
            <div className="flex items-center gap-3">
              {/* 扫码入口已封存（暂不用）：组件与逻辑保留，只移除按钮 */}
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1 text-sm text-leaf transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                添加
              </button>
            </div>
          </div>

          {filteredMine.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/40 bg-card/50 p-6 text-center">
              <p className="text-sm font-medium text-foreground/70">还没有食物哦</p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/45">
                点右上角「添加」记一个你常吃的；或者去「暖枫推荐」挑几个收藏进来～
              </p>
            </div>
          ) : (
            filteredMine.map((food) => (
              <FoodCard key={food.id} food={food} onClick={() => setDetail(food)} />
            ))
          )}
        </section>
      ) : tab === "recommend" ? (
        <section className="flex flex-col gap-4">
          {REC_GROUP_ORDER.map((g) => {
            const items = filteredRec.filter((x) => x.group === g.key)
            if (items.length === 0) return null
            return (
              <div key={g.key} className="flex flex-col gap-2.5">
                <h2 className="px-0.5 font-serif text-sm font-medium text-foreground/70">{g.label}</h2>
                {items.map((food) => (
                  <FoodCard key={food.id} food={food} onClick={() => setDetail(food)} />
                ))}
              </div>
            )
          })}
        </section>
      ) : (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs text-foreground/40">
              {chinaLoading ? "加载中…" : search.trim() ? `${chinaList.length} 种食材` : "中国食物成分表 · 第 6 版"}
            </span>
          </div>
          {chinaLoading ? (
            <div className="rounded-2xl border border-dashed border-border/40 bg-card/50 p-6 text-center">
              <p className="text-sm font-medium text-foreground/50">查找中…</p>
            </div>
          ) : chinaList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/40 bg-card/50 p-6 text-center">
              <p className="text-sm font-medium text-foreground/70">搜搜想查的食材</p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/45">
                输入名称查 1725 种中国食物营养，比如「牛肉」「菠菜」「米饭」「苹果」
              </p>
            </div>
          ) : (
            chinaList.map((food) => (
              <FoodCard key={food.id} food={food} onClick={() => setDetail(food)} />
            ))
          )}
        </section>
      )}

      {/* 详情全屏页面 */}
      <AnimatePresence>
        {detail && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-background"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="mx-auto flex h-full w-full max-w-md flex-col pt-[max(env(safe-area-inset-top),var(--wi-sb,0px))]">
              <header className="flex items-center gap-2 border-b border-border/20 px-3 py-3">
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  aria-label="返回"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground/70 shadow-sm transition active:scale-90"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="font-serif text-base font-semibold text-foreground">
                  {detail.isRecipe ? "套餐详情" : "食物详情"}
                </h1>
              </header>

              <div className="flex-1 overflow-y-auto px-4 py-4">
              {(detail.image ?? CAT_IMAGE[detail.category]) ? (
                <div className="mx-auto mb-4 h-44 w-44 overflow-hidden rounded-3xl bg-[#EAECE9] shadow-sm">
                  <img src={detail.image ?? CAT_IMAGE[detail.category]} alt={detail.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div
                  className={cn(
                    "mx-auto mb-4 flex h-44 w-44 items-center justify-center rounded-3xl bg-[#EAECE9] text-6xl shadow-sm",
                    CAT_META[detail.category].bg,
                  )}
                >
                  {detail.emoji ?? "🍽"}
                </div>
              )}

              <div className="mb-4 text-center">
                <p className="font-serif text-xl font-semibold text-foreground">{detail.name}</p>
                <p className="text-xs text-foreground/45">{detail.portion}</p>
              </div>

              {detail.isRecipe && detail.items && detail.items.length > 0 && (
                <div className="mb-4 rounded-2xl bg-surface-1/60 p-4">
                  <p className="mb-2 text-sm font-medium text-foreground/70">里面有这些</p>
                  {detail.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between border-b border-border/10 py-1.5 text-sm last:border-0"
                    >
                      <span className="text-foreground/75">
                        {it.emoji} {it.name}
                      </span>
                      <span className="text-xs text-foreground/45">{it.kcal} kcal</span>
                    </div>
                  ))}
                </div>
              )}

              {detail.steps && detail.steps.length > 0 && (
                <div className="mb-4 rounded-2xl bg-surface-1/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground/70">怎么做</p>
                    <div className="flex items-center gap-2 text-[11px] text-foreground/45">
                      {detail.cookTime && <span>⏱ {detail.cookTime}</span>}
                      {detail.difficulty != null && (
                        <span>难度 {"★".repeat(detail.difficulty)}{"☆".repeat(3 - detail.difficulty)}</span>
                      )}
                    </div>
                  </div>
                  {detail.ingredients && detail.ingredients.length > 0 && (
                    <div className="mb-3 rounded-xl bg-card/70 p-3">
                      <p className="mb-1.5 text-xs font-medium text-foreground/55">需要准备</p>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-leaf-soft/60 px-2.5 py-1 text-xs text-foreground/70"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <ol className="flex flex-col gap-4">
                    {detail.steps.map((s, i) => (
                      <li key={i} className="flex flex-col gap-2">
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf text-xs font-medium text-white">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-sm leading-relaxed text-foreground/70">{s.text}</span>
                        </div>
                        {s.image && (
                          <div className="ml-9 h-32 w-32 overflow-hidden rounded-2xl bg-[#EAECE9] shadow-sm">
                            <img src={s.image} alt={`步骤 ${i + 1}`} className="h-full w-full object-cover" />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm">
                <div className="flex-1 text-center">
                  <p className="text-lg font-semibold text-foreground">{detail.kcal}</p>
                  <p className="text-[11px] text-foreground/45">kcal</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-lg font-semibold text-sakura">{detail.p}g</p>
                  <p className="text-[11px] text-foreground/45">蛋白质</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-lg font-semibold text-sun">{detail.f}g</p>
                  <p className="text-[11px] text-foreground/45">脂肪</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-lg font-semibold text-sky">{detail.c}g</p>
                  <p className="text-[11px] text-foreground/45">碳水</p>
                </div>
              </div>

              {detail.benefits && detail.benefits.length > 0 && (
                <div className="mb-4 rounded-2xl bg-leaf-soft/50 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-leaf">
                    <Sprout className="h-4 w-4" />
                    吃了有什么好处
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {detail.benefits.map((b, i) => (
                      <li key={i} className="flex gap-1.5 text-sm leading-relaxed text-foreground/70">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-leaf" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <NutritionBlurb />

              {detail.pairings && detail.pairings.length > 0 && (
                <div className="mb-4 rounded-2xl bg-surface-1/60 p-4">
                  <p className="mb-2.5 text-sm font-medium text-foreground/70">
                    用它能做
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detail.pairings.map((dish) => (
                      <span
                        key={dish}
                        className="inline-flex items-center rounded-full bg-card px-3 py-1.5 text-sm text-foreground/75 shadow-sm ring-1 ring-border/40"
                      >
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detail.barcode && (
                <p className="mb-2 text-center text-[11px] leading-relaxed text-foreground/40">
                  © Open Food Facts contributors · 数据来自开源社区，仅供参考，请以包装标签为准
                </p>
              )}
              {detail.id.startsWith("cf-") && (
                <p className="mb-2 text-center text-[11px] leading-relaxed text-foreground/40">
                  数据来源：中国食物成分表（第 6 版）· 国家权威数据，仅供参考
                </p>
              )}
            </div>

            <div className="border-t border-border/20 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <p className="mb-2 text-center text-xs text-foreground/45">加入哪一餐</p>
              <div className="mb-2 grid grid-cols-4 gap-2">
                {MEAL_TABS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => joinMeal(m.key)}
                    className="rounded-xl bg-leaf py-2.5 text-sm font-medium text-white shadow-sm transition active:scale-95"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {detail.source === "recommended" ? (
                <button
                  type="button"
                  onClick={favorite}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/40 py-2.5 text-sm font-medium text-foreground/70 transition active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  收藏到我的食物
                </button>
              ) : (
                <button
                  type="button"
                  onClick={removeMine}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/40 py-2.5 text-sm font-medium text-foreground/70 transition active:scale-95"
                >
                  <X className="h-4 w-4" />
                  从我的食物删除
                </button>
              )}
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 添加表单弹层 */}
      <AnimatePresence>
        {addOpen && (
          <AddFoodSheet
            initialName={addInitialName}
            onClose={() => {
              setAddInitialName(undefined)
              setPendingBarcode(undefined)
              setAddOpen(false)
            }}
            onSave={(entry) => {
              // 若是扫码没查到后走的手动兜底，把条码写进食物，下次同条码秒出
              let saved = pendingBarcode ? { ...entry, barcode: pendingBarcode } : entry
              // 按名称自动匹配已知食材的配菜（仅当用户没从提示卡片/解析路径带来 pairings 时兜底）
              // 使用同步版本 getCachedPairings，仅当缓存已加载时可用
              if (!saved.pairings || saved.pairings.length === 0) {
                const auto = getCachedPairings(entry.name)
                if (auto) saved = { ...saved, pairings: auto }
              }
              setMyFoods([...myFoods, saved])
              setAddInitialName(undefined)
              setPendingBarcode(undefined)
              setAddOpen(false)
              showToast("已添加")
            }}
          />
        )}
      </AnimatePresence>

      {/* 扫码相机弹层已封存（随扫码功能一起恢复） */}

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-none fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AddFoodSheet({
  onClose,
  onSave,
  initialName,
}: {
  onClose: () => void
  onSave: (entry: FoodEntry) => void
  initialName?: string
}) {
  const [name, setName] = React.useState(initialName ?? "")
  const [emoji, setEmoji] = React.useState("🍽")
  const [category, setCategory] = React.useState<FoodCategory>("staple")
  const [scene, setScene] = React.useState<string>("breakfast")
  const [portion, setPortion] = React.useState("")
  const [kcal, setKcal] = React.useState("")
  const [p, setP] = React.useState("")
  const [f, setF] = React.useState("")
  const [c, setC] = React.useState("")
  const [fiber, setFiber] = React.useState("")
  const [vitC, setVitC] = React.useState("")
  const [calcium, setCalcium] = React.useState("")
  const [iron, setIron] = React.useState("")
  const [benefits, setBenefits] = React.useState("")
  const [image, setImage] = React.useState<string | undefined>("")
  const [pairings, setPairings] = React.useState<string[]>([])
  // 中国食材库异步搜索结果
  const [chinaResults, setChinaResults] = React.useState<FoodEntry[]>([])
  const searchTimerRef = React.useRef<number | null>(null)
  // 用户直接输入"40g 牛肉"时实时解析出的营养预览
  const [parsed, setParsed] = React.useState<
    | {
        foodName: string
        grams: number
        n: ReturnType<typeof computeNutrients>
        estimated?: boolean
        comboNames?: string[]
      }
    | undefined
  >(undefined)

  const cats: FoodCategory[] = [
    "staple",
    "protein",
    "veg",
    "fruit",
    "snack",
    "drink",
    "soy_egg",
    "nut",
    "soup",
  ]
  const scenes = SCENE_ORDER.filter((s) => s.key !== "all")

  const matched = React.useMemo(() => {
    const q = name.trim()
    if (!q) return []
    const rec = RECOMMENDED.filter((x) => x.name.includes(q) || q.includes(x.name)).slice(0, 3)
    const cf = matchCommonFood(q)
    const common: FoodEntry[] = cf
      ? [
          {
            id: `db-${cf.name}`,
            name: cf.name,
            emoji: "🥗",
            category: cf.category,
            portion: "100 g",
            kcal: cf.kcal,
            p: cf.p,
            f: cf.f,
            c: cf.c,
            fiber: cf.fiber,
            vitC: cf.vitC,
            calcium: cf.calcium,
            iron: cf.iron,
            benefits: cf.benefits,
            pairings: cf.pairings,
            image: cf.image,
            source: "recommended",
          },
        ]
      : []
    // 第三路：组合菜拆分估算（前两手都没命中才走这里）
    const combo = !cf && rec.length === 0 ? splitComboFood(q) : undefined
    const estimated: FoodEntry[] = combo
      ? [
          {
            id: `combo-${q}`,
            name: q,
            emoji: "🍲",
            category: "protein",
            portion: "1 份（按食材估算）",
            kcal: combo.total.kcal,
            p: combo.total.p,
            f: combo.total.f,
            c: combo.total.c,
            fiber: combo.total.fiber,
            vitC: combo.total.vitC,
            calcium: combo.total.calcium,
            iron: combo.total.iron,
            source: "recommended",
            estimated: true,
          },
        ]
      : []
    // 合并中国食材库结果（去重）
    const china = chinaResults.slice(0, 2)
    const all = [...common, ...rec, ...estimated, ...china]
    const seen = new Set<string>()
    return all.filter((item) => {
      const key = item.id.startsWith("cf-") ? `china-${item.name}` : item.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [name, chinaResults])

  const applyMatch = (m: FoodEntry) => {
    setName(m.name)
    setKcal(String(m.kcal))
    setP(String(m.p))
    setF(String(m.f))
    setC(String(m.c))
    setFiber(m.fiber != null ? String(m.fiber) : "")
    setVitC(m.vitC != null ? String(m.vitC) : "")
    setCalcium(m.calcium != null ? String(m.calcium) : "")
    setIron(m.iron != null ? String(m.iron) : "")
    setBenefits(m.benefits ? m.benefits.join("；") : "")
    setImage(m.image)
    setPairings(m.pairings ?? [])
    setPortion(m.portion)
    setCategory(m.category)
    if (m.scene) setScene(m.scene)
  }

  const save = () => {
    if (!name.trim() || kcal === "" || Number.isNaN(Number(kcal))) return
    const benefitList = benefits
      .split(/[；;]/)
      .map((x) => x.trim())
      .filter(Boolean)
    onSave({
      id: `user-${Date.now()}`,
      name: name.trim(),
      emoji: emoji || "🍽",
      category,
      portion: portion.trim() || "1 份",
      kcal: Number(kcal) || 0,
      p: Number(p) || 0,
      f: Number(f) || 0,
      c: Number(c) || 0,
      fiber: fiber ? Number(fiber) : undefined,
      vitC: vitC ? Number(vitC) : undefined,
      calcium: calcium ? Number(calcium) : undefined,
      iron: iron ? Number(iron) : undefined,
      benefits: benefitList.length > 0 ? benefitList : undefined,
      pairings: pairings.length > 0 ? pairings : undefined,
      image: image || undefined,
      source: "user",
      scene,
    })
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[--radius] bg-background p-5 pb-6"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border/40" />
        <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">添加食物</h2>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
              className="h-11 w-14 shrink-0 rounded-2xl bg-surface-1 text-center text-xl outline-none"
              aria-label="emoji"
            />
            <div className="flex-1">
              <label className="text-xs text-foreground/50">名称（可直接写「40g 牛肉」「1根胡萝卜」）</label>
              <input
                value={name}
                onChange={(e) => {
                  const v = e.target.value
                  setName(v)
                  // debounce 中国食材库搜索（300ms）
                  if (searchTimerRef.current) {
                    clearTimeout(searchTimerRef.current)
                  }
                  const trimmedName = v.trim()
                  if (!trimmedName) {
                    setChinaResults([])
                  } else {
                    searchTimerRef.current = window.setTimeout(async () => {
                      try {
                        const results = await searchChinaFoods(trimmedName, 5)
                        setChinaResults(results.map(chinaToEntry))
                      } catch {
                        setChinaResults([])
                      }
                    }, 300)
                  }
                  const parsedRes = parseFoodInput(v)
                  if (parsedRes) {
                    const n = computeNutrients(parsedRes.food, parsedRes.grams)
                    setParsed({ foodName: parsedRes.food.name, grams: parsedRes.grams, n })
                    setKcal(String(n.kcal))
                    setP(String(n.p))
                    setF(String(n.f))
                    setC(String(n.c))
                    setFiber(n.fiber ? String(n.fiber) : "")
                    setVitC(n.vitC ? String(n.vitC) : "")
                    setCalcium(n.calcium ? String(n.calcium) : "")
                    setIron(n.iron ? String(n.iron) : "")
                    setPortion(`${parsedRes.grams} g`)
                    setCategory(parsedRes.food.category)
                    setPairings(parsedRes.food.pairings ?? [])
                    if (!benefits) setBenefits(parsedRes.food.benefits.join("；"))
                  } else {
                    // parseFoodInput 未命中：尝试组合菜拆分估算（如"辣椒炒肉"）
                    const combo = splitComboFood(v)
                    if (combo) {
                      const n = combo.total
                      setParsed({
                        foodName: combo.names.join(" + "),
                        grams: 0,
                        n,
                        estimated: true,
                        comboNames: combo.names,
                      })
                      setKcal(String(n.kcal))
                      setP(String(n.p))
                      setF(String(n.f))
                      setC(String(n.c))
                      setFiber(n.fiber ? String(n.fiber) : "")
                      setVitC(n.vitC ? String(n.vitC) : "")
                      setCalcium(n.calcium ? String(n.calcium) : "")
                      setIron(n.iron ? String(n.iron) : "")
                      setPortion("1 份（按食材估算）")
                      setCategory("protein")
                      if (!benefits) setBenefits("组合菜按食材估算，不含烹饪油盐，仅供参考")
                    } else {
                      setParsed(undefined)
                    }
                  }
                }}
                placeholder="例如：40g 牛肉 / 1根胡萝卜"
                className="w-full rounded-xl border border-border/30 bg-surface-1/60 px-3 py-2 text-sm outline-none focus:border-leaf"
              />
              {matched.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {matched.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => applyMatch(m)}
                      className="flex flex-col gap-1 rounded-xl border border-border/30 bg-surface-1/60 px-3 py-2.5 text-left transition active:scale-95"
                    >
                      <span className="flex items-center justify-between">
                        <span className="truncate text-sm text-foreground/75">
                          {m.emoji} {m.name}
                          {m.estimated && (
                            <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                              估算·不含油盐
                            </span>
                          )}
                        </span>
                        <span className="ml-2 shrink-0 text-xs text-foreground/45">{m.kcal} kcal</span>
                      </span>
                      {m.pairings && m.pairings.length > 0 && (
                        <span className="text-[11px] leading-snug text-foreground/45">
                          用它能做：{m.pairings.join(" / ")}
                        </span>
                      )}
                    </button>
                  ))}
                  <p className="text-[11px] text-foreground/40">点一下也可自动带出营养，不用手填～</p>
                </div>
              )}
              {parsed && (
                <div className="mt-2 rounded-2xl bg-leaf-soft/50 p-3">
                  <p className="text-sm font-medium text-leaf">
                    {parsed.estimated
                      ? `按食材估算（${parsed.foodName}）：`
                      : `按 ${parsed.grams}g ${parsed.foodName} 算出来：`}
                  </p>
                  <p className="mt-1 text-sm text-foreground/75">
                    {parsed.n.kcal} kcal · 蛋白 {parsed.n.p}g · 脂肪 {parsed.n.f}g · 碳水 {parsed.n.c}g
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/55">
                    纤维 {parsed.n.fiber}g · 维C {parsed.n.vitC}mg · 钙 {parsed.n.calcium}mg · 铁 {parsed.n.iron}mg
                  </p>
                  {parsed.estimated && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      估算值：只按食材本身算，没算炒菜用的油和盐，实际会略高。
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-foreground/50">属于哪个场景</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {scenes.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setScene(s.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95",
                    scene === s.key ? "bg-leaf text-white" : "bg-surface-1 text-foreground/60",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-foreground/50">分类</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {cats.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95",
                    category === cat ? "bg-leaf text-white" : "bg-surface-1 text-foreground/60",
                  )}
                >
                  {CAT_META[cat].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-foreground/50">分量</label>
            <input
              value={portion}
              onChange={(e) => setPortion(e.target.value)}
              placeholder="例如：1碗 / 50g"
              className="mt-1.5 w-full rounded-xl border border-border/30 bg-surface-1/60 px-3 py-2 text-sm outline-none focus:border-leaf"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "热量", unit: "kcal", v: kcal, set: setKcal },
              { label: "蛋白", unit: "g", v: p, set: setP },
              { label: "脂肪", unit: "g", v: f, set: setF },
              { label: "碳水", unit: "g", v: c, set: setC },
            ].map((row) => (
              <div key={row.label}>
                <label className="text-xs text-foreground/50">{row.label}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={row.v}
                  onChange={(e) => row.set(e.target.value)}
                  placeholder="0"
                  className="mt-1.5 w-full rounded-xl border border-border/30 bg-surface-1/60 px-2 py-2 text-center text-sm outline-none focus:border-leaf"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "膳食纤维", unit: "g", v: fiber, set: setFiber },
              { label: "维C", unit: "mg", v: vitC, set: setVitC },
              { label: "钙", unit: "mg", v: calcium, set: setCalcium },
              { label: "铁", unit: "mg", v: iron, set: setIron },
            ].map((row) => (
              <div key={row.label}>
                <label className="text-xs text-foreground/50">{row.label}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={row.v}
                  onChange={(e) => row.set(e.target.value)}
                  placeholder="0"
                  className="mt-1.5 w-full rounded-xl border border-border/30 bg-surface-1/60 px-2 py-2 text-center text-sm outline-none focus:border-leaf"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-foreground/50">吃了有什么好处（用 ； 隔开）</label>
            <input
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="例如：补膳食纤维，帮肠道动起来；维C多，皮肤亮亮的"
              className="mt-1.5 w-full rounded-xl border border-border/30 bg-surface-1/60 px-3 py-2 text-sm outline-none focus:border-leaf"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border/40 py-3 text-sm font-medium text-foreground/70 transition active:scale-95"
          >
            取消
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-[2] rounded-2xl bg-leaf py-3 text-sm font-semibold text-white shadow-sm transition active:scale-95"
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
