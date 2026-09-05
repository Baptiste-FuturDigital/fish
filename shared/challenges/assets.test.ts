/// <reference types="node" />

import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { challenges } from "./catalog.js"

const assetDirectory = path.resolve(process.cwd(), "assets")

describe("challenge image assets", () => {
  it("maps every local catalog image URL to a real public asset", () => {
    const imageUrls = challenges.flatMap((challenge) => [
      challenge.introImageUrl,
      challenge.presenterImageUrl,
      ...challenge.rounds.flatMap((round) => [round.imageUrl, round.revealImageUrl]),
    ]).filter((value): value is string => Boolean(value))

    expect(imageUrls.length).toBeGreaterThan(0)
    for (const imageUrl of imageUrls) {
      expect(imageUrl, `${imageUrl} must be a root-relative public URL`).toMatch(/^\//)
      const assetPath = path.join(assetDirectory, decodeURIComponent(imageUrl.slice(1)))
      expect(fs.existsSync(assetPath), `Missing challenge asset: ${assetPath}`).toBe(true)
    }
  })
})
