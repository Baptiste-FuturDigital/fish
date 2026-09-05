import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import Database from "better-sqlite3"
import { afterEach, describe, expect, it } from "vitest"

import { createDatabase } from "./db.js"

describe("database migrations", () => {
  const temporaryDirectories: string[] = []

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      fs.rmSync(directory, { force: true, recursive: true })
    }
  })

  it("persists one constrained sardine wheel per game intermission", () => {
    const database = createDatabase(":memory:")

    expect(database.prepare("PRAGMA table_info(sardine_wheels)").all())
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "game_id" }),
        expect.objectContaining({ name: "challenge_index" }),
        expect.objectContaining({ name: "winner_player_id" }),
        expect.objectContaining({ name: "status" }),
        expect.objectContaining({ name: "offered_at" }),
        expect.objectContaining({ name: "started_at" }),
        expect.objectContaining({ name: "duration_ms" }),
        expect.objectContaining({ name: "completed_at" }),
      ]))

    database.close()
  })

  it("migrates a persisted Pauline identity to Maude idempotently", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "fish-roster-migration-"))
    temporaryDirectories.push(directory)
    const filename = path.join(directory, "fish.db")
    const initial = createDatabase(filename)
    initial.prepare(
      `INSERT INTO games
        (id, code, name, status, current_round, round_order, host_token_hash, created_at)
       VALUES ('game-roster', 'MAUD', 'Invités', 'lobby', -1, '[]', 'host-hash', '2026-09-05T00:00:00.000Z')`,
    ).run()
    initial.prepare(
      `INSERT INTO players
        (id, game_id, name, identity_id, is_host, score, token_hash, created_at)
       VALUES ('player-pauline', 'game-roster', 'Pauline', 'pauline', 0, 0, 'player-hash', '2026-09-05T00:00:00.000Z')`,
    ).run()
    initial.close()

    createDatabase(filename).close()
    const migrated = createDatabase(filename)

    expect(migrated.prepare(
      "SELECT name, identity_id FROM players WHERE id = 'player-pauline'",
    ).get()).toEqual({ name: "Maude", identity_id: "maude" })
    migrated.close()
  })

  it("persists one claim per game, player and supported prize type", () => {
    const database = createDatabase(":memory:")
    database.prepare(
      `INSERT INTO games
        (id, code, name, status, current_round, round_order, host_token_hash, created_at)
       VALUES ('game-prize', 'PRIZ', 'Prix marins', 'finished', 0, '[]', 'host-hash', '2026-09-05T00:00:00.000Z')`,
    ).run()
    database.prepare(
      `INSERT INTO players
        (id, game_id, name, is_host, score, token_hash, created_at)
       VALUES ('player-prize', 'game-prize', 'Léa', 0, 42, 'player-hash', '2026-09-05T00:00:00.000Z')`,
    ).run()

    const insert = database.prepare(
      `INSERT INTO prize_claims
        (id, game_id, player_id, prize_type, email, status, created_at, updated_at)
       VALUES (?, 'game-prize', 'player-prize', ?, ?, 'pending', ?, ?)`,
    )
    const now = "2026-09-05T00:01:00.000Z"
    for (const prizeType of ["best-player", "worst-player", "winning-team"]) {
      insert.run(`claim-${prizeType}`, prizeType, `${prizeType}@example.com`, now, now)
    }

    expect(database.prepare(
      "SELECT prize_type, status FROM prize_claims ORDER BY prize_type",
    ).all()).toEqual([
      { prize_type: "best-player", status: "pending" },
      { prize_type: "winning-team", status: "pending" },
      { prize_type: "worst-player", status: "pending" },
    ])
    expect(() => insert.run(
      "claim-duplicate",
      "best-player",
      "other@example.com",
      now,
      now,
    )).toThrow(/UNIQUE constraint failed/)
    expect(() => insert.run(
      "claim-invalid",
      "treasure-chest",
      "invalid@example.com",
      now,
      now,
    )).toThrow(/CHECK constraint failed/)

    database.close()
  })

  it("adds individual answer tables and preserves a legacy player's team answer", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "fish-db-migration-"))
    temporaryDirectories.push(directory)
    const filename = path.join(directory, "fish.db")
    const legacy = new Database(filename)
    legacy.exec(`
      CREATE TABLE games (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        current_round INTEGER NOT NULL DEFAULT -1,
        round_order TEXT NOT NULL,
        challenge_order TEXT NOT NULL DEFAULT '[]',
        challenge_index INTEGER NOT NULL DEFAULT -1,
        challenge_round INTEGER NOT NULL DEFAULT -1,
        phase TEXT NOT NULL DEFAULT 'lobby',
        phase_ends_at TEXT,
        is_demo INTEGER NOT NULL DEFAULT 0,
        host_token_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE players (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        name TEXT NOT NULL COLLATE NOCASE,
        is_host INTEGER NOT NULL DEFAULT 0,
        score INTEGER NOT NULL DEFAULT 0,
        totem_id INTEGER,
        token_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(game_id, name)
      );
      CREATE TABLE team_answers (
        game_id TEXT NOT NULL,
        challenge_id TEXT NOT NULL,
        round_index INTEGER NOT NULL,
        team_id TEXT NOT NULL,
        answer TEXT NOT NULL,
        locked INTEGER NOT NULL DEFAULT 0,
        updated_by TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY(game_id, challenge_id, round_index, team_id)
      );
      INSERT INTO games VALUES (
        'game-1', 'ABCD', 'Ancienne partie', 'running', 0, '[]',
        '["le-juste-poisson"]', 0, 0, 'answering', NULL, 0, 'hash',
        '2026-09-04T00:00:00.000Z'
      );
      INSERT INTO players VALUES (
        'player-1', 'game-1', 'Léa', 0, 0, 1, 'hash',
        '2026-09-04T00:00:00.000Z'
      );
      INSERT INTO team_answers VALUES (
        'game-1', 'le-juste-poisson', 0, 'abyssaux', '42', 1,
        'player-1', '2026-09-04T00:01:00.000Z'
      );
    `)
    legacy.close()

    const migrated = createDatabase(filename)

    expect(migrated.prepare(
      `SELECT player_id, team_id, answer, locked FROM player_answers
       WHERE game_id = 'game-1'`,
    ).get()).toEqual({ player_id: "player-1", team_id: "abyssaux", answer: "42", locked: 1 })
    expect(migrated.prepare("PRAGMA table_info(games)").all())
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "prank_player_name" }),
      ]))
    expect(migrated.prepare("PRAGMA table_info(player_round_results)").all())
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "player_id" }),
        expect.objectContaining({ name: "points" }),
      ]))
    expect(migrated.prepare("PRAGMA table_info(intermission_bonuses)").all())
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "challenge_index" }),
        expect.objectContaining({ name: "target_team_id" }),
      ]))
    expect(migrated.prepare("PRAGMA table_info(team_fifty_fifty_jokers)").all())
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "team_id" }),
        expect.objectContaining({ name: "kept_choice_ids" }),
        expect.objectContaining({ name: "used_by_player_id" }),
      ]))
    const insertBonus = migrated.prepare(
      `INSERT INTO intermission_bonuses
        (game_id, challenge_index, challenge_id, target_team_id, points, created_at)
       VALUES ('game-1', 0, 'le-juste-poisson', 'abyssaux', 2, '2026-09-04T00:02:00.000Z')`,
    )
    insertBonus.run()
    expect(() => insertBonus.run()).toThrow(/UNIQUE constraint failed/)
    const insertJoker = migrated.prepare(
      `INSERT INTO team_fifty_fifty_jokers
        (game_id, challenge_id, team_id, round_index, kept_choice_ids, used_by_player_id, used_at)
       VALUES ('game-1', 'qui-veut-gagner-des-poissons', 'abyssaux', 0, '["a","b"]', 'player-1', '2026-09-04T00:03:00.000Z')`,
    )
    insertJoker.run()
    expect(() => insertJoker.run()).toThrow(/UNIQUE constraint failed/)
    migrated.close()
  })
})
