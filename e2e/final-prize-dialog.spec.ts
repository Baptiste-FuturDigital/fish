import { expect, test, type APIRequestContext } from "@playwright/test"

interface SessionResponse {
  game: { code: string }
  session: {
    gameCode: string
    playerId: string
    playerToken: string
    hostToken?: string
  }
}

async function post<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const response = await request.post(path, { data })
  expect(response.ok(), await response.text()).toBe(true)
  return response.json() as Promise<T>
}

test("a prize winner gets the email dialog and can inspect every fish portrait", async ({ page }) => {
  const created = await post<SessionResponse>(page.request, "/api/games", {
    name: "Aquarium final",
    hostName: "Poséithon",
  })
  const code = created.game.code
  const alice = await post<SessionResponse>(page.request, `/api/games/${code}/join`, {
    identityId: "anonymous",
    nickname: "Alice",
  })
  const zoe = await post<SessionResponse>(page.request, `/api/games/${code}/join`, {
    identityId: "anonymous",
    nickname: "Zoé",
  })

  for (const player of [alice, zoe]) {
    await post(page.request, `/api/games/${code}/totem`, player.session)
  }
  await post(page.request, `/api/games/${code}/start`, {
    hostToken: created.session.hostToken,
  })
  await post(page.request, `/api/games/${code}/finish`, {
    hostToken: created.session.hostToken,
  })

  await page.addInitScript((session) => {
    localStorage.setItem("fish-tournament-session", JSON.stringify(session))
  }, alice.session)
  await page.goto("/")

  const prizeDialog = page.getByRole("dialog", { name: "Poséithon a un trésor pour toi" })
  await expect(prizeDialog).toBeVisible({ timeout: 12_000 })
  await expect(prizeDialog.getByLabel("Adresse email du gagnant").first()).toBeVisible()
  await page.screenshot({ path: "tmp/final-prize-dialog-mobile.png", fullPage: true })
  await prizeDialog.getByRole("button", { name: "Fermer" }).click()
  await expect(page.getByRole("button", { name: "Réclamer mes prix" })).toBeVisible()

  await page.getByRole("tab", { name: "Poissons" }).click()
  await page.getByRole("button", { name: "Agrandir la photo de Alice" }).click()
  const portrait = page.getByRole("dialog", { name: "Portrait de Alice" })
  await expect(portrait).toBeVisible()
  await expect(portrait.getByRole("img", { name: "Portrait de Alice" })).toBeVisible()
  await expect(portrait.getByRole("heading", { name: "Alice" })).toBeVisible()
  await page.screenshot({ path: "tmp/final-player-portrait-mobile.png", fullPage: true })
})
