import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

const root = path.resolve(import.meta.dirname, "..")

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

describe("Raspberry Pi deployment", () => {
  it("publishes the application on the LAN and persists SQLite", () => {
    const compose = read("compose.yaml")

    expect(compose).toContain('image: fish-tournament:local')
    expect(compose).toContain('- "8787:8787"')
    expect(compose).not.toContain("127.0.0.1:8787:8787")
    expect(compose).toContain("restart: unless-stopped")
    expect(compose).toContain("fish-data:/app/data")
  })

  it("keeps runtime data and local artifacts out of the image", () => {
    const dockerignore = read(".dockerignore")
    const gitignore = read(".gitignore")

    expect(dockerignore).toContain("backups")
    expect(dockerignore).toContain("output")
    expect(dockerignore).toContain("tmp")
    expect(gitignore).toContain("backups")
  })

  it("provides safe deployment operations", () => {
    const deploy = read("scripts/pi/deploy.sh")
    const backup = read("scripts/pi/backup.sh")
    const push = read("scripts/pi/push.sh")
    const restore = read("scripts/pi/restore.sh")
    const verify = read("scripts/pi/verify.sh")

    expect(deploy).toContain("docker compose build app")
    expect(deploy).toContain("docker compose up -d")
    expect(deploy).toContain("fish-tournament:rollback")
    expect(backup).toContain("database.backup")
    expect(push).toContain("rsync -az --delete")
    expect(push).toContain("scripts/pi/deploy.sh")
    expect(push.match(/ssh -t "\$\{target\}"/g)).toHaveLength(2)
    expect(restore).toContain("docker compose run")
    expect(restore).toContain('database.pragma("quick_check")')
    expect(verify).toContain("/api/health")
    expect(verify).toContain('http://127.0.0.1:8787/')
    expect(verify).toContain('http://127.0.0.1:8787/tv')
    expect(verify).toContain('http://${address}:8787/api/health')
    expect(`${deploy}\n${backup}\n${restore}\n${verify}`).not.toContain("down --volumes")
  })
})
