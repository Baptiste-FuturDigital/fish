import { useEffect, useRef, useState } from "react"

import {
  interpolateScore,
  scoreAnimationDuration,
  toDisplayPoints,
} from "./score-display.js"

interface AnimatedScoreProps {
  points: number
  prefix?: string
  suffix?: string
}

export function AnimatedScore({
  points,
  prefix = "",
  suffix = "",
}: AnimatedScoreProps) {
  const target = toDisplayPoints(points)
  const currentRef = useRef(0)
  const [displayed, setDisplayed] = useState(0)
  const [animating, setAnimating] = useState(target !== 0)

  useEffect(() => {
    const from = currentRef.current
    if (from === target) {
      setDisplayed(target)
      setAnimating(false)
      return
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      currentRef.current = target
      setDisplayed(target)
      setAnimating(false)
      return
    }

    const duration = scoreAnimationDuration(from, target)
    const startedAt = performance.now()
    let animationFrame = 0
    setAnimating(true)

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const nextValue = interpolateScore(from, target, progress)
      currentRef.current = nextValue
      setDisplayed(nextValue)

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate)
      } else {
        setAnimating(false)
      }
    }

    animationFrame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [target])

  return (
    <span
      className="animated-score"
      data-animating={animating}
      data-score-prefix={prefix}
      data-score-target={target}
      aria-label={`${prefix}${target}${suffix || " points"}`}
    >
      {prefix}{displayed}{suffix}
    </span>
  )
}
