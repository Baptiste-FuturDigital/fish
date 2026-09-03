import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto"

import type { GameDatabase } from "./db.js"
import { prompts, type PromptDefinition } from "./content.js"
import type {
  GameStatus,
  GameView,
  PlayerSession,
  PlayerView,
  SessionResponse,
} from "../shared/game.js"

interface GameRow {
  id: string
  code: string
  name: string
  status: GameStatus
  current_round: number
  round_order: string
  host_token_hash: string
  created_at: string
}

interface PlayerRow {
  id: string
  name: string
  is_host: number
  score: number
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const ROUND_COUNT = 8

export class GameError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message)
    this.name = "GameError"
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function makeToken(): string {
  return randomBytes(24).toString("hex")
}

function cleanText(value: string, label: string, maxLength: number): string {
  const cleaned = value.trim().replace(/\s+/g, " ")
  if (!cleaned) throw new GameError(`${label} est obligatoire.`, 400)
  if (cleaned.length > maxLength) {
    throw new GameError(`${label} est trop long.`, 400)
  }
  return cleaned
}

function shuffledPromptIds(): string[] {
  const ids = prompts.map((prompt) => prompt.id)
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]]
  }
  return ids.slice(0, ROUND_COUNT)
}

export class GameService {
  constructor(private readonly database: GameDatabase) {}

