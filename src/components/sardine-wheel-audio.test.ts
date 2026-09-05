import { describe, expect, it } from "vitest"

import { buildSardineWheelScore } from "./sardine-wheel-audio.js"

describe("sardine wheel audio", () => {
  it("compose un ostinato de rotation suivi d'une fanfare de victoire", () => {
    const score = buildSardineWheelScore()
    const spin = score.filter((note) => note.phase === "spin")
    const fanfare = score.filter((note) => note.phase === "fanfare")

    expect(spin.length).toBeGreaterThanOrEqual(12)
    expect(fanfare.length).toBeGreaterThanOrEqual(4)
    expect(Math.max(...spin.map((note) => note.atMs))).toBeLessThan(
      Math.min(...fanfare.map((note) => note.atMs)),
    )
    expect(new Set(fanfare.map((note) => note.frequency)).size).toBeGreaterThan(2)
  })
})
