'use client'

import { ReactNode } from 'react'

interface PaperStackCardProps {
  children: ReactNode
  className?: string
  /** 堆叠层数：2 或 3 */
  layers?: 2 | 3
  /** 是否显示撕裂边缘 */
  tornEdge?: boolean
  /** 是否显示胶带装饰 */
  showTape?: boolean
  /** 外层内边距 */
  padding?: string
  /** 额外样式 */
  style?: React.CSSProperties
}

/**
 * 通用堆叠纸张卡片组件
 * 用于实现手绘风堆叠纸张效果
 */
export function PaperStackCard({
  children,
  className = '',
  layers = 3,
  tornEdge = true,
  showTape = false,
  padding = 'py-6 px-5',
  style,
}: PaperStackCardProps) {
  return (
    <div className={`relative ${className}`} style={style}>
      {/* ============ 底层卡片 1 ============ */}
      {layers >= 3 && (
        <div
          className="absolute rounded-sm"
          style={{
            inset: '-14px -18px 14px -18px',
            background: '#E8D9C4',
            transform: 'translate(-12px, -14px) rotate(-5deg)',
            boxShadow: '5px 7px 22px rgba(180, 160, 130, 0.22)',
            zIndex: 1,
          }}
        />
      )}

      {/* ============ 中层卡片 2 ============ */}
      {layers >= 2 && (
        <div
          className="absolute rounded-sm"
          style={{
            inset: '-4px -5px 4px -5px',
            background: '#EFE2CE',
            transform: 'translate(-3px, -4px) rotate(-2deg)',
            boxShadow: '3px 4px 12px rgba(180, 160, 130, 0.15)',
            zIndex: 2,
          }}
        />
      )}

      {/* ============ 顶层主卡片 ============ */}
      <div
        className={`relative bg-[#FEFBF5] rounded-sm overflow-visible ${padding}`}
        style={{
          zIndex: 3,
          boxShadow: '2px 3px 12px rgba(180, 160, 130, 0.12)',
          border: '1px solid rgba(196, 168, 130, 0.15)',
        }}
      >
        {/* SVG 撕裂边缘 - 顶部 */}
        {tornEdge && (
          <svg
            className="absolute -top-1.5 left-0 w-full h-4"
            viewBox="0 0 400 16"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0 16 L0 8 Q12 3 25 6 Q38 11 50 4 Q63 0 75 7 Q88 13 100 5 Q113 0 125 8 Q138 14 150 6 Q163 0 175 9 Q188 15 200 7 Q213 0 225 10 Q238 16 250 8 Q263 0 275 11 Q288 17 300 9 Q313 0 325 12 Q338 18 350 10 Q363 0 375 11 Q388 17 400 9 L400 16 Z"
              fill="#FEFBF5"
            />
          </svg>
        )}

        {/* SVG 撕裂边缘 - 底部 */}
        {tornEdge && (
          <svg
            className="absolute -bottom-1.5 left-0 w-full h-4"
            viewBox="0 0 400 16"
            preserveAspectRatio="none"
            fill="none"
            style={{ transform: 'scaleY(-1)' }}
          >
            <path
              d="M0 16 L0 8 Q12 3 25 6 Q38 11 50 4 Q63 0 75 7 Q88 13 100 5 Q113 0 125 8 Q138 14 150 6 Q163 0 175 9 Q188 15 200 7 Q213 0 225 10 Q238 16 250 8 Q263 0 275 11 Q288 17 300 9 Q313 0 325 12 Q338 18 350 10 Q363 0 375 11 Q388 17 400 9 L400 16 Z"
              fill="#FEFBF5"
            />
          </svg>
        )}

        {/* 胶带装饰 */}
        {showTape && (
          <>
            <div
              className="absolute -top-3 -left-4 w-12 h-5"
              style={{
                background: 'linear-gradient(135deg, rgba(190, 210, 170, 0.55), rgba(190, 210, 170, 0.45))',
                border: '1px solid rgba(170, 190, 150, 0.35)',
                transform: 'rotate(-8deg)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                zIndex: 10,
              }}
            />
            <div
              className="absolute -top-3 -right-4 w-12 h-5"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 220, 190, 0.55), rgba(245, 220, 190, 0.45))',
                border: '1px solid rgba(225, 200, 170, 0.35)',
                transform: 'rotate(6deg)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                zIndex: 10,
              }}
            />
          </>
        )}

        {/* 内容区域 */}
        {children}
      </div>
    </div>
  )
}