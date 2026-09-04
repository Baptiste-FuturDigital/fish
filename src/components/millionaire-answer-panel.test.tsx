import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MillionaireAnswerPanel } from "./millionaire-answer-panel.js"

const choices = [
  { id: "a", label: "Anchois" },
  { id: "b", label: "Baleine" },
  { id: "c", label: "Calamar" },
  { id: "d", label: "Dauphin" },
]

describe("MillionaireAnswerPanel", () => {
  it("shows an available 50/50 joker before a choice", () => {
    const html = renderToStaticMarkup(
      <MillionaireAnswerPanel
        choices={choices}
        value=""
        confirmationLabel="C’est mon dernier mot"
        busy={false}
        joker={{ available: true, keptChoiceIds: null }}
        jokerBusy={false}
        onUseFiftyFifty={vi.fn()}
        onValueChange={vi.fn()}
      />,
    )

    expect(html).toContain("Joker 50/50")
    expect(html.match(/data-choice-id=/g)).toHaveLength(4)
  })

  it("renders only the two choices kept by the server after the joker", () => {
    const html = renderToStaticMarkup(
      <MillionaireAnswerPanel
        choices={choices}
        value=""
        confirmationLabel="C’est mon dernier mot"
        busy={false}
        joker={{ available: false, keptChoiceIds: ["a", "c"] }}
        jokerBusy={false}
        onUseFiftyFifty={vi.fn()}
        onValueChange={vi.fn()}
      />,
    )

    expect(html).toContain("Joker utilisé")
    expect(html).toContain("Anchois")
    expect(html).toContain("Calamar")
    expect(html).not.toContain("Baleine")
    expect(html).not.toContain("Dauphin")
    expect(html.match(/data-choice-id=/g)).toHaveLength(2)
  })
})
