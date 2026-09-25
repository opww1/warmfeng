"use client"

import * as React from "react"
import { COMMON_FOODS } from "@/lib/common-foods"

export type FoodCategory =
  | "staple" // 主食
  | "protein" // 蛋白质
  | "veg" // 蔬菜
  | "fruit" // 水果
  | "snack" // 加餐零食
  | "drink" // 饮品
  | "soy_egg" // 豆制品蛋奶
  | "nut" // 坚果种子
  | "soup" // 汤羹

/** 各食物分类的卡通代表图（public 下）；蛋白类统一用盘装牛排代表图
 * 新三类（soy_egg/nut/soup）暂不做图，留空串由 FoodThumb 走 emoji 兜底 */
export const CAT_IMAGE: Record<FoodCategory, string> = {
  staple: "/food/cat-staple.webp",
  protein: "/food/meat-steak.webp",
  veg: "/food/cat-veg.webp",
  fruit: "/food/cat-fruit.webp",
  snack: "/food/cat-snack.webp",
  drink: "/food/cat-drink.webp",
  soy_egg: "",
  nut: "",
  soup: "",
}

export interface FoodEntry {
  id: string
  name: string
  emoji?: string
  category: FoodCategory
  portion: string // 例如 "1碗 / 50g"
  kcal: number
  p: number // 蛋白质 g
  f: number // 脂肪 g
  c: number // 碳水 g
  source: "user" | "recommended"
  isRecipe?: boolean // 套餐 = 多食物组合
  items?: FoodEntry[] // 套餐包含的子食物
  group?: string // 推荐分组键
  image?: string // 卡通图路径（public 下，如 /food/xxx.webp）
  scene?: string // 场景键：breakfast/lunch/dinner/grow/light（我的食物 & 推荐共用）
  /** 做法步骤：每步含通俗文字 + 可选步骤小图 */
  steps?: RecipeStep[] // 套餐做法步骤
  /** 做这道菜的总用时（如「约 10 分钟」） */
  cookTime?: string
  /** 难度（1-3 颗星，数字越大越难） */
  difficulty?: number
  /** 食材清单（普通人看得懂的份量描述） */
  ingredients?: string[]
  fiber?: number // 膳食纤维 g
  vitC?: number // 维生素C mg
  calcium?: number // 钙 mg
  iron?: number // 铁 mg
  benefits?: string[] // 有助于什么（一句一好处，例如"补充膳食纤维，帮肠道动起来"）
  /** 标记为组合菜拆分估算（不含油盐），UI 需提示用户 */
  estimated?: boolean
  /** 菜谱页分类标签（如 ["homestyle","highprotein"]） */
  recipeCat?: string[]
  /** 条码（来自 Open Food Facts 扫码，用于本地缓存命中与去重） */
  barcode?: string
  /** 1-3 道中文家常菜名，点击跳转外部搜索做法（不写具体步骤） */
  pairings?: string[]
}

/** 做法步骤：通俗文字 + 可选步骤小图 */
export interface RecipeStep {
  text: string
  image?: string // 步骤小图路径（public 下，如 /food/step-xxx.webp）
}

/** 推荐分组（静态预置清单） */
export const REC_GROUP_ORDER: { key: string; label: string }[] = [
  { key: "breakfast", label: "元气早餐" },
  { key: "lunch", label: "轻盈午餐" },
  { key: "dinner", label: "暖心晚餐" },
  { key: "grow", label: "长身体加餐" },
  { key: "light", label: "控糖轻食" },
]

const f = (
  id: string,
  name: string,
  emoji: string,
  category: FoodCategory,
  portion: string,
  kcal: number,
  p: number,
  fv: number,
  c: number,
  group: string,
): FoodEntry => ({ id, name, emoji, category, portion, kcal, p, f: fv, c, source: "recommended", group })

