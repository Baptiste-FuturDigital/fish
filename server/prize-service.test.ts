import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createDatabase, type GameDatabase } from "./db.js"
import { GameService } from "./game-service.js"
import {
  PrizeEmailDeliveryError,
  type PrizeEmail,
  type PrizeEmailSender,
  type PrizeType,
} from "./prize-email.js"
import { PrizeClaimError, PrizeService } from "./prize-service.js"

interface Competitor {
  id: string
  token: string
  name: string
  teamId: string
}

describe("PrizeService", () => {
  let database: GameDatabase
  let gameService: GameService

  beforeEach(() => {
    database = createDatabase(":memory:")
    gameService = new GameService(database)
  })

  afterEach(() => database.close())

  function finishedGame(
    entries: Array<{ name: string; score: number }> = [
      { name: "Alain", score: 100 },
      { name: "Mila", score: 50 },
      { name: "Nino", score: 20 },
      { name: "Zoé", score: 0 },
    ],
  ) {
    const created = gameService.createGame("Prix de Poséithon", "Baptiste")
    const competitors = entries.map(({ name }) => {
      const joined = gameService.joinGame(created.game.code, name)
      gameService.claimTotem(
        created.game.code,
        joined.session.playerId,
        joined.session.playerToken,
      )
      return {
        id: joined.session.playerId,
        token: joined.session.playerToken,
        name,
        teamId: "",
      }
    })

    const projected = gameService.getGame(created.game.code)
    for (const competitor of competitors) {
      competitor.teamId = projected.players.find((player) => player.id === competitor.id)?.teamId ?? ""
    }
    for (const entry of entries) {
      database.prepare("UPDATE players SET score = ? WHERE game_id = ? AND name = ?")
        .run(entry.score, created.game.id, entry.name)
    }
    database.prepare("UPDATE game_teams SET score = 0 WHERE game_id = ?").run(created.game.id)
    database.prepare("UPDATE game_teams SET score = 100 WHERE game_id = ? AND team_id = ?")
      .run(created.game.id, competitors[0].teamId)
    database.prepare("UPDATE games SET status = 'finished', phase = 'finished' WHERE id = ?")
      .run(created.game.id)

    return { code: created.game.code, gameId: created.game.id, competitors }
  }

  function harness(sendImplementation?: PrizeEmailSender["send"]) {
    const send = vi.fn<PrizeEmailSender["send"]>(sendImplementation ?? (async () => ({ id: "email-1" })))
    const sender: PrizeEmailSender = { send }
    const buildEmail = vi.fn(async (prizeType: PrizeType, to: string): Promise<PrizeEmail> => ({
      to,
      subject: prizeType,
      text: prizeType,
      html: `<p>${prizeType}</p>`,
      attachments: [],
    }))
    return {
      service: new PrizeService(database, sender, buildEmail),
      send,
      buildEmail,
    }
  }

  function competitorByName(competitors: Competitor[], name: string): Competitor {
    const competitor = competitors.find((candidate) => candidate.name === name)
    if (!competitor) throw new Error(`Concurrent introuvable: ${name}`)
    return competitor
  }

  it("authenticates the player with the SHA-256 session token", async () => {
    const { code, competitors } = finishedGame()
    const alain = competitorByName(competitors, "Alain")
    const { service, send } = harness()

    await expect(service.claim(code, "best-player", alain.id, "intrus", "a@example.com"))
      .rejects.toMatchObject({ statusCode: 403 })
    expect(send).not.toHaveBeenCalled()
  })

  it("refuses every claim until the tournament is finished", async () => {
    const { code, competitors } = finishedGame()
    database.prepare("UPDATE games SET status = 'running', phase = 'leaderboard' WHERE code = ?").run(code)
    const alain = competitorByName(competitors, "Alain")
    const { service, send } = harness()

    await expect(service.claim(code, "best-player", alain.id, alain.token, "a@example.com"))
      .rejects.toMatchObject({ statusCode: 409 })
    expect(send).not.toHaveBeenCalled()
  })

  it("rejects a player who did not earn the requested prize", async () => {
    const { code, competitors } = finishedGame()
    const mila = competitorByName(competitors, "Mila")
    const { service, send } = harness()

    await expect(service.claim(code, "best-player", mila.id, mila.token, "mila@example.com"))
      .rejects.toMatchObject({ statusCode: 403 })
    await expect(service.claim(code, "worst-player", mila.id, mila.token, "mila@example.com"))
      .rejects.toMatchObject({ statusCode: 403 })
    await expect(service.claim(code, "winning-team", mila.id, mila.token, "mila@example.com"))
      .rejects.toMatchObject({ statusCode: 403 })
    expect(send).not.toHaveBeenCalled()
  })

  it("breaks player and team score ties by French name ordering", async () => {
    const { code, gameId, competitors } = finishedGame([
      { name: "Zoé", score: 100 },
      { name: "Alain", score: 100 },
      { name: "Béa", score: 0 },
      { name: "Chloé", score: 0 },
    ])
    const alain = competitorByName(competitors, "Alain")
    const zoe = competitorByName(competitors, "Zoé")
    const bea = competitorByName(competitors, "Béa")
    const chloe = competitorByName(competitors, "Chloé")
    database.prepare("UPDATE game_teams SET score = 10, name = 'Banc Zèbre' WHERE game_id = ? AND team_id = ?")
      .run(gameId, zoe.teamId)
    database.prepare("UPDATE game_teams SET score = 10, name = 'Banc Alpha' WHERE game_id = ? AND team_id = ?")
      .run(gameId, alain.teamId)
    const { service } = harness()

    await expect(service.claim(code, "best-player", alain.id, alain.token, "alain@example.com"))
      .resolves.toMatchObject({ prizeType: "best-player", status: "sent" })
    await expect(service.claim(code, "best-player", zoe.id, zoe.token, "zoe@example.com"))
      .rejects.toMatchObject({ statusCode: 403 })
    await expect(service.claim(code, "worst-player", chloe.id, chloe.token, "chloe@example.com"))
      .resolves.toMatchObject({ prizeType: "worst-player", status: "sent" })
    await expect(service.claim(code, "worst-player", bea.id, bea.token, "bea@example.com"))
      .rejects.toMatchObject({ statusCode: 403 })
    await expect(service.claim(code, "winning-team", alain.id, alain.token, "team@example.com"))
      .resolves.toMatchObject({ prizeType: "winning-team", status: "sent" })
    await expect(service.claim(code, "winning-team", zoe.id, zoe.token, "zoe-team@example.com"))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it("delivers all three prize types to their server-computed recipients", async () => {
    const { code, competitors } = finishedGame()
    const alain = competitorByName(competitors, "Alain")
    const zoe = competitorByName(competitors, "Zoé")
    const { service, buildEmail, send } = harness()

    await expect(service.claim(code, "best-player", alain.id, alain.token, "best@example.com"))
      .resolves.toEqual({ prizeType: "best-player", status: "sent", alreadySent: false })
    await expect(service.claim(code, "worst-player", zoe.id, zoe.token, "worst@example.com"))
      .resolves.toEqual({ prizeType: "worst-player", status: "sent", alreadySent: false })
    await expect(service.claim(code, "winning-team", alain.id, alain.token, "team@example.com"))
      .resolves.toEqual({ prizeType: "winning-team", status: "sent", alreadySent: false })

    expect(buildEmail.mock.calls.map(([type, email]) => [type, email])).toEqual([
      ["best-player", "best@example.com"],
      ["worst-player", "worst@example.com"],
      ["winning-team", "team@example.com"],
    ])
    expect(send).toHaveBeenCalledTimes(3)
  })

  it("returns an already sent claim without contacting the provider again", async () => {
    const { code, gameId, competitors } = finishedGame()
    const alain = competitorByName(competitors, "Alain")
    const { service, buildEmail, send } = harness()

    await expect(service.claim(code, "best-player", alain.id, alain.token, "first@example.com"))
      .resolves.toEqual({ prizeType: "best-player", status: "sent", alreadySent: false })
    await expect(service.claim(code, "best-player", alain.id, alain.token, "second@example.com"))
      .resolves.toEqual({ prizeType: "best-player", status: "sent", alreadySent: true })

    expect(buildEmail).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledTimes(1)
    expect(database.prepare(
      "SELECT email, status, provider_id FROM prize_claims WHERE game_id = ? AND player_id = ?",
    ).get(gameId, alain.id)).toEqual({
      email: "first@example.com",
      status: "sent",
      provider_id: "email-1",
    })
  })

  it("marks provider failures and retries them with the latest address", async () => {
    const { code, gameId, competitors } = finishedGame()
    const alain = competitorByName(competitors, "Alain")
    let attempt = 0
    const { service, send } = harness(async () => {
      attempt += 1
      if (attempt === 1) throw new PrizeEmailDeliveryError()
      return { id: "email-retried" }
    })

    await expect(service.claim(code, "best-player", alain.id, alain.token, "fail@example.com"))
      .rejects.toBeInstanceOf(PrizeClaimError)
    expect(database.prepare(
      "SELECT email, status, provider_id, error_message FROM prize_claims WHERE game_id = ? AND player_id = ?",
    ).get(gameId, alain.id)).toEqual({
      email: "fail@example.com",
      status: "failed",
      provider_id: null,
      error_message: "PrizeEmailDeliveryError: La récompense n’a pas pu être envoyée.",
    })

    await expect(service.claim(code, "best-player", alain.id, alain.token, "retry@example.com"))
      .resolves.toEqual({ prizeType: "best-player", status: "sent", alreadySent: false })
    expect(send).toHaveBeenCalledTimes(2)
    expect(database.prepare(
      "SELECT email, status, provider_id, error_message FROM prize_claims WHERE game_id = ? AND player_id = ?",
    ).get(gameId, alain.id)).toEqual({
      email: "retry@example.com",
      status: "sent",
      provider_id: "email-retried",
      error_message: null,
    })
  })
})
