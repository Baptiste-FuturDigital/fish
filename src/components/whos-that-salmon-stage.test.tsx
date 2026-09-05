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

  it("fait exploser les vingt points d'une bonne réponse sans masquer l'image", async () => {
    const { WhosThatSalmonStage } = await import("./whos-that-salmon-stage.js")
    const markup = renderToStaticMarkup(
      <WhosThatSalmonStage
        imageUrl="/game/Who&apos;s that salmon/1-reveal-whale.png"
        imageAlt="Pikachu"
        revealed
        playerResult={{ isCorrect: true, points: 2 }}
      />,
    )

    expect(markup).toContain('data-result="correct"')
    expect(markup).toContain("+20 points")
    expect(markup).toContain('role="status"')
  })

  it("affiche une croix rouge animée après une mauvaise réponse", async () => {
    const { WhosThatSalmonStage } = await import("./whos-that-salmon-stage.js")
    const markup = renderToStaticMarkup(
      <WhosThatSalmonStage
        imageUrl="/game/Who&apos;s that salmon/1-reveal-whale.png"
        imageAlt="Pikachu"
        revealed
        playerResult={{ isCorrect: false, points: 0 }}
      />,
    )

    expect(markup).toContain('data-result="wrong"')
    expect(markup).toContain("Réponse incorrecte")
    expect(markup).not.toContain("+0 points")
  })
})
