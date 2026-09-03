import { expect, test } from "@playwright/test"

test("a host and guest can play several rounds and finish", async ({ browser }) => {
  const hostContext = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] })
  const guestContext = await browser.newContext()
  const host = await hostContext.newPage()
  const guest = await guestContext.newPage()

  await host.goto("/")
  await expect(host.locator('link[rel="icon"]')).toHaveAttribute("href", "/favicon.svg")
  await expect(host.getByText("Fish Party")).toBeVisible()
  await expect(host.getByText("C'EST L'HEURE DU DUEL")).toBeVisible()
  await expect(host.getByRole("heading", { name: "Quels poissons seront dignes de Poséithon ? 🔱" })).toBeVisible()
  await expect(host.getByText("Merci de vous donner à fond marin et de ne pas crevette durant les épreuves. Les champions seront honorés d'une faveur divine.")).toBeVisible()
  await expect(host.locator("[data-testid='bubble-field'] > span")).toHaveCount(12)
  const musicPlayer = host.getByTestId("background-music-player")
  await expect(musicPlayer).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/8g8Utx0gvv8/)
  await expect(host.getByRole("button", { name: "Activer la musique" })).toBeVisible()
  await host.getByRole("button", { name: "Créer une partie" }).click()
  await expect(host.getByRole("button", { name: "Couper la musique" })).toBeVisible()
  await host.getByRole("button", { name: "Couper la musique" }).click()
  await expect(host.getByRole("button", { name: "Activer la musique" })).toBeVisible()
  await host.getByLabel("Nom de la partie").fill("L'aquarium du test")
  await host.getByLabel("Ton pseudo d'hôte").fill("Baptiste")
  await host.getByRole("button", { name: "Créer l'aquarium" }).click()

  await expect(host.getByText("En attente du banc")).toBeVisible()
  expect(await host.evaluate(() => window.scrollY)).toBe(0)
  const code = await host.getByTestId("game-code").textContent()
  expect(code).toMatch(/^[A-Z2-9]{4}$/)
  await host.getByRole("button", { name: "Copier le code" }).click()
  expect(await host.evaluate(() => navigator.clipboard.readText())).toBe(code)

  await guest.goto(`/?code=${code}`)
  await guest.getByRole("button", { name: "Rejoindre une partie" }).click()
  await guest.getByLabel("Ton pseudo").fill("Léa")
  await guest.getByRole("button", { name: "Plonger dans la partie" }).click()

  await expect(host.getByText("2 poissons à bord")).toBeVisible()
  await expect(host.getByRole("button", { name: "Lancer la partie" })).toBeDisabled()
  await Promise.all([
    host.getByRole("button", { name: "Scanner mon visage" }).click(),
    guest.getByRole("button", { name: "Scanner mon visage" }).click(),
  ])
  await host.waitForTimeout(1_000)
  await expect(host.locator('[data-slot="avatar-image"]')).toHaveCount(0)
  await expect(host.getByText("Votre animal totem est…")).toBeVisible({ timeout: 8_000 })
  await expect(guest.getByText("Votre animal totem est…")).toBeVisible({ timeout: 8_000 })
  const hostTotemImage = await host.getByTestId("totem-reveal-image").getAttribute("src")
  const guestTotemImage = await guest.getByTestId("totem-reveal-image").getAttribute("src")
  expect(hostTotemImage).not.toBe(guestTotemImage)
  await expect(host.getByRole("button", { name: "Lancer la partie" })).toBeEnabled()
  await host.getByRole("button", { name: "Lancer la partie" }).click()

  await expect(host.getByText("Manche 1 / 8")).toBeVisible()
  await expect(guest.getByText("Manche 1 / 8")).toBeVisible()
  await host.getByRole("button", { name: "Défi suivant" }).click()
  await expect(guest.getByText("Manche 2 / 8")).toBeVisible()

  await host.getByRole("button", { name: "Terminer" }).click()
  await expect(host.getByText("Retour au port")).toBeVisible()
  await expect(guest.getByText("Retour au port")).toBeVisible()

  await hostContext.close()
  await guestContext.close()
})
