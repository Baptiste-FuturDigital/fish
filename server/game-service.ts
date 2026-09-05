import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto"

import type { GameDatabase } from "./db.js"
import { prompts, type PromptDefinition } from "./content.js"
import { aggregateTeamResults, projectRound, scorePlayerRound } from "./tournament-engine.js"
import { selectBalancedTotem } from "./totem-assignment.js"
import { findTotem, prankTotem, teamDefinitions, teamIds, totems, type TotemCategory } from "./totems.js"
import { challenges, findChallenge } from "../shared/challenges/catalog.js"
import {
  anonymousPlayerIdentity,
  findPlayerIdentity,
  playerIdentities,
} from "../shared/player-identities.js"
import type {
  ChallengeId,
  PlayerRoundScoreResult,
  RoundScoreResult,
  SubmittedPlayerAnswer,
} from "../shared/challenges/types.js"
import type {
  GameStatus,
  GameView,
  JoinPlayerInput,
  PlayerIdentityChoice,
  PlayerSession,
  PlayerView,
  SessionResponse,
  PlayerAnswerView,
  TeamView,
  TournamentView,
  PoseithonBonusView,
  TeamFiftyFiftyJokerView,
} from "../shared/game.js"

interface GameRow {
  id: string
  code: string
  name: string
  status: GameStatus
  current_round: number
  round_order: string
  challenge_order: string
  challenge_index: number
  challenge_round: number
  phase: "lobby" | "challenge-intro" | "answering" | "reveal" | "leaderboard" | "finished"
  phase_ends_at: string | null
  is_demo: number
  prank_player_name: string | null
  buzz_player_id: string | null
  buzz_team_id: string | null
  buzz_paused_ms: number | null
  buzz_points: number | null
  buzz_blocked_team_id: string | null
  host_token_hash: string
  created_at: string
}

interface PlayerRow {
  id: string
  name: string
  identity_id: string | null
  is_host: number
  score: number
  totem_id: number | null
}

interface PlayerAuthRow {
  id: string
  token_hash: string
  totem_id: number | null
  is_host: number
}

interface TeamRow {
  team_id: string
  category: TotemCategory
  name: string
  score: number
}

interface PlayerAnswerRow {
  player_id: string
  player_name: string
  team_id: string
  answer: string
  locked: number
  awarded_points: number | null
}

interface PlayerRoundResultRow extends RoundResultRow {
  player_id: string
  player_name: string
}

interface RoundResultRow {
  team_id: string
  answer: string | null
  points: number
  is_correct: number
  distance: number | null
}

interface BonusRow {
  challenge_index: number
  challenge_id: ChallengeId
  target_team_id: string
  team_name: string
  points: number
  created_at: string
}

interface FiftyFiftyJokerRow {
  team_id: string
  round_index: number
  kept_choice_ids: string
  used_at: string
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const ROUND_COUNT = 8
const POSEITHON_BONUS_POINTS = 2

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

function cleanOptionalText(value: string | undefined, label: string, maxLength: number): string | null {
  const cleaned = value?.trim().replace(/\s+/g, " ") ?? ""
  if (!cleaned) return null
  if (cleaned.length > maxLength) throw new GameError(`${label} est trop long.`, 400)
  return cleaned
}

function normalizedPlayerName(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("fr-FR")
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

  createGame(gameName: string, hostName: string, prankPlayerName?: string): SessionResponse {
    const name = cleanText(gameName, "Le nom de la partie", 40)
    const playerName = cleanText(hostName, "Le pseudo", 24)
    const prankTarget = cleanOptionalText(prankPlayerName, "Le pseudo à piéger", 24)
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
            (id, code, name, status, current_round, round_order, challenge_order, prank_player_name, host_token_hash, created_at)
           VALUES (?, ?, ?, 'lobby', -1, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          code,
          name,
          JSON.stringify(shuffledPromptIds()),
          JSON.stringify(challenges.map((challenge) => challenge.id)),
          prankTarget,
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
      const insertTeam = this.database.prepare(
        `INSERT INTO game_teams (game_id, team_id, category, name, score)
         VALUES (?, ?, ?, ?, 0)`,
      )
      for (const team of teamDefinitions) {
        insertTeam.run(id, team.id, team.category, team.name)
      }
    })()

    return {
      game: this.getGame(code),
      session: { gameCode: code, playerId, playerToken, hostToken },
    }
  }

  createDemoGame(): SessionResponse {
    const created = this.createGame("Démo de Poséithon", "Poséithon")
    const sessions = ["Ariel", "Nemo", "Dory", "Sebastien", "Marin", "Poulpy", "Moby", "Corail"]
      .map((name) => this.joinGame(created.game.code, name).session)
    for (const session of sessions) {
      this.claimTotem(created.game.code, session.playerId, session.playerToken)
    }
    this.database.prepare("UPDATE games SET is_demo = 1 WHERE code = ?").run(created.game.code)
    const demoNames = ["Les Sardines Turbo", "Le Krill Bill", "Les Dents de Mer", "Les Moules Costaudes"]
    teamDefinitions.forEach((team, index) => {
      this.database.prepare("UPDATE game_teams SET name = ? WHERE game_id = ? AND team_id = ?")
        .run(demoNames[index], created.game.id, team.id)
    })
    return {
      game: this.startGame(created.game.code, created.session.hostToken!),
      session: created.session,
    }
  }

