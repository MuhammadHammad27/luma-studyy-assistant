import { buildVisualQuestion, getVisualMode, type VisualModeId } from "./visual-modes";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_QUESTION_LENGTH = 1000;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export type VisionInput = { question: string; mode?: VisualModeId; image: { data: string; mimeType: string; name: string } };
export type VisionAnswer = { answer: string; mode: "demo" | "live"; notice?: string };

export function parseInput(value: unknown): VisionInput {
  if (!value || typeof value !== "object") throw new Error("Please add an image and a question.");
  const { question, image, mode } = value as Partial<VisionInput>;
  if (mode !== undefined && !getVisualMode(mode)) throw new Error("Choose a supported visual mode.");
  if (typeof question !== "string" || (!question.trim() && !mode) || question.length > MAX_QUESTION_LENGTH) throw new Error("Enter a question between 1 and 1,000 characters, or choose a visual mode.");
  const focusedQuestion = buildVisualQuestion(question, mode, MAX_QUESTION_LENGTH);
  if (!image || typeof image.data !== "string" || !IMAGE_TYPES.includes(image.mimeType)) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (!image.data.length || image.data.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 || image.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)) throw new Error("The image is invalid or larger than 2 MB.");
  const bytes = Buffer.from(image.data, "base64");
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("The image is larger than 2 MB.");
  const valid = image.mimeType === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : image.mimeType === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP";
  if (!valid) throw new Error("The file content does not match its image format.");
  return { question: focusedQuestion, ...(mode ? { mode } : {}), image: { data: image.data, mimeType: image.mimeType, name: typeof image.name === "string" ? image.name.slice(0, 160) : "image" } };
}
