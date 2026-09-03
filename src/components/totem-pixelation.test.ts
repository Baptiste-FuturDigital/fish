import { describe, expect, it } from "vitest"

import { pixelResolutionAtProgress } from "./totem-pixelation.js"

describe("pixelResolutionAtProgress", () => {
  it("décode progressivement une image très pixelisée vers sa définition complète", () => {
    expect(pixelResolutionAtProgress(0, 720)).toBe(12)
    expect(pixelResolutionAtProgress(0.5, 720)).toBeGreaterThan(12)
    expect(pixelResolutionAtProgress(0.5, 720)).toBeLessThan(720)
    expect(pixelResolutionAtProgress(1, 720)).toBe(720)
  })

  it("borne la progression hors de l'intervalle", () => {
    expect(pixelResolutionAtProgress(-1, 720)).toBe(12)
    expect(pixelResolutionAtProgress(2, 720)).toBe(720)
  })
})
