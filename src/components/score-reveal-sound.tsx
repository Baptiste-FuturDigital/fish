import { useEffect } from "react"

import {
  buildScoreToneSchedule,
  shouldPlayScoreRiseSound,
  toDisplayPoints,
} from "./score-display.js"

const AMBIENT_EVENT = "fish:set-ambient-suspended"

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

export function playScoreRiseSound(points: number) {
  const audioWindow = window as AudioWindow
  const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext
  if (!AudioContextConstructor || points <= 0) return undefined

  const context = new AudioContextConstructor()
  const tones = buildScoreToneSchedule(toDisplayPoints(points))
  const startedAt = context.currentTime + 0.04
  let restored = false

  window.dispatchEvent(new CustomEvent<boolean>(AMBIENT_EVENT, { detail: true }))
  void context.resume().catch(() => undefined)

  for (const tone of tones) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = startedAt + tone.delayMs / 1_000
    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(tone.frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.035, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.12)
  }

  const restore = () => {
    if (restored) return
    restored = true
    window.dispatchEvent(new CustomEvent<boolean>(AMBIENT_EVENT, { detail: false }))
    void context.close().catch(() => undefined)
  }
  const restoreTimer = window.setTimeout(restore, (tones.at(-1)?.delayMs ?? 0) + 220)

  return () => {
    window.clearTimeout(restoreTimer)
    restore()
  }
}

export function ScoreRevealSound({
  enabled,
  points,
  roundId,
}: {
  enabled: boolean
  points: number
  roundId: string
}) {
  useEffect(() => {
    if (!shouldPlayScoreRiseSound(enabled, points)) return
    return playScoreRiseSound(points)
  }, [enabled, points, roundId])

  return null
}
