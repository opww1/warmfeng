'use client'

/* ============================================================
 * 公共心情模块 · 暖枫心迹
 * 统一首页和心迹的心情类型、图标、色彩映射
 * ============================================================ */

import type React from 'react'

export type MoodSymbol = 'leaf' | 'tea' | 'star' | 'sun' | 'heart'

export interface MoodMeta {
  color: string
  bg: string
  name: string
}

export const MOOD_COLORS: Record<MoodSymbol, MoodMeta> = {
  leaf: { color: '#7B9A7B', bg: 'rgba(123, 154, 123, 0.08)', name: '平静' },
  tea: { color: '#B8956A', bg: 'rgba(184, 149, 106, 0.08)', name: '闲适' },
  star: { color: '#9B8CB8', bg: 'rgba(155, 140, 184, 0.08)', name: '憧憬' },
  sun: { color: '#C9956B', bg: 'rgba(201, 149, 107, 0.10)', name: '温暖' },
  heart: { color: '#B87878', bg: 'rgba(184, 120, 120, 0.08)', name: '柔软' },
}

export const MOOD_OPTIONS: MoodSymbol[] = ['leaf', 'tea', 'star', 'sun', 'heart']

export const MOOD_LABELS: Record<MoodSymbol, string> = {
  leaf: '平静',
  tea: '闲适',
  star: '憧憬',
  sun: '温暖',
  heart: '柔软',
}

/* localStorage keys */
export const HOME_MOOD_KEY = 'homeMood'
export const HOME_NOTE_KEY = 'homeNote'
export const MIND_TRACE_KEY = 'mindTraceData'

/* ---------- 获取今天的日期 key ---------- */
export const getTodayKey = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ---------- 获取首页心情 ---------- */
export const getHomeMood = (): MoodSymbol | null => {
  try {
    const stored = localStorage.getItem(HOME_MOOD_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as { date: string; mood: MoodSymbol }
    if (parsed.date === getTodayKey()) {
      return parsed.mood
    }
    return null
  } catch {
    return null
  }
}

/* ---------- 保存首页心情 ---------- */
export const saveHomeMood = (mood: MoodSymbol): void => {
  try {
    localStorage.setItem(HOME_MOOD_KEY, JSON.stringify({
      date: getTodayKey(),
      mood,
      updatedAt: new Date().toISOString()
    }))
  } catch {
    // ignore
  }
}

/* ---------- 获取首页便签 ---------- */
export const getHomeNote = (): string => {
  try {
    const stored = localStorage.getItem(HOME_NOTE_KEY)
    if (!stored) return ''
    const parsed = JSON.parse(stored) as { date: string; note: string }
    if (parsed.date === getTodayKey()) {
      return parsed.note
    }
    return ''
  } catch {
    return ''
  }
}

/* ---------- 保存首页便签 ---------- */
export const saveHomeNote = (note: string): void => {
  try {
    localStorage.setItem(HOME_NOTE_KEY, JSON.stringify({
      date: getTodayKey(),
      note,
      updatedAt: new Date().toISOString()
    }))
  } catch {
    // ignore
  }
}

/* ============================================================
 * 心情图标组件（手绘 SVG）
 * ============================================================ */
interface MoodIconProps {
  type: MoodSymbol
  size?: number
  selected?: boolean
}

export function MoodIcon({ type, size = 28, selected = false }: MoodIconProps) {
  const colors = MOOD_COLORS[type]
  const strokeColor = selected ? colors.color : '#6B5E58'
  const fillColor = selected ? colors.bg : 'transparent'

  const icons: Record<MoodSymbol, React.JSX.Element> = {
    leaf: (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <path d="M14 4C14 4 8 8 8 16C8 20 10 24 14 24C18 24 20 20 20 16C20 8 14 4 14 4Z" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={fillColor} />
        <path d="M14 24V10" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M14 14L11 12" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
        <path d="M14 17L17 15" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    tea: (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <path d="M6 12C6 12 6 20 10 20H16C20 20 20 12 20 12" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={fillColor} />
        <path d="M20 13C22 13 23 12 23 11C23 10 22 9 20 9" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 8C10 6 11 5 11 5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M14 8C14 6 15 5 15 5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M18 8C18 6 19 5 19 5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5" y1="11" x2="21" y2="11" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    star: (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <path d="M14 4L16.5 11.5L24 12L18 17L20 24L14 20L8 24L10 17L4 12L11.5 11.5L14 4Z" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={fillColor} />
        <circle cx="14" cy="14" r="2" fill={strokeColor} />
      </svg>
    ),
    sun: (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="5" stroke={strokeColor} strokeWidth="1.5" fill={fillColor} />
        <line x1="14" y1="4" x2="14" y2="7" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="21" x2="14" y2="24" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="14" x2="7" y2="14" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="21" y1="14" x2="24" y2="14" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="7" x2="9" y2="9" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19" y1="19" x2="21" y2="21" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="21" x2="9" y2="19" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19" y1="9" x2="21" y2="7" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    heart: (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <path d="M14 24C14 24 5 17 5 11C5 7 8 4 11 4C12.5 4 13.5 5 14 6C14.5 5 15.5 4 17 4C20 4 23 7 23 11C23 17 14 24 14 24Z" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={fillColor} />
        <path d="M14 12C14 12 12 10 10.5 10.5" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  }

  return icons[type]
}
