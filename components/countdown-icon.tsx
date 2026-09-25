'use client'

import { forwardRef } from 'react'

/**
 * 盼兮（Countdown）手绘风格图标组件
 * 
 * 为倒数日功能提供 5 种手绘风 SVG 图案：
 * - star: 焦点卡片用的五角星
 * - gift: 礼物盒（生日/庆祝）
 * - tent: 帐篷（露营/旅行）
 * - book: 书本（项目/学习）
 * - sparkle: 星点闪光（通用期待）
 * 
 * 风格统一：暖色系描边 (#6B5E58)、圆角线帽、轻微手绘不规则感
 */

export type CountdownIconType = 'star' | 'gift' | 'tent' | 'book' | 'sparkle' | 'heart' | 'cake' | 'ticket' | 'plane' | 'flower' | 'envelope-closed' | 'envelope-open' | 'moon' | 'rainbow'

interface CountdownIconProps {
  type: CountdownIconType
  size?: number
  className?: string
  color?: string
}

/** 五角星：用于焦点卡片（置顶最近的期待） */
const StarIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function StarIcon({ size = 48, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 五角星主体 */}
        <path d="M24 6 L29.5 18.5 L42 20.5 L32 30 L34.5 42.5 L24 36.5 L13.5 42.5 L16 30 L6 20.5 L18.5 18.5 Z" />
        {/* 中心装饰小点 */}
        <circle cx="24" cy="24" r="2.5" fill={color} stroke="none" />
        {/* 星星旁小闪光 */}
        <path d="M38 10 L39.5 13 L42 14.5 L39.5 16 L38 19 L36.5 16 L34 14.5 L36.5 13 Z" strokeWidth={1.2} />
      </svg>
    )
  }
)

/** 礼物盒：用于生日/庆祝类事件 */
const GiftIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function GiftIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 礼物盒主体 */}
        <rect x="8" y="20" width="32" height="22" rx="2" />
        {/* 盒盖 */}
        <path d="M6 16 Q6 14 8 14 L40 14 Q42 14 42 16 L42 20 L6 20 Z" />
        {/* 中间竖带 */}
        <line x1="24" y1="14" x2="24" y2="42" />
        {/* 蝴蝶结 */}
        <path d="M24 14 Q20 8 16 10 Q14 12 18 14 Q20 15 24 14 Q28 15 30 14 Q34 12 32 10 Q28 8 24 14" />
        <circle cx="24" cy="14" r="1.5" fill={color} stroke="none" />
      </svg>
    )
  }
)

/** 帐篷：用于露营/旅行类事件 */
const TentIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function TentIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 帐篷主体 */}
        <path d="M6 40 L24 10 L42 40 Z" />
        {/* 帐篷门 */}
        <path d="M18 40 Q24 28 30 40" />
        {/* 帐篷顶小旗 */}
        <line x1="24" y1="10" x2="24" y2="4" />
        <path d="M24 4 L30 6 L24 8 Z" />
        {/* 地面阴影 */}
        <line x1="4" y1="40" x2="44" y2="40" strokeWidth={1.2} />
      </svg>
    )
  }
)

/** 书本：用于项目/学习类事件 */
const BookIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function BookIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 书本封面 */}
        <path d="M8 8 Q6 8 6 10 L6 40 Q6 42 8 42 L20 42 L20 10 Q20 8 22 8 L8 8 Z" />
        {/* 书页右半 */}
        <path d="M20 10 Q20 8 22 8 L40 8 Q42 8 42 10 L42 40 Q42 42 40 42 L20 42 Z" />
        {/* 中线 */}
        <line x1="20" y1="8" x2="20" y2="42" />
        {/* 书签 */}
        <path d="M30 8 L30 22 L34 18 L38 22 L38 8" />
      </svg>
    )
  }
)

/** 星点闪光：用于通用期待类事件 */
const SparkleIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function SparkleIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 主闪光 */}
        <path d="M24 8 L26 20 L38 22 L26 24 L24 36 L22 24 L10 22 L22 20 Z" />
        {/* 小星点1 */}
        <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
        {/* 小星点2 */}
        <circle cx="36" cy="14" r="1.2" fill={color} stroke="none" />
        {/* 小星点3 */}
        <circle cx="38" cy="32" r="1" fill={color} stroke="none" />
        {/* 小点装饰 */}
        <circle cx="14" cy="34" r="0.8" fill={color} stroke="none" />
      </svg>
    )
  }
)

/** 爱心：用于情人节/纪念日事件 */
const HeartIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function HeartIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 爱心主体 */}
        <path d="M24 40 Q8 28 8 18 Q8 10 14 10 Q19 10 24 18 Q29 10 34 10 Q40 10 40 18 Q40 28 24 40 Z" />
        {/* 高光 */}
        <path d="M18 16 Q16 18 18 22" strokeWidth={1.2} />
      </svg>
    )
  }
)

