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
      challenge_order TEXT NOT NULL DEFAULT '[]',
      challenge_index INTEGER NOT NULL DEFAULT -1,
      challenge_round INTEGER NOT NULL DEFAULT -1,
      phase TEXT NOT NULL DEFAULT 'lobby',
      phase_ends_at TEXT,
      is_demo INTEGER NOT NULL DEFAULT 0,
      prank_player_name TEXT,
      buzz_player_id TEXT,
      buzz_team_id TEXT,
      buzz_paused_ms INTEGER,
      buzz_points INTEGER,
      buzz_blocked_team_id TEXT,
      host_token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      name TEXT NOT NULL COLLATE NOCASE,
      identity_id TEXT,
      is_host INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      totem_id INTEGER CHECK (totem_id BETWEEN 1 AND 20),
      token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(game_id, name)
    );

    CREATE TABLE IF NOT EXISTS game_teams (
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      team_id TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(game_id, team_id),
      UNIQUE(game_id, category)
    );

    CREATE TABLE IF NOT EXISTS team_answers (
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL,
      round_index INTEGER NOT NULL,
      team_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      awarded_points INTEGER,
      locked INTEGER NOT NULL DEFAULT 0,
      updated_by TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(game_id, challenge_id, round_index, team_id)
    );

    CREATE TABLE IF NOT EXISTS round_results (
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL,
      round_index INTEGER NOT NULL,
      team_id TEXT NOT NULL,
      answer TEXT,
      points INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      distance REAL,
      PRIMARY KEY(game_id, challenge_id, round_index, team_id)
    );

    CREATE TABLE IF NOT EXISTS player_answers (
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL,
      round_index INTEGER NOT NULL,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      team_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      locked INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(game_id, challenge_id, round_index, player_id),
      FOREIGN KEY(game_id, team_id) REFERENCES game_teams(game_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS player_round_results (
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL,
      round_index INTEGER NOT NULL,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      team_id TEXT NOT NULL,
      answer TEXT,
      points INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      distance REAL,
      PRIMARY KEY(game_id, challenge_id, round_index, player_id),
      FOREIGN KEY(game_id, team_id) REFERENCES game_teams(game_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS intermission_bonuses (
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      challenge_index INTEGER NOT NULL,
      challenge_id TEXT NOT NULL,
      target_team_id TEXT NOT NULL,
      points INTEGER NOT NULL CHECK (points > 0),
      created_at TEXT NOT NULL,
      PRIMARY KEY(game_id, challenge_index),
      FOREIGN KEY(game_id, target_team_id) REFERENCES game_teams(game_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS team_fifty_fifty_jokers (
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      round_index INTEGER NOT NULL,
      kept_choice_ids TEXT NOT NULL,
      used_by_player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      used_at TEXT NOT NULL,
      PRIMARY KEY(game_id, challenge_id, team_id),
      FOREIGN KEY(game_id, team_id) REFERENCES game_teams(game_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS prize_claims (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      prize_type TEXT NOT NULL CHECK (
        prize_type IN ('best-player', 'worst-player', 'winning-team')
      ),
      email TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
      provider_id TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sent_at TEXT,
      UNIQUE(game_id, player_id, prize_type)
    );
  `)

  const gameColumns = database.prepare("PRAGMA table_info(games)").all() as Array<{ name: string }>
  const addGameColumn = (name: string, definition: string) => {
    if (!gameColumns.some((column) => column.name === name)) {
      database.exec(`ALTER TABLE games ADD COLUMN ${name} ${definition}`)
    }
  }
  addGameColumn("challenge_order", "TEXT NOT NULL DEFAULT '[]'")
  addGameColumn("challenge_index", "INTEGER NOT NULL DEFAULT -1")
  addGameColumn("challenge_round", "INTEGER NOT NULL DEFAULT -1")
  addGameColumn("phase", "TEXT NOT NULL DEFAULT 'lobby'")
  addGameColumn("phase_ends_at", "TEXT")
  addGameColumn("is_demo", "INTEGER NOT NULL DEFAULT 0")
  addGameColumn("prank_player_name", "TEXT")
  addGameColumn("buzz_player_id", "TEXT")
  addGameColumn("buzz_team_id", "TEXT")
  addGameColumn("buzz_paused_ms", "INTEGER")
  addGameColumn("buzz_points", "INTEGER")
  addGameColumn("buzz_blocked_team_id", "TEXT")

  const playerColumns = database.prepare("PRAGMA table_info(players)").all() as Array<{ name: string }>
  if (!playerColumns.some((column) => column.name === "totem_id")) {
    database.exec("ALTER TABLE players ADD COLUMN totem_id INTEGER CHECK (totem_id BETWEEN 1 AND 20)")
  }
  if (!playerColumns.some((column) => column.name === "identity_id")) {
    database.exec("ALTER TABLE players ADD COLUMN identity_id TEXT")
  }
  const playerAnswerColumns = database.prepare("PRAGMA table_info(player_answers)").all() as Array<{ name: string }>
  if (!playerAnswerColumns.some((column) => column.name === "awarded_points")) {
    database.exec("ALTER TABLE player_answers ADD COLUMN awarded_points INTEGER")
  }
  database.exec("CREATE UNIQUE INDEX IF NOT EXISTS players_game_totem_unique ON players(game_id, totem_id)")
  database.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS players_game_named_identity_unique
    ON players(game_id, identity_id)
    WHERE identity_id IS NOT NULL AND identity_id <> 'anonymous'
  `)
  database.exec(`
    INSERT OR IGNORE INTO game_teams (game_id, team_id, category, name, score)
      SELECT id, 'abyssaux', 'ugly', 'Les Abyssaux', 0 FROM games;
    INSERT OR IGNORE INTO game_teams (game_id, team_id, category, name, score)
      SELECT id, 'coralliens', 'joli', 'Les Coralliens', 0 FROM games;
    INSERT OR IGNORE INTO game_teams (game_id, team_id, category, name, score)
      SELECT id, 'electriques', 'cool', 'Les Électriques', 0 FROM games;
    INSERT OR IGNORE INTO game_teams (game_id, team_id, category, name, score)
      SELECT id, 'colosses', 'big', 'Les Colosses', 0 FROM games;

    INSERT OR IGNORE INTO player_answers
      (game_id, challenge_id, round_index, player_id, team_id, answer, locked, updated_at)
      SELECT ta.game_id, ta.challenge_id, ta.round_index, ta.updated_by,
             ta.team_id, ta.answer, ta.locked, ta.updated_at
      FROM team_answers ta
      JOIN players p ON p.id = ta.updated_by AND p.game_id = ta.game_id
      WHERE p.is_host = 0;
  `)

  return database
}
