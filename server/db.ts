import fs from "node:fs"
import path from "node:path"

import Database from "better-sqlite3"

export type GameDatabase = Database.Database

export function createDatabase(filename = "data/fish.db"): GameDatabase {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(filename), { recursive: true })
  }

  const database = new Database(filename)
  database.pragma("journal_mode = WAL")
  database.pragma("foreign_keys = ON")
  database.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('lobby', 'running', 'finished')),
      current_round INTEGER NOT NULL DEFAULT -1,
      round_order TEXT NOT NULL,
      host_token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      name TEXT NOT NULL COLLATE NOCASE,
      is_host INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      totem_id INTEGER CHECK (totem_id BETWEEN 1 AND 20),
      token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(game_id, name)
    );
  `)

  const playerColumns = database.prepare("PRAGMA table_info(players)").all() as Array<{ name: string }>
  if (!playerColumns.some((column) => column.name === "totem_id")) {
    database.exec("ALTER TABLE players ADD COLUMN totem_id INTEGER CHECK (totem_id BETWEEN 1 AND 20)")
  }
  database.exec("CREATE UNIQUE INDEX IF NOT EXISTS players_game_totem_unique ON players(game_id, totem_id)")

  return database
}
