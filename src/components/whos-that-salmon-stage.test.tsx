import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("WhosThatSalmonStage", () => {
  it("affiche directement l'image guess sans remasquer le montage", async () => {
    const { WhosThatSalmonStage } = await import("./whos-that-salmon-stage.js")
    const markup = renderToStaticMarkup(
      <WhosThatSalmonStage
        imageUrl="/game/Who&apos;s that salmon/1-guess-whale.png"
        imageAlt="Image mystère"
        revealed={false}
      />,
    )

    expect(markup).toContain("1-guess-whale.png")
    expect(markup).toContain('data-revealed="false"')
    expect(markup).toContain("whos-salmon-ocean-burst")
    expect(markup).not.toContain("is-masked")
  })

  it("révèle l’animal en couleur avec son libellé au résultat", async () => {
    const { WhosThatSalmonStage } = await import("./whos-that-salmon-stage.js")
    const markup = renderToStaticMarkup(
      <WhosThatSalmonStage
        imageUrl="/game/Who&apos;s that salmon/1-reveal-whale.png"
        imageAlt="Pikachu"
        revealed
      />,
    )

    expect(markup).toContain('data-revealed="true"')
    expect(markup).toContain("1-reveal-whale.png")
    expect(markup).toContain('alt="Pikachu"')
    expect(markup).not.toContain("is-masked")
  })
})
