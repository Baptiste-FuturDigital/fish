import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createDatabase, type GameDatabase } from "./db.js"
import { GameError, GameService } from "./game-service.js"

describe("GameService", () => {
  let database: GameDatabase
  let service: GameService

  beforeEach(() => {
    database = createDatabase(":memory:")
    service = new GameService(database)
  })

  afterEach(() => database.close())

  it("creates a lobby with a host and a short join code", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")

    expect(created.game.status).toBe("lobby")
    expect(created.game.code).toMatch(/^[A-Z2-9]{4}$/)
    expect(created.game.players).toEqual([
      expect.objectContaining({ name: "Baptiste", isHost: true }),
    ])
    expect(created.session.hostToken).toHaveLength(48)
  })

  it("adds a guest to the same lobby", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const joined = service.joinGame(created.game.code, "Léa")

    expect(joined.game.players.map((player) => player.name)).toEqual([
      "Baptiste",
      "Léa",
    ])
    expect(joined.session.hostToken).toBeUndefined()
    expect(joined.session.playerToken).toHaveLength(48)
  })

  it("rejects a duplicate player name regardless of casing", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")

    expect(() => service.joinGame(created.game.code, "baptiste")).toThrowError(
      new GameError("Ce pseudo nage déjà dans ce banc.", 409),
    )
  })

  it("runs multiple seeded rounds and finishes the game", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    service.joinGame(created.game.code, "Léa")

    const started = service.startGame(
      created.game.code,
      created.session.hostToken!,
    )
    expect(started.status).toBe("running")
    expect(started.currentRound).toBe(1)
    expect(started.currentPrompt?.title).toBeTruthy()
    expect(started.currentPrompt?.players.length).toBeGreaterThan(0)

    const advanced = service.nextRound(
      created.game.code,
      created.session.hostToken!,
    )
    expect(advanced.currentRound).toBe(2)
    expect(advanced.currentPrompt?.id).not.toBe(started.currentPrompt?.id)

    const finished = service.finishGame(
      created.game.code,
      created.session.hostToken!,
    )
    expect(finished.status).toBe("finished")
    expect(finished.currentPrompt).toBeNull()
  })

  it("rejects host actions with an invalid capability token", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    service.joinGame(created.game.code, "Léa")

    expect(() => service.startGame(created.game.code, "intrus")).toThrowError(
      new GameError("Seul le capitaine peut toucher à ça.", 403),
    )
  })
})
