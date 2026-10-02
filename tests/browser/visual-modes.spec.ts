import { test, expect } from "@playwright/test";
import { VISUAL_MODES } from "../../src/lib/visual-modes";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZt8AAAAASUVORK5CYII=", "base64");
test.beforeEach(async ({ page }) => {
  await page.route("**/api/vision", (route) => route.fulfill({ json: { mode: "live", answer: "A focused mocked visual response." } }));
});

for (const mode of VISUAL_MODES) {
  test(`${mode.label} sends its mode with an uploaded image and an optional empty question`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Upload image").setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: png });
    await page.getByRole("button", { name: mode.label, exact: true }).click();
    await expect(page.getByRole("button", { name: mode.label, exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("textbox")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Ask Luma", exact: true })).toBeEnabled();
    const request = page.waitForRequest((sent) => sent.url().endsWith("/api/vision"));
    await page.getByRole("button", { name: "Ask Luma", exact: true }).click();
    const input = (await request).postDataJSON();
    expect(input.mode).toBe(mode.id); expect(input.question).toBe(""); expect(input.image.mimeType).toBe("image/png");
    await expect(page.getByText("A focused mocked visual response.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("switching modes preserves custom text and reset clears selected state", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Upload image").setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: png });
  const question = "Translate the chart labels into Urdu.";
  await page.getByRole("textbox").fill(question);
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await page.getByRole("button", { name: "Study Mode", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue(question);
  await expect(page.getByRole("button", { name: "Translate", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Study Mode", exact: true })).toHaveAttribute("aria-pressed", "true");
  const request = page.waitForRequest((sent) => sent.url().endsWith("/api/vision"));
  await page.getByRole("button", { name: "Ask Luma", exact: true }).click();
  expect((await request).postDataJSON()).toMatchObject({ question, mode: "study" });
  await expect(page.getByText("A focused mocked visual response.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New session", exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue("");
  for (const mode of VISUAL_MODES) await expect(page.getByRole("button", { name: mode.label, exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("a long custom draft is preserved and blocked until the mode is deselected", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Upload image").setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: png });
  const question = "x".repeat(950); await page.getByRole("textbox").fill(question);
  await page.getByRole("button", { name: "Study Mode", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue(question);
  await expect(page.getByRole("alert").filter({ hasText: "Your question was kept" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask Luma", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Study Mode", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue(question);
  await expect(page.getByRole("button", { name: "Ask Luma", exact: true })).toBeEnabled();
});

test("mode controls are disabled while an answer is pending", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Upload image").setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Read Text", exact: true }).click();
  let finish: () => void = () => {};
  const hold = new Promise<void>((resolve) => { finish = resolve; });
  await page.route("**/api/vision", async (route) => { await hold; await route.fulfill({ json: { mode: "live", answer: "A focused mocked visual response." } }); });
  await page.getByRole("button", { name: "Ask Luma", exact: true }).click();
  for (const mode of VISUAL_MODES) await expect(page.getByRole("button", { name: mode.label, exact: true })).toBeDisabled();
  finish(); await expect(page.getByText("A focused mocked visual response.", { exact: true })).toBeVisible();
});

test("visual modes have a readable responsive layout", async ({ page }) => {
  await page.goto("/"); await page.getByRole("button", { name: "Study Mode", exact: true }).click();
  await expect(page.getByRole("group", { name: "Visual modes" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/visual-modes-${test.info().project.name}.png`, fullPage: true });
});
