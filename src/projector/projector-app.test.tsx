import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ProjectorApp } from "./projector-app.js"

describe("ProjectorApp", () => {
  it("propose de saisir un code quand la route TV est ouverte directement", () => {
    const markup = renderToStaticMarkup(<ProjectorApp code={null} />)

    expect(markup).toContain("Code de la partie")
    expect(markup).toContain("maxLength=\"4\"")
    expect(markup).toContain("Lancer l’écran TV")
  })
})