  joinGame(codeInput: string, input: JoinPlayerInput | string): SessionResponse {
    const code = codeInput.trim().toUpperCase()
    const requestedIdentity = typeof input === "string"
      ? anonymousPlayerIdentity
      : findPlayerIdentity(input.identityId)
    if (!requestedIdentity) throw new GameError("Cette identité n'existe pas dans l'aquarium.", 400)
    const name = requestedIdentity.anonymous
      ? cleanText(typeof input === "string" ? input : (input.nickname ?? ""), "Le pseudo", 24)
      : requestedIdentity.displayName
    const game = this.getGameRow(code)
    if (game.status !== "lobby") {
      throw new GameError("Cette partie a déjà quitté le port.", 409)
    }
    const playerCount = this.database
      .prepare("SELECT COUNT(*) AS count FROM players WHERE game_id = ? AND is_host = 0")
      .get(game.id) as { count: number }
    if (playerCount.count >= totems.length) {
      throw new GameError("L'aquarium est complet : vingt poissons maximum.", 409)
    }

    const playerId = randomUUID()
    const playerToken = makeToken()
    try {
      this.database
        .prepare(
          `INSERT INTO players
            (id, game_id, name, identity_id, is_host, score, token_hash, created_at)
           VALUES (?, ?, ?, ?, 0, 0, ?, ?)`,
        )
        .run(
          playerId,
          game.id,
          name,
          requestedIdentity.id,
          hashToken(playerToken),
          new Date().toISOString(),
        )
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE")) {
        if (!requestedIdentity.anonymous) {
          throw new GameError(`${requestedIdentity.displayName} a déjà rejoint cet aquarium.`, 409)
        }
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

  listPlayerIdentities(codeInput: string): PlayerIdentityChoice[] {
    const game = this.getGameRow(codeInput.trim().toUpperCase())
    const occupied = new Set(
      (this.database
        .prepare("SELECT identity_id FROM players WHERE game_id = ? AND is_host = 0 AND identity_id IS NOT NULL")
        .all(game.id) as Array<{ identity_id: string }>)
        .map((row) => row.identity_id),
    )

    return playerIdentities.map((identity) => ({
      ...identity,
      available: identity.anonymous || !occupied.has(identity.id),
    }))
  }

  getGame(codeInput: string): GameView {
    let game = this.getGameRow(codeInput.trim().toUpperCase())
    game = this.synchronizeDeadline(game)
    const players = this.database
      .prepare(
        `SELECT id, name, identity_id, is_host, score, totem_id
         FROM players WHERE game_id = ? AND is_host = 0 ORDER BY created_at, rowid`,
      )
      .all(game.id) as PlayerRow[]
    const playerViews: PlayerView[] = players.map((player) => ({
      ...(() => {
        const definition = findTotem(player.totem_id)
        const isPrankTarget = Boolean(
          definition &&
          game.prank_player_name &&
          normalizedPlayerName(player.name) === normalizedPlayerName(game.prank_player_name),
        )
        return {
          teamId: definition ? teamIds[definition.category] : null,
          totem: definition && isPrankTarget ? prankTotem(definition) : definition,
        }
      })(),
      id: player.id,
      name: player.name,
      identityId: player.identity_id ?? "anonymous",
      imageUrl: findPlayerIdentity(player.identity_id ?? "anonymous")?.imageUrl
        ?? anonymousPlayerIdentity.imageUrl,
      isHost: Boolean(player.is_host),
      score: player.score,
    }))
    const teamRows = this.database
      .prepare("SELECT team_id, category, name, score FROM game_teams WHERE game_id = ? ORDER BY rowid")
      .all(game.id) as TeamRow[]
    const teams: TeamView[] = teamRows.map((team) => ({
      id: team.team_id,
      name: team.name,
      score: team.score,
      memberIds: playerViews.filter((player) => player.teamId === team.team_id).map((player) => player.id),
    }))
    const teamNames = new Map(teams.map((team) => [team.id, team.name]))
    for (const player of playerViews) {
      if (player.totem && player.teamId) {
        player.totem = { ...player.totem, teamName: teamNames.get(player.teamId) ?? player.totem.teamName }
      }
    }
    const tournament = this.buildTournamentView(game)

    return {
      id: game.id,
      code: game.code,
      name: game.name,
      isDemo: Boolean(game.is_demo),
      status: game.status,
      currentRound: tournament ? tournament.roundIndex + 1 : 0,
      totalRounds: tournament?.roundCount ?? 0,
      currentPrompt: null,
      players: playerViews,
      teams,
      tournament,
      createdAt: game.created_at,
    }
  }

  claimTotem(codeInput: string, playerId: string, playerToken: string): GameView {
    const game = this.getGameRow(codeInput.trim().toUpperCase())
    if (game.status !== "lobby") {
      throw new GameError("Le tirage des totems est terminé.", 409)
    }

    this.database.transaction(() => {
      const player = this.database
        .prepare("SELECT id, token_hash, totem_id, is_host FROM players WHERE game_id = ? AND id = ?")
        .get(game.id, playerId) as PlayerAuthRow | undefined
      if (!player || !playerToken || hashToken(playerToken) !== player.token_hash) {
        throw new GameError("Session de poisson invalide.", 403)
      }
      if (player.is_host) {
        throw new GameError("Le maître du jeu reste hors compétition.", 409)
      }
      if (player.totem_id !== null) return

      const usedRows = this.database
        .prepare("SELECT totem_id FROM players WHERE game_id = ? AND is_host = 0 AND totem_id IS NOT NULL")
        .all(game.id) as Array<{ totem_id: number }>
      const usedIds = new Set(usedRows.map((row) => row.totem_id))
      const available = totems.filter((candidate) => !usedIds.has(candidate.id))
      if (available.length === 0) {
        throw new GameError("Tous les animaux totems ont déjà été attribués.", 409)
      }
      const assignedCategories = usedRows
        .map((row) => findTotem(row.totem_id)?.category)
        .filter((category): category is TotemCategory => Boolean(category))
      const selected = selectBalancedTotem(available, assignedCategories, randomInt)
      this.database.prepare("UPDATE players SET totem_id = ? WHERE id = ?").run(selected.id, player.id)
    })()

    return this.getGame(game.code)
  }

  renameTeam(
    codeInput: string,
    teamId: string,
    nameInput: string,
    playerId: string,
    playerToken: string,
  ): GameView {
    const game = this.getGameRow(codeInput.trim().toUpperCase())
    if (game.status !== "lobby") throw new GameError("Les noms de banc sont verrouillés.", 409)
    const player = this.assertPlayer(game.id, playerId, playerToken)
    const totem = findTotem(player.totem_id)
    if (!totem || teamIds[totem.category] !== teamId) {
      throw new GameError("Tu ne peux renommer que ton propre banc.", 403)
    }
    const name = cleanText(nameInput, "Le nom du banc", 32)
    this.database.prepare("UPDATE game_teams SET name = ? WHERE game_id = ? AND team_id = ?")
      .run(name, game.id, teamId)
    return this.getGame(game.code)
  }

  kickPlayer(codeInput: string, playerId: string, hostToken: string): GameView {
    const game = this.assertHost(codeInput, hostToken)
    if (game.status !== "lobby") {
      throw new GameError("Les exclusions sont réservées au lobby.", 409)
    }
    const player = this.database.prepare(
      "SELECT id FROM players WHERE game_id = ? AND id = ? AND is_host = 0",
    ).get(game.id, playerId) as { id: string } | undefined
    if (!player) {
      throw new GameError("Ce poisson n'est plus dans le lobby.", 404)
    }

    this.database.prepare("DELETE FROM players WHERE game_id = ? AND id = ?")
      .run(game.id, player.id)
    return this.getGame(game.code)
  }

  startGame(code: string, hostToken: string): GameView {
    const game = this.assertHost(code, hostToken)
    if (game.status !== "lobby") {
      throw new GameError("La partie ne peut plus être démarrée.", 409)
    }
    const count = this.database
      .prepare("SELECT COUNT(*) AS count FROM players WHERE game_id = ? AND is_host = 0")
      .get(game.id) as { count: number }
    if (count.count < 2) {
      throw new GameError("Il faut au moins deux poissons pour démarrer.", 409)
    }
    const unassigned = this.database
      .prepare("SELECT COUNT(*) AS count FROM players WHERE game_id = ? AND is_host = 0 AND totem_id IS NULL")
      .get(game.id) as { count: number }
    if (unassigned.count > 0) {
      throw new GameError("Tous les poissons doivent révéler leur animal totem.", 409)
    }
    this.database
      .prepare(`UPDATE games
        SET status = 'running', current_round = 0, challenge_index = 0,
            challenge_round = 0, phase = 'challenge-intro', phase_ends_at = NULL,
            challenge_order = ?
        WHERE id = ?`)
      .run(JSON.stringify(challenges.map((challenge) => challenge.id)), game.id)
    return this.getGame(game.code)
  }

  nextRound(code: string, hostToken: string): GameView {
    return this.advanceTournament(code, hostToken)
  }

  skipDemoChallenge(code: string, hostToken: string): GameView {
    const game = this.assertHost(code, hostToken)
    if (!game.is_demo) {
      throw new GameError("Ce raccourci est réservé à la démo.", 409)
    }
    if (game.status !== "running") {
      throw new GameError("La démo n'est pas en cours.", 409)
    }
    if (game.challenge_index >= this.challengeOrder(game).length - 1) {
      throw new GameError("La dernière épreuve est déjà atteinte.", 409)
    }

    this.database.prepare(
      `UPDATE games
       SET challenge_index = challenge_index + 1,
           challenge_round = 0,
           current_round = 0,
           phase = 'challenge-intro',
           phase_ends_at = NULL,
           buzz_player_id = NULL,
           buzz_team_id = NULL,
           buzz_paused_ms = NULL,
           buzz_points = NULL,
           buzz_blocked_team_id = NULL
       WHERE id = ?`,
    ).run(game.id)

    return this.getGame(game.code)
  }

  advanceTournament(code: string, hostToken: string): GameView {
    const game = this.assertHost(code, hostToken)
    if (game.status !== "running") {
      throw new GameError("La partie n'est pas en cours.", 409)
    }
    const challenge = this.currentChallenge(game)
    if (game.phase === "challenge-intro") {
      this.startAnswering(game, challenge.rounds[game.challenge_round].durationSeconds)
    } else if (game.phase === "answering") {
      this.revealRound(game)
    } else if (game.phase === "reveal") {
      if (game.challenge_round < challenge.rounds.length - 1) {
        const nextRound = game.challenge_round + 1
        this.database.prepare(
          `UPDATE games SET challenge_round = ?, current_round = ?, phase = 'answering', phase_ends_at = ?,
           buzz_player_id = NULL, buzz_team_id = NULL, buzz_paused_ms = NULL,
           buzz_points = NULL, buzz_blocked_team_id = NULL WHERE id = ?`,
        ).run(
          nextRound,
          nextRound,
          new Date(Date.now() + challenge.rounds[nextRound].durationSeconds * 1_000).toISOString(),
          game.id,
        )
      } else {
        const order = this.challengeOrder(game)
        if (game.challenge_index >= order.length - 1) {
          return this.finishGame(game.code, hostToken)
        }
        this.database.prepare(
          "UPDATE games SET phase = 'leaderboard', phase_ends_at = NULL WHERE id = ?",
        ).run(game.id)
      }
    } else if (game.phase === "leaderboard") {
      this.database.prepare(
        `UPDATE games SET challenge_index = challenge_index + 1, challenge_round = 0,
         current_round = 0, phase = 'challenge-intro', phase_ends_at = NULL WHERE id = ?`,
      ).run(game.id)
    } else {
      throw new GameError("Phase de tournoi invalide.", 409)
    }
    return this.getGame(game.code)
  }

  submitPlayerAnswer(
    codeInput: string,
    playerId: string,
    playerToken: string,
    answerInput: string,
    locked: boolean,
  ): GameView {
    let game = this.getGameRow(codeInput.trim().toUpperCase())
    game = this.synchronizeDeadline(game)
    if (game.status !== "running" || game.phase !== "answering") {
      throw new GameError("Les réponses sont fermées.", 409)
    }
    const player = this.assertPlayer(game.id, playerId, playerToken)
    const totem = findTotem(player.totem_id)
    if (!totem) throw new GameError("Révèle d'abord ton animal totem.", 409)
    const teamId = teamIds[totem.category]
    const challenge = this.currentChallenge(game)
    const round = challenge.rounds[game.challenge_round]
    const answer = answerInput.trim()
    if (round.kind === "number") {
      const numeric = Number(answer.replace(",", "."))
      if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1_000_000_000) {
        throw new GameError("Entre une estimation valide.", 400)
      }
    } else if (round.kind === "buzzer") {
      throw new GameError("Utilise le buzzer de ton banc.", 409)
    } else if (!round.choices.some((choice) => choice.id === answer)) {
      throw new GameError("Choisis une réponse proposée.", 400)
    }

    const existing = this.database.prepare(
      `SELECT p.name AS player_name, pa.player_id, pa.team_id, pa.answer, pa.locked
       FROM player_answers pa
       JOIN players p ON p.id = pa.player_id
       WHERE pa.game_id = ? AND pa.challenge_id = ? AND pa.round_index = ? AND pa.player_id = ?`,
    ).get(game.id, challenge.id, game.challenge_round, player.id) as PlayerAnswerRow | undefined
    if (existing?.locked) {
      if (existing.answer === answer) return this.getGame(game.code)
      throw new GameError("Tu as déjà validé ton dernier mot.", 409)
    }
    this.database.prepare(
      `INSERT INTO player_answers
        (game_id, challenge_id, round_index, player_id, team_id, answer, locked, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(game_id, challenge_id, round_index, player_id)
       DO UPDATE SET answer = excluded.answer, locked = excluded.locked,
                     team_id = excluded.team_id, updated_at = excluded.updated_at`,
    ).run(
      game.id,
      challenge.id,
      game.challenge_round,
      player.id,
      teamId,
      round.kind === "number" ? String(Number(answer.replace(",", "."))) : answer,
      locked ? 1 : 0,
      new Date().toISOString(),
    )
    return this.getGame(game.code)
  }

  buzzQuestion(codeInput: string, playerId: string, playerToken: string): GameView {
    const code = codeInput.trim().toUpperCase()
    let game = this.synchronizeDeadline(this.getGameRow(code))
    if (game.status !== "running" || game.phase !== "answering") {
      throw new GameError("Le buzzer est fermé.", 409)
    }
    const challenge = this.currentChallenge(game)
    const round = challenge.rounds[game.challenge_round]
    if (challenge.id !== "question-pour-un-poisson" || round.kind !== "buzzer") {
      throw new GameError("Le buzzer n'est pas disponible pendant cette épreuve.", 409)
    }
    if (game.buzz_player_id) throw new GameError("Un autre banc a déjà buzzé.", 409)
    const player = this.assertPlayer(game.id, playerId, playerToken)
    const totem = findTotem(player.totem_id)
    if (!totem) throw new GameError("Révèle d'abord ton animal totem.", 409)
    const teamId = teamIds[totem.category]
    if (game.buzz_blocked_team_id === teamId) {
      throw new GameError("Ton banc est bloqué jusqu'à la tentative d'un autre banc.", 409)
    }
    const remainingMs = game.phase_ends_at
      ? Math.max(0, Date.parse(game.phase_ends_at) - Date.now())
      : 0
    if (remainingMs <= 0) throw new GameError("Le temps est écoulé.", 409)
    const scoring = challenge.scoring
    const tier = Math.min(3, Math.floor((round.durationSeconds * 1_000 - remainingMs) / 10_000))
    const points = scoring.kind === "buzzer-countdown" ? scoring.points[tier] ?? 1 : 1
    this.database.prepare(
      `UPDATE games SET buzz_player_id = ?, buzz_team_id = ?, buzz_paused_ms = ?,
       buzz_points = ?, phase_ends_at = NULL WHERE id = ? AND buzz_player_id IS NULL`,
    ).run(player.id, teamId, remainingMs, points, game.id)
    game = this.getGameRow(code)
    return this.getGame(game.code)
  }

  resolveQuestionBuzz(codeInput: string, hostToken: string, correct: boolean): GameView {
    const game = this.assertHost(codeInput, hostToken)
    const challenge = this.currentChallenge(game)
    const round = challenge.rounds[game.challenge_round]
    if (
      game.status !== "running" || game.phase !== "answering" ||
      challenge.id !== "question-pour-un-poisson" || round.kind !== "buzzer" ||
      !game.buzz_player_id || !game.buzz_team_id
    ) {
      throw new GameError("Aucune réponse de banc à valider.", 409)
    }
    if (!correct) {
      const resumesAt = new Date(Date.now() + Math.max(1, game.buzz_paused_ms ?? 1)).toISOString()
      this.database.prepare(
        `UPDATE games SET buzz_blocked_team_id = buzz_team_id, buzz_player_id = NULL,
         buzz_team_id = NULL, buzz_paused_ms = NULL, buzz_points = NULL,
         phase_ends_at = ? WHERE id = ?`,
      ).run(resumesAt, game.id)
      return this.getGame(game.code)
    }
    this.database.prepare(
      `INSERT INTO player_answers
        (game_id, challenge_id, round_index, player_id, team_id, answer, locked, awarded_points, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
       ON CONFLICT(game_id, challenge_id, round_index, player_id)
       DO UPDATE SET answer = excluded.answer, locked = 1, awarded_points = excluded.awarded_points,
                     team_id = excluded.team_id, updated_at = excluded.updated_at`,
    ).run(
      game.id, challenge.id, game.challenge_round, game.buzz_player_id, game.buzz_team_id,
      round.correctAnswer, game.buzz_points ?? 1, new Date().toISOString(),
    )
    this.database.prepare(
      `UPDATE games SET buzz_player_id = NULL, buzz_team_id = NULL, buzz_paused_ms = NULL,
       buzz_points = NULL, phase_ends_at = NULL WHERE id = ?`,
    ).run(game.id)
    this.revealRound(this.getGameRow(game.code))
    return this.getGame(game.code)
  }

  useFiftyFifty(
    codeInput: string,
    playerId: string,
    playerToken: string,
  ): GameView {
    const code = codeInput.trim().toUpperCase()
    this.database.transaction(() => {
      let game = this.getGameRow(code)
      game = this.synchronizeDeadline(game)
      if (
        game.status !== "running" ||
        game.phase !== "answering" ||
        this.currentChallenge(game).id !== "qui-veut-gagner-des-poissons"
      ) {
        throw new GameError(
          "Le joker 50/50 n'est disponible que pendant Qui veut gagner des poissons.",
          409,
        )
      }

      const player = this.assertPlayer(game.id, playerId, playerToken)
      const totem = findTotem(player.totem_id)
      if (!totem) throw new GameError("Révèle d'abord ton animal totem.", 409)
      const teamId = teamIds[totem.category]
      const challenge = this.currentChallenge(game)
      const round = challenge.rounds[game.challenge_round]
      if (round.kind !== "choice") {
        throw new GameError("Cette question n'accepte pas le joker 50/50.", 409)
      }

      const existing = this.database.prepare(
        `SELECT 1 FROM team_fifty_fifty_jokers
         WHERE game_id = ? AND challenge_id = ? AND team_id = ?`,
      ).get(game.id, challenge.id, teamId)
      if (existing) {
        throw new GameError("Ton banc a déjà utilisé son joker 50/50.", 409)
      }

      const lockedAnswer = this.database.prepare(
        `SELECT locked FROM player_answers
         WHERE game_id = ? AND challenge_id = ? AND round_index = ? AND player_id = ?`,
      ).get(game.id, challenge.id, game.challenge_round, player.id) as { locked: number } | undefined
      if (lockedAnswer?.locked) {
        throw new GameError("Ton dernier mot est déjà verrouillé.", 409)
      }

      const wrongChoices = round.choices.filter((choice) => choice.id !== round.correctAnswer)
      const digest = createHash("sha256")
        .update(`${game.id}:${teamId}:${round.id}`)
        .digest()
      const keptWrongChoice = wrongChoices[digest[0] % wrongChoices.length]
      const keptChoiceIds = round.choices
        .filter((choice) => choice.id === round.correctAnswer || choice.id === keptWrongChoice.id)
        .map((choice) => choice.id)
      const inserted = this.database.prepare(
        `INSERT OR IGNORE INTO team_fifty_fifty_jokers
          (game_id, challenge_id, team_id, round_index, kept_choice_ids, used_by_player_id, used_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        game.id,
        challenge.id,
        teamId,
        game.challenge_round,
        JSON.stringify(keptChoiceIds),
        player.id,
        new Date().toISOString(),
      )
      if (inserted.changes !== 1) {
        throw new GameError("Ton banc a déjà utilisé son joker 50/50.", 409)
      }
    })()
    return this.getGame(code)
  }

  finishGame(code: string, hostToken: string): GameView {
    const game = this.assertHost(code, hostToken)
    if (game.status === "finished") return this.getGame(game.code)
    this.database
      .prepare("UPDATE games SET status = 'finished', phase = 'finished', phase_ends_at = NULL WHERE id = ?")
      .run(game.id)
    return this.getGame(game.code)
  }

  applyPoseithonBonus(codeInput: string, hostToken: string): GameView {
    const code = codeInput.trim().toUpperCase()
    this.database.transaction(() => {
      const game = this.assertHost(code, hostToken)
      if (game.status !== "running" || game.phase !== "leaderboard") {
        throw new GameError("La Marée de Poséithon ne peut surgir qu'entre deux épreuves.", 409)
      }
      const existing = this.database.prepare(
        `SELECT 1 FROM intermission_bonuses
         WHERE game_id = ? AND challenge_index = ?`,
      ).get(game.id, game.challenge_index)
      if (existing) {
        throw new GameError("La Marée de Poséithon a déjà frappé pendant cette escale.", 409)
      }

      const teams = this.database.prepare(
        "SELECT team_id, category, name, score FROM game_teams WHERE game_id = ?",
      ).all(game.id) as TeamRow[]
      const participantRows = this.database.prepare(
        `SELECT totem_id FROM players
         WHERE game_id = ? AND is_host = 0 AND totem_id IS NOT NULL`,
      ).all(game.id) as Array<{ totem_id: number }>
      const occupiedTeamIds = new Set(
        participantRows.flatMap((player) => {
          const totem = findTotem(player.totem_id)
          return totem ? [teamIds[totem.category]] : []
        }),
      )
      const target = teams
        .filter((team) => occupiedTeamIds.has(team.team_id))
        .sort((left, right) =>
          left.score - right.score ||
          left.name.localeCompare(right.name, "fr", { sensitivity: "base" }) ||
          left.team_id.localeCompare(right.team_id),
        )[0]
      if (!target) throw new GameError("Aucun banc ne peut recevoir la faveur divine.", 409)

      const awardedAt = new Date().toISOString()
      const challenge = this.currentChallenge(game)
      this.database.prepare(
        `INSERT INTO intermission_bonuses
          (game_id, challenge_index, challenge_id, target_team_id, points, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        game.id,
        game.challenge_index,
        challenge.id,
        target.team_id,
        POSEITHON_BONUS_POINTS,
        awardedAt,
      )
      this.database.prepare(
        "UPDATE game_teams SET score = score + ? WHERE game_id = ? AND team_id = ?",
      ).run(POSEITHON_BONUS_POINTS, game.id, target.team_id)
    })()
    return this.getGame(code)
  }

  private buildTournamentView(game: GameRow): TournamentView | null {
    if (game.status !== "running") return null
    const challenge = this.currentChallenge(game)
    const round = challenge.rounds[game.challenge_round]
    if (!round) throw new GameError("Manche introuvable.", 500)
    const hasRevealedRound = game.phase === "reveal" || game.phase === "leaderboard"
    const answerRows = this.database.prepare(
      `SELECT pa.player_id, p.name AS player_name, pa.team_id, pa.answer, pa.locked, pa.awarded_points
       FROM player_answers pa
       JOIN players p ON p.id = pa.player_id
       WHERE pa.game_id = ? AND pa.challenge_id = ? AND pa.round_index = ?
       ORDER BY p.created_at, p.rowid`,
    ).all(game.id, challenge.id, game.challenge_round) as PlayerAnswerRow[]
    const answers: PlayerAnswerView[] = answerRows.map((entry) => ({
      playerId: entry.player_id,
      playerName: entry.player_name,
      teamId: entry.team_id,
      answer: hasRevealedRound ? entry.answer : null,
      locked: Boolean(entry.locked),
    }))
    const playerResultRows = hasRevealedRound
      ? this.database.prepare(
          `SELECT pr.player_id, p.name AS player_name, pr.team_id, pr.answer,
                  pr.points, pr.is_correct, pr.distance
           FROM player_round_results pr
           JOIN players p ON p.id = pr.player_id
           WHERE pr.game_id = ? AND pr.challenge_id = ? AND pr.round_index = ?
           ORDER BY pr.points DESC, p.name COLLATE NOCASE, pr.player_id`,
        ).all(game.id, challenge.id, game.challenge_round) as PlayerRoundResultRow[]
      : []
    const teamResultRows = hasRevealedRound
      ? this.database.prepare(
          `SELECT team_id, answer, points, is_correct, distance FROM round_results
           WHERE game_id = ? AND challenge_id = ? AND round_index = ?
           ORDER BY points DESC, team_id`,
        ).all(game.id, challenge.id, game.challenge_round) as RoundResultRow[]
      : []
    const displayAnswer = (answer: string | null) => round.kind === "choice" && answer !== null
      ? round.choices.find((choice) => choice.id === answer)?.label ?? answer
      : answer
    const results: PlayerRoundScoreResult[] = playerResultRows.map((entry) => ({
      playerId: entry.player_id,
      playerName: entry.player_name,
      teamId: entry.team_id,
      answer: displayAnswer(entry.answer),
      points: entry.points,
      isCorrect: Boolean(entry.is_correct),
      distance: entry.distance,
    }))
    const teamResults: RoundScoreResult[] = teamResultRows.map((entry) => ({
      teamId: entry.team_id,
      answer: displayAnswer(entry.answer),
      points: entry.points,
      isCorrect: Boolean(entry.is_correct),
      distance: entry.distance,
    }))
    const bonusRow = this.database.prepare(
      `SELECT b.challenge_index, b.challenge_id, b.target_team_id,
              gt.name AS team_name, b.points, b.created_at
       FROM intermission_bonuses b
       JOIN game_teams gt ON gt.game_id = b.game_id AND gt.team_id = b.target_team_id
       WHERE b.game_id = ? AND b.challenge_index = ?`,
    ).get(game.id, game.challenge_index) as BonusRow | undefined
    const bonus: PoseithonBonusView | null = bonusRow
      ? {
          challengeIndex: bonusRow.challenge_index,
          challengeId: bonusRow.challenge_id,
          teamId: bonusRow.target_team_id,
          teamName: bonusRow.team_name,
          points: bonusRow.points,
          awardedAt: bonusRow.created_at,
        }
      : null
    const fiftyFiftyRows = this.database.prepare(
      `SELECT team_id, round_index, kept_choice_ids, used_at
       FROM team_fifty_fifty_jokers
       WHERE game_id = ? AND challenge_id = ?
       ORDER BY used_at, team_id`,
    ).all(game.id, challenge.id) as FiftyFiftyJokerRow[]
    const fiftyFiftyJokers: TeamFiftyFiftyJokerView[] = fiftyFiftyRows.map((entry) => ({
      teamId: entry.team_id,
      roundIndex: entry.round_index,
      keptChoiceIds: JSON.parse(entry.kept_choice_ids) as string[],
      usedAt: entry.used_at,
    }))
    const buzz = game.buzz_player_id && game.buzz_team_id
      ? this.database.prepare(
          `SELECT p.id AS player_id, p.name AS player_name, gt.team_id, gt.name AS team_name
           FROM players p
           JOIN game_teams gt ON gt.game_id = p.game_id AND gt.team_id = ?
           WHERE p.game_id = ? AND p.id = ?`,
        ).get(game.buzz_team_id, game.id, game.buzz_player_id) as {
          player_id: string
          player_name: string
          team_id: string
          team_name: string
        } | undefined
      : undefined

    return {
      challengeIndex: game.challenge_index,
      challengeCount: this.challengeOrder(game).length,
      roundIndex: game.challenge_round,
      roundCount: challenge.rounds.length,
      phase: game.phase as TournamentView["phase"],
      endsAt: game.phase_ends_at,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        shortTitle: challenge.shortTitle,
        emoji: challenge.emoji,
        description: challenge.description,
        rules: challenge.rules,
        introMusicYoutubeId: challenge.introMusicYoutubeId,
        introMusicStartSeconds: challenge.introMusicStartSeconds,
        introMusicEndSeconds: challenge.introMusicEndSeconds,
        answeringMusicYoutubeId: challenge.answeringMusicYoutubeId,
        timerEndSoundYoutubeId: challenge.timerEndSoundYoutubeId,
        introImageUrl: challenge.introImageUrl,
        presenterImageUrl: challenge.presenterImageUrl,
        confirmationLabel: challenge.confirmationLabel,
      },
      round: projectRound(round, hasRevealedRound),
      answers,
      results,
      teamResults,
      bonus,
      bonusAvailable: game.phase === "leaderboard" && bonus === null,
      fiftyFiftyJokers,
      buzz: buzz ? {
        playerId: buzz.player_id,
        playerName: buzz.player_name,
        teamId: buzz.team_id,
        teamName: buzz.team_name,
        points: game.buzz_points ?? 1,
      } : null,
      blockedTeamId: game.buzz_blocked_team_id,
      pausedRemainingMs: game.buzz_paused_ms,
    }
  }

  private synchronizeDeadline(game: GameRow): GameRow {
    if (
      game.status === "running" &&
      game.phase === "answering" &&
      game.phase_ends_at &&
      Date.parse(game.phase_ends_at) <= Date.now()
    ) {
      this.revealRound(game)
      return this.getGameRow(game.code)
    }
    return game
  }

  private revealRound(game: GameRow): void {
    this.database.transaction(() => {
      const fresh = this.getGameRow(game.code)
      if (fresh.status !== "running" || fresh.phase !== "answering") return
      const challenge = this.currentChallenge(fresh)
      const teamRows = this.database
        .prepare("SELECT team_id, category, name, score FROM game_teams WHERE game_id = ? ORDER BY rowid")
        .all(fresh.id) as TeamRow[]
      const playerRows = this.database
        .prepare(
          `SELECT id, name, is_host, score, totem_id
           FROM players WHERE game_id = ? AND is_host = 0 ORDER BY created_at, rowid`,
        )
        .all(fresh.id) as PlayerRow[]
      const scoringPlayers = playerRows.map((player) => {
        const totem = findTotem(player.totem_id)
        if (!totem) throw new GameError("Un joueur n'a pas d'animal totem.", 500)
        return { id: player.id, name: player.name, teamId: teamIds[totem.category] }
      })
      if (fresh.is_demo) {
        this.seedDemoAnswers(fresh, scoringPlayers)
      }
      const answerRows = this.database.prepare(
        `SELECT pa.player_id, p.name AS player_name, pa.team_id, pa.answer, pa.locked, pa.awarded_points
         FROM player_answers pa
         JOIN players p ON p.id = pa.player_id
         WHERE pa.game_id = ? AND pa.challenge_id = ? AND pa.round_index = ?`,
      ).all(fresh.id, challenge.id, fresh.challenge_round) as PlayerAnswerRow[]
      const answersByPlayer = new Map(answerRows.map((entry) => [entry.player_id, entry]))
      const submittedAnswers: SubmittedPlayerAnswer[] = scoringPlayers.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        teamId: player.teamId,
        answer: answersByPlayer.get(player.id)?.answer ?? null,
        awardedPoints: answersByPlayer.get(player.id)?.awarded_points ?? undefined,
      }))
      const playerResults = scorePlayerRound(
        challenge,
        fresh.challenge_round,
        submittedAnswers,
      )
      const teamResults = aggregateTeamResults(
        challenge,
        fresh.challenge_round,
        playerResults,
        teamRows.map((team) => team.team_id),
      )
      const insertPlayerResult = this.database.prepare(
        `INSERT OR IGNORE INTO player_round_results
          (game_id, challenge_id, round_index, player_id, team_id, answer, points, is_correct, distance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      const addPlayerScore = this.database.prepare(
        "UPDATE players SET score = score + ? WHERE game_id = ? AND id = ?",
      )
      for (const result of playerResults) {
        const inserted = insertPlayerResult.run(
          fresh.id,
          challenge.id,
          fresh.challenge_round,
          result.playerId,
          result.teamId,
          result.answer,
          result.points,
          result.isCorrect ? 1 : 0,
          result.distance,
        )
        if (inserted.changes === 1 && result.points > 0) {
          addPlayerScore.run(result.points, fresh.id, result.playerId)
        }
      }
      const insertTeamResult = this.database.prepare(
        `INSERT OR IGNORE INTO round_results
          (game_id, challenge_id, round_index, team_id, answer, points, is_correct, distance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      const addScore = this.database.prepare(
        "UPDATE game_teams SET score = score + ? WHERE game_id = ? AND team_id = ?",
      )
      for (const result of teamResults) {
        const inserted = insertTeamResult.run(
          fresh.id,
          challenge.id,
          fresh.challenge_round,
          result.teamId,
          result.answer,
          result.points,
          result.isCorrect ? 1 : 0,
          result.distance,
        )
        if (inserted.changes === 1 && result.points > 0) {
          addScore.run(result.points, fresh.id, result.teamId)
        }
      }
      this.database.prepare(
        `UPDATE games SET phase = 'reveal', phase_ends_at = NULL, buzz_player_id = NULL,
         buzz_team_id = NULL, buzz_paused_ms = NULL, buzz_points = NULL,
         buzz_blocked_team_id = NULL WHERE id = ?`,
      ).run(fresh.id)
    })()
  }