/** 生日蛋糕：用于生日庆祝事件 */
const CakeIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function CakeIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 蜡烛火焰 */}
        <path d="M24 6 Q26 10 24 14 Q22 10 24 6" fill={color} stroke="none" />
        {/* 蜡烛 */}
        <line x1="24" y1="14" x2="24" y2="22" />
        {/* 蛋糕上层 */}
        <rect x="12" y="22" width="24" height="10" rx="2" />
        {/* 奶油装饰 */}
        <path d="M12 26 Q14 24 16 26 Q18 28 20 26 Q22 24 24 26 Q26 28 28 26 Q30 24 32 26 Q34 28 36 26" strokeWidth={1.2} />
        {/* 蛋糕下层 */}
        <rect x="8" y="32" width="32" height="10" rx="2" />
        {/* 盘子 */}
        <path d="M6 42 Q24 46 42 42" />
        {/* 小奶油点 */}
        <circle cx="16" cy="37" r="1" fill={color} stroke="none" />
        <circle cx="24" cy="38" r="1" fill={color} stroke="none" />
        <circle cx="32" cy="37" r="1" fill={color} stroke="none" />
      </svg>
    )
  }
)

/** 门票：用于演唱会/活动事件 */
const TicketIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function TicketIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 门票主体 */}
        <path d="M6 14 L42 14 L42 34 L6 34 Z" />
        {/* 左侧缺口 */}
        <path d="M6 20 Q2 24 6 28" fill="#FBF6EE" />
        {/* 右侧缺口 */}
        <path d="M42 20 Q46 24 42 28" fill="#FBF6EE" />
        {/* 撕票线 */}
        <line x1="30" y1="14" x2="30" y2="34" strokeWidth={1} strokeDasharray="2 2" />
        {/* 星星装饰 */}
        <path d="M14 20 L15 22 L17 23 L15 24 L14 26 L13 24 L11 23 L13 22 Z" strokeWidth={1.2} />
        {/* 文字区 */}
        <line x1="34" y1="20" x2="40" y2="20" strokeWidth={1.2} />
        <line x1="34" y1="24" x2="40" y2="24" strokeWidth={1.2} />
        <line x1="34" y1="28" x2="38" y2="28" strokeWidth={1.2} />
      </svg>
    )
  }
)

/** 飞机：用于旅行/出行事件 */
const PlaneIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function PlaneIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 飞机主体 - 侧面 */}
        <path d="M40 24 L30 22 L22 10 L20 10 L24 22 L10 24 L8 26 L24 26 L20 38 L22 38 L30 26 L40 24 Z" />
        {/* 窗户 */}
        <circle cx="28" cy="24" r="1" fill={color} stroke="none" />
        <circle cx="32" cy="23" r="0.8" fill={color} stroke="none" />
        {/* 云层装饰 */}
        <path d="M6 36 Q10 32 14 36 Q18 32 22 36" strokeWidth={1.2} />
        {/* 航线 */}
        <path d="M36 12 Q30 18 24 22" strokeWidth={1} strokeDasharray="2 2" />
      </svg>
    )
  }
)

/** 花朵：用于节日/母亲节事件 */
const FlowerIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function FlowerIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 花瓣 - 上 */}
        <path d="M24 6 Q20 12 24 16 Q28 12 24 6" />
        {/* 花瓣 - 下 */}
        <path d="M24 32 Q20 36 24 40 Q28 36 24 32" />
        {/* 花瓣 - 左 */}
        <path d="M8 24 Q12 20 16 24 Q12 28 8 24" />
        {/* 花瓣 - 右 */}
        <path d="M32 24 Q36 20 40 24 Q36 28 32 24" />
        {/* 花瓣 - 左上 */}
        <path d="M13 13 Q16 16 17 20 Q14 18 13 13" />
        {/* 花瓣 - 右上 */}
        <path d="M35 13 Q32 16 31 20 Q34 18 35 13" />
        {/* 花瓣 - 左下 */}
        <path d="M13 35 Q16 32 17 28 Q14 30 13 35" />
        {/* 花瓣 - 右下 */}
        <path d="M35 35 Q32 32 31 28 Q34 30 35 35" />
        {/* 花心 */}
        <circle cx="24" cy="24" r="4" fill={color} stroke="none" />
        <circle cx="24" cy="24" r="2" fill="#FBF6EE" stroke="none" />
      </svg>
    )
  }
)

/** 封存信封：时光信件未到期状态 */
const EnvelopeClosedIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function EnvelopeClosedIcon({ size = 24, color = '#999', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 信封主体 */}
        <rect x="6" y="12" width="36" height="26" rx="2" />
        {/* 信封封口 */}
        <path d="M6 12 L24 26 L42 12" />
        {/* 锁的主体 */}
        <rect x="19" y="22" width="10" height="8" rx="1.5" />
        {/* 锁环 */}
        <path d="M21 22 L21 19 Q21 16 24 16 Q27 16 27 19 L27 22" />
        {/* 锁孔 */}
        <circle cx="24" cy="26" r="1.2" fill={color} stroke="none" />
      </svg>
    )
  }
)

