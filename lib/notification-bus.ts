/**
 * 通知抽象层
 *
 * 统一通知接口，Web 和原生 App 各自实现
 *
 * - Web：使用 Notifications API 发送系统通知
 * - 原生（Capacitor）：使用 @capacitor/local-notifications 发真正的系统通知
 *   （Android WebView 不支持 Web Notifications API，权限永远是 denied，
 *   必须走原生插件才能弹出系统授权框并推送通知）
 * - 降级：权限被拒绝时，通过 CustomEvent 触发应用内弹窗
 */

import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Importance, Visibility } from '@capacitor/local-notifications'
import type { WarmReminder } from './reminder-storage'
import { presetQuotes } from './quotes'

// ── 通知处理器接口 ────────────────────────────────

/**
 * 通知处理器接口
 * Web 和原生平台各自实现此接口
 */
export interface NotificationHandler {
  /** 发送提醒通知 */
  send(reminder: WarmReminder): void
  /** 请求通知权限（Web 为浏览器通知授权，原生为系统权限） */
  requestPermission(): Promise<boolean>
  /** 获取当前权限状态 */
  getStatus(): 'granted' | 'denied' | 'default'
}

// ── Web 平台实现（Notifications API） ───────────

/**
 * Web 平台通知处理器
 * 使用浏览器 Notifications API 发送系统通知
 * 权限被拒绝时降级为应用内弹窗（CustomEvent）
 */
export const webHandler: NotificationHandler = {
  send(reminder: WarmReminder): void {
    if (typeof window === 'undefined') return

    const permission = Notification.permission

    if (permission === 'granted') {
      // 发送系统通知
      const title = '暖枫轻轻提醒你'
      const body = reminder.customMessage
        ? `${reminder.title}\n${reminder.customMessage}`
        : reminder.title

      try {
        const notification = new Notification(title, {
          body,
          icon: '/icon.png',
          badge: '/icon.png',
          tag: reminder.id,
          data: reminder,
        })

        // 点击通知聚焦窗口
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch {
        // 某些浏览器不支持 new Notification，降级为应用内弹窗
        window.dispatchEvent(
          new CustomEvent('warm-reminder', { detail: reminder })
        )
      }
    } else {
      // 权限未授权或被拒绝，降级为应用内弹窗
      window.dispatchEvent(
        new CustomEvent('warm-reminder', { detail: reminder })
      )
    }
  },

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false

    try {
      const result = await Notification.requestPermission()
      return result === 'granted'
    } catch {
      return false
    }
  },

  getStatus(): 'granted' | 'denied' | 'default' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }
    return Notification.permission
  },
}

// ── 原生平台实现（Capacitor LocalNotifications） ──

/** 权限状态缓存（getStatus 是同步接口，原生查询是异步的，模块加载时先查一次） */
let nativePermissionCache: 'granted' | 'denied' | 'default' = 'default'

if (Capacitor.isNativePlatform()) {
  LocalNotifications.checkPermissions()
    .then((s) => {
      nativePermissionCache = s.display === 'granted' ? 'granted' : 'default'
    })
    .catch(() => {
      /* 保持 default */
    })
}

/** 字符串转稳定的正整数 id（LocalNotifications 要求数字 id） */
function reminderNumericId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0
  }
  return (h % 2000000000) + 1
}

/**
 * 原生平台通知处理器
 * 通过系统通知栏推送，授权弹窗也由系统提供
 */
export const nativeHandler: NotificationHandler = {
  send(reminder: WarmReminder): void {
    if (!Capacitor.isNativePlatform()) return
    const body = reminder.customMessage
      ? `${reminder.title}\n${reminder.customMessage}`
      : reminder.title
    // Android 13+ 未授予 POST_NOTIFICATIONS 时 schedule() 不会报错，
    // 通知会被系统静默丢弃——必须先确认权限真实可用，否则降级应用内弹窗
    LocalNotifications.checkPermissions()
      .then((status) => {
        if (status.display !== 'granted') {
          window.dispatchEvent(new CustomEvent('warm-reminder', { detail: reminder }))
          return
        }
        return ensureBannerChannel().then(() =>
          LocalNotifications.schedule({
            notifications: [
              {
                id: reminderNumericId(reminder.id),
                title: '暖枫轻轻提醒你',
                body,
                channelId: BANNER_CHANNEL_ID,
                autoCancel: true,
              },
            ],
          })
        )
      })
      .catch(() => {
        // 原生通知失败时降级为应用内弹窗
        window.dispatchEvent(new CustomEvent('warm-reminder', { detail: reminder }))
      })
  },

  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false
    try {
      const status = await LocalNotifications.requestPermissions()
      const granted = status.display === 'granted'
      nativePermissionCache = granted ? 'granted' : 'denied'
      return granted
    } catch {
      return false
    }
  },

  getStatus(): 'granted' | 'denied' | 'default' {
    return nativePermissionCache
  },
}

