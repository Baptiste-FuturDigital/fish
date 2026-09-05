import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  buildProjectorUrl,
  ProjectorShareButton,
  shareProjectorUrl,
} from "./projector-share-button.js"

describe("ProjectorShareButton", () => {
  it("construit l’URL TV absolue sans secret maître", () => {
    expect(buildProjectorUrl("fish", "https://party.example")).toBe(
      "https://party.example/tv/FISH",
    )
  })

  it("utilise le partage natif quand il est disponible", async () => {
    const share = vi.fn(async () => undefined)
    const writeText = vi.fn(async () => undefined)

    await expect(shareProjectorUrl("fish", { share, writeText }, "https://party.example"))
      .resolves.toBe("shared")
    expect(share).toHaveBeenCalledWith({
      title: "Fish Tournament · écran TV",
      text: "Ouvre cette vue sur la télévision.",
      url: "https://party.example/tv/FISH",
    })
    expect(writeText).not.toHaveBeenCalled()
  })

  it("copie le lien quand le partage natif est indisponible", async () => {
    const writeText = vi.fn(async () => undefined)

    await expect(shareProjectorUrl("fish", { writeText }, "https://party.example"))
      .resolves.toBe("copied")
    expect(writeText).toHaveBeenCalledWith("https://party.example/tv/FISH")
  })

  it("affiche une action explicite pour la télévision", () => {
    const markup = renderToStaticMarkup(<ProjectorShareButton code="fish" />)

    expect(markup).toContain("Partager l’écran TV")
    expect(markup).toContain("button")
  })
})
