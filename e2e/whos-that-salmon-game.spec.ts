import { expect, test } from "@playwright/test"

test("the host reveals and advances through the paired salmon images", async ({ page }) => {
  const created = await page.request.post("/api/demo")
  expect(created.ok()).toBe(true)
  const payload = await created.json() as {
    game: { code: string; tournament: { challenge: { id: string }; phase: string } }
    session: { gameCode: string; hostToken: string }
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

  await page.getByRole("button", { name: "Lancer l'épreuve" }).click()
  await expect(page.locator(".whos-salmon-frame")).toHaveAttribute("src", /1-guess-whale\.png/)
  await expect(page.getByRole("button", { name: "Révéler la réponse" })).toBeVisible()
  await expect(page.getByTestId("salmon-background-music-player")).toHaveAttribute("src", /3pPR6IOV7Rg/)
  await expect(page.getByTestId("salmon-guess-jingle-player")).toHaveAttribute("src", /FsvGm4pqlW8/)

  await page.getByRole("button", { name: "Révéler la réponse" }).click()
  await expect(page.locator(".whos-salmon-frame")).toHaveAttribute("src", /1-reveal-whale\.png/)
  await expect(page.getByRole("button", { name: "Image suivante" })).toBeVisible()

  await page.getByRole("button", { name: "Image suivante" }).click()
  await expect(page.locator(".whos-salmon-frame")).toHaveAttribute("src", /2-guess-mantis-shrimp\.png/)
})
