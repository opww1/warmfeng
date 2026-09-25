'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'

// 避免 SSR 下 useLayoutEffect 警告；客户端仍用 layout effect 防止绘制前闪一下完整图标
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

interface LucideDrawIconProps {
  /** Lucide 图标组件（直接复用其原生 SVG 路径） */
  icon: LucideIcon
  /** 是否为当前选中项 */
  active: boolean
  size?: number
  strokeWidth?: number
  /** 各几何元素按顺序依次绘制（用于如飞镖落上靶心的效果），默认同时绘制 */
  stagger?: boolean
}

// 所有可作为描边的几何元素，不止 <path>
const GEOMETRY_SELECTOR = 'path, line, circle, rect, ellipse, polyline, polygon'

/**
 * 复用 Lucide 原生 SVG 路径，仅为图标增加"描边绘制"入场动画。
 * - 仅当 active 由 false 变为 true（未选中 → 选中）的瞬间播放一次（0.35s ease-out）
 * - 已选中点击、选中变为未选中：不执行任何动画
 * - 不改变布局 / 颜色 / 间距 / 其它样式，不添加 hover / 缩放 / 弹跳等附加动画
 */
export function LucideDrawIcon({ icon: Icon, active, size = 20, strokeWidth = 1.7, stagger = false }: LucideDrawIconProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const prevActive = useRef(active)

  useIsomorphicLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const shapes = Array.from(svg.querySelectorAll<SVGGeometryElement>(GEOMETRY_SELECTOR))
    const justSelected = active && !prevActive.current

    shapes.forEach((shape, i) => {
      const len = shape.getTotalLength()
      shape.style.strokeDasharray = `${len}`

      if (justSelected) {
        // 瞬间重置为"不可见"，再过渡到"画完" —— 仅播放一次绘制
        shape.style.transition = 'none'
        shape.style.strokeDashoffset = `${len}`
        void shape.getBoundingClientRect()
        const delay = stagger ? i * 0.08 : 0
        shape.style.transition = `stroke-dashoffset 0.35s ease-out ${delay}s`
        shape.style.strokeDashoffset = '0'
      } else {
        // 静态完整线框，不播放、也不擦除
        shape.style.transition = 'none'
        shape.style.strokeDashoffset = '0'
      }
    })

    prevActive.current = active
  }, [active, stagger])

  return <Icon ref={svgRef} size={size} strokeWidth={strokeWidth} />
}
