import { describe, expect, it } from "vitest"

import { totems } from "./totems.js"
import { selectBalancedTotem } from "./totem-assignment.js"

describe("balanced totem assignment", () => {
  it("always chooses a totem from a least-populated category", () => {
    const selected = selectBalancedTotem(
      totems,
      ["ugly", "ugly", "joli", "cool"],
      () => 0,
    )
    expect(selected.category).toBe("big")
  })

  it("never returns an already-used totem", () => {
    const available = totems.filter((totem) => totem.id !== 1)
    const selected = selectBalancedTotem(available, ["ugly"], () => 0)
    expect(selected.id).not.toBe(1)
  })
})