// ── 当前使用的处理器 ──────────────────────────────

/**
 * 当前平台的通知处理器：原生 App 走 LocalNotifications，浏览器走 Web Notifications API
 */
export const notificationHandler: NotificationHandler = Capacitor.isNativePlatform()
  ? nativeHandler
  : webHandler

// ── 便捷方法 ──────────────────────────────────────

/**
 * 发送提醒通知
 */
export function sendReminder(reminder: WarmReminder): void {
  notificationHandler.send(reminder)
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  return notificationHandler.requestPermission()
}

/**
 * 获取通知权限状态
 */
export function getNotificationStatus(): 'granted' | 'denied' | 'default' {
  return notificationHandler.getStatus()
}

// ── 原生定时提醒调度 ────────────────────────

// 高优先级通知通道：Android 8+ 通知的横幅行为由“通道 importance”决定，
// 默认通道 importance=3 只静默进通知栏；importance=5（MAX）才会像微信
// 消息一样横幅弹出。v8 插件里 importance/visibility 是 Channel 的字段，
// 不是单条通知的字段，所以必须先建通道再让通知挂 channelId。
const BANNER_CHANNEL_ID = 'warmfeng-banner'
let bannerChannelReady = false

async function ensureBannerChannel(): Promise<void> {
  const importance: Importance = 5 // IMPORTANCE_MAX
  const visibility: Visibility = 1 // VISIBILITY_PUBLIC（锁屏完整可见）
  if (bannerChannelReady) return
  // Android 通道的 importance 一旦创建就被系统锁定：如果之前装过旧版本
  // 暖枫，低优先级通道可能已存在，重建也不会升级——必须删除后重建
  try {
    const { channels } = await LocalNotifications.listChannels()
    const existing = channels.find(c => c.id === BANNER_CHANNEL_ID)
    if (existing && existing.importance !== undefined && existing.importance < 5) {
      await LocalNotifications.deleteChannel({ id: BANNER_CHANNEL_ID })
    }
  } catch {
    /* 低版本不支持，忽略 */
  }
  await LocalNotifications.createChannel({
    id: BANNER_CHANNEL_ID,
    name: '暖枫提醒',
    description: '喝水、作息、每日暖心消息等提醒',
    importance,
    visibility,
    lights: true,
    vibration: true,
  })
  bannerChannelReady = true
}

// 每日暖心消息：独立固定 id，不与用户提醒的哈希 id 冲突
const DAILY_MESSAGE_ID = 2000000001

// 每日随机推送的文案库（每次调度随机抽一条）
const DAILY_MESSAGES: Array<{ title: string; body: string }> = [
  { title: '暖枫轻轻提醒你', body: '今天也要记得喝够水呀，身体会谢谢你的～' },
  { title: '暖枫轻轻提醒你', body: '坐了一会儿了吧？站起来伸个懒腰，看看远处～' },
  { title: '暖枫轻轻提醒你', body: '别忘了吃早餐，热乎乎的一天从胃开始暖～' },
  { title: '暖枫轻轻提醒你', body: '眼睛累了就闭上一分钟，深呼吸三次再回来～' },
  { title: '暖枫轻轻提醒你', body: '今天的小目标完成了吗？哪怕一小步也很棒～' },
  { title: '暖枫轻轻提醒你', body: '晚上别熬太晚哦，好梦比刷手机更值得拥有～' },
  { title: '暖枫轻轻提醒你', body: '今天有没有一件值得记下来的小确幸？去日记里存起来吧～' },
  { title: '暖枫轻轻提醒你', body: '肩颈放松一下：转转脖子、扣扣背，十秒就舒服很多～' },
  { title: '暖枫轻轻提醒你', body: '想专注一会儿吗？开个小番茄，我陪你安静做事～' },
  { title: '暖枫轻轻提醒你', body: '别忘了吃水果，今天的维生素还没打卡哦～' },
  { title: '暖枫轻轻提醒你', body: '情绪有点沉的话，去呼吸训练里坐一会儿吧～' },
  { title: '暖枫轻轻提醒你', body: '你已经在慢慢变好了，这件事我替你记着～' },
]

