"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  /** 当前值 0-100 */
  value: number
  /** 轨道类名（背景） */
  trackClassName?: string
  /** 填充类名（背景色） */
  fillClassName?: string
  /** 圆角尺寸，默认跟随卡片圆角 */
  rounded?: string
  height?: number
  className?: string
}

export function ProgressBar({
  value,
  trackClassName = "bg-surface-2",
  fillClassName = "bg-sakura",
  rounded = "rounded-full",
  height = 8,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("w-full overflow-hidden", rounded, trackClassName, className)}
      style={{ height }}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          fillClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
