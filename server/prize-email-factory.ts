import {
  PrizeEmailUnavailableError,
  ResendPrizeEmailSender,
  type PrizeEmailSender,
} from "./prize-email.js"
import { SmtpPrizeEmailSender } from "./prize-smtp-email.js"

type EmailEnvironment = Record<string, string | undefined>

export function createPrizeEmailSenderFromEnv(
  environment: EmailEnvironment = process.env,
): PrizeEmailSender {
  const smtpUser = environment.SMTP_USER?.trim() ?? ""
  const smtpPassword = (environment.SMTP_APP_PASSWORD ?? "").replace(/\s/g, "")

  if (Boolean(smtpUser) !== Boolean(smtpPassword)) {
    throw new PrizeEmailUnavailableError()
  }
  if (smtpUser && smtpPassword) {
    return new SmtpPrizeEmailSender({
      user: smtpUser,
      appPassword: smtpPassword,
      from: environment.FISH_EMAIL_FROM?.trim() || `Fish Tournament <${smtpUser}>`,
    })
  }

  return new ResendPrizeEmailSender({
    apiKey: environment.RESEND_API_KEY?.trim() ?? "",
    from: environment.FISH_EMAIL_FROM?.trim() ?? "",
  })
}