/** 暖枫推荐（开发者预置，所有人一致，可随时扩充） */
export const RECOMMENDED: FoodEntry[] = [
  // —— 元气早餐 ——
  {
    id: "rec-millet-egg",
    name: "小米粥配蛋",
    emoji: "🥣",
    category: "staple",
    portion: "1 份",
    kcal: 265,
    p: 11,
    f: 6,
    c: 41,
    source: "recommended",
    isRecipe: true,
    group: "breakfast",
    scene: "breakfast",
    image: "/food/millet-egg.webp",
    fiber: 3,
    vitC: 4,
    calcium: 60,
    iron: 1.6,
    benefits: ["小米温和养胃，早上吃身子暖暖的", "鸡蛋补优质蛋白，长力气长身体"],
    cookTime: "约 40 分钟",
    difficulty: 1,
    ingredients: ["小米 30g（约一小把，手心摊开一捧量）", "鸡蛋 1~2 个", "清水 约 400ml（2 小碗，米水比例约 1:13）", "盐 1g（约半小勺，可选）"],
    steps: [
      { text: "小米放碗里加清水，用手轻轻转几圈、淘洗 1~2 遍倒掉浑水（⚠️ 别用力搓，小米皮薄容易碎）。鸡蛋外壳洗净，避免上锅蒸时脏东西沾到蛋。", image: "/food/step-millet-porridge-egg-1.webp" },
      { text: "电饭锅内胆加约 400ml 清水，倒入小米轻轻搅匀（⚠️ 先搅匀米才不会沉底糊锅）；把鸡蛋放进自带的蒸屉（篦子），盖盖按下煮粥键。⚠️ 水别超过内胆最高水位线，沸腾会溢出来。", image: "/food/step-millet-porridge-egg-2.webp" },
      { text: "煮好跳闸后焖 5 分钟再开盖，小米粥更稠更香。盛进碗里，喜淡口可加 1g 盐；鸡蛋剥壳配着吃。⚠️ 刚出锅的鸡蛋很烫，剥前先放凉水里浸 1 分钟好剥、不烫手。", image: "/food/step-millet-porridge-egg-3.webp" },
    ],
    items: [
      f("rec-me-1", "小米粥", "🥣", "staple", "1碗 / 50g", 180, 4.5, 1, 37, "breakfast"),
      f("rec-me-2", "水煮蛋", "🥚", "protein", "1个", 70, 6, 5, 1, "breakfast"),
      f("rec-me-3", "凉拌黄瓜", "🥒", "veg", "1份 / 100g", 15, 0.8, 0, 3, "breakfast"),
    ],
  },
  {
    id: "rec-eggs-toast",
    name: "全麦吐司配花生酱",
    emoji: "🍞",
    category: "staple",
    portion: "1片+1勺",
    kcal: 175,
    p: 7,
    f: 9,
    c: 18,
    source: "recommended",
    group: "breakfast",
    scene: "breakfast",
    image: "/food/toast-pb.webp",
    fiber: 4,
    vitC: 0,
    calcium: 40,
    iron: 1.2,
    benefits: ["全麦吐司有膳食纤维，扛饿又顺肠", "花生酱补健康脂肪，香香的小能量"],
    steps: [],
  },
  {
    id: "rec-soy-tea-egg",
    name: "豆浆配茶叶蛋",
    emoji: "🥛",
    category: "drink",
    portion: "1 杯+1个",
    kcal: 150,
    p: 14,
    f: 9,
    c: 7,
    source: "recommended",
    isRecipe: true,
    group: "breakfast",
    scene: "breakfast",
    image: "/food/soy-tea-egg.webp",
    fiber: 1,
    vitC: 0,
    calcium: 90,
    iron: 2.2,
    benefits: ["无糖豆浆补钙又补蛋白，骨头长得结实", "茶叶蛋补铁，红润有精神"],
    steps: [],
    items: [
      f("rec-ste-1", "无糖豆浆", "🥛", "drink", "1杯 / 250ml", 80, 8, 4, 6, "breakfast"),
      f("rec-ste-2", "茶叶蛋", "🥚", "protein", "1个", 70, 6, 5, 1, "breakfast"),
    ],
  },

  // —— 轻盈午餐 ——
  {
    id: "rec-chicken-bowl",
    name: "鸡胸西兰花糙米",
    emoji: "🍗",
    category: "protein",
    portion: "1 份",
    kcal: 422,
    p: 32,
    f: 13.5,
    c: 40,
    source: "recommended",
    isRecipe: true,
    group: "lunch",
    scene: "lunch",
    image: "/food/chicken-bowl.webp",
    fiber: 5,
    vitC: 45,
    calcium: 35,
    iron: 1.8,
    benefits: ["鸡胸肉高蛋白低脂肪，长肌肉不长肉肉", "西兰花维C满满，帮身体抗氧化", "糙米膳食纤维多，下午不犯困"],
    ingredients: [
      "糙米 50g（约一小把生重）— 想更软糯也可用白米饭 1 碗，但白米饭碳水更高、没糙米扛饿",
      "鸡胸肉 100g",
      "西兰花 1 小朵（约 100g）",
      "橄榄油 10ml（约 2 小勺）",
      "盐 2g（约 1 小勺）",
      "黑胡椒 少许（约 1g，可选）",
    ],
    steps: [
      { text: "糙米抓一小把（约 50g），提前用清水泡 30 分钟（⚠️ 糙米外壳硬，不泡容易夹生）。泡好倒入电饭煲，米和水的比例约 1:1.3（水刚没过米约一个指节），按下煮饭键煮成饭，不是煮粥别放太多水。赶时间直接用白米饭代替也行。", image: "/food/step-chicken-bowl-1.webp" },
      { text: "鸡胸肉切条或薄片，加 1g 盐、黑胡椒抓匀腌 10 分钟（腌过更入味）。平底锅倒 5ml 油，小火把两面各煎 2~3 分钟到全白。⚠️ 用筷子戳进去没有粉红色、汁水变清就熟；中间还粉红就要再煎，否则吃了不安全。", image: "/food/step-chicken-bowl-2.webp" },
      { text: "西兰花掰小朵，开水下锅焯 1 分钟立刻捞出浸凉水，保持脆绿（⚠️ 焯久发黄变软）。", image: "/food/step-chicken-bowl-3.webp" },
      { text: "锅里放剩 5ml 橄榄油，小火把西兰花轻轻翻炒几下，加 1g 盐翻匀。和鸡胸块、糙米饭一起装盘开吃。", image: "/food/step-chicken-bowl-4.webp" },
    ],
    items: [
      f("rec-cb-1", "糙米饭", "🍚", "staple", "1碗 / 150g", 165, 4, 1, 32, "lunch"),
      f("rec-cb-2", "香煎鸡胸", "🍗", "protein", "100g", 132, 25, 2, 0, "lunch"),
      f("rec-cb-3", "清炒西兰花", "🥦", "veg", "1份 / 100g", 35, 3, 0.5, 5, "lunch"),
      f("rec-cb-4", "橄榄油", "🫒", "snack", "1勺 / 10g", 90, 0, 10, 0, "lunch"),
    ],
  },
  {
    id: "rec-tomato-egg",
    name: "番茄炒蛋",
    emoji: "🍅",
    category: "veg",
    portion: "1盘 / 200g",
    kcal: 330,
    p: 15,
    f: 22,
    c: 12,
    source: "recommended",
    group: "lunch",
    scene: "lunch",
    image: "/food/tomato-egg.webp",
    fiber: 2,
    vitC: 20,
    calcium: 50,
    iron: 1.4,
    benefits: ["番茄维C丰富，皮肤亮亮的有光泽", "鸡蛋补蛋白，脑子转得更快"],
    cookTime: "约 10 分钟",
    difficulty: 1,
    ingredients: ["番茄 2 个（约 200g，选红软的更出汁）", "鸡蛋 2 个", "盐 2g（约 1 小勺，分两次用）", "糖 4g（约 1 小勺，提鲜去酸）", "油 15ml（约 3 小勺，分两次用）"],
    steps: [
      { text: "番茄顶上划十字，放碗里浇开水烫 1 分钟，皮起皱撕掉（⚠️ 去皮口感细，不去也行），去蒂切小块，块越小越出汁。鸡蛋加 1g 盐顺一个方向打散到起小泡。", image: "/food/step-tomato-egg-1.webp" },
      { text: "锅烧热倒 8ml 油，油稍热倒蛋液，等底部凝固用铲子划成大块盛出。⚠️ 蛋一凝固就盛，炒老发柴。", image: "/food/step-tomato-egg-2.webp" },
      { text: "锅里补 7ml 油，下番茄中火翻炒，用铲子轻压出红汁，炒到番茄变软成糊、汤汁变多，加 4g 糖提鲜去酸。", image: "/food/step-tomato-egg-3.webp" },
      { text: "鸡蛋回锅，加剩 1g 盐翻匀约 30 秒出锅。⚠️ 翻匀就出锅别久炒，蛋会老。拌饭拌面都香。", image: "/food/step-tomato-egg-4.webp" },
    ],
  },
  {
    id: "rec-tomato-beef-noodle",
    name: "番茄牛肉面",
    emoji: "🍜",
    category: "staple",
    portion: "1碗",
    kcal: 350,
    p: 19,
    f: 10,
    c: 44,
    source: "recommended",
    group: "lunch",
    scene: "lunch",
    image: "/food/tomato-beef-noodle.webp",
    fiber: 3,
    vitC: 15,
    calcium: 30,
    iron: 2.6,
    benefits: ["牛肉补铁补蛋白，走路带风有劲", "番茄酸甜开胃，吃饭更香"],
    cookTime: "约 25 分钟",
    difficulty: 2,
    ingredients: ["番茄 2 个（约 200g）", "牛肉 100g（牛里脊最嫩）", "面条 1 人份（约 80g 干面）", "青菜 几片（约 50g）", "生抽 2 勺（约 20ml）", "淀粉 3g（约 1 小勺）", "盐 2g（约 1 小勺）", "油 10ml（约 2 小勺）", "葱 1 根（可选）"],
    steps: [
      { text: "牛肉切薄片（⚠️ 先冻 20 分钟稍硬更好切），加 1 勺生抽、3g 淀粉和少许水抓到黏手，腌 10 分钟（上浆锁水，肉嫩不柴）。番茄切块；青菜洗净；葱切末。", image: "/food/step-tomato-beef-noodle-1.webp" },
      { text: "锅烧热倒 10ml 油，下番茄块中火翻炒 3~5 分钟，用铲子压出红汁，炒到番茄变软成糊、汤色红亮（这是汤底酸甜味来源）。", image: "/food/step-tomato-beef-noodle-2.webp" },
      { text: "加约 250ml 清水，中火煮开。放腌好的牛肉片，用筷子拨散，煮 2~3 分钟到肉片变灰白、无粉红色（⚠️ 牛肉一定要全熟，中间粉红别吃）。放青菜煮软，加 2g 盐和剩 1 勺生抽调味。⚠️ 汤开转小火，别烧干。", image: "/food/step-tomato-beef-noodle-3.webp" },
      { text: "另起一锅水大火煮开，下面条按包装时间煮 3~5 分钟到没有白芯，捞出沥干。⚠️ 白芯就是面条中间硬心，没熟透不好消化。把面捞进碗，浇上番茄牛肉汤、撒葱末开吃。", image: "/food/step-tomato-beef-noodle-4.webp" },
    ],
  },

  // —— 暖心晚餐 ——
  {
    id: "rec-fish-dinner",
    name: "清蒸鱼时蔬",
    emoji: "🐟",
    category: "protein",
    portion: "1 份",
    kcal: 310,
    p: 26,
    f: 4,
    c: 39,
    source: "recommended",
    isRecipe: true,
    group: "dinner",
    scene: "dinner",
    image: "/food/fish-dinner.webp",
    fiber: 3,
    vitC: 30,
    calcium: 90,
    iron: 1.5,
    benefits: ["清蒸鱼好消化又补蛋白，晚上身子轻", "青菜补膳食纤维和维C，肠道舒服睡得香"],
    cookTime: "约 25 分钟",
    difficulty: 1,
    ingredients: ["小鱼 1 条（约 100g，鲈鱼/黄花鱼等刺少的）", "大米 50g（小半碗）", "青菜 100g", "姜丝 少许", "葱丝 少许", "蒸鱼豉油 10ml（约 1 勺）", "盐 2g（约 1 小勺）", "油 5ml（约 1 小勺）"],
    steps: [
      { text: "鱼处理干净（去鳞去鳃去内脏、腹内黑膜刮掉，黑膜是腥味来源）。表面和腹腔抹 2g 盐、铺几根姜丝，腌 5 分钟去腥；大米淘好；青菜洗净沥干。", image: "/food/step-fish-dinner-1.webp" },
      { text: "电饭锅加水放大米按煮饭键；鱼放在蒸屉（篦子）上，盖盖一起蒸，饭熟鱼也熟（约 20~25 分钟）。⚠️ 蒸鱼前确认盘子耐蒸：蒸鱼盘或浅不锈钢盘最稳；没有就普通瓷盘垫张蒸笼纸再放鱼，或鱼直接摆蒸屉上蒸熟夹到碗里。带金边、有裂纹、标不可进蒸箱的盘子别用，受热易裂；冰盘子先用温水过一下。", image: "/food/step-fish-dinner-2.webp" },
      { text: "另起炒锅倒 5ml 油大火烧热，放青菜快速翻炒 1~2 分钟到变翠绿、稍软，盛出。⚠️ 大火快炒保脆绿，久炒出水发黄。", image: "/food/step-fish-dinner-3.webp" },
      { text: "鱼出锅，拣掉蒸出的腥水（盘底那层浑水倒掉更清爽），淋 10ml 蒸鱼豉油、撒葱丝。⚠️ 豉油沿盘边淋，别直接浇在鱼肉上冲淡鲜味。配米饭和青菜一起吃。", image: "/food/step-fish-dinner-4.webp" },
    ],
    items: [
      f("rec-fd-1", "清蒸鱼", "🐟", "protein", "100g", 120, 20, 4, 0, "dinner"),
      f("rec-fd-2", "米饭", "🍚", "staple", "1碗 / 150g", 165, 4, 1, 35, "dinner"),
      f("rec-fd-3", "炒青菜", "🥬", "veg", "1份 / 100g", 25, 2, 0, 4, "dinner"),
    ],
  },
  {
    id: "rec-tofu-noodle",
    name: "豆腐菌菇汤面",
    emoji: "🍜",
    category: "staple",
    portion: "1碗",
    kcal: 340,
    p: 16,
    f: 10,
    c: 46,
    source: "recommended",
    group: "dinner",
    scene: "dinner",
    image: "/food/tofu-noodle.webp",
    fiber: 3,
    vitC: 3,
    calcium: 120,
    iron: 2,
    benefits: ["豆腐补钙补蛋白，骨头悄悄变结实", "菌菇膳食纤维多，帮肚子更轻松"],
    cookTime: "约 20 分钟",
    difficulty: 1,
    ingredients: ["嫩豆腐 半块（约 100g）", "菌菇 80g（香菇/金针菇/平菇均可）", "面条 1 人份（约 50g 干面）", "小葱 1 根", "油 5ml（约 1 小勺）", "盐 2g（约 1 小勺）", "生抽 5ml（约半勺，可选提鲜）"],
    steps: [
      { text: "嫩豆腐切约 2cm 小块（⚠️ 刀轻、手轻，嫩豆腐一压就碎）。菌菇洗净，香菇切片、金针菇切去根部撕小撮；葱切小段。", image: "/food/step-tofu-mushroom-noodle-1.webp" },
      { text: "锅加 5ml 油中火烧热，放菌菇翻炒 2~3 分钟到变软出香；加约 500ml 清水和豆腐块，大火煮开转小火煮 3~5 分钟，汤微微变白。⚠️ 豆腐嫩，用锅铲背面轻推，别使劲搅。", image: "/food/step-tofu-mushroom-noodle-2.webp" },
      { text: "汤里直接放面条，小火煮 3~5 分钟，筷子拨散防粘。夹起面条无白芯、变软就关火。⚠️ 汤易扑锅，火别大、盖留缝。", image: "/food/step-tofu-mushroom-noodle-3.webp" },
      { text: "尝味加 2g 盐和 5ml 生抽，撒葱段开吃。⚠️ 汤面趁热吃，放久面会胀坨。", image: "/food/step-tofu-mushroom-noodle-4.webp" },
    ],
  },

  // —— 长身体加餐（未成年友好） ——
  {
    id: "rec-milk-walnut",
    name: "牛奶配核桃",
    emoji: "🥛",
    category: "drink",
    portion: "1 杯+2颗",
    kcal: 215,
    p: 9.5,
    f: 14,
    c: 13.5,
    source: "recommended",
    isRecipe: true,
    group: "grow",
    scene: "grow",
    image: "/food/milk-walnut.webp",
    fiber: 1,
    vitC: 2,
    calcium: 280,
    iron: 0.8,
    benefits: ["牛奶补钙，长高高少不了它", "核桃补好脂肪，脑子灵光记性好"],
    cookTime: "约 1 分钟",
    difficulty: 1,
    ingredients: ["全脂牛奶 1 杯（250ml）", "核桃 2 颗"],
    steps: [
      { text: "核桃捏开壳取出果仁，嫌涩可以用温水泡 1 分钟。", image: "/food/step-milk-walnut-1.webp" },
      { text: "牛奶倒进杯子，微波炉叮 30 秒到温热（不烫嘴就行，别煮沸）。", image: "/food/step-milk-walnut-2.webp" },
      { text: "核桃仁放牛奶杯旁边，一口奶一口核桃，当加餐吃。", image: "/food/step-milk-walnut-3.webp" },
    ],
    items: [
      f("rec-mw-1", "全脂牛奶", "🥛", "drink", "1杯 / 250ml", 150, 8, 8, 12, "grow"),
      f("rec-mw-2", "核桃", "🌰", "snack", "2颗 / 10g", 65, 1.5, 6, 1.5, "grow"),
    ],
  },
  {
    id: "rec-banana-yogurt",
    name: "香蕉配酸奶",
    emoji: "🍌",
    category: "fruit",
    portion: "1根+1杯",
    kcal: 175,
    p: 5.3,
    f: 2.4,
    c: 35,
    source: "recommended",
    group: "grow",
    scene: "grow",
    image: "/food/banana-yogurt.webp",
    fiber: 3,
    vitC: 10,
    calcium: 120,
    iron: 0.4,
    benefits: ["香蕉补钾，运动后腿不抽筋", "酸奶有钙又有好菌，肚子舒服消化好"],
    cookTime: "约 2 分钟",
    difficulty: 1,
    ingredients: ["香蕉 1 根", "原味酸奶 1 杯（约 100g）"],
    steps: [
      { text: "香蕉去皮切厚片（约 1cm），嫌麻烦直接掰小块也行。", image: "/food/step-banana-yogurt-1.webp" },
      { text: "酸奶舀进碗里，把香蕉片铺在上面。", image: "/food/step-banana-yogurt-2.webp" },
      { text: "喜欢凉一点放冰箱 5 分钟，或者直接开吃，当加餐刚刚好。", image: "/food/step-banana-yogurt-3.webp" },
    ],
  },

  // —— 新增：快手菜 / 低卡 / 下饭 / 素食 / 汤羹 / 亲子 / 肉类（纯文字教程，无步骤图）——
  {
    id: "rec-steamed-egg",
    name: "蒸蛋羹",
    emoji: "🥚",
    category: "protein",
    portion: "1碗",
    kcal: 90, p: 9, f: 5, c: 2,
    source: "recommended",
    group: "",
    scene: "quick",
    image: "/food/cover-zhengdangeng.webp",
    fiber: 0, vitC: 0, calcium: 40, iron: 1.2,
    benefits: ["嫩滑好消化的蛋", "老人小孩都合适"],
    cookTime: "约 12 分钟",
    difficulty: 1,
    ingredients: ["鸡蛋 2 个", "温水 约 200ml（蛋液 1.5 倍，约 40°C 手摸不烫）", "盐 1g（约半小勺）", "生抽 5ml（约半勺）", "香油 几滴（约 2ml）", "葱花 少许"],
    steps: [
      { text: "鸡蛋磕碗里加 1g 盐，打散到均匀。慢慢倒入约 200ml 温水搅匀。⚠️ 用温水（不烫手约 40°C）、别用开水，开水一冲就成蛋花汤；也别用冷水，蒸出来腥。" },
      { text: "蛋液过一遍筛（或撇掉表面浮沫），倒进蒸碗。碗口盖一层保鲜膜（扎两三个小孔）或扣个盘子，挡住蒸锅里滴下的水汽，不然表面会坑坑洼洼。", },
      { text: "锅里水烧开，碗放上蒸架，中火蒸 8~10 分钟，关火再焖 2 分钟。⚠️ 火太大或时间太久会起蜂窝、变老；蒸到中间还微微晃、像布丁就是刚好。", },
      { text: "出锅淋 5ml 生抽、几滴香油、撒葱花。嫩滑颤颤的最好吃。", },
    ],
  },
  {
    id: "rec-onion-egg",
    name: "洋葱炒蛋",
    emoji: "🍳",
    category: "veg",
    portion: "1盘",
    kcal: 130, p: 7, f: 9, c: 6,
    source: "recommended",
    group: "",
    scene: "quick",
    image: "/food/cover-xianggu-qingcai.webp",
    fiber: 1.2, vitC: 10, calcium: 40, iron: 1.2,
    benefits: ["洋葱炒蛋快手嫩滑", "孩子也爱吃的下饭蛋"],
    cookTime: "约 8 分钟",
    difficulty: 1,
    ingredients: ["洋葱 半个（约 100g）", "鸡蛋 2 个", "盐 2g（约 1 小勺，分两次用）", "油 15ml（约 3 小勺，分两次用）"],
    steps: [
      { text: "洋葱对半切开、剥皮切细丝（切前把刀沾点水、或冷藏 10 分钟能少熏眼睛）。鸡蛋加 1g 盐顺一个方向打散到起小泡。", },
      { text: "锅烧热倒 8ml 油，油稍热倒蛋液，等底部凝固用铲子划成大块盛出。⚠️ 蛋一凝固就盛，炒老发柴。", },
      { text: "锅里补 7ml 油，下洋葱丝中火炒 2~3 分钟，到变透明、边缘微焦、闻着发甜。⚠️ 炒透才甜，半生有辛辣味。", },
      { text: "鸡蛋回锅，加剩 1g 盐大火翻匀约 30 秒出锅。洋葱甜、鸡蛋嫩，配粥配饭都行。", },
    ],
  },
  {
    id: "rec-baizhuo-xia",
    name: "白灼虾配西兰花",
    emoji: "🦐",
    category: "protein",
    portion: "1盘",
    kcal: 110, p: 20, f: 2, c: 4,
    source: "recommended",
    group: "",
    scene: "lowcal",
    image: "/food/cover-baizhuoxia.webp",
    fiber: 2, vitC: 50, calcium: 60, iron: 1.5,
    benefits: ["虾高蛋白低脂肪", "配西兰花维C翻倍"],
    cookTime: "约 12 分钟",
    difficulty: 1,
    ingredients: ["鲜虾 200g（约 10~12 只）", "西兰花 半棵（约 150g）", "姜 2 片", "生抽 10ml（约 1 勺）", "盐 2g（约 1 小勺）", "油 几滴（约 2ml，焯菜保绿用）"],
    steps: [
      { text: "虾剪去虾须虾枪（⚠️ 虾枪尖容易扎嘴），用牙签从虾背第二节挑出虾线，洗净。西兰花掰小朵淡盐水泡 5 分钟；姜切丝。", },
      { text: "烧开水加 2g 盐和几滴油（保色）。先下西兰花焯 1 分钟捞出浸凉水；再下虾和姜丝煮到虾身变红、蜷曲成球（约 2 分钟）立刻捞出。⚠️ 虾一红就捞，煮久肉紧缩变老、壳难剥。", },
      { text: "虾去壳、和西兰花摆盘，蘸生抽吃。⚠️ 虾肉张开、壳肉分离就是熟透；若还透明就是没熟，要回锅再煮。鲜甜不腻、热量很低。", },
    ],
  },
  {
    id: "rec-suanla-tudousi",
    name: "酸辣土豆丝",
    emoji: "🥔",
    category: "veg",
    portion: "1盘",
    kcal: 110, p: 2.2, f: 5, c: 14,
    source: "recommended",
    group: "",
    scene: "ricekiller",
    image: "/food/cover-suanla-tudousi.webp",
    fiber: 1.2, vitC: 18, calcium: 12, iron: 0.5,
    benefits: ["脆爽酸辣下饭王", "土豆当主食也能顶饱"],
    cookTime: "约 12 分钟",
    difficulty: 1,
    ingredients: ["土豆 2 个（约 300g）", "干辣椒 3~4 个（怕辣减到 2 个）", "蒜 2 瓣", "醋 15ml（约 1.5 勺，陈醋香）", "盐 2g（约 1 小勺）", "油 15ml（约 3 小勺）", "葱 少许（可选）"],
    steps: [
      { text: "土豆去皮先切薄片、再切细丝（越细越脆）。⚠️ 切好立刻泡水洗 2~3 遍，洗掉表面淀粉，炒出来才脆不粘；沥干水分再下锅，不然会出水变软。干辣椒剪段去籽减辣；蒜切碎。", },
      { text: "锅烧热倒 15ml 油，下干辣椒和蒜末小火炒香（⚠️ 小火，辣椒一糊就苦）。", },
      { text: "下土豆丝大火快炒 2 分钟，炒到丝变透明、边缘微焦仍带脆。⚠️ 全程大火快炒保持脆感。", },
      { text: "沿锅边淋 15ml 醋（⚠️ 沿锅边淋，醋遇热激出香味），加 2g 盐翻匀约 30 秒出锅，可撒葱花。脆脆酸辣最开胃。", },
    ],
  },
  {
    id: "rec-disanxian",
    name: "地三鲜",
    emoji: "🍆",
    category: "veg",
    portion: "1盘",
    kcal: 450, p: 5.5, f: 28, c: 40,
    source: "recommended",
    group: "",
    scene: "ricekiller",
    image: "/food/cover-disanxian.webp",
    fiber: 3, vitC: 30, calcium: 30, iron: 1.2,
    benefits: ["土豆茄子青椒三鲜", "少油版同样下饭"],
    cookTime: "约 20 分钟",
    difficulty: 2,
    ingredients: ["土豆 1 个（约 150g）", "茄子 1 根（约 150g）", "青椒 1 个（约 80g）", "蒜 2 瓣", "生抽 20ml（约 2 勺）", "糖 4g（约 1 小勺）", "盐 2g（约 1 小勺）", "淀粉 3g（约 1 小勺，调汁用）", "油 30ml（约 6 小勺，分次用）"],
    steps: [
      { text: "土豆、茄子、青椒都切滚刀块（不规则块易入味）；蒜切碎。土豆茄子各撒 1g 盐抓匀腌 5 分钟挤掉水（⚠️ 挤水能少吸油、茄子不发黑）。", },
      { text: "调碗汁：2 勺水 + 20ml 生抽 + 4g 糖 + 3g 淀粉搅匀。", },
      { text: "锅烧热倒 15ml 油，下土豆块中小火煎到四面微黄盛出；补 15ml 油下茄子煎到变软、边缘金黄盛出。⚠️ 茄子吸油，油稍多才软糯；也可少油干煸。", },
      { text: "锅里留底油下蒜末、青椒块中火炒到青椒起虎皮（约 1 分钟）。", },
      { text: "土豆茄子回锅，淋碗汁大火翻匀到汤汁变稠裹住食材（约 1 分钟），关火。咸鲜微甜、软糯下饭。", },
    ],
  },
  {
    id: "rec-xianggu-youcai",
    name: "香菇油菜",
    emoji: "🥬",
    category: "veg",
    portion: "1盘",
    kcal: 65, p: 3.5, f: 4, c: 6,
    source: "recommended",
    group: "",
    scene: "light",
    image: "/food/cover-xianggu-qingcai.webp",
    fiber: 2.5, vitC: 30, calcium: 90, iron: 1.5,
    benefits: ["菌菇青菜清炒", "低卡清爽常吃的素菜"],
    cookTime: "约 8 分钟",
    difficulty: 1,
    ingredients: ["油菜 或 青菜 1 把（约 200g）", "鲜香菇 5 朵（约 100g）", "蒜 2 瓣", "生抽 10ml（约 1 勺）", "盐 2g（约 1 小勺）", "油 10ml（约 2 小勺）"],
    steps: [
      { text: "油菜一片片掰开洗净，菜梗菜叶分开；鲜香菇去蒂切薄片；蒜切碎。", },
      { text: "锅烧热倒 10ml 油，下蒜末和香菇片中火炒 1 分钟到香菇变软、香味出来（⚠️ 先炒干水汽才香）。", },
      { text: "先下菜梗大火炒 30 秒，再下菜叶加 10ml 生抽和 2g 盐快速翻匀。⚠️ 菜梗比叶厚，先炒梗叶才同时熟。", },
      { text: "炒到菜叶塌软、还带脆（约 1 分钟）立刻出锅。⚠️ 别炒久，出水发黄不脆甜。", },
    ],
  },
  {
    id: "rec-fanqie-doufu-tang",
    name: "番茄豆腐汤",
    emoji: "🍲",
    category: "veg",
    portion: "1碗",
    kcal: 70, p: 6, f: 3.5, c: 4,
    source: "recommended",
    group: "",
    scene: "soup",
    image: "/food/cover-fanqie-doufu-tang.webp",
    fiber: 1, vitC: 15, calcium: 120, iron: 1.5,
    benefits: ["番茄豆腐暖胃汤", "低卡又补钙"],
    cookTime: "约 10 分钟",
    difficulty: 1,
    ingredients: ["番茄 1 个（约 150g）", "嫩豆腐 半盒（约 150g）", "鸡蛋 1 个（可选）", "葱花 少许", "盐 2g（约 1 小勺）", "糖 2g（约半小勺，提鲜）", "油 5ml（约 1 小勺）"],
    steps: [
      { text: "番茄顶上划十字开水烫 1 分钟去皮切小块；嫩豆腐切约 2cm 块（轻切）；鸡蛋打散（可选）。", },
      { text: "锅烧热倒 5ml 油，下番茄中火炒 2~3 分钟，压出红汁、炒软成糊。加约 250ml 清水烧开。⚠️ 番茄炒出汁汤才红亮酸甜。", },
      { text: "下豆腐块小火煮 3 分钟入味（⚠️ 用铲背轻推别搅碎）。加 2g 盐和 2g 糖。", },
      { text: "淋蛋液边倒边用筷子轻搅成蛋花，关火撒葱花。⚠️ 蛋液细流淋入、别一股倒，蛋花才漂亮。酸甜暖胃。", },
    ],
  },
  {
    id: "rec-zicai-danhua-tang",
    name: "紫菜蛋花汤",
    emoji: "🥣",
    category: "veg",
    portion: "1碗",
    kcal: 45, p: 4, f: 2, c: 3,
    source: "recommended",
    group: "",
    scene: "soup",
    image: "/food/cover-fanqie-doufu-tang.webp",
    fiber: 1, vitC: 2, calcium: 60, iron: 2,
    benefits: ["紫菜补碘蛋花补蛋白", "五分钟搞定的快手汤"],
    cookTime: "约 6 分钟",
    difficulty: 1,
    ingredients: ["紫菜 2g（约 1 小撮，干紫菜）", "鸡蛋 1 个", "葱花 少许", "盐 2g（约 1 小勺）", "香油 2ml（约几滴）", "生抽 5ml（约半勺，可选提鲜）"],
    steps: [
      { text: "鸡蛋打散成蛋液；紫菜撕小片放汤碗里（⚠️ 紫菜免洗型直接放，若是散装多泡洗一下去沙）。", },
      { text: "锅里加约 300ml 水大火烧开，转中火，蛋液细流淋入、用筷子边倒边轻搅成蛋花（⚠️ 细流淋入蛋花才细碎漂亮）。加 2g 盐和 5ml 生抽关火。", },
      { text: "把汤冲进放紫菜的碗里（热气一激紫菜就软），滴香油、撒葱花。⚠️ 紫菜别下锅久煮，会烂掉没口感。鲜得眉毛掉。", },
    ],
  },
  {
    id: "rec-jidan-bing",
    name: "鸡蛋饼",
    emoji: "🥞",
    category: "staple",
    portion: "1张",
    kcal: 180, p: 8, f: 9, c: 18,
    source: "recommended",
    group: "",
    scene: "kids",
    image: "/food/cover-jidabing.webp",
    fiber: 1, vitC: 2, calcium: 40, iron: 1.5,
    benefits: ["鸡蛋面粉摊一张", "孩子早餐快手管饱"],
    cookTime: "约 10 分钟",
    difficulty: 1,
    ingredients: ["鸡蛋 2 个", "面粉 30g（约 3 平勺）", "水 50ml（约 3 勺）", "盐 1g（约半小勺）", "葱花 少许", "油 5ml（约 1 小勺）"],
    steps: [
      { text: "鸡蛋打碗里，加面粉、水、1g 盐、葱花，顺一个方向搅成稀面糊（⚠️ 搅到没有干粉颗粒、能缓缓流动，太稠加几滴水、太稀加半勺面粉）。", },
      { text: "平底锅小火烧热，倒 5ml 油刷匀锅底，舀一勺面糊倒中心，快速转锅把糊摊成薄圆饼（⚠️ 火小、锅热再倒，饼才不粘完整）。", },
      { text: "底面凝固、边缘翘起、表面冒小泡就翻面（约 1 分钟），翻面再煎 30 秒到两面微黄出锅。⚠️ 翻面用铲子托底整张翻，别戳破。软软香香孩子爱吃。", },
    ],
  },
  {
    id: "rec-tangcu-paigu",
    name: "糖醋排骨",
    emoji: "🍖",
    category: "protein",
    portion: "1盘",
    kcal: 780, p: 45, f: 66, c: 24,
    source: "recommended",
    group: "",
    scene: "ricekiller",
    image: "/food/cover-tangcu-paigu.webp",
    fiber: 0, vitC: 1, calcium: 20, iron: 1.6,
    benefits: ["酸甜开胃的下饭硬菜", "排骨补蛋白补钙"],
    cookTime: "约 45 分钟",
    difficulty: 2,
    ingredients: ["猪小排 400g（剁成 4~5cm 段）", "冰糖 24g（约 8 颗）", "姜 3 片", "醋 30ml（约 2 勺，陈醋）", "生抽 20ml（约 2 勺）", "料酒 15ml（约 1.5 勺）", "盐 2g（约 1 小勺）", "油 5ml（约 1 小勺）"],
    steps: [
      { text: "排骨冷水下锅加 1 勺料酒，大火煮开撇去褐色浮沫，再煮 1 分钟捞出温水冲净。⚠️ 冷水下锅去血沫去腥；热水下锅腥味锁里面。", },
      { text: "锅烧热倒 5ml 油，下冰糖开最小火慢炒。融化后冒大泡转小泡、变枣红色立刻下排骨翻炒裹糖色。⚠️ 全程小火，糖到深褐发苦；颜色一到位马上倒排骨。", },
      { text: "加姜片、20ml 生抽和 0.5 勺料酒炒香，倒热水没过排骨（⚠️ 热水，冷水让肉变硬），大火烧开转最小火盖盖炖 30 分钟。", },
      { text: "挑出姜片，加 30ml 醋和 2g 盐，开大火收汁到汤汁冒大泡、浓稠发亮裹住排骨（⚠️ 收汁多翻动防糊底；醋后放酸味才清爽不刺鼻）。酸甜味亮晶晶最馋人。", },
    ],
  },
  {
    id: "rec-hongshao-paigu",
    name: "红烧排骨",
    emoji: "🍖",
    category: "protein",
    portion: "1盘",
    kcal: 790, p: 45, f: 66, c: 18,
    source: "recommended",
    group: "",
    scene: "ricekiller",
    image: "/food/cover-tangcu-paigu.webp",
    fiber: 0, vitC: 1, calcium: 20, iron: 1.7,
    benefits: ["咸香软糯的家常硬菜", "孩子老人都爱啃"],
    cookTime: "约 50 分钟",
    difficulty: 2,
    ingredients: ["猪小排 400g（剁成 4~5cm 段）", "冰糖 18g（约 6 颗）", "姜 3 片", "葱 1 根", "生抽 20ml（约 2 勺）", "老抽 10ml（约 1 勺，上色）", "料酒 15ml（约 1.5 勺）", "盐 2g（约 1 小勺）", "油 5ml（约 1 小勺）"],
    steps: [
      { text: "排骨冷水下锅加 1 勺料酒，大火煮开撇沫，再煮 1 分钟捞出温水冲净。⚠️ 冷水下锅去血沫去腥。", },
      { text: "锅烧热倒 5ml 油，下冰糖最小火慢炒到枣红色，立刻下排骨翻炒裹糖色，加姜片、葱段、20ml 生抽、10ml 老抽炒香。⚠️ 炒糖色全程小火，糖焦发苦。", },
      { text: "倒热水没过排骨（⚠️ 热水），大火烧开转最小火盖盖炖 40 分钟。中途水少补热水。", },
      { text: "挑出葱姜，加 2g 盐大火收汁到汤汁冒大泡、浓稠裹住排骨、肉质软糯能轻松脱骨就关火。⚠️ 收汁多翻动防糊底。", },
    ],
  },
  {
    id: "rec-fenzheng-rou",
    name: "粉蒸肉",
    emoji: "🍖",
    category: "protein",
    portion: "1盘",
    kcal: 1200, p: 45, f: 137, c: 60,
    source: "recommended",
    group: "",
    scene: "homestyle",
    image: "/food/cover-tangcu-paigu.webp",
    fiber: 1, vitC: 2, calcium: 15, iron: 1.8,
    benefits: ["米粉裹肉蒸得软糯", "蒸菜少油不腻"],
    cookTime: "约 50 分钟",
    difficulty: 2,
    ingredients: ["五花肉 300g（带点肥更润）", "蒸肉米粉 80g（市售 1 包）", "南瓜 或 土豆 半个（约 150g，垫底）", "生抽 10ml（约 1 勺）", "豆瓣酱 8g（约半勺）", "盐 1g（约半小勺）", "姜 1 片（切末）", "料酒 5ml（约半勺）"],
    steps: [
      { text: "五花肉切约 3 毫米薄片（⚠️ 冻 20 分钟好切，片薄才易蒸糯）。加 10ml 生抽、8g 豆瓣酱、1g 盐、5ml 料酒、姜末抓匀腌 15 分钟入味。", },
      { text: "腌好的肉片分批裹满蒸肉米粉（⚠️ 每片都沾匀，米粉太多可喷点水防干）。南瓜或土豆去皮切块铺盘底（垫底吸肉油、防粘盘）。", },
      { text: "肉片一片片码在菜上，水开上锅，中火蒸 40 分钟到肉软糯、米粉油润透亮。⚠️ 蒸锅水要一次加够，中途缺水加开水。香气扑鼻。", },
    ],
  },
  {
    id: "rec-kele-jichi",
    name: "可乐鸡翅",
    emoji: "🍗",
    category: "protein",
    portion: "1盘",
    kcal: 650, p: 51, f: 37, c: 39,
    source: "recommended",
    group: "",
    scene: "kids",
    image: "/food/cover-tangcu-paigu.webp",
    fiber: 0, vitC: 1, calcium: 12, iron: 1.2,
    benefits: ["甜咸入味的孩子最爱", "鸡翅补蛋白"],
    cookTime: "约 25 分钟",
    difficulty: 1,
    ingredients: ["鸡中翅 8 个（约 300g）", "可乐 200ml（约 1 小罐，普通含糖可乐）", "姜 2 片", "生抽 10ml（约 1 勺）", "盐 1g（约半小勺）", "油 5ml（约 1 小勺）", "料酒 5ml（约半勺）"],
    steps: [
      { text: "鸡翅正反各划两刀（⚠️ 划深点更入味）。冷水下锅加姜片、5ml 料酒煮开撇沫，煮 1 分钟捞出温水冲净。⚠️ 焯水去腥去血沫。", },
      { text: "锅烧热倒 5ml 油，鸡翅煎到两面微黄、皮收紧（约 2 分钟每面）。⚠️ 煎过皮更香、炖时不易散。", },
      { text: "倒可乐没过鸡翅（约 200ml），加 10ml 生抽大火烧开转小火炖 15 分钟。⚠️ 可乐含糖易溢锅，盖留缝、火别大。", },
      { text: "挑出姜片，加 1g 盐大火收汁到汤汁冒泡变稠、裹住鸡翅发亮（约 3 分钟）。⚠️ 收汁不停翻动防糖汁糊底发苦。甜咸的小孩抢着吃。", },
    ],
  },
  {
    id: "rec-qingzheng-luyu",
    name: "清蒸鲈鱼",
    emoji: "🐟",
    category: "protein",
    portion: "1条",
    kcal: 130, p: 22, f: 4, c: 0,
    source: "recommended",
    group: "",
    scene: "light",
    image: "/food/cover-tangcu-paigu.webp",
    fiber: 0, vitC: 2, calcium: 30, iron: 1,
    benefits: ["清蒸锁住鲜味低脂肪", "清淡补蛋白好消化"],
    cookTime: "约 18 分钟",
    difficulty: 2,
    ingredients: ["鲈鱼 1 条（约 400g，刺少肉嫩）", "姜 3 片（切丝）", "葱 1 根（葱白切段、葱绿切丝）", "生抽 15ml（约 1.5 勺）", "料酒 10ml（约 1 勺）", "盐 2g（约 1 小勺）", "油 8ml（约 1.5 小勺）"],
    steps: [
      { text: "鲈鱼去鳞去鳃去内脏、腹内黑膜刮净（黑膜是腥味来源）。两面各划 2~3 刀（深至骨，⚠️ 划刀蒸汽才进得去、熟得匀）。抹 10ml 料酒和 2g 盐，鱼身鱼肚塞姜丝、葱白段，腌 10 分钟去腥。", },
      { text: "蒸锅水烧开，鱼盘铺葱白段（架空鱼身蒸汽循环更匀），鱼放上，中火蒸 8~10 分钟（400g 约 8 分钟，每多 100g 加 2 分钟）。关火焖 2 分钟。⚠️ 蒸过久肉老；用筷子扎最厚处能轻松穿透就是熟。", },
      { text: "倒掉盘里蒸出的浑水（⚠️ 这层水是腥味来源，必须倒掉），拣掉葱姜。铺葱丝、淋 15ml 生抽。另起锅烧热 8ml 油浇在葱丝上激出香味。鲜嫩不腥。", },
    ],
  },

  // —— 控糖轻食 ——
]
// 注：原味坚果、脆黄瓜为极简即食类，用户确认「正常人都会做、没必要做」，已从推荐菜移除（见 v0.1.57 下午打磨记录），不生成图、不写步骤。

