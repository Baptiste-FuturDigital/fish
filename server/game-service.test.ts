import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createDatabase, type GameDatabase } from "./db.js"
import { GameError, GameService } from "./game-service.js"

describe("GameService", () => {
  let database: GameDatabase
  let service: GameService

  beforeEach(() => {
    database = createDatabase(":memory:")
    service = new GameService(database)
  })

  afterEach(() => database.close())

  function joinCompetitors(code: string, names = ["Léa", "Sam"]) {
    return names.map((name) => service.joinGame(code, name))
  }

  function joinAndClaimCompetitors(code: string, names = ["Léa", "Sam"]) {
    const joined = joinCompetitors(code, names)
    for (const competitor of joined) {
      service.claimTotem(code, competitor.session.playerId, competitor.session.playerToken)
    }
    return joined
  }

  it("keeps the host as a technical identity outside the participant projection", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")

    expect(created.game.players).toEqual([])
    expect(database.prepare("SELECT name, is_host FROM players WHERE game_id = ?").get(created.game.id))
      .toEqual({ name: "Baptiste", is_host: 1 })
    expect(() => service.claimTotem(
      created.game.code,
      created.session.playerId,
      created.session.playerToken,
    )).toThrowError(new GameError("Le maître du jeu reste hors compétition.", 409))
  })

  it("requires two real players even when the host is present", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const joined = service.joinGame(created.game.code, "Léa")
    service.claimTotem(created.game.code, joined.session.playerId, joined.session.playerToken)

    expect(() => service.startGame(created.game.code, created.session.hostToken!)).toThrowError(
      new GameError("Il faut au moins deux poissons pour démarrer.", 409),
    )
  })

  it("allows twenty competitors in addition to the technical host", () => {
    const created = service.createGame("La marée bizarre", "Poséithon")
    for (let index = 1; index <= 20; index += 1) {
      service.joinGame(created.game.code, `Poisson ${index}`)
    }

    expect(service.getGame(created.game.code).players).toHaveLength(20)
    expect(() => service.joinGame(created.game.code, "Poisson 21")).toThrowError(
      new GameError("L'aquarium est complet : vingt poissons maximum.", 409),
    )
  })

  it("creates an empty participant lobby with a host capability and a short join code", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")

    expect(created.game.status).toBe("lobby")
    expect(created.game.code).toMatch(/^[A-Z2-9]{4}$/)
    expect(created.game.players).toEqual([])
    expect(created.session.hostToken).toHaveLength(48)
  })

  it("adds a guest to the same lobby", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const joined = service.joinGame(created.game.code, "Léa")

    expect(joined.game.players.map((player) => player.name)).toEqual(["Léa"])
    expect(joined.session.hostToken).toBeUndefined()
    expect(joined.session.playerToken).toHaveLength(48)
  })

  it("rejects a duplicate player name regardless of casing", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")

    expect(() => service.joinGame(created.game.code, "baptiste")).toThrowError(
      new GameError("Ce pseudo nage déjà dans ce banc.", 409),
    )
  })

  it("assigns distinct and stable totems to players", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const [first, second] = joinCompetitors(created.game.code)

    const firstClaim = service.claimTotem(
      created.game.code,
      first.session.playerId,
      first.session.playerToken,
    )
    const repeatedClaim = service.claimTotem(
      created.game.code,
      first.session.playerId,
      first.session.playerToken,
    )
    const secondClaim = service.claimTotem(
      created.game.code,
      second.session.playerId,
      second.session.playerToken,
    )

    const firstTotem = firstClaim.players.find((player) => player.id === first.session.playerId)?.totem
    const repeatedTotem = repeatedClaim.players.find((player) => player.id === first.session.playerId)?.totem
    const secondTotem = secondClaim.players.find((player) => player.id === second.session.playerId)?.totem

    expect(firstTotem).toEqual(repeatedTotem)
    expect(firstTotem?.imageUrl).not.toBe(secondTotem?.imageUrl)
    expect(firstTotem).toEqual(expect.objectContaining({ name: expect.any(String), fact: expect.any(String), teamName: expect.any(String) }))
  })

  it("reveals the private prank totem only for the configured player name", () => {
    const created = service.createGame("La marée bizarre", "Baptiste", "Axel")
    const target = service.joinGame(created.game.code, "  AXEL ")
    const other = service.joinGame(created.game.code, "Léa")

    service.claimTotem(created.game.code, target.session.playerId, target.session.playerToken)
    service.claimTotem(created.game.code, other.session.playerId, other.session.playerToken)

    const game = service.getGame(created.game.code)
    const targetPlayer = game.players.find((player) => player.id === target.session.playerId)
    const otherPlayer = game.players.find((player) => player.id === other.session.playerId)

    expect(targetPlayer?.totem).toEqual(expect.objectContaining({
      name: "l’axolotl glamour",
      imageUrl: "/totems/prank-axolotl-glamour.webp",
    }))
    expect(otherPlayer?.totem?.imageUrl).toMatch(/^\/totems\/totem-\d{2}\.jpg$/)
    expect(targetPlayer?.teamId).not.toBeNull()
    expect(JSON.stringify(game)).not.toContain("prankPlayerName")
  })

  it("balances the first four players across four teams", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    joinAndClaimCompetitors(created.game.code, ["Léa", "Sam", "Jo", "Mia"])

    const game = service.getGame(created.game.code)
    expect(game.teams).toHaveLength(4)
    expect(new Set(game.players.map((player) => player.teamId))).toHaveLength(4)
  })

  it("balances twenty players into four teams of five", () => {
    const created = service.createGame("La marée bizarre", "Capitaine")
    const competitors = joinCompetitors(
      created.game.code,
      Array.from({ length: 20 }, (_, index) => `Poisson ${index + 1}`),
    )
    for (const competitor of competitors) {
      service.claimTotem(created.game.code, competitor.session.playerId, competitor.session.playerToken)
    }

    const game = service.getGame(created.game.code)
    expect(game.teams.map((team) => team.memberIds.length).sort()).toEqual([5, 5, 5, 5])
    expect(new Set(game.players.map((player) => player.totem?.imageUrl)).size).toBe(20)
  })

  it("lets a player rename only their own team", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const [first, second] = joinAndClaimCompetitors(created.game.code)
    const firstTeamId = service.getGame(created.game.code).players
      .find((player) => player.id === first.session.playerId)?.teamId!

    const renamed = service.renameTeam(
      created.game.code,
      firstTeamId,
      "Les Moules Costaudes",
      first.session.playerId,
      first.session.playerToken,
    )
    expect(renamed.teams.find((team) => team.id === firstTeamId)?.name).toBe("Les Moules Costaudes")

    const secondTeamId = renamed.players.find((player) => player.id === second.session.playerId)?.teamId
    expect(() => service.renameTeam(
      created.game.code,
      secondTeamId!,
      "Intrusion",
      first.session.playerId,
      first.session.playerToken,
    )).toThrowError(new GameError("Tu ne peux renommer que ton propre banc.", 403))
  })

  it("limits a lobby to the twenty available totems", () => {
    const created = service.createGame("La marée bizarre", "Capitaine")
    for (let index = 1; index <= 20; index += 1) {
      service.joinGame(created.game.code, `Poisson ${index}`)
    }

    expect(() => service.joinGame(created.game.code, "Poisson 21")).toThrowError(
      new GameError("L'aquarium est complet : vingt poissons maximum.", 409),
    )
  })

  it("requires every player to claim a totem before starting", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    joinCompetitors(created.game.code)

    expect(() => service.startGame(created.game.code, created.session.hostToken!)).toThrowError(
      new GameError("Tous les poissons doivent révéler leur animal totem.", 409),
    )
  })

  it("runs multiple seeded rounds and finishes the game", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    joinAndClaimCompetitors(created.game.code)

    const started = service.startGame(
      created.game.code,
      created.session.hostToken!,
    )
    expect(started.status).toBe("running")
    expect(started.currentRound).toBe(1)
    expect(started.tournament?.challenge.title).toBe("Le juste poisson")
    expect(started.tournament?.phase).toBe("challenge-intro")

    const advanced = service.nextRound(
      created.game.code,
      created.session.hostToken!,
    )
    expect(advanced.currentRound).toBe(1)
    expect(advanced.tournament?.phase).toBe("answering")

    const finished = service.finishGame(
      created.game.code,
      created.session.hostToken!,
    )
    expect(finished.status).toBe("finished")
    expect(finished.currentPrompt).toBeNull()
  })

  it("normalizes the canonical challenge order when an existing lobby starts", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    joinAndClaimCompetitors(created.game.code)
    database.prepare("UPDATE games SET challenge_order = ? WHERE code = ?").run(
      JSON.stringify([
        "le-juste-poisson",
        "whos-dat-salmon",
        "question-pour-un-poisson",
        "qui-veut-gagner-des-poissons",
      ]),
      created.game.code,
    )

    let game = service.startGame(created.game.code, created.session.hostToken!)
    while (game.tournament?.challenge.id === "le-juste-poisson") {
      game = service.advanceTournament(created.game.code, created.session.hostToken!)
    }

    expect(game.tournament?.challenge.id).toBe("question-pour-un-poisson")
  })

  it("stores one locked answer per player and scores every player independently", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const competitors = joinAndClaimCompetitors(
      created.game.code,
      ["Léa", "Sam", "Jo", "Mia", "Noé", "Lou", "Max", "Zoé"],
    )
    const lobby = service.getGame(created.game.code)
    const sharedTeam = lobby.teams.find((team) => team.memberIds.length === 2)!
    const [firstId, secondId] = sharedTeam.memberIds
    const first = competitors.find((entry) => entry.session.playerId === firstId)!
    const second = competitors.find((entry) => entry.session.playerId === secondId)!

    const intro = service.startGame(created.game.code, created.session.hostToken!)
    expect(intro.tournament).toEqual(expect.objectContaining({
      phase: "challenge-intro",
      challengeIndex: 0,
      roundIndex: 0,
    }))

    const answering = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(answering.tournament?.phase).toBe("answering")
    expect(answering.tournament?.round.correctAnswer).toBeUndefined()
    service.submitPlayerAnswer(
      created.game.code,
      first.session.playerId,
      first.session.playerToken,
      "0.09",
      true,
    )
    service.submitPlayerAnswer(
      created.game.code,
      second.session.playerId,
      second.session.playerToken,
      "0.1",
      true,
    )

    const submitted = service.getGame(created.game.code).tournament?.answers
      .filter((answer) => answer.teamId === sharedTeam.id)
    expect(submitted).toHaveLength(2)
    expect(submitted?.map((answer) => answer.playerId).sort()).toEqual([firstId, secondId].sort())

    const revealed = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(revealed.tournament?.phase).toBe("reveal")
    expect(revealed.tournament?.round.correctAnswer).toBe(0.09)
    expect(revealed.teams.some((team) => team.score > 0)).toBe(true)
    expect(revealed.players.find((player) => player.id === first.session.playerId)?.score).toBeGreaterThan(0)
    expect(revealed.players.find((player) => player.id === second.session.playerId)?.score).toBeGreaterThan(0)
    expect(revealed.tournament?.results).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: first.session.playerId }),
      expect.objectContaining({ playerId: second.session.playerId }),
    ]))
    expect(revealed.tournament?.teamResults.length).toBe(4)

    const nextRound = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(nextRound.tournament).toEqual(expect.objectContaining({
      phase: "answering",
      challengeIndex: 0,
      roundIndex: 1,
    }))
  })

  it("runs Question pour un poisson with readable answers from submission to reveal", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const [first, second] = joinAndClaimCompetitors(created.game.code)
    service.startGame(created.game.code, created.session.hostToken!)
    database.prepare(
      `UPDATE games
       SET challenge_index = 1, challenge_round = 0, current_round = 0,
           phase = 'challenge-intro', phase_ends_at = NULL
       WHERE code = ?`,
    ).run(created.game.code)

    const answering = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(answering.tournament).toEqual(expect.objectContaining({
      phase: "answering",
      challenge: expect.objectContaining({ title: "Question pour un poisson" }),
      round: expect.objectContaining({
        question: "Combien de cœurs font circuler le sang d’un poulpe ?",
      }),
    }))
    expect(answering.tournament?.round).not.toHaveProperty("correctAnswer")

    service.submitPlayerAnswer(
      created.game.code,
      first.session.playerId,
      first.session.playerToken,
      "trois",
      true,
    )
    service.submitPlayerAnswer(
      created.game.code,
      second.session.playerId,
      second.session.playerToken,
      "neuf",
      true,
    )

    const revealed = service.advanceTournament(created.game.code, created.session.hostToken!)

    expect(revealed.tournament?.phase).toBe("reveal")
    expect(revealed.tournament?.round.answerLabel).toBe("Trois cœurs")
    expect(revealed.tournament?.results.find((result) => result.playerId === first.session.playerId)).toEqual(
      expect.objectContaining({ answer: "Trois", isCorrect: true, points: 2, playerName: "Léa" }),
    )
    expect(revealed.tournament?.results.find((result) => result.playerId === second.session.playerId)).toEqual(
      expect.objectContaining({ answer: "Neuf, un par cerveau", isCorrect: false, points: 0, playerName: "Sam" }),
    )

    const nextQuestion = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(nextQuestion.tournament).toEqual(expect.objectContaining({
      phase: "answering",
      challengeIndex: 1,
      roundIndex: 1,
      results: [],
    }))
    expect(nextQuestion.tournament?.round.correctAnswer).toBeUndefined()
  })

  it("chains all four challenges and twenty-three rounds into the final scoreboard", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    joinAndClaimCompetitors(created.game.code)

    let game = service.startGame(created.game.code, created.session.hostToken!)
    const challengeIntros: string[] = []
    const answeringRounds = new Set<string>()

    for (let step = 0; step < 60 && game.status === "running"; step += 1) {
      const tournament = game.tournament!
      if (tournament.phase === "challenge-intro") {
        challengeIntros.push(tournament.challenge.id)
      }
      if (tournament.phase === "answering") {
        answeringRounds.add(`${tournament.challenge.id}:${tournament.roundIndex}`)
      }
      game = service.advanceTournament(created.game.code, created.session.hostToken!)
    }

    expect(challengeIntros).toEqual([
      "le-juste-poisson",
      "question-pour-un-poisson",
      "whos-dat-salmon",
      "qui-veut-gagner-des-poissons",
    ])
    expect(answeringRounds.size).toBe(23)
    expect(game.status).toBe("finished")
    expect(game.tournament).toBeNull()
  })

  it("shows the leaderboard after an intermediate challenge before the next intro", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    joinAndClaimCompetitors(created.game.code)

    let game = service.startGame(created.game.code, created.session.hostToken!)
    for (let step = 0; step < 12; step += 1) {
      const tournament = game.tournament!
      if (
        tournament.challengeIndex === 0 &&
        tournament.phase === "reveal" &&
        tournament.roundIndex === tournament.roundCount - 1
      ) {
        break
      }
      game = service.advanceTournament(created.game.code, created.session.hostToken!)
    }

    const leaderboard = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(leaderboard.tournament).toEqual(expect.objectContaining({
      phase: "leaderboard",
      challengeIndex: 0,
    }))
    expect(leaderboard.tournament?.round.correctAnswer).toBeDefined()

    const nextIntro = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(nextIntro.tournament).toEqual(expect.objectContaining({
      phase: "challenge-intro",
      challengeIndex: 1,
    }))
  })

  it("lets only the host grant one comeback bonus to the deterministic last-place team", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    joinAndClaimCompetitors(created.game.code, ["Léa", "Sam", "Jo", "Mia"])
    database.prepare(
      `UPDATE game_teams
       SET score = CASE team_id
         WHEN 'abyssaux' THEN 5
         WHEN 'coralliens' THEN 1
         WHEN 'electriques' THEN 1
         ELSE 8
       END,
       name = CASE team_id
         WHEN 'coralliens' THEN 'Les Zèbres'
         WHEN 'electriques' THEN 'Les Anchois'
         ELSE name
       END
       WHERE game_id = ?`,
    ).run(created.game.id)

    let game = service.startGame(created.game.code, created.session.hostToken!)
    for (let step = 0; step < 20 && game.tournament?.phase !== "leaderboard"; step += 1) {
      game = service.advanceTournament(created.game.code, created.session.hostToken!)
    }

    expect(game.tournament).toEqual(expect.objectContaining({
      phase: "leaderboard",
      bonus: null,
      bonusAvailable: true,
    }))
    const originalPlayerScores = game.players.map((player) => player.score)

    const rewarded = service.applyPoseithonBonus(created.game.code, created.session.hostToken!)

    expect(rewarded.tournament).toEqual(expect.objectContaining({
      bonusAvailable: false,
      bonus: expect.objectContaining({
        challengeIndex: 0,
        teamId: "electriques",
        points: 2,
      }),
    }))
    expect(rewarded.teams.find((team) => team.id === "electriques")?.score).toBe(3)
    expect(rewarded.players.map((player) => player.score)).toEqual(originalPlayerScores)
    expect(() => service.applyPoseithonBonus(created.game.code, created.session.hostToken!))
      .toThrowError(new GameError("La Marée de Poséithon a déjà frappé pendant cette escale.", 409))
    expect(service.getGame(created.game.code).teams.find((team) => team.id === "electriques")?.score).toBe(3)
  })

  it("rejects the comeback bonus outside an intermission and from invalid hosts", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    joinAndClaimCompetitors(created.game.code)
    service.startGame(created.game.code, created.session.hostToken!)

    expect(() => service.applyPoseithonBonus(created.game.code, "intrus"))
      .toThrowError(new GameError("Seul le capitaine peut toucher à ça.", 403))
    expect(() => service.applyPoseithonBonus(created.game.code, created.session.hostToken!))
      .toThrowError(new GameError("La Marée de Poséithon ne peut surgir qu'entre deux épreuves.", 409))
  })

  it("never grants the comeback bonus to an empty team", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    joinAndClaimCompetitors(created.game.code, ["Léa", "Sam"])
    const lobby = service.getGame(created.game.code)
    const occupiedTeams = lobby.teams.filter((team) => team.memberIds.length > 0)
    const emptyTeamIds = lobby.teams
      .filter((team) => team.memberIds.length === 0)
      .map((team) => team.id)
    expect(occupiedTeams).toHaveLength(2)
    expect(emptyTeamIds).toHaveLength(2)
    database.prepare("UPDATE game_teams SET score = 0 WHERE game_id = ?").run(created.game.id)
    database.prepare("UPDATE game_teams SET score = 5 WHERE game_id = ? AND team_id = ?")
      .run(created.game.id, occupiedTeams[0].id)
    database.prepare("UPDATE game_teams SET score = 3 WHERE game_id = ? AND team_id = ?")
      .run(created.game.id, occupiedTeams[1].id)

    let game = service.startGame(created.game.code, created.session.hostToken!)
    for (let step = 0; step < 20 && game.tournament?.phase !== "leaderboard"; step += 1) {
      game = service.advanceTournament(created.game.code, created.session.hostToken!)
    }
    const rewarded = service.applyPoseithonBonus(created.game.code, created.session.hostToken!)

    expect(rewarded.tournament?.bonus?.teamId).toBe(occupiedTeams[1].id)
    expect(emptyTeamIds).not.toContain(rewarded.tournament?.bonus?.teamId)
  })

  it("finishes directly after the fourth challenge final reveal", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    joinAndClaimCompetitors(created.game.code)

    let game = service.startGame(created.game.code, created.session.hostToken!)
    for (let step = 0; step < 80; step += 1) {
      const tournament = game.tournament!
      if (
        tournament.challengeIndex === tournament.challengeCount - 1 &&
        tournament.phase === "reveal" &&
        tournament.roundIndex === tournament.roundCount - 1
      ) {
        break
      }
      game = service.advanceTournament(created.game.code, created.session.hostToken!)
    }

    const finished = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(finished.status).toBe("finished")
    expect(finished.tournament).toBeNull()
  })

  it("reveals and scores an expired round only once", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const [first] = joinAndClaimCompetitors(created.game.code)
    service.startGame(created.game.code, created.session.hostToken!)
    service.advanceTournament(created.game.code, created.session.hostToken!)
    service.submitPlayerAnswer(
      created.game.code,
      first.session.playerId,
      first.session.playerToken,
      "0.09",
      true,
    )
    database.prepare("UPDATE games SET phase_ends_at = ? WHERE code = ?")
      .run("2000-01-01T00:00:00.000Z", created.game.code)

    const firstSnapshot = service.getGame(created.game.code)
    const secondSnapshot = service.getGame(created.game.code)
    expect(firstSnapshot.tournament?.phase).toBe("reveal")
    expect(secondSnapshot.teams.map((team) => team.score)).toEqual(firstSnapshot.teams.map((team) => team.score))
    expect(secondSnapshot.players.map((player) => player.score)).toEqual(
      firstSnapshot.players.map((player) => player.score),
    )
  })

  it("rejects host actions with an invalid capability token", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    service.joinGame(created.game.code, "Léa")

    expect(() => service.startGame(created.game.code, "intrus")).toThrowError(
      new GameError("Seul le capitaine peut toucher à ça.", 403),
    )
  })

  it("consumes one deterministic 50/50 joker per team for the whole final challenge", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const competitors = joinAndClaimCompetitors(
      created.game.code,
      ["Léa", "Sam", "Jo", "Mia", "Noé", "Lou", "Max", "Zoé"],
    )
    const lobby = service.getGame(created.game.code)
    const sharedTeam = lobby.teams.find((team) => team.memberIds.length === 2)!
    const otherTeam = lobby.teams.find((team) => team.id !== sharedTeam.id && team.memberIds.length > 0)!
    const first = competitors.find((entry) => entry.session.playerId === sharedTeam.memberIds[0])!
    const teammate = competitors.find((entry) => entry.session.playerId === sharedTeam.memberIds[1])!
    const opponent = competitors.find((entry) => entry.session.playerId === otherTeam.memberIds[0])!

    service.startGame(created.game.code, created.session.hostToken!)
    database.prepare(
      `UPDATE games SET challenge_index = 3, challenge_round = 0, current_round = 0,
       phase = 'answering', phase_ends_at = ? WHERE code = ?`,
    ).run(new Date(Date.now() + 30_000).toISOString(), created.game.code)

    const used = service.useFiftyFifty(
      created.game.code,
      first.session.playerId,
      first.session.playerToken,
    )
    const joker = used.tournament?.fiftyFiftyJokers.find((entry) => entry.teamId === sharedTeam.id)
    expect(joker).toEqual(expect.objectContaining({
      teamId: sharedTeam.id,
      roundIndex: 0,
      keptChoiceIds: expect.arrayContaining(["requin-baleine"]),
    }))
    expect(joker?.keptChoiceIds).toHaveLength(2)

    expect(() => service.useFiftyFifty(
      created.game.code,
      teammate.session.playerId,
      teammate.session.playerToken,
    )).toThrowError(new GameError("Ton banc a déjà utilisé son joker 50/50.", 409))

    const opponentUse = service.useFiftyFifty(
      created.game.code,
      opponent.session.playerId,
      opponent.session.playerToken,
    )
    expect(opponentUse.tournament?.fiftyFiftyJokers).toHaveLength(2)
  })

  it("rejects 50/50 outside the final challenge", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const [competitor] = joinAndClaimCompetitors(created.game.code)
    service.startGame(created.game.code, created.session.hostToken!)
    service.advanceTournament(created.game.code, created.session.hostToken!)

    expect(() => service.useFiftyFifty(
      created.game.code,
      competitor.session.playerId,
      competitor.session.playerToken,
    )).toThrowError(new GameError("Le joker 50/50 n'est disponible que pendant Qui veut gagner des poissons.", 409))
  })
})
