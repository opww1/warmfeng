'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { HAND_DRAWN_SEEDS, wobblyCircle, wobblyRoundedRect } from './paths'

/* ============================================================
 * 暖枫手绘风进度条 / 加载组件（v0.1.43）
 * 设计令牌见 globals.css：.wi-light / .wi-dark
 * 规范：产品/暖枫手绘风进度条与加载方案.md (v1.1)
 * ============================================================ */

export type WiVariant = 'light' | 'dark'
export type WiStatus = 'default' | 'complete' | 'error'

/* ---------- 通用 hooks ---------- */

/** 屏幕阅读器节流：value 更新频率 ≤10Hz */
function useThrottledValue<T>(value: T, intervalMs = 100): T {
  const [v, setV] = useState(value)
  const last = useRef(0)
  useEffect(() => {
    const now = Date.now()
    if (now - last.current >= intervalMs) {
      last.current = now
      setV(value)
    } else {
      const t = setTimeout(() => {
        last.current = Date.now()
        setV(value)
      }, intervalMs - (now - last.current))
      return () => clearTimeout(t)
    }
  }, [value, intervalMs])
  return v
}

/** 是否开启「减少动态效果」 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = () => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

/** 挂载时固定选一套手绘模板 seed（进度更新不再重建路径，避免逐帧抖动）
 *  初始用固定值，避免 SSR/CSR 随机不一致导致 hydration 警告；挂载后再随机切换。 */
function useFixedSeed(): number {
  const [seed, setSeed] = useState(11)
  useEffect(() => {
    setSeed(HAND_DRAWN_SEEDS[Math.floor(Math.random() * HAND_DRAWN_SEEDS.length)])
  }, [])
  return seed
}

/* ============================================================
 * 4.1 Linear Progress 线性进度条
 * ============================================================ */

export interface LinearProgressProps {
  /** 0–100，indeterminate 时忽略 */
  value?: number
  /** 不确定进度（转圈光斑） */
  indeterminate?: boolean
  /** 高度 6 / 8 / 10 px */
  size?: 6 | 8 | 10
  variant?: WiVariant
  status?: WiStatus
  /** 自定义宽度，默认 100% */
  width?: string
  /** 错误/完成态是否播放抖动/上浮（受 reduced-motion 约束） */
  className?: string
  'aria-label'?: string
}

