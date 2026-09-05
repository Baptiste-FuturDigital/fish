import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ProjectorLaunchButton } from "./projector-launch-button.js"

describe("ProjectorLaunchButton", () => {
  it("ouvre la route TV canonique dans un nouvel onglet", () => {
    const markup = renderToStaticMarkup(<ProjectorLaunchButton code="fish" />)

    expect(markup).toContain("href=\"/tv/FISH\"")
    expect(markup).toContain("target=\"_blank\"")
    expect(markup).toContain("rel=\"noopener noreferrer\"")
    expect(markup).toContain("Ouvrir l’écran TV")
  })
})
