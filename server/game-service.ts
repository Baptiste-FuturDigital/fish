import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto"

import type { GameDatabase } from "./db.js"
import { prompts, type PromptDefinition } from "./content.js"
import { aggregateTeamResults, projectRound, scorePlayerRound } from "./tournament-engine.js"
import { selectBalancedTotem } from "./totem-assignment.js"
import { findTotem, teamDefinitions, teamIds, totems, type TotemCategory } from "./totems.js"
import { challenges, findChallenge } from "../shared/challenges/catalog.js"
import type {
  ChallengeId,
  PlayerRoundScoreResult,
  RoundScoreResult,
  SubmittedPlayerAnswer,
} from "../shared/challenges/types.js"
import type {
  GameStatus,
  GameView,
  PlayerSession,
  PlayerView,
  SessionResponse,
  PlayerAnswerView,
  TeamView,
  TournamentView,
  PoseithonBonusView,
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
  host_token_hash: string
  created_at: string
}

interface PlayerRow {
  id: string
  name: string
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
            (id, code, name, status, current_round, round_order, challenge_order, host_token_hash, created_at)
           VALUES (?, ?, ?, 'lobby', -1, ?, ?, ?, ?)`,
        )
        .run(
          id,
          code,
          name,
          JSON.stringify(shuffledPromptIds()),
          JSON.stringify(challenges.map((challenge) => challenge.id)),
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

  joinGame(codeInput: string, nameInput: string): SessionResponse {
    const code = codeInput.trim().toUpperCase()
    const name = cleanText(nameInput, "Le pseudo", 24)
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
    let game = this.getGameRow(codeInput.trim().toUpperCase())
    game = this.synchronizeDeadline(game)
    const players = this.database
      .prepare(
        `SELECT id, name, is_host, score, totem_id
         FROM players WHERE game_id = ? AND is_host = 0 ORDER BY created_at, rowid`,
      )
      .all(game.id) as PlayerRow[]
    const playerViews: PlayerView[] = players.map((player) => ({
      ...(() => {
        const definition = findTotem(player.totem_id)
        return {
          teamId: definition ? teamIds[definition.category] : null,
          totem: definition,
        }
      })(),
      id: player.id,
      name: player.name,
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
          `UPDATE games SET challenge_round = ?, current_round = ?, phase = 'answering', phase_ends_at = ? WHERE id = ?`,
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
      `SELECT pa.player_id, p.name AS player_name, pa.team_id, pa.answer, pa.locked
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
        presenterImageUrl: challenge.presenterImageUrl,
        confirmationLabel: challenge.confirmationLabel,
      },
      round: projectRound(round, hasRevealedRound),
      answers,
      results,
      teamResults,
      bonus,
      bonusAvailable: game.phase === "leaderboard" && bonus === null,
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
        `SELECT pa.player_id, p.name AS player_name, pa.team_id, pa.answer, pa.locked
         FROM player_answers pa
         JOIN players p ON p.id = pa.player_id
         WHERE pa.game_id = ? AND pa.challenge_id = ? AND pa.round_index = ?`,
      ).all(fresh.id, challenge.id, fresh.challenge_round) as PlayerAnswerRow[]
      const answersByPlayer = new Map(answerRows.map((entry) => [entry.player_id, entry.answer]))
      const submittedAnswers: SubmittedPlayerAnswer[] = scoringPlayers.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        teamId: player.teamId,
        answer: answersByPlayer.get(player.id) ?? null,
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
        "UPDATE games SET phase = 'reveal', phase_ends_at = NULL WHERE id = ?",
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
        (game_id, challenge_id, round_index, player_id, team_id, answer, locked, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    )
    players.forEach((player, index) => {
      let answer: string
      if (round.kind === "number") {
        const multipliers = [1, 0.88, 1.22, 1.65]
        answer = String(Number((round.correctAnswer * multipliers[(index + game.challenge_round) % multipliers.length]).toFixed(3)))
      } else {
        const wrongChoices = round.choices.filter((choice) => choice.id !== round.correctAnswer)
        answer = index === game.challenge_round % players.length || index % 4 === 0
          ? round.correctAnswer
          : wrongChoices[(index + game.challenge_round) % wrongChoices.length].id
      }
      insert.run(
        game.id,
        challenge.id,
        game.challenge_round,
        player.id,
        player.teamId,
        answer,
        new Date().toISOString(),
      )
    })
  }

  private startAnswering(game: GameRow, durationSeconds: number): void {
    this.database.prepare(
      "UPDATE games SET phase = 'answering', phase_ends_at = ? WHERE id = ?",
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
