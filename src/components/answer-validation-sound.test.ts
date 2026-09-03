import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { AnswerValidationSound } from "./answer-validation-sound.js"

describe("answer validation sound", () => {
  it("précharge le sound effect YouTube sans autoplay", async () => {
    const { buildAnswerValidationSoundSource } = await import("./answer-validation-sound.js")
    const source = new URL(buildAnswerValidationSoundSource("http://localhost:5179"))

    expect(source.pathname).toBe("/embed/sj_8f94zsUs")
    expect(source.searchParams.get("autoplay")).toBe("0")
    expect(source.searchParams.get("enablejsapi")).toBe("1")
    expect(source.searchParams.get("origin")).toBe("http://localhost:5179")
  })

  it("attend le player puis rejoue le son depuis le début à chaque validation", async () => {
    const { createAnswerValidationSoundController } = await import("./answer-validation-sound.js")
    const commands: Array<{ name: string; args: readonly unknown[] }> = []
    const player = createAnswerValidationSoundController((command) => commands.push(command))

    player.requestPlay()
    expect(commands).toEqual([])

    player.markLoaded()
    expect(commands).toEqual([
      { name: "seekTo", args: [0, true] },
      { name: "unMute", args: [] },
      { name: "playVideo", args: [] },
    ])

    player.requestPlay()
    expect(commands.slice(-3)).toEqual([
      { name: "seekTo", args: [0, true] },
      { name: "unMute", args: [] },
      { name: "playVideo", args: [] },
    ])
  })

  it("émet une demande de lecture uniquement quand l'appelant confirme", async () => {
    const { ANSWER_VALIDATION_SOUND_EVENT, requestAnswerValidationSound } = await import("./answer-validation-sound.js")
    const target = new EventTarget()
    const listener = vi.fn()
    target.addEventListener(ANSWER_VALIDATION_SOUND_EVENT, listener)

    expect(listener).not.toHaveBeenCalled()
    requestAnswerValidationSound(target)
    expect(listener).toHaveBeenCalledOnce()
  })

  it("ne monte aucun player quand le son participant est désactivé", () => {
    expect(renderToStaticMarkup(createElement(AnswerValidationSound, { enabled: false }))).toBe("")
  })
})
