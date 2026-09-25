'use client'

import { Sparkles, CheckCircle2, Clock, Flag } from 'lucide-react'

interface PaperStackDemoProps {
  title?: string
  description?: string
}

/**
 * 堆叠撕裂纸张效果 Demo
 * 展示参考图中的：多层堆叠 + 撕裂边缘 + 胶带装饰
 */
export function PaperStackDemo({
  title = '考上本科',
  description = '添加目标描述...',
}: PaperStackDemoProps) {
  return (
    <div className="relative w-full max-w-sm mx-auto py-8 px-4">
      {/* ============ 底层卡片 1 - 向后偏移 ============ */}
      <div
        className="absolute inset-x-4 top-4 bottom-4 bg-[#F0E5D8] rounded-sm"
        style={{
          transform: 'translate(-16px, -8px) rotate(-4deg)',
          boxShadow: '3px 5px 15px rgba(180, 160, 130, 0.2)',
          zIndex: 1,
        }}
      />
      
      {/* ============ 中层卡片 2 - 稍大偏移 ============ */}
      <div
        className="absolute inset-x-3 top-3 bottom-3 bg-[#F5EDE0] rounded-sm"
        style={{
          transform: 'translate(-6px, -4px) rotate(-2deg)',
          boxShadow: '2px 3px 10px rgba(180, 160, 130, 0.15)',
          zIndex: 2,
        }}
      />
      
      {/* ============ 顶层主卡片 ============ */}
      <div
        className="relative bg-[#FEFBF5] rounded-sm overflow-visible py-6 px-5"
        style={{
          zIndex: 3,
          boxShadow: '1px 2px 8px rgba(180, 160, 130, 0.1)',
        }}
      >
        {/* SVG 撕裂边缘 - 顶部 */}
        <svg
          className="absolute -top-2 left-0 w-full h-5"
          viewBox="0 0 400 20"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 20 L0 10 Q15 3 30 7 Q45 13 60 5 Q75 0 90 8 Q105 15 120 6 Q135 0 150 9 Q165 16 180 7 Q195 0 210 10 Q225 17 240 8 Q255 0 270 11 Q285 18 300 9 Q315 0 330 12 Q345 19 360 10 Q375 0 390 11 Q395 15 400 10 L400 20 Z"
            fill="#FEFBF5"
          />
        </svg>
        
        {/* SVG 撕裂边缘 - 底部 */}
        <svg
          className="absolute -bottom-2 left-0 w-full h-5"
          viewBox="0 0 400 20"
          preserveAspectRatio="none"
          fill="none"
          style={{ transform: 'scaleY(-1)' }}
        >
          <path
            d="M0 20 L0 10 Q15 3 30 7 Q45 13 60 5 Q75 0 90 8 Q105 15 120 6 Q135 0 150 9 Q165 16 180 7 Q195 0 210 10 Q225 17 240 8 Q255 0 270 11 Q285 18 300 9 Q315 0 330 12 Q345 19 360 10 Q375 0 390 11 Q395 15 400 10 L400 20 Z"
            fill="#FEFBF5"
          />
        </svg>

        {/* 胶带装饰 - 左上（绿色） */}
        <div
          className="absolute -top-4 -left-5 w-16 h-6"
          style={{
            background: 'linear-gradient(135deg, rgba(190, 210, 170, 0.6), rgba(190, 210, 170, 0.5))',
            border: '1px solid rgba(170, 190, 150, 0.4)',
            transform: 'rotate(-10deg)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}
        />
        
        {/* 胶带装饰 - 右上（米色） */}
        <div
          className="absolute -top-4 -right-5 w-16 h-6"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 220, 190, 0.6), rgba(245, 220, 190, 0.5))',
            border: '1px solid rgba(225, 200, 170, 0.4)',
            transform: 'rotate(8deg)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}
        />
        
        {/* 内容区域 */}
        <div className="relative px-5 py-4">
          <div className="mb-4">
            <h2 className="font-serif text-2xl font-semibold tracking-wide text-[#4A4A4A] mb-1">
              {title}
            </h2>
            <p className="text-sm text-[#8B7355]/70 leading-relaxed">
              {description}
            </p>
          </div>

          {/* 分割线 - 手绘风 */}
          <div
            className="my-3"
            style={{
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #C4A882 20%, #C4A882 80%, transparent)',
              borderRadius: '50%',
              opacity: 0.4,
            }}
          />

          {/* 打卡记录区域 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#8B7355]/80 flex items-center gap-1">
                <Sparkles size={12} strokeWidth={1.5} />
                近14天打卡
              </span>
              <span className="text-xs text-[#8B7355]/60">已坚持 0 天</span>
            </div>
            
            {/* 打卡圆点 */}
            <div className="flex gap-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-5 rounded-sm"
                  style={{
                    background: i < 5 ? 'rgba(200, 220, 180, 0.6)' : '#F0E5D8',
                    border: '1px solid rgba(180, 160, 130, 0.15)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* 进度区域 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#8B7355]/80 flex items-center gap-1">
                <Clock size={12} strokeWidth={1.5} />
                本周进度
              </span>
              <span className="text-sm font-medium text-[#B8956A] tabular-nums">0%</span>
            </div>
            
            {/* 进度条 - 撕裂纸张效果 */}
            <div
              className="relative h-3 rounded-sm overflow-hidden"
              style={{
                background: '#F5EDE0',
                border: '1px solid rgba(180, 160, 130, 0.2)',
              }}
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: '0%',
                  background: 'linear-gradient(90deg, #C8D8C8, #B8C8B8)',
                }}
              />
            </div>
            <p className="text-xs text-[#8B7355]/50 mt-1">0/0 计划完成</p>
          </div>

          {/* 底部信息 */}
          <div
            className="pt-3 flex items-center justify-between"
            style={{
              borderTop: '1px dashed rgba(180, 160, 130, 0.3)',
            }}
          >
            <span className="text-xs text-[#8B7355]/60 flex items-center gap-1">
              <Flag size={11} strokeWidth={1.5} />
              未设置截止
            </span>
            <span className="text-xs text-[#8B7355]/60 flex items-center gap-1">
              <CheckCircle2 size={11} strokeWidth={1.5} />
              已坚持 0 天
            </span>
          </div>
        </div>

        {/* 纸张纹理 - 右下角装饰 */}
        <div
          className="absolute -bottom-2 -right-2 w-16 h-4"
          style={{
            background: 'linear-gradient(45deg, rgba(240, 210, 180, 0.3), transparent)',
            transform: 'rotate(-5deg)',
            borderRadius: '0 0 4px 4px',
            zIndex: -1,
          }}
        />
      </div>

      {/* 悬浮贴纸 - 打卡日历 */}
      <div
        className="absolute -top-4 -right-4 w-12 h-12 rounded-sm flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #E8D5C0, #D4B896)',
          boxShadow: '2px 3px 8px rgba(180, 160, 130, 0.25)',
          transform: 'rotate(8deg)',
          zIndex: 20,
        }}
      >
        <div className="text-center">
          <div className="text-[8px] text-[#8B7355] leading-none">打卡</div>
          <div className="text-sm font-bold text-[#6B5545] leading-tight">14</div>
          <div className="text-[8px] text-[#8B7355] leading-none">天</div>
        </div>
      </div>
    </div>
  )
}

/**
 * 撕裂边缘 SVG path 生成器
 * 用于创建不规则的撕裂效果
 */
export function generateTornPath(width: number, height: number, segments = 20): string {
  const points: string[] = []
  const segmentWidth = width / segments
  
  // 顶部边缘 - 不规则波动
  points.push(`M0 ${height}`)
  points.push(`L0 ${height * 0.5}`)
  
  for (let i = 0; i <= segments; i++) {
    const x = i * segmentWidth
    const y = height * 0.3 + Math.sin(i * 0.5) * height * 0.2 + (Math.random() - 0.5) * height * 0.2
    points.push(`Q${x - segmentWidth / 2} ${y}, ${x} ${height * 0.5}`)
  }
  
  points.push(`L${width} ${height}`)
  points.push('Z')
  
  return points.join(' ')
}