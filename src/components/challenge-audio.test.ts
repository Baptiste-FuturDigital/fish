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

  it("joue un fond en boucle et relance le jingle à chaque guess", async () => {
    const audioControl = await import("./challenge-audio-control.js")
    const buildSource = audioControl.buildChallengeAudioSource
    const beginSession = Reflect.get(audioControl, "beginSalmonRoundAudioSession") as
      | undefined
      | ((options: {
        cueDurationMs: number
        sendBackgroundCommand: (command: { name: string; args: readonly unknown[] }) => void
        sendCueCommand: (command: { name: string; args: readonly unknown[] }) => void
        target: EventTarget
      }) => {
        playCue: () => void
        muteBackground: () => void
        resumeBackground: () => void
        stop: () => void
      })

    const source = new URL(buildSource({
      videoId: "3pPR6IOV7Rg",
      origin: "http://localhost:5179",
      loop: true,
    } as Parameters<typeof buildSource>[0] & { loop: boolean }))
    expect(source.searchParams.get("loop")).toBe("1")
    expect(source.searchParams.get("playlist")).toBe("3pPR6IOV7Rg")
    expect(typeof beginSession).toBe("function")
    if (!beginSession) return

    vi.useFakeTimers()
    const target = new EventTarget()
    const ambientStates: boolean[] = []
    const background: string[] = []
    const cue: string[] = []
    target.addEventListener("fish:set-ambient-suspended", (event) => {
      ambientStates.push((event as CustomEvent<boolean>).detail)
    })
    const session = beginSession({
      cueDurationMs: 5_000,
      sendBackgroundCommand: ({ name }) => background.push(name),
      sendCueCommand: ({ name }) => cue.push(name),
      target,
    })

    expect(ambientStates).toEqual([true])
    expect(background).toEqual(["unMute", "playVideo"])
    session.playCue()
    expect(cue).toEqual(["seekTo", "unMute", "playVideo"])
    vi.advanceTimersByTime(5_000)
    expect(cue.at(-1)).toBe("pauseVideo")
    session.muteBackground()
    expect(background.at(-1)).toBe("mute")
    session.resumeBackground()
    expect(background.slice(-2)).toEqual(["unMute", "playVideo"])
    session.stop()
    expect(background.at(-1)).toBe("pauseVideo")
    expect(ambientStates).toEqual([true, false])
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

  it("enchaîne la musique de question et l’effet de fin exactement à zéro", async () => {
    const audioControl = await import("./challenge-audio-control.js")
    const beginSequence = Reflect.get(audioControl, "beginQuestionTimerAudioSequence") as
      | undefined
      | ((options: {
        deadlineMs: number
        now: number
        endSoundDurationMs: number
        sendTimerCommand: (command: { name: string; args: readonly unknown[] }) => void
        sendEndCommand: (command: { name: string; args: readonly unknown[] }) => void
        target: EventTarget
      }) => { hasExpired: () => boolean; stop: () => void })

    expect(typeof beginSequence).toBe("function")
    if (!beginSequence) return

    vi.useFakeTimers()
    const target = new EventTarget()
    const ambientStates: boolean[] = []
    const timerCommands: Array<{ name: string; args: readonly unknown[] }> = []
    const endCommands: Array<{ name: string; args: readonly unknown[] }> = []
    target.addEventListener("fish:set-ambient-suspended", (event) => {
      ambientStates.push((event as CustomEvent<boolean>).detail)
    })

    const sequence = beginSequence({
      deadlineMs: 30_000,
      now: 0,
      endSoundDurationMs: 6_000,
      sendTimerCommand: (command) => timerCommands.push(command),
      sendEndCommand: (command) => endCommands.push(command),
      target,
    })

    expect(ambientStates).toEqual([true])
    expect(timerCommands.map(({ name }) => name)).toEqual(["seekTo", "unMute", "playVideo"])
    expect(endCommands).toEqual([])

    vi.advanceTimersByTime(29_999)
    expect(sequence.hasExpired()).toBe(false)
    expect(endCommands).toEqual([])

    vi.advanceTimersByTime(1)
    expect(sequence.hasExpired()).toBe(true)
    expect(timerCommands.at(-1)?.name).toBe("pauseVideo")
    expect(endCommands.map(({ name }) => name)).toEqual(["seekTo", "unMute", "playVideo"])
    expect(ambientStates).toEqual([true])

    vi.advanceTimersByTime(6_000)
    expect(ambientStates).toEqual([true, false])
    sequence.stop()
    expect(ambientStates).toEqual([true, false])
  })

  it("coupe la tension sans effet final quand le maître révèle avant zéro", async () => {
    const audioControl = await import("./challenge-audio-control.js")
    const beginSequence = Reflect.get(audioControl, "beginQuestionTimerAudioSequence") as
      | undefined
      | ((options: {
        deadlineMs: number
        now: number
        endSoundDurationMs: number
        sendTimerCommand: (command: { name: string; args: readonly unknown[] }) => void
        sendEndCommand: (command: { name: string; args: readonly unknown[] }) => void
        target: EventTarget
      }) => { stop: () => void })

    expect(typeof beginSequence).toBe("function")
    if (!beginSequence) return

    vi.useFakeTimers()
    const target = new EventTarget()
    const ambientStates: boolean[] = []
    const timerCommands: string[] = []
    const endCommands: string[] = []
    target.addEventListener("fish:set-ambient-suspended", (event) => {
      ambientStates.push((event as CustomEvent<boolean>).detail)
    })

    const sequence = beginSequence({
      deadlineMs: 30_000,
      now: 0,
      endSoundDurationMs: 6_000,
      sendTimerCommand: ({ name }) => timerCommands.push(name),
      sendEndCommand: ({ name }) => endCommands.push(name),
      target,
    })

    vi.advanceTimersByTime(10_000)
    sequence.stop()
    vi.runAllTimers()

    expect(timerCommands.at(-1)).toBe("pauseVideo")
    expect(endCommands).toEqual([])
    expect(ambientStates).toEqual([true, false])
  })
})
