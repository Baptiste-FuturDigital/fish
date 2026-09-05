import { readFile } from "node:fs/promises"
import path from "node:path"

export type PrizeType = "best-player" | "worst-player" | "winning-team"

export interface PrizeAttachment {
  filename: string
  content: string
}

export interface PrizeEmail {
  to: string
  subject: string
  text: string
  html: string
  attachments: PrizeAttachment[]
}

export interface PrizeEmailSendResult {
  id: string
}

export interface PrizeEmailSender {
  send(email: PrizeEmail): Promise<PrizeEmailSendResult>
}

export class PrizeEmailUnavailableError extends Error {
  constructor() {
    super("L’envoi des récompenses n’est pas encore configuré.")
    this.name = "PrizeEmailUnavailableError"
  }
}

export class PrizeEmailDeliveryError extends Error {
  constructor() {
    super("La récompense n’a pas pu être envoyée.")
    this.name = "PrizeEmailDeliveryError"
  }
}

interface PrizeTemplate {
  subject: string
  text: string
  html: string
  attachmentFilenames: readonly string[]
}

const PRIZE_TEMPLATES: Record<PrizeType, PrizeTemplate> = {
  "best-player": {
    subject: "Fish Tournament — Ton prix de champion individuel 🏆",
    text: [
      "Bravo, champion individuel du Fish Tournament !",
      "Poséithon t’accorde une faveur divine : ton prix Aquatis est joint à cet email.",
      "Garde précieusement cette image et présente-la pour profiter de ta récompense.",
    ].join("\n\n"),
    html: [
      "<h1>Bravo, champion individuel du Fish Tournament !</h1>",
      "<p>Poséithon t’accorde une faveur divine : ton prix <strong>Aquatis</strong> est joint à cet email.</p>",
      "<p>Garde précieusement cette image et présente-la pour profiter de ta récompense.</p>",
    ].join(""),
    attachmentFilenames: ["best-player.jpeg"],
  },
  "worst-player": {
    subject: "Fish Tournament — Le prix du dernier poisson 🐟",
    text: [
      "Vaillant poisson pané, tu termines dernier du classement individuel.",
      "Poséithon salue ton courage abyssal et t’envoie la récompense jointe.",
      "La gloire est temporaire, la dignité aussi.",
    ].join("\n\n"),
    html: [
      "<h1>Vaillant poisson pané !</h1>",
      "<p>Tu termines dernier du classement individuel, mais Poséithon salue ton courage abyssal.</p>",
      "<p>Ta récompense est jointe. La gloire est temporaire, la dignité aussi.</p>",
    ].join(""),
    attachmentFilenames: ["worst-player.jpeg"],
  },
  "winning-team": {
    subject: "Fish Tournament — Ton banc champion 🔱",
    text: [
      "Bravo à toute l’équipe victorieuse du Fish Tournament !",
      "Poséithon vous déclare banc champion.",
      "Ton certificat et le prix collectif sont joints à cet email.",
    ].join("\n\n"),
    html: [
      "<h1>Bravo à toute l’équipe victorieuse du Fish Tournament !</h1>",
      "<p>Poséithon vous déclare <strong>banc champion</strong>.</p>",
      "<p>Ton certificat et le prix collectif sont joints à cet email.</p>",
    ].join(""),
    attachmentFilenames: ["team-win-certificate.jpeg", "team-win-price.jpeg"],
  },
}

export async function buildPrizeEmail(
  prizeType: PrizeType,
  to: string,
  options: { prizeDirectory?: string } = {},
): Promise<PrizeEmail> {
  const template = PRIZE_TEMPLATES[prizeType]
  if (!template) throw new Error("Type de récompense inconnu.")
  const prizeDirectory = options.prizeDirectory
    ?? process.env.FISH_PRIZE_DIR?.trim()
    ?? path.resolve(process.cwd(), "private/prizes")

  const attachments = await Promise.all(template.attachmentFilenames.map(async (filename) => ({
    filename,
    content: (await readFile(path.join(prizeDirectory, filename))).toString("base64"),
  })))

  return {
    to,
    subject: template.subject,
    text: template.text,
    html: template.html,
    attachments,
  }
}

interface ResendPrizeEmailSenderOptions {
  apiKey?: string
  from?: string
  fetch?: typeof fetch
}

export class ResendPrizeEmailSender implements PrizeEmailSender {
  private readonly apiKey: string
  private readonly from: string
  private readonly fetch: typeof fetch

  constructor(options: ResendPrizeEmailSenderOptions = {}) {
    this.apiKey = options.apiKey?.trim() ?? process.env.RESEND_API_KEY?.trim() ?? ""
    this.from = options.from?.trim() ?? process.env.FISH_EMAIL_FROM?.trim() ?? ""
    this.fetch = options.fetch ?? globalThis.fetch
  }

  async send(email: PrizeEmail): Promise<PrizeEmailSendResult> {
    if (!this.apiKey || !this.from) throw new PrizeEmailUnavailableError()

    try {
      const response = await this.fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: [email.to],
          subject: email.subject,
          text: email.text,
          html: email.html,
          attachments: email.attachments,
        }),
      })

      if (!response.ok) throw new PrizeEmailDeliveryError()
      const body: unknown = await response.json()
      if (!body || typeof body !== "object" || !("id" in body) || typeof body.id !== "string") {
        throw new PrizeEmailDeliveryError()
      }
      return { id: body.id }
    } catch (error) {
      if (error instanceof PrizeEmailDeliveryError) throw error
      throw new PrizeEmailDeliveryError()
    }
  }
}
