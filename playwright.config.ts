import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: "http://127.0.0.1:5179",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "PORT=8790 VITE_API_PROXY_TARGET=http://localhost:8790 npm run dev",
    url: "http://127.0.0.1:5179",
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
