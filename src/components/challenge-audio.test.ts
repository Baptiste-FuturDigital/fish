import { afterEach, describe, expect, it, vi } from "vitest"

describe("challenge audio", () => {
  afterEach(() => vi.useRealTimers())

  it("autorise le générique uniquement pour une session hôte", async () => {
    const { isHostAudioEnabled } = await import("./challenge-audio-control.js")

    expect(isHostAudioEnabled({})).toBe(false)
    expect(isHostAudioEnabled({ hostToken: "" })).toBe(false)
    expect(isHostAudioEnabled({ hostToken: "host" })).toBe(true)
  })

  it("limite le générique Who's that Salmon aux cinq premières secondes", async () => {
    const { buildChallengeAudioSource } = await import("./challenge-audio-control.js")
    const source = new URL(buildChallengeAudioSource({
      videoId: "FsvGm4pqlW8",
      startSeconds: 0,
      endSeconds: 5,
      origin: "http://localhost:5179",
    }))

    expect(source.pathname).toBe("/embed/FsvGm4pqlW8")
    expect(source.searchParams.get("autoplay")).toBe("0")
    expect(source.searchParams.get("enablejsapi")).toBe("1")
    expect(source.searchParams.get("start")).toBe("0")
    expect(source.searchParams.get("end")).toBe("5")
  })

  it("attend le chargement du player avant d'envoyer les commandes", async () => {
    const { createChallengePlayerController } = await import("./challenge-audio-control.js")
    const commands: string[] = []
    const player = createChallengePlayerController((command) => commands.push(command))

    player.send("playVideo")
    player.send("unMute")
    expect(commands).toEqual([])

    player.markLoaded()
    expect(commands).toEqual(["playVideo", "unMute"])

    player.send("mute")
    expect(commands).toEqual(["playVideo", "unMute", "mute"])
  })

  it("suspend immédiatement, attend une seconde, joue puis restaure après un clip borné", async () => {
    const { beginChallengeAudioSequence } = await import("./challenge-audio-control.js")
    vi.useFakeTimers()
    const target = new EventTarget()
    const states: boolean[] = []
    const commands: string[] = []
    target.addEventListener("fish:set-ambient-suspended", (event) => {
      states.push((event as CustomEvent<boolean>).detail)
    })

    const cleanup = beginChallengeAudioSequence({
      clipDurationMs: 5_000,
      sendCommand: (command) => commands.push(command),
      target,
    })
    expect(states).toEqual([true])
    expect(commands).toEqual([])

    vi.advanceTimersByTime(999)
    expect(states).toEqual([true])
    expect(commands).toEqual([])

    vi.advanceTimersByTime(1)
    expect(commands).toEqual(["playVideo", "unMute"])
    expect(states).toEqual([true])

    vi.advanceTimersByTime(4_999)
    expect(states).toEqual([true])

    vi.advanceTimersByTime(1)
    expect(states).toEqual([true, false])
    cleanup()
    expect(states).toEqual([true, false])
  })

  it("garde l’ambiance suspendue pour un générique libre jusqu’à sa coupure", async () => {
    const { beginChallengeAudioSequence } = await import("./challenge-audio-control.js")
    vi.useFakeTimers()
    const target = new EventTarget()
    const states: boolean[] = []
    const commands: string[] = []
    target.addEventListener("fish:set-ambient-suspended", (event) => {
      states.push((event as CustomEvent<boolean>).detail)
    })

    const stop = beginChallengeAudioSequence({
      sendCommand: (command) => commands.push(command),
      target,
    })

    expect(states).toEqual([true])
    vi.advanceTimersByTime(1_000)
    expect(commands).toEqual(["playVideo", "unMute"])

    vi.advanceTimersByTime(60_000)
    expect(states).toEqual([true])

    stop()
    expect(states).toEqual([true, false])
    stop()
    expect(states).toEqual([true, false])
  })
})
