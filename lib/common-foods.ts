// 常见食物营养库（每 100g 可食部）
// 数据来源：《中国食物成分表》第 6 版公开整理值，热量 kcal / 蛋白 g / 脂肪 g / 碳水 g
// 膳食纤维 g / 维C mg / 钙 mg / 铁 mg，数值为约值，仅供日常参考
// benefits：吃了有什么好处（一句一好处）

export type CommonFood = {
  name: string
  alias?: string[] // 别名/俗称，用于模糊匹配
  category: "staple" | "protein" | "veg" | "fruit" | "snack" | "drink"
  kcal: number
  p: number
  f: number
  c: number
  fiber: number
  vitC: number
  calcium: number
  iron: number
  benefits: string[]
  image?: string // 语义专属卡通图（public 下），如肉蛋鱼各自一张；无则按分类回退
  /** 用它能做的家常菜名（1-3 道），不内嵌做法，引导用户去抖音/B站搜教程 */
  pairings?: string[]
  // —— 家常菜做法（新手能看懂）——
  ingredients?: string[]
  steps?: { text: string; image?: string }[]
  cookTime?: string
  difficulty?: number
}

export const COMMON_FOODS: CommonFood[] = [
  // ===== 蔬菜类 =====
  { name: "胡萝卜", alias: ["胡罗卜"], category: "veg", kcal: 41, p: 1, f: 0.2, c: 10, fiber: 1.1, vitC: 6, calcium: 33, iron: 0.4, benefits: ["胡萝卜素护眼，看书写字眼睛不累", "膳食纤维帮肠道轻轻动起来"],
    pairings: ["胡萝卜炒蛋", "胡萝卜炖牛肉", "清炒胡萝卜"] },
  { name: "番茄", alias: ["西红柿"], category: "veg", kcal: 18, p: 0.9, f: 0.2, c: 3.9, fiber: 0.5, vitC: 14, calcium: 10, iron: 0.3, benefits: ["维C丰富，皮肤亮亮的有光泽", "番茄红素是抗氧小卫士"],
    pairings: ["番茄炒蛋", "番茄牛腩", "番茄鸡蛋汤"] },
  { name: "黄瓜", alias: ["青瓜"], category: "veg", kcal: 16, p: 0.8, f: 0.2, c: 2.9, fiber: 0.5, vitC: 9, calcium: 24, iron: 0.3, benefits: ["水分足热量低，解馋又解腻", "清清爽爽帮身体去去火"],
    pairings: ["凉拌黄瓜", "黄瓜炒蛋", "拍黄瓜"] },
  { name: "西兰花", alias: ["绿菜花"], category: "veg", kcal: 36, p: 4.1, f: 0.6, c: 4.3, fiber: 1.6, vitC: 51, calcium: 67, iron: 1, benefits: ["维C冠军，帮身体抗氧化", "膳食纤维多，吃饱又不胖"],
    pairings: ["蒜蓉西兰花", "西兰花炒虾仁", "白灼西兰花"] },
  { name: "菠菜", alias: [], category: "veg", kcal: 24, p: 2.6, f: 0.3, c: 3.6, fiber: 1.7, vitC: 32, calcium: 66, iron: 2.7, benefits: ["含铁补血红润有精神", "叶酸对长身体很重要"],
    pairings: ["凉拌菠菜", "菠菜炒蛋", "菠菜豆腐汤"] },
  { name: "白菜", alias: ["大白菜"], category: "veg", kcal: 18, p: 1.5, f: 0.1, c: 3.2, fiber: 0.8, vitC: 31, calcium: 50, iron: 0.7, benefits: ["清淡好消化，肠胃没负担", "维C帮抵抗力往上走"],
    pairings: ["醋溜白菜", "白菜炖豆腐", "猪肉白菜炖粉条"] },
  { name: "土豆", alias: ["马铃薯", "洋芋"], category: "veg", kcal: 77, p: 2, f: 0.2, c: 17, fiber: 1.1, vitC: 19, calcium: 12, iron: 0.8, benefits: ["顶饱的优质主食替身", "维C比苹果还多一截"],
    pairings: ["土豆丝", "土豆烧牛肉", "地三鲜"] },
  { name: "茄子", alias: [], category: "veg", kcal: 23, p: 1.1, f: 0.2, c: 4.9, fiber: 1.3, vitC: 5, calcium: 24, iron: 0.3, benefits: ["低热量的饱腹好菜", "花青素帮血管年轻"],
    pairings: ["地三鲜", "红烧茄子", "蒜蓉茄子"] },
  { name: "青椒", alias: ["甜椒", "菜椒"], category: "veg", kcal: 22, p: 1, f: 0.2, c: 4.5, fiber: 1.4, vitC: 72, calcium: 14, iron: 0.4, benefits: ["维C爆表，换季不轻易感冒", "脆脆甜甜孩子爱吃"],
    pairings: ["青椒炒蛋", "青椒炒肉", "地三鲜"] }  ,
  { name: "冬瓜", alias: [], category: "veg", kcal: 10, p: 0.4, f: 0.2, c: 2.4, fiber: 0.7, vitC: 18, calcium: 19, iron: 0.2, benefits: ["热量超低，消肿小能手", "夏天喝碗汤清清润润"],
    pairings: ["冬瓜排骨汤", "红烧冬瓜", "清炒冬瓜"] },
  { name: "南瓜", alias: ["倭瓜"], category: "veg", kcal: 23, p: 0.7, f: 0.1, c: 5.3, fiber: 0.8, vitC: 8, calcium: 16, iron: 0.4, benefits: ["南瓜绵软好消化", "胡萝卜素对眼睛好"],
    pairings: ["南瓜粥", "蒸南瓜", "南瓜饼"] },
  { name: "芹菜", alias: [], category: "veg", kcal: 14, p: 0.8, f: 0.1, c: 2.7, fiber: 1.4, vitC: 12, calcium: 48, iron: 0.8, benefits: ["膳食纤维丰富，帮肠道通畅", "清香开胃吃饭更香"],
    pairings: ["芹菜炒肉", "芹菜炒香干", "凉拌芹菜"] },
  { name: "生菜", alias: ["叶用莴苣"], category: "veg", kcal: 15, p: 1.4, f: 0.2, c: 2, fiber: 0.6, vitC: 9, calcium: 70, iron: 1.2, benefits: ["脆嫩低脂，沙拉顶配", "好消化肚子轻松"],
    pairings: ["蚝油生菜", "生菜沙拉", "生菜包肉"] },
  { name: "油麦菜", alias: [], category: "veg", kcal: 15, p: 1.4, f: 0.4, c: 1.5, fiber: 0.9, vitC: 13, calcium: 70, iron: 1.2, benefits: ["叶菜里钙含量不错", "清炒一盘清爽不腻"],
    pairings: ["蒜蓉油麦菜", "油麦菜炒豆豉"] },
  { name: "蒜薹", alias: ["蒜苔"], category: "veg", kcal: 61, p: 2.5, f: 0.3, c: 12, fiber: 2.5, vitC: 1, calcium: 39, iron: 1.4, benefits: ["膳食纤维帮肠道动", "杀菌开胃促消化"] },
  { name: "蘑菇", alias: ["香菇", "白蘑菇", "口蘑"], category: "veg", kcal: 22, p: 3.1, f: 0.3, c: 2.8, fiber: 1, vitC: 0, calcium: 6, iron: 0.3, benefits: ["菌菇蛋白低脂又鲜美", "膳食纤维养出好肠道菌群"],
    pairings: ["香菇青菜", "蘑菇炒肉", "蒜蓉蘑菇"] },
  { name: "木耳", alias: ["黑木耳"], category: "veg", kcal: 27, p: 1.5, f: 0.2, c: 6, fiber: 2.6, vitC: 0, calcium: 34, iron: 1.1, benefits: ["植物里含铁不少", "膳食纤维帮清清肠道"],
    pairings: ["木耳炒肉", "凉拌木耳", "木须肉"] },
  { name: "洋葱", alias: ["圆葱"], category: "veg", kcal: 40, p: 1.1, f: 0.1, c: 9, fiber: 0.9, vitC: 8, calcium: 24, iron: 0.3, benefits: ["硫化物帮血脂稳稳的", "提味神器少放盐"],
    pairings: ["洋葱炒蛋", "洋葱炒肉", "凉拌洋葱"] },
  { name: "豆腐", alias: ["北豆腐", "老豆腐"], category: "protein", kcal: 84, p: 8.1, f: 3.7, c: 3.8, fiber: 0.4, vitC: 0, calcium: 164, iron: 1.9, benefits: ["植物蛋白补钙两不误", "好消化不涨肚"],
    pairings: ["麻婆豆腐", "豆腐脑", "家常豆腐"] },
  { name: "豆芽", alias: ["黄豆芽", "绿豆芽"], category: "veg", kcal: 44, p: 4.5, f: 1.6, c: 3.1, fiber: 1.5, vitC: 8, calcium: 21, iron: 0.9, benefits: ["清爽脆嫩热量低", "维C帮抵抗力在线"],
    pairings: ["豆芽炒肉", "醋溜豆芽", "豆芽汤"] },

  // ===== 水果类 =====
  { name: "苹果", alias: [], category: "fruit", kcal: 52, p: 0.3, f: 0.2, c: 14, fiber: 2.4, vitC: 4, calcium: 4, iron: 0.3, benefits: ["果胶膳食纤维帮肠道顺", "一天一苹果医生远离我"],
    pairings: ["苹果沙拉", "苹果派"] },
  { name: "香蕉", alias: [], category: "fruit", kcal: 93, p: 1.4, f: 0.2, c: 22, fiber: 1.2, vitC: 9, calcium: 7, iron: 0.3, benefits: ["补钾运动后腿不抽筋", "快碳能量，饿了一根顶住"],
    pairings: ["香蕉牛奶", "香蕉燕麦"] },
  { name: "橙子", alias: ["甜橙"], category: "fruit", kcal: 48, p: 0.8, f: 0.2, c: 11, fiber: 0.6, vitC: 53, calcium: 20, iron: 0.2, benefits: ["维C满满，换季少感冒", "酸甜开胃心情好"],
    pairings: ["鲜榨橙汁", "橙子沙拉"] },
  { name: "猕猴桃", alias: ["奇异果"], category: "fruit", kcal: 61, p: 1.4, f: 0.5, c: 14, fiber: 3, vitC: 92, calcium: 27, iron: 0.3, benefits: ["维C之王，皮肤透亮", "膳食纤维帮消化"],
    pairings: ["猕猴桃酸奶", "水果沙拉"] },
  { name: "草莓", alias: [], category: "fruit", kcal: 32, p: 0.7, f: 0.2, c: 7.7, fiber: 1.1, vitC: 59, calcium: 18, iron: 0.3, benefits: ["维C高又低糖，嘴馋不怕", "花青素帮抗氧化"],
    pairings: ["草莓酸奶", "草莓奶昔"] },
  { name: "葡萄", alias: [], category: "fruit", kcal: 43, p: 0.5, f: 0.2, c: 10, fiber: 0.4, vitC: 4, calcium: 5, iron: 0.4, benefits: ["好吃的小零嘴补能量", "皮里的花青素是好东西"],
    pairings: ["葡萄酸奶", "水果沙拉"] },
  { name: "西瓜", alias: [], category: "fruit", kcal: 30, p: 0.6, f: 0.2, c: 7.6, fiber: 0.3, vitC: 6, calcium: 7, iron: 0.2, benefits: ["夏天补水解暑一把手", "热量不高吃着没负担"],
    pairings: ["西瓜汁", "水果拼盘"] },
  { name: "梨", alias: ["雪梨"], category: "fruit", kcal: 44, p: 0.4, f: 0.2, c: 11, fiber: 2.1, vitC: 4, calcium: 9, iron: 0.2, benefits: ["润润的，嗓子舒服", "膳食纤维帮肠道动"],
    pairings: ["冰糖雪梨", "梨汁"] },
  { name: "桃子", alias: ["水蜜桃"], category: "fruit", kcal: 39, p: 0.9, f: 0.2, c: 9.5, fiber: 1.3, vitC: 7, calcium: 9, iron: 0.3, benefits: ["香香甜甜补点维C", "水分多夏天吃正好"],
    pairings: ["黄桃罐头", "水蜜桃酸奶"] },
  { name: "蓝莓", alias: [], category: "fruit", kcal: 57, p: 0.7, f: 0.3, c: 14, fiber: 2.4, vitC: 9, calcium: 6, iron: 0.3, benefits: ["花青素护眼小炸弹", "低糖水果控糖也能吃"],
    pairings: ["蓝莓酸奶", "水果燕麦"] },

  // ===== 主食/谷类 =====
  { name: "米饭", alias: ["白米饭", "大米饭"], category: "staple", kcal: 116, p: 2.6, f: 0.3, c: 25.9, fiber: 0.3, vitC: 0, calcium: 7, iron: 0.2, benefits: ["最稳妥的能量来源", "配菜吃香喷喷"],
    pairings: ["蛋炒饭", "扬州炒饭", "咖喱饭"] },
  { name: "馒头", alias: [], category: "staple", kcal: 223, p: 7, f: 1.1, c: 47, fiber: 1.5, vitC: 0, calcium: 38, iron: 1.8, benefits: ["扎实顶饱的主食", "发酵后更好消化"],
    pairings: ["煎馒头片", "馒头夹蛋"] },
  { name: "面条", alias: ["面", "挂面"], category: "staple", kcal: 138, p: 4.5, f: 0.5, c: 28, fiber: 1.2, vitC: 0, calcium: 13, iron: 1.1, benefits: ["一碗热面暖身子", "快手主食省时间"],
    pairings: ["番茄鸡蛋面", "牛肉面", "葱油拌面"] },
  { name: "燕麦", alias: ["燕麦片"], category: "staple", kcal: 367, p: 15, f: 6.7, c: 61, fiber: 10.6, vitC: 0, calcium: 52, iron: 4.2, benefits: ["β-葡聚糖帮血脂稳", "膳食纤维扛饿一上午"],
    pairings: ["燕麦粥", "燕麦牛奶", "隔夜燕麦"] },
  { name: "全麦面包", alias: ["全麦吐司"], category: "staple", kcal: 246, p: 9, f: 3.2, c: 46, fiber: 7, vitC: 0, calcium: 107, iron: 2.5, benefits: ["比白面包多膳食纤维", "早餐一片顶饱又营养"] },
  { name: "小米", alias: ["小米粥"], category: "staple", kcal: 361, p: 9, f: 3.1, c: 73, fiber: 1.6, vitC: 0, calcium: 41, iron: 5.1, benefits: ["温和养胃，早上吃暖暖的", "含铁比白米多"] },
  { name: "玉米", alias: ["苞米", "玉蜀黍"], category: "staple", kcal: 106, p: 4, f: 1.2, c: 23, fiber: 2.9, vitC: 0, calcium: 7, iron: 0.4, benefits: ["粗粮膳食纤维丰富", "啃一根比饼干健康"],
    pairings: ["水煮玉米", "玉米排骨汤", "烤玉米"] },
  { name: "红薯", alias: ["地瓜", "番薯"], category: "staple", kcal: 99, p: 1.1, f: 0.2, c: 24, fiber: 1.6, vitC: 0, calcium: 23, iron: 0.5, benefits: ["饱腹感强的粗粮", "膳食纤维帮肠道通畅"],
    pairings: ["烤红薯", "红薯粥", "拔丝红薯"] },
  { name: "紫薯", alias: [], category: "staple", kcal: 106, p: 1.4, f: 0.2, c: 25, fiber: 3, vitC: 0, calcium: 24, iron: 0.5, benefits: ["花青素粗粮小宝藏", "替换米饭更低脂"] },

  // ===== 蛋白/肉蛋奶 =====
  { name: "鸡蛋", alias: ["鸡蛋白", "煮鸡蛋"], category: "protein", kcal: 144, p: 13.3, f: 8.8, c: 2.8, fiber: 0, vitC: 0, calcium: 56, iron: 2, benefits: ["优质蛋白长身体长力气", "蛋黄里的卵磷脂对脑子好"],
    pairings: ["番茄炒蛋", "蒸蛋", "茶叶蛋"], image: "/food/meat-egg.webp" },
  { name: "鸡胸肉", alias: ["鸡胸"], category: "protein", kcal: 118, p: 24, f: 1.9, c: 0, fiber: 0, vitC: 0, calcium: 3, iron: 0.6, benefits: ["高蛋白低脂肪，长肌肉不长肉", "健身减脂的好搭子"],
    pairings: ["宫保鸡丁", "香煎鸡胸", "鸡胸肉沙拉"], image: "/food/meat-steak.webp" },
  { name: "牛肉", alias: ["牛里脊"], category: "protein", kcal: 125, p: 20, f: 4.2, c: 2, fiber: 0, vitC: 0, calcium: 9, iron: 2.8, benefits: ["补铁补蛋白，走路带风有劲", "红肉里的好营养"],
    pairings: ["土豆烧牛肉", "番茄牛腩", "青椒牛肉"], image: "/food/meat-steak.webp" },
  { name: "猪瘦肉", alias: ["瘦猪肉"], category: "protein", kcal: 143, p: 20.3, f: 6.2, c: 1.5, fiber: 0, vitC: 0, calcium: 6, iron: 3, benefits: ["补蛋白也补铁", "炒菜提香又下饭"],
    pairings: ["青椒炒肉", "鱼香肉丝", "榨菜肉丝"], image: "/food/meat-steak.webp" },
  { name: "鱼肉", alias: ["鱼肉", "清蒸鱼"], category: "protein", kcal: 113, p: 17, f: 5, c: 0, fiber: 0, vitC: 0, calcium: 31, iron: 0.5, benefits: ["好消化又补蛋白", "富含好脂肪护心脑"] },
  { name: "虾", alias: ["基围虾", "虾仁"], category: "protein", kcal: 93, p: 18.6, f: 0.8, c: 2.8, fiber: 0, vitC: 0, calcium: 62, iron: 1.5, benefits: ["低脂高蛋白的小鲜货", "含钙帮骨头结实"],
    pairings: ["白灼虾", "蒜蓉虾", "油焖大虾"], image: "/food/meat-steak.webp" },
  { name: "牛奶", alias: ["纯牛奶"], category: "drink", kcal: 54, p: 3, f: 3.2, c: 3.4, fiber: 0, vitC: 1, calcium: 104, iron: 0.1, benefits: ["补钙一把手，长高高少不了", "蛋白好吸收"],
    pairings: ["牛奶燕麦", "奶茶"] },
  { name: "酸奶", alias: ["原味酸奶"], category: "drink", kcal: 72, p: 2.5, f: 2.7, c: 9.3, fiber: 0, vitC: 1, calcium: 118, iron: 0.1, benefits: ["有钙又有好菌，肚子舒服", "比甜饮料健康多啦"],
    pairings: ["酸奶水果", "酸奶燕麦"] },
  { name: "豆浆", alias: ["黄豆豆浆"], category: "drink", kcal: 31, p: 3, f: 1.6, c: 1.2, fiber: 0.7, vitC: 0, calcium: 10, iron: 0.5, benefits: ["植物蛋白早餐饮", "不含乳糖也好吸收"],
    pairings: ["豆浆油条", "豆腐脑"] },

  // ===== 加餐/坚果/其他 =====
  { name: "核桃", alias: [], category: "snack", kcal: 627, p: 14.9, f: 58, c: 14, fiber: 9.5, vitC: 0, calcium: 98, iron: 2.7, benefits: ["好脂肪补脑子灵光", "课间一小把抗饿"],
    pairings: ["核桃燕麦", "琥珀核桃"] },
  { name: "花生", alias: ["花生米"], category: "snack", kcal: 567, p: 25, f: 48, c: 16, fiber: 8, vitC: 0, calcium: 39, iron: 4.6, benefits: ["植物蛋白加油脂扛饿", "补铁小零嘴"],
    pairings: ["水煮花生", "花生牛奶"] },
  { name: "杏仁", alias: ["巴旦木"], category: "snack", kcal: 579, p: 21, f: 50, c: 22, fiber: 12.5, vitC: 0, calcium: 269, iron: 3.7, benefits: ["钙含量高的坚果", "纤维多顶饱"],
    pairings: ["杏仁露", "杏仁豆腐"] },
  { name: "腰果", alias: [], category: "snack", kcal: 553, p: 18, f: 44, c: 30, fiber: 3.3, vitC: 0, calcium: 37, iron: 6.7, benefits: ["补铁补锌小能手", "香香脆脆好吃"],
    pairings: ["腰果炒虾仁", "盐焗腰果"] },
  { name: "开心果", alias: [], category: "snack", kcal: 562, p: 20, f: 45, c: 28, fiber: 10, vitC: 0, calcium: 105, iron: 3.9, benefits: ["膳食纤维丰富的坚果", "控量吃对心好"],
    pairings: ["开心果酸奶", "直接吃"] },
  { name: "巧克力", alias: ["黑巧克力"], category: "snack", kcal: 589, p: 4.9, f: 40, c: 53, fiber: 7, vitC: 0, calcium: 111, iron: 11.9, benefits: ["心情不好的小安慰", "选可可高的更友好"],
    pairings: ["热巧克力", "巧克力牛奶"] },

  // ===== 豆制品 =====
  { name: "豆浆", alias: ["黄豆豆浆", "黄豆浆"], category: "drink", kcal: 31, p: 3, f: 1.6, c: 1.2, fiber: 0.7, vitC: 0, calcium: 10, iron: 0.5, benefits: ["植物蛋白早餐饮", "不含乳糖也好吸收"],
    pairings: ["豆浆油条", "豆腐脑"] },
  { name: "豆腐干", alias: ["豆干"], category: "protein", kcal: 140, p: 16, f: 7, c: 4, fiber: 1, vitC: 0, calcium: 300, iron: 3.5, benefits: ["补钙小零食，比奶还高", "蛋白扎实耐饿"] },
  { name: "腐竹", alias: ["豆筋"], category: "protein", kcal: 461, p: 44, f: 21, c: 22, fiber: 4, vitC: 0, calcium: 77, iron: 6.3, benefits: ["浓缩的大豆蛋白", "涮火锅一绝"] },
  { name: "毛豆", alias: ["黄豆", "青豆"], category: "veg", kcal: 131, p: 13, f: 5, c: 11, fiber: 4, vitC: 6, calcium: 63, iron: 2.6, benefits: ["植物蛋白+膳食纤维双补", "下酒小菜也健康"] },
  { name: "黄豆", alias: ["大豆"], category: "protein", kcal: 390, p: 35, f: 16, c: 18, fiber: 15, vitC: 0, calcium: 191, iron: 8.2, benefits: ["豆中之王，蛋白顶格", "做豆浆豆腐的源头"] },
  { name: "绿豆", alias: [], category: "staple", kcal: 347, p: 22, f: 1, c: 62, fiber: 6, vitC: 0, calcium: 49, iron: 3.2, benefits: ["夏天绿豆汤解暑", "粗粮杂豆好搭档"] },
  { name: "红豆", alias: ["赤小豆"], category: "staple", kcal: 324, p: 20, f: 0.6, c: 63, fiber: 7, vitC: 0, calcium: 74, iron: 7.4, benefits: ["红豆汤养心气色好", "膳食纤维帮排水"] },
  { name: "千张", alias: ["百叶", "豆腐皮"], category: "protein", kcal: 262, p: 25, f: 16, c: 5, fiber: 1, vitC: 0, calcium: 313, iron: 4.5, benefits: ["咬劲十足的高钙豆品", "凉拌炒着都香"] },

  // ===== 海鲜水产 =====
  { name: "三文鱼", alias: ["鲑鱼"], category: "protein", kcal: 208, p: 20, f: 13, c: 0, fiber: 0, vitC: 0, calcium: 9, iron: 0.3, benefits: ["好脂肪 Omega-3 护心脑", "蛋白好吸收"], image: "/food/meat-steak.webp" },
  { name: "带鱼", alias: [], category: "protein", kcal: 127, p: 18, f: 5, c: 4, fiber: 0, vitC: 0, calcium: 28, iron: 1.2, benefits: ["海鱼补 DHA 脑子灵", "刺少肉嫩孩子爱"] },
  { name: "鲫鱼", alias: [], category: "protein", kcal: 108, p: 17, f: 4, c: 0, fiber: 0, vitC: 0, calcium: 54, iron: 1.3, benefits: ["鲫鱼汤奶白又补", "温润好消化"] },
  { name: "鲈鱼", alias: ["清蒸鲈鱼"], category: "protein", kcal: 105, p: 18, f: 3, c: 0, fiber: 0, vitC: 0, calcium: 56, iron: 0.5, benefits: ["刺少肉嫩的优蛋白", "术后滋补常选它"], image: "/food/meat-steak.webp" },
  { name: "金枪鱼", alias: ["吞拿鱼"], category: "protein", kcal: 132, p: 28, f: 1, c: 0, fiber: 0, vitC: 0, calcium: 8, iron: 1.3, benefits: ["低脂高蛋白罐头常客", "健身餐好搭子"] },
  { name: "螃蟹", alias: ["大闸蟹"], category: "protein", kcal: 95, p: 17, f: 2, c: 2, fiber: 0, vitC: 0, calcium: 126, iron: 2.9, benefits: ["蟹肉鲜甜补蛋白", "钙铁都不低"] },
  { name: "扇贝", alias: [], category: "protein", kcal: 60, p: 12, f: 1, c: 2, fiber: 0, vitC: 0, calcium: 35, iron: 3.5, benefits: ["低脂海鲜补锌铁", "鲜掉眉毛"] },
  { name: "蛤蜊", alias: ["花蛤"], category: "protein", kcal: 62, p: 10, f: 1, c: 2, fiber: 0, vitC: 0, calcium: 133, iron: 10.9, benefits: ["补铁小海鲜，数值惊人", "煮汤鲜味足"] },
  { name: "鱿鱼", alias: ["枪乌贼"], category: "protein", kcal: 92, p: 15, f: 1.4, c: 3, fiber: 0, vitC: 0, calcium: 43, iron: 0.5, benefits: ["脆弹低脂高蛋白", "爆炒一绝"] },
  { name: "海参", alias: [], category: "protein", kcal: 78, p: 16, f: 0.2, c: 2, fiber: 0, vitC: 0, calcium: 285, iron: 13.2, benefits: ["高蛋白低脂肪的滋补品", "钙铁都丰富"] },
  { name: "小龙虾", alias: [], category: "protein", kcal: 93, p: 14, f: 3.8, c: 1, fiber: 0, vitC: 0, calcium: 85, iron: 1.6, benefits: ["夏夜宵高蛋白", "剥着吃慢悠悠"] },

  // ===== 禽肉/内脏 =====
  { name: "鸡腿", alias: ["鸡腿肉"], category: "protein", kcal: 181, p: 19, f: 11, c: 0, fiber: 0, vitC: 0, calcium: 11, iron: 1.2, benefits: ["比鸡胸香，蛋白也不少", "炖煮都好吃"] },
  { name: "鸡翅", alias: [], category: "protein", kcal: 194, p: 17, f: 11, c: 6, fiber: 0, vitC: 0, calcium: 8, iron: 1.3, benefits: ["孩子最爱的小肉", "烤着吃香"] },
  { name: "鸭肉", alias: ["鸭腿"], category: "protein", kcal: 240, p: 15, f: 19, c: 0, fiber: 0, vitC: 0, calcium: 6, iron: 2.2, benefits: ["鸭肉偏凉，夏天吃舒", "老鸭汤很滋补"] },
  { name: "猪肝", alias: [], category: "protein", kcal: 129, p: 19, f: 3.5, c: 5, fiber: 0, vitC: 0, calcium: 6, iron: 22.6, benefits: ["补铁之王，红润气血", "维A也高护眼"] },
  { name: "鸡肝", alias: [], category: "protein", kcal: 121, p: 16, f: 5, c: 2, fiber: 0, vitC: 0, calcium: 8, iron: 12, benefits: ["小小一块补铁足", "维A丰富"] },

  // ===== 更多蔬菜 =====
  { name: "油菜", alias: ["上海青"], category: "veg", kcal: 23, p: 1.8, f: 0.5, c: 3.8, fiber: 1.1, vitC: 36, calcium: 108, iron: 1.2, benefits: ["钙含量高的绿叶菜", "清炒一盘补不少"] },
  { name: "空心菜", alias: ["蕹菜"], category: "veg", kcal: 20, p: 2.2, f: 0.3, c: 3.6, fiber: 1.4, vitC: 25, calcium: 99, iron: 2.3, benefits: ["夏天旺长的绿叶菜", "纤维多肠道顺"] },
  { name: "茼蒿", alias: [], category: "veg", kcal: 21, p: 1.9, f: 0.3, c: 3.9, fiber: 1.2, vitC: 18, calcium: 73, iron: 2.5, benefits: ["火锅必点清香菜", "补钾帮血压稳"] },
  { name: "苦瓜", alias: [], category: "veg", kcal: 19, p: 1, f: 0.1, c: 4.5, fiber: 1.4, vitC: 56, calcium: 14, iron: 0.7, benefits: ["苦口清火小能手", "维C不低"] },
  { name: "丝瓜", alias: [], category: "veg", kcal: 20, p: 1, f: 0.2, c: 4.2, fiber: 0.6, vitC: 5, calcium: 14, iron: 0.4, benefits: ["清润好消化的瓜", "夏天煮汤润润的"] },
  { name: "莲藕", alias: ["藕"], category: "veg", kcal: 73, p: 1.9, f: 0.2, c: 17, fiber: 2.2, vitC: 44, calcium: 39, iron: 1.4, benefits: ["脆藕凉拌爽口", "维C比一般根茎高"] },
  { name: "山药", alias: ["淮山"], category: "veg", kcal: 57, p: 1.9, f: 0.2, c: 13, fiber: 1.4, vitC: 5, calcium: 16, iron: 0.3, benefits: ["健脾养胃的粗粮", "煮羹软糯好消化"] },
  { name: "芋头", alias: [], category: "veg", kcal: 79, p: 2.2, f: 0.2, c: 18, fiber: 1, vitC: 6, calcium: 36, iron: 1, benefits: ["软糯顶饱的薯类", "比米饭好消化些"] },
  { name: "白萝卜", alias: ["萝卜"], category: "veg", kcal: 21, p: 0.9, f: 0.1, c: 5, fiber: 1.1, vitC: 21, calcium: 36, iron: 0.5, benefits: ["顺气解腻的菜", "炖肉去腥提鲜"] },
  { name: "胡萝卜缨", alias: [], category: "veg", kcal: 30, p: 3, f: 0.6, c: 5, fiber: 2, vitC: 40, calcium: 350, iron: 3, benefits: ["常被扔掉的补钙宝", "维C也不少"] },
  { name: "西葫芦", alias: ["角瓜"], category: "veg", kcal: 18, p: 0.8, f: 0.2, c: 3.8, fiber: 1, vitC: 6, calcium: 15, iron: 0.3, benefits: ["清爽低卡的好菜", "炒着软嫩"] },
  { name: "芦笋", alias: [], category: "veg", kcal: 20, p: 2.2, f: 0.1, c: 3.9, fiber: 2.1, vitC: 5, calcium: 24, iron: 1.4, benefits: ["膳食纤维丰富的嫩茎", "低卡西餐常客"] },
  { name: "秋葵", alias: [], category: "veg", kcal: 37, p: 2, f: 0.1, c: 8, fiber: 3.9, vitC: 4, calcium: 81, iron: 0.8, benefits: ["黏滑物质护肠胃", "纤维高饱腹"] },
  { name: "莴笋", alias: ["莴苣"], category: "veg", kcal: 15, p: 1, f: 0.1, c: 3.3, fiber: 0.7, vitC: 4, calcium: 23, iron: 0.5, benefits: ["脆爽低卡凉拌菜", "茎叶都能吃"] },
  { name: "茭白", alias: [], category: "veg", kcal: 23, p: 1.2, f: 0.2, c: 5, fiber: 1.9, vitC: 0, calcium: 4, iron: 0.4, benefits: ["江南水八仙之一", "清爽低卡"] },
  { name: "竹笋", alias: ["笋"], category: "veg", kcal: 27, p: 2.6, f: 0.3, c: 5, fiber: 2.8, vitC: 0, calcium: 9, iron: 0.5, benefits: ["纤维超高的低卡菜", "春天尝鲜"] },
  { name: "荷兰豆", alias: ["豌豆尖"], category: "veg", kcal: 27, p: 2.5, f: 0.3, c: 4.9, fiber: 1.4, vitC: 16, calcium: 51, iron: 1.3, benefits: ["脆甜清炒一角", "维C帮抵抗力"] },
  { name: "香菇", alias: [], category: "veg", kcal: 26, p: 2.2, f: 0.3, c: 5.2, fiber: 3.3, vitC: 0, calcium: 2, iron: 0.3, benefits: ["菌菇提鲜主力", "膳食纤维养肠道"] },
  { name: "金针菇", alias: [], category: "veg", kcal: 26, p: 2.4, f: 0.4, c: 6, fiber: 2.7, vitC: 0, calcium: 0, iron: 0.5, benefits: ["火锅必点滑溜溜", "低卡高纤"] },
  { name: "平菇", alias: [], category: "veg", kcal: 20, p: 1.9, f: 0.3, c: 4.6, fiber: 2.3, vitC: 0, calcium: 0, iron: 0.4, benefits: ["家常炒菜菌菇", "清淡又鲜"] },
  { name: "海带", alias: ["海带丝"], category: "veg", kcal: 13, p: 1.2, f: 0.1, c: 3, fiber: 0.5, vitC: 0, calcium: 46, iron: 0.9, benefits: ["碘的小仓库，甲状腺喜欢", "凉拌低卡"] },
  { name: "紫菜", alias: [], category: "veg", kcal: 35, p: 4, f: 0.6, c: 5, fiber: 2, vitC: 0, calcium: 70, iron: 3.3, benefits: ["补碘又补铁", "蛋花汤提鲜"] },

  // ===== 更多水果 =====
  { name: "火龙果", alias: [], category: "fruit", kcal: 55, p: 1.1, f: 0.2, c: 13, fiber: 1.6, vitC: 3, calcium: 6, iron: 0.3, benefits: ["籽多纤维帮排便", "低糖好吃"] },
  { name: "芒果", alias: [], category: "fruit", kcal: 60, p: 0.8, f: 0.4, c: 15, fiber: 1.3, vitC: 23, calcium: 10, iron: 0.2, benefits: ["维A维C都高的甜果", "护眼又养颜"] },
  { name: "菠萝", alias: [], category: "fruit", kcal: 50, p: 0.5, f: 0.1, c: 13, fiber: 1.2, vitC: 18, calcium: 12, iron: 0.3, benefits: ["菠萝蛋白酶帮消化肉", "酸甜开胃"] },
  { name: "木瓜", alias: [], category: "fruit", kcal: 43, p: 0.7, f: 0.1, c: 11, fiber: 0.8, vitC: 61, calcium: 17, iron: 0.2, benefits: ["木瓜酶助消化", "维C丰润皮肤"] },
  { name: "柚子", alias: [], category: "fruit", kcal: 42, p: 0.8, f: 0.2, c: 10, fiber: 0.4, vitC: 23, calcium: 4, iron: 0.3, benefits: ["清爽低糖大果", "维C帮换季防御"] },
  { name: "柠檬", alias: [], category: "fruit", kcal: 37, p: 1.1, f: 0.3, c: 9, fiber: 2.8, vitC: 53, calcium: 101, iron: 0.8, benefits: ["泡水维C补一点", "开胃解腻"] },
  { name: "樱桃", alias: [], category: "fruit", kcal: 63, p: 1, f: 0.2, c: 16, fiber: 1, vitC: 7, calcium: 11, iron: 0.4, benefits: ["含铁的小甜果", "抗氧化花青素"] },
  { name: "荔枝", alias: [], category: "fruit", kcal: 71, p: 0.9, f: 0.2, c: 18, fiber: 0.5, vitC: 2, calcium: 2, iron: 0.4, benefits: ["甜津津的夏日果", "别贪多上火"] },
  { name: "龙眼", alias: ["桂圆"], category: "fruit", kcal: 71, p: 1.2, f: 0.1, c: 18, fiber: 0.4, vitC: 43, calcium: 6, iron: 0.2, benefits: ["补气血的小甜果", "晒干党参茶更温"] },
  { name: "椰子", alias: ["椰子肉"], category: "fruit", kcal: 241, p: 4, f: 12, c: 32, fiber: 4, vitC: 0, calcium: 14, iron: 2, benefits: ["椰肉香椰汁甜", "运动补电解质"] },
  { name: "牛油果", alias: ["鳄梨"], category: "fruit", kcal: 171, p: 2, f: 15, c: 9, fiber: 7, vitC: 10, calcium: 12, iron: 0.6, benefits: ["好脂肪满满的果", "抹面包顶饱"] },
  { name: "石榴", alias: [], category: "fruit", kcal: 72, p: 1.4, f: 0.2, c: 18, fiber: 4, vitC: 9, calcium: 6, iron: 0.3, benefits: ["籽籽花青素多", "抗氧化小宝石"] },
  { name: "杨梅", alias: [], category: "fruit", kcal: 28, p: 0.8, f: 0.2, c: 6.7, fiber: 1, vitC: 9, calcium: 14, iron: 1, benefits: ["酸酸甜甜生津", "夏天小零嘴"] },
  { name: "山楂", alias: [], category: "fruit", kcal: 95, p: 0.5, f: 0.6, c: 25, fiber: 3.1, vitC: 53, calcium: 52, iron: 0.9, benefits: ["开胃助消化", "煮水喝解腻"] },

  // ===== 更多主食/杂粮 =====
  { name: "荞麦", alias: [], category: "staple", kcal: 337, p: 12, f: 2.7, c: 66, fiber: 6.5, vitC: 0, calcium: 47, iron: 3.4, benefits: ["芦丁帮血管弹性", "三高友好粗粮"] },
  { name: "藜麦", alias: [], category: "staple", kcal: 368, p: 14, f: 6, c: 64, fiber: 7, vitC: 0, calcium: 47, iron: 4.6, benefits: ["蛋白完整的伪谷物", "减脂餐常客"] },
  { name: "糙米", alias: [], category: "staple", kcal: 348, p: 7.9, f: 2.9, c: 75, fiber: 3.5, vitC: 0, calcium: 10, iron: 1.5, benefits: ["留着胚芽的糙米", "纤维比白米多"] },
  { name: "黑米", alias: [], category: "staple", kcal: 341, p: 8.5, f: 2.5, c: 73, fiber: 3.5, vitC: 0, calcium: 12, iron: 1.9, benefits: ["花青素满满的米", "煮粥养眼"] },
  { name: "薏仁", alias: ["薏米"], category: "staple", kcal: 357, p: 13, f: 3.3, c: 71, fiber: 2, vitC: 0, calcium: 42, iron: 3.6, benefits: ["祛湿小杂粮", "煮水温和"] },
  { name: "年糕", alias: [], category: "staple", kcal: 154, p: 3.3, f: 0.5, c: 34, fiber: 0.8, vitC: 0, calcium: 8, iron: 0.6, benefits: ["软糯糯的年味", "当主食别吃太多"] },
  { name: "包子", alias: ["肉包"], category: "staple", kcal: 223, p: 8, f: 4, c: 39, fiber: 1.5, vitC: 0, calcium: 35, iron: 1.6, benefits: ["一笼管饱的早餐", "馅料决定营养"] },
  { name: "饺子", alias: ["水饺"], category: "staple", kcal: 198, p: 8, f: 7, c: 25, fiber: 1.2, vitC: 0, calcium: 28, iron: 1.7, benefits: ["有菜有肉一口全", "家常快手主食"] },
  { name: "烧麦", alias: ["烧卖"], category: "staple", kcal: 220, p: 6, f: 5, c: 37, fiber: 1, vitC: 0, calcium: 18, iron: 1.4, benefits: ["糯米顶饱小点", "早餐一口一个"] },
  { name: "意大利面", alias: ["意面"], category: "staple", kcal: 158, p: 5.8, f: 0.9, c: 31, fiber: 1.8, vitC: 0, calcium: 7, iron: 0.5, benefits: ["低GI的西式主食", "拌酱管饱"] },
  { name: "面包", alias: ["吐司", "白面包"], category: "staple", kcal: 265, p: 9, f: 3.2, c: 49, fiber: 2.4, vitC: 0, calcium: 49, iron: 2.3, benefits: ["早餐快手碳水", "配蛋奶更均衡"] },
  { name: "粉条", alias: ["粉丝"], category: "staple", kcal: 337, p: 0.5, f: 0.1, c: 84, fiber: 0.6, vitC: 0, calcium: 3, iron: 0.4, benefits: ["火锅吸汤小配角", "纯淀粉注意量"] },

  // ===== 蛋奶其他 =====
  { name: "鸭蛋", alias: [], category: "protein", kcal: 180, p: 12.6, f: 13, c: 3, fiber: 0, vitC: 0, calcium: 62, iron: 2.9, benefits: ["咸鸭蛋下粥一绝", "蛋白脂肪都不少"] },
  { name: "鹌鹑蛋", alias: [], category: "protein", kcal: 160, p: 12.8, f: 11, c: 2.4, fiber: 0, vitC: 0, calcium: 47, iron: 3.2, benefits: ["一口一个的小营养", "补铁不差"] },
  { name: "奶酪", alias: ["芝士"], category: "drink", kcal: 328, p: 25, f: 24, c: 3.5, fiber: 0, vitC: 0, calcium: 799, iron: 0.3, benefits: ["钙含量爆表的奶制品", "一小块顶一杯奶"] },
  { name: "炼乳", alias: [], category: "drink", kcal: 327, p: 8, f: 8, c: 55, fiber: 0, vitC: 0, calcium: 242, iron: 0.4, benefits: ["甜甜的高钙调味", "少放糖更健康"] },

  // ===== 饮品 =====
  { name: "酸奶饮品", alias: ["风味酸奶"], category: "drink", kcal: 85, p: 2.3, f: 2.5, c: 13, fiber: 0, vitC: 1, calcium: 90, iron: 0.1, benefits: ["好喝的小甜饮", "看配料选低糖"] },
  { name: "豆奶", alias: ["豆奶饮料"], category: "drink", kcal: 45, p: 2.4, f: 1.5, c: 5, fiber: 0.5, vitC: 0, calcium: 30, iron: 0.4, benefits: ["植物蛋白饮品", "乳糖不耐备选"] },
  { name: "果汁", alias: ["橙汁"], category: "drink", kcal: 45, p: 0.7, f: 0.2, c: 11, fiber: 0.2, vitC: 30, calcium: 8, iron: 0.2, benefits: ["维C快补一口", "不如直接吃果"] },
  { name: "咖啡", alias: ["美式咖啡"], category: "drink", kcal: 2, p: 0.1, f: 0, c: 0, fiber: 0, vitC: 0, calcium: 2, iron: 0.1, benefits: ["零卡提神小杯", "别加糖奶"] },
  { name: "绿茶", alias: ["茶叶"], category: "drink", kcal: 0, p: 0, f: 0, c: 0, fiber: 0, vitC: 0, calcium: 3, iron: 0.1, benefits: ["抗氧化的清饮", "不加糖零负担"] },
  { name: "蜂蜜水", alias: ["蜂蜜"], category: "drink", kcal: 304, p: 0.3, f: 0, c: 82, fiber: 0.2, vitC: 0, calcium: 4, iron: 0.3, benefits: ["温水冲润润喉", "糖多要少放"] },

  // ===== 速食/外卖常见 =====
  { name: "汉堡", alias: [], category: "snack", kcal: 292, p: 13, f: 13, c: 30, fiber: 1.2, vitC: 2, calcium: 70, iron: 2.1, benefits: ["有肉有菜有主食", "偶尔解馋别常吃"] },
  { name: "披萨", alias: [], category: "snack", kcal: 235, p: 10, f: 9, c: 28, fiber: 1.5, vitC: 3, calcium: 160, iron: 1.4, benefits: ["芝士补钙一小块", "油盐偏高浅尝"] },
  { name: "炸鸡", alias: [], category: "snack", kcal: 279, p: 18, f: 16, c: 16, fiber: 0.8, vitC: 0, calcium: 12, iron: 1, benefits: ["香脆的高蛋白", "油大浅尝辄止"] },
  { name: "薯条", alias: [], category: "snack", kcal: 298, p: 3.4, f: 15, c: 37, fiber: 3, vitC: 10, calcium: 15, iron: 0.8, benefits: ["土豆做的快乐碳水", "油炸浅尝"] },
  { name: "方便面", alias: ["泡面"], category: "staple", kcal: 473, p: 9, f: 21, c: 61, fiber: 1, vitC: 0, calcium: 38, iron: 3.4, benefits: ["应急管饱", "少喝汤减盐"] },
  { name: "麻辣烫", alias: [], category: "snack", kcal: 120, p: 7, f: 7, c: 6, fiber: 2, vitC: 15, calcium: 60, iron: 2, benefits: ["菜肉一锅自选", "清汤少油更健康"] },
  { name: "盖浇饭", alias: [], category: "staple", kcal: 180, p: 7, f: 6, c: 25, fiber: 1.5, vitC: 10, calcium: 30, iron: 1.5, benefits: ["一盒有菜有饭", "选清炒别太油"] },
  { name: "黄焖鸡米饭", alias: [], category: "staple", kcal: 190, p: 12, f: 8, c: 18, fiber: 1, vitC: 5, calcium: 20, iron: 1.8, benefits: ["鸡腿肉补蛋白", "汤油偏多撇掉点"] },
  { name: "螺蛳粉", alias: [], category: "staple", kcal: 247, p: 6, f: 8, c: 38, fiber: 1.5, vitC: 2, calcium: 40, iron: 2, benefits: ["重口解馋粉", "偶尔吃别当饭"] },

  // ===== 坚果籽类 =====
  { name: "瓜子", alias: ["葵花籽"], category: "snack", kcal: 602, p: 22, f: 53, c: 17, fiber: 8, vitC: 0, calcium: 72, iron: 5, benefits: ["嗑着解压的籽", "油大控量"],
    pairings: ["五香瓜子", "直接嗑"] },
  { name: "南瓜子", alias: [], category: "snack", kcal: 574, p: 30, f: 49, c: 15, fiber: 5, vitC: 0, calcium: 27, iron: 8.2, benefits: ["男人喜欢的补锌籽", "护前列"],
    pairings: ["盐焗南瓜子", "直接吃"] },
  { name: "芝麻", alias: ["黑芝麻"], category: "snack", kcal: 559, p: 18, f: 48, c: 24, fiber: 14, vitC: 0, calcium: 780, iron: 22.7, benefits: ["钙含量超高的籽", "撒粥撒面香"],
    pairings: ["芝麻糊", "芝麻酱"] },
  { name: "松子", alias: [], category: "snack", kcal: 698, p: 13, f: 71, c: 14, fiber: 4, vitC: 0, calcium: 3, iron: 4.3, benefits: ["香脆的高脂坚果", "补好脂肪"],
    pairings: ["松子玉米", "直接吃"] },

  // ===== 调味/其他 =====
  { name: "鸡蛋羹", alias: ["蒸蛋"], category: "protein", kcal: 90, p: 9, f: 5, c: 2, fiber: 0, vitC: 0, calcium: 40, iron: 1.2, benefits: ["软嫩好消化的蛋", "老人小孩都爱"] },
  { name: "皮蛋", alias: ["松花蛋"], category: "protein", kcal: 171, p: 14, f: 10, c: 5, fiber: 0, vitC: 0, calcium: 63, iron: 2.7, benefits: ["凉拌下粥有风味", "偶尔吃别多"] },
  { name: "咸菜", alias: ["泡菜", "酸菜"], category: "veg", kcal: 20, p: 1, f: 0.2, c: 3.5, fiber: 1, vitC: 0, calcium: 50, iron: 2, benefits: ["开胃小菜", "盐多糖少别常吃"] },
  { name: "土豆丝", alias: ["炒土豆丝"], category: "veg", kcal: 110, p: 2.2, f: 5, c: 14, fiber: 1.2, vitC: 12, calcium: 12, iron: 0.5, benefits: ["家常下饭菜", "少油版更健康"] },
  { name: "番茄炒蛋", alias: [], category: "veg", kcal: 95, p: 5, f: 6, c: 5, fiber: 0.8, vitC: 12, calcium: 40, iron: 1, benefits: ["国民下饭菜", "蛋+番茄双营养"] },

  // ===== 高频家常组合菜（带少量炒菜用油估算，命中即优先用准数据） =====
  {
    name: "辣椒炒肉", alias: ["辣椒炒肉片", "青椒炒肉"], category: "protein", kcal: 215, p: 22, f: 13, c: 6, fiber: 1.5, vitC: 60, calcium: 16, iron: 2.6, benefits: ["猪瘦肉补蛋白补铁", "青椒维C高开胃下饭"], image: "/food/cover-lajiao-chaorou.webp",
    cookTime: "约 15 分钟",
    difficulty: 1,
    ingredients: ["猪瘦肉 150g（约掌心大一块，先冻 20 分钟更好切）", "青椒 2 个（约 150g，或线椒 6~8 根）", "蒜 2 瓣", "生抽 2 勺（约 20ml）", "料酒 1 勺（约 10ml，腌肉去腥）", "盐 2g（约 1 小勺）", "油 10ml（约 2 小勺）", "淀粉 3g（约 1 小勺，腌肉嫩滑用）"],
    steps: [
      { text: "瘦肉先切薄片、再改刀切成细丝（肉冻 20 分钟稍硬更好切）。青椒对半切开、去籽去白瓤，切成和肉丝差不多长的细丝；蒜拍扁切碎。⚠️ 青椒白瓤是辣味的来源，怕辣一定去干净。", image: "/food/step-lajiao-chaorou-1.webp" },
      { text: "肉丝放碗里，加 1 勺生抽、1 勺料酒、3g 淀粉和一点点水，用手抓到发黏、表面挂上一层薄浆，腌 10 分钟。这一步叫“上浆”，能让肉丝炒出来嫩、不柴。", image: "/food/step-lajiao-chaorou-2.webp" },
      { text: "锅烧热（手放锅上方能明显感到热气）倒 5ml 油，中火下肉丝，用铲子快速划散，炒到肉丝变白、看不到粉红色就盛出备用。⚠️ 肉丝一变色就盛，在锅里多待 10 秒就老了。", image: "/food/step-lajiao-chaorou-3.webp" },
      { text: "锅里再倒 5ml 油，下蒜末和青椒丝，大火翻炒 1~2 分钟，炒到青椒变软、颜色更绿更亮、闻到香味。", image: "/food/step-lajiao-chaorou-4.webp" },
      { text: "把肉丝倒回锅里，加剩下的 1 勺生抽和 2g 盐，大火翻匀约 30 秒。盛之前尝一口，咸淡合适就出锅。配米饭开吃！", image: "/food/step-lajiao-chaorou-5.webp" },
    ],
  },
  {
    name: "青椒肉丝", alias: ["青椒炒肉丝"], category: "protein", kcal: 200, p: 21, f: 12, c: 5, fiber: 1.4, vitC: 55, calcium: 15, iron: 2.4, benefits: ["肉丝补蛋白", "青椒清脆维C满满"], image: "/food/cover-qingjiao-rousi.webp",
    cookTime: "约 15 分钟",
    difficulty: 1,
    ingredients: ["猪瘦肉 150g（先冻 20 分钟好切）", "青椒 2 个（约 150g）", "姜 2 片", "蒜 2 瓣", "生抽 2 勺（约 20ml）", "料酒 1 勺（约 10ml）", "盐 2g（约 1 小勺）", "油 10ml（约 2 小勺）", "淀粉 3g（约 1 小勺）"],
    steps: [
      { text: "瘦肉先切薄片再切细丝（冻硬一点更好切）。青椒去籽去白瓤切细丝；姜、蒜切细丝/碎。", image: "/food/step-qingjiao-rousi-1.webp" },
      { text: "肉丝加 1 勺生抽、1 勺料酒、3g 淀粉和少许水，抓到黏手、裹上薄浆，腌 10 分钟（上浆锁水，肉才嫩）。", image: "/food/step-qingjiao-rousi-2.webp" },
      { text: "锅烧热倒 5ml 油，中火下肉丝划散，炒到变白无粉红就盛出（⚠️ 变色即盛，别炒久）。", image: "/food/step-qingjiao-rousi-3.webp" },
      { text: "锅里补 5ml 油，下姜丝、蒜末和青椒丝大火炒 1 分钟，到青椒变软、颜色更亮还带脆。", image: "/food/step-qingjiao-rousi-4.webp" },
      { text: "倒回肉丝，加剩 1 勺生抽和 2g 盐，大火翻匀约 30 秒，尝味后出锅。青椒脆、肉丝嫩最好吃。", image: "/food/step-qingjiao-rousi-5.webp" },
    ],
  },
  {
    name: "红烧肉", alias: [], category: "protein", kcal: 380, p: 15, f: 30, c: 8, fiber: 0, vitC: 0, calcium: 12, iron: 1.8, benefits: ["五花肉香浓补能量", "偶尔解馋别常吃"], image: "/food/cover-hongshaorou.webp",
    cookTime: "约 50 分钟",
    difficulty: 2,
    ingredients: ["五花肉 400g（三层肥二层瘦最好）", "冰糖 24g（约 8 颗）", "生抽 2 勺（约 20ml）", "老抽 1 勺（约 10ml，上色）", "料酒 2 勺（约 20ml）", "姜 3 片", "葱 1 根（打结）", "八角 1 颗", "盐 3g（约 1.5 小勺）", "油 5ml（约 1 小勺）"],
    steps: [
      { text: "五花肉洗净切约 2 厘米见方块（麻将大小，切均匀才熟得一致）。冷水下锅加 1 勺料酒，大火煮开。⚠️ 必须冷水下锅，才能把血沫逼出来去腥；热水下锅肉会紧缩、腥味锁在里面。", image: "/food/step-hongshaorou-1.webp" },
      { text: "水开后撇去褐色浮沫，再煮 1 分钟捞出，用温水冲净沥干。⚠️ 别用冷水冲，肉遇冷收缩会发柴。", image: "/food/step-hongshaorou-2.webp" },
      { text: "锅烧热倒 5ml 油，下冰糖开最小火慢炒。融化后先冒大泡、再转小泡，颜色变成枣红色立刻下肉块。⚠️ 全程小火；糖到深褐色就发苦，颜色一到位马上倒肉。", image: "/food/step-hongshaorou-3.webp" },
      { text: "肉块翻炒裹上糖色，加姜片、葱结、八角、剩 1 勺料酒、2 勺生抽、1 勺老抽，翻匀炒出香味。", image: "/food/step-hongshaorou-4.webp" },
      { text: "倒热水没过肉（⚠️ 一定要热水，冷水会让肉变硬），大火烧开转最小火盖盖炖 40 分钟。中途水少就补热水。", image: "/food/step-hongshaorou-5.webp" },
      { text: "挑出葱姜八角，加 3g 盐，大火收汁到汤汁冒大泡、能挂在铲子上变稠时关火。⚠️ 收汁多翻动防粘底。肥肉透亮、瘦肉不柴即成功。", image: "/food/step-hongshaorou-6.webp" },
    ],
  },
  {
    name: "宫保鸡丁", alias: [], category: "protein", kcal: 230, p: 20, f: 12, c: 12, fiber: 1.2, vitC: 18, calcium: 20, iron: 1.6, benefits: ["鸡丁高蛋白", "花生增香补好脂肪"], image: "/food/cover-gongbao-jiding.webp",
    cookTime: "约 20 分钟",
    difficulty: 2,
    ingredients: ["鸡胸肉 200g", "花生米 30g（约 1 小把，生花生）", "干辣椒 6 个（怕辣减到 3 个）", "葱 1 根（大葱白）", "蒜 2 瓣", "姜 1 片", "生抽 2 勺（约 20ml）", "醋 1 勺（约 10ml，陈醋香）", "糖 6g（约 1.5 小勺）", "淀粉 3g（约 1 小勺）", "盐 1g（约半小勺）", "油 15ml（约 3 小勺）"],
    steps: [
      { text: "鸡胸肉切约 1.5 厘米小丁。放碗里加 1 勺生抽、3g 淀粉、1g 盐和少许水抓到黏手，腌 10 分钟（上浆让鸡丁嫩滑不出水）。葱白切小段；蒜、姜切碎；干辣椒剪小段、去籽可减少辣度。", image: "/food/step-gongbao-jiding-1.webp" },
      { text: "调碗汁：2 勺水 + 1 勺生抽 + 1 勺醋 + 6g 糖搅匀备用。⚠️ 汁先调好，下锅后翻炒快，没时间现调。", image: "/food/step-gongbao-jiding-2.webp" },
      { text: "花生米直接放锅里（不放油），开小火干焙，不停翻到表皮微黄、能听到轻微爆裂声、闻到香味盛出。⚠️ 小火慢焙，火大外面焦了里面还生；焙好放凉才脆。", image: "/food/step-gongbao-jiding-3.webp" },
      { text: "锅烧热倒 10ml 油，下干辣椒段和蒜姜末，小火炒到辣椒变成深红、闻到香辣味（⚠️ 别炒黑，会苦）。", image: "/food/step-gongbao-jiding-4.webp" },
      { text: "转中火下鸡丁，快速划散炒到全部变白、看不到粉红（约 1~2 分钟）。", image: "/food/step-gongbao-jiding-5.webp" },
      { text: "倒入碗汁和葱段，大火翻匀，汁会很快变稠裹住鸡丁。关火撒花生米翻两下出锅。酸甜微辣、花生脆香最下饭。", image: "/food/step-gongbao-jiding-6.webp" },
    ],
  },
  {
    name: "鱼香肉丝", alias: [], category: "protein", kcal: 195, p: 18, f: 11, c: 9, fiber: 1.5, vitC: 20, calcium: 18, iron: 2, benefits: ["肉丝木耳冬笋搭配", "酸甜下饭有蔬菜"], image: "/food/cover-yuxiang-rousi.webp",
    cookTime: "约 20 分钟",
    difficulty: 2,
    ingredients: ["猪瘦肉 150g", "木耳 6 朵（干木耳约 8g 泡发）", "胡萝卜 半根（约 80g，代替冬笋更常见）", "蒜 2 瓣", "姜 1 片", "生抽 2 勺（约 20ml）", "醋 1 勺（约 10ml，陈醋）", "糖 6g（约 1.5 小勺）", "淀粉 3g（约 1 小勺）", "盐 1g（约半小勺）", "油 15ml（约 3 小勺）"],
    steps: [
      { text: "干木耳提前用温水泡发（约 30 分钟），洗净去硬蒂切细丝。瘦肉切细丝；胡萝卜去皮切细丝；蒜、姜切碎。", image: "/food/step-yuxiang-rousi-1.webp" },
      { text: "肉丝加 1 勺生抽、3g 淀粉、1g 盐抓到黏手，腌 10 分钟（上浆嫩滑）。另调鱼香汁：2 勺水 + 1 勺生抽 + 1 勺醋 + 6g 糖搅匀备用。", image: "/food/step-yuxiang-rousi-2.webp" },
      { text: "锅烧热倒 8ml 油，中火下肉丝快速划散，炒到变白无粉红就盛出（⚠️ 变色即盛，别老）。", image: "/food/step-yuxiang-rousi-3.webp" },
      { text: "锅里补 7ml 油，下蒜姜末爆香，倒胡萝卜丝和木耳丝大火炒 1~2 分钟，到胡萝卜变软、木耳发出轻微噼啪声。", image: "/food/step-yuxiang-rousi-4.webp" },
      { text: "肉丝回锅，倒入鱼香汁大火翻匀，汁很快变稠裹住食材。⚠️ 全程大火快炒，炒久蔬菜出水就不脆了。盛出，酸甜味带姜蒜香，没有鱼却有“鱼香”。", image: "/food/step-yuxiang-rousi-5.webp" },
    ],
  },
  {
    name: "土豆烧牛肉", alias: ["土豆炖牛肉"], category: "protein", kcal: 245, p: 22, f: 11, c: 16, fiber: 2, vitC: 14, calcium: 22, iron: 3, benefits: ["牛肉补铁补蛋白", "土豆顶饱还补维C"], image: "/food/cover-tudou-niurou.webp",
    cookTime: "约 45 分钟",
    difficulty: 2,
    ingredients: ["牛腩 250g（带点筋更软糯）", "土豆 1 个（约 150g）", "胡萝卜 半根", "姜 3 片", "葱 1 根", "生抽 2 勺（约 20ml）", "料酒 2 勺（约 20ml）", "盐 3g（约 1.5 小勺）", "油 10ml（约 2 小勺）", "八角 1 颗（可选）"],
    steps: [
      { text: "牛腩切约 2.5 厘米块（稍大，炖后会缩）。冷水下锅加 1 勺料酒，大火煮开撇去褐色浮沫，再煮 1 分钟捞出温水冲净。⚠️ 冷水下锅去血沫去腥；土豆去皮切滚刀块（不规则块易入味），胡萝卜同样切块。", image: "/food/step-tudou-niurou-1.webp" },
      { text: "锅烧热倒 10ml 油，下姜片、葱段、八角爆香，放牛肉块中火翻炒到表面微焦、香味出来。", image: "/food/step-tudou-niurou-2.webp" },
      { text: "加 2 勺生抽、剩 1 勺料酒炒匀，倒热水没过牛肉（⚠️ 热水，冷水让肉变硬），大火烧开转最小火盖盖炖 30 分钟。", image: "/food/step-tudou-niurou-3.webp" },
      { text: "30 分钟后挑出葱姜八角，放土豆、胡萝卜块，继续小火炖 15 分钟，到土豆用筷子一戳就透、胡萝卜软糯。", image: "/food/step-tudou-niurou-4.webp" },
      { text: "加 3g 盐，开大火收汁到汤汁变少变稠、能挂在食材上。⚠️ 收汁多翻动别糊底。牛肉软乎、土豆一夹就烂即可出锅。", image: "/food/step-tudou-niurou-5.webp" },
    ],
  },
  {
    name: "西红柿炒鸡蛋", alias: ["番茄炒蛋"], category: "veg", kcal: 95, p: 5, f: 6, c: 5, fiber: 0.8, vitC: 12, calcium: 40, iron: 1, benefits: ["国民下饭菜", "蛋+番茄双营养"], image: "/food/cover-xihongshi-jidan.webp",
    cookTime: "约 10 分钟",
    difficulty: 1,
    ingredients: ["番茄 2 个（约 200g，选红软的更出汁）", "鸡蛋 2 个", "盐 2g（约 1 小勺，分两次用）", "糖 4g（约 1 小勺，提鲜去酸）", "油 15ml（约 3 小勺，分两次用）"],
    steps: [
      { text: "番茄顶部划十字，放碗里浇开水烫 1 分钟，皮起皱就能撕掉（⚠️ 去皮口感更细，不去也行）。去蒂切小块，块越小越容易炒出汁。", image: "/food/step-xihongshi-jidan-1.webp" },
      { text: "鸡蛋磕碗里，加 1g 盐，用筷子顺一个方向打散到起均匀小泡（气泡多炒出来更蓬松）。", image: "/food/step-xihongshi-jidan-2.webp" },
      { text: "锅烧热倒 8ml 油，油稍热（手放上方感到热、还没冒烟）倒蛋液，别动，等底部凝固再用铲子划成大块，盛出。⚠️ 蛋液一凝固就盛，炒老就柴。", image: "/food/step-xihongshi-jidan-3.webp" },
      { text: "锅里补 7ml 油，下番茄中火翻炒，用铲子轻压出红汁，炒到番茄变软成糊状、汤汁变多。加 4g 糖提鲜去酸。", image: "/food/step-xihongshi-jidan-4.webp" },
      { text: "鸡蛋回锅，加剩 1g 盐，大火翻匀约 30 秒让蛋吸饱汤汁。⚠️ 翻匀即可别久炒，蛋会老。盛出，汤汁拌饭绝了。", image: "/food/step-xihongshi-jidan-5.webp" },
    ],
  },
  {
    name: "清炒西兰花", alias: ["蒜蓉西兰花"], category: "veg", kcal: 70, p: 5, f: 4, c: 6, fiber: 2, vitC: 48, calcium: 60, iron: 1, benefits: ["西兰花维C冠军", "少油清炒热量低"], image: "/food/cover-qingchao-xilanhua.webp",
    cookTime: "约 8 分钟",
    difficulty: 1,
    ingredients: ["西兰花 1 棵（约 200g）", "蒜 3 瓣", "盐 2g（约 1 小勺）", "油 10ml（约 2 小勺）"],
    steps: [
      { text: "西兰花掰成小朵（朵小易熟易入味）。放淡盐水泡 5 分钟，再冲两遍，去掉缝隙里的小虫子和灰尘。蒜切碎。", image: "/food/step-qingchao-xilanhua-1.webp" },
      { text: "烧一锅开水，加几滴油（保色），西兰花下锅焯 30~40 秒，颜色变深绿立刻捞出浸凉水。⚠️ 焯水时间短，久了发黄变软；过凉能锁住脆绿。", image: "/food/step-qingchao-xilanhua-2.webp" },
      { text: "锅烧热倒 10ml 油，下蒜末开小火炒到微黄出香味（⚠️ 蒜末小火，大火易糊发苦）。", image: "/food/step-qingchao-xilanhua-3.webp" },
      { text: "倒西兰花大火快炒 1 分钟，加 2g 盐翻匀出锅。⚠️ 全程大火快炒保持脆绿，炒久出水就不脆了。", image: "/food/step-qingchao-xilanhua-4.webp" },
    ],
  },
  {
    name: "麻婆豆腐", alias: [], category: "protein", kcal: 160, p: 11, f: 11, c: 7, fiber: 1.2, vitC: 1, calcium: 150, iron: 2.5, benefits: ["豆腐植物蛋白补钙", "微微麻辣开胃"], image: "/food/cover-mapo-doufu.webp",
    cookTime: "约 15 分钟",
    difficulty: 2,
    ingredients: ["嫩豆腐 1 盒（约 300g）", "猪瘦肉末 50g", "豆瓣酱 15g（约 1 勺，剁细更出红油）", "蒜 2 瓣（切末）", "姜 1 片（切末）", "花椒粉 1g（约半小勺）", "葱花 少许", "生抽 1 勺（约 10ml）", "淀粉 6g（约 2 小勺，加水调水淀粉）", "油 15ml（约 3 小勺）", "盐 1g（约半小勺，豆瓣酱咸，少放）"],
    steps: [
      { text: "嫩豆腐切约 2 厘米块，放淡盐水里泡 5 分钟（⚠️ 盐水浸泡让豆腐更结实不易碎，也去豆腥）。肉末、蒜末、姜末备好；淀粉加 2 勺水调成水淀粉。", image: "/food/step-mapo-doufu-1.webp" },
      { text: "锅烧热倒 10ml 油，下肉末中火炒到变色散开，加豆瓣酱、蒜末、姜末小火炒出红油、闻到香味（⚠️ 豆瓣酱小火慢炒才香，大火易糊发苦）。", image: "/food/step-mapo-doufu-2.webp" },
      { text: "加 1 勺生抽和约半碗热水烧开，用锅铲背面轻轻推（别用铲子铲），把豆腐块滑入锅中。⚠️ 用背面推、不翻炒，豆腐才完整不碎。", image: "/food/step-mapo-doufu-3.webp" },
      { text: "小火煮 3~4 分钟让豆腐入味。分两次淋入水淀粉，每次都用背面推匀，汤汁变稠能挂在豆腐上即可（⚠️ 别一次倒完，会结块）。", image: "/food/step-mapo-doufu-4.webp" },
      { text: "关火撒花椒粉和葱花。⚠️ 花椒粉最后放香气才足。麻麻辣辣、嫩滑拌饭一绝。", image: "/food/step-mapo-doufu-5.webp" },
    ],
  },
  {
    name: "茄子烧土豆", alias: [], category: "veg", kcal: 140, p: 3, f: 8, c: 16, fiber: 3, vitC: 18, calcium: 20, iron: 1, benefits: ["茄子土豆双主食感", "少油版顶饱不腻"], image: "/food/cover-xianggu-qingcai.webp",
    cookTime: "约 20 分钟",
    difficulty: 1,
    ingredients: ["茄子 1 根（约 200g，选紫皮长茄）", "土豆 1 个（约 150g）", "蒜 3 瓣", "生抽 2 勺（约 20ml）", "盐 2g（约 1 小勺）", "油 20ml（约 4 小勺）", "葱 1 根（可选）"],
    steps: [
      { text: "茄子切滚刀块（不规则块易入味），土豆去皮切比茄子略小的块（⚠️ 土豆块小一点才能和茄子同时熟）。蒜切碎、葱切小段。" },
      { text: "茄子块撒 1g 盐抓匀腌 5 分钟，挤掉渗出的水。⚠️ 盐腌能杀出水分，茄子炒的时候就不那么吸油、不易变黑。" },
      { text: "锅烧热倒 10ml 油，下土豆块中小火煎到四面微黄、边缘透明（约 3 分钟），先盛出。⚠️ 土豆先煎一下再焖才糯而不散。" },
      { text: "锅里补 10ml 油，下蒜末炒香，放茄子块中火翻炒到变软、颜色变深、出香味（约 3 分钟）。" },
      { text: "土豆回锅，加 2 勺生抽和剩 1g 盐翻匀，加 2 勺水，盖盖小火焖 3 分钟，到土豆用筷子一戳就透、茄子软糯。开盖大火收一下汁出锅。土豆糯、茄子软，拌饭香。" },
    ],
  },
  {
    name: "香菇炒青菜", alias: ["香菇炒油菜"], category: "veg", kcal: 65, p: 3.5, f: 4, c: 6, fiber: 2.5, vitC: 30, calcium: 90, iron: 1.5, benefits: ["菌菇提鲜配绿叶菜", "低卡清炒常吃不胖"], image: "/food/cover-xianggu-qingcai.webp",
    cookTime: "约 8 分钟",
    difficulty: 1,
    ingredients: ["青菜 或 油菜 1 把（约 200g）", "干香菇 5 朵（约 10g，泡发）或鲜香菇 6 朵", "蒜 2 瓣", "生抽 1 勺（约 10ml）", "盐 2g（约 1 小勺）", "油 10ml（约 2 小勺）"],
    steps: [
      { text: "青菜/油菜一片片掰开洗净，菜梗菜叶分开（菜梗厚、先下锅）；干香菇温水泡发 30 分钟，挤干切薄片（泡香菇的水别倒，沉淀后留用更鲜）；蒜切碎。" },
      { text: "锅烧热倒 10ml 油，下蒜末和香菇片中火炒 1 分钟，到香菇变软、香味出来。⚠️ 香菇先炒干水汽才香。" },
      { text: "先下菜梗大火炒 30 秒，再下菜叶，加 1 勺生抽和 2g 盐快速翻匀。⚠️ 菜梗比叶厚，先炒梗叶才一起熟，不会梗生叶烂。" },
      { text: "炒到菜叶塌软、颜色更绿还带脆（约 1 分钟）立刻出锅。⚠️ 别炒久，青菜出水发黄就不脆甜了。清爽鲜甜一盘光。" },
    ],
  },
  {
    name: "洋葱炒蛋", alias: [], category: "veg", kcal: 130, p: 7, f: 9, c: 6, fiber: 1.2, vitC: 10, calcium: 40, iron: 1.2, benefits: ["洋葱炒蛋快手嫩滑", "孩子也爱吃的下饭蛋"], image: "/food/cover-xianggu-qingcai.webp",
    cookTime: "约 8 分钟",
    difficulty: 1,
    ingredients: ["洋葱 半个（约 100g）", "鸡蛋 2 个", "盐 2g（约 1 小勺，分两次用）", "油 15ml（约 3 小勺，分两次用）"],
    steps: [
      { text: "洋葱对半切开、剥皮切细丝（⚠️ 切洋葱前把刀沾点水、或冷藏 10 分钟，能少熏眼睛）。鸡蛋磕碗里加 1g 盐，顺一个方向打散到起小泡。" },
      { text: "锅烧热倒 8ml 油，油稍热倒蛋液，等底部凝固用铲子划成大块，盛出。⚠️ 蛋一凝固就盛，炒老发柴。" },
      { text: "锅里补 7ml 油，下洋葱丝中火炒 2~3 分钟，到洋葱变透明、边缘微焦、闻着发甜（⚠️ 炒透才甜，半生会有辛辣味）。" },
      { text: "鸡蛋回锅，加剩 1g 盐大火翻匀约 30 秒出锅。洋葱甜、鸡蛋嫩，配粥配饭都行。" },
    ],
  },
]

