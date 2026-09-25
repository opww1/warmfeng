'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

interface OptionWheelProps {
  items: string[]
  defaultSelected?: number
  onChange?: (index: number, item: string) => void
  textColor?: string
  activeColor?: string
  side?: 'left' | 'right'
  fontSize?: number
  spacing?: number
  curve?: number
  tilt?: number
  blur?: number
  fade?: number
  minOpacity?: number
  smoothing?: number
  inset?: number
  loop?: boolean
  draggable?: boolean
  className?: string
}

export function OptionWheel({
  items,
  defaultSelected = 0,
  onChange,
  textColor = '#a6a6a6',
  activeColor = '#49352f',
  side = 'left',
  fontSize = 1.2,
  spacing = 1.4,
  curve = 1,
  tilt = 6,
  blur = 0.5,
  fade = 0.3,
  minOpacity = 0.05,
  smoothing = 200,
  inset = 40,
  loop = false,
  draggable = true,
  className = '',
}: OptionWheelProps) {
  const [selected, setSelected] = useState(defaultSelected)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartIndex = useRef(defaultSelected)

  const indexProgress = useMotionValue(defaultSelected)
  const smoothIndex = useSpring(indexProgress, {
    stiffness: 300 / (smoothing / 200),
    damping: 30,
    mass: 0.5,
  })

  useEffect(() => {
    onChange?.(selected, items[selected])
  }, [selected, items, onChange])

  const handleSelect = useCallback((index: number) => {
    let next = index
    if (loop) {
      next = ((index % items.length) + items.length) % items.length
    } else {
      next = Math.max(0, Math.min(items.length - 1, index))
    }
    setSelected(next)
    indexProgress.set(next)
  }, [items.length, loop, indexProgress])

  const handlePointerDown = useCallback((y: number) => {
    if (!draggable) return
    isDragging.current = true
    dragStartY.current = y
    dragStartIndex.current = selected
  }, [draggable, selected])

  const handlePointerMove = useCallback((y: number) => {
    if (!isDragging.current || !draggable) return
    const deltaY = y - dragStartY.current
    const indexDelta = deltaY / (fontSize * 16 * spacing)
    const newIndex = dragStartIndex.current - indexDelta
    indexProgress.set(newIndex)
  }, [draggable, fontSize, spacing, indexProgress])

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    const current = indexProgress.get()
    const snapped = Math.round(current)
    handleSelect(snapped)
  }, [indexProgress, handleSelect])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => handlePointerDown(e.touches[0].clientY)
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handlePointerMove(e.touches[0].clientY)
    }
    const onTouchEnd = () => handlePointerUp()
    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientY)
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) handlePointerMove(e.clientY)
    }
    const onMouseUp = () => handlePointerUp()
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1 : -1
      handleSelect(selected + delta)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); handleSelect(selected - 1) }
      if (e.key === 'ArrowDown') { e.preventDefault(); handleSelect(selected + 1) }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('keydown', onKeyDown)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('keydown', onKeyDown)
    }
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handleSelect, selected])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        height: `${fontSize * spacing * 2 * 16}px`,
        width: `${fontSize * 8}rem`,
      }}
      role="listbox"
      aria-label="选项列表"
    >
      {items.map((item, i) => {
        const offset = useTransform(smoothIndex, (val) => val - i)
        const absOffset = useTransform(offset, (val) => Math.abs(val))

        const y = useTransform(offset, (val) => val * fontSize * spacing * 16)
        const opacity = useTransform(absOffset, [0, 1, 2], [1, fade, minOpacity])
        const scale = useTransform(absOffset, [0, 1], [1, 0.9])
        const rotateX = useTransform(offset, [-2, 0, 2], [tilt * curve, 0, -tilt * curve])
        const z = useTransform(absOffset, [0, 2], [0, -50 * curve])

        const color = useTransform(absOffset, (val) => val < 0.5 ? activeColor : textColor)
        const blurFilter = useTransform(absOffset, (val) => {
          const b = val < 1 ? blur : val < 2 ? blur * 3 : blur * 5
          return `blur(${b}px)`
        })

        const xTransform = side === 'left' ? 0 : -inset

        return (
          <motion.div
            key={item}
            className="absolute left-0 right-0 flex items-center justify-center cursor-pointer"
            style={{
              y,
              opacity,
              scale,
              z,
              rotateX,
              x: xTransform,
              transformStyle: 'preserve-3d',
            }}
            onClick={() => handleSelect(i)}
            role="option"
            aria-selected={i === selected}
          >
            <motion.span
              style={{
                fontSize: `${fontSize}rem`,
                color,
                filter: blurFilter,
                fontFamily: 'serif',
                fontWeight: i === selected ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {item}
            </motion.span>
          </motion.div>
        )
      })}

      <div
        className="pointer-events-none absolute left-0 right-0"
        style={{
          top: '50%',
          height: `${fontSize * spacing * 16}px`,
          transform: 'translateY(-50%)',
          borderTop: '1px solid rgba(74,59,50,0.1)',
          borderBottom: '1px solid rgba(74,59,50,0.1)',
        }}
      />
    </div>
  )
}

export default OptionWheel
