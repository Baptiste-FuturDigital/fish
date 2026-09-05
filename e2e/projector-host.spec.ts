import { expect, test } from "@playwright/test"

test("the game master can open the read-only TV screen from the lobby", async ({ page }) => {
  const created = await page.request.post("/api/games", {
    data: { name: "Aquarium TV", hostName: "Baptiste" },
  })
  expect(created.ok()).toBe(true)
  const response = await created.json() as {
    game: { code: string }
    session: Record<string, string>
  }

  await page.goto("/")
  await page.evaluate((session) => {
    localStorage.setItem("fish-tournament-session", JSON.stringify(session))
  }, response.session)
  await page.reload()

  const tvLink = page.getByRole("link", { name: "Ouvrir l’écran TV" })
  await expect(tvLink).toHaveAttribute("href", `/tv/${response.game.code}`)
  await expect(tvLink).toHaveAttribute("target", "_blank")
})
