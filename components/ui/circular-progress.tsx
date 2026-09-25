"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps extends React.SVGProps<SVGSVGElement> {
  /** 当前值 0-100 */
  value: number
  /** 圆环直径（px） */
  size?: number
  /** 圆环描边宽度（px） */
  strokeWidth?: number
  /** 轨道颜色（CSS 颜色或 token 变量） */
  trackClassName?: string
  /** 进度颜色（CSS 颜色或 token 变量） */
  indicatorClassName?: string
  /** 中心内容（如分数、图标） */
  children?: React.ReactNode
  className?: string
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  trackClassName = "text-surface-2",
  indicatorClassName = "text-sakura",
  children,
  className,
  ...props
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        {...props}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("transition-colors", trackClassName)}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-700 ease-out",
            indicatorClassName,
          )}
          stroke="currentColor"
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      ) : null}
    </div>
  )
}
