import request from "supertest"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createApp } from "./app.js"
import { createDatabase, type GameDatabase } from "./db.js"
import { GameService } from "./game-service.js"

describe("TV spectator API", () => {
  let database: GameDatabase
  let service: GameService

  beforeEach(() => {
    database = createDatabase(":memory:")
    service = new GameService(database)
  })

  afterEach(() => database.close())

  it("projects a cache-free show state without technical player identities", async () => {
    const created = service.createGame("Aquarium TV", "Poséithon")
    const lea = service.joinGame(created.game.code, "Léa")
    const sam = service.joinGame(created.game.code, "Sam")
    service.claimTotem(created.game.code, lea.session.playerId, lea.session.playerToken)
    service.claimTotem(created.game.code, sam.session.playerId, sam.session.playerToken)
    service.startGame(created.game.code, created.session.hostToken!)
    service.advanceTournament(created.game.code, created.session.hostToken!)
    service.submitPlayerAnswer(
      created.game.code,
      lea.session.playerId,
      lea.session.playerToken,
      "0.0125",
      true,
    )

    const response = await request(createApp(service))
      .get(`/api/games/${created.game.code}/tv`)
      .expect(200)

    expect(response.headers["cache-control"]).toBe("no-store")
    expect(response.body).toEqual(expect.objectContaining({
      code: created.game.code,
      name: "Aquarium TV",
      status: "running",
      teams: expect.any(Array),
      tournament: expect.objectContaining({
        phase: "answering",
        answerProgress: expect.arrayContaining([
          expect.objectContaining({ submittedCount: 1, lockedCount: 1 }),
        ]),
      }),
    }))
    expect(response.body).not.toHaveProperty("id")
    expect(response.body.players).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "Léa",
        score: 0,
        teamId: expect.any(String),
        imageUrl: "/players/anonyme-poisson-clown.png",
        animalName: "le poisson-clown",
      }),
    ]))
    expect(response.body.players.every((player: Record<string, unknown>) => {
      return !("id" in player) && !("identityId" in player) && !("totem" in player)
    })).toBe(true)
    expect(response.body.teams.every((team: Record<string, unknown>) => !("memberIds" in team))).toBe(true)
    expect(response.body.teams.reduce(
      (total: number, team: { memberCount: number }) => total + team.memberCount,
      0,
    )).toBe(2)

    const serialized = JSON.stringify(response.body)
    expect(serialized).not.toContain(lea.session.playerId)
    expect(serialized).not.toContain(sam.session.playerId)
    expect(serialized).not.toContain(lea.session.playerToken)
    expect(serialized).not.toContain(sam.session.playerToken)
    expect(response.body.tournament.round).not.toHaveProperty("correctAnswer")

    service.advanceTournament(created.game.code, created.session.hostToken!)
    const reveal = await request(createApp(service))
      .get(`/api/games/${created.game.code}/tv`)
      .expect(200)

    expect(reveal.body.tournament.phase).toBe("reveal")
    expect(reveal.body.tournament.results).toEqual(expect.arrayContaining([
      expect.objectContaining({
        playerName: "Léa",
        teamId: expect.any(String),
        points: expect.any(Number),
      }),
    ]))
    expect(reveal.body.tournament.results.every(
      (result: Record<string, unknown>) => !("playerId" in result),
    )).toBe(true)
  })

  it("normalizes the TV code and keeps the standard not-found contract", async () => {
    const created = service.createGame("Aquarium TV", "Poséithon")
    await request(createApp(service))
      .get(`/api/games/${created.game.code.toLowerCase()}/tv`)
      .expect(200)

    const missing = await request(createApp(service))
      .get("/api/games/NOPE/tv")
      .expect(404)

    expect(missing.body).toEqual({ error: "Aquarium introuvable. Vérifie le code." })
  })

  it("keeps game-master clues off the projected screen", async () => {
    const demo = service.createDemoGame()
    database.prepare(
      `UPDATE games
       SET challenge_index = 1, challenge_round = 0, current_round = 0,
           phase = 'answering', phase_ends_at = ?
       WHERE code = ?`,
    ).run(new Date(Date.now() + 30_000).toISOString(), demo.game.code)

    const response = await request(createApp(service))
      .get(`/api/games/${demo.game.code}/tv`)
      .expect(200)

    expect(response.body.tournament.round.kind).toBe("buzzer")
    expect(response.body.tournament.round).not.toHaveProperty("hostClues")
  })

  it("projects resumable sardine wheel state without the winner's technical id", async () => {
    const demo = service.createDemoGame()
    database.prepare(
      `UPDATE games SET challenge_round = 4, current_round = 4,
       phase = 'leaderboard', phase_ends_at = NULL WHERE id = ?`,
    ).run(demo.game.id)

    const available = await request(createApp(service))
      .get(`/api/games/${demo.game.code}/tv`)
      .expect(200)
    expect(available.body.tournament.sardineWheelAvailable).toBe(true)

    service.offerSardineWheel(demo.game.code, demo.session.hostToken!)

    const offered = await request(createApp(service))
      .get(`/api/games/${demo.game.code}/tv`)
      .expect(200)

    expect(offered.body.tournament.sardineWheel).toEqual(expect.objectContaining({
      winnerPlayerName: "Ariel",
      status: "offered",
      durationMs: 6000,
    }))
    expect(offered.body.tournament.sardineWheel).not.toHaveProperty("winnerPlayerId")
    expect(offered.body.tournament.sardineWheelAvailable).toBe(false)
    expect(JSON.stringify(offered.body)).not.toContain(demo.demoPlayerSession.playerId)

    service.spinSardineWheel(
      demo.game.code,
      demo.demoPlayerSession.playerId,
      demo.demoPlayerSession.playerToken,
    )
    database.prepare("UPDATE sardine_wheels SET started_at = ? WHERE game_id = ?")
      .run(new Date(Date.now() - 7000).toISOString(), demo.game.id)

    const won = await request(createApp(service))
      .get(`/api/games/${demo.game.code}/tv`)
      .expect(200)
    expect(won.body.tournament.sardineWheel).toEqual(expect.objectContaining({
      status: "won",
      completedAt: expect.any(String),
    }))
  })
})
