import { afterEach, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"

import { createApp } from "./app.js"
import { createDatabase, type GameDatabase } from "./db.js"
import { GameService } from "./game-service.js"

describe("game API", () => {
  let database: GameDatabase
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    database = createDatabase(":memory:")
    app = createApp(new GameService(database))
  })

  afterEach(() => database.close())

  it("supports the complete multiplayer lifecycle", async () => {
    const created = await request(app)
      .post("/api/games")
      .send({ name: "Le grand aquarium", hostName: "Baptiste" })
      .expect(201)

    const { code } = created.body.game
    const hostToken = created.body.session.hostToken

    const joined = await request(app)
      .post(`/api/games/${code}/join`)
      .send({ name: "Léa" })
      .expect(201)

    const hostClaim = await request(app)
      .post(`/api/games/${code}/totem`)
      .send({
        playerId: created.body.session.playerId,
        playerToken: created.body.session.playerToken,
      })
      .expect(200)
    const repeatedHostClaim = await request(app)
      .post(`/api/games/${code}/totem`)
      .send({
        playerId: created.body.session.playerId,
        playerToken: created.body.session.playerToken,
      })
      .expect(200)
    await request(app)
      .post(`/api/games/${code}/totem`)
      .send({
        playerId: joined.body.session.playerId,
        playerToken: joined.body.session.playerToken,
      })
      .expect(200)

    const hostTotem = hostClaim.body.players.find(
      (player: { id: string }) => player.id === created.body.session.playerId,
    ).totem
    const repeatedTotem = repeatedHostClaim.body.players.find(
      (player: { id: string }) => player.id === created.body.session.playerId,
    ).totem
    expect(repeatedTotem).toEqual(hostTotem)

    const started = await request(app)
      .post(`/api/games/${code}/start`)
      .send({ hostToken })
      .expect(200)

    expect(started.body.status).toBe("running")
    expect(started.body.players).toHaveLength(2)

    await request(app)
      .post(`/api/games/${code}/next`)
      .send({ hostToken })
      .expect(200)

    const finished = await request(app)
      .post(`/api/games/${code}/finish`)
      .send({ hostToken })
      .expect(200)

    expect(finished.body.status).toBe("finished")
  })

  it("returns actionable validation and authorization errors", async () => {
    const invalid = await request(app)
      .post("/api/games")
      .send({ name: "", hostName: "" })
      .expect(400)
    expect(invalid.body.error).toBe("Le nom de la partie est obligatoire.")

    const created = await request(app)
      .post("/api/games")
      .send({ name: "Le grand aquarium", hostName: "Baptiste" })
      .expect(201)

    const forbidden = await request(app)
      .post(`/api/games/${created.body.game.code}/start`)
      .send({ hostToken: "faux" })
      .expect(403)
    expect(forbidden.body.error).toBe("Seul le capitaine peut toucher à ça.")
  })

  it("supports team naming, answers and host-paced tournament phases", async () => {
    const created = await request(app)
      .post("/api/games")
      .send({ name: "Le grand aquarium", hostName: "Baptiste" })
      .expect(201)
    const joined = await request(app)
      .post(`/api/games/${created.body.game.code}/join`)
      .send({ name: "Léa" })
      .expect(201)
    const code = created.body.game.code
    const hostSession = created.body.session
    for (const session of [hostSession, joined.body.session]) {
      await request(app).post(`/api/games/${code}/totem`).send({
        playerId: session.playerId,
        playerToken: session.playerToken,
      }).expect(200)
    }
    const lobby = await request(app).get(`/api/games/${code}`).expect(200)
    const hostTeamId = lobby.body.players.find(
      (player: { id: string }) => player.id === hostSession.playerId,
    ).teamId

    const renamed = await request(app)
      .post(`/api/games/${code}/teams/${hostTeamId}/name`)
      .send({
        name: "Les Moules Costaudes",
        playerId: hostSession.playerId,
        playerToken: hostSession.playerToken,
      })
      .expect(200)
    expect(renamed.body.teams.find((team: { id: string }) => team.id === hostTeamId).name)
      .toBe("Les Moules Costaudes")

    await request(app).post(`/api/games/${code}/start`)
      .send({ hostToken: hostSession.hostToken }).expect(200)
    const answering = await request(app).post(`/api/games/${code}/advance`)
      .send({ hostToken: hostSession.hostToken }).expect(200)
    expect(answering.body.tournament.phase).toBe("answering")

    const answered = await request(app).post(`/api/games/${code}/answer`).send({
      playerId: hostSession.playerId,
      playerToken: hostSession.playerToken,
      answer: "0.09",
      locked: true,
    }).expect(200)
    expect(answered.body.tournament.answers).toContainEqual({
      teamId: hostTeamId,
      answer: null,
      locked: true,
    })

    const reveal = await request(app).post(`/api/games/${code}/advance`)
      .send({ hostToken: hostSession.hostToken }).expect(200)
    expect(reveal.body.tournament.phase).toBe("reveal")
    expect(reveal.body.tournament.round.correctAnswer).toBe(0.09)
  })

  it("creates a ready-to-play demo with simulated answers from all four teams", async () => {
    const demo = await request(app)
      .post("/api/demo")
      .expect(201)

    expect(demo.body.game.status).toBe("running")
    expect(demo.body.game.tournament.phase).toBe("challenge-intro")
    expect(demo.body.game.players).toHaveLength(8)
    expect(demo.body.game.teams.map((team: { memberIds: string[] }) => team.memberIds.length).sort())
      .toEqual([2, 2, 2, 2])
    expect(demo.body.session.hostToken).toBeTypeOf("string")

    const code = demo.body.game.code
    const hostToken = demo.body.session.hostToken
    await request(app).post(`/api/games/${code}/advance`).send({ hostToken }).expect(200)
    const reveal = await request(app).post(`/api/games/${code}/advance`).send({ hostToken }).expect(200)

    expect(reveal.body.tournament.phase).toBe("reveal")
    expect(reveal.body.tournament.answers).toHaveLength(4)
    expect(reveal.body.tournament.answers.every((answer: { locked: boolean }) => answer.locked)).toBe(true)
    expect(reveal.body.tournament.results).toHaveLength(4)
  })
})
