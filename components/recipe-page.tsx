"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, Search, X, Plus, Check, Sprout, Pencil, Trash2, Camera, ImagePlus, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  RECIPE_CATS,
  RECIPE_CATALOG,
  useFoodLibrary,
  useMealLog,
  useMyRecipes,
  todayKey,
  CAT_IMAGE,
  type FoodEntry,
  type MyRecipe,
  type RecipeStep,
} from "@/lib/food-data"
import { FoodCard, FoodThumb, MacroLine } from "@/components/food-library"

/** 将本地图片文件压缩为 base64 JPEG，最大宽度 800px、质量 0.7，约 100-200KB */
function compressImage(file: File, maxW = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("canvas unavailable"))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const MEAL_TABS = [
  { key: "breakfast", label: "早餐" },
  { key: "lunch", label: "午餐" },
  { key: "dinner", label: "晚餐" },
  { key: "snack", label: "加餐" },
]

const CAT_META: Record<string, { bg: string }> = {
  staple: { bg: "bg-sun-soft" },
  protein: { bg: "bg-sakura-soft" },
  veg: { bg: "bg-leaf-soft" },
  fruit: { bg: "bg-sun-soft" },
  snack: { bg: "bg-sky-soft" },
  drink: { bg: "bg-sky-soft" },
}

function NutritionBlurb() {
  return (
    <div className="rounded-2xl bg-surface-1/60 p-3 text-xs leading-relaxed text-foreground/55">
      💡 简单说：<b>热量</b>是身体的小电量，<b>蛋白质</b>是修补身体的小砖块，<b>脂肪</b>是保暖又存能量的小仓库，<b>碳水</b>是跑跳用的快充电池。顺着身体舒服的感觉吃就好，不用硬卡数字～
    </div>
  )
}

