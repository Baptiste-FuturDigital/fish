import nodemailer from "nodemailer"

import {
  PrizeEmailDeliveryError,
  PrizeEmailUnavailableError,
  type PrizeEmail,
  type PrizeEmailSender,
  type PrizeEmailSendResult,
} from "./prize-email.js"

interface SmtpMail {
  from: string
  to: string
  subject: string
  text: string
  html: string
  attachments: Array<{
    filename: string
    content: Buffer
    contentType: "image/jpeg"
  }>
}

export interface SmtpTransport {
  sendMail(message: SmtpMail): Promise<{ messageId?: string }>
}

interface SmtpPrizeEmailSenderOptions {
  user?: string
  appPassword?: string
  from?: string
  transport?: SmtpTransport
}

export class SmtpPrizeEmailSender implements PrizeEmailSender {
  private readonly user: string
  private readonly appPassword: string
  private readonly from: string
  private readonly transport: SmtpTransport | null

  constructor(options: SmtpPrizeEmailSenderOptions = {}) {
    this.user = options.user?.trim() ?? process.env.SMTP_USER?.trim() ?? ""
    this.appPassword = (options.appPassword ?? process.env.SMTP_APP_PASSWORD ?? "")
      .replace(/\s/g, "")
    this.from = options.from?.trim()
      ?? process.env.FISH_EMAIL_FROM?.trim()
      ?? (this.user ? `Fish Tournament <${this.user}>` : "")
    this.transport = options.transport ?? (
      this.user && this.appPassword
        ? nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { user: this.user, pass: this.appPassword },
          })
        : null
    )
  }

  async send(email: PrizeEmail): Promise<PrizeEmailSendResult> {
    if (!this.user || !this.appPassword || !this.from || !this.transport) {
      throw new PrizeEmailUnavailableError()
    }

    try {
      const result = await this.transport.sendMail({
        from: this.from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        attachments: email.attachments.map((attachment) => ({
          filename: attachment.filename,
          content: Buffer.from(attachment.content, "base64"),
          contentType: "image/jpeg",
        })),
      })
      if (!result.messageId) throw new PrizeEmailDeliveryError()
      return { id: result.messageId }
    } catch (error) {
      if (error instanceof PrizeEmailDeliveryError) throw error
      throw new PrizeEmailDeliveryError()
    }
  }
}
