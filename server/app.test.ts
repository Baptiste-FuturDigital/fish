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

    await request(app)
      .post(`/api/games/${code}/join`)
      .send({ name: "Léa" })
      .expect(201)

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
})
