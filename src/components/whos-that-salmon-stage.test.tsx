import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("WhosThatSalmonStage", () => {
  it("affiche la scène, le titre exact et une silhouette inconnue pendant la réponse", async () => {
    const { WhosThatSalmonStage } = await import("./whos-that-salmon-stage.js")
    const markup = renderToStaticMarkup(
      <WhosThatSalmonStage
        imageUrl="/hippocampe-cutout.png"
        imageAlt="L’hippocampe"
        revealed={false}
      />,
    )

    expect(markup).toContain('src="/whos-that-salmon-stage.png"')
    expect(markup).toContain('src="/hippocampe-cutout.png"')
    expect(markup.replace(/<[^>]+>/g, "")).toContain("WHO’S THAT SALMON ?")
    expect(markup).toContain("is-masked")
    expect(markup).toContain("whos-salmon-mystery")
    expect(markup).not.toContain("L’hippocampe")
  })

  it("révèle l’animal en couleur avec son libellé au résultat", async () => {
    const { WhosThatSalmonStage } = await import("./whos-that-salmon-stage.js")
    const markup = renderToStaticMarkup(
      <WhosThatSalmonStage
        imageUrl="/hippocampe-cutout.png"
        imageAlt="L’hippocampe"
        revealed
      />,
    )

    expect(markup).toContain('data-revealed="true"')
    expect(markup).toContain('alt="L’hippocampe"')
    expect(markup).not.toContain("is-masked")
    expect(markup).not.toContain("whos-salmon-mystery")
  })
})
