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

  it("creates a lobby with a host and a short join code", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")

    expect(created.game.status).toBe("lobby")
    expect(created.game.code).toMatch(/^[A-Z2-9]{4}$/)
    expect(created.game.players).toEqual([
      expect.objectContaining({ name: "Baptiste", isHost: true }),
    ])
    expect(created.session.hostToken).toHaveLength(48)
  })

  it("adds a guest to the same lobby", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const joined = service.joinGame(created.game.code, "Léa")

    expect(joined.game.players.map((player) => player.name)).toEqual([
      "Baptiste",
      "Léa",
    ])
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
    const joined = service.joinGame(created.game.code, "Léa")

    const hostClaim = service.claimTotem(
      created.game.code,
      created.session.playerId,
      created.session.playerToken,
    )
    const repeatedClaim = service.claimTotem(
      created.game.code,
      created.session.playerId,
      created.session.playerToken,
    )
    const guestClaim = service.claimTotem(
      created.game.code,
      joined.session.playerId,
      joined.session.playerToken,
    )

    const hostTotem = hostClaim.players.find((player) => player.id === created.session.playerId)?.totem
    const repeatedTotem = repeatedClaim.players.find((player) => player.id === created.session.playerId)?.totem
    const guestTotem = guestClaim.players.find((player) => player.id === joined.session.playerId)?.totem

    expect(hostTotem).toEqual(repeatedTotem)
    expect(hostTotem?.imageUrl).not.toBe(guestTotem?.imageUrl)
    expect(hostTotem).toEqual(expect.objectContaining({ name: expect.any(String), fact: expect.any(String), teamName: expect.any(String) }))
  })

  it("balances the first four players across four teams", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const sessions = [created.session]
    for (const name of ["Léa", "Sam", "Jo"]) {
      sessions.push(service.joinGame(created.game.code, name).session)
    }
    for (const session of sessions) {
      service.claimTotem(created.game.code, session.playerId, session.playerToken)
    }

    const game = service.getGame(created.game.code)
    expect(game.teams).toHaveLength(4)
    expect(new Set(game.players.map((player) => player.teamId))).toHaveLength(4)
  })

  it("balances twenty players into four teams of five", () => {
    const created = service.createGame("La marée bizarre", "Capitaine")
    const sessions = [created.session]
    for (let index = 1; index < 20; index += 1) {
      sessions.push(service.joinGame(created.game.code, `Poisson ${index}`).session)
    }
    for (const session of sessions) {
      service.claimTotem(created.game.code, session.playerId, session.playerToken)
    }

    const game = service.getGame(created.game.code)
    expect(game.teams.map((team) => team.memberIds.length).sort()).toEqual([5, 5, 5, 5])
    expect(new Set(game.players.map((player) => player.totem?.imageUrl)).size).toBe(20)
  })

  it("lets a player rename only their own team", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const joined = service.joinGame(created.game.code, "Léa")
    service.claimTotem(created.game.code, created.session.playerId, created.session.playerToken)
    service.claimTotem(created.game.code, joined.session.playerId, joined.session.playerToken)
    const hostTeamId = service.getGame(created.game.code).players[0].teamId!

    const renamed = service.renameTeam(
      created.game.code,
      hostTeamId,
      "Les Moules Costaudes",
      created.session.playerId,
      created.session.playerToken,
    )
    expect(renamed.teams.find((team) => team.id === hostTeamId)?.name).toBe("Les Moules Costaudes")

    const guestTeamId = renamed.players.find((player) => player.id === joined.session.playerId)?.teamId
    expect(() => service.renameTeam(
      created.game.code,
      guestTeamId!,
      "Intrusion",
      created.session.playerId,
      created.session.playerToken,
    )).toThrowError(new GameError("Tu ne peux renommer que ton propre banc.", 403))
  })

  it("limits a lobby to the twenty available totems", () => {
    const created = service.createGame("La marée bizarre", "Capitaine")
    for (let index = 1; index < 20; index += 1) {
      service.joinGame(created.game.code, `Poisson ${index}`)
    }

    expect(() => service.joinGame(created.game.code, "Poisson 20")).toThrowError(
      new GameError("L'aquarium est complet : vingt poissons maximum.", 409),
    )
  })

  it("requires every player to claim a totem before starting", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    service.joinGame(created.game.code, "Léa")

    expect(() => service.startGame(created.game.code, created.session.hostToken!)).toThrowError(
      new GameError("Tous les poissons doivent révéler leur animal totem.", 409),
    )
  })

  it("runs multiple seeded rounds and finishes the game", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const joined = service.joinGame(created.game.code, "Léa")
    service.claimTotem(created.game.code, created.session.playerId, created.session.playerToken)
    service.claimTotem(created.game.code, joined.session.playerId, joined.session.playerToken)

    const started = service.startGame(
      created.game.code,
      created.session.hostToken!,
    )
    expect(started.status).toBe("running")
    expect(started.currentRound).toBe(1)
    expect(started.tournament?.challenge.title).toBe("Le Juste Poisson")
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

  it("runs an intro, timed answer, reveal and next round with team scoring", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const joined = service.joinGame(created.game.code, "Léa")
    service.claimTotem(created.game.code, created.session.playerId, created.session.playerToken)
    service.claimTotem(created.game.code, joined.session.playerId, joined.session.playerToken)

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
      created.session.playerId,
      created.session.playerToken,
      "0.09",
      true,
    )
    service.submitTeamAnswer(
      created.game.code,
      joined.session.playerId,
      joined.session.playerToken,
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
    const joined = service.joinGame(created.game.code, "Léa")
    service.claimTotem(created.game.code, created.session.playerId, created.session.playerToken)
    service.claimTotem(created.game.code, joined.session.playerId, joined.session.playerToken)

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
      "whos-dat-salmon",
      "question-pour-un-poisson",
      "qui-veut-gagner-des-poissons",
    ])
    expect(answeringRounds.size).toBe(23)
    expect(game.status).toBe("finished")
    expect(game.tournament).toBeNull()
  })

  it("reveals and scores an expired round only once", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    const joined = service.joinGame(created.game.code, "Léa")
    service.claimTotem(created.game.code, created.session.playerId, created.session.playerToken)
    service.claimTotem(created.game.code, joined.session.playerId, joined.session.playerToken)
    service.startGame(created.game.code, created.session.hostToken!)
    service.advanceTournament(created.game.code, created.session.hostToken!)
    service.submitTeamAnswer(
      created.game.code,
      created.session.playerId,
      created.session.playerToken,
      "0.09",
      true,
    )
    database.prepare("UPDATE games SET phase_ends_at = ? WHERE code = ?")
      .run("2000-01-01T00:00:00.000Z", created.game.code)

    const first = service.getGame(created.game.code)
    const second = service.getGame(created.game.code)
    expect(first.tournament?.phase).toBe("reveal")
    expect(second.teams.map((team) => team.score)).toEqual(first.teams.map((team) => team.score))
  })

  it("rejects host actions with an invalid capability token", () => {
    const created = service.createGame("La marée bizarre", "Baptiste")
    service.joinGame(created.game.code, "Léa")

    expect(() => service.startGame(created.game.code, "intrus")).toThrowError(
      new GameError("Seul le capitaine peut toucher à ça.", 403),
    )
  })
})