// 每日推送总文案池：暖心提醒文案 + 精选语录（与首页语录卡片同一份数据），
// 每次调度随机抽一条，语录以“暖枫今日寄语”标题推送
const DAILY_POOL: Array<{ title: string; body: string }> = [
  ...DAILY_MESSAGES,
  ...presetQuotes.map(q => ({ title: '暖枫今日寄语', body: q.text.replace(/\n/g, ' ') })),
]

/**
 * 调度“每日暖心消息”：每天随机一个时段弹出（像微信消息一样的系统横幅）。
 * 实现：注册一条每日重复的系统定时通知，时间点与文案在每次同步时随机生成，
 * 即用户每次打开暖枫，之后的每日推送时间都会滚动变化；即使 App 被划掉，
 * 系统调度仍会到点弹出。
 */
async function scheduleDailyMessage(): Promise<void> {
  try {
    // 先取消旧的每日消息，避免重复
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_MESSAGE_ID }] })

    // 随机时段：早 8 点 ~ 晚 9 点之间
    const hour = 8 + Math.floor(Math.random() * 13)
    const minute = Math.floor(Math.random() * 60)
    const msg = DAILY_POOL[Math.floor(Math.random() * DAILY_POOL.length)]

    await LocalNotifications.schedule({
      notifications: [{
        id: DAILY_MESSAGE_ID,
        title: msg.title,
        body: msg.body,
        schedule: {
          on: { hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
        // 挂到高优先级通道：像微信消息一样横幅弹出、锁屏可见
        channelId: BANNER_CHANNEL_ID,
        autoCancel: true,
      }],
    })
  } catch {
    /* 每日消息调度失败不影响主流程 */
  }
}

/** 最近一次同步调度失败的错误信息（面板可见，不再静默吞掉） */
let lastSyncError: string | null = null

/** 最近一次同步成功的时间与写入条数（面板展示，证明同步真的执行过） */
let lastSyncAt: string | null = null
let lastSyncWritten = 0

/** 同步串行化：连续增删改提醒会触发多次同步，并发执行会互相取消对方的调度，必须排队 */
let syncChain: Promise<void> = Promise.resolve()

/** 数字闹钟 id → 提醒 id 映射：系统闹钟触发时插件回调只给数字 id，靠它反查是哪条提醒（双保险去重用） */
const reminderIdByNumericId = new Map<number, string>()

// 双保险去重：系统闹钟真的触发时，插件会回调 localNotificationReceived（原生源码实证：
// TimedNotificationPublisher.onReceive 先 fireReceived 再弹通知）。此时把对应提醒标记为
// “已触发”，应用内轮询就不再重复弹；反之闹钟被手机系统拦截时，轮询兑底弹出
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    const reminderId = reminderIdByNumericId.get(notification.id)
    if (reminderId) {
      window.dispatchEvent(new CustomEvent('warm-reminder-fired', { detail: reminderId }))
    }
  }).catch(() => { /* 监听注册失败不影响主流程 */ })
}

/**
 * 把启用的提醒写入系统级定时通知（Android 底层走 AlarmManager）。
 * 关键点：调度完成后即使 App 被划掉/杀死，到点仍会像短信一样弹出系统通知，
 * 不再依赖应用内 setInterval（那种方式杀后台即失效）。
 *
 * 策略：每次同步先取消全部已调度的通知，再按最新提醒列表重建；
 * 每条提醒按重复日逐星期注册一条 repeats 通知（repeatDays 为空 = 每天）。
 */
