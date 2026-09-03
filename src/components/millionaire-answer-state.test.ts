import { describe, expect, it } from "vitest"

import {
  createMillionaireAnswerState,
  millionaireAnswerReducer,
} from "./millionaire-answer-state.js"

describe("millionaire answer state", () => {
  it("refuse la confirmation tant qu’aucune réponse n’est choisie", () => {
    const state = createMillionaireAnswerState("")

    expect(millionaireAnswerReducer(state, { type: "request-confirmation" })).toEqual({
      phase: "choosing",
      selectedAnswer: "",
    })
  })

  it("demande explicitement le dernier mot après une sélection", () => {
    const selected = millionaireAnswerReducer(
      createMillionaireAnswerState(""),
      { type: "select", answer: "b" },
    )

    expect(selected).toEqual({ phase: "choosing", selectedAnswer: "b" })
    expect(
      millionaireAnswerReducer(selected, { type: "request-confirmation" }),
    ).toEqual({ phase: "confirming", selectedAnswer: "b" })
  })

  it("permet de revenir au choix sans perdre la réponse", () => {
    const confirming = {
      phase: "confirming",
      selectedAnswer: "d",
    } as const

    expect(millionaireAnswerReducer(confirming, { type: "reconsider" })).toEqual({
      phase: "choosing",
      selectedAnswer: "d",
    })
  })

  it("annule la confirmation si une nouvelle réponse est sélectionnée", () => {
    const confirming = {
      phase: "confirming",
      selectedAnswer: "a",
    } as const

    expect(
      millionaireAnswerReducer(confirming, { type: "select", answer: "c" }),
    ).toEqual({ phase: "choosing", selectedAnswer: "c" })
  })
})
