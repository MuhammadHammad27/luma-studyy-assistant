import type { VisionAnswer, VisionInput } from "./contracts";
export function demoAnswer(input: VisionInput): VisionAnswer {
  return { mode: "demo", answer: `Your image is ready, and your question is: “${input.question}”\n\nThis is a preview of the experience. I haven’t analyzed your image, so I can’t describe its contents or answer visual questions yet.\n\nWith live vision connected, I could describe a scene, help read visible text, or explain details in your image. You can already try reading this reply aloud using the Listen button.`, notice: "Demo reply · no AI image analysis performed" };
}
