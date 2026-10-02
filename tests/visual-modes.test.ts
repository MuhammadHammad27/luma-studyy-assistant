import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInput, MAX_QUESTION_LENGTH } from "../src/lib/contracts";
import { VISUAL_MODES, buildVisualQuestion, visualQuestionLimit } from "../src/lib/visual-modes";

const image = { data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZt8AAAAASUVORK5CYII=", mimeType: "image/png", name: "sample.png" };
test("five focused modes have unique IDs and fit the provider question limit", () => {
  assert.deepEqual(VISUAL_MODES.map((mode) => mode.label), ["Read Text", "Explain Simply", "Study Mode", "Translate", "Find Key Details"]);
  assert.equal(new Set(VISUAL_MODES.map((mode) => mode.id)).size, 5);
  for (const mode of VISUAL_MODES) {
    const input = parseInput({ question: "", mode: mode.id, image });
    assert.equal(input.mode, mode.id); assert.equal(input.question, mode.instruction);
    assert.ok(input.question.length <= MAX_QUESTION_LENGTH);
  }
});
test("the server adds a selected preset while preserving the user's custom question", () => {
  const question = "  Translate into Urdu, including the chart labels.  ";
  for (const mode of VISUAL_MODES) {
    const input = parseInput({ question, mode: mode.id, image });
    assert.ok(input.question.startsWith(mode.instruction));
    assert.ok(input.question.endsWith(question.trim()));
  }
});
test("custom questions without a mode retain their existing trimmed behavior", () => {
  const input = parseInput({ question: "  What is in the image?  ", image });
  assert.equal(input.question, "What is in the image?"); assert.equal(input.mode, undefined);
  assert.throws(() => parseInput({ question: "", image }));
  assert.equal(parseInput({ question: "x".repeat(MAX_QUESTION_LENGTH), image }).question.length, MAX_QUESTION_LENGTH);
  assert.throws(() => parseInput({ question: "x".repeat(MAX_QUESTION_LENGTH + 1), image }));
});
test("unsupported modes are rejected, including objects and null", () => {
  for (const mode of ["unknown", {}, null, 4]) assert.throws(() => parseInput({ question: "hello", mode, image }), /supported visual mode/);
});
test("combined preset and custom question obey the limit without silent truncation", () => {
  for (const mode of VISUAL_MODES) {
    const budget = visualQuestionLimit(mode.id, MAX_QUESTION_LENGTH);
    const allowed = "x".repeat(budget);
    assert.equal(buildVisualQuestion(allowed, mode.id, MAX_QUESTION_LENGTH).length, MAX_QUESTION_LENGTH);
    assert.throws(() => parseInput({ question: allowed + "x", mode: mode.id, image }), /Shorten your question/);
  }
});
test("translation defaults to English and study mode asks for reasoning plus self-test", () => {
  assert.match(buildVisualQuestion("", "translate", MAX_QUESTION_LENGTH), /if I do not name a language, translate into English/);
  const study = buildVisualQuestion("", "study", MAX_QUESTION_LENGTH);
  assert.match(study, /reasoning rather than only giving an answer/); assert.match(study, /three self-test questions/);
});
