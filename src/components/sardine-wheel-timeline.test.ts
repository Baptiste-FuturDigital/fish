import { describe, expect, it } from "vitest"

import {
  SARDINE_FINAL_ROTATION_DEGREES,
  wheelProgress,
  wheelRotation,
} from "./sardine-wheel-timeline.js"

describe("sardine wheel timeline", () => {
  it("borne la progression entre zéro et un à partir de l'heure serveur", () => {
    const startedAt = "2026-09-05T20:00:00.000Z"

    expect(wheelProgress(startedAt, 6_000, Date.parse(startedAt) - 1)).toBe(0)
    expect(wheelProgress(startedAt, 6_000, Date.parse(startedAt) + 3_000)).toBe(0.5)
    expect(wheelProgress(startedAt, 6_000, Date.parse(startedAt) + 9_000)).toBe(1)
  })

  it("décélère sur l'angle fixe de la sardine après sept tours", () => {
    expect(wheelRotation(0)).toBe(0)
    expect(wheelRotation(0.5)).toBeGreaterThan(SARDINE_FINAL_ROTATION_DEGREES * 0.9)
    expect(wheelRotation(1)).toBe(SARDINE_FINAL_ROTATION_DEGREES)
  })
})
