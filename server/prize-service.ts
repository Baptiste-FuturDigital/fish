import { createHash, randomUUID } from "node:crypto"

import type { GameDatabase } from "./db.js"
import {
  PrizeEmailUnavailableError,
  buildPrizeEmail,
  type PrizeEmail,
  type PrizeEmailSender,
  type PrizeType,
} from "./prize-email.js"
import { findTotem, teamIds } from "./totems.js"
import type { PrizeClaimResult } from "../shared/game.js"

export class PrizeClaimError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "PrizeClaimError"
  }
}

interface PrizeGameRow {
  id: string
  status: string
}

interface PrizePlayerRow {
  id: string
  name: string
  score: number
  totem_id: number | null
  token_hash: string
  is_host: number
}

interface PrizeTeamRow {
  team_id: string
  name: string
  score: number
}

interface PrizeClaimRow {
  status: "pending" | "sent" | "failed"
}

type PrizeEmailBuilder = (prizeType: PrizeType, to: string) => Promise<PrizeEmail>

const prizeTypes = new Set<PrizeType>(["best-player", "worst-player", "winning-team"])
const frenchNames = new Intl.Collator("fr", { sensitivity: "base", usage: "sort" })

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function compareNames(left: { id: string; name: string }, right: { id: string; name: string }): number {
  return frenchNames.compare(left.name, right.name) || left.id.localeCompare(right.id)
}

export class PrizeService {
  constructor(
    private readonly database: GameDatabase,
    private readonly sender: PrizeEmailSender,
    private readonly buildEmail: PrizeEmailBuilder = buildPrizeEmail,
  ) {}

  async claim(
    codeInput: string,
    prizeType: PrizeType,
    playerId: string,
    playerToken: string,
    emailInput: string,
  ): Promise<PrizeClaimResult> {
    if (!prizeTypes.has(prizeType)) {
      throw new PrizeClaimError("Cette récompense n’existe pas.", 400)
    }

    const code = codeInput.trim().toUpperCase()
    const game = this.database.prepare("SELECT id, status FROM games WHERE code = ?")
      .get(code) as PrizeGameRow | undefined
    if (!game) throw new PrizeClaimError("Aquarium introuvable. Vérifie le code.", 404)

    const player = this.database.prepare(
      `SELECT id, name, score, totem_id, token_hash, is_host
       FROM players WHERE game_id = ? AND id = ?`,
    ).get(game.id, playerId) as PrizePlayerRow | undefined
    if (
      !player ||
      player.is_host ||
      !playerToken ||
      hashToken(playerToken) !== player.token_hash
    ) {
      throw new PrizeClaimError("Session de poisson invalide.", 403)
    }
    if (game.status !== "finished") {
      throw new PrizeClaimError("Les récompenses attendent la fin du tournoi.", 409)
    }

    if (!this.isEligible(game.id, player, prizeType)) {
      throw new PrizeClaimError("Cette récompense n’est pas destinée à ce poisson.", 403)
    }

    const existing = this.database.prepare(
      `SELECT status FROM prize_claims
       WHERE game_id = ? AND player_id = ? AND prize_type = ?`,
    ).get(game.id, player.id, prizeType) as PrizeClaimRow | undefined
    if (existing?.status === "sent") {
      return { prizeType, status: "sent", alreadySent: true }
    }
    if (existing?.status === "pending") {
      throw new PrizeClaimError("Cette récompense est déjà en cours d’envoi.", 409)
    }

    const email = emailInput.trim()
    const now = new Date().toISOString()
    if (existing?.status === "failed") {
      this.database.prepare(
        `UPDATE prize_claims
         SET email = ?, status = 'pending', provider_id = NULL, error_message = NULL,
             updated_at = ?, sent_at = NULL
         WHERE game_id = ? AND player_id = ? AND prize_type = ?`,
      ).run(email, now, game.id, player.id, prizeType)
    } else {
      this.database.prepare(
        `INSERT INTO prize_claims
          (id, game_id, player_id, prize_type, email, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
      ).run(randomUUID(), game.id, player.id, prizeType, email, now, now)
    }

    try {
      const message = await this.buildEmail(prizeType, email)
      const delivery = await this.sender.send(message)
      const sentAt = new Date().toISOString()
      this.database.prepare(
        `UPDATE prize_claims
         SET status = 'sent', provider_id = ?, error_message = NULL,
             updated_at = ?, sent_at = ?
         WHERE game_id = ? AND player_id = ? AND prize_type = ?`,
      ).run(delivery.id, sentAt, sentAt, game.id, player.id, prizeType)
      return { prizeType, status: "sent", alreadySent: false }
    } catch (error) {
      const failedAt = new Date().toISOString()
      this.database.prepare(
        `UPDATE prize_claims
         SET status = 'failed', provider_id = NULL, error_message = ?, updated_at = ?
         WHERE game_id = ? AND player_id = ? AND prize_type = ?`,
      ).run(String(error).slice(0, 1_000), failedAt, game.id, player.id, prizeType)
      if (error instanceof PrizeEmailUnavailableError) throw error
      throw new PrizeClaimError("La récompense n’a pas pu être envoyée.", 502, { cause: error })
    }
  }

  private isEligible(gameId: string, player: PrizePlayerRow, prizeType: PrizeType): boolean {
    const players = this.database.prepare(
      `SELECT id, name, score, totem_id, token_hash, is_host
       FROM players WHERE game_id = ? AND is_host = 0`,
    ).all(gameId) as PrizePlayerRow[]
    const ranking = players.sort((left, right) =>
      right.score - left.score || compareNames(left, right),
    )
    if (ranking.length === 0) return false
    if (prizeType === "best-player") return ranking[0].id === player.id
    if (prizeType === "worst-player") return ranking[ranking.length - 1].id === player.id

    const teams = this.database.prepare(
      "SELECT team_id, name, score FROM game_teams WHERE game_id = ?",
    ).all(gameId) as PrizeTeamRow[]
    const winningTeam = teams.sort((left, right) =>
      right.score - left.score || compareNames(
        { id: left.team_id, name: left.name },
        { id: right.team_id, name: right.name },
      ),
    )[0]
    const totem = findTotem(player.totem_id)
    return Boolean(winningTeam && totem && teamIds[totem.category] === winningTeam.team_id)
  }
}
