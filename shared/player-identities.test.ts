import { describe, expect, it } from "vitest"

import {
  anonymousPlayerIdentity,
  invitedPlayerIdentities,
  playerIdentities,
} from "./player-identities.js"

function filenameFromImageUrl(imageUrl: string): string {
  return imageUrl.replace(/^\/players\//, "")
}

describe("player identity catalog", () => {
  it("exposes every invited player except the game master", () => {
    expect(invitedPlayerIdentities).toHaveLength(17)
    expect(invitedPlayerIdentities.map((identity) => identity.displayName)).not.toContain("Baptiste")
    expect(invitedPlayerIdentities).toContainEqual(expect.objectContaining({
      id: "agathe",
      displayName: "Agathe",
      imageUrl: "/players/agathe-poisson-globe.png",
    }))
    expect(invitedPlayerIdentities).toContainEqual(expect.objectContaining({
      id: "fabien",
      displayName: "Fabien",
      imageUrl: "/players/fabien-axolotl.webp",
    }))
  })

  it("keeps anonymous players on the shared clownfish portrait", () => {
    expect(anonymousPlayerIdentity).toEqual({
      id: "anonymous",
      displayName: "Autre invité",
      imageUrl: "/players/anonyme-poisson-clown.png",
      anonymous: true,
    })
  })

  it("maps every selectable identity to the public player asset directory", () => {
    const referencedFilenames = playerIdentities.map((identity) =>
      filenameFromImageUrl(identity.imageUrl),
    )

    expect(invitedPlayerIdentities).toHaveLength(17)
    expect(playerIdentities).toHaveLength(18)
    expect(playerIdentities.filter((identity) => identity.anonymous)).toEqual([
      anonymousPlayerIdentity,
    ])
    expect(referencedFilenames.every((filename) => filename.length > 4)).toBe(true)
    expect(referencedFilenames.some((filename) => filename.startsWith("baptiste-"))).toBe(false)
  })
})