/* ---------------- 菜谱页（榜单）数据源 ---------------- */

/** 菜谱页左侧竖排分类 */
export const RECIPE_CATS: { key: string; label: string }[] = [
  { key: "homestyle", label: "家常菜" },
  { key: "light", label: "清淡" },
  { key: "highprotein", label: "高蛋白" },
  { key: "breakfast", label: "元气早餐" },
  { key: "lunch", label: "轻盈午餐" },
  { key: "dinner", label: "暖心晚餐" },
  { key: "quick", label: "快手菜" },
  { key: "lowcal", label: "低卡减脂" },
  { key: "ricekiller", label: "下饭菜" },
  { key: "vegetarian", label: "素食" },
  { key: "soup", label: "养生汤羹" },
  { key: "kids", label: "亲子餐" },
  { key: "mine", label: "我的食谱" },
]

// 家常菜 → 菜谱分类标签
const HOMESTYLE_CATS: Record<string, string[]> = {
  辣椒炒肉: ["homestyle", "highprotein", "ricekiller"],
  青椒肉丝: ["homestyle", "highprotein", "ricekiller"],
  红烧肉: ["homestyle", "ricekiller"],
  宫保鸡丁: ["homestyle", "highprotein", "quick", "lowcal", "ricekiller", "kids"],
  鱼香肉丝: ["homestyle", "highprotein", "ricekiller"],
  土豆烧牛肉: ["homestyle", "highprotein", "ricekiller"],
  清炒西兰花: ["homestyle", "light", "lowcal", "vegetarian", "quick"],
  麻婆豆腐: ["homestyle", "highprotein", "ricekiller", "vegetarian"],
  西红柿炒鸡蛋: ["homestyle", "light", "quick", "lowcal", "ricekiller", "kids"],
  茄子烧土豆: ["homestyle", "ricekiller", "vegetarian", "quick"],
  香菇炒青菜: ["homestyle", "light", "lowcal", "vegetarian", "quick"],
  洋葱炒蛋: ["homestyle", "quick", "lowcal", "kids", "vegetarian"],
}

