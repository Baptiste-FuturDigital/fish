import { existsSync, readdirSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  invitedPlayerIdentities,
  playerIdentities,
} from "../shared/player-identities.js"

const playerAssetDirectory = path.resolve(process.cwd(), "assets/players")

describe("player identity assets", () => {
  it("matches the selectable catalog to the real portraits", () => {
    const referenced = playerIdentities
      .map((identity) => identity.imageUrl.replace(/^\/players\//, ""))
      .sort()
    const selectable = readdirSync(playerAssetDirectory)
      .filter((filename) => filename !== ".DS_Store")
      .filter((filename) => !filename.startsWith("baptiste-"))
      .sort()

    expect(invitedPlayerIdentities).toHaveLength(17)
    expect(playerIdentities).toHaveLength(18)
    expect(referenced).toEqual(selectable)
    referenced.forEach((filename) => {
      expect(existsSync(path.join(playerAssetDirectory, filename)), filename).toBe(true)
    })
  })
})