export function LinearProgress({
  value = 0,
  indeterminate = false,
  size = 6,
  variant = 'light',
  status = 'default',
  width = '100%',
  className = '',
  'aria-label': ariaLabel,
}: LinearProgressProps) {
  const reduced = usePrefersReducedMotion()
  const seed = useFixedSeed()
  const throttled = useThrottledValue(Math.max(0, Math.min(100, value)))

  const H = size
  const inset = H >= 10 ? 2 : 1.5
  // 纹理间距随高度联动：6px→5px，10px→4px
  const spacing = H < 8 ? 5 : 4

  const eff = indeterminate ? 0 : throttled
  const isComplete = status === 'complete' || (!indeterminate && eff >= 100)
  const isError = status === 'error'
  const showStartDot = !indeterminate && eff <= 0 && status === 'default'

  const stroke = isError ? 'var(--wi-error)' : isComplete ? 'var(--wi-amber)' : 'var(--wi-ink)'
  const tex = isError
    ? 'rgba(217,108,108,0.38)'
    : isComplete
      ? 'rgba(232,201,138,0.45)'
      : 'var(--wi-pink-texture)'
  const hatch = `repeating-linear-gradient(45deg, ${tex} 0 1px, transparent 1px ${spacing}px)`

  const path = useMemo(() => wobblyRoundedRect(100, H, Math.min(H / 2, 6), seed), [H, seed])

  const trackStyle: CSSProperties = {
    height: H,
    width,
    transform: isComplete && !reduced ? 'translateY(-1px)' : undefined,
    transition: 'transform .2s ease',
  }

  const fillWidth = eff <= 0 ? '0%' : `max(8px, ${eff}%)`

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : throttled}
      aria-busy={indeterminate || undefined}
      className={`wi-${variant} relative overflow-hidden ${isError && !reduced ? 'hd-error-shake' : ''} ${className}`}
      style={trackStyle}
    >
      {/* 轨道底色（界面背景，与页面同色，不抢眼） */}
      <div className="absolute inset-0 rounded-full" style={{ background: 'var(--wi-bg)' }} />

      {/* 已填充区：淡粉底 + 斜线纹理 */}
      {!indeterminate && eff > 0 && (
        <div className="absolute" style={{ inset: `${inset}px` }}>
          <div
            className="h-full rounded-full"
            style={{
              width: fillWidth,
              background: 'var(--wi-bg)',
              backgroundImage: hatch,
              transition: 'width .3s cubic-bezier(.4,0,.2,1)',
            }}
          />
        </div>
      )}

      {/* 不确定态：先铺一条贯穿的琥珀纹理 fill（让"扫描区"有可见底），
          再叠加更明显的琥珀高亮光斑从左扫到右；reduced-motion 下改为静态 50% 填充。
          该深琥珀动画仅限加载页进度条（.wi-loader-progress），其它 indeterminate 进度条不会套用 */}
      {indeterminate && (className?.includes('wi-loader-progress') ? (
        reduced ? (
          <div className="absolute" style={{ inset: `${inset}px` }}>
            <div
              className="h-full rounded-full"
              style={{ width: '50%', background: 'var(--wi-amber)', backgroundImage: hatch }}
            />
          </div>
        ) : (
          <>
            {/* 贯穿底纹理（弱化，给光斑提供"扫描过"的视觉痕迹） */}
            <div className="absolute" style={{ inset: `${inset}px` }}>
              <div
                className="h-full w-full rounded-full"
                style={{
                  background: 'var(--wi-amber)',
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(181,118,46,0.45) 0 1px, transparent 1px 5px)',
                  opacity: 0.4,
                }}
              />
            </div>
            {/* 高亮光斑：加宽 + 拉慢，让动画在浅色轨道上明显可见 */}
            <div
              className="hd-loader-spot absolute rounded-full"
              style={{
                top: inset,
                bottom: inset,
                width: '45%',
                background:
                  'linear-gradient(90deg, transparent, #D29A4E 42%, #B5762E 50%, #D29A4E 58%, transparent)',
              }}
            />
          </>
        )
      ) : (
        // 其它 indeterminate 进度条：保持原通用白色光斑（仅加载页用深琥珀）
        reduced ? (
          <div className="absolute" style={{ inset: `${inset}px` }}>
            <div
              className="h-full rounded-full"
              style={{ width: '50%', background: 'var(--wi-pink-soft)', backgroundImage: hatch }}
            />
          </div>
        ) : (
          <div
            className="hd-indeterminate-spot absolute rounded-full"
            style={{
              top: inset,
              bottom: inset,
              width: '30%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
            }}
          />
        )
      ))}

      {/* 0% 起点小圆点（提示轨道可用） */}
      {showStartDot && (
        <span
          className="absolute rounded-full"
          style={{
            left: inset + 1.5,
            top: '50%',
            width: Math.max(3, H - 3),
            height: Math.max(3, H - 3),
            transform: 'translateY(-50%)',
            background: 'var(--wi-ink)',
            opacity: 0.45,
          }}
          aria-hidden="true"
        />
      )}

      {/* 手绘描边（挂载时生成一次，不随进度重建） */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

/* ============================================================
 * 4.2 Circular Loader 圆形加载器（donut，stroke-dashoffset）
 * ============================================================ */

export interface CircularLoaderProps {
  size?: 24 | 40 | 64
  /** 0–100，indeterminate 时忽略 */
  value?: number
  indeterminate?: boolean
  variant?: WiVariant
  status?: WiStatus
  strokeWidth?: number
}

export function CircularLoader({
  size = 24,
  value = 0,
  indeterminate = false,
  variant = 'light',
  status = 'default',
  strokeWidth = 2,
}: CircularLoaderProps) {
  const reduced = usePrefersReducedMotion()
  const seed = useFixedSeed()

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - strokeWidth - 1
  const circlePath = useMemo(() => wobblyCircle(cx, cy, r, seed), [cx, cy, r, seed])

  const isComplete = status === 'complete' || (!indeterminate && value >= 100)
  const isError = status === 'error'
  const progColor = isError ? 'var(--wi-error)' : isComplete ? 'var(--wi-amber)' : 'var(--wi-pink)'
  const trackColor = 'var(--wi-track)'

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      aria-busy={indeterminate || undefined}
      className={`wi-${variant} inline-flex`}
    >
      <svg
        width={size}
        height={size}
        className={indeterminate && !reduced ? 'hd-spin' : ''}
        style={{ transformOrigin: 'center', overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="hd-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--wi-pink)" strokeWidth="1" opacity="0.4" />
          </pattern>
        </defs>

        {/* 轨道 */}
        <path d={circlePath} fill="none" stroke={trackColor} strokeWidth={strokeWidth} pathLength={100} />

        {/* 64px 全屏态：内部可选斜线纹理填充 */}
        {size >= 64 && indeterminate && (
          <circle cx={cx} cy={cy} r={r - 3} fill="url(#hd-hatch)" opacity={0.5} />
        )}

        {/* 进度 */}
        {!indeterminate && (
          <path
            d={circlePath}
            fill="none"
            stroke={progColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 - Math.max(0, Math.min(100, value))}
            style={{ transition: 'stroke-dashoffset .3s cubic-bezier(.4,0,.2,1)' }}
          />
        )}
      </svg>
    </div>
  )
}

/* ============================================================
 * 4.3 Skeleton Screen 骨架屏
 * ============================================================ */

export interface SkeletonProps {
  width?: string | number
  height?: number | string
  radius?: number
  variant?: WiVariant
  className?: string
  /** 传入数字则渲染多行文本骨架 */
  lines?: number
  lineHeight?: number
}

function SkeletonBlock({
  width,
  height,
  radius,
  variant,
}: {
  width: string | number
  height: number | string
  radius: number
  variant: WiVariant
}) {
  return (
    <div
      className={`wi-${variant} relative overflow-hidden`}
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'var(--wi-track)',
        border: '1px solid var(--wi-border-soft)',
      }}
    >
      {/* 极淡斜线纹理（手帐未填满感） */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(224,215,201,0.3) 0 1px, transparent 1px 6px)',
        }}
      />
      {/* 微光扫过 */}
      <div
        className="hd-shimmer absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
          transform: 'translateX(-120%)',
        }}
      />
    </div>
  )
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  variant = 'light',
  className = '',
  lines,
  lineHeight = 14,
}: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className={`wi-${variant} space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock key={i} width={i === lines - 1 ? '70%' : '100%'} height={lineHeight} radius={radius} variant={variant} />
        ))}
      </div>
    )
  }
  return <SkeletonBlock width={width} height={height} radius={radius} variant={variant} />
}

/* ============================================================
 * 4.4 Page Loader 全页加载
 * ============================================================ */

const PAGE_LOADER_TEXTS = [
  '正在整理你的小宇宙…',
  '星星正在排队赶来…',
  '把今天的阳光收进手帐…',
  '慢慢来，也是一种前进…',
]

export interface PageLoaderProps {
  variant?: WiVariant
  text?: string
  /** 是否显示底部线性进度条 */
  showProgress?: boolean
  /** 指定进度值（不传则为不确定态） */
  progress?: number
  /** 覆盖层定位：启动时用 absolute 贴合手机框；默认 fixed 全屏 */
  position?: 'fixed' | 'absolute'
}

export function PageLoader({
  variant = 'light',
  text,
  showProgress = false,
  progress,
  position = 'fixed',
}: PageLoaderProps) {
  const [msg, setMsg] = useState(PAGE_LOADER_TEXTS[0])
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    setMsg(PAGE_LOADER_TEXTS[Math.floor(Math.random() * PAGE_LOADER_TEXTS.length)])
    // 安全超时：最长 3 秒后自动消失，避免父组件渲染失败导致永远卡住
    const safety = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(safety)
  }, [])
  const pos = position === 'absolute' ? 'absolute' : 'fixed'

  if (!visible) return null

  return (
    <div
      className={`wi-${variant} wi-loader-root ${pos} inset-0 z-50 flex flex-col items-center justify-center gap-5`}
      style={{ background: 'var(--wi-cream)' }}
      role="status"
      aria-live="polite"
    >
      <CircularLoader size={64} indeterminate variant={variant} />
      <p className="text-[14px] font-normal" style={{ color: 'var(--wi-muted)' }}>
        {text ?? msg}
      </p>
      {showProgress && (
        <div className="w-[160px]">
          <LinearProgress
            value={progress}
            indeterminate={progress === undefined}
            size={6}
            variant={variant}
            className="wi-loader-progress"
            aria-label="整体加载进度"
          />
        </div>
      )}
    </div>
  )
}

export { usePrefersReducedMotion }
