'use client'

interface SunflowerVaseProps {
  className?: string
  size?: number
}

/**
 * 手绘线稿风格向日葵花瓶插画
 * 符合暖枫设计规范：1.5px 描边，#4A4A4A 颜色，低饱和度莫兰迪色填充
 */
export function SunflowerVaseIllustration({ className = '', size = 80 }: SunflowerVaseProps) {
  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="向日葵花瓶插画"
    >
      <g strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#4A4A4A">
        {/* 花瓶 */}
        <path
          d="M30 92 Q28 86 35 84 L65 84 Q72 86 70 92 L68 120 Q66 128 58 132 L42 132 Q34 128 32 120 Z"
          fill="#F0E5D8"
        />
        {/* 瓶口 */}
        <ellipse cx="50" cy="84" rx="15" ry="4" fill="#F5EDE0" />
        <ellipse cx="50" cy="83" rx="12" ry="3" fill="#E8DBC8" />
        
        {/* 花瓶高光 */}
        <path d="M38 95 Q35 105 36 115" strokeWidth="1" fill="none" opacity="0.35" />
        <path d="M62 95 Q65 105 64 118" strokeWidth="0.8" fill="none" opacity="0.25" />
        
        {/* 花茎 - 从瓶口延伸出来 */}
        <path d="M42 82 Q38 60 32 40" strokeWidth="1.5" fill="none" />
        <path d="M50 82 Q50 58 50 30" strokeWidth="1.5" fill="none" />
        <path d="M58 82 Q62 62 68 42" strokeWidth="1.5" fill="none" />
        
        {/* 大叶子 - 左 */}
        <path
          d="M38 72 Q25 68 18 55 Q15 45 22 38 Q25 48 30 55 Q35 62 38 72"
          fill="#D4E0D4"
        />
        <path d="M28 52 Q22 48 18 40" strokeWidth="0.8" fill="none" opacity="0.4" />
        
        {/* 小叶子 - 右 */}
        <path
          d="M58 68 Q70 62 76 50 Q78 42 72 35 Q68 45 62 52 Q58 60 58 68"
          fill="#C8D8C8"
        />
        <path d="M68 48 Q72 44 74 38" strokeWidth="0.8" fill="none" opacity="0.4" />
        
        {/* 向日葵 1 - 左下 */}
        <g transform="translate(32, 38) rotate(-25)">
          {/* 花瓣外层 - 9片 */}
          <ellipse cx="0" cy="-12" rx="3.5" ry="11" fill="#F5E6C8" />
          <ellipse cx="-8" cy="-4" rx="3.5" ry="11" fill="#F5E6C8" transform="rotate(-45)" />
          <ellipse cx="-10" cy="6" rx="3.5" ry="11" fill="#F5E6C8" transform="rotate(-90)" />
          <ellipse cx="-6" cy="12" rx="3.5" ry="11" fill="#F5E6C8" transform="rotate(-135)" />
          <ellipse cx="0" cy="14" rx="3.5" ry="11" fill="#F5E6C8" transform="rotate(180)" />
          <ellipse cx="6" cy="12" rx="3.5" ry="11" fill="#F5E6C8" transform="rotate(135)" />
          <ellipse cx="10" cy="6" rx="3.5" ry="11" fill="#F5E6C8" transform="rotate(90)" />
          <ellipse cx="8" cy="-4" rx="3.5" ry="11" fill="#F5E6C8" transform="rotate(45)" />
          
          {/* 花心 */}
          <circle cx="0" cy="0" r="7" fill="#8B7355" />
          <circle cx="-0.5" cy="-0.5" r="3" fill="#6B5545" strokeWidth="0.5" />
        </g>
        
        {/* 向日葵 2 - 中间最大 */}
        <g transform="translate(50, 28)">
          {/* 花瓣外层 - 9片 */}
          <ellipse cx="0" cy="-15" rx="4.5" ry="13" fill="#F5E6C8" />
          <ellipse cx="-10" cy="-5" rx="4.5" ry="13" fill="#F5E6C8" transform="rotate(-45)" />
          <ellipse cx="-13" cy="7" rx="4.5" ry="13" fill="#F5E6C8" transform="rotate(-90)" />
          <ellipse cx="-7" cy="14" rx="4.5" ry="13" fill="#F5E6C8" transform="rotate(-135)" />
          <ellipse cx="0" cy="17" rx="4.5" ry="13" fill="#F5E6C8" transform="rotate(180)" />
          <ellipse cx="7" cy="14" rx="4.5" ry="13" fill="#F5E6C8" transform="rotate(135)" />
          <ellipse cx="13" cy="7" rx="4.5" ry="13" fill="#F5E6C8" transform="rotate(90)" />
          <ellipse cx="10" cy="-5" rx="4.5" ry="13" fill="#F5E6C8" transform="rotate(45)" />
          
          {/* 花心 */}
          <circle cx="0" cy="0" r="8" fill="#8B7355" />
          <circle cx="-0.5" cy="-0.5" r="4" fill="#6B5545" strokeWidth="0.5" />
        </g>
        
        {/* 向日葵 3 - 右上 */}
        <g transform="translate(68, 42) rotate(15)">
          {/* 花瓣外层 - 8片 */}
          <ellipse cx="0" cy="-10" rx="3" ry="9" fill="#F5E6C8" />
          <ellipse cx="-7" cy="-3" rx="3" ry="9" fill="#F5E6C8" transform="rotate(-45)" />
          <ellipse cx="-9" cy="5" rx="3" ry="9" fill="#F5E6C8" transform="rotate(-90)" />
          <ellipse cx="-5" cy="10" rx="3" ry="9" fill="#F5E6C8" transform="rotate(-135)" />
          <ellipse cx="0" cy="11" rx="3" ry="9" fill="#F5E6C8" transform="rotate(180)" />
          <ellipse cx="5" cy="10" rx="3" ry="9" fill="#F5E6C8" transform="rotate(135)" />
          <ellipse cx="9" cy="5" rx="3" ry="9" fill="#F5E6C8" transform="rotate(90)" />
          <ellipse cx="7" cy="-3" rx="3" ry="9" fill="#F5E6C8" transform="rotate(45)" />
          
          {/* 花心 */}
          <circle cx="0" cy="0" r="6" fill="#8B7355" />
          <circle cx="-0.5" cy="-0.5" r="2.5" fill="#6B5545" strokeWidth="0.5" />
        </g>
        
        {/* 底部阴影 */}
        <ellipse cx="50" cy="135" rx="25" ry="3" fill="#E8DFD0" opacity="0.5" stroke="none" />
      </g>
    </svg>
  )
}