/** 按名称（含别名）模糊匹配常见食物库 */
export function matchCommonFood(input: string): CommonFood | undefined {
  const trimmed = input.trim()
  const q = trimmed.toLowerCase()
  if (!q) return undefined
  // 优先精确匹配（完整菜名）
  return (
    COMMON_FOODS.find((f) => f.name === trimmed) ||
    // 精确别名匹配
    COMMON_FOODS.find((f) => (f.alias ?? []).some((a) => a === trimmed)) ||
    // 包含匹配，但优先长名称（完整菜名优先于食材）
    COMMON_FOODS
      .filter((f) => f.name.includes(trimmed) || (f.alias ?? []).some((a) => a.includes(trimmed)))
      .sort((a, b) => b.name.length - a.name.length)[0] ||
    // 最后是模糊匹配
    COMMON_FOODS.find((f) => (f.alias ?? []).some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) ||
    COMMON_FOODS.find((f) => f.name.toLowerCase().includes(q))
  )
}

/**
 * 常见食物「一份」大约多重（克），用于把"1根/1个/1碗"换算成克数。
 * 没列出的食物按 100g 计。
 */
export const PORTION_G: Record<string, number> = {
  胡萝卜: 120, 苹果: 200, 香蕉: 120, 橙子: 150, 猕猴桃: 75, 草莓: 15, 梨: 200,
  桃子: 175, 葡萄: 15, 西瓜: 200, 蓝莓: 10, 火龙果: 150, 芒果: 200, 菠萝: 120,
  木瓜: 200, 柚子: 200, 柠檬: 50, 樱桃: 8, 荔枝: 20, 龙眼: 12, 石榴: 150, 杨梅: 15,
  山楂: 20, 牛油果: 200, 椰子: 100,
  番茄: 120, 黄瓜: 200, 土豆: 150, 茄子: 200, 青椒: 100, 冬瓜: 200, 南瓜: 200,
  芹菜: 100, 生菜: 100, 油麦菜: 100, 菠菜: 100, 白菜: 200, 西兰花: 150,
  蘑菇: 100, 木耳: 10, 洋葱: 100, 豆腐: 100, 豆芽: 100,
  米饭: 150, 馒头: 100, 面条: 200, 燕麦: 40, 全麦面包: 35, 小米: 40, 玉米: 200,
  红薯: 150, 紫薯: 150, "面包": 35, 年糕: 100, 包子: 100, 饺子: 20, 烧麦: 30,
  意大利面: 150, 粉条: 50,
  鸡蛋: 50, 鸡胸肉: 120, 牛肉: 100, 猪瘦肉: 100, 鱼肉: 100, 虾: 50, 牛奶: 240,
  酸奶: 200, 豆浆: 250, "豆腐干": 50, 腐竹: 20, 千张: 50, 毛豆: 100,
  核桃: 15, 花生: 20, 杏仁: 20, 腰果: 20, 开心果: 20, 巧克力: 20, 瓜子: 10,
  南瓜子: 10, 芝麻: 5, 松子: 10,
  汉堡: 150, 披萨: 100, 炸鸡: 100, 薯条: 80, 方便面: 80, 麻辣烫: 300, 盖浇饭: 350,
  黄焖鸡米饭: 400, 螺蛳粉: 350,
}

