import { describe, expect, it, vi } from "vitest"

import { PrizeEmailDeliveryError, PrizeEmailUnavailableError, type PrizeEmail } from "./prize-email.js"
import { SmtpPrizeEmailSender, type SmtpTransport } from "./prize-smtp-email.js"

const email: PrizeEmail = {
  to: "gagnant@example.com",
  subject: "Faveur divine",
  text: "Bravo poisson.",
  html: "<p>Bravo poisson.</p>",
  attachments: [{ filename: "best-player.jpeg", content: "aW1hZ2U=" }],
}

describe("SmtpPrizeEmailSender", () => {
  it("maps the prize email and decodes attachments for Nodemailer", async () => {
    const sendMail = vi.fn<SmtpTransport["sendMail"]>(async () => ({ messageId: "gmail-123" }))
    const sender = new SmtpPrizeEmailSender({
      user: "bessardbaptiste@gmail.com",
      appPassword: "abcdefghijklmnop",
      from: "Fish Tournament <bessardbaptiste@gmail.com>",
      transport: { sendMail },
    })

    await expect(sender.send(email)).resolves.toEqual({ id: "gmail-123" })
    expect(sendMail).toHaveBeenCalledOnce()
    expect(sendMail).toHaveBeenCalledWith({
      from: "Fish Tournament <bessardbaptiste@gmail.com>",
      to: "gagnant@example.com",
      subject: email.subject,
      text: email.text,
      html: email.html,
      attachments: [{
        filename: "best-player.jpeg",
        content: Buffer.from("image"),
        contentType: "image/jpeg",
      }],
    })
  })

  it("rejects incomplete Gmail credentials before using the transport", async () => {
    const sendMail = vi.fn<SmtpTransport["sendMail"]>()
    const sender = new SmtpPrizeEmailSender({
      user: "bessardbaptiste@gmail.com",
      appPassword: "",
      from: "Fish Tournament <bessardbaptiste@gmail.com>",
      transport: { sendMail },
    })

    await expect(sender.send(email)).rejects.toBeInstanceOf(PrizeEmailUnavailableError)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it("hides SMTP details when Gmail rejects delivery", async () => {
    const sendMail = vi.fn<SmtpTransport["sendMail"]>(async () => {
      throw new Error("535 password abcdefghijklmnop rejected for gagnant@example.com")
    })
    const sender = new SmtpPrizeEmailSender({
      user: "bessardbaptiste@gmail.com",
      appPassword: "abcdefghijklmnop",
      from: "Fish Tournament <bessardbaptiste@gmail.com>",
      transport: { sendMail },
    })

    const delivery = sender.send(email)
    await expect(delivery).rejects.toBeInstanceOf(PrizeEmailDeliveryError)
    await expect(delivery).rejects.not.toThrow(/abcdefghijklmnop|gagnant@example\.com|535/)
  })
})
