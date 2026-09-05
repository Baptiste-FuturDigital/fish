import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { PlayerView } from "@shared/game"
import {
  PlayerPortraitLightbox,
  portraitPlayerFromView,
} from "./player-portrait-lightbox.js"

const basePlayer: PlayerView = {
  id: "alice",
  name: "Alice",
  isHost: false,
  score: 70,
  teamId: "coraux",
  totem: null,
}

describe("PlayerPortraitLightbox", () => {
  it("affiche la photo, le nom et l'animal comme dans le lobby TV", () => {
    const markup = renderToStaticMarkup(
      <PlayerPortraitLightbox
        player={{
          name: "Alice",
          imageUrl: "/players/alice-requin.jpg",
          animalName: "Requin marteau",
        }}
        onClose={() => undefined}
      />,
    )

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('src="/players/alice-requin.jpg"')
    expect(markup).toContain("Alice")
    expect(markup).toContain("Requin marteau")
    expect(markup).toContain('aria-label="Fermer le portrait"')
  })

  it("construit un portrait depuis la photo du joueur puis son totem", () => {
    const totem = {
      name: "Requin marteau",
      fact: "Fait marin",
      teamName: "Les Coraux",
      imageUrl: "/totems/alice.jpg",
    }

    expect(portraitPlayerFromView({
      ...basePlayer,
      imageUrl: "/players/alice.jpg",
      animalName: "Raie manta",
      totem,
    })).toEqual({
      name: "Alice",
      imageUrl: "/players/alice.jpg",
      animalName: "Raie manta",
    })
    expect(portraitPlayerFromView({ ...basePlayer, totem })).toEqual({
      name: "Alice",
      imageUrl: "/totems/alice.jpg",
      animalName: "Requin marteau",
    })
    expect(portraitPlayerFromView(basePlayer)).toBeNull()
  })
})
