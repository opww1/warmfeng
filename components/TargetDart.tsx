'use client'

import { forwardRef } from 'react'
import type { LucideProps } from 'lucide-react'

/**
 * 靶子 + 飞镖（🎯）线框图标，风格对齐 Lucide：24x24、仅描边、无填充、圆角线帽。
 * 配合 LucideDrawIcon 的 stagger 参数，可使靶盘先绘出、飞镖最后"落上靶心"。
 */
export const TargetDart = forwardRef<SVGSVGElement, LucideProps>(function TargetDart(
  { size = 24, strokeWidth = 2, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* 靶盘外圈 */}
      <circle cx="12" cy="12" r="9" />
      {/* 靶盘中圈 */}
      <circle cx="12" cy="12" r="5.5" />
      {/* 靶心 */}
      <circle cx="12" cy="12" r="2" />
      {/* 十字准线 */}
      <line x1="12" y1="1.5" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22.5" />
      <line x1="1.5" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22.5" y2="12" />
      {/* 飞镖：从靶心指向右上方 */}
      <line x1="12" y1="12" x2="19.5" y2="4.5" />
      {/* 飞镖尾翼 */}
      <line x1="19.5" y1="4.5" x2="21.5" y2="3" />
      <line x1="19.5" y1="4.5" x2="18" y2="3" />
    </svg>
  )
})