// 家常菜 → 专属封面图（未配置的菜品仍回退到分类代表图）
const HOMESTYLE_IMAGES: Record<string, string> = {
  辣椒炒肉: "/food/cover-lajiao-chaorou.webp",
  青椒肉丝: "/food/cover-qingjiao-rousi.webp",
  红烧肉: "/food/cover-hongshaorou.webp",
  宫保鸡丁: "/food/cover-gongbao-jiding.webp",
  鱼香肉丝: "/food/cover-yuxiang-rousi.webp",
  土豆烧牛肉: "/food/cover-tudou-niurou.webp",
  麻婆豆腐: "/food/cover-mapo-doufu.webp",
  西红柿炒鸡蛋: "/food/cover-xihongshi-jidan.webp",
  清炒西兰花: "/food/cover-qingchao-xilanhua.webp",
  茄子烧土豆: "/food/cover-xianggu-qingcai.webp",
  香菇炒青菜: "/food/cover-xianggu-qingcai.webp",
  洋葱炒蛋: "/food/cover-xianggu-qingcai.webp",
}

// 推荐套餐 → 菜谱分类标签（按 group 映射 + 个别属性补充）
const RECIPE_GROUP_CATS: Record<string, string[]> = {
  breakfast: ["breakfast", "homestyle"],
  lunch: ["lunch", "homestyle"],
  dinner: ["dinner", "homestyle"],
  grow: ["homestyle"],
}
// 个别套餐额外贴标签
const RECIPE_EXTRA_CATS: Record<string, string[]> = {
  "rec-chicken-bowl": ["highprotein", "lowcal"],
  "rec-fish-dinner": ["light", "lowcal", "kids"],
  "rec-tofu-noodle": ["light", "vegetarian", "soup", "lowcal", "kids"],
  "rec-millet-egg": ["light", "soup", "kids"],
  "rec-toast-pb": ["highprotein", "kids", "vegetarian", "quick"],
  "rec-soy-tea-egg": ["kids", "vegetarian", "quick"],
  "rec-eggs-toast": ["kids", "vegetarian", "quick"],
  "rec-tomato-egg": ["quick", "lowcal", "ricekiller", "kids", "vegetarian"],
  "rec-tomato-beef-noodle": ["ricekiller", "kids", "soup"],
  "rec-milk-walnut": ["kids", "vegetarian", "quick"],
  "rec-banana-yogurt": ["kids", "vegetarian", "quick", "lowcal"],
  "rec-steamed-egg": ["quick", "lowcal", "kids", "vegetarian"],
  "rec-onion-egg": ["quick", "lowcal", "kids", "vegetarian"],
  "rec-baizhuo-xia": ["lowcal", "light", "highprotein"],
  "rec-suanla-tudousi": ["ricekiller", "vegetarian", "quick"],
  "rec-disanxian": ["ricekiller", "vegetarian"],
  "rec-xianggu-youcai": ["light", "lowcal", "vegetarian"],
  "rec-fanqie-doufu-tang": ["soup", "lowcal", "kids", "vegetarian"],
  "rec-zicai-danhua-tang": ["soup", "lowcal", "kids", "quick", "vegetarian"],
  "rec-jidan-bing": ["kids", "vegetarian", "quick"],
  "rec-tangcu-paigu": ["highprotein", "ricekiller"],
  "rec-hongshao-paigu": ["highprotein", "ricekiller"],
  "rec-fenzheng-rou": ["highprotein"],
  "rec-kele-jichi": ["highprotein", "kids"],
  "rec-qingzheng-luyu": ["light", "lowcal", "highprotein"],
}

