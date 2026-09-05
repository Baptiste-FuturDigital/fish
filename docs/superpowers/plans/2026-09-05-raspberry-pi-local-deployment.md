# Raspberry Pi Local Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Fish Tournament deployable and recoverable on a Raspberry Pi 5 over the home LAN with one command.

**Architecture:** Build the existing ARM64-compatible Docker image directly on the Raspberry Pi, publish Express on LAN port 8787, and persist SQLite in `fish-data`. Small Bash scripts validate, back up, deploy, verify, and restore the service without a registry, proxy, domain, or TLS.

**Tech Stack:** Docker Engine, Docker Compose v2, Bash, Node.js 22, Express, SQLite/better-sqlite3, Vitest.

---

### Task 1: Lock the deployment contract with tests

**Files:**
- Create: `server/deployment-config.test.ts`
- Test: `server/deployment-config.test.ts`

- [ ] **Step 1: Write the failing tests**

Create Vitest assertions that `compose.yaml` publishes `8787:8787`, does not bind loopback, retains `restart: unless-stopped` and `fish-data:/app/data`, and that the four Pi scripts contain their required deployment operations.

- [ ] **Step 2: Verify RED**

Run `npx vitest run server/deployment-config.test.ts`. Expect failure because the LAN mapping and scripts do not exist.

### Task 2: Expose the service on the LAN

**Files:**
- Modify: `compose.yaml`
- Test: `server/deployment-config.test.ts`

- [ ] **Step 1: Replace the loopback mapping**

Use this exact mapping while preserving the volume and restart policy:

```yaml
ports:
  - "8787:8787"
```

- [ ] **Step 2: Validate Compose**

Run `docker compose config --quiet`. Expect exit code 0.

### Task 3: Add deployment and recovery scripts

**Files:**
- Create: `scripts/pi/common.sh`
- Create: `scripts/pi/backup.sh`
- Create: `scripts/pi/verify.sh`
- Create: `scripts/pi/deploy.sh`
- Create: `scripts/pi/restore.sh`
- Test: `server/deployment-config.test.ts`

- [ ] **Step 1: Implement shared checks**

`common.sh` resolves the repository root, checks Docker and Compose v2, and provides application container ID and LAN IP helpers. Every script uses `set -Eeuo pipefail`.

- [ ] **Step 2: Implement consistent backup**

`backup.sh` uses the `better-sqlite3` online `database.backup()` API inside the running container, copies the backup into the host `backups/` directory, removes its temporary in-volume copy, and prints the absolute path.

- [ ] **Step 3: Implement verification**

`verify.sh` waits at most 60 seconds for Docker health `healthy`, checks `http://127.0.0.1:8787/api/health`, prints LAN root and `/tv` URLs, and prints logs on failure.

- [ ] **Step 4: Implement safe deployment**

`deploy.sh` validates Compose, backs up a running database, tags the current image as `fish-tournament:rollback`, builds before replacement, starts with `docker compose up -d`, verifies, and restores the rollback image if health verification fails.

- [ ] **Step 5: Implement explicit restore**

`restore.sh` accepts exactly one `.db` path, validates it, stops the app, replaces `/app/data/fish.db` through a one-shot Compose container, removes WAL/SHM files, restarts, and verifies.

- [ ] **Step 6: Verify scripts and GREEN state**

Run `chmod +x scripts/pi/*.sh`, `bash -n scripts/pi/*.sh`, and `npx vitest run server/deployment-config.test.ts`. Expect all checks to pass.

### Task 4: Add the one-evening runbook

**Files:**
- Modify: `README.md`
- Create: `docs/raspberry-pi-runbook.md`

- [ ] **Step 1: Correct Docker LAN documentation**

Document the LAN URL and explain that the TV must open `/tv` using the Pi LAN address so the QR code is reachable from phones.

- [ ] **Step 2: Document operations**

Document Raspberry Pi OS Lite 64-bit, SSH, official Docker APT installation, `rsync`, deploy, health check, logs, backup, restore, reboot verification, and shutdown. Require router port forwarding to remain disabled.

### Task 5: Validate the production artifact

**Files:**
- No additional files

- [ ] **Step 1: Run the quality gates**

Run `npm test` and `npm run build`. Expect all tests and the production build to pass.

- [ ] **Step 2: Validate Docker locally**

Run `docker compose build app`, `docker compose up -d app`, and `./scripts/pi/verify.sh`. Expect a healthy container and printed LAN URLs.

- [ ] **Step 3: Validate persistence**

Run `./scripts/pi/backup.sh`, restart the service, and verify the database remains available.

### Task 6: Deploy to the Raspberry Pi

**Files:**
- Remote directory: `/opt/fish-tournament`

- [ ] **Step 1: Verify the SSH target**

Run `ssh <ssh-target> 'uname -m; sed -n "1,6p" /etc/os-release'`. Expect `aarch64` and Raspberry Pi OS/Debian.

- [ ] **Step 2: Transfer the release**

Use `rsync -az --delete` to `/opt/fish-tournament/`, excluding `.git`, `node_modules`, `dist`, `data`, `backups`, `output`, `tmp`, test results, and Playwright reports.

- [ ] **Step 3: Deploy remotely**

Run `ssh <ssh-target> 'cd /opt/fish-tournament && sudo ./scripts/pi/deploy.sh'`. Expect a healthy container and LAN URLs.

- [ ] **Step 4: Execute the real smoke test**

From a phone on home Wi-Fi, open the root URL. On the TV, open `/tv`, create a game, and join it by scanning the TV QR code.

- [ ] **Step 5: Verify reboot recovery**

Reboot once and run `sudo ./scripts/pi/verify.sh`. Expect automatic container recovery and healthy status.

