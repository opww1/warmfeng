'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { CountdownIcon, type CountdownIconType } from './countdown-icon'
import { CountUp } from './reactbits/count-up'

/**
 * 盼兮（Countdown）页面
 * 
 * 倒数日管理功能，记录值得期待的日子
 * 
 * 组件结构：
 * - 顶部标题区：标题「盼兮」+ 副标题 + 添加按钮
 * - 焦点大卡片：置顶最近的一天（支持点击列表卡片切换）
 * - 日常期待列表：多个倒数事件卡片（支持点击置顶）
 * - 添加弹窗：新建倒数日（支持时光信件）
 * - 查看信件弹窗：查看到期的时光信件
 */

// ==================== 类型定义 ====================

/** 盼兮事件数据结构 */
export interface CountdownItem {
  id: string
  title: string
  targetDate: string
  iconType: CountdownIconType
  tag?: string
  isPinned: boolean
  createdAt: string
  letter?: string  // 时光信件内容（Base64 加密存储）
  tagline?: string  // 寄语：这一天对你意味着什么（一句话，选填）
  momentPhoto?: string  // 归零当天记录的照片（Base64，选填）
  momentText?: string  // 归零当天记录的感悟（≤100字，选填）
  archivedAt?: string  // 归档时间（归零后自动归档到时光册）
}

// ==================== 常量 ====================

/** localStorage 存储键 */
const STORAGE_KEY = 'warmFengCountdowns'

/** 可选图标类型（10种手绘风格） */
const iconOptions: { type: CountdownIconType; label: string }[] = [
  { type: 'star', label: '星星' },
  { type: 'sparkle', label: '闪光' },
  { type: 'gift', label: '礼物' },
  { type: 'tent', label: '露营' },
  { type: 'book', label: '书本' },
  { type: 'heart', label: '爱心' },
  { type: 'cake', label: '蛋糕' },
  { type: 'ticket', label: '门票' },
  { type: 'plane', label: '飞机' },
  { type: 'flower', label: '花朵' },
  { type: 'moon', label: '月亮' },
  { type: 'rainbow', label: '彩虹' }
]

// ==================== 工具函数 ====================

/** 长按检测 Hook：长按指定毫秒后触发回调，期间显示进度 */
function useLongPress(onLongPress: () => void, duration = 3000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef(0)

  const start = useCallback(() => {
    startTimeRef.current = Date.now()
    setProgress(0)
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      setProgress(Math.min(elapsed / duration, 1))
      if (elapsed >= duration) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        onLongPress()
      }
    }, 50)
  }, [onLongPress, duration])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setProgress(0)
  }, [])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  return { start, cancel, progress }
}

/** 计算距离目标日期的剩余天数 */
function getDaysUntil(targetDate: string): number {
  const target = new Date(targetDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** 格式化日期为 "2026.09.15" 形式 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

/** 格式化时间（HH:mm） */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** 生成唯一 ID */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

/** 获取到期状态标签 */
function getExpiryStatus(days: number): { text: string; colorClass: string } | null {
  if (days < 0) {
    return { text: '已过期', colorClass: 'bg-stone-200/60 text-stone-500' }
  }
  if (days === 0) {
    return { text: '就是今天', colorClass: 'bg-sakura/20 text-sakura' }
  }
  if (days <= 7) {
    return { text: '快到了', colorClass: 'bg-[#D9B36A]/20 text-[#B89347]' }
  }
  return null
}

/** 加密信件内容（支持 Unicode/中文） */
function encryptLetter(letter: string): string {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(letter)
    let binary = ''
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i])
    }
    return btoa(binary)
  } catch {
    // 降级方案：使用 encodeURIComponent
    return btoa(unescape(encodeURIComponent(letter)))
  }
}

/** 解密信件内容（支持 Unicode/中文） */
function decryptLetter(encrypted: string): string {
  try {
    const binary = atob(encrypted)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  } catch {
    try {
      // 降级方案
      return decodeURIComponent(escape(atob(encrypted)))
    } catch {
      return ''
    }
  }
}

// ==================== 诗意提醒系统 ====================

/** 检查当前是否在静默时段（22:00 - 08:00） */
function isSilentTime(): boolean {
  const hour = new Date().getHours()
  return hour >= 22 || hour < 8
}

/** 根据剩余天数获取诗意提醒文案 */
function getPoeticReminder(days: number, item?: CountdownItem): string | null {
  if (isSilentTime()) return null
  if (days < 0) return null
  
  // 7天前
  if (days >= 7) {
    const templates = [
      '海风已经在路上了',
      '期待正在倒计时中',
      '日子正在一天天靠近',
      '时间正在悄悄流淌',
      '等待也是一种温柔',
    ]
    return templates[Math.floor(Math.random() * templates.length)]
  }
  
  // 1-6天
  if (days >= 1 && days < 7) {
    const templates = [
      `还有 ${days} 天，悄悄期待着`,
      `${days} 天后，就赴这场约`,
      `${days} 天的等待，快到了`,
      `距离那天还有 ${days} 天`,
    ]
    return templates[Math.floor(Math.random() * templates.length)]
  }
  
  // 当天
  if (days === 0) {
    return '今天，就是这一天'
  }
  
  return null
}

/** 获取图标类型对应的诗意描述 */
function getIconReminder(iconType: CountdownIconType): string {
  const map: Record<string, string[]> = {
    'star': ['星光已备好', '那天会闪闪发光'],
    'gift': ['礼物已藏好', '惊喜在等你'],
    'cake': ['蛋糕在等你', '蜡烛已备好'],
    'plane': ['航班已就绪', '行李收拾好了吗'],
    'tent': ['帐篷已搭好', '星空在等你'],
    'book': ['书页已翻开', '故事等你续写'],
    'heart': ['心跳加速中', '准备好了吗'],
    'flower': ['花朵已盛开', '花香在等你'],
    'ticket': ['票根在手', '座位已预留'],
    'sparkle': ['闪光时刻将至', '光芒在等你'],
  }
  const templates = map[iconType]
  if (templates) {
    return templates[Math.floor(Math.random() * templates.length)]
  }
  return ''
}

/** 从 localStorage 加载数据（带容错处理）
 *  返回 null 表示首次使用（无 key），调用方可回退到 mock 示例
 *  返回 [] 表示已重置或用户清空，调用方应保持空列表
 */
