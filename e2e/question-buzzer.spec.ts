import { expect, test, type APIRequestContext } from "@playwright/test"

interface SessionResponse {
  game: { code: string; tournament: null | { challenge: { id: string }; phase: string } }
  session: { gameCode: string; playerId: string; playerToken: string; hostToken?: string }
}

async function post<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const response = await request.post(path, { data })
  expect(response.ok(), await response.text()).toBe(true)
  return response.json() as Promise<T>
}

test("Question pour un poisson freezes on buzz and applies the temporary team lock", async ({ browser, page }) => {
  const created = await post<SessionResponse>(page.request, "/api/games", { name: "Aquarium buzzer", hostName: "Poséithon" })
  const code = created.game.code
  const first = await post<SessionResponse>(page.request, `/api/games/${code}/join`, { identityId: "anonymous", nickname: "Léa" })
  const second = await post<SessionResponse>(page.request, `/api/games/${code}/join`, { identityId: "anonymous", nickname: "Sam" })
  for (const player of [first, second]) await post(page.request, `/api/games/${code}/totem`, player.session)
  let game = await post<SessionResponse["game"]>(page.request, `/api/games/${code}/start`, { hostToken: created.session.hostToken })
  for (let step = 0; step < 20; step += 1) {
    if (game.tournament?.challenge.id === "question-pour-un-poisson" && game.tournament.phase === "challenge-intro") break
    game = await post(page.request, `/api/games/${code}/advance`, { hostToken: created.session.hostToken })
  }
  expect(game.tournament?.challenge.id).toBe("question-pour-un-poisson")

  const contexts = await Promise.all([created.session, first.session, second.session].map(async (session) => {
    const context = await browser.newContext()
    await context.addInitScript((value) => localStorage.setItem("fish-tournament-session", JSON.stringify(value)), session)
    return context
  }))
  const [host, firstPage, secondPage] = await Promise.all(contexts.map(async (context) => {
    const nextPage = await context.newPage()
    await nextPage.goto("/")
    return nextPage
  }))

  await host.getByRole("button", { name: "Lancer l'épreuve" }).click()
  await expect(host.getByText("SCRIPT DE POSÉITHON")).toBeVisible()
  await expect(host.getByText("Réponse : L’hippocampe")).toBeVisible()
  await expect(host.getByText("Mon genre appartient", { exact: false })).toBeVisible()
  await expect(firstPage.getByRole("button", { name: /APPUIE POUR BUZZER/ })).toBeVisible()
  await expect(firstPage.locator(".buzzer-team")).toHaveCount(4)
  await expect(host.getByTestId("question-timer-music-player")).toHaveCount(0)
  await expect(host.getByTestId("background-music-player")).toHaveAttribute("data-suspended", "true")

  await host.getByRole("button", { name: "Mettre le chronomètre en pause" }).click()
  await expect(host.getByRole("button", { name: "Reprendre le chronomètre" })).toBeVisible()
  await expect(firstPage.getByRole("button", { name: /APPUIE POUR BUZZER/ })).toBeDisabled()
  await host.getByRole("button", { name: "Reprendre le chronomètre" }).click()
  await expect(host.getByRole("button", { name: "Mettre le chronomètre en pause" })).toBeVisible()
  await expect(firstPage.getByRole("button", { name: /APPUIE POUR BUZZER/ })).toBeEnabled()

  await host.screenshot({ path: "tmp/question-buzzer-host.png", fullPage: true })
  await firstPage.screenshot({ path: "tmp/question-buzzer-player.png", fullPage: true })

  await firstPage.getByRole("button", { name: /APPUIE POUR BUZZER/ }).click()
  await expect(host.getByText("Léa répond pour", { exact: false })).toBeVisible()
  await expect(host.getByText("PAUSE")).toBeVisible()
  await host.getByRole("button", { name: "Mauvaise réponse" }).click()
  await expect(firstPage.getByText("Banc temporairement bloqué")).toBeVisible()

  await secondPage.getByRole("button", { name: /APPUIE POUR BUZZER/ }).click()
  await expect(host.getByText("Sam répond pour", { exact: false })).toBeVisible()
  await host.getByRole("button", { name: "Mauvaise réponse" }).click()
  await expect(firstPage.getByRole("button", { name: /APPUIE POUR BUZZER/ })).toBeEnabled()

  await firstPage.getByRole("button", { name: /APPUIE POUR BUZZER/ }).click()
  await host.getByRole("button", { name: "Bonne réponse" }).click()
  await expect(host.getByText("LA RÉPONSE ÉTAIT")).toBeVisible()
  await expect(host.getByText("L’hippocampe", { exact: true })).toBeVisible()

  await Promise.all(contexts.map((context) => context.close()))
})
