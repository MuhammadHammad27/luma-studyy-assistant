import Assistant from "@/components/assistant";
export default function Page() {
  const live = Boolean(process.env.GEMINI_API_KEY?.trim() && process.env.GEMINI_MODEL?.trim());
  return <Assistant live={live} />;
}
