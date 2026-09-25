'use client'

import { useCallback, useEffect, useState } from 'react'

export type FavoriteArticle = {
  title: string
  desc: string
  date: string
  category: string
  savedAt: number
}

const KEY = 'warmFengArticleFavorites'

function read(): FavoriteArticle[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as FavoriteArticle[]) : []
  } catch {
    return []
  }
}

function write(list: FavoriteArticle[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
    // 同标签页内跨组件同步
    window.dispatchEvent(new Event('storage'))
  } catch {
    /* 忽略配额等异常 */
  }
}

function match(a: { title: string; category: string }, b: FavoriteArticle) {
  return b.title === a.title && b.category === a.category
}

export function useArticleFavorites() {
  // 初始为空，挂载后再读 localStorage，避免 SSR 水合不匹配
  const [favorites, setFavorites] = useState<FavoriteArticle[]>([])

  useEffect(() => {
    setFavorites(read())
    const sync = () => setFavorites(read())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const isFav = useCallback(
    (category: string, title: string) => favorites.some((f) => match({ category, title }, f)),
    [favorites],
  )

  const toggle = useCallback(
    (a: { title: string; desc: string; date: string; category: string }): boolean => {
      const list = read()
      const exists = list.some((f) => match(a, f))
      const next = exists
        ? list.filter((f) => !match(a, f))
        : [...list, { ...a, savedAt: Date.now() }]
      write(next)
      setFavorites(next)
      return !exists
    },
    [],
  )

  const remove = useCallback((category: string, title: string) => {
    const next = read().filter((f) => !(f.title === title && f.category === category))
    write(next)
    setFavorites(next)
  }, [])

  return { favorites, isFav, toggle, remove }
}