function loadFromStorage(): CountdownItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      // 空数组直接返回，让调用方知道"已重置"，不再回退 mock
      if (parsed.length === 0) return []
      // 验证每个条目，过滤无效数据
      return parsed.filter(item =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.targetDate === 'string'
      )
    }
    return null
  } catch (e) {
    console.error('Failed to load countdowns from storage:', e)
    // 尝试从备份恢复
    try {
      const backup = localStorage.getItem(STORAGE_KEY + '_backup')
      if (backup) {
        const parsed = JSON.parse(backup)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(item =>
            item &&
            typeof item.id === 'string' &&
            typeof item.title === 'string'
          )
        }
      }
    } catch {
      console.error('Backup restore also failed')
    }
    return null
  }
}

/** 保存数据到 localStorage（带备份机制） */
function saveToStorage(countdowns: CountdownItem[]): void {
  try {
    const dataStr = JSON.stringify(countdowns)
    localStorage.setItem(STORAGE_KEY, dataStr)
    // 同时保存一份备份
    localStorage.setItem(STORAGE_KEY + '_backup', dataStr)
  } catch (e) {
    console.error('Failed to save countdowns to storage:', e)
    // 如果主存储失败，尝试保存到备份
    try {
      localStorage.setItem(STORAGE_KEY + '_backup', JSON.stringify(countdowns))
    } catch {
      console.error('Backup save also failed')
    }
  }
}

/** 压缩照片到指定宽度，返回 Base64 字符串 */
function compressPhoto(file: File, maxWidth = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        
        // 如果图片太大，按比例缩小
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }
        // 白色背景
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        
        // 压缩为 JPEG，质量 0.8
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

// ==================== 信封图标组件 ====================

