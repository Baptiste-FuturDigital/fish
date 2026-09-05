import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PlayerPortraitLightbox } from "./player-portrait-lightbox.js"

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
})
