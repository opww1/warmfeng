'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, BookOpen } from 'lucide-react'
import { 
  MoodIcon, 
  MOOD_COLORS, 
  MOOD_OPTIONS, 
  MOOD_LABELS, 
  getTodayKey,
  type MoodSymbol 
} from '@/lib/moods'

/**
 * 首页功能性卡片：实时时间 + 今天心情如何
 * 心情图标已统一为心迹的手绘 SVG 风格
 * 点击心情卡片可跳转到心迹页面
 */

// 心情映射：将心迹的 5 种心情映射到首页的情绪场景
// 每个心情提供 20 组不重样文案（现代 / 古代 / 外国混搭），按当天日期自动轮换
// 文案原则：治愈、陪伴、无压力，不出现任何带任务感或催促意味的句子
const HOME_MOOD_META: Record<MoodSymbol, { label: string; comfort: string; replies: { line: string; tip: string }[] }> = {
  leaf: {
    label: '平静',
    replies: [
      { line: '平静的你，像午后慢慢舒展的叶子。', tip: '就这样待着，什么都不必做。' },
      { line: '风停下来的时候，世界也跟着温柔了。', tip: '听一听没有歌词的曲子也挺不错。' },
      { line: '行到水穷处，坐看云起时。', tip: '走到哪儿算哪儿，也挺好。' },
      { line: '清凉的夜里，心也跟着静了下来。', tip: '把灯调暗一点，更舒服。' },
      { line: '若无闲事挂心头，便是人间好时节。', tip: '今天没什么要操心的，就很好。' },
      { line: '慢慢来，时间愿意陪你一起走。', tip: '泡杯热茶，看着它一点点凉下来。' },
      { line: '采菊东篱下，悠然见南山。', tip: '抬头看看窗外，嗯..也挺自在。' },
      { line: '安静不是空白，是你给了自己空间。', tip: '这样吧，发会儿呆哈哈。' },
      { line: '你可以像湖水一样，安安静静地待着。', tip: '不用赶什么，水面自己会平。' },
      { line: '空山不见人，但闻人语响。', tip: '有声音，却一点也不吵，挺好。' },
      { line: '把心放轻一点，今天就没有那么重了。', tip: '像坐在云上，挺松松。' },
      { line: '海明威曾说：平静的海面，也能托起整片天。', tip: '不喧哗，也很有力量。' },
      { line: '晚风轻轻的，把白天的皱褶都抚平了。', tip: '吹吹风，感受大自然的拥抱。' },
      { line: '蝉噪林逾静，鸟鸣山更幽。', tip: '有声音陪着，反而更安宁。' },
      { line: '你就这样存在，已经足够好了。', tip: '不需要证明什么。' },
      { line: '雪小禅曾说：慢下来，才能听见自己的心跳。', tip: '把手放在心口，感受一下。' },
      { line: '春有百花秋有月，夏有凉风冬有雪。', tip: '每个季节，都有自己的安稳。' },
      { line: '让思绪像云一样飘过去，不必抓住。', tip: '想什么随它去吧，别留着。' },
      { line: '里尔克曾说：有何胜利可言，挺住意味着一切。', tip: '只是静静地待着，也是一种力量。' },
      { line: '心若不动，风又奈何。', tip: '今天，风也吹不动你。' },
      { line: '云在青天水在瓶。', tip: '各安其位，就是自在~' },
      { line: '深吸一口气，再慢慢吐出来。', tip: '反复几次，心就稳了。' },
      { line: '木心曾说：从前的锁也好看，钥匙精美有样子。', tip: '慢下来的东西，都好看。' },
      { line: '雾散了，山还在那里，不增不减。', tip: '你也是，安稳如初。' },
      { line: '王维曾说：明月松间照，清泉石上流。', tip: '干净的画面，最养人。' },
      { line: '什么都不想解决，也挺好。', tip: '问题可以等等你。' },
      { line: '纪德曾说：安静，是灵魂的一种力量。', tip: '不说话的时候，你在充电。' },
      { line: '月光落在窗台，像谁轻轻拍了拍你。', tip: '被夜安抚着，睡吧。' },
      { line: '心平气和，便是最好的天气。', tip: '不用晴，也不用雨。' },
    ],
    comfort: '光是坐在这里，你就已经把自己照顾得很好了。',
  },
  tea: {
    label: '闲适',
    replies: [
      { line: '真好呀，这一刻的光亮值得被记住。', tip: '就这么放着，不用记也行。' },
      { line: '什么都不赶，就这么虚度一下午。', tip: '把手机放远一点，世界不会跑掉。' },
      { line: '偷得浮生半日闲。', tip: '偷来的清闲，最是珍贵。' },
      { line: '舒服的日子，就是不用解释的日子。', tip: '想不出理由，也照样舒服。' },
      { line: '晴窗细乳戏分茶。', tip: '给自己倒杯茶，慢慢喝。' },
      { line: '慵懒也是一种认真生活的方式。', tip: '晒晒太阳，让影子陪你发呆。' },
      { line: '从前的日色变得慢，车马邮件都慢。', tip: '今天也可以慢一点。' },
      { line: '几时归去，作个闲人。', tip: '哪怕只是想想，也挺松快。' },
      { line: '翻本旧书，从任意一页开始读。', tip: '读不读完，都随便。' },
      { line: '且将新火试新茶，诗酒趁年华。', tip: '趁着好天气，犒劳下自己。' },
      { line: '什么都不安排的时间，最奢侈。', tip: '今天就把空白留着。' },
      { line: '梭罗曾说：我步入丛林，因为我希望生活得从容。', tip: '从容，比忙碌更像活着。' },
      { line: '闲看庭前花开花落。', tip: '花自己开，你看着就好。' },
      { line: '午后的阳光懒懒的，正适合什么都不做。', tip: '瘫一会儿，没人笑话你。' },
      { line: '因过竹院逢僧话，又得浮生半日闲。', tip: '聊个天，日子就轻了。' },
      { line: '把节奏调慢，舒服自然会追上你。', tip: '不用追，它自己会来。' },
      { line: '王尔德曾说：做你自己，因为别人都有人做了。', tip: '闲着，也是独一无二的你。' },
      { line: '小舟从此逝，江海寄余生。', tip: '随它去，也是一种自在。' },
      { line: '发呆的时候，世界替你运转。', tip: '你歇着，天不会塌。' },
      { line: '枕上诗书闲处好。', tip: '靠在枕上翻两页，刚好。' },
      { line: '荷笠带斜阳，青山独归远。', tip: '一个人走，也挺自在。' },
      { line: '泡个脚，让一整天的累沉进水里。', tip: '热气腾腾，最解乏。' },
      { line: '汪曾祺曾说：四方食事，不过一碗人间烟火。', tip: '好好吃顿饭，就是大事。' },
      { line: '风过疏竹，雁渡寒潭，过后无痕。', tip: '经历过了，不必留住。' },
      { line: '找个舒服的姿势，瘫着发会儿神。', tip: '身体松了，心也跟着松。' },
      { line: '张岱曾说：人无癖不可与交，以其无深情也。', tip: '有点小嗜好，很可爱。' },
      { line: '窗外的云慢慢走，你也不必急。', tip: '跟着云的节奏就好。' },
      { line: '无事此静坐，一日似两日。', tip: '什么都不干，时间反而厚了。' },
      { line: '蒙田曾说：最辉煌的业绩，也不如悠闲地度过一生。', tip: '闲着，也是种成就。' },
    ],
    comfort: '什么都不赶的这段时光，是给自己最好的礼物。',
  },
  star: {
    label: '憧憬',
    replies: [
      { line: '心里有光的人，连等待都好看。', tip: '怀揣着念想，就很好。' },
      { line: '明天还在路上，正慢慢朝你走来。', tip: '不用着急，它自己会到。' },
      { line: '长风破浪会有时，直挂云帆济沧海。', tip: '风会起来的，到时再说。' },
      { line: '带着希望醒来，本身就是礼物。', tip: '光是期待，就够暖了。' },
      { line: '想要的东西，正在朝你慢慢靠近。', tip: '不用追，等它来。' },
      { line: '会当凌绝顶，一览众山小。', tip: '先望着就好，路自己会铺开。' },
      { line: '你心里种的种子，正在悄悄发芽。', tip: '不用天天看，它自己长。' },
      { line: '海子曾说：面朝大海，春暖花开。', tip: '想着那画面，心就亮了。' },
      { line: '未来像一封还没拆的信。', tip: '好奇就好，不必急着拆。' },
      { line: '俱怀逸兴壮思飞，欲上青天揽明月。', tip: '敢想，已经很美了。' },
      { line: '慢慢攒着的小期待，最让人安心。', tip: '放在心里，不用宣之于口。' },
      { line: '纪伯伦曾说： Work is love made visible。', tip: '喜欢的事，做着就像在爱。' },
      { line: '星光不问赶路人，时光不负有心人。', tip: '你走着，夜就亮着。' },
      { line: '山高自有客行路，水深自有渡船人。', tip: '路总有的，别慌。' },
      { line: '把愿望轻轻放在明天的口袋里。', tip: '不用掏出来，带着就行。' },
      { line: '泰戈尔曾说：如果你因为错过了太阳而流泪，你也将错过群星。', tip: '抬头看看，星还在。' },
      { line: '大鹏一日同风起，扶摇直上九万里。', tip: '愿你心里，一直有那只鸟。' },
      { line: '好事正一件件，排着队来见你。', tip: '不催，它们会到。' },
      { line: '苏轼曾说：但愿人长久，千里共婵娟。', tip: '隔着远方，也有人想着你。' },
      { line: '你眼里的光，比远方的灯还暖。', tip: '带着它，路就不黑。' },
      { line: '沉舟侧畔千帆过，病树前头万木春。', tip: '旧的去了，新的会来。' },
      { line: '把小愿望写进风里，风会替你捎走。', tip: '说出口，就轻了。' },
      { line: '黑塞曾说：鸟要挣脱出壳，蛋就是世界。', tip: '你正在破壳，别急。' },
      { line: '野旷天低树，江清月近人。', tip: '空旷处，月亮离你很近。' },
      { line: '明天的惊喜，正在路上打包。', tip: '不用催快递。' },
      { line: '波德莱尔曾说：给我烟、酒和梦，其余免谈。', tip: '有点小念想，日子就亮。' },
      { line: '潮平两岸阔，风正一帆悬。', tip: '顺的时候，就好好享受。' },
      { line: '你正在成为想要成为的人，慢慢来。', tip: '路上本身就好看。' },
      { line: '普希金曾说：心儿永远向往着未来。', tip: '向往着，就够甜了。' },
    ],
    comfort: '心里装着期待的人，今天也被期待着。',
  },
  sun: {
    label: '温暖',
    replies: [
      { line: '温暖的光，洒在你的心上。', tip: '就这么暖着，不用谢谁。' },
      { line: '被惦记的感觉，比晴天还暖。', tip: '知道有人想着，就够了。' },
      { line: '晚来天欲雪，能饮一杯无。', tip: '有人邀你，就是福气。' },
      { line: '你散发出的暖意，别人也收到了。', tip: '不用刻意，自然的就好。' },
      { line: '小小的好事，正在悄悄发生。', tip: '不用找，它自己会出现。' },
      { line: '绿蚁新醅酒，红泥小火炉。', tip: '有个暖处待着，真舒服。' },
      { line: '像被阳光抱住一样，安心地待着。', tip: '缩一缩，更暖了。' },
      { line: '家人闲坐，灯火可亲。', tip: '有光有伴，便是好时候。' },
      { line: '一句简单的问候，也能焐热一整天。', tip: '收到就好，不必回得多认真。' },
      { line: '谁言寸草心，报得三春晖。', tip: '被爱着，就是最大的暖。' },
      { line: '今天对自己温柔一点，也没关系。', tip: '纵容下自己，天不会塌。' },
      { line: '奥斯汀曾说：有生日烛光的地方，就有家。', tip: '心里亮着，就不冷。' },
      { line: '围炉煮茶，听雪落下的声音。', tip: '热闹不必多，有点就行。' },
      { line: '你笑起来的时候，房间都亮了。', tip: '多笑几次，也不费电。' },
      { line: '灯火阑珊处，总有一盏为你留着。', tip: '走累了，回头看看。' },
      { line: '罗曼·罗兰曾说：世上只有一种英雄主义，是认清生活后依然爱它。', tip: '你还愿意暖，就很了不起。' },
      { line: '寒夜客来茶当酒。', tip: '有人来，茶也成了酒。' },
      { line: '把这件事收进心里的暖口袋。', tip: '冷的时候，掏出来看看。' },
      { line: '相顾无言，惟有泪千行，也是种被懂。', tip: '不说话，也暖。' },
      { line: '愿君此去，一路皆有春风。', tip: '风会替我，陪着你。' },
      { line: '桃花潭水深千尺，不及汪伦送我情。', tip: '有人送，路就不冷。' },
      { line: '粥温在锅里，灯留在厅里。', tip: '有人等你，就是家。' },
      { line: '歌德曾说：能分享的欢乐，才是双倍的。', tip: '好事，说给谁听听。' },
      { line: '雪夜里，有人为你留了一盏灯。', tip: '回头，光就在。' },
      { line: '浮云一别后，流水十年间，依然温暖。', tip: '久了，情也不凉。' },
      { line: '毛姆曾说：为了使灵魂宁静，一个人每天要做两件他不喜欢的事。', tip: '偶尔顺从，也是种暖。' },
      { line: '灶上的汤咕嘟咕嘟，像在说慢慢来。', tip: '听它响，心就安。' },
      { line: '有人把你放在心尖上，你自己可能不知道。', tip: '但那份暖，是真的。' },
      { line: '阳春布德泽，万物生光辉。', tip: '你好了，周围也亮了。' },
    ],
    comfort: '你暖起来的时候，世界也跟着亮了一点。',
  },
  heart: {
    label: '柔软',
    replies: [
      { line: '辛苦啦，今天也尽力了。', tip: '喝口水，把肩膀松一松。' },
      { line: '柔软不是软弱，是你还愿意相信。', tip: '信着点什么，挺好。' },
      { line: '允许自己偶尔不想那么坚强。', tip: '看部暖片子，随它哭。' },
      { line: '你的细腻，是种很珍贵的天赋。', tip: '敏感的人，更能接住温柔。' },
      { line: '心软下来，世界也变得好商量了。', tip: '给自己挑一首慢歌听。' },
      { line: '慈母手中线，游子身上衣。', tip: '被人缝补过的，最柔软。' },
      { line: '抱抱自己，今天已经够好了。', tip: '环住肩膀，轻轻的。' },
      { line: '愿你出走半生，归来仍是少年。', tip: '那点天真，留着也好。' },
      { line: '委屈的时候，软下来哭一场也行。', tip: '眼泪是心在喘气。' },
      { line: '李清照曾说：此情无计可消除，才下眉头，却上心头。', tip: '惦记谁，就由它惦记。' },
      { line: '你温柔的样子，比任何盔甲都好看。', tip: '不用武装，也安全。' },
      { line: '小王子曾说：真正重要的东西，用眼睛是看不见的。', tip: '用心摸一摸，就懂了。' },
      { line: '心有猛虎，细嗅蔷薇。', tip: '再硬的人，也有软处。' },
      { line: '被理解的那一刻，心像化开的糖。', tip: '有人懂，就够了。' },
      { line: '愿我如星君如月，夜夜流光相皎洁。', tip: '互相照着，就不孤单。' },
      { line: '允许自己今天只做一朵云。', tip: '飘着，不必有形状。' },
      { line: '村上春树曾说：当你穿过暴风雨，你早已不再是原来那个人。', tip: '软过，才更完整。' },
      { line: '把心事说给枕头听，它最会保密。', tip: '嘟囔几句，就轻松了。' },
      { line: '柔情似水，佳期如梦。', tip: '软软的念想，也美。' },
      { line: '你值得被轻轻对待。', tip: '包括对现在的自己。' },
      { line: '临行密密缝，意恐迟迟归。', tip: '被惦记的针脚，最暖。' },
      { line: '难过时，允许自己缩成小小的一团。', tip: '卷起来，也很安全。' },
      { line: '太宰治曾说：温柔是正确的。', tip: '你软，就对了。' },
      { line: '把委屈说给风，风会替你揉散。', tip: '吹走了，就不堵了。' },
      { line: '桃李春风一杯酒，江湖夜雨十年灯。', tip: '想起谁，就暖一下。' },
      { line: '你柔软的样子，像初春的草。', tip: '嫩嫩的，却很有劲。' },
      { line: '圣埃克苏佩里曾说：正是你为玫瑰花费的时间，使你的玫瑰重要。', tip: '你在乎的，都珍贵。' },
      { line: '被理解，是种很轻的幸福。', tip: '哪怕只有一句懂。' },
      { line: '软语如春风，可化千里冰。', tip: '温柔，比强硬更有力。' },
    ],
    comfort: '肯对自己心软，是很勇敢的事。',
  },
}

