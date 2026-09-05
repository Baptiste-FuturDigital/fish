import path from "node:path"

import express, { type NextFunction, type Request, type Response } from "express"
import { z } from "zod"

import { GameError, type GameService } from "./game-service.js"
import { PrizeEmailUnavailableError, type PrizeType } from "./prize-email.js"
import { PrizeClaimError, type PrizeService } from "./prize-service.js"
import { toTvGameView } from "../shared/tv.js"

const createSchema = z.object({
  name: z.string(),
  hostName: z.string(),
  prankPlayerName: z.string().optional(),
})
const joinSchema = z.object({
  identityId: z.string(),
  nickname: z.string().optional(),
})
const hostSchema = z.object({ hostToken: z.string() })
const playerSchema = z.object({ playerId: z.string(), playerToken: z.string() })
const renameTeamSchema = playerSchema.extend({ name: z.string() })
const answerSchema = playerSchema.extend({
  answer: z.string(),
  locked: z.boolean().default(true),
})
const buzzResolutionSchema = hostSchema.extend({ correct: z.boolean() })
const prizeTypeSchema = z.enum(["best-player", "worst-player", "winning-team"])
const prizeClaimSchema = playerSchema.extend({ email: z.email().max(254) })

export function createApp(
  service: GameService,
  staticDir?: string,
  prizeService?: PrizeService,
) {
  const app = express()
  app.disable("x-powered-by")
  app.use(express.json({ limit: "16kb" }))

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" })
  })

  app.post("/api/games", (request, response) => {
    const body = createSchema.parse(request.body)
    response.status(201).json(service.createGame(body.name, body.hostName, body.prankPlayerName))
  })

  app.post("/api/demo", (_request, response) => {
    response.status(201).json(service.createDemoGame())
  })

  app.post("/api/games/:code/join", (request, response) => {
    const body = joinSchema.parse(request.body)
    response.status(201).json(service.joinGame(request.params.code, body))
  })

  app.get("/api/games/:code/identities", (request, response) => {
    response.json(service.listPlayerIdentities(request.params.code))
  })

  app.get("/api/games/:code", (request, response) => {
    response.json(service.getGame(request.params.code))
  })

  app.get("/api/games/:code/tv", (request, response) => {
    response.set("Cache-Control", "no-store")
    response.json(toTvGameView(service.getGame(request.params.code)))
  })

  app.post("/api/games/:code/totem", (request, response) => {
    const body = playerSchema.parse(request.body)
    response.json(service.claimTotem(request.params.code, body.playerId, body.playerToken))
  })

  app.post("/api/games/:code/teams/:teamId/name", (request, response) => {
    const body = renameTeamSchema.parse(request.body)
    response.json(service.renameTeam(
      request.params.code,
      request.params.teamId,
      body.name,
      body.playerId,
      body.playerToken,
    ))
  })

  app.post("/api/games/:code/players/:playerId/kick", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.kickPlayer(
      request.params.code,
      request.params.playerId,
      body.hostToken,
    ))
  })

  app.post("/api/games/:code/answer", (request, response) => {
    const body = answerSchema.parse(request.body)
    response.json(service.submitPlayerAnswer(
      request.params.code,
      body.playerId,
      body.playerToken,
      body.answer,
      body.locked,
    ))
  })

  app.post("/api/games/:code/buzz", (request, response) => {
    const body = playerSchema.parse(request.body)
    response.json(service.buzzQuestion(request.params.code, body.playerId, body.playerToken))
  })

  app.post("/api/games/:code/buzz/timer", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.toggleQuestionTimer(request.params.code, body.hostToken))
  })

  app.post("/api/games/:code/buzz/resolve", (request, response) => {
    const body = buzzResolutionSchema.parse(request.body)
    response.json(service.resolveQuestionBuzz(request.params.code, body.hostToken, body.correct))
  })

  app.post("/api/games/:code/jokers/fifty-fifty", (request, response) => {
    const body = playerSchema.parse(request.body)
    response.json(service.useFiftyFifty(
      request.params.code,
      body.playerId,
      body.playerToken,
    ))
  })

  app.post("/api/games/:code/start", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.startGame(request.params.code, body.hostToken))
  })

  app.post("/api/games/:code/next", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.nextRound(request.params.code, body.hostToken))
  })

  app.post("/api/games/:code/advance", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.advanceTournament(request.params.code, body.hostToken))
  })

  app.post("/api/games/:code/skip-challenge", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.skipDemoChallenge(request.params.code, body.hostToken))
  })

  app.post("/api/games/:code/bonus", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.applyPoseithonBonus(request.params.code, body.hostToken))
  })

  app.post("/api/games/:code/finish", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.finishGame(request.params.code, body.hostToken))
  })

  app.post("/api/games/:code/prizes/:prizeType/claim", async (request, response) => {
    const prizeType = prizeTypeSchema.parse(request.params.prizeType) as PrizeType
    const body = prizeClaimSchema.parse(request.body)
    if (!prizeService) throw new PrizeEmailUnavailableError()
    response.json(await prizeService.claim(
      request.params.code,
      prizeType,
      body.playerId,
      body.playerToken,
      body.email,
    ))
  })

  if (staticDir) {
    const indexFile = path.join(staticDir, "index.html")
    app.use(["/prize", "/private"], (_request, response) => {
      response.status(404).json({ error: "Trésor introuvable." })
    })
    app.use(express.static(staticDir))
    app.use((request, response, next) => {
      if (request.method !== "GET" || request.path.startsWith("/api/")) {
        next()
        return
      }
      response.sendFile(indexFile)
    })
  }

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      if (error instanceof GameError) {
        response.status(error.statusCode).json({ error: error.message })
        return
      }
      if (error instanceof PrizeClaimError) {
        response.status(error.statusCode).json({ error: error.message })
        return
      }
      if (error instanceof PrizeEmailUnavailableError) {
        response.status(503).json({ error: error.message })
        return
      }
      if (error instanceof z.ZodError) {
        response.status(400).json({ error: "Requête invalide." })
        return
      }
      console.error(error)
      response.status(500).json({ error: "La mer est agitée. Réessaie." })
    },
  )

  return app
}
