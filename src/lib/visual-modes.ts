export const VISUAL_MODES = [
  { id: "read-text", label: "Read Text", description: "Extract the words you can see.", instruction: "Read all legible text in the image. Preserve its wording, headings, numbers, and useful line breaks. Mark unreadable words as [unclear] rather than inventing them. If there is no visible text, say so. Do not describe unrelated visual details unless they help explain the text." },
  { id: "explain-simply", label: "Explain Simply", description: "Understand the image in plain language.", instruction: "Explain what this image shows in simple language for a beginner. Start with a short overview, then explain the important visible details and how they relate. For a diagram or chart, explain the labels and main pattern. Separate what is visible from any inference, and say when a detail is unclear." },
  { id: "study", label: "Study Mode", description: "Turn visible material into a study guide.", instruction: "Help me study the material visible in this image. Identify the topic, give a short summary, and explain the key concepts step by step in plain language. For a problem, explain the reasoning rather than only giving an answer. End with three self-test questions and a separate answer section. Stay grounded in readable content; flag unclear parts rather than inventing them." },
  { id: "translate", label: "Translate", description: "Name a language below; English is the default.", instruction: "Read the visible text and translate it into the language requested in my question; if I do not name a language, translate into English. Show the original text alongside the translation where useful. Preserve headings, numbers, names, and meaning. Mark unreadable words as [unclear]; do not guess. If no text is visible, say that there is nothing to translate." },
  { id: "key-details", label: "Find Key Details", description: "Pick out the details that matter most.", instruction: "Find the most useful visible details in this image. Give up to five concise bullet points covering important objects, readable words, numbers, labels, and relationships. Prioritize facts relevant to my question. Clearly separate observation from inference and flag uncertain or unreadable details. Do not guess identities, hidden text, or facts the image cannot establish." },
] as const;

export type VisualModeId = typeof VISUAL_MODES[number]["id"];
const QUESTION_PREFIX = "\n\nMy question or preferred language: ";
export function getVisualMode(value: unknown) { return VISUAL_MODES.find((mode) => mode.id === value); }
export function visualQuestionLimit(mode: VisualModeId | null | undefined, totalLimit: number) {
  const preset = getVisualMode(mode);
  return preset ? Math.max(0, totalLimit - preset.instruction.length - QUESTION_PREFIX.length) : totalLimit;
}
export function buildVisualQuestion(question: string, mode: VisualModeId | null | undefined, totalLimit: number) {
  const custom = question.trim();
  const preset = getVisualMode(mode);
  if (mode && !preset) throw new Error("Choose a supported visual mode.");
  const result = preset ? preset.instruction + (custom ? QUESTION_PREFIX + custom : "") : custom;
  if (!result) throw new Error("Choose a visual mode or enter a question.");
  if (result.length > totalLimit) throw new Error(`Shorten your question to ${visualQuestionLimit(mode, totalLimit)} characters for this mode.`);
  return result;
}
