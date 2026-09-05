import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { TotemScan } from "./totem-scan.js"

describe("TotemScan identity reveal", () => {
  it("reveals the selected portrait, animal fact and team", () => {
    const markup = renderToStaticMarkup(
      <TotemScan
        identity={{
          name: "Agathe",
          imageUrl: "/players/agathe-poisson-globe.png",
          teamName: "Les Abyssaux",
          animalName: "le poisson-globe",
          animalFact: "Il peut se gonfler d’eau pour paraître beaucoup plus imposant face aux prédateurs.",
        }}
        onClaim={vi.fn()}
      />,
    )

    expect(markup).toContain("Identité confirmée")
    expect(markup).toContain("Agathe")
    expect(markup).toContain("Les Abyssaux")
    expect(markup).toContain('/players/agathe-poisson-globe.png')
    expect(markup).toContain("Ton animal totem est le poisson-globe")
    expect(markup).toContain("Il peut se gonfler d’eau")
    expect(markup.indexOf("Ton animal totem")).toBeLessThan(markup.indexOf("Les Abyssaux"))
  })
})
