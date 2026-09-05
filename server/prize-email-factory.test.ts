import { describe, expect, it } from "vitest"

import {
  PrizeEmailUnavailableError,
  ResendPrizeEmailSender,
} from "./prize-email.js"
import { createPrizeEmailSenderFromEnv } from "./prize-email-factory.js"
import { SmtpPrizeEmailSender } from "./prize-smtp-email.js"

describe("createPrizeEmailSenderFromEnv", () => {
  it("prefers Gmail SMTP when both Gmail credentials exist", () => {
    const sender = createPrizeEmailSenderFromEnv({
      SMTP_USER: "bessardbaptiste@gmail.com",
      SMTP_APP_PASSWORD: "abcdefghijklmnop",
      FISH_EMAIL_FROM: "Fish Tournament <bessardbaptiste@gmail.com>",
      RESEND_API_KEY: "re_unused",
    })

    expect(sender).toBeInstanceOf(SmtpPrizeEmailSender)
  })

  it("keeps Resend as fallback when Gmail is not configured", () => {
    const sender = createPrizeEmailSenderFromEnv({
      RESEND_API_KEY: "re_test",
      FISH_EMAIL_FROM: "Fish Tournament <prix@fish.test>",
    })

    expect(sender).toBeInstanceOf(ResendPrizeEmailSender)
  })

  it("rejects partial Gmail configuration instead of silently using Resend", () => {
    expect(() => createPrizeEmailSenderFromEnv({
      SMTP_USER: "bessardbaptiste@gmail.com",
      SMTP_APP_PASSWORD: "",
      RESEND_API_KEY: "re_test",
    })).toThrow(PrizeEmailUnavailableError)
  })
})
