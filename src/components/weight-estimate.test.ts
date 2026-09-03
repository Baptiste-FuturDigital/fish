import { describe, expect, it } from "vitest"

import { formatWeightEstimate } from "./weight-estimate.js"

describe("formatWeightEstimate", () => {
  it.each([
    [0.09, "g", "90 g"],
    [272, "kg", "272 kg"],
    [150_000, "t", "150 t"],
  ] as const)("affiche %s kg en %s", (kilograms, unit, expected) => {
    expect(formatWeightEstimate(kilograms, unit)).toBe(expected)
  })
})