/** 信封图标组件（支持封存/解封两种状态） */
function EnvelopeIcon({ 
  hasLetter, 
  days, 
  onClick 
}: { 
  hasLetter: boolean
  days: number
  onClick?: () => void
}) {
  const isOpen = days <= 0
  
  if (!hasLetter) return null
  
  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation()
        if (isOpen && onClick) onClick()
      }}
      whileTap={isOpen ? { scale: 0.9 } : {}}
      animate={!isOpen ? { scale: [1, 1.05, 1] } : {}}
      transition={!isOpen ? { duration: 2, repeat: Infinity } : { duration: 0.2 }}
      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
        isOpen 
          ? 'cursor-pointer bg-[#D9B36A]/10 hover:bg-[#D9B36A]/20' 
          : 'cursor-not-allowed bg-stone-100/50'
      }`}
      title={isOpen ? '点击查看时光信件' : '时光信件封存中'}
      aria-label={isOpen ? '查看时光信件' : '时光信件封存中'}
    >
      <CountdownIcon 
        type={isOpen ? 'envelope-open' : 'envelope-closed'} 
        size={20} 
        color={isOpen ? '#B89347' : '#999'} 
      />
    </motion.button>
  )
}

// ==================== 查看信件弹窗 ====================

interface ViewLetterModalProps {
  item: CountdownItem | null
  onClose: () => void
}

/** 查看时光信件弹窗 */
function ViewLetterModal({ item, onClose }: ViewLetterModalProps) {
  if (!item?.letter) return null
  
  const letterContent = decryptLetter(item.letter)
  const days = getDaysUntil(item.targetDate)
  
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-4 w-[88%] max-w-[380px] rounded-2xl bg-[#FFFBF4] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CountdownIcon type="envelope-open" size={24} color="#B89347" />
            <h2 className="font-serif text-[18px] font-semibold text-[#8B6F4E]">
              时光信件
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-stone-100"
            aria-label="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 信纸内容 */}
        <div className="relative mb-4 rounded-xl border border-[#D9B36A]/20 bg-white/60 p-4">
          {/* 纸张纹理装饰 */}
          <div className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 27px, #E8DDD0 27px, #E8DDD0 28px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="relative whitespace-pre-wrap font-serif text-[14px] leading-7 text-foreground"
          >
            {letterContent}
          </motion.div>
        </div>

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>写于 {formatDate(item.createdAt.split('T')[0])}</span>
          <span className="text-[#B89347]">
            {days === 0 ? '就是今天' : days > 0 ? `已过去 ${days} 天` : `还有 ${Math.abs(days)} 天`}
          </span>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-[#D9B36A]/30 bg-white/60 py-3 font-serif text-[15px] text-[#8B6F4E] transition-colors hover:bg-[#D9B36A]/10 active:scale-[0.98]"
        >
          合上信笺
        </button>
      </motion.div>
    </motion.div>,
    document.body
  )
}

// ==================== 添加弹窗组件 ====================

// ==================== 记录此刻弹窗组件 ====================

interface RecordMomentModalProps {
  item: CountdownItem | null
  onClose: () => void
  onSave: (photo: string, text: string) => void
}

/** 记录此刻瞬间弹窗（照片 + 感悟） */
function RecordMomentModal({ item, onClose, onSave }: RecordMomentModalProps) {
  const [photo, setPhoto] = useState<string>('')
  const [text, setText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  
  if (!item) return null
  
  const MAX_TEXT_LENGTH = 100
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // 限制文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('照片不能超过 5MB')
      return
    }
    
    setIsUploading(true)
    try {
      const compressed = await compressPhoto(file, 800)
      setPhoto(compressed)
    } catch (err) {
      console.error('Photo compression failed:', err)
      alert('照片处理失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleSubmit = () => {
    if (!photo && !text.trim()) return
    onSave(photo, text.trim())
    onClose()
  }
  
  const handleRemovePhoto = () => {
    setPhoto('')
  }
  
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-4 w-[90%] max-w-[360px] rounded-2xl bg-[#FFFBF4] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B89347" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="8" width="18" height="13" rx="2" />
              <circle cx="12" cy="14" r="3" />
              <path d="M8 8 L9 5 L15 5 L16 8" />
            </svg>
            <h2 className="font-serif text-[18px] font-semibold text-[#8B6F4E]">
              记录此刻
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-stone-100"
            aria-label="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        {/* 事件名称 */}
        <div className="mb-3 rounded-lg bg-[#F6EBDD]/50 px-3 py-2">
          <span className="font-serif text-[15px] text-[#8B6F4E]">
            「{item.title}」
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {formatDate(item.targetDate)}
          </span>
        </div>

        {/* 照片上传区 */}
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>拍一张照片（选填）</span>
          </label>
          
          {photo ? (
            <div className="relative overflow-hidden rounded-xl">
              <img 
                src={photo} 
                alt="已选择的照片"
                className="w-full object-cover"
                style={{ maxHeight: 180 }}
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                aria-label="删除照片"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#B8934E]/30 bg-[#F6EBDD]/20 py-6 transition-colors hover:border-[#B8934E]/50 hover:bg-[#F6EBDD]/40">
              {isUploading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  处理中...
                </div>
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B89347" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                    <rect x="3" y="8" width="18" height="13" rx="2" />
                    <circle cx="12" cy="14" r="3" />
                    <path d="M8 8 L9 5 L15 5 L16 8" />
                  </svg>
                  <span className="text-sm text-[#B8934E]/70">点击选择照片</span>
                  <span className="text-xs text-muted-foreground/50">最大 5MB，自动压缩到 800px</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
        
        {/* 感悟文字 */}
        <div className="mb-5">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h10M4 18h16" />
            </svg>
            <span>写一句感悟（选填）</span>
          </label>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
              placeholder="此刻的心情、想记住的细节……"
              className="h-20 w-full resize-none rounded-xl border border-[#E8DDD0] bg-white/60 p-3 font-serif text-[14px] text-foreground outline-none transition-colors focus:border-[#B8934E]/50"
              maxLength={MAX_TEXT_LENGTH}
            />
            <span className="absolute bottom-2 right-3 text-xs text-muted-foreground/50">
              {text.length} / {MAX_TEXT_LENGTH}
            </span>
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!photo && !text.trim()}
          className="w-full rounded-xl bg-gradient-to-r from-[#D4A853] to-[#B89347] py-3 font-serif text-[15px] text-white shadow-md shadow-[#B8934E]/20 transition-all hover:shadow-lg hover:shadow-[#B8934E]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-md"
        >
          珍藏此刻
        </button>
      </motion.div>
    </motion.div>,
    document.body
  )
}

// ==================== 添加弹窗组件 ====================

interface AddCountdownModalProps {
  onClose: () => void
  onSave: (item: Omit<CountdownItem, 'id' | 'isPinned' | 'createdAt'>) => void
}

/**
 * 添加倒数日弹窗（含寄语 + 时光信件）
 */
function AddCountdownModal({ onClose, onSave }: AddCountdownModalProps) {
  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [selectedIcon, setSelectedIcon] = useState<CountdownIconType>('sparkle')
  const [tagline, setTagline] = useState('')
  const [letter, setLetter] = useState('')

  const handleSubmit = () => {
    if (!title.trim() || !targetDate) return
    const item: Omit<CountdownItem, 'id' | 'isPinned' | 'createdAt'> = {
      title: title.trim(),
      targetDate,
      iconType: selectedIcon
    }
    if (tagline.trim()) {
      item.tagline = tagline.trim()
    }
    if (letter.trim()) {
      item.letter = encryptLetter(letter.trim())
    }
    onSave(item)
    setTitle('')
    const d = new Date()
    d.setDate(d.getDate() + 7)
    setTargetDate(d.toISOString().split('T')[0])
    setSelectedIcon('sparkle')
    setTagline('')
    setLetter('')
    onClose()
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="mx-4 w-[88%] max-w-[380px] max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CountdownIcon type="sparkle" size={24} color="#8B6F4E" />
            <h2 className="font-serif text-[18px] font-semibold text-foreground">
              种下新盼头
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-stone-100"
            aria-label="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 事件名称 */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm text-muted-foreground">事件名称</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入期待的事，如：看海"
            className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2.5 font-serif text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:border-[#D9B36A] focus:outline-none focus:ring-1 focus:ring-[#D9B36A]/30"
            maxLength={30}
          />
        </div>

        {/* 目标日期 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm text-muted-foreground">目标日期</label>
          <div className="relative">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2.5 font-mono text-[15px] text-foreground focus:border-[#D9B36A] focus:outline-none focus:ring-1 focus:ring-[#D9B36A]/30"
            />
          </div>
        </div>

        {/* 图标选择 */}
        <div className="mb-5">
          <label className="mb-2 block text-sm text-muted-foreground">选个小符号</label>
          <div className="flex flex-wrap gap-2">
            {iconOptions.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => setSelectedIcon(type)}
                className={`flex h-12 w-12 flex-col items-center justify-center rounded-lg border transition-all ${
                  selectedIcon === type
                    ? 'border-[#D9B36A] bg-[#F6EBDD]/60'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
                title={label}
              >
                <CountdownIcon type={type} size={24} color={selectedIcon === type ? '#8B6F4E' : '#999'} />
              </button>
            ))}
          </div>
        </div>

        {/* 寄语（选填） */}
        <div className="mb-5">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            {/* 手绘花朵图标 */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2" />
              <path d="M12 4 Q14 7 12 10 Q10 7 12 4" />
              <path d="M12 14 Q14 17 12 20 Q10 17 12 14" />
              <path d="M4 12 Q7 10 10 12 Q7 14 4 12" />
              <path d="M14 12 Q17 10 20 12 Q17 14 14 12" />
            </svg>
            <span>这一天对你意味着什么（选填）</span>
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="一句话，比如：想看一次真正的大海"
            className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2.5 font-serif text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:border-[#D9B36A] focus:outline-none focus:ring-1 focus:ring-[#D9B36A]/30"
            maxLength={30}
          />
          {tagline && (
            <p className="mt-1 text-right text-[11px] text-muted-foreground/50">
              {tagline.length}/30 字
            </p>
          )}
        </div>

        {/* 时光信件（选填） */}
        <div className="mb-6">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            {/* 手绘笔图标 */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3 L21 8 L9 20 L4 20 L4 15 Z" />
              <line x1="12" y1="11" x2="17" y2="16" strokeWidth="1" />
            </svg>
            <span>写一封给那天的信（选填）</span>
          </label>
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            placeholder="对那时的自己或这件事说点什么吧，倒计时归零前它会被秘密封存……"
            rows={3}
            className="w-full resize-none rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2.5 font-serif text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:border-[#D9B36A] focus:outline-none focus:ring-1 focus:ring-[#D9B36A]/30"
            maxLength={500}
          />
          {letter && (
            <p className="mt-1 text-right text-[11px] text-muted-foreground/50">
              {letter.length} 字 · 到期后可查看
            </p>
          )}
        </div>

        {/* 保存按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="w-full rounded-xl bg-[#D9B36A] py-3 font-serif text-[16px] font-medium text-white transition-colors hover:bg-[#C4A05C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          把日子定下来
        </button>
      </motion.div>
    </motion.div>,
    document.body
  )
}

// ==================== 焦点大卡片组件 ====================

interface CountdownHeroCardProps {
  item: CountdownItem
  isAnimating?: boolean
  onViewLetter?: () => void
  onRecordMoment?: () => void
}

/** 焦点大卡片组件（支持拍立得归零态） */
function CountdownHeroCard({ item, isAnimating, onViewLetter, onRecordMoment }: CountdownHeroCardProps) {
  const days = getDaysUntil(item.targetDate)
  const dateStr = formatDate(item.targetDate)
  const expiryStatus = getExpiryStatus(days)
  const isExpired = days < 0
  const isToday = days === 0
  
  // 诗意提醒
  const poeticReminder = !isExpired && !isToday ? getPoeticReminder(days, item) : null
  const iconReminder = poeticReminder ? getIconReminder(item.iconType) : null

  // 拍立得归零态 - 精致版
  if (isToday) {
    return (
      <motion.div
        layout
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl bg-white p-5 shadow-xl"
        style={{ 
          boxShadow: '0 8px 32px rgba(184, 147, 78, 0.18), 0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(232, 221, 208, 0.8)'
        }}
      >
        {/* 四角装饰 */}
        <svg className="absolute left-2 top-2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#B89347" strokeWidth="1.2" strokeLinecap="round">
          <path d="M2 14 L2 2 L14 2" />
        </svg>
        <svg className="absolute right-2 top-2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#B89347" strokeWidth="1.2" strokeLinecap="round">
          <path d="M14 14 L14 2 L2 2" />
        </svg>
        <svg className="absolute left-2 bottom-2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#B89347" strokeWidth="1.2" strokeLinecap="round">
          <path d="M2 2 L2 14 L14 14" />
        </svg>
        <svg className="absolute right-2 bottom-2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#B89347" strokeWidth="1.2" strokeLinecap="round">
          <path d="M14 2 L14 14 L2 14" />
        </svg>

        {/* 顶部装饰条 - 细腻烫金 */}
        <div className="absolute left-4 right-4 top-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4A853]/60 to-[#D4A853]/80" />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B89347" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2 L14 8 L20 10 L14 12 L12 18 L10 12 L4 10 L10 8 Z" />
          </svg>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#D4A853]/60 to-[#D4A853]/80" />
        </div>

        {/* 内容区 - 卡片式布局 */}
        <div className="mt-5">
          {/* 顶部信息行 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F6EBDD] to-[#E8DDD0] shadow-inner">
                <CountdownIcon type={item.iconType} size={28} color="#B89347" />
              </div>
              <div>
                <h3 className="font-serif text-[19px] font-medium tracking-wide text-[#8B6F4E]">
                  {item.title}
                </h3>
                {item.tagline && (
                  <p className="mt-0.5 font-serif text-[13px] leading-5 italic tracking-wide text-[#B8934E]/60">
                    「{item.tagline}」
                  </p>
                )}
              </div>
            </div>
            <EnvelopeIcon 
              hasLetter={!!item.letter} 
              days={days}
              onClick={onViewLetter}
            />
          </div>

          {/* 中央照片区 - 带边框的内衬 */}
          <div className="relative my-4">
            {/* 外框装饰线 */}
            <div className="absolute -inset-0.5 rounded-xl border border-[#E8DDD0]/80" />
            
            {/* 今天印章 - 盖在右上角（固定倾斜角度，无动画） */}
            <div
              className="absolute -right-4 -top-3 z-10"
              style={{ transform: 'rotate(-8deg)' }}
            >
              {/* SVG 印章 */}
              <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 滤镜：粗糙盖章效果 */}
                <defs>
                  <filter id="rough-stamp" x="-15%" y="-15%" width="130%" height="130%">
                    <feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="3" result="noise" seed="5" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                  </filter>
                  <filter id="ink-bleed" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.5" />
                  </filter>
                </defs>
                
                {/* 印章外框 - 不规则矩形（真实盖章感） */}
                <g filter="url(#rough-stamp)" style={{ opacity: 0.85 }}>
                  <path
                    d="M8 12 Q7 10 10 9 L20 8 Q34 7 48 9 L58 10 Q60 12 59 15 L60 34 Q59 52 57 56 L54 58 Q52 59 48 58 L34 57 Q20 58 14 58 L10 56 Q8 54 9 50 L8 34 Q7 18 8 12 Z"
                    fill="#C97B63"
                  />
                  
                  {/* 内框装饰 */}
                  <path
                    d="M14 16 L16 14 Q34 13 52 14 L54 16 L55 34 Q54 52 52 54 L48 55 Q34 54 20 55 L16 54 L14 50 L13 34 Q14 18 14 16 Z"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.2"
                    opacity="0.4"
                  />
                </g>
                
                {/* 文字 - 今天（更粗糙的叠印效果） */}
                <g filter="url(#rough-stamp)" style={{ opacity: 0.9 }}>
                  <text
                    x="34"
                    y="32"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="serif"
                    fontSize="17"
                    fontWeight="bold"
                    fill="#fff"
                    style={{ letterSpacing: '2px' }}
                  >
                    今天
                  </text>
                  <text
                    x="34"
                    y="48"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="serif"
                    fontSize="6"
                    fill="#fff"
                    opacity="0.7"
                    style={{ letterSpacing: '3px' }}
                  >
                    TODAY
                  </text>
                </g>
              </svg>
            </div>

            {/* 内部内容 */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#FDF9F3] via-[#FBF6EE] to-[#F6EBDD]/40 px-6 py-8">
              {/* 微妙纹理背景 */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B6F4E' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              {/* 主内容 */}
              <div className="relative flex flex-col items-center">
                {/* 大数字 */}
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="font-serif text-[80px] font-bold leading-none"
                  style={{ 
                    background: 'linear-gradient(180deg, #E5C47A 0%, #D4A853 30%, #B89347 60%, #A67C3A 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 2px 4px rgba(184, 147, 78, 0.25))',
                  }}
                >
                  0
                </motion.div>
                <span className="mt-0.5 text-sm font-medium tracking-wider text-[#B8934E]/70">天</span>

                {/* 装饰星点 */}
                <div className="absolute left-2 top-4 flex flex-col gap-1">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="#D4A853" opacity="0.4">
                    <path d="M12 2 L13.5 9 L20 10.5 L13.5 12 L12 19 L10.5 12 L4 10.5 L10.5 9 Z" />
                  </svg>
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="#D4A853" opacity="0.3">
                    <path d="M12 2 L13.5 9 L20 10.5 L13.5 12 L12 19 L10.5 12 L4 10.5 L10.5 9 Z" />
                  </svg>
                </div>

                {/* 归零文案 */}
                <div className="mt-6 flex items-center gap-2">
                  <div className="h-px w-6 bg-gradient-to-r from-transparent to-[#B8934E]/40" />
                  <p className="font-serif text-[15px] text-[#8B6F4E]">
                    今天，记得回来留下此刻
                  </p>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B6F4E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22 C12 22 5 18 5 10 C5 6 8 4 12 4 C16 4 19 6 19 10 C19 18 12 22 12 22 Z" />
                    <path d="M12 4 L12 22" strokeWidth="0.8" />
                  </svg>
                  <div className="h-px w-6 bg-gradient-to-l from-transparent to-[#B8934E]/40" />
                </div>
              </div>
            </div>
          </div>

          {/* 底部信息 + 记录按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm tracking-wider text-[#8B6F4E]/50">
                {dateStr}
              </span>
              {item.tag && (
                <span className="rounded-full bg-[#B8934E]/8 px-2 py-0.5 text-[11px] font-medium text-[#B89347]">
                  {item.tag}
                </span>
              )}
            </div>
            
            {/* 记录按钮 - 精致版 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRecordMoment?.()
              }}
              className="group relative flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#D4A853]/90 to-[#B89347]/90 px-4 py-2 font-serif text-[13px] text-white shadow-md shadow-[#B8934E]/20 transition-all hover:shadow-lg hover:shadow-[#B8934E]/30 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8" width="18" height="13" rx="2" />
                <circle cx="12" cy="14" r="3" />
                <path d="M8 8 L9 5 L15 5 L16 8" />
              </svg>
              <span>记录此刻</span>
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // 普通状态卡片
  return (
    <motion.div
      layout
      transition={{
        layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 }
      }}
      className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-colors ${
        isExpired 
          ? 'border-stone-200/60 bg-stone-100/50' 
          : 'border-stone-200/60 bg-gradient-to-br from-[#FFF9F0] to-[#F6EBDD]/50'
      }`}
    >
      {/* 点击置顶成功的光效 */}
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      )}

      {/* 背景装饰 */}
      <div className="pointer-events-none absolute -right-4 -top-4 opacity-15">
        <CountdownIcon type="sparkle" size={80} color={isExpired ? '#999' : '#8B6F4E'} />
      </div>

      {/* 标签区 */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        {/* 时光信件信封 */}
        <EnvelopeIcon 
          hasLetter={!!item.letter} 
          days={days}
          onClick={onViewLetter}
        />
        {item.tag && (
          <span className="inline-flex items-center rounded-full bg-sakura/15 px-3 py-1 text-xs font-medium text-sakura">
            {item.tag}
          </span>
        )}
        {expiryStatus && (
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${expiryStatus.colorClass}`}>
            {expiryStatus.text}
          </span>
        )}
      </div>

      {/* 图标和名称 */}
      <div className="mb-3 flex items-center gap-3">
        <CountdownIcon type={item.iconType} size={44} color={isExpired ? '#999' : '#8B6F4E'} />
        <h3 className={`font-serif text-[19px] font-medium tracking-wide ${isExpired ? 'text-stone-500' : 'text-foreground'}`}>
          {item.title}
        </h3>
      </div>

      {/* 寄语 */}
      {item.tagline && (
        <p className={`mb-2 font-serif text-[14px] italic ${isExpired ? 'text-stone-400' : 'text-[#B8934E]/70'}`}>
          「{item.tagline}」
        </p>
      )}
      
      {/* 诗意提醒 */}
      {poeticReminder && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3 flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8934E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="font-serif text-[13px] italic text-[#B8934E]/70">
            {poeticReminder}
          </span>
          {iconReminder && (
            <span className="font-serif text-[11px] text-[#B8934E]/50">
              · {iconReminder}
            </span>
          )}
        </motion.div>
      )}

      {/* 剩余天数 */}
      <div className="mb-4 flex items-baseline gap-2">
        <CountUp
          key={item.id}
          to={Math.abs(days)}
          from={0}
          duration={0.8}
          className={`font-serif text-[56px] font-bold leading-none ${isExpired ? 'text-stone-400' : 'text-[#8B6F4E]'}`}
        />
        <span className="text-lg text-muted-foreground">{isExpired ? '天前' : '天'}</span>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {isExpired ? '已过期' : '距离这一天还有'}
      </p>

      {/* 日期 */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-base tracking-wider text-muted-foreground">
          {dateStr}
        </span>
      </div>

      {/* 底部装饰线 */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-300/50 to-transparent" />
    </motion.div>
  )
}

// ==================== 列表项卡片组件 ====================

interface CountdownItemCardProps {
  item: CountdownItem
  onClick?: () => void
  onViewLetter?: () => void
  isNewPinned?: boolean
  onLongPressDelete?: () => void
}

/** 列表项卡片组件 */
function CountdownItemCard({ item, onClick, onViewLetter, isNewPinned, onLongPressDelete }: CountdownItemCardProps) {
  const days = getDaysUntil(item.targetDate)
  const dateStr = formatDate(item.targetDate)
  const expiryStatus = getExpiryStatus(days)
  const isExpired = days < 0
  
  // 诗意提醒（应用内，非推送）
  const poeticReminder = !isExpired ? getPoeticReminder(days, item) : null
  const iconReminder = poeticReminder ? getIconReminder(item.iconType) : null

  const { start, cancel, progress } = useLongPress(() => {
    onLongPressDelete?.()
  }, 3000)

  return (
    <motion.div
      layout
      onClick={onClick}
      onPointerDown={onLongPressDelete ? start : undefined}
      onPointerUp={onLongPressDelete ? cancel : undefined}
      onPointerLeave={onLongPressDelete ? cancel : undefined}
      onPointerCancel={onLongPressDelete ? cancel : undefined}
      transition={{
        layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border px-4 py-4 shadow-sm transition-all hover:shadow-md ${
        isExpired 
          ? 'border-stone-200/60 bg-stone-50/50' 
          : 'border-stone-200/60 bg-white/70 hover:bg-white'
      } ${isNewPinned ? 'ring-2 ring-[#D9B36A]/50' : ''}`}
    >
      {/* 长按删除进度条 */}
      {progress > 0 && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-1 bg-[#D9B36A]/20">
          <div
            className="h-full bg-[#D9B36A] transition-all duration-75"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
      {/* 新置顶卡片的高光效果 */}
      {isNewPinned && (
        <motion.div
          initial={{ left: '-100%' }}
          animate={{ left: '200%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[#D9B36A]/20 to-transparent"
          style={{ width: '50%', transform: 'skewX(-20deg)' }}
        />
      )}

      <div className="flex items-center gap-3">
        {/* 左侧图标 */}
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
          isExpired ? 'bg-stone-100' : 'bg-[#F6EBDD]/60'
        }`}>
          <CountdownIcon type={item.iconType} size={28} color={isExpired ? '#999' : '#8B6F4E'} />
        </div>

        {/* 中间内容 */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-serif text-[16px] font-medium truncate ${isExpired ? 'text-stone-400' : 'text-foreground'}`}>
            {item.title}
          </h4>
          {item.tagline && (
            <p className={`mt-0.5 truncate font-serif text-[12px] italic ${isExpired ? 'text-stone-400' : 'text-[#B8934E]/60'}`}>
              {item.tagline}
            </p>
          )}
          <div className="mt-0.5 flex items-center gap-2">
            <p className="font-mono text-xs text-muted-foreground/70">
              {dateStr}
            </p>
            {expiryStatus && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${expiryStatus.colorClass}`}>
                {expiryStatus.text}
              </span>
            )}
          </div>
          {/* 诗意提醒 */}
          {poeticReminder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-1 flex items-center gap-1"
            >
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#B8934E]/20 to-[#B8934E]/30" />
              <span className="font-serif text-[11px] italic text-[#B8934E]/60 whitespace-nowrap">
                {poeticReminder}
              </span>
              {iconReminder && (
                <span className="font-serif text-[10px] text-[#B8934E]/50 whitespace-nowrap">
                  · {iconReminder}
                </span>
              )}
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#B8934E]/20 to-[#B8934E]/30" />
            </motion.div>
          )}
        </div>

        {/* 右侧：信封 + 天数 */}
        <div className="flex flex-col items-end gap-1">
          {/* 时光信件信封 */}
          <EnvelopeIcon 
            hasLetter={!!item.letter} 
            days={days}
            onClick={onViewLetter}
          />
          <div className="flex flex-col items-end">
            <span className={`font-serif text-2xl font-bold leading-none ${isExpired ? 'text-stone-400' : 'text-[#8B6F4E]'}`}>
              {Math.abs(days)}
            </span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">
              {isExpired ? `${Math.abs(days)} 天前` : days === 0 ? '就是今天' : `还有 ${days} 天`}
            </span>
          </div>
        </div>
      </div>

      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  )
}

// ==================== 时光册页面组件 ====================

interface ArchivePageProps {
  items: CountdownItem[]
  onBack: () => void
  onViewLetter: (item: CountdownItem) => void
}

/** 单张拍立得卡片组件（用于时光册） */
function ArchivePhotoCard({ 
  item, 
  onViewLetter, 
  onExpand 
}: { 
  item: CountdownItem
  onViewLetter: (item: CountdownItem) => void
  onExpand: (item: CountdownItem) => void
}) {
  const days = getDaysUntil(item.targetDate)
  const isPast = days < 0
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onExpand(item)}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#E8DDD0] bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 照片区 */}
      <div className="relative overflow-hidden">
        {item.momentPhoto ? (
          <img 
            src={item.momentPhoto} 
            alt={item.title}
            className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-[#F6EBDD]/80 to-[#FDF9F3]">
            <CountdownIcon type={item.iconType} size={36} color="#B89347" />
          </div>
        )}
        
        {/* 过往印章 */}
        <div
          className="absolute -right-3 -top-3 z-10"
          style={{ transform: 'rotate(-8deg)' }}
        >
          <svg width="56" height="56" viewBox="0 0 68 68" fill="none">
            <defs>
              <filter id="rough-archived" x="-15%" y="-15%" width="130%" height="130%">
                <feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="3" result="noise" seed="7" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
              </filter>
            </defs>
            <g filter="url(#rough-archived)" style={{ opacity: 0.75 }}>
              <path
                d="M8 12 Q7 10 10 9 L20 8 Q34 7 48 9 L58 10 Q60 12 59 15 L60 34 Q59 52 57 56 L54 58 Q52 59 48 58 L34 57 Q20 58 14 58 L10 56 Q8 54 9 50 L8 34 Q7 18 8 12 Z"
                fill="#8B6F4E"
              />
              <text x="34" y="33" textAnchor="middle" dominantBaseline="middle" fontFamily="serif" fontSize="16" fontWeight="bold" fill="#fff" style={{ letterSpacing: '1px' }}>
                过往
              </text>
              <text x="34" y="47" textAnchor="middle" dominantBaseline="middle" fontFamily="serif" fontSize="5" fill="#fff" opacity="0.6" style={{ letterSpacing: '2px' }}>
                MEMORY
              </text>
            </g>
          </svg>
        </div>
        
        {/* 日期戳 */}
        <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-0.5 font-mono text-[10px] text-[#8B6F4E] shadow-sm backdrop-blur">
          {formatDate(item.targetDate)}
        </div>
      </div>
      
      {/* 内容区 */}
      <div className="p-3">
        {/* 事件名 + 天数 */}
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="flex-1 truncate font-serif text-[13px] font-medium text-[#5A4633]">
            {item.title}
          </h3>
          <span className="flex-shrink-0 font-mono text-[11px] text-[#B8934E]/70">
            {isPast ? `${Math.abs(days)} 天前` : '今天'}
          </span>
        </div>
        
        {/* 感悟（优先显示） */}
        {item.momentText ? (
          <p className="mb-2 line-clamp-2 font-serif text-[11px] leading-relaxed text-[#5A4633]">
            「{item.momentText}」
          </p>
        ) : item.tagline ? (
          <p className="mb-2 line-clamp-2 font-serif text-[11px] italic leading-relaxed text-[#B8934E]/60">
            {item.tagline}
          </p>
        ) : (
          <p className="mb-2 font-serif text-[11px] text-muted-foreground/40 italic">
            未留下记录
          </p>
        )}
        
        {/* 底部：信封 + 归档时间 */}
        <div className="flex items-center justify-between">
          {item.letter ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewLetter(item)
              }}
              className="flex items-center gap-1 rounded-full bg-[#B8934E]/10 px-2 py-0.5 text-[10px] text-[#B89347] transition-colors hover:bg-[#B8934E]/20"
            >
              <CountdownIcon type="envelope-open" size={12} color="#B89347" />
              <span>时光信件</span>
            </button>
          ) : (
            <span className="text-[10px] text-muted-foreground/30">无信件</span>
          )}
          {item.archivedAt && (
            <span className="font-mono text-[10px] text-muted-foreground/40">
              珍藏于 {formatTime(item.archivedAt)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/** 时光册页面 - 瀑布流布局 */
function ArchivePage({ items, onBack, onViewLetter }: ArchivePageProps) {
  const [expandedItem, setExpandedItem] = useState<CountdownItem | null>(null)
  
  const archivedItems = items
    .filter(item => {
      const days = getDaysUntil(item.targetDate)
      return days < 0 || item.archivedAt
    })
    .sort((a, b) => {
      // 有归档时间的按归档时间排序，否则按目标日期排序
      const timeA = a.archivedAt ? new Date(a.archivedAt).getTime() : new Date(a.targetDate).getTime()
      const timeB = b.archivedAt ? new Date(b.archivedAt).getTime() : new Date(b.targetDate).getTime()
      return timeB - timeA
    })
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="app-scrollbar flex h-screen flex-col overflow-hidden bg-[#FBF6EE]"
    >
      {/* 顶部标题区 */}
      <header className="relative flex flex-shrink-0 items-center justify-between px-5 pt-[calc(3rem+var(--wi-sb,0px))] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-stone-100"
            aria-label="返回"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="font-serif text-[22px] font-semibold tracking-wide text-foreground">
              时光册
            </h1>
            <p className="text-[13px] text-muted-foreground">
              过往的日子，都在此珍藏
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#B8934E]/10 px-3 py-1 text-sm font-medium text-[#B89347]">
          {archivedItems.length} 个被珍藏的日子
        </span>
      </header>

      {/* 内容区 - 瀑布流 */}
      <main className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-28">
        {archivedItems.length > 0 ? (
          <div className="columns-2 gap-3 [column-fill:_balance]">
            <AnimatePresence>
              {archivedItems.map(item => (
                <div key={item.id} className="mb-3 break-inside-avoid">
                  <ArchivePhotoCard
                    item={item}
                    onViewLetter={onViewLetter}
                    onExpand={setExpandedItem}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="mt-24 flex flex-col items-center gap-5 text-center">
            {/* 手绘相机插画 */}
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="20" width="64" height="48" rx="4" stroke="#B8934E" strokeWidth="1.5" fill="#F6EBDD"/>
              <circle cx="40" cy="44" r="14" stroke="#B8934E" strokeWidth="1.5" fill="#FBF6EE"/>
              <circle cx="40" cy="44" r="8" stroke="#D4A853" strokeWidth="1" fill="#F6EBDD"/>
              <path d="M24 20 L28 12 L52 12 L56 20" stroke="#B8934E" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
              <circle cx="40" cy="44" r="3" fill="#D4A853"/>
              {/* 装饰星点 */}
              <circle cx="18" cy="14" r="2" fill="#D4A853" opacity="0.5"/>
              <circle cx="66" cy="10" r="1.5" fill="#D4A853" opacity="0.4"/>
              <path d="M12 68 L20 60 L28 68" stroke="#B8934E" strokeWidth="1" opacity="0.3" fill="none"/>
            </svg>
            <div className="space-y-2">
              <p className="font-serif text-[16px] text-[#8B6F4E]">
                还没有过往的日子
              </p>
              <p className="text-sm text-muted-foreground/60">
                等期待的日子归零，这里会变成一本温柔的相册
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 展开详情弹窗 */}
      <AnimatePresence>
        {expandedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setExpandedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mx-4 w-[90%] max-w-[340px] overflow-hidden rounded-2xl bg-[#FFFBF4] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 照片区 */}
              {expandedItem.momentPhoto && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img 
                    src={expandedItem.momentPhoto} 
                    alt={expandedItem.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-0.5 font-mono text-[11px] text-[#8B6F4E] shadow-sm">
                    {formatDate(expandedItem.targetDate)}
                  </div>
                </div>
              )}
              
              <div className="p-5">
                {/* 标题 */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h2 className="font-serif text-[18px] font-semibold text-[#5A4633]">
                      {expandedItem.title}
                    </h2>
                    {expandedItem.tagline && (
                      <p className="mt-0.5 font-serif text-[13px] italic text-[#B8934E]/70">
                        「{expandedItem.tagline}」
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandedItem(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-stone-100"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                
                {/* 感悟 */}
                {expandedItem.momentText && (
                  <div className="mb-4 rounded-lg bg-[#F6EBDD]/40 p-3">
                    <p className="mb-1 text-[11px] text-muted-foreground">那一刻的感悟</p>
                    <p className="font-serif text-[14px] leading-relaxed text-[#5A4633]">
                      「{expandedItem.momentText}」
                    </p>
                  </div>
                )}
                
                {/* 时光信件 */}
                {expandedItem.letter && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        onViewLetter(expandedItem)
                        setExpandedItem(null)
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#B8934E]/30 bg-[#B8934E]/5 py-3 font-serif text-[14px] text-[#B89347] transition-colors hover:bg-[#B8934E]/10"
                    >
                      <CountdownIcon type="envelope-open" size={18} color="#B89347" />
                      <span>拆开时光信件</span>
                    </button>
                  </div>
                )}
                
                {/* 归档信息 */}
                <div className="border-t border-stone-100 pt-3 text-center">
                  <p className="text-[12px] text-muted-foreground/60">
                    {expandedItem.archivedAt 
                      ? `珍藏于 ${formatDate(expandedItem.archivedAt)}`
                      : formatDate(expandedItem.targetDate)
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ==================== 删除确认弹窗组件 ====================

interface DeleteConfirmModalProps {
  item: CountdownItem
  onConfirm: () => void
  onClose: () => void
}

/** 长按删除确认弹窗 */
function DeleteConfirmModal({ item, onConfirm, onClose }: DeleteConfirmModalProps) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="mx-6 w-full max-w-[320px] rounded-2xl border border-stone-200 bg-[#FBF9F1] p-5 shadow-xl"
      >
        {/* 标题 */}
        <h3 className="mb-2 text-center font-serif text-[17px] font-medium text-foreground">
          确认删除这个日子吗
        </h3>
        {/* 倒计时标题 */}
        <p className="mb-1 text-center font-serif text-[15px] text-[#8B6F4E]">
          {item.title}
        </p>
        {/* 提示 */}
        <p className="mb-5 text-center text-[12px] text-muted-foreground/70">
          删除后无法恢复，连同时光信一起珍藏归零
        </p>
        {/* 按钮组 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-stone-200 bg-white/60 py-2.5 font-serif text-[15px] text-muted-foreground transition-colors hover:bg-stone-100 active:scale-[0.98]"
          >
            再想想
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#C97A5E] py-2.5 font-serif text-[15px] text-white transition-colors hover:bg-[#B86A4E] active:scale-[0.98]"
          >
            确认删除
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

// ==================== 主页面组件 ====================

interface CountdownPageProps {
  onBack?: () => void
}

/**
 * 盼兮主页面
 */
export function CountdownPage({ onBack }: CountdownPageProps) {
  // 初始化时从 localStorage 加载，首次使用返回空数组
  const [countdowns, setCountdowns] = useState<CountdownItem[]>(() => {
    const saved = loadFromStorage()
    // null = 首次使用（无 key）→ 空列表
    // [] = 已重置/清空 → 保持空列表
    return saved ?? []
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [animatingId, setAnimatingId] = useState<string | null>(null)
  const [viewingLetterItem, setViewingLetterItem] = useState<CountdownItem | null>(null)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [recordingMomentItem, setRecordingMomentItem] = useState<CountdownItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<CountdownItem | null>(null)

  // 数据变化时保存到 localStorage
  useEffect(() => {
    saveToStorage(countdowns)
  }, [countdowns])

  // 添加新事件
  const handleAdd = (newItem: Omit<CountdownItem, 'id' | 'isPinned' | 'createdAt'>) => {
    const item: CountdownItem = {
      ...newItem,
      id: generateId(),
      isPinned: false,
      createdAt: new Date().toISOString()
    }
    setCountdowns(prev => [...prev, item])
  }

  // 长按删除：弹出确认弹窗
  const handleLongPressDelete = (item: CountdownItem) => {
    setDeletingItem(item)
  }

  // 确认删除
  const handleConfirmDelete = () => {
    if (!deletingItem) return
    setCountdowns(prev => prev.filter(item => item.id !== deletingItem.id))
    setDeletingItem(null)
  }

  // 点击列表卡片设为置顶（带动画）
  const handlePinItem = (itemId: string) => {
    setAnimatingId(itemId)
    
    setTimeout(() => {
      setCountdowns(prev => {
        const currentPinned = prev.find(item => item.isPinned)
        
        return prev.map(item => {
          if (item.id === itemId) {
            return { ...item, isPinned: true }
          }
          if (currentPinned && item.id === currentPinned.id) {
            return { ...item, isPinned: false }
          }
          return item
        })
      })
      
      setTimeout(() => {
        setAnimatingId(null)
      }, 600)
    }, 150)
  }

  // 查看时光信件
  const handleViewLetter = (item: CountdownItem) => {
    setViewingLetterItem(item)
  }

  // 记录此刻瞬间
  const handleRecordMoment = (item: CountdownItem) => {
    setRecordingMomentItem(item)
  }

  // 保存此刻瞬间（照片 + 感悟）
  const handleSaveMoment = (photo: string, text: string) => {
    if (!recordingMomentItem) return
    setCountdowns(prev => prev.map(item => {
      if (item.id === recordingMomentItem.id) {
        return {
          ...item,
          momentPhoto: photo || undefined,
          momentText: text || undefined,
          archivedAt: new Date().toISOString()
        }
      }
      return item
    }))
  }

  // 找出置顶项（排除已归档）
  const pinnedItem = countdowns.find(item => {
    if (!item.isPinned) return false
    const days = getDaysUntil(item.targetDate)
    if (item.archivedAt) return false
    return days >= 0
  })
  
  // 非置顶项按日期排序（排除已归档和已记录的）
  const listItems = countdowns
    .filter(item => {
      if (item.isPinned) return false
      if (item.archivedAt) return false
      const days = getDaysUntil(item.targetDate)
      return days >= 0
    })
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())

  // 归档数量
  const archivedCount = countdowns.filter(item => {
    const days = getDaysUntil(item.targetDate)
    return days < 0 || item.archivedAt
  }).length

  // 渲染时光册页面
  if (isArchiveOpen) {
    return (
      <>
        <ArchivePage
          items={countdowns}
          onBack={() => setIsArchiveOpen(false)}
          onViewLetter={handleViewLetter}
        />
        {/* 查看信件弹窗 - 在时光册页面也可用 */}
        <AnimatePresence>
          {viewingLetterItem && (
            <ViewLetterModal
              item={viewingLetterItem}
              onClose={() => setViewingLetterItem(null)}
            />
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <div className="app-scrollbar flex h-screen flex-col overflow-hidden bg-[#FBF6EE]">
      {/* 顶部标题区 */}
      <header className="relative flex flex-shrink-0 items-center justify-between px-5 pt-[calc(3rem+var(--wi-sb,0px))] pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-[28px] font-medium tracking-[0.04em] text-foreground">
            盼兮
          </h1>
          <p className="font-serif text-[16px] leading-6 tracking-[0.02em] font-medium text-muted-foreground">
            将来的日子，都有迹可循。
          </p>
        </div>
        {/* 按钮组：时光册入口 + 添加 */}
        <div className="flex items-center gap-2">
          {/* 时光册入口 */}
          <button
            onClick={() => setIsArchiveOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/60 bg-white/80 text-muted-foreground transition-colors hover:bg-stone-50 active:scale-95"
            aria-label="时光册"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {/* 相册图标 */}
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          {/* 添加按钮 */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/60 bg-white/80 text-muted-foreground transition-colors hover:bg-stone-50 active:scale-95"
            aria-label="添加倒数日"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* 返回按钮 */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-stone-100"
          aria-label="返回"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* 内容区 - 可滚动（隐藏滚动条） */}
      <main className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-28">
        <div className="flex flex-col">
        <LayoutGroup>
          {/* 焦点大卡片 */}
          <AnimatePresence mode="popLayout">
            {pinnedItem && (
              <motion.section
                key={`hero-${pinnedItem.id}`}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6"
              >
                <CountdownHeroCard 
                  item={pinnedItem} 
                  isAnimating={animatingId === pinnedItem.id}
                  onViewLetter={() => handleViewLetter(pinnedItem)}
                  onRecordMoment={() => handleRecordMoment(pinnedItem)}
                />
              </motion.section>
            )}
          </AnimatePresence>

          {/* 日常期待列表 */}
          <section>
            <h2 className="mb-3 font-serif text-[17px] font-medium tracking-wide text-muted-foreground">
              日常期待
            </h2>
            {listItems.length > 0 ? (
              <AnimatePresence mode="popLayout">
                <div className="flex flex-col gap-3">
                  {listItems.map(item => (
                    <CountdownItemCard
                      key={item.id}
                      item={item}
                      onClick={() => handlePinItem(item.id)}
                      onViewLetter={() => handleViewLetter(item)}
                      isNewPinned={animatingId === item.id}
                      onLongPressDelete={() => handleLongPressDelete(item)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-200 bg-white/40 py-10 text-center text-sm text-muted-foreground/60">
                还没有期待的日子
              </div>
            )}
          </section>
        </LayoutGroup>
        </div>
      </main>

      {/* 添加弹窗 */}
      <AnimatePresence>
        {isModalOpen && (
          <AddCountdownModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleAdd}
          />
        )}
      </AnimatePresence>

      {/* 查看信件弹窗 */}
      <AnimatePresence>
        {viewingLetterItem && (
          <ViewLetterModal
            item={viewingLetterItem}
            onClose={() => setViewingLetterItem(null)}
          />
        )}
      </AnimatePresence>

      {/* 记录此刻弹窗 */}
      <AnimatePresence>
        {recordingMomentItem && (
          <RecordMomentModal
            item={recordingMomentItem}
            onClose={() => setRecordingMomentItem(null)}
            onSave={handleSaveMoment}
          />
        )}
      </AnimatePresence>

      {/* 长按删除确认弹窗 */}
      <AnimatePresence>
        {deletingItem && (
          <DeleteConfirmModal
            item={deletingItem}
            onConfirm={handleConfirmDelete}
            onClose={() => setDeletingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
