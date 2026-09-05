import { expect, test } from "@playwright/test"

test("the host controls music and the player sees the salmon result burst", async ({ browser, page }) => {
  const created = await page.request.post("/api/demo")
  expect(created.ok()).toBe(true)
  const payload = await created.json() as {
    game: { code: string; tournament: { challenge: { id: string }; phase: string } }
    session: { gameCode: string; hostToken: string }
    demoPlayerSession: { gameCode: string; playerId: string; playerToken: string }
  }
  let game = payload.game

  for (let step = 0; step < 40 && game.tournament.challenge.id !== "whos-dat-salmon"; step += 1) {
    const response = await page.request.post(`/api/games/${game.code}/advance`, {
      data: { hostToken: payload.session.hostToken },
    })
    expect(response.ok()).toBe(true)
    game = await response.json()
  }
  expect(game.tournament.challenge.id).toBe("whos-dat-salmon")
  expect(game.tournament.phase).toBe("challenge-intro")

  await page.addInitScript((session) => {
    localStorage.setItem("fish-tournament-session", JSON.stringify(session))
  }, payload.session)
  await page.goto("/")
  await expect(page.getByTestId("game-context-title")).toHaveText("Who's that salmon ?")

  const playerContext = await browser.newContext()
  await playerContext.addInitScript((session) => {
    localStorage.setItem("fish-tournament-session", JSON.stringify(session))
  }, payload.demoPlayerSession)
  const playerPage = await playerContext.newPage()
  await playerPage.goto("/")

  await page.getByRole("button", { name: "Lancer l'épreuve" }).click()
  await expect(page.locator(".whos-salmon-frame")).toHaveAttribute("src", /1-guess-whale\.png/)
  await expect(page.getByRole("button", { name: "Révéler la réponse" })).toBeVisible()
  await expect(page.getByTestId("salmon-background-music-player")).toHaveAttribute("src", /3pPR6IOV7Rg/)
  await expect(page.getByTestId("salmon-guess-jingle-player")).toHaveAttribute("src", /FsvGm4pqlW8/)
  await expect(page.getByText(/^(30|29)s$/)).toBeVisible()

  await page.getByRole("button", { name: "Couper la musique Pokémon" }).click()
  await expect(page.getByRole("button", { name: "Relancer la musique Pokémon" })).toHaveAttribute("aria-pressed", "true")

  await page.getByRole("button", { name: "Révéler la réponse" }).click()
  await expect(page.locator(".whos-salmon-frame")).toHaveAttribute("src", /1-reveal-whale\.png/)
  await expect(page.getByRole("button", { name: "Image suivante" })).toBeVisible()
  await expect(playerPage.locator('[data-result="correct"]')).toContainText("+20 points")

  await page.getByRole("button", { name: "Image suivante" }).click()
  await expect(page.locator(".whos-salmon-frame")).toHaveAttribute("src", /2-guess-mantis-shrimp\.png/)
  await expect(page.getByRole("button", { name: "Relancer la musique Pokémon" })).toHaveAttribute("aria-pressed", "true")
  await playerContext.close()
})
