/**
 * 精选语录库（首页语录卡片与每日推送共用）
 *
 * 从 components/warm-feng-app.tsx 的 presetQuotes 抽出，
 * 保证"每日随机推送"和首页展示的是同一份语录，不会两边不一致。
 */

export type QuoteCategory = '励志' | '治愈' | '陪伴'

export interface Quote {
  id: string
  text: string
  type: 'preset' | 'custom'
  createdAt: string
  category?: QuoteCategory // 仅 preset 使用，用于内部均衡抽取；界面不展示
  source?: string // 出处，界面右对齐展示（如 毛主席 / 李白 / 暖枫社区分享）
}

export const presetQuotes: Quote[] = [
  // —— 治愈 ——
  { id: '1', text: '不必着急，花会沿路盛开\n你也会慢慢成为自己喜欢的模样。', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '2', text: '认真生活的人\n总会在平凡的日子里遇见小小的光。', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '3', text: '今天走得慢一点也没关系\n你仍然在向喜欢的方向靠近。', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '4', text: '允许自己偶尔安静\n像雨后的窗，什么都不必急着想。', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '5', text: '世界很吵\n但你心里的那片海，可以一直温柔。', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '6', text: '把今天没做好的事轻轻放下\n明天的风会替你重新开始', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '7', text: '你不需要时刻发光\n安安静静地存在着，本身就很珍贵。', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },

  // —— 励志 ——
  { id: '8', text: '再小的步子也是向前\n今天比昨天多走一点点就够。', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '9', text: '想要的山海很远\n但脚下的路，每一步都算数。', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '10', text: '你正在做的事\n也许微小，却正在悄悄改变结局。', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '11', text: '所谓好运\n不过是认真的人，被时间轻轻偏袒。', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '12', text: '别怕慢，怕的是停。\n你每撑过一次，就离想去的远方近一点。', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '13', text: '把目标拆成今天能做到的事\n完成了，就是对自己最好的交代。', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '14', text: '风会吹散犹豫\n只要你愿意迈出第一步，路就会出现。', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },

  // —— 陪伴 ——
  { id: '15', text: '无论今天发生了什么\n我都守在这里，陪你把夜慢慢熬暖。', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '16', text: '你不是一个人在扛\n这世上总有人，愿意听你说说心事。', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '17', text: '累的时候就靠一靠\n我会一直在这儿，不催你，也不走。', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '18', text: '你的开心有人分享\n你的难过也有人接住，这就够了。', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '19', text: '今晚的月色不错\n我和它一起，陪你慢慢睡去。', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '20', text: '别把心事都藏起来\n说给我听也好，写给你自己也好，别憋着。', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },

  // —— 治愈（新增）——
  { id: '21', text: '慢下来不是落后\n而是给自己一点喘息的空隙', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '22', text: '你今天已经很努力了\n剩下的交给明天的自己', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '23', text: '心里的雨停了\n阳光才会照进来', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '24', text: '不必和谁比快慢\n你自己的节奏就很好', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '25', text: '深呼吸一下\n世界没那么急', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '26', text: '累了就歇会儿\n云朵飘过也需要时间', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '27', text: '温柔对待自己\n也是一种了不起的能力', type: 'preset', category: '治愈', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },

  // —— 励志（新增）——
  { id: '28', text: '每一个普通的今天\n都在为不普通的以后铺路', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '29', text: '别小看每天的坚持\n它正在悄悄拉长你和梦想的距离', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '30', text: '山高路远不怕\n怕的是你还没走就先回头', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '31', text: '今天的难熬\n是明天笑着说出来的故事', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '32', text: '你比自己以为的\n要更有力量', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '33', text: '把眼下的事做好\n答案会在路上慢慢清楚', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '34', text: '出发就不算晚\n每一步都算数', type: 'preset', category: '励志', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },

  // —— 陪伴（新增）——
  { id: '35', text: '我在呢\n你想说话的时候我一直在', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '36', text: '天黑了别怕\n我陪你把这一页轻轻翻过去', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '37', text: '你不用一直坚强\n在我这里可以偶尔示弱', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '38', text: '开心就笑出声\n难过就靠过来', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '39', text: '无论走多远\n总有一句温柔在等你回来', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },
  { id: '40', text: '今天也辛苦了\n我陪你一起好好休息', type: 'preset', category: '陪伴', source: '暖枫社区分享', createdAt: '2026-07-25T00:00:00Z' },

  // —— 毛主席语录 ——
  { id: '41', text: '星星之火，可以燎原。', type: 'preset', category: '励志', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '42', text: '世上无难事，只要肯登攀。', type: 'preset', category: '励志', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '43', text: '不管风吹浪打，胜似闲庭信步。', type: 'preset', category: '励志', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '44', text: '多少事，从来急；天地转，光阴迫。\n一万年太久，只争朝夕。', type: 'preset', category: '励志', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '45', text: '雄关漫道真如铁，而今迈步从头越。', type: 'preset', category: '励志', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '46', text: '为有牺牲多壮志，敢教日月换新天。', type: 'preset', category: '励志', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '47', text: '自信人生二百年，会当水击三千里。', type: 'preset', category: '励志', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '48', text: '待到山花烂漫时，她在丛中笑。', type: 'preset', category: '治愈', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '49', text: '牢骚太盛防肠断，风物长宜放眼量。', type: 'preset', category: '治愈', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '50', text: '不管什么时候，都要有一点骨气。', type: 'preset', category: '励志', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '51', text: '我们的目的一定要达到，我们的目的一定能够达到。', type: 'preset', category: '励志', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },
  { id: '52', text: '前途是光明的，道路是曲折的。', type: 'preset', category: '励志', source: '毛主席', createdAt: '2026-08-09T00:00:00Z' },

  // —— 古代文言文 / 大白话 ——
  { id: '53', text: '路漫漫其修远兮，吾将上下而求索。', type: 'preset', category: '励志', source: '屈原', createdAt: '2026-08-09T00:00:00Z' },
  { id: '54', text: '长风破浪会有时，直挂云帆济沧海。', type: 'preset', category: '励志', source: '李白', createdAt: '2026-08-09T00:00:00Z' },
  { id: '55', text: '竹杖芒鞋轻胜马，谁怕？\n一蓑烟雨任平生。', type: 'preset', category: '治愈', source: '苏轼', createdAt: '2026-08-09T00:00:00Z' },
  { id: '56', text: '回首向来萧瑟处，归去，\n也无风雨也无晴。', type: 'preset', category: '治愈', source: '苏轼', createdAt: '2026-08-09T00:00:00Z' },
  { id: '57', text: '会当凌绝顶，一览众山小。', type: 'preset', category: '励志', source: '杜甫', createdAt: '2026-08-09T00:00:00Z' },
  { id: '58', text: '穷则独善其身，达则兼济天下。', type: 'preset', category: '励志', source: '孟子', createdAt: '2026-08-09T00:00:00Z' },
  { id: '59', text: '三军可夺帅也，匹夫不可夺志也。', type: 'preset', category: '励志', source: '论语', createdAt: '2026-08-09T00:00:00Z' },
  { id: '60', text: '千磨万击还坚劲，任尔东西南北风。', type: 'preset', category: '励志', source: '郑燮', createdAt: '2026-08-09T00:00:00Z' },
  { id: '61', text: '宝剑锋从磨砺出，梅花香自苦寒来。', type: 'preset', category: '励志', source: '警世贤文', createdAt: '2026-08-09T00:00:00Z' },
  { id: '62', text: '莫愁前路无知己，天下谁人不识君。', type: 'preset', category: '陪伴', source: '高适', createdAt: '2026-08-09T00:00:00Z' },
  { id: '63', text: '海内存知己，天涯若比邻。', type: 'preset', category: '陪伴', source: '王勃', createdAt: '2026-08-09T00:00:00Z' },
  { id: '64', text: '采得百花成蜜后，为谁辛苦为谁甜。', type: 'preset', category: '治愈', source: '罗隐', createdAt: '2026-08-09T00:00:00Z' },
]
