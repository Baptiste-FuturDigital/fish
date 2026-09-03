import { expect, test } from "@playwright/test"

test("a host and guest can play several rounds and finish", async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()
  const host = await hostContext.newPage()
  const guest = await guestContext.newPage()

  await host.goto("/")
  await host.getByRole("button", { name: "Créer une partie" }).click()
  await host.getByLabel("Nom de la partie").fill("L'aquarium du test")
  await host.getByLabel("Ton pseudo d'hôte").fill("Baptiste")
  await host.getByRole("button", { name: "Créer l'aquarium" }).click()

  await expect(host.getByText("En attente du banc")).toBeVisible()
  expect(await host.evaluate(() => window.scrollY)).toBe(0)
  const code = await host.getByTestId("game-code").textContent()
  expect(code).toMatch(/^[A-Z2-9]{4}$/)

  await guest.goto(`/?code=${code}`)
  await guest.getByRole("button", { name: "Rejoindre une partie" }).click()
  await guest.getByLabel("Ton pseudo").fill("Léa")
  await guest.getByRole("button", { name: "Plonger dans la partie" }).click()

  await expect(host.getByText("2 poissons à bord")).toBeVisible()
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
