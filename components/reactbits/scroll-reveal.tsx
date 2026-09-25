'use client'

import { useEffect, useRef, useMemo, type ReactNode, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface ScrollRevealProps {
  children: ReactNode
  scrollContainerRef?: RefObject<HTMLElement | null>
  enableBlur?: boolean
  baseOpacity?: number
  baseRotation?: number
  blurStrength?: number
  containerClassName?: string
  textClassName?: string
  rotationEnd?: string
  wordAnimationEnd?: string
}

export function ScrollReveal({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<HTMLSpanElement[]>([])

  const words = useMemo(() => {
    if (typeof children === 'string') {
      return children.split(' ')
    }
    return null
  }, [children])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scroller = scrollContainerRef?.current || window

    const elements = words
      ? wordRefs.current.filter(Boolean)
      : [container]

    if (words) {
      gsap.set(elements, {
        opacity: baseOpacity,
        y: 20,
        filter: enableBlur ? `blur(${blurStrength}px)` : 'none',
        willChange: 'transform, opacity, filter',
      })

      gsap.to(elements, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        ease: 'power2.out',
        stagger: 0.03,
        scrollTrigger: {
          trigger: container,
          scroller,
          start: 'top 85%',
          end: wordAnimationEnd,
          scrub: 1,
          once: true,
        },
      })
    } else {
      gsap.set(container, {
        opacity: baseOpacity,
        y: 30,
        rotation: baseRotation,
        filter: enableBlur ? `blur(${blurStrength}px)` : 'none',
        willChange: 'transform, opacity, filter',
      })

      gsap.to(container, {
        opacity: 1,
        y: 0,
        rotation: 0,
        filter: 'blur(0px)',
        ease: 'power2.out',
        scrollTrigger: {
          trigger: container,
          scroller,
          start: 'top 85%',
          end: rotationEnd,
          scrub: 1,
          once: true,
        },
      })
    }

    ScrollTrigger.refresh()

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === container) {
          t.kill()
        }
      })
    }
  }, [words, enableBlur, baseOpacity, baseRotation, blurStrength, rotationEnd, wordAnimationEnd, scrollContainerRef])

  if (words) {
    return (
      <div ref={containerRef} className={containerClassName}>
        {words.map((word, i) => (
          <span
            key={i}
            ref={(el) => { if (el) wordRefs.current[i] = el }}
            className={`inline-block ${textClassName}`}
            style={{ whiteSpace: i < words.length - 1 ? 'pre' : 'normal' }}
          >
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={containerClassName}>
      <div className={textClassName}>
        {children}
      </div>
    </div>
  )
}
