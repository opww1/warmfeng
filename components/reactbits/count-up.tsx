'use client'

import { useEffect, useRef } from 'react'
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react'

interface CountUpProps {
  to: number
  from?: number
  direction?: 'up' | 'down'
  delay?: number
  duration?: number
  className?: string
  startWhen?: boolean
  separator?: string
  onStart?: () => void
  onEnd?: () => void
}

export function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 1,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}: CountUpProps) {
  const motionValue = useMotionValue(direction === 'down' ? to : from)
  const springValue = useSpring(motionValue, {
    damping: 100,
    stiffness: 100,
    duration: duration * 1000,
  })

  const displayValue = useTransform(springValue, (latest) => {
    const rounded = Math.round(latest)
    if (separator) {
      return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    }
    return rounded.toString()
  })

  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!startWhen) return
    const target = direction === 'down' ? from : to
    const start = direction === 'down' ? to : from

    if (onStart) onStart()

    motionValue.set(start)

    const timer = setTimeout(() => {
      motionValue.set(target)
      hasAnimated.current = true
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [to, from, direction, delay, startWhen])

  useEffect(() => {
    if (hasAnimated.current && onEnd) {
      const unsubscribe = springValue.on('change', (latest) => {
        if (Math.abs(latest - to) < 0.5) {
          onEnd()
          unsubscribe()
        }
      })
    }
  }, [springValue, to, onEnd])

  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  if (reducedMotion) {
    return (
      <span className={className}>
        {direction === 'down' ? from : to}
      </span>
    )
  }

  return (
    <motion.span className={className}>
      <motion.span style={{ display: 'inline-block' }}>
        {displayValue}
      </motion.span>
    </motion.span>
  )
}

export default CountUp
