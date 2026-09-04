import { expect, test, type APIRequestContext } from "@playwright/test"

interface SessionResponse {
  game: {
    code: string
    tournament: null | {
      challenge: {
        id: string
        introMusicYoutubeId: string
        answeringMusicYoutubeId?: string
        timerEndSoundYoutubeId?: string
      }
      phase: string
    }
  }
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

test("a team uses its single 50/50 joker on the responsive millionaire stage", async ({ browser, page }) => {
  const created = await post<SessionResponse>(page.request, "/api/games", {
    name: "Aquarium 50/50",
    hostName: "Poséithon",
  })
  const code = created.game.code
  const dummy = await post<SessionResponse>(page.request, `/api/games/${code}/join`, {
    name: "Poisson témoin",
  })
  const player = await post<SessionResponse>(page.request, `/api/games/${code}/join`, {
    name: "Joueur requin",
  })
  for (const joined of [dummy, player]) {
    await post(page.request, `/api/games/${code}/totem`, joined.session)
  }
  let game = await post<SessionResponse["game"]>(page.request, `/api/games/${code}/start`, {
    hostToken: created.session.hostToken,
  })
  for (let step = 0; step < 60; step += 1) {
    if (
      game.tournament?.challenge.id === "qui-veut-gagner-des-poissons" &&
      game.tournament.phase === "challenge-intro"
    ) break
    game = await post<SessionResponse["game"]>(page.request, `/api/games/${code}/advance`, {
      hostToken: created.session.hostToken,
    })
  }
  expect(game.tournament?.challenge.id).toBe("qui-veut-gagner-des-poissons")
  expect(game.tournament?.phase).toBe("challenge-intro")
  expect(game.tournament?.challenge).toMatchObject({
    introMusicYoutubeId: "ntFaUwJMhg0",
    answeringMusicYoutubeId: "236sJVHRh1M",
    timerEndSoundYoutubeId: "5ijevRmcIBM",
  })

  const hostContext = await browser.newContext()
  await hostContext.addInitScript(({ session }) => {
    localStorage.setItem("fish-tournament-session", JSON.stringify(session))
  }, { session: created.session })
  const hostPage = await hostContext.newPage()
  await hostPage.goto("/")
  await expect(hostPage.getByTestId("challenge-music-player")).toHaveAttribute("src", /ntFaUwJMhg0/)
  await expect(hostPage.getByTestId("question-timer-music-player")).toHaveAttribute("src", /236sJVHRh1M/)
  await expect(hostPage.getByTestId("question-timer-end-player")).toHaveAttribute("src", /5ijevRmcIBM/)
  await expect(hostPage.getByTestId("question-timer-music-player")).toHaveAttribute("data-active", "false")

  await page.addInitScript(({ session }) => {
    localStorage.setItem("fish-tournament-session", JSON.stringify(session))
  }, { session: player.session })
  await page.goto("/")

  await expect(page.getByRole("img", { name: "Jean-Pierre Foucault requin, présentateur" }))
    .toHaveAttribute("src", "/jean-pierre-foucault-requin.webp")
  await expect(page.getByText("Chaque banc possède un unique joker 50/50", { exact: false }))
    .toBeVisible()

  await post(page.request, `/api/games/${code}/advance`, {
    hostToken: created.session.hostToken,
  })
  await expect(hostPage.getByTestId("question-timer-music-player")).toHaveAttribute("src", /236sJVHRh1M/)
  await expect(hostPage.getByTestId("question-timer-end-player")).toHaveAttribute("src", /5ijevRmcIBM/)
  await expect(hostPage.getByTestId("question-timer-music-player")).toHaveAttribute("data-active", "true")
  await expect(page.getByTestId("question-timer-music-player")).toHaveCount(0)
  await expect(page.getByTestId("question-timer-end-player")).toHaveCount(0)
  const panel = page.getByTestId("millionaire-answer-panel")
  const answerChoices = panel.locator("[data-choice-id]")
  await expect(panel.getByRole("button", { name: "Joker 50/50" })).toBeVisible()
  await expect(answerChoices).toHaveCount(4)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)

  await panel.getByRole("button", { name: "Joker 50/50" }).tap()
  await expect(panel.getByRole("button", { name: "Joker utilisé" })).toBeDisabled()
  await expect(answerChoices).toHaveCount(2)
  await answerChoices.first().tap()
  await panel.getByRole("button", { name: "Verrouiller cette réponse" }).tap()
  await expect(page.getByRole("heading", { name: "Est-ce votre dernier mot ?" })).toBeVisible()
  await page.getByRole("button", { name: "C’est mon dernier mot" }).tap()
  await expect(page.getByText("Réponse verrouillée")).toBeVisible()

  await post(page.request, `/api/games/${code}/advance`, {
    hostToken: created.session.hostToken,
  })
  await post(page.request, `/api/games/${code}/advance`, {
    hostToken: created.session.hostToken,
  })
  await expect(page.getByText("Palier 2 · 20 poissons")).toBeVisible()
  await expect(panel.getByRole("button", { name: "Joker utilisé" })).toBeDisabled()
  await expect(answerChoices).toHaveCount(4)
  await hostContext.close()
})
