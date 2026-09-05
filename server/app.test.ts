import { afterEach, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"

import { createApp } from "./app.js"
import { createDatabase, type GameDatabase } from "./db.js"
import { GameService } from "./game-service.js"

describe("game API", () => {
  let database: GameDatabase
  let service: GameService
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    database = createDatabase(":memory:")
    service = new GameService(database)
    app = createApp(service)
  })

  afterEach(() => database.close())

  it("supports the complete multiplayer lifecycle", async () => {
    const created = await request(app)
      .post("/api/games")
      .send({ name: "Le grand aquarium", hostName: "Baptiste" })
      .expect(201)

    const { code } = created.body.game
    const hostToken = created.body.session.hostToken
    expect(created.body.game.players).toEqual([])

    const firstJoined = await request(app)
      .post(`/api/games/${code}/join`)
      .send({ identityId: "anonymous", nickname: "Léa" })
      .expect(201)
    const secondJoined = await request(app)
      .post(`/api/games/${code}/join`)
      .send({ identityId: "anonymous", nickname: "Sam" })
      .expect(201)

    await request(app)
      .post(`/api/games/${code}/totem`)
      .send({
        playerId: created.body.session.playerId,
        playerToken: created.body.session.playerToken,
      })
      .expect(409)
    for (const joined of [firstJoined, secondJoined]) {
      await request(app)
        .post(`/api/games/${code}/totem`)
        .send({
          playerId: joined.body.session.playerId,
          playerToken: joined.body.session.playerToken,
        })
        .expect(200)
    }

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

  it("exposes the host-only lobby player exclusion endpoint", async () => {
    const created = await request(app)
      .post("/api/games")
      .send({ name: "Le grand aquarium", hostName: "Baptiste" })
      .expect(201)
    const joined = await request(app)
      .post(`/api/games/${created.body.game.code}/join`)
      .send({ identityId: "anonymous", nickname: "Léa" })
      .expect(201)

    const kicked = await request(app)
      .post(`/api/games/${created.body.game.code}/players/${joined.body.session.playerId}/kick`)
      .send({ hostToken: created.body.session.hostToken })
      .expect(200)

    expect(kicked.body.players).toEqual([])
  })

  it("serves the invitation picker and joins by selected identity", async () => {
    const created = await request(app)
      .post("/api/games")
      .send({ name: "Le grand aquarium", hostName: "Baptiste" })
      .expect(201)
    const code = created.body.game.code as string

    const before = await request(app).get(`/api/games/${code}/identities`).expect(200)
    expect(before.body.find((identity: { id: string }) => identity.id === "agathe"))
      .toEqual(expect.objectContaining({ displayName: "Agathe", available: true }))
    expect(before.body.some((identity: { id: string }) => identity.id === "baptiste")).toBe(false)

    const joined = await request(app)
      .post(`/api/games/${code}/join`)
      .send({ identityId: "agathe" })
      .expect(201)
    expect(joined.body.game.players[0]).toEqual(expect.objectContaining({
      name: "Agathe",
      identityId: "agathe",
      imageUrl: "/players/agathe-poisson-globe.png",
    }))

    const after = await request(app).get(`/api/games/${code}/identities`).expect(200)
    expect(after.body.find((identity: { id: string }) => identity.id === "agathe").available).toBe(false)
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

  it("keeps the prank target private while returning its special totem", async () => {
    const created = await request(app)
      .post("/api/games")
      .send({ name: "Le grand aquarium", hostName: "Baptiste", prankPlayerName: "Axel" })
      .expect(201)
    expect(JSON.stringify(created.body.game)).not.toContain("Axel")

    const joined = await request(app)
      .post(`/api/games/${created.body.game.code}/join`)
      .send({ identityId: "anonymous", nickname: "axel" })
      .expect(201)
    const claimed = await request(app)
      .post(`/api/games/${created.body.game.code}/totem`)
      .send(joined.body.session)
      .expect(200)

    expect(claimed.body.players[0].totem.imageUrl)
      .toBe("/totems/prank-axolotl-glamour.webp")
  })

  it("supports team naming, answers and host-paced tournament phases", async () => {
    const created = await request(app)
      .post("/api/games")
      .send({ name: "Le grand aquarium", hostName: "Baptiste" })
      .expect(201)
    const firstJoined = await request(app)
      .post(`/api/games/${created.body.game.code}/join`)
      .send({ identityId: "anonymous", nickname: "Léa" })
      .expect(201)
    const secondJoined = await request(app)
      .post(`/api/games/${created.body.game.code}/join`)
      .send({ identityId: "anonymous", nickname: "Sam" })
      .expect(201)
    const code = created.body.game.code
    const hostSession = created.body.session
    for (const session of [firstJoined.body.session, secondJoined.body.session]) {
      await request(app).post(`/api/games/${code}/totem`).send({
        playerId: session.playerId,
        playerToken: session.playerToken,
      }).expect(200)
    }
    const lobby = await request(app).get(`/api/games/${code}`).expect(200)
    const firstTeamId = lobby.body.players.find(
      (player: { id: string }) => player.id === firstJoined.body.session.playerId,
    ).teamId

    const renamed = await request(app)
      .post(`/api/games/${code}/teams/${firstTeamId}/name`)
      .send({
        name: "Les Moules Costaudes",
        playerId: firstJoined.body.session.playerId,
        playerToken: firstJoined.body.session.playerToken,
      })
      .expect(200)
    expect(renamed.body.teams.find((team: { id: string }) => team.id === firstTeamId).name)
      .toBe("Les Moules Costaudes")

    await request(app).post(`/api/games/${code}/start`)
      .send({ hostToken: hostSession.hostToken }).expect(200)
    const answering = await request(app).post(`/api/games/${code}/advance`)
      .send({ hostToken: hostSession.hostToken }).expect(200)
    expect(answering.body.tournament.phase).toBe("answering")

    const answered = await request(app).post(`/api/games/${code}/answer`).send({
      playerId: firstJoined.body.session.playerId,
      playerToken: firstJoined.body.session.playerToken,
      answer: "0.0125",
      locked: true,
    }).expect(200)
    expect(answered.body.tournament.answers).toContainEqual({
      playerId: firstJoined.body.session.playerId,
      playerName: "Léa",
      teamId: firstTeamId,
      answer: null,
      locked: true,
    })

    const reveal = await request(app).post(`/api/games/${code}/advance`)
      .send({ hostToken: hostSession.hostToken }).expect(200)
    expect(reveal.body.tournament.phase).toBe("reveal")
    expect(reveal.body.tournament.round.correctAnswer).toBe(0.0125)
  })

  it("creates a ready-to-play demo with simulated answers from all four teams", async () => {
    const demo = await request(app)
      .post("/api/demo")
      .expect(201)

    expect(demo.body.game.status).toBe("running")
    expect(demo.body.game.tournament.phase).toBe("challenge-intro")
    expect(demo.body.game.players).toHaveLength(8)
    expect(demo.body.game.players.map((player: { name: string }) => player.name)).not.toContain("Poséithon")
    expect(demo.body.game.teams.map((team: { memberIds: string[] }) => team.memberIds.length).sort())
      .toEqual([2, 2, 2, 2])
    expect(demo.body.session.hostToken).toBeTypeOf("string")
    expect(demo.body.demoPlayerSession).toEqual(expect.objectContaining({
      gameCode: demo.body.game.code,
      playerId: expect.any(String),
      playerToken: expect.any(String),
    }))
    expect(demo.body.demoPlayerSession.hostToken).toBeUndefined()
    expect(demo.body.game.players.some(
      (player: { id: string }) => player.id === demo.body.demoPlayerSession.playerId,
    )).toBe(true)

    const code = demo.body.game.code
    const hostToken = demo.body.session.hostToken
    await request(app).post(`/api/games/${code}/advance`).send({ hostToken }).expect(200)
    const reveal = await request(app).post(`/api/games/${code}/advance`).send({ hostToken }).expect(200)

    expect(reveal.body.tournament.phase).toBe("reveal")
    expect(reveal.body.tournament.answers).toHaveLength(8)
    expect(reveal.body.tournament.answers.every((answer: { locked: boolean }) => answer.locked)).toBe(true)
    expect(reveal.body.tournament.results).toHaveLength(8)
    expect(reveal.body.tournament.teamResults).toHaveLength(4)
  })

  it("exposes a host-only demo shortcut to the next challenge", async () => {
    const demo = await request(app).post("/api/demo").expect(201)

    expect(demo.body.game.isDemo).toBe(true)

    const skipped = await request(app)
      .post(`/api/games/${demo.body.game.code}/skip-challenge`)
      .send({ hostToken: demo.body.session.hostToken })
      .expect(200)

    expect(skipped.body.tournament).toEqual(expect.objectContaining({
      challengeIndex: 1,
      roundIndex: 0,
      phase: "challenge-intro",
    }))
  })

  it("exposes the host-only intermission bonus endpoint", async () => {
    const demo = await request(app).post("/api/demo").expect(201)
    const { code } = demo.body.game
    const hostToken = demo.body.session.hostToken as string
    let game = demo.body.game
    for (let step = 0; step < 20 && game.tournament.phase !== "leaderboard"; step += 1) {
      game = service.advanceTournament(code, hostToken)
    }

    await request(app)
      .post(`/api/games/${code}/bonus`)
      .send({ hostToken: "intrus" })
      .expect(403)

    const rewarded = await request(app)
      .post(`/api/games/${code}/bonus`)
      .send({ hostToken })
      .expect(200)

    expect(rewarded.body.tournament.bonusAvailable).toBe(false)
    expect(rewarded.body.tournament.bonus).toEqual(expect.objectContaining({ points: 2 }))

    const duplicate = await request(app)
      .post(`/api/games/${code}/bonus`)
      .send({ hostToken })
      .expect(409)
    expect(duplicate.body.error).toBe("La Marée de Poséithon a déjà frappé pendant cette escale.")
  })

  it("exposes the authenticated team 50/50 endpoint", async () => {
    const created = await request(app).post("/api/games")
      .send({ name: "Le grand aquarium", hostName: "Baptiste" }).expect(201)
    const first = await request(app).post(`/api/games/${created.body.game.code}/join`)
      .send({ identityId: "anonymous", nickname: "Léa" }).expect(201)
    const second = await request(app).post(`/api/games/${created.body.game.code}/join`)
      .send({ identityId: "anonymous", nickname: "Sam" }).expect(201)
    for (const joined of [first, second]) {
      await request(app).post(`/api/games/${created.body.game.code}/totem`)
        .send(joined.body.session).expect(200)
    }
    await request(app).post(`/api/games/${created.body.game.code}/start`)
      .send({ hostToken: created.body.session.hostToken }).expect(200)
    database.prepare(
      `UPDATE games SET challenge_index = 2, challenge_round = 0, current_round = 0,
       phase = 'answering', phase_ends_at = ? WHERE code = ?`,
    ).run(new Date(Date.now() + 30_000).toISOString(), created.body.game.code)

    const used = await request(app)
      .post(`/api/games/${created.body.game.code}/jokers/fifty-fifty`)
      .send({
        playerId: first.body.session.playerId,
        playerToken: first.body.session.playerToken,
      })
      .expect(200)

    expect(used.body.tournament.fiftyFiftyJokers).toEqual([
      expect.objectContaining({ keptChoiceIds: expect.any(Array) }),
    ])
    await request(app)
      .post(`/api/games/${created.body.game.code}/jokers/fifty-fifty`)
      .send({ playerId: first.body.session.playerId, playerToken: "intrus" })
      .expect(403)
  })

  it("exposes the player buzzer and host validation endpoints", async () => {
    const created = await request(app).post("/api/games")
      .send({ name: "Le grand aquarium", hostName: "Baptiste" }).expect(201)
    const joined = await request(app).post(`/api/games/${created.body.game.code}/join`)
      .send({ identityId: "anonymous", nickname: "Léa" }).expect(201)
    const second = await request(app).post(`/api/games/${created.body.game.code}/join`)
      .send({ identityId: "anonymous", nickname: "Sam" }).expect(201)
    await request(app).post(`/api/games/${created.body.game.code}/totem`)
      .send(joined.body.session).expect(200)
    await request(app).post(`/api/games/${created.body.game.code}/totem`)
      .send(second.body.session).expect(200)
    await request(app).post(`/api/games/${created.body.game.code}/start`)
      .send({ hostToken: created.body.session.hostToken }).expect(200)
    database.prepare(
      `UPDATE games SET challenge_index = 1, challenge_round = 0, current_round = 0,
       phase = 'answering', phase_ends_at = ? WHERE code = ?`,
    ).run(new Date(Date.now() + 40_000).toISOString(), created.body.game.code)

    const buzzed = await request(app)
      .post(`/api/games/${created.body.game.code}/buzz`)
      .send(joined.body.session)
      .expect(200)
    expect(buzzed.body.tournament.buzz.playerName).toBe("Léa")
    expect(buzzed.body.tournament.endsAt).toBeNull()

    const revealed = await request(app)
      .post(`/api/games/${created.body.game.code}/buzz/resolve`)
      .send({ hostToken: created.body.session.hostToken, correct: true })
      .expect(200)
    expect(revealed.body.tournament.phase).toBe("reveal")
    expect(revealed.body.tournament.results[0]).toEqual(expect.objectContaining({
      playerName: "Léa",
      points: 4,
    }))
  })
})
