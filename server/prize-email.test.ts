import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  PrizeEmailDeliveryError,
  PrizeEmailUnavailableError,
  ResendPrizeEmailSender,
  buildPrizeEmail,
  type PrizeEmail,
  type PrizeType,
} from "./prize-email.js"

const attachmentContents: Record<string, string> = {
  "best-player.jpeg": "best-player-image",
  "worst-player.jpeg": "worst-player-image",
  "team-win-certificate.jpeg": "team-certificate-image",
  "team-win-price.jpeg": "team-prize-image",
}

let prizeDirectory: string

beforeEach(async () => {
  prizeDirectory = await mkdtemp(path.join(tmpdir(), "fish-prizes-"))
  await Promise.all(Object.entries(attachmentContents).map(([filename, contents]) =>
    writeFile(path.join(prizeDirectory, filename), contents),
  ))
  await writeFile(path.join(prizeDirectory, "secret.jpeg"), "must-never-leave")
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(prizeDirectory, { recursive: true, force: true })
})

describe("buildPrizeEmail", () => {
  it.each([
    {
      type: "best-player",
      expectedSubject: "champion individuel",
      expectedText: "Aquatis",
      expectedFiles: ["best-player.jpeg"],
    },
    {
      type: "worst-player",
      expectedSubject: "dernier poisson",
      expectedText: "poisson pané",
      expectedFiles: ["worst-player.jpeg"],
    },
    {
      type: "winning-team",
      expectedSubject: "banc champion",
      expectedText: "équipe victorieuse",
      expectedFiles: ["team-win-certificate.jpeg", "team-win-price.jpeg"],
    },
  ] satisfies Array<{
    type: PrizeType
    expectedSubject: string
    expectedText: string
    expectedFiles: string[]
  }>)("construit le prix $type en français avec ses pièces jointes exactes", async ({
    type,
    expectedSubject,
    expectedText,
    expectedFiles,
  }) => {
    const email = await buildPrizeEmail(type, "poisson@example.com", { prizeDirectory })

    expect(email.to).toBe("poisson@example.com")
    expect(email.subject.toLocaleLowerCase("fr")).toContain(expectedSubject)
    expect(email.text).toContain(expectedText)
    expect(email.html).toContain(expectedText)
    expect(email.attachments.map(({ filename }) => filename)).toEqual(expectedFiles)
    expect(email.attachments.map(({ filename, content }) => ({
      filename,
      decoded: Buffer.from(content, "base64").toString(),
    }))).toEqual(expectedFiles.map((filename) => ({
      filename,
      decoded: attachmentContents[filename],
    })))
    expect(email.attachments.some(({ filename, content }) =>
      filename === "secret.jpeg" || Buffer.from(content, "base64").toString() === "must-never-leave",
    )).toBe(false)
  })

  it("utilise FISH_PRIZE_DIR sans élargir l’allowlist", async () => {
    vi.stubEnv("FISH_PRIZE_DIR", prizeDirectory)

    const email = await buildPrizeEmail("best-player", "poisson@example.com")

    expect(email.attachments).toHaveLength(1)
    expect(email.attachments[0]?.filename).toBe("best-player.jpeg")
  })
})

describe("ResendPrizeEmailSender", () => {
  const email: PrizeEmail = {
    to: "poisson@example.com",
    subject: "Ta faveur divine",
    text: "Bravo !",
    html: "<p>Bravo !</p>",
    attachments: [{ filename: "best-player.jpeg", content: "aW1hZ2U=" }],
  }

  it("reste disponible au démarrage mais refuse l’envoi sans configuration", async () => {
    const fetcher = vi.fn<typeof fetch>()
    const sender = new ResendPrizeEmailSender({ apiKey: "", from: "", fetch: fetcher })

    await expect(sender.send(email)).rejects.toBeInstanceOf(PrizeEmailUnavailableError)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("envoie le contrat Resend exact avec fetch natif", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      JSON.stringify({ id: "email_123" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ))
    const sender = new ResendPrizeEmailSender({
      apiKey: "re_test_secret",
      from: "Poséithon <prix@fish.test>",
      fetch: fetcher,
    })

    await expect(sender.send(email)).resolves.toEqual({ id: "email_123" })
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe("https://api.resend.com/emails")
    expect(init).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer re_test_secret",
        "Content-Type": "application/json",
      },
    })
    expect(JSON.parse(String(init?.body))).toEqual({
      from: "Poséithon <prix@fish.test>",
      to: ["poisson@example.com"],
      subject: email.subject,
      text: email.text,
      html: email.html,
      attachments: email.attachments,
    })
  })

  it("masque la réponse fournisseur et les données personnelles en cas d’échec", async () => {
    const providerError = "invalid recipient poisson@example.com with re_test_secret"
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(providerError, { status: 422 }))
    const sender = new ResendPrizeEmailSender({
      apiKey: "re_test_secret",
      from: "prix@fish.test",
      fetch: fetcher,
    })

    const promise = sender.send(email)
    await expect(promise).rejects.toBeInstanceOf(PrizeEmailDeliveryError)
    await expect(promise).rejects.not.toThrow(/poisson@example\.com|re_test_secret|invalid recipient/)
  })
})