export type ParsedFood = {
  food: CommonFood
  grams: number
  /** 用户输入里解析出的原始描述，例如 "40g" / "1根" */
  rawPortion: string
}

export type ComboSplit = {
  /** 拆出的各个单品（含克数） */
  foods: ParsedFood[]
  /** 命中单品名，如 ["猪瘦肉", "青椒"] */
  names: string[]
  /** 累加总营养 */
  total: ReturnType<typeof computeNutrients>
}

/**
 * 解析用户随意输入，例如：
 *  "40g 牛肉" / "牛肉40g" / "1根胡萝卜" / "半碗米饭" / "2个鸡蛋" / "胡萝卜"
 * 返回命中的食物 + 实际克数。
 */
export function parseFoodInput(input: string): ParsedFood | undefined {
  const text = input.trim()
  if (!text) return undefined

  // 先匹配食物名（从长到短，避免"米"先匹配到"米饭"）
  const candidates = COMMON_FOODS
    .filter((f) => text.includes(f.name) || (f.alias ?? []).some((a) => text.includes(a)))
    .sort((a, b) => b.name.length - a.name.length)
  const food = candidates[0]
  if (!food) return undefined

  const foodName = food.name

  // 解析数量 + 单位
  // 1) 显式克数：40g / 40克 / 40 G
  const gMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|克|G)/)
  if (gMatch) {
    return { food, grams: Number(gMatch[1]), rawPortion: gMatch[0] }
  }

  // 2) 分数/小数 + 份量词：半碗 / 1.5碗 / 2个 / 3根 / 1块 / 1片 / 1杯 / 1条
  const unitMatch = text.match(/(\d+(?:\.\d+)?|半|两)\s*(碗|个|根|块|片|杯|条|只|颗|颗|瓣|只|份)/)
  if (unitMatch) {
    let n = 1
    if (unitMatch[1] === "半") n = 0.5
    else if (unitMatch[1] === "两") n = 2
    else n = Number(unitMatch[1])
    const unit = unitMatch[2]
    const base = PORTION_G[foodName] ?? 100
    // 碗/杯 用 PORTION_G 里对应的值（米饭150等），根/个 也用 PORTION_G
    return { food, grams: Math.round(base * n), rawPortion: unitMatch[0] }
  }

  // 3) 只写了数量词没单位（如"2胡萝卜"）→ 按"个"算
  const numOnly = text.match(/^(\d+(?:\.\d+)?|半|两)\s*/)
  if (numOnly && numOnly[0].length < text.length) {
    let n = 1
    if (numOnly[1] === "半") n = 0.5
    else if (numOnly[1] === "两") n = 2
    else n = Number(numOnly[1])
    const base = PORTION_G[foodName] ?? 100
    return { food, grams: Math.round(base * n), rawPortion: numOnly[0].trim() }
  }

  // 4) 只写食物名 → 默认一份
  const base = PORTION_G[foodName] ?? 100
  return { food, grams: base, rawPortion: "1份" }
}

