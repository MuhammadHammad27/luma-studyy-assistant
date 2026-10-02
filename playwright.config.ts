import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3100);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("PLAYWRIGHT_PORT must be a port between 1024 and 65535.");
const url = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  use: { baseURL: url, headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  webServer: { command: `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`, url, reuseExistingServer: false },
  projects: [{ name: "desktop", use: { viewport: { width: 1440, height: 1000 } } }, { name: "mobile", use: { viewport: { width: 390, height: 844 } } }],
});
