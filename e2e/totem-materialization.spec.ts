import { expect, test } from "@playwright/test"

test("a player totem scans for ten seconds then materializes for ten seconds", async ({ browser }) => {
  test.setTimeout(35_000)
  const hostContext = await browser.newContext()
  const playerContext = await browser.newContext()
  const host = await hostContext.newPage()
  const player = await playerContext.newPage()

  await host.goto("/")
  await host.getByRole("button", { name: "Créer une partie" }).click()
  await host.getByLabel("Nom de la partie").fill("Aquarium matérialisation")
  await host.getByLabel("Ton pseudo d'hôte").fill("Baptiste")
  await host.getByRole("button", { name: "Créer l'aquarium" }).click()
  const code = await host.getByTestId("game-code").textContent()

  await player.goto(`/?code=${code}`)
  await player.getByRole("button", { name: "Rejoindre une partie" }).click()
  await player.getByLabel("Ton pseudo").fill("Ariel")
  await player.getByRole("button", { name: "Plonger dans la partie" }).click()
  const scanStartedAt = Date.now()
  await player.getByRole("button", { name: "Scanner mon visage" }).click()
  await expect(player.getByTestId("totem-scanner")).toBeVisible()
  await expect(player.getByTestId("totem-materializer")).toHaveCount(0)

  const materializer = player.getByTestId("totem-materializer")
  await expect(materializer).toBeVisible({ timeout: 12_000 })
  expect(Date.now() - scanStartedAt).toBeGreaterThanOrEqual(9_000)
  await expect(player.getByTestId("totem-scanner")).toHaveCount(0)
  await expect(player.getByText("Votre animal totem est…")).toHaveCount(0)

  const image = player.getByTestId("totem-materializing-image")
  await expect(image).toHaveAttribute("src", /\/totems\/totem-\d{2}\.jpg/)
  await expect(image).toHaveAttribute("alt", "")
  expect(await image.evaluate((element) => getComputedStyle(element).filter)).toContain("blur(")
  expect(await image.evaluate((element) => getComputedStyle(element).animationDuration)).toBe("10s")
  await expect(player.getByTestId("totem-analysis-overlay")).toBeVisible()
  await expect(player.getByTestId("totem-pixel-grid")).toBeVisible()
  await expect(materializer.getByText("?", { exact: true })).toBeVisible()
  await expect(materializer.locator(".totem-materializing-ring")).toHaveCount(3)

  await expect(player.getByText("Votre animal totem est…")).toBeVisible({ timeout: 12_000 })
  expect(Date.now() - scanStartedAt).toBeGreaterThanOrEqual(19_000)
  await expect(player.getByTestId("totem-reveal-image")).toBeVisible()
  await expect(player.getByTestId("totem-materializer")).toHaveCount(0)

  await hostContext.close()
  await playerContext.close()
})
