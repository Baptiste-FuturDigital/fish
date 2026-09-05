# Maude Beluga Portrait Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Pauline's historical béluga portrait with a recognizable portrait of Maude while preserving every existing application reference.

**Architecture:** Generate one square raster asset from the current béluga composition and Maude's supplied photograph. Replace the existing file in place so application code, persisted identities, URLs, and cache paths remain compatible.

**Tech Stack:** Built-in image generation, PNG assets, Vite, Vitest, Docker deployment on Raspberry Pi

---

### Task 1: Generate and validate the portrait

**Files:**
- Reference: `assets/players/pauline-beluga.png`
- Reference: user-supplied Maude photograph
- Modify: `assets/players/pauline-beluga.png`

- [ ] **Step 1: Generate the image**

Use both references to create a square photorealistic underwater portrait. Preserve Maude's recognizable facial features and the existing white-béluga composition. Generate no text, logo, or watermark.

- [ ] **Step 2: Inspect the output**

Open the result at original resolution and verify face identity, square composition, béluga anatomy, clean edges, and absence of unwanted text.

- [ ] **Step 3: Replace the stable asset path**

Copy the accepted PNG over `assets/players/pauline-beluga.png`. Do not modify or delete any other image.

### Task 2: Validate and ship

**Files:**
- Modify: `assets/players/pauline-beluga.png`

- [ ] **Step 1: Run focused identity tests**

Run: `npm test -- --run shared/player-identities.test.ts`

Expected: all identity tests pass and Maude still resolves to `/players/pauline-beluga.png`.

- [ ] **Step 2: Build production assets**

Run: `npm run build`

Expected: TypeScript and Vite production builds succeed.

- [ ] **Step 3: Commit and push**

```bash
git add assets/players/pauline-beluga.png docs/superpowers/plans/2026-09-05-maude-beluga-portrait.md
git commit -m "feat: replace Maude beluga portrait"
git push origin main
```

- [ ] **Step 4: Deploy and smoke-test**

Run: `./scripts/pi/push.sh baptiste@192.168.1.15`

Expected: the Pi container is healthy, both LAN and public `/api/health` return `{"status":"ok"}`, and the deployed image checksum matches the repository asset.
