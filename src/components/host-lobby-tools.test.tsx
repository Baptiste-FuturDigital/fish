import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { HostLobbyTools } from "./host-lobby-tools.js"

describe("HostLobbyTools", () => {
  it("explique la reprise sur le même téléphone et expose les deux actions TV", () => {
    const markup = renderToStaticMarkup(<HostLobbyTools code="fish" />)

    expect(markup).toContain("Maître du jeu · hors compétition")
    expect(markup).toContain("Cet appareil est ta console maître")
    expect(markup).toContain("Reviens sur l’adresse Fish Tournament avec ce même navigateur")
    expect(markup).toContain("Ouvrir l’écran TV")
    expect(markup).toContain("Partager l’écran TV")
  })
})
