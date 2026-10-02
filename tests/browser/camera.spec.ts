import { test, expect, type Page } from "@playwright/test";

type CameraState = { calls: number; stopped: number; audio: unknown; resolve?: () => void; finishCapture?: () => void };
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZt8AAAAASUVORK5CYII=", "base64");

async function fakeCamera(page: Page, mode: "ready" | "denied" | "pending" = "ready", delayCapture = false) {
  await page.addInitScript(({ mode, delayCapture }) => {
    const state: CameraState = { calls: 0, stopped: 0, audio: null };
    Object.assign(window, { __cameraTest: state });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { configurable: true, value: (constraints: MediaStreamConstraints) => {
      state.calls++; state.audio = constraints.audio;
      if (mode === "denied") return Promise.reject(new DOMException("Denied", "NotAllowedError"));
      const canvas = document.createElement("canvas"); canvas.width = 1920; canvas.height = 1080;
      const context = canvas.getContext("2d")!; context.fillStyle = "rgb(30,180,90)"; context.fillRect(0, 0, 1920, 1080);
      const stream = canvas.captureStream(10);
      for (const track of stream.getTracks()) { const stop = track.stop.bind(track); track.stop = () => { state.stopped++; stop(); }; }
      if (mode === "pending") return new Promise<MediaStream>((resolve) => { state.resolve = () => resolve(stream); });
      return Promise.resolve(stream);
    } });
    if (delayCapture) {
      const encode = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
        encode.call(this, (blob) => { state.finishCapture = () => callback(blob); }, ...args);
      };
    }
  }, { mode, delayCapture });
}

const state = (page: Page) => page.evaluate(() => (window as unknown as { __cameraTest: CameraState }).__cameraTest);
test.beforeEach(async ({ page }) => {
  await page.route("**/api/vision", (route) => route.fulfill({ json: { answer: "A green captured scene.", mode: "live" } }));
});

test("camera opens only on click, captures a bounded JPEG and sends that still on Ask", async ({ page }) => {
  await fakeCamera(page); await page.goto("/");
  expect((await state(page)).calls).toBe(0);
  await page.getByRole("button", { name: "Study Mode", exact: true }).click();
  await page.getByRole("button", { name: "Open camera", exact: true }).click();
  await expect(page.getByRole("button", { name: "Capture photo", exact: true })).toBeEnabled();
  expect((await state(page)).audio).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/camera-preview-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Capture photo", exact: true }).click();
  await expect(page.getByAltText("Your uploaded image")).toBeVisible();
  await expect(page.getByRole("region", { name: "Camera capture" })).toHaveCount(0);
  expect((await state(page)).stopped).toBe(1);
  await page.getByRole("textbox").fill("Describe this photo");
  const sent = page.waitForRequest((request) => request.url().endsWith("/api/vision"));
  await page.getByRole("button", { name: "Ask Luma", exact: true }).click();
  const body = (await sent).postDataJSON();
  expect(body.mode).toBe("study"); expect(body.question).toBe("Describe this photo");
  expect(body.image.mimeType).toBe("image/jpeg"); expect(body.image.name).toBe("camera-photo.jpg");
  const bytes = Buffer.from(body.image.data, "base64");
  expect(bytes.subarray(0, 3)).toEqual(Buffer.from([255, 216, 255])); expect(bytes.length).toBeLessThanOrEqual(2 * 1024 * 1024);
  const capture = await page.evaluate(async (data) => {
    const image = await createImageBitmap(await (await fetch(`data:image/jpeg;base64,${data}`)).blob());
    const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
    const pixel = Array.from(context.getImageData(100, 100, 1, 1).data); image.close();
    return { width: canvas.width, height: canvas.height, pixel };
  }, body.image.data);
  expect(capture.width).toBe(1280); expect(capture.height).toBe(720);
  expect(capture.pixel[1]).toBeGreaterThan(150); expect(capture.pixel[0]).toBeLessThan(60);
  await expect(page.getByText("A green captured scene.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("denied camera permission keeps image upload available", async ({ page }) => {
  await fakeCamera(page, "denied"); await page.goto("/");
  await page.getByRole("button", { name: "Open camera", exact: true }).click();
  await expect(page.getByRole("region", { name: "Camera capture" }).getByRole("alert")).toContainText("Camera permission was denied");
  await expect(page.getByRole("button", { name: "Capture photo", exact: true })).toBeDisabled();
  await page.getByLabel("Upload image").setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("Your uploaded image")).toBeVisible();
  await expect(page.getByRole("region", { name: "Camera capture" })).toHaveCount(0);
});

test("a previous photo cannot be submitted while the camera preview is open", async ({ page }) => {
  await fakeCamera(page); await page.goto("/");
  await page.getByLabel("Upload image").setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: png });
  await page.getByRole("textbox").fill("Describe the photo");
  await expect(page.getByRole("button", { name: "Ask Luma", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Open camera", exact: true }).click();
  await expect(page.getByRole("button", { name: "Capture photo", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Ask Luma", exact: true })).toBeDisabled();
  const requests: string[] = [];
  page.on("request", (request) => { if (request.url().endsWith("/api/vision")) requests.push(request.url()); });
  await page.locator("form").evaluate((form) => (form as HTMLFormElement).requestSubmit());
  await page.waitForTimeout(100);
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Close camera", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ask Luma", exact: true })).toBeEnabled();
});

test("closing pending permission stops a late stream without restoring the camera", async ({ page }) => {
  await fakeCamera(page, "pending"); await page.goto("/");
  await page.getByRole("button", { name: "Open camera", exact: true }).click();
  await expect.poll(async () => (await state(page)).calls).toBe(1);
  await page.getByRole("button", { name: "Close camera", exact: true }).click();
  await page.evaluate(() => (window as unknown as { __cameraTest: CameraState }).__cameraTest.resolve?.());
  await expect.poll(async () => (await state(page)).stopped).toBe(1);
  await expect(page.getByRole("region", { name: "Camera capture" })).toHaveCount(0);
  await expect(page.getByAltText("Your uploaded image")).toHaveCount(0);
});

test("new session stops active preview tracks", async ({ page }) => {
  await fakeCamera(page); await page.goto("/");
  await page.getByRole("button", { name: "Open camera", exact: true }).click();
  await expect(page.getByRole("button", { name: "Capture photo", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "New session", exact: true }).filter({ visible: true }).click();
  expect((await state(page)).stopped).toBe(1);
  await expect(page.getByRole("region", { name: "Camera capture" })).toHaveCount(0);
});

test("reset during JPEG encoding cannot restore a cleared image", async ({ page }) => {
  await fakeCamera(page, "ready", true); await page.goto("/");
  await page.getByRole("button", { name: "Open camera", exact: true }).click();
  await expect(page.getByRole("button", { name: "Capture photo", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Capture photo", exact: true }).click();
  await expect.poll(async () => page.evaluate(() => !!(window as unknown as { __cameraTest: CameraState }).__cameraTest.finishCapture)).toBe(true);
  await page.getByRole("button", { name: "New session", exact: true }).filter({ visible: true }).click();
  await page.evaluate(() => (window as unknown as { __cameraTest: CameraState }).__cameraTest.finishCapture?.());
  await expect(page.getByAltText("Your uploaded image")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ask Luma", exact: true })).toBeDisabled();
  expect((await state(page)).stopped).toBe(1);
});
