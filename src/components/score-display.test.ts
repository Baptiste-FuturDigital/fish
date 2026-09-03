import { describe, expect, it } from "vitest"

import {
  buildScoreToneSchedule,
  interpolateScore,
  scoreAnimationDuration,
  shouldPlayScoreRiseSound,
  toDisplayPoints,
} from "./score-display.js"

describe("score display", () => {
  it("multiplie chaque point de jeu par dix", () => {
    expect(toDisplayPoints(0)).toBe(0)
    expect(toDisplayPoints(1)).toBe(10)
    expect(toDisplayPoints(2)).toBe(20)
    expect(toDisplayPoints(4)).toBe(40)
  })

  it("anime les points jusqu’à la valeur exacte", () => {
    expect(interpolateScore(0, 20, 0)).toBe(0)
    expect(interpolateScore(0, 20, 0.5)).toBeGreaterThan(10)
    expect(interpolateScore(0, 20, 1)).toBe(20)
    expect(scoreAnimationDuration(0, 20)).toBeGreaterThanOrEqual(900)
  })

  it("prépare un son montant sans créer une note par point", () => {
    const tones = buildScoreToneSchedule(20)

    expect(tones.length).toBeGreaterThanOrEqual(6)
    expect(tones.length).toBeLessThanOrEqual(14)
    expect(tones.at(-1)!.frequency).toBeGreaterThan(tones[0].frequency)
    expect(tones.at(-1)!.delayMs).toBeGreaterThan(tones[0].delayMs)
  })

  it("réserve le bruit de score au maître du jeu", () => {
    expect(shouldPlayScoreRiseSound(false, 4)).toBe(false)
    expect(shouldPlayScoreRiseSound(true, 0)).toBe(false)
    expect(shouldPlayScoreRiseSound(true, 4)).toBe(true)
  })
})