/** 把 COMMON_FOODS 里的家常菜转成 FoodEntry 并打分类标签 */
function buildHomestyleEntries(): FoodEntry[] {
  return COMMON_FOODS.filter((f) => HOMESTYLE_CATS[f.name]).map((f) => ({
    id: `combo-${f.name}`,
    name: f.name,
    emoji: "🍲",
    category: f.category,
    portion: "1 份",
    kcal: f.kcal,
    p: f.p,
    f: f.f,
    c: f.c,
    fiber: f.fiber,
    vitC: f.vitC,
    calcium: f.calcium,
    iron: f.iron,
    benefits: f.benefits,
    source: "recommended",
    recipeCat: HOMESTYLE_CATS[f.name],
    ingredients: f.ingredients,
    steps: f.steps,
    cookTime: f.cookTime,
    difficulty: f.difficulty,
    image: HOMESTYLE_IMAGES[f.name],
  }))
}

/** 菜谱页合并数据源：家常菜 + 推荐套餐，全部打 recipeCat 标签 */
export const RECIPE_CATALOG: FoodEntry[] = [
  ...buildHomestyleEntries(),
  ...RECOMMENDED.map((r) => ({
    ...r,
    recipeCat: [
      ...(RECIPE_GROUP_CATS[r.group ?? ""] ?? ["homestyle"]),
      ...(RECIPE_EXTRA_CATS[r.id] ?? []),
    ],
  })),
]


