import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { TotemScan } from "./totem-scan.js"

describe("TotemScan identity reveal", () => {
  it("reveals the selected player portrait and team without animal-totem copy", () => {
    const markup = renderToStaticMarkup(
      <TotemScan
        identity={{
          name: "Agathe",
          imageUrl: "/players/agathe-poisson-globe.png",
          teamName: "Les Abyssaux",
        }}
        onClaim={vi.fn()}
      />,
    )

    expect(markup).toContain("Identité confirmée")
    expect(markup).toContain("Agathe")
    expect(markup).toContain("Les Abyssaux")
    expect(markup).toContain('/players/agathe-poisson-globe.png')
    expect(markup).not.toContain("Votre animal totem")
  })
})