export async function syncNativeReminderSchedules(reminders: WarmReminder[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  // 串行化：后到的同步在前一次完成后执行，避免并发互删
  syncChain = syncChain.then(() => doSyncNativeReminderSchedules(reminders)).catch(() => { /* 错误已在内部记录 */ })
  return syncChain
}

async function doSyncNativeReminderSchedules(reminders: WarmReminder[]): Promise<void> {
  try {
    // 用实时查询而非缓存：缓存是模块加载时异步填充的，首次同步时可能
    // 还是 default，导致调度被静默跳过（提醒“纯摆设”的根因之一）
    const status = await LocalNotifications.checkPermissions()
    if (status.display !== 'granted') {
      lastSyncError = '系统通知权限未开启，提醒无法写入系统'
      return
    }

    // Android 12+（targetSdk 31+）精确闹钟需用户单独授权。未授权时原生层
    // setExactAndAllowWhileIdle 会直接抛 SecurityException（Android 14+ 新装默认拒绝），
    // 所以必须先拉起设置页，返回后复查；仍未授权则不写入系统调度
    //（避免整个 schedule 批次被拒），改由应用内轮询兑底，并在诊断面板说明原因
    try {
      let alarm = await LocalNotifications.checkExactNotificationSetting()
      if (alarm.exact_alarm !== 'granted') {
        await LocalNotifications.changeExactNotificationSetting()
        alarm = await LocalNotifications.checkExactNotificationSetting()
      }
      if (alarm.exact_alarm !== 'granted') {
        lastSyncError = '“闹钟与提醒”权限未开启，定时提醒无法写入系统。请在上方体检区确认②状态后重试'
        return
      }
    } catch {
      /* 低版本系统没有该 API，忽略（视为已授权） */
    }

    // 先确保高优先级横幅通道存在（决定横幅弹出行为）
    await ensureBannerChannel()

    // 先清空旧的调度，避免重复/残留
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }

    // 重建闹钟 id → 提醒 id 映射（旧的全部作废）
    reminderIdByNumericId.clear()

    const notifications = []
    for (const r of reminders) {
      if (!r.enabled) continue
      const [h, m] = r.time.split(':').map(Number)
      if (Number.isNaN(h) || Number.isNaN(m)) continue
      const days = r.repeatDays.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : r.repeatDays
      const body = r.customMessage ? `${r.title}\n${r.customMessage}` : r.title
      for (const d of days) {
        // 每条提醒 × 每个重复日 一个独立 id（插件机制：每个星期几需要一条独立闹钟）
        const numericId = reminderNumericId(`${r.id}-${d}`)
        reminderIdByNumericId.set(numericId, r.id)
        notifications.push({
          id: numericId,
          title: '暖枫轻轻提醒你',
          body,
          schedule: {
            // Capacitor 的 weekday：1=周日 … 7=周六；JS getDay：0=周日，所以 +1
            on: { weekday: d + 1, hour: h, minute: m },
            repeats: true,
            // 息屏/低电量状态下也尽量准时触发
            allowWhileIdle: true,
          },
          // 挂到高优先级通道才会像微信消息一样横幅弹出（importance 是
          // 通道级配置，单条通知上设置无效）
          channelId: BANNER_CHANNEL_ID,
          autoCancel: true,
        })
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
    }

    // 用户提醒同步完成后，刷新每日暖心消息的随机调度
    await scheduleDailyMessage()

    // 同步成功，清除上次的错误提示，并记录成功时间与写入条数（面板可见）
    lastSyncError = null
    lastSyncAt = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    lastSyncWritten = notifications.length
  } catch (err) {
    // 调度失败记入诊断信息（面板可见），应用内轮询仍会兑底
    lastSyncError = err instanceof Error ? err.message : String(err)
  }
}

// ── 诊断与测试（实证排查用） ────────────────────

export interface ReminderDiagnostics {
  /** 系统通知权限是否已授予 */
  displayGranted: boolean
  /** 精确闹钟权限是否已授予（Android 12+ 定时到点的关键） */
  exactAlarmGranted: boolean
  /** 已成功写入系统的定时通知条数 */
  pendingCount: number
  /** 已写入系统的定时通知明细（诊断展示用） */
  pendingList: Array<{ id: number; title: string; summary: string }>
  /** 最近一次同步成功的时间（null = 本进程内还没同步成功过） */
  lastSyncAt: string | null
  /** 最近一次同步成功写入的提醒闹钟条数 */
  lastSyncWritten: number
  /** 最近一次同步失败的错误（null = 未失败） */
  lastError: string | null
}

/**
 * 实时读取真机上的真实状态（权限/闹钟/已注册调度数），
 * 用于提醒面板的诊断展示——之前所有失败都被 catch 静默吞掉，
 * 导致无法定位问题，现在全部可见。
 */
export async function getReminderDiagnostics(): Promise<ReminderDiagnostics> {
  const diag: ReminderDiagnostics = {
    displayGranted: false,
    exactAlarmGranted: false,
    pendingCount: 0,
    pendingList: [],
    lastSyncAt,
    lastSyncWritten,
    lastError: lastSyncError,
  }
  if (!Capacitor.isNativePlatform()) return diag
  try {
    const status = await LocalNotifications.checkPermissions()
    diag.displayGranted = status.display === 'granted'
  } catch { /* 保持 false */ }
  try {
    const alarm = await LocalNotifications.checkExactNotificationSetting()
    diag.exactAlarmGranted = alarm.exact_alarm === 'granted'
  } catch {
    // 低版本系统无精确闹钟概念，视为不需要
    diag.exactAlarmGranted = true
  }
  try {
    const pending = await LocalNotifications.getPending()
    diag.pendingCount = pending.notifications.length
    diag.pendingList = pending.notifications.map(p => {
      const s = p.schedule
      let summary = ''
      if (s?.on) {
        const wd = s.on.weekday ? ['日', '一', '二', '三', '四', '五', '六'][(s.on.weekday + 6) % 7] : ''
        summary = `周${wd} ${String(s.on.hour ?? 0).padStart(2, '0')}:${String(s.on.minute ?? 0).padStart(2, '0')}${s.repeats ? '·每周' : ''}`
      } else if (s?.at) {
        summary = `定时 ${new Date(s.at).toLocaleTimeString('zh-CN', { hour12: false })}`
      }
      return { id: p.id, title: p.title ?? '', summary }
    })
  } catch { /* 保持 0 */ }
  return diag
}

/** 测试通知 id（固定，不与用户提醒/每日消息冲突） */
const TEST_NOTIFICATION_ID = 2000000002

/**
 * 立即发送一条测试通知：验证“权限 + 高优先级通道”链路。
 * 能弹横幅 = 通知链路正常；问题只剩定时调度环节。
 * 返回结果文案，面板直接展示。
 */
export async function sendTestNotification(): Promise<string> {
  if (!Capacitor.isNativePlatform()) return '仅手机 App 内可用'
  try {
    const status = await LocalNotifications.checkPermissions()
    if (status.display !== 'granted') {
      return '失败：系统通知未开启，请先点击上方“开启系统通知”'
    }
    await ensureBannerChannel()
    await LocalNotifications.schedule({
      notifications: [{
        id: TEST_NOTIFICATION_ID,
        title: '暖枫测试通知',
        body: '看到这条横幅，说明通知链路是通的～',
        channelId: BANNER_CHANNEL_ID,
        autoCancel: true,
      }],
    })
    return '已发送，看通知栏/横幅'
  } catch (err) {
    return '失败：' + (err instanceof Error ? err.message : String(err))
  }
}

/**
 * 60 秒后触发的“真实链路”测试：与用户温柔提醒走同一套闹钟机制
 *（系统精确定时闹钟 + 高优先级通道）。它能弹而用户提醒不能弹 =
 * 同步环节问题；它也弹不了 = 系统闹钟权限或手机厂商限制问题。
 * 用一次性定时（at）而非每周重复，避免测试闹钟永久残留。
 */
export async function scheduleTestIn60s(): Promise<string> {
  if (!Capacitor.isNativePlatform()) return '仅手机 App 内可用'
  try {
    const status = await LocalNotifications.checkPermissions()
    if (status.display !== 'granted') {
      return '失败：系统通知未开启，请先点击上方“开启系统通知”'
    }
    await ensureBannerChannel()
    // 清掉上一次测试的残留闹钟
    await LocalNotifications.cancel({ notifications: [{ id: TEST_NOTIFICATION_ID }] })
    const t = new Date(Date.now() + 60 * 1000)
    await LocalNotifications.schedule({
      notifications: [{
        id: TEST_NOTIFICATION_ID,
        title: '暖枫定时链路测试',
        body: '这条和你的温柔提醒走同一套系统闹钟机制，能弹=定时功能正常～',
        schedule: {
          at: t,
          allowWhileIdle: true,
        },
        channelId: BANNER_CHANNEL_ID,
        autoCancel: true,
      }],
    })
    return `已设置，预计 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')} 触发。设置后可划掉后台等它`
  } catch (err) {
    return '失败：' + (err instanceof Error ? err.message : String(err))
  }
}

/**
 * 计算某条提醒的下一次触发时刻（与插件原生 DateMatch 逻辑等价），
 * 面板展示用：如果显示的时间不对，说明计算层有 bug；如果时间正确但
 * 到点不弹，说明是系统闹钟权限/厂商限制问题。
 */
export function nextTriggerOfReminder(time: string, repeatDays: number[]): Date | null {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const days = repeatDays.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : repeatDays
  const now = new Date()
  let best: Date | null = null
  for (const d of days) {
    const cand = new Date(now)
    cand.setDate(cand.getDate() + ((d - now.getDay() + 7) % 7))
    cand.setHours(h, m, 0, 0)
    if (cand.getTime() <= now.getTime()) cand.setDate(cand.getDate() + 7)
    if (best === null || cand.getTime() < best.getTime()) best = cand
  }
  return best
}