  private seedDemoAnswers(
    game: GameRow,
    players: Array<{ id: string; name: string; teamId: string }>,
  ): void {
    const challenge = this.currentChallenge(game)
    const round = challenge.rounds[game.challenge_round]
    const insert = this.database.prepare(
      `INSERT OR IGNORE INTO player_answers
        (game_id, challenge_id, round_index, player_id, team_id, answer, locked, awarded_points, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    )
    players.forEach((player, index) => {
      let answer: string
      if (round.kind === "number") {
        const multipliers = [1, 0.88, 1.22, 1.65]
        answer = String(Number((round.correctAnswer * multipliers[(index + game.challenge_round) % multipliers.length]).toFixed(3)))
      } else if (round.kind === "choice") {
        const wrongChoices = round.choices.filter((choice) => choice.id !== round.correctAnswer)
        answer = index === game.challenge_round % players.length || index % 4 === 0
          ? round.correctAnswer
          : wrongChoices[(index + game.challenge_round) % wrongChoices.length].id
      } else {
        answer = index === 0 ? round.correctAnswer : ""
      }
      insert.run(
        game.id,
        challenge.id,
        game.challenge_round,
        player.id,
        player.teamId,
        answer,
        round.kind === "buzzer" && index === 0 ? 2 : null,
        new Date().toISOString(),
      )
    })
  }

  private startAnswering(game: GameRow, durationSeconds: number): void {
    this.database.prepare(
      `UPDATE games SET phase = 'answering', phase_ends_at = ?, buzz_player_id = NULL,
       buzz_team_id = NULL, buzz_paused_ms = NULL, buzz_points = NULL,
       buzz_blocked_team_id = NULL WHERE id = ?`,
    ).run(new Date(Date.now() + durationSeconds * 1_000).toISOString(), game.id)
  }

  private challengeOrder(game: GameRow): ChallengeId[] {
    const parsed = JSON.parse(game.challenge_order || "[]") as ChallengeId[]
    return parsed.length > 0 ? parsed : challenges.map((challenge) => challenge.id)
  }

  private currentChallenge(game: GameRow) {
    const id = this.challengeOrder(game)[game.challenge_index]
    if (!id) throw new GameError("Épreuve introuvable.", 500)
    return findChallenge(id)
  }

  private assertPlayer(gameId: string, playerId: string, playerToken: string): PlayerAuthRow {
    const player = this.database
      .prepare("SELECT id, token_hash, totem_id, is_host FROM players WHERE game_id = ? AND id = ?")
      .get(gameId, playerId) as PlayerAuthRow | undefined
    if (!player || !playerToken || hashToken(playerToken) !== player.token_hash) {
      throw new GameError("Session de poisson invalide.", 403)
    }
    if (player.is_host) {
      throw new GameError("Le maître du jeu reste hors compétition.", 409)
    }
    return player
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
