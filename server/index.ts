import path from "node:path"

import { createApp } from "./app.js"
import { createDatabase } from "./db.js"
import { GameService } from "./game-service.js"
import { createPrizeEmailSenderFromEnv } from "./prize-email-factory.js"
import { PrizeService } from "./prize-service.js"

const port = Number(process.env.PORT ?? 8787)
const database = createDatabase(process.env.FISH_DB ?? "data/fish.db")
const staticDir =
  process.env.NODE_ENV === "production"
    ? path.resolve(import.meta.dirname, "../dist")
    : undefined
const gameService = new GameService(database)
const prizeService = new PrizeService(database, createPrizeEmailSenderFromEnv())
const app = createApp(gameService, staticDir, prizeService)

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`🐟 Fish Tournament écoute sur http://localhost:${port}`)
})

function shutdown() {
  server.close(() => {
    database.close()
    process.exit(0)
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
