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

  it("runs an intro, timed answer, reveal and next round with team scoring", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const [first, second] = joinAndClaimCompetitors(created.game.code)

    const intro = service.startGame(created.game.code, created.session.hostToken!)
    expect(intro.tournament).toEqual(expect.objectContaining({
      phase: "challenge-intro",
      challengeIndex: 0,
      roundIndex: 0,
    }))

    const answering = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(answering.tournament?.phase).toBe("answering")
    expect(answering.tournament?.round.correctAnswer).toBeUndefined()
    service.submitTeamAnswer(
      created.game.code,
      first.session.playerId,
      first.session.playerToken,
      "0.09",
      true,
    )
    service.submitTeamAnswer(
      created.game.code,
      second.session.playerId,
      second.session.playerToken,
      "1",
      true,
    )

    const revealed = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(revealed.tournament?.phase).toBe("reveal")
    expect(revealed.tournament?.round.correctAnswer).toBe(0.09)
    expect(revealed.teams.some((team) => team.score > 0)).toBe(true)

    const nextRound = service.advanceTournament(created.game.code, created.session.hostToken!)
    expect(nextRound.tournament).toEqual(expect.objectContaining({
      phase: "answering",
      challengeIndex: 0,
      roundIndex: 1,
    }))
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
    service.submitTeamAnswer(
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
  })

  it("rejects host actions with an invalid capability token", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    service.joinGame(created.game.code, "Léa")

    expect(() => service.startGame(created.game.code, "intrus")).toThrowError(
      new GameError("Seul le capitaine peut toucher à ça.", 403),
    )
  })
})
