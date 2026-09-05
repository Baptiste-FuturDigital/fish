import { expect, test } from "@playwright/test"

test("an invited player chooses their identity and reveals their own portrait", async ({ page }) => {
  test.setTimeout(40_000)
  const created = await page.request.post("/api/games", {
    data: { name: "Aquarium des invités", hostName: "Baptiste" },
  })
  expect(created.ok()).toBe(true)
  const { game } = await created.json() as { game: { code: string } }

  await page.goto(`/?code=${game.code}`)
  await page.getByLabel("Qui es-tu ?").click()
  await page.getByRole("option", { name: "Agathe" }).click()
  await page.getByRole("button", { name: "Plonger dans la partie" }).click()

  await expect(page.getByRole("button", { name: "Scanner mon visage" })).toBeVisible()
  await page.getByRole("button", { name: "Scanner mon visage" }).click()
  await expect(page.getByTestId("totem-materializing-image")).toHaveAttribute(
    "src",
    "/players/agathe-poisson-globe.png",
    { timeout: 12_000 },
  )
  await expect(page.getByText("Identité confirmée", { exact: true })).toBeVisible({ timeout: 12_000 })
  await expect(page.getByTestId("totem-reveal-image")).toHaveAttribute("alt", "Agathe")
})

test("anonymous players enter a free nickname and share the clownfish portrait", async ({ page }) => {
  const created = await page.request.post("/api/games", {
    data: { name: "Aquarium des anonymes", hostName: "Baptiste" },
  })
  const { game } = await created.json() as { game: { code: string } }

  await page.goto(`/?code=${game.code}`)
  await page.getByLabel("Qui es-tu ?").click()
  await page.getByRole("option", { name: "Autre invité" }).click()
  await expect(page.getByLabel("Ton pseudo")).toBeVisible()
  await page.getByLabel("Ton pseudo").fill("Capitaine Haddock")
  await page.getByRole("button", { name: "Plonger dans la partie" }).click()

  const session = await page.evaluate(() => JSON.parse(localStorage.getItem("fish-tournament-session") ?? "null"))
  const response = await page.request.post(`/api/games/${game.code}/totem`, {
    data: { playerId: session.playerId, playerToken: session.playerToken },
  })
  expect(response.ok()).toBe(true)
  const state = await response.json()
  expect(state.players[0]).toEqual(expect.objectContaining({
    name: "Capitaine Haddock",
    imageUrl: "/players/anonyme-poisson-clown.png",
  }))
})

test("the identity dropdown hides portraits and disables an occupied invitation", async ({ page }) => {
  const created = await page.request.post("/api/games", {
    data: { name: "Aquarium des réservations", hostName: "Baptiste" },
  })
  const { game } = await created.json() as { game: { code: string } }
  await page.request.post(`/api/games/${game.code}/join`, { data: { identityId: "agathe" } })

  await page.goto(`/?code=${game.code}`)
  await page.getByLabel("Qui es-tu ?").click()

  const occupied = page.getByRole("option", { name: /Agathe · déjà à bord/ })
  await expect(occupied).toHaveAttribute("aria-disabled", "true")
  await expect(page.getByRole("listbox").locator("img")).toHaveCount(0)
})