// 按当天日期取稳定索引，保证同一心情连续 30 天文案不重复
const getDailyMoodReply = (mood: MoodSymbol): { line: string; tip: string } => {
  const replies = HOME_MOOD_META[mood].replies
  const dayIndex = Math.floor(new Date(getTodayKey()).getTime() / 86400000)
  return replies[dayIndex % replies.length]
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// localStorage keys
const HOME_NOTE_KEY = 'homeNote'

// 读取某日期的心情（从公共模块读取）
const loadHomeMood = (): MoodSymbol | null => {
  try {
    const stored = localStorage.getItem('homeMood')
    if (!stored) return null
    const parsed = JSON.parse(stored) as { date: string; mood: MoodSymbol }
    if (parsed.date === getTodayKey()) {
      return parsed.mood
    }
    return null
  } catch {
    return null
  }
}

// 保存心情（使用公共模块的格式）
const saveHomeMood = (mood: MoodSymbol) => {
  try {
    localStorage.setItem('homeMood', JSON.stringify({
      date: getTodayKey(),
      mood,
      updatedAt: new Date().toISOString()
    }))
  } catch {
    // ignore
  }
}

// 读取便签
const loadHomeNote = (): string => {
  try {
    const raw = localStorage.getItem(HOME_NOTE_KEY)
    if (!raw) return ''
    const parsed = JSON.parse(raw) as { date: string; note: string }
    if (parsed.date === getTodayKey()) {
      return parsed.note
    }
    return ''
  } catch {
    return ''
  }
}

// 保存便签
const saveHomeNote = (note: string) => {
  try {
    localStorage.setItem(HOME_NOTE_KEY, JSON.stringify({
      date: getTodayKey(),
      note,
      updatedAt: new Date().toISOString()
    }))
  } catch {
    // ignore
  }
}

interface TimeWeatherCardProps {
  onNavigate?: (page: string) => void
}

export function TimeWeatherCard({ onNavigate }: TimeWeatherCardProps) {
  const [now, setNow] = useState<Date | null>(null)
  const [todayMood, setTodayMood] = useState<MoodSymbol | null>(null)
  const [todayNote, setTodayNote] = useState('')
  // reply 初始为 null，避免 SSR 与客户端因 new Date() 时间差导致 Hydration Mismatch
  // 真实心情回应在水合完成后通过 useEffect 回填
  const [reply, setReply] = useState<{ line: string; tip: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [popPos, setPopPos] = useState<{ top: number; right: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // 实时时间（每秒跳动）
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // 进入时回填当日心情与留言，并在客户端水合完成后计算真实回应文案
  useEffect(() => {
    const mood = loadHomeMood()
    setTodayMood(mood)
    setTodayNote(loadHomeNote())
    setReply(mood ? getDailyMoodReply(mood) : null)
  }, [])

  // 点击卡片外部关闭弹层
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const hh = now ? String(now.getHours()).padStart(2, '0') : '--'
  const mm = now ? String(now.getMinutes()).padStart(2, '0') : '--'
  const ss = now ? String(now.getSeconds()).padStart(2, '0') : '--'
  const dateStr = now
    ? `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${WEEK[now.getDay()]}`
    : '——'

  const moodColors = todayMood ? MOOD_COLORS[todayMood] : null

  const pick = (m: MoodSymbol) => {
    setTodayMood(m)
    setReply(getDailyMoodReply(m))
    saveHomeMood(m)
  }

  // 跳转到心迹页面
  const goToMindTrace = () => {
    // 先保存心情和文字到 localStorage，确保心迹页面能读取
    if (todayMood) {
      saveHomeMood(todayMood)
    }
    if (todayNote.trim()) {
      saveHomeNote(todayNote)
    }
    // 使用 App 内部导航，而不是网页跳转
    if (onNavigate) {
      onNavigate('心迹')
    } else {
      window.location.href = '/mind-trace'
    }
  }

  return (
    <div ref={cardRef} className="relative rounded-xl border border-leaf/30 bg-[#F6EBDD]/80 px-5 py-3 shadow-sm backdrop-blur-sm dark:bg-surface-1/80 dark:border-border">
      <div className="flex items-stretch justify-between gap-3">
        {/* 左：时间 */}
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-1 font-serif tabular-nums text-[30px] leading-none text-foreground">
            <span className="tracking-tight">{hh}</span>
            <span className="text-muted-foreground/60">:</span>
            <span className="tracking-tight">{mm}</span>
            <span className="ml-1 text-[14px] text-muted-foreground/70">{ss}</span>
          </div>
          <span className="mt-1 font-serif text-[12px] text-muted-foreground/80">{dateStr}</span>
        </div>

        {/* 右：今天心情如何（点击弹选） */}
        <div className="flex flex-col items-end gap-1">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect()
                setPopPos({ top: rect.bottom + window.scrollY + 8, right: window.innerWidth - rect.right - window.scrollX })
              }
              setOpen((v) => !v)
            }}
            aria-label="今天心情如何"
            className="group flex min-w-[92px] flex-col items-end justify-center rounded-lg px-2 py-1 text-right transition-colors hover:bg-white/30 active:scale-[0.98]"
          >
            {todayMood && moodColors ? (
              <>
                <span
                  className="leading-none transition-transform group-hover:scale-105"
                  style={{ color: moodColors.color, filter: `drop-shadow(0 1px 3px ${moodColors.color}44)` }}
                >
                  <MoodIcon type={todayMood} size={30} selected={true} />
                </span>
                <span className="mt-1 flex items-center gap-0.5 font-serif text-[11px] text-muted-foreground/60">
                  {moodColors.name}<ChevronDown size={11} />
                </span>
              </>
            ) : (
              <>
                <span className="leading-none text-muted-foreground/50 group-hover:scale-105 transition-transform">
                  <MoodIcon type="leaf" size={30} selected={false} />
                </span>
                <span className="mt-1 flex items-center gap-0.5 font-serif text-[12px] text-muted-foreground/70">
                  今天心情如何？<ChevronDown size={12} />
                </span>
              </>
            )}
          </button>
          
          {/* 已有心情时显示"进入心迹"入口 */}
          {todayMood && (
            <button
              type="button"
              onClick={goToMindTrace}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <BookOpen size={12} />
              <span>写入心迹 →</span>
            </button>
          )}
        </div>
      </div>

      {/* 心情弹层：用 Portal 挂到 body，避免被父容器裁剪/遮挡 */}
      {open && popPos &&
        createPortal(
          <div
            className="fixed z-[100] w-[min(300px,calc(100%-24px))] rounded-2xl border border-leaf/30 bg-surface-1/95 p-3 shadow-lg backdrop-blur-md"
            style={{ top: popPos.top, right: popPos.right }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="mb-2 px-1 font-serif text-[13px] font-semibold text-foreground">今天心情怎么样？</p>
            <div className="grid grid-cols-5 gap-1.5">
              {MOOD_OPTIONS.map((m) => {
                const colors = MOOD_COLORS[m]
                const active = todayMood === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => pick(m)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition-all ${
                      active
                        ? 'border-sakura/50 bg-sakura-soft/70'
                        : 'border-transparent hover:bg-white/70 dark:hover:bg-surface-2'
                    }`}
                  >
                    <MoodIcon type={m} size={22} selected={active} />
                    <span className="text-[11px] leading-none text-foreground/80">{MOOD_LABELS[m]}</span>
                  </button>
                )
              })}
            </div>

            {/* 回应态：选了心情才出现 */}
            {reply && (
              <div className="mt-3 rounded-xl bg-white/55 p-3 dark:bg-surface-2/70">
                <p className="font-serif text-[13px] leading-snug text-foreground/90">{reply.line}</p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground/80">{reply.tip}</p>

                <div className="mt-2.5">
                  <label className="mb-1 block text-[11px] text-muted-foreground/70">想对今天的自己说点什么？（可选）</label>
                  <div className="flex items-end gap-2">
                    <input
                      value={todayNote}
                      onChange={(e) => setTodayNote(e.target.value)}
                      onBlur={() => saveHomeNote(todayNote)}
                      placeholder="比如：今天也辛苦啦"
                      className="min-w-0 flex-1 rounded-lg border border-leaf/30 bg-white/80 px-2.5 py-1.5 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-sakura/60 dark:bg-surface-2 dark:border-border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        saveHomeNote(todayNote)
                        setOpen(false)
                      }}
                      className="shrink-0 rounded-lg bg-sakura/85 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-sakura active:scale-95"
                    >
                      收下
                    </button>
                  </div>
                  {/* 没写任何话时的兜底陪伴语：跟随当前选中的心情 */}
                  {!todayNote.trim() && (
                    <p className="mt-2 text-[11px] leading-snug text-muted-foreground/70">
                      {todayMood ? HOME_MOOD_META[todayMood].comfort : '你今天愿意来看一看自己，已经很温柔了。'}
                    </p>
                  )}
                  
                  {/* 跳转到心迹的按钮 */}
                  <button
                    type="button"
                    onClick={goToMindTrace}
                    className="mt-3 w-full rounded-lg border border-stone-300/60 bg-white/60 py-2 text-[12px] font-medium text-stone-600 transition-colors hover:bg-stone-50 active:scale-95 dark:border-border dark:bg-surface-2 dark:text-muted-foreground dark:hover:bg-surface-1"
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <BookOpen size={14} />
                      把这一刻写进心迹
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
