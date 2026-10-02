import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInput, MAX_IMAGE_BYTES } from "../src/lib/contracts";
import { demoAnswer } from "../src/lib/demo";

const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZt8AAAAASUVORK5CYII=";
const input = { question: " What is in the image? ", image: { data: png, mimeType: "image/png", name: "sample.png" } };
test("valid image input is accepted and question is trimmed", () => { assert.equal(parseInput(input).question, "What is in the image?"); });
test("missing, empty, and oversized questions are rejected", () => { for (const question of [undefined, " ", "x".repeat(1001), 3]) assert.throws(() => parseInput({ ...input, question })); });
test("unsupported or spoofed image formats are rejected", () => { assert.throws(() => parseInput({ ...input, image: { ...input.image, mimeType: "image/svg+xml" } })); assert.throws(() => parseInput({ ...input, image: { ...input.image, data: Buffer.from("not an image").toString("base64") } })); });
test("oversized image and malformed base64 are rejected", () => { for (const data of ["bad!", "", Buffer.alloc(MAX_IMAGE_BYTES + 1).toString("base64")]) assert.throws(() => parseInput({ ...input, image: { ...input.image, data } })); });
test("demo response clearly discloses no image analysis", () => { const result = demoAnswer(input); assert.equal(result.mode, "demo"); assert.match(result.answer, /haven’t analyzed your image/); assert.ok(result.answer.includes(input.question)); });
