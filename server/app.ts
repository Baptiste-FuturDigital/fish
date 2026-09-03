import path from "node:path"

import express, { type NextFunction, type Request, type Response } from "express"
import { z } from "zod"

import { GameError, type GameService } from "./game-service.js"

const createSchema = z.object({
  name: z.string(),
  hostName: z.string(),
})
const joinSchema = z.object({ name: z.string() })
const hostSchema = z.object({ hostToken: z.string() })
const playerSchema = z.object({ playerId: z.string(), playerToken: z.string() })

export function createApp(service: GameService, staticDir?: string) {
  const app = express()
  app.disable("x-powered-by")
  app.use(express.json({ limit: "16kb" }))

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" })
  })

  app.post("/api/games", (request, response) => {
    const body = createSchema.parse(request.body)
    response.status(201).json(service.createGame(body.name, body.hostName))
  })

  app.post("/api/games/:code/join", (request, response) => {
    const body = joinSchema.parse(request.body)
    response.status(201).json(service.joinGame(request.params.code, body.name))
  })

  app.get("/api/games/:code", (request, response) => {
    response.json(service.getGame(request.params.code))
  })

  app.post("/api/games/:code/totem", (request, response) => {
    const body = playerSchema.parse(request.body)
    response.json(service.claimTotem(request.params.code, body.playerId, body.playerToken))
  })

  app.post("/api/games/:code/start", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.startGame(request.params.code, body.hostToken))
  })

  app.post("/api/games/:code/next", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.nextRound(request.params.code, body.hostToken))
  })

  app.post("/api/games/:code/finish", (request, response) => {
    const body = hostSchema.parse(request.body)
    response.json(service.finishGame(request.params.code, body.hostToken))
  })

  if (staticDir) {
    const indexFile = path.join(staticDir, "index.html")
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
