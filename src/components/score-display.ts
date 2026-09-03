export const SCORE_MULTIPLIER = 10

export interface ScoreTone {
  delayMs: number
  frequency: number
}

export function toDisplayPoints(points: number): number {
  return Math.round(points * SCORE_MULTIPLIER)
}

export function scoreAnimationDuration(from: number, to: number): number {
  return Math.min(1_800, Math.max(900, Math.abs(to - from) * 35))
}

export function interpolateScore(from: number, to: number, progress: number): number {
  const boundedProgress = Math.min(1, Math.max(0, progress))
  const easedProgress = 1 - (1 - boundedProgress) ** 3
  return Math.round(from + (to - from) * easedProgress)
}

export function buildScoreToneSchedule(displayPoints: number): ScoreTone[] {
  const toneCount = Math.min(14, Math.max(6, Math.ceil(Math.abs(displayPoints) / 2)))
  return Array.from({ length: toneCount }, (_, index) => {
    const progress = toneCount === 1 ? 1 : index / (toneCount - 1)
    return {
      delayMs: Math.round(progress * 950),
      frequency: Math.round(330 + progress * 550),
    }
  })
}

export function shouldPlayScoreRiseSound(enabled: boolean, points: number): boolean {
  return enabled && points > 0
}
