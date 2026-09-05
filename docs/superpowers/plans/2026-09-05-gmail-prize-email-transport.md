# Gmail Prize Email Transport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Envoyer les récompenses Fish Tournament depuis Gmail sans posséder de domaine.

**Architecture:** Une implémentation Nodemailer de `PrizeEmailSender` encapsule SMTP Gmail. Une factory sélectionne SMTP lorsque ses deux secrets sont présents, sinon conserve Resend.

**Tech Stack:** Node.js, TypeScript, Nodemailer, Gmail SMTP, Vitest, Docker Compose.

---

### Task 1: SMTP transport

**Files:**
- Create: `server/prize-smtp-email.test.ts`
- Create: `server/prize-smtp-email.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Write a failing test that injects a fake Nodemailer transporter and asserts recipient, sender, subject, HTML/text, and decoded attachment buffers.
- [ ] Run `npm test -- server/prize-smtp-email.test.ts`; expect module-not-found failure.
- [ ] Install `nodemailer` and `@types/nodemailer`.
- [ ] Implement TLS port 465 transport creation, complete-configuration validation, and `PrizeEmailDeliveryError` mapping.
- [ ] Run `npm test -- server/prize-smtp-email.test.ts`; expect all transport tests green.

### Task 2: Provider selection and runtime configuration

**Files:**
- Create: `server/prize-email-factory.test.ts`
- Create: `server/prize-email-factory.ts`
- Modify: `server/index.ts`
- Modify: `compose.yaml`
- Modify: `.env.example`
- Modify: `README.md`

- [ ] Write failing tests for SMTP precedence, Resend fallback, and partial SMTP rejection.
- [ ] Run `npm test -- server/prize-email-factory.test.ts`; expect module-not-found failure.
- [ ] Implement `createPrizeEmailSenderFromEnv` and wire it in `server/index.ts`.
- [ ] Pass `SMTP_USER`, `SMTP_APP_PASSWORD`, and `FISH_EMAIL_FROM` through Docker Compose and document them.
- [ ] Run provider tests; expect all green.

### Task 3: Activate and verify

**Files:**
- Modify locally only: `.env`

- [ ] Store the supplied Gmail address and app password without spaces in `.env`, then set file mode `0600`.
- [ ] Run `npm test` and `npm run build`; expect green.
- [ ] Recreate Docker and verify `/api/health`.
- [ ] Send one real test message with a prize attachment to the configured Gmail address and confirm the provider returns a message id.
- [ ] Commit source/config documentation only, push `main`, and verify `.env` remains untracked.
