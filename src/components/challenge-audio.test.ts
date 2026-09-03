import { afterEach, describe, expect, it, vi } from "vitest"

describe("challenge audio", () => {
  afterEach(() => vi.useRealTimers())

  it("limite le générique Who's that Salmon aux cinq premières secondes", async () => {
    const { buildChallengeAudioSource } = await import("./challenge-audio-control.js")
    const source = new URL(buildChallengeAudioSource({
      videoId: "FsvGm4pqlW8",
      startSeconds: 0,
      endSeconds: 5,
      origin: "http://localhost:5179",
    }))

    expect(source.pathname).toBe("/embed/FsvGm4pqlW8")
    expect(source.searchParams.get("start")).toBe("0")
    expect(source.searchParams.get("end")).toBe("5")
  })

  it("suspend l’ambiance pendant le générique puis la restaure", async () => {
    const { beginAmbientSuspension } = await import("./challenge-audio-control.js")
    vi.useFakeTimers()
    const target = new EventTarget()
    const states: boolean[] = []
    target.addEventListener("fish:set-ambient-suspended", (event) => {
      states.push((event as CustomEvent<boolean>).detail)
    })

    const cleanup = beginAmbientSuspension(5_000, target)
    expect(states).toEqual([true])

    vi.advanceTimersByTime(4_999)
    expect(states).toEqual([true])

    vi.advanceTimersByTime(1)
    expect(states).toEqual([true, false])
    cleanup()
  })
})
