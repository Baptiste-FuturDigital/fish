import { expect, test } from "@playwright/test"

test("salmon demo plays its five-second reveal sequence without the backend", async ({ page }) => {
  await page.goto("/?salmon-demo=1")

  const stage = page.locator(".whos-salmon-stage")
  const creature = page.locator(".whos-salmon-frame")
  const ambient = page.getByTestId("background-music-player")

  await expect(stage).toBeVisible()
  await expect(creature).toHaveAttribute("src", /1-guess-whale\.png/)
  await expect(page.getByRole("button", { name: "Lancer la séquence" })).toBeVisible()
  await expect(page.getByTestId("challenge-music-player")).toHaveCount(0)
  await expect(ambient).toHaveAttribute("data-suspended", "false")

  await page.getByRole("button", { name: "Lancer la séquence" }).click()

  await expect(page.getByTestId("challenge-music-player")).toHaveAttribute(
    "src",
    /youtube-nocookie\.com\/embed\/FsvGm4pqlW8\?.*start=0.*end=5/,
  )
  await expect(ambient).toHaveAttribute("data-suspended", "true")
  await expect(page.getByRole("heading", { name: "C’est Pikachu !" })).not.toBeVisible()

  await page.waitForTimeout(5_250)
  await expect(page.getByRole("heading", { name: "C’est Pikachu !" })).not.toBeVisible()
  await expect(page.getByRole("heading", { name: "C’est Pikachu !" })).toBeVisible({ timeout: 7_000 })
  await expect(creature).toHaveAttribute("src", /1-reveal-whale\.png/)
  await expect(ambient).toHaveAttribute("data-suspended", "false")

  await page.getByRole("button", { name: "Rejouer" }).click()
  await expect(creature).toHaveAttribute("src", /1-guess-whale\.png/)
  await expect(page.getByRole("button", { name: "Lancer la séquence" })).toBeVisible()
  await expect(page.getByTestId("challenge-music-player")).toHaveCount(0)
})