/** 解封信封：时光信件已到期可查看 */
const EnvelopeOpenIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function EnvelopeOpenIcon({ size = 24, color = '#D9B36A', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 信封主体 */}
        <path d="M6 14 L24 24 L42 14 L42 36 Q42 38 40 38 L8 38 Q6 38 6 36 Z" />
        {/* 信封盖打开 */}
        <path d="M6 14 L24 8 L42 14" />
        {/* 信纸一角露出 */}
        <path d="M14 20 L24 16 L34 20 L34 30 Q34 32 32 32 L16 32 Q14 32 14 30 Z" fill="#FBF6EE" />
        {/* 信纸上的小字 */}
        <line x1="18" y1="24" x2="28" y2="24" strokeWidth={1} />
        <line x1="18" y1="27" x2="26" y2="27" strokeWidth={1} />
      </svg>
    )
  }
)

/** 月亮：代表思念、纪念日、特殊意义的日子 */
const MoonIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function MoonIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 月亮主体 - 弯月 */}
        <path d="M34 24 Q34 38 20 38 Q10 38 10 28 Q10 20 18 16 Q28 14 34 24" />
        {/* 月亮上的小坑 */}
        <circle cx="22" cy="24" r="2" strokeWidth={1.2} />
        <circle cx="26" cy="30" r="1.2" strokeWidth={1.2} />
        {/* 小星星装饰 */}
        <path d="M38 12 L38.8 14 L41 14.8 L38.8 15.6 L38 17.6 L37.2 15.6 L35 14.8 L37.2 14 Z" strokeWidth={1} />
        <path d="M10 8 L10.6 9.2 L11.8 9.8 L10.6 10.4 L10 11.6 L9.4 10.4 L8.2 9.8 L9.4 9.2 Z" strokeWidth={1} />
      </svg>
    )
  }
)

/** 彩虹：代表惊喜、美好时刻、里程碑事件 */
const RainbowIcon = forwardRef<SVGSVGElement, Omit<CountdownIconProps, 'type'>>(
  function RainbowIcon({ size = 36, color = '#6B5E58', className }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* 彩虹最外层 - 红色 */}
        <path d="M6 36 Q24 8 42 36" stroke="#C97B63" strokeWidth={2.5} />
        {/* 彩虹第二层 - 橙色 */}
        <path d="M10 36 Q24 14 38 36" stroke="#D9A056" strokeWidth={2.5} />
        {/* 彩虹第三层 - 黄色 */}
        <path d="M14 36 Q24 20 34 36" stroke="#C9B05E" strokeWidth={2.5} />
        {/* 彩虹第四层 - 绿色 */}
        <path d="M18 36 Q24 26 30 36" stroke="#8BA87E" strokeWidth={2.5} />
        {/* 彩虹最内层 - 蓝色 */}
        <path d="M22 36 Q24 32 26 36" stroke="#7A9BA8" strokeWidth={2.5} />
        {/* 云朵 */}
        <path d="M4 36 Q2 34 4 32 Q2 30 5 30 Q7 28 10 30 Q13 28 15 31 Q17 32 15 34 Q16 36 13 36 Z" fill="#FBF6EE" />
        <path d="M33 36 Q31 34 33 32 Q31 30 34 30 Q36 28 39 30 Q42 28 44 31 Q46 32 44 34 Q45 36 42 36 Z" fill="#FBF6EE" />
      </svg>
    )
  }
)

/**
 * 盼兮手绘图标组件
 * 
 * 使用示例：
 * <CountdownIcon type="star" size={48} />
 * <CountdownIcon type="gift" size={36} color="#D9B36A" />
 */
export const CountdownIcon = forwardRef<SVGSVGElement, CountdownIconProps>(
  function CountdownIcon({ type, size, color, className }, ref) {
    const props = { size, color, className }
    
    switch (type) {
      case 'star':
        return <StarIcon ref={ref} {...props} />
      case 'gift':
        return <GiftIcon ref={ref} {...props} />
      case 'tent':
        return <TentIcon ref={ref} {...props} />
      case 'book':
        return <BookIcon ref={ref} {...props} />
      case 'sparkle':
        return <SparkleIcon ref={ref} {...props} />
      case 'heart':
        return <HeartIcon ref={ref} {...props} />
      case 'cake':
        return <CakeIcon ref={ref} {...props} />
      case 'ticket':
        return <TicketIcon ref={ref} {...props} />
      case 'plane':
        return <PlaneIcon ref={ref} {...props} />
      case 'flower':
        return <FlowerIcon ref={ref} {...props} />
      case 'envelope-closed':
        return <EnvelopeClosedIcon ref={ref} {...props} />
      case 'envelope-open':
        return <EnvelopeOpenIcon ref={ref} {...props} />
      case 'moon':
        return <MoonIcon ref={ref} {...props} />
      case 'rainbow':
        return <RainbowIcon ref={ref} {...props} />
      default:
        return <SparkleIcon ref={ref} {...props} />
    }
  }
)