export function RecipePage({ onBack }: { onBack: () => void }) {
  const [cat, setCat] = React.useState<string>("homestyle")
  const [search, setSearch] = React.useState("")
  const [myFoods, setMyFoods] = useFoodLibrary()
  const [, addFood] = useMealLog()
  const [myRecipes, setMyRecipes] = useMyRecipes()
  const [detail, setDetail] = React.useState<FoodEntry | null>(null)
  const [toast, setToast] = React.useState<string | null>(null)
  const [failedImages, setFailedImages] = React.useState<Set<number>>(new Set())
  /** 编辑弹层：null=关闭；"new"=新建；MyRecipe=编辑已有 */
  const [editor, setEditor] = React.useState<null | "new" | MyRecipe>(null)
  /** 删除确认：null=关闭；MyRecipe=待删除 */
  const [confirmDelete, setConfirmDelete] = React.useState<MyRecipe | null>(null)
  const toastTimer = React.useRef<number | undefined>(undefined)

  const isMine = cat === "mine"

  const list = React.useMemo(() => {
    const q = search.trim()
    if (isMine) {
      return myRecipes.filter((x) => !q || x.name.includes(q))
    }
    return RECIPE_CATALOG.filter(
      (x) => x.recipeCat?.includes(cat) && (!q || x.name.includes(q)),
    )
  }, [cat, search, isMine, myRecipes])

  const showToast = (m: string) => {
    setToast(m)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1600)
  }

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

  /** 保存食谱（新建或更新） */
  const saveRecipe = (recipe: MyRecipe) => {
    const exists = myRecipes.some((x) => x.id === recipe.id)
    const next = exists
      ? myRecipes.map((x) => (x.id === recipe.id ? recipe : x))
      : [recipe, ...myRecipes]
    setMyRecipes(next)
    setEditor(null)
    showToast(exists ? "已更新我的食谱" : "已保存到我的食谱")
  }

  /** 删除食谱 */
  const deleteRecipe = (recipe: MyRecipe) => {
    setMyRecipes(myRecipes.filter((x) => x.id !== recipe.id))
    setConfirmDelete(null)
    setDetail(null)
    showToast("已删除这道食谱")
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
          <h1 className="font-serif text-xl font-semibold text-foreground">菜谱</h1>
          <p className="text-xs text-foreground/45">家常菜 · 暖枫推荐</p>
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

      {/* 左竖排分类 + 右列表 */}
      <section className="flex gap-3">
        <nav className="sticky top-0 flex w-20 shrink-0 flex-col gap-1.5 self-start pb-2">
          {RECIPE_CATS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              className={cn(
                "rounded-2xl px-2 py-2.5 text-center text-[13px] font-medium transition active:scale-95",
                cat === c.key
                  ? "bg-leaf text-white shadow-sm"
                  : "bg-surface-1 text-foreground/55 hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto pb-4">
          {isMine && (
            <button
              type="button"
              onClick={() => setEditor("new")}
              className="mb-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-leaf/50 bg-leaf-soft/30 py-3 text-sm font-medium text-leaf transition active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              写一道我的食谱
            </button>
          )}
          {list.length === 0 ? (
            <p className="mt-8 text-center text-sm text-foreground/40">
              {isMine ? "还没有自己的食谱，写一道试试～" : "这个分类还没有菜哦～"}
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {list.map((food) => (
                <FoodCard key={food.id} food={food} onClick={() => setDetail(food)} />
              ))}
            </div>
          )}
        </div>
      </section>

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
                  {detail.isRecipe ? "套餐详情" : "菜谱详情"}
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
                      CAT_META[detail.category]?.bg,
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
                          {s.image && !failedImages.has(i) && (
                            <div className="ml-9 h-32 w-32 overflow-hidden rounded-2xl bg-[#EAECE9] shadow-sm">
                              <img
                                src={s.image}
                                alt={`步骤 ${i + 1}`}
                                className="h-full w-full object-cover"
                                onError={() => setFailedImages(prev => new Set(prev).add(i))}
                              />
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
                <button
                  type="button"
                  onClick={favorite}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/40 py-2.5 text-sm font-medium text-foreground/70 transition active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  收藏到我的食物
                </button>
                {isMine && detail.source === "user" && (() => {
                  const mine = myRecipes.find((x) => x.id === detail.id)
                  if (!mine) return null
                  return (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditor(mine)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border/40 py-2.5 text-sm font-medium text-foreground/70 transition active:scale-95"
                      >
                        <Pencil className="h-4 w-4" />
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(mine)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-sakura/40 py-2.5 text-sm font-medium text-sakura transition active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </button>
                    </div>
                  )
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 我的食谱编辑弹层 */}
      <AnimatePresence>
        {editor !== null && (
          <MyRecipeEditor
            initial={editor === "new" ? null : editor}
            onCancel={() => setEditor(null)}
            onSave={saveRecipe}
          />
        )}
      </AnimatePresence>

      {/* 删除确认 */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              className="w-full max-w-xs rounded-3xl bg-background p-5 shadow-xl"
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-1 text-center font-serif text-base font-semibold text-foreground">
                要删除这道食谱吗？
              </p>
              <p className="mb-4 text-center text-xs text-foreground/50">
                删掉就找不回来啦，确定的话就轻轻按下「删除」
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-xl border border-border/40 py-2.5 text-sm font-medium text-foreground/70 transition active:scale-95"
                >
                  再想想
                </button>
                <button
                  type="button"
                  onClick={() => deleteRecipe(confirmDelete)}
                  className="rounded-xl bg-sakura py-2.5 text-sm font-medium text-white shadow-sm transition active:scale-95"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

/* ---------------- 我的食谱编辑器 ---------------- */

function MyRecipeEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial: MyRecipe | null
  onCancel: () => void
  onSave: (recipe: MyRecipe) => void
}) {
  const [name, setName] = React.useState(initial?.name ?? "")
  const [image, setImage] = React.useState(initial?.image ?? "")
  const [portion, setPortion] = React.useState(initial?.portion ?? "")
  const [cookTime, setCookTime] = React.useState(initial?.cookTime ?? "")
  const [difficulty, setDifficulty] = React.useState(initial?.difficulty ?? 1)
  const [ingredients, setIngredients] = React.useState<string[]>(initial?.ingredients ?? [""])
  const [steps, setSteps] = React.useState<RecipeStep[]>(initial?.steps ?? [{ text: "" }])
  const [benefits, setBenefits] = React.useState<string[]>(initial?.benefits ?? [])
  const [kcal, setKcal] = React.useState(String(initial?.kcal ?? 0))
  const [p, setP] = React.useState(String(initial?.p ?? 0))
  const [f, setF] = React.useState(String(initial?.f ?? 0))
  const [c, setC] = React.useState(String(initial?.c ?? 0))
  const [ingredientInput, setIngredientInput] = React.useState("")
  const [benefitInput, setBenefitInput] = React.useState("")
  const [imgBusy, setImgBusy] = React.useState(false)
  const [stepImgBusy, setStepImgBusy] = React.useState<number | null>(null)
  const [err, setErr] = React.useState<string | null>(null)

  const fileRef = React.useRef<HTMLInputElement>(null)
  const stepFileRefs = React.useRef<(HTMLInputElement | null)[]>([])

  /** 主图上传处理 */
  const onPickMain = async (file?: File) => {
    if (!file) return
    try {
      setImgBusy(true)
      const base64 = await compressImage(file)
      setImage(base64)
    } catch {
      setErr("图片处理失败，换个试试")
    } finally {
      setImgBusy(false)
    }
  }

  /** 步骤图上传处理 */
  const onPickStep = async (idx: number, file?: File) => {
    if (!file) return
    try {
      setStepImgBusy(idx)
      const base64 = await compressImage(file)
      setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, image: base64 } : s)))
    } catch {
      setErr("步骤图处理失败，换个试试")
    } finally {
      setStepImgBusy(null)
    }
  }

  /** 提交保存 */
  const submit = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErr("给这道食谱起个名字吧")
      return
    }
    const cleanIngredients = ingredients.map((x) => x.trim()).filter(Boolean)
    if (cleanIngredients.length === 0) {
      setErr("至少写一种需要准备的食材")
      return
    }
    const cleanSteps = steps
      .map((s) => ({ ...s, text: s.text.trim() }))
      .filter((s) => s.text || s.image)
    if (cleanSteps.length === 0) {
      setErr("至少写一步做法")
      return
    }
    const now = Date.now()
    const id = initial?.id ?? `mine-${now}-${Math.random().toString(36).slice(2, 8)}`
    const recipe: MyRecipe = {
      id,
      name: trimmedName,
      emoji: "🍽",
      category: "protein",
      portion: portion.trim() || "1人份",
      kcal: Number(kcal) || 0,
      p: Number(p) || 0,
      f: Number(f) || 0,
      c: Number(c) || 0,
      source: "user",
      isRecipe: true,
      image: image || undefined,
      ingredients: cleanIngredients,
      steps: cleanSteps,
      cookTime: cookTime.trim() || undefined,
      difficulty,
      benefits: benefits.map((b) => b.trim()).filter(Boolean),
      recipeCat: ["mine"],
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    }
    onSave(recipe)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[65] flex flex-col bg-background"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", damping: 32, stiffness: 320 }}
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col pt-[max(env(safe-area-inset-top),var(--wi-sb,0px))]">
        <header className="flex items-center justify-between border-b border-border/20 px-3 py-3">
          <button
            type="button"
            onClick={onCancel}
            aria-label="返回"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground/70 shadow-sm transition active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-serif text-base font-semibold text-foreground">
            {initial ? "编辑我的食谱" : "写一道我的食谱"}
          </h1>
          <button
            type="button"
            onClick={submit}
            className="rounded-full bg-leaf px-4 py-1.5 text-sm font-medium text-white shadow-sm transition active:scale-95"
          >
            保存
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* 配图 */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-foreground/55">配图</p>
            {image ? (
              <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-3xl bg-[#EAECE9] shadow-sm">
                <img src={image} alt="食谱配图" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  aria-label="删除配图"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/60 text-white backdrop-blur-sm transition active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={imgBusy}
                className="mx-auto flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border/50 bg-surface-1/60 text-foreground/45 transition active:scale-[0.98] disabled:opacity-50"
              >
                {imgBusy ? (
                  <span className="text-xs">处理中…</span>
                ) : (
                  <>
                    <Camera className="h-7 w-7" />
                    <span className="text-xs">点击添加配图</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickMain(e.target.files?.[0])}
            />
          </div>

          {/* 名称 */}
          <Field label="食谱名称">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="比如：奶奶的红烧肉"
              maxLength={30}
              className="w-full rounded-xl border border-border/30 bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-leaf/50"
            />
          </Field>

          {/* 份量 + 烹饪时间 */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Field label="份量">
              <input
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                placeholder="1人份"
                maxLength={20}
                className="w-full rounded-xl border border-border/30 bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-leaf/50"
              />
            </Field>
            <Field label="烹饪时间">
              <input
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="约 15 分钟"
                maxLength={20}
                className="w-full rounded-xl border border-border/30 bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-leaf/50"
              />
            </Field>
          </div>

          {/* 难度 */}
          <Field label="难度">
            <div className="flex gap-2">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "flex-1 rounded-xl border py-2 text-sm transition active:scale-95",
                    difficulty === d
                      ? "border-leaf bg-leaf-soft/50 text-leaf"
                      : "border-border/30 bg-card text-foreground/55",
                  )}
                >
                  {"★".repeat(d)}{"☆".repeat(3 - d)}
                </button>
              ))}
            </div>
          </Field>

          {/* 食材清单 */}
          <Field label="需要准备的食材">
            <div className="rounded-xl border border-border/30 bg-card p-3">
              {ingredients.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded-full bg-leaf-soft/60 px-2.5 py-1 text-xs text-foreground/70"
                    >
                      {ing}
                      <button
                        type="button"
                        onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                        aria-label="删除"
                        className="text-foreground/40 hover:text-sakura"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const v = ingredientInput.trim()
                      if (v) {
                        setIngredients([...ingredients, v])
                        setIngredientInput("")
                      }
                    }
                  }}
                  placeholder="如：鸡蛋 2 个，回车添加"
                  maxLength={30}
                  className="flex-1 rounded-lg border border-border/20 bg-surface-1/60 px-2.5 py-2 text-sm text-foreground outline-none focus:border-leaf/50"
                />
                <button
                  type="button"
                  onClick={() => {
                    const v = ingredientInput.trim()
                    if (v) {
                      setIngredients([...ingredients, v])
                      setIngredientInput("")
                    }
                  }}
                  className="flex items-center justify-center rounded-lg bg-leaf-soft/60 px-3 text-leaf transition active:scale-95"
                  aria-label="添加食材"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Field>

          {/* 做法步骤 */}
          <Field label="怎么做">
            <div className="flex flex-col gap-3">
              {steps.map((s, i) => (
                <div key={i} className="rounded-xl border border-border/30 bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-leaf text-xs font-medium text-white">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (i === 0) return
                          setSteps((prev) => {
                            const next = [...prev]
                            ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                            return next
                          })
                        }}
                        disabled={i === 0}
                        aria-label="上移"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-1 text-foreground/55 transition active:scale-90 disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (i === steps.length - 1) return
                          setSteps((prev) => {
                            const next = [...prev]
                            ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
                            return next
                          })
                        }}
                        disabled={i === steps.length - 1}
                        aria-label="下移"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-1 text-foreground/55 transition active:scale-90 disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                          aria-label="删除步骤"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-sakura-soft/40 text-sakura transition active:scale-90"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={s.text}
                    onChange={(e) =>
                      setSteps(steps.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))
                    }
                    placeholder={`第 ${i + 1} 步怎么做`}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border/20 bg-surface-1/60 px-2.5 py-2 text-sm leading-relaxed text-foreground outline-none focus:border-leaf/50"
                  />
                  <div className="mt-2">
                    {s.image ? (
                      <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-[#EAECE9]">
                        <img src={s.image} alt={`步骤 ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setSteps(steps.map((x, j) => (j === i ? { ...x, image: undefined } : x)))
                          }
                          aria-label="删除步骤图"
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/60 text-white backdrop-blur-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => stepFileRefs.current[i]?.click()}
                        disabled={stepImgBusy === i}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-border/40 bg-surface-1/40 px-3 py-2 text-xs text-foreground/50 transition active:scale-95 disabled:opacity-50"
                      >
                        {stepImgBusy === i ? (
                          <span>处理中…</span>
                        ) : (
                          <>
                            <ImagePlus className="h-3.5 w-3.5" />
                            <span>步骤配图（可选）</span>
                          </>
                        )}
                      </button>
                    )}
                    <input
                      ref={(el) => {
                        stepFileRefs.current[i] = el
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickStep(i, e.target.files?.[0])}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSteps([...steps, { text: "" }])}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/40 bg-surface-1/40 py-2.5 text-sm text-foreground/55 transition active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                加一步
              </button>
            </div>
          </Field>

          {/* 营养数据（可选） */}
          <Field label="营养数据（可选，默认 0）">
            <div className="grid grid-cols-4 gap-2">
              <NutrientInput label="热量" suffix="kcal" value={kcal} onChange={setKcal} color="text-foreground" />
              <NutrientInput label="蛋白质" suffix="g" value={p} onChange={setP} color="text-sakura" />
              <NutrientInput label="脂肪" suffix="g" value={f} onChange={setF} color="text-sun" />
              <NutrientInput label="碳水" suffix="g" value={c} onChange={setC} color="text-sky" />
            </div>
          </Field>

          {/* 好处（可选） */}
          <Field label="吃了有什么好处（可选）">
            <div className="rounded-xl border border-border/30 bg-card p-3">
              {benefits.length > 0 && (
                <div className="mb-2 flex flex-col gap-1.5">
                  {benefits.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1.5 rounded-lg bg-leaf-soft/40 px-2.5 py-1.5 text-xs text-foreground/70"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-leaf" />
                      <span className="flex-1">{b}</span>
                      <button
                        type="button"
                        onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}
                        aria-label="删除"
                        className="text-foreground/40 hover:text-sakura"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const v = benefitInput.trim()
                      if (v) {
                        setBenefits([...benefits, v])
                        setBenefitInput("")
                      }
                    }
                  }}
                  placeholder="如：补充蛋白质，回车添加"
                  maxLength={50}
                  className="flex-1 rounded-lg border border-border/20 bg-surface-1/60 px-2.5 py-2 text-sm text-foreground outline-none focus:border-leaf/50"
                />
                <button
                  type="button"
                  onClick={() => {
                    const v = benefitInput.trim()
                    if (v) {
                      setBenefits([...benefits, v])
                      setBenefitInput("")
                    }
                  }}
                  className="flex items-center justify-center rounded-lg bg-leaf-soft/60 px-3 text-leaf transition active:scale-95"
                  aria-label="添加好处"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Field>
        </div>

        {/* 错误提示 */}
        <AnimatePresence>
          {err && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-4 mb-3 rounded-xl bg-sakura-soft/60 px-3 py-2 text-center text-xs text-sakura"
            >
              {err}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-border/20 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-xl bg-leaf py-3 text-sm font-medium text-white shadow-sm transition active:scale-95"
          >
            保存这道食谱
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-medium text-foreground/55">{label}</p>
      {children}
    </div>
  )
}

function NutrientInput({
  label,
  suffix,
  value,
  onChange,
  color,
}: {
  label: string
  suffix: string
  value: string
  onChange: (v: string) => void
  color: string
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-card px-2 py-2 text-center">
      <p className="mb-1 text-[10px] text-foreground/45">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        inputMode="decimal"
        className="w-full bg-transparent text-center text-sm font-semibold outline-none"
      />
      <p className={cn("text-[10px]", color)}>{suffix}</p>
    </div>
  )
}
