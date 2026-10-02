import { test, expect } from "@playwright/test";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZt8AAAAASUVORK5CYII=", "base64");
test.beforeEach(async ({ page }) => {
  await page.route("**/api/vision", (route) => route.fulfill({ json: { mode: "demo", answer: "This is a preview. I haven’t analyzed your image." } }));
});
test("demo upload, question, reply, speech controls and reset", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, "speechSynthesis", { value: { cancel() {}, speak() {} } }); });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "See it. Understand it." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask Luma" })).toBeDisabled();
  await page.getByLabel("Upload image").setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("Your uploaded image")).toBeVisible();
  await page.getByRole("button", { name: "Read Text", exact: true }).click();
  await page.getByRole("button", { name: "Ask Luma" }).click();
  await expect(page.getByText("DEMO RESPONSE", { exact: true })).toBeVisible();
  await expect(page.getByText(/haven’t analyzed your image/)).toBeVisible();
  await page.getByRole("button", { name: "Listen to answer" }).click();
  await expect(page.getByRole("button", { name: "Stop reading" })).toBeVisible();
  await page.getByRole("button", { name: "Stop reading" }).click();
  await page.screenshot({ path: `test-results/answer-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "New session", exact: true }).filter({ visible: true }).click();
  await expect(page.getByAltText("Your uploaded image")).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveValue("");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/empty-${test.info().project.name}.png`, fullPage: true });
});
test("rejects unsupported upload and invalid API payload", async ({ page, request }) => {
  await page.goto("/");
  await page.getByLabel("Upload image").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await expect(page.getByRole("alert").filter({ hasText: "Choose a JPG, PNG, or WebP" })).toBeVisible();
  const response = await request.post("/api/vision", { data: { question: "hello" } });
  expect(response.status()).toBe(400);
});