/* ---------------- 本地存储 ---------------- */

const LIB_KEY = "warmfeng-food-library"
const LOG_KEY = "warmfeng-meal-log"

export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** 用户自建食物库（含收藏的推荐） */
export function useFoodLibrary(): [FoodEntry[], (next: FoodEntry[]) => void] {
  const [list, setList] = React.useState<FoodEntry[]>([])

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LIB_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setList(parsed)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const update = React.useCallback((next: FoodEntry[]) => {
    setList(next)
    try {
      window.localStorage.setItem(LIB_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  return [list, update]
}

/* ---------------- 我的食谱（用户自创菜谱） ---------------- */

const MY_RECIPE_KEY = "warmFengMyRecipes"

/** 我的食谱条目：基于 FoodEntry 扩展时间戳，recipeCat 固定为 ["mine"] */
export interface MyRecipe extends FoodEntry {
  createdAt: number
  updatedAt: number
}

/** 用户自创食谱读写 hook，沿用 useFoodLibrary 的持久化模式 */
export function useMyRecipes(): [MyRecipe[], (next: MyRecipe[]) => void] {
  const [list, setList] = React.useState<MyRecipe[]>([])

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MY_RECIPE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setList(parsed)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const update = React.useCallback((next: MyRecipe[]) => {
    setList(next)
    try {
      window.localStorage.setItem(MY_RECIPE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  return [list, update]
}

/**
 * 当日各餐记录：{ [date]: { [mealKey]: FoodEntry[] } }
 * 返回 log、addFood(追加一餐若干食物)、removeFood(删除某条)、updateFood(更新某条)
 */
export function useMealLog(): [
  Record<string, Record<string, FoodEntry[]>>,
  (date: string, meal: string, foods: FoodEntry[]) => void,
  (date: string, meal: string, index: number) => void,
  (date: string, meal: string, index: number, updates: Partial<FoodEntry>) => void,
] {
  const [log, setLog] = React.useState<Record<string, Record<string, FoodEntry[]>>>({})

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOG_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setLog(parsed)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const addFood = React.useCallback(
    (date: string, meal: string, foods: FoodEntry[]) => {
      setLog((prev) => {
        const day = prev[date] ?? {}
        const next = {
          ...prev,
          [date]: { ...day, [meal]: [...(day[meal] ?? []), ...foods] },
        }
        try {
          window.localStorage.setItem(LOG_KEY, JSON.stringify(next))
          // 饮食记录写入后触发成就扫描（暖枫分级成就系统）
          window.dispatchEvent(new CustomEvent('achievement-scan'))
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [],
  )

  const removeFood = React.useCallback(
    (date: string, meal: string, index: number) => {
      setLog((prev) => {
        const day = prev[date] ?? {}
        const arr = day[meal] ?? []
        const next = {
          ...prev,
          [date]: { ...day, [meal]: arr.filter((_, i) => i !== index) },
        }
        try {
          window.localStorage.setItem(LOG_KEY, JSON.stringify(next))
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [],
  )

  const updateFood = React.useCallback(
    (date: string, meal: string, index: number, updates: Partial<FoodEntry>) => {
      setLog((prev) => {
        const day = prev[date] ?? {}
        const arr = day[meal] ?? []
        const next = {
          ...prev,
          [date]: { ...day, [meal]: arr.map((item, i) => i === index ? { ...item, ...updates } : item) },
        }
        try {
          window.localStorage.setItem(LOG_KEY, JSON.stringify(next))
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [],
  )

  return [log, addFood, removeFood, updateFood]
}

/** 累加一组食物的营养 */
export function sumFoods(foods: FoodEntry[]): { kcal: number; p: number; f: number; c: number } {
  return foods.reduce(
    (s, x) => {
      s.kcal += x.kcal
      s.p += x.p
      s.f += x.f
      s.c += x.c
      return s
    },
    { kcal: 0, p: 0, f: 0, c: 0 },
  )
}

/** 累加一组食物的微量元素 */
export function sumMicros(foods: FoodEntry[]): {
  fiber: number
  vitC: number
  calcium: number
  iron: number
} {
  return foods.reduce(
    (s, x) => {
      s.fiber += Number(x.fiber) || 0
      s.vitC += Number(x.vitC) || 0
      s.calcium += Number(x.calcium) || 0
      s.iron += Number(x.iron) || 0
      return s
    },
    { fiber: 0, vitC: 0, calcium: 0, iron: 0 },
  )
}
