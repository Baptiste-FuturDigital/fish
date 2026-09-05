import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"

import { createApp } from "./app.js"
import { createDatabase, type GameDatabase } from "./db.js"
import { GameService } from "./game-service.js"
import type { PrizeEmail, PrizeEmailSender } from "./prize-email.js"
import { PrizeService } from "./prize-service.js"

describe("prize claim API", () => {
  let database: GameDatabase
  let gameService: GameService
  let sender: PrizeEmailSender
  let send: ReturnType<typeof vi.fn<PrizeEmailSender["send"]>>
  let code: string
  let playerId: string
  let playerToken: string

  beforeEach(() => {
    database = createDatabase(":memory:")
    gameService = new GameService(database)
    const created = gameService.createGame("Aquarium", "Poséithon")
    const joined = gameService.joinGame(created.game.code, "Nemo")
    gameService.claimTotem(created.game.code, joined.session.playerId, joined.session.playerToken)
    database.prepare("UPDATE games SET status = 'finished' WHERE code = ?").run(created.game.code)
    code = created.game.code
    playerId = joined.session.playerId
    playerToken = joined.session.playerToken
    send = vi.fn<PrizeEmailSender["send"]>(async () => ({ id: "resend-1" }))
    sender = { send }
  })

  afterEach(() => database.close())

  function app() {
    const prizeService = new PrizeService(
      database,
      sender,
      async (prizeType, to): Promise<PrizeEmail> => ({
        to,
        subject: prizeType,
        text: "prix",
        html: "<p>prix</p>",
        attachments: [],
      }),
    )
    return createApp(gameService, undefined, prizeService)
  }

  it("sends an eligible prize through the authenticated player endpoint", async () => {
    const response = await request(app())
      .post(`/api/games/${code}/prizes/best-player/claim`)
      .send({ playerId, playerToken, email: "nemo@example.com" })
      .expect(200)

    expect(response.body).toEqual({
      prizeType: "best-player",
      status: "sent",
      alreadySent: false,
    })
    expect(send).toHaveBeenCalledOnce()
  })

  it("rejects malformed emails before invoking the delivery service", async () => {
    const response = await request(app())
      .post(`/api/games/${code}/prizes/best-player/claim`)
      .send({ playerId, playerToken, email: "nemo@abysses" })
      .expect(400)

    expect(response.body.error).toBe("Requête invalide.")
    expect(send).not.toHaveBeenCalled()
  })

  it("rejects unknown prize types", async () => {
    await request(app())
      .post(`/api/games/${code}/prizes/tresor-pirate/claim`)
      .send({ playerId, playerToken, email: "nemo@example.com" })
      .expect(400)

    expect(send).not.toHaveBeenCalled()
  })
})

describe("private prize assets", () => {
  it("never lets the SPA fallback serve prize paths", async () => {
    const staticDir = mkdtempSync(path.join(tmpdir(), "fish-static-"))
    writeFileSync(path.join(staticDir, "index.html"), "<h1>Fish Tournament</h1>")
    const database = createDatabase(":memory:")
    try {
      const app = createApp(new GameService(database), staticDir)
      const oldPublicPath = await request(app).get("/prize/best-player.jpeg").expect(404)
      const privatePath = await request(app).get("/private/prizes/best-player.jpeg").expect(404)

      expect(oldPublicPath.text).not.toContain("Fish Tournament")
      expect(privatePath.text).not.toContain("Fish Tournament")
    } finally {
      database.close()
      rmSync(staticDir, { recursive: true, force: true })
    }
  })
})