/** 按克数计算实际摄入的营养 */
export function computeNutrients(food: CommonFood, grams: number) {
  const r = grams / 100
  return {
    kcal: Math.round(food.kcal * r),
    p: Math.round(food.p * r * 10) / 10,
    f: Math.round(food.f * r * 10) / 10,
    c: Math.round(food.c * r * 10) / 10,
    fiber: Math.round((food.fiber ?? 0) * r * 10) / 10,
    vitC: Math.round((food.vitC ?? 0) * r * 10) / 10,
    calcium: Math.round((food.calcium ?? 0) * r * 10) / 10,
    iron: Math.round((food.iron ?? 0) * r * 10) / 10,
  }
}

/**
 * 组合菜智能拆分：从输入文本里提取多个已知单品，各自按默认份量算营养后相加。
 * 用于"辣椒炒肉"这类既非整段套餐、也非单品的组合名。
 * 注意：只按食材本身估算，不含烹饪油盐，UI 需标注"估算·不含油盐"。
 */
export function splitComboFood(input: string): ComboSplit | undefined {
  const text = input.trim()
  if (!text) return undefined

  // 从长到短排序，避免"米"先匹配到"米饭"而吞掉"辣椒"
  const matched = COMMON_FOODS.filter(
    (f) => text.includes(f.name) || (f.alias ?? []).some((a) => text.includes(a)),
  ).sort((a, b) => b.name.length - a.name.length)

  if (matched.length === 0) return undefined

  const foods: ParsedFood[] = matched.map((food) => {
    const grams = PORTION_G[food.name] ?? 100
    return { food, grams, rawPortion: "1份" }
  })

  const total = foods.reduce(
    (acc, { food, grams }) => {
      const n = computeNutrients(food, grams)
      return {
        kcal: acc.kcal + n.kcal,
        p: Math.round((acc.p + n.p) * 10) / 10,
        f: Math.round((acc.f + n.f) * 10) / 10,
        c: Math.round((acc.c + n.c) * 10) / 10,
        fiber: Math.round((acc.fiber + n.fiber) * 10) / 10,
        vitC: Math.round((acc.vitC + n.vitC) * 10) / 10,
        calcium: Math.round((acc.calcium + n.calcium) * 10) / 10,
        iron: Math.round((acc.iron + n.iron) * 10) / 10,
      }
    },
    { kcal: 0, p: 0, f: 0, c: 0, fiber: 0, vitC: 0, calcium: 0, iron: 0 },
  )

  return { foods, names: matched.map((f) => f.name), total }
}