  createGame(gameName: string, hostName: string): SessionResponse {
    const name = cleanText(gameName, "Le nom de la partie", 40)
    const playerName = cleanText(hostName, "Le pseudo", 24)
    const id = randomUUID()
    const code = this.makeUniqueCode()
    const hostToken = makeToken()
    const playerToken = makeToken()
    const playerId = randomUUID()
    const createdAt = new Date().toISOString()

    this.database.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO games
            (id, code, name, status, current_round, round_order, host_token_hash, created_at)
           VALUES (?, ?, ?, 'lobby', -1, ?, ?, ?)`,
        )
        .run(
          id,
          code,
          name,
          JSON.stringify(shuffledPromptIds()),
          hashToken(hostToken),
          createdAt,
        )
      this.database
        .prepare(
          `INSERT INTO players
            (id, game_id, name, is_host, score, token_hash, created_at)
           VALUES (?, ?, ?, 1, 0, ?, ?)`,
        )
        .run(playerId, id, playerName, hashToken(playerToken), createdAt)
    })()

    return {
      game: this.getGame(code),
      session: { gameCode: code, playerId, playerToken, hostToken },
    }
  }

  joinGame(codeInput: string, nameInput: string): SessionResponse {
    const code = codeInput.trim().toUpperCase()
    const name = cleanText(nameInput, "Le pseudo", 24)
    const game = this.getGameRow(code)
    if (game.status !== "lobby") {
      throw new GameError("Cette partie a déjà quitté le port.", 409)
    }

    const playerId = randomUUID()
    const playerToken = makeToken()
    try {
      this.database
        .prepare(
          `INSERT INTO players
            (id, game_id, name, is_host, score, token_hash, created_at)
           VALUES (?, ?, ?, 0, 0, ?, ?)`,
        )
        .run(
          playerId,
          game.id,
          name,
          hashToken(playerToken),
          new Date().toISOString(),
        )
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE")) {
        throw new GameError("Ce pseudo nage déjà dans ce banc.", 409)
      }
      throw error
    }

    const session: PlayerSession = {
      gameCode: code,
      playerId,
      playerToken,
    }
    return { game: this.getGame(code), session }
  }

  getGame(codeInput: string): GameView {
    const game = this.getGameRow(codeInput.trim().toUpperCase())
    const players = this.database
      .prepare(
        `SELECT id, name, is_host, score
         FROM players WHERE game_id = ? ORDER BY created_at, rowid`,
      )
      .all(game.id) as PlayerRow[]
    const playerViews: PlayerView[] = players.map((player) => ({
      id: player.id,
      name: player.name,
      isHost: Boolean(player.is_host),
      score: player.score,
    }))
    const roundIds = JSON.parse(game.round_order) as string[]
    const definition =
      game.status === "running" ? this.findPrompt(roundIds[game.current_round]) : null

    return {
      id: game.id,
      code: game.code,
      name: game.name,
      status: game.status,
      currentRound: game.status === "lobby" ? 0 : game.current_round + 1,
      totalRounds: roundIds.length,
      currentPrompt: definition
        ? {
            id: definition.id,
            kind: definition.kind,
            kicker: definition.kicker,
            title: definition.title,
            instruction: definition.instruction,
            emoji: definition.emoji,
            players: this.selectPlayers(definition, playerViews, game.current_round),
          }
        : null,
      players: playerViews,
      createdAt: game.created_at,
    }
  }

  startGame(code: string, hostToken: string): GameView {
    const game = this.assertHost(code, hostToken)
    if (game.status !== "lobby") {
      throw new GameError("La partie ne peut plus être démarrée.", 409)
    }
    const count = this.database
      .prepare("SELECT COUNT(*) AS count FROM players WHERE game_id = ?")
      .get(game.id) as { count: number }
    if (count.count < 2) {
      throw new GameError("Il faut au moins deux poissons pour démarrer.", 409)
    }
    this.database
      .prepare("UPDATE games SET status = 'running', current_round = 0 WHERE id = ?")
      .run(game.id)
    return this.getGame(game.code)
  }

  nextRound(code: string, hostToken: string): GameView {
    const game = this.assertHost(code, hostToken)
    if (game.status !== "running") {
      throw new GameError("La partie n'est pas en cours.", 409)
    }
    const roundIds = JSON.parse(game.round_order) as string[]
    if (game.current_round >= roundIds.length - 1) {
      return this.finishGame(game.code, hostToken)
    }
    this.database
      .prepare("UPDATE games SET current_round = current_round + 1 WHERE id = ?")
      .run(game.id)
    return this.getGame(game.code)
  }

  finishGame(code: string, hostToken: string): GameView {
    const game = this.assertHost(code, hostToken)
    if (game.status === "finished") return this.getGame(game.code)
    this.database
      .prepare("UPDATE games SET status = 'finished' WHERE id = ?")
      .run(game.id)
    return this.getGame(game.code)
  }

  private getGameRow(code: string): GameRow {
    const game = this.database
      .prepare("SELECT * FROM games WHERE code = ?")
      .get(code) as GameRow | undefined
    if (!game) throw new GameError("Aquarium introuvable. Vérifie le code.", 404)
    return game
  }

  private assertHost(code: string, token: string): GameRow {
    const game = this.getGameRow(code.trim().toUpperCase())
    if (!token || hashToken(token) !== game.host_token_hash) {
      throw new GameError("Seul le capitaine peut toucher à ça.", 403)
    }
    return game
  }

  private makeUniqueCode(): string {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      let code = ""
      for (let index = 0; index < 4; index += 1) {
        code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
      }
      const exists = this.database
        .prepare("SELECT 1 FROM games WHERE code = ?")
        .get(code)
      if (!exists) return code
    }
    throw new GameError("Impossible de créer un code de partie.", 500)
  }

  private findPrompt(id: string): PromptDefinition {
    const prompt = prompts.find((candidate) => candidate.id === id)
    if (!prompt) throw new GameError("Défi introuvable.", 500)
    return prompt
  }

  private selectPlayers(
    prompt: PromptDefinition,
    players: PlayerView[],
    roundIndex: number,
  ): string[] {
    if (prompt.targetCount === "all") return players.map((player) => player.name)
    const selected: string[] = []
    const targetCount = Math.min(prompt.targetCount, players.length)
    for (let offset = 0; offset < targetCount; offset += 1) {
      selected.push(players[(roundIndex + offset) % players.length].name)
    }
    return selected
  }
}
