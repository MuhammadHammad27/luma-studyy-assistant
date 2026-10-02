import { NextResponse } from "next/server";
import { parseInput } from "@/lib/contracts";
import { demoAnswer } from "@/lib/demo";
import { createVisionProvider } from "@/lib/vision-provider";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  // A bounded reader also handles requests without a Content-Length header.
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Missing request body." }, { status: 400, headers });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_850_000) { await reader.cancel(); return NextResponse.json({ error: "Image is too large. Choose an image under 2 MB." }, { status: 413, headers }); }
      chunks.push(value);
    }
    const input = parseInput(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const provider = createVisionProvider();
    if (!provider) return NextResponse.json(demoAnswer(input), { headers });
    try { return NextResponse.json(await provider.answer(input), { headers }); }
    catch { return NextResponse.json({ ...demoAnswer(input), notice: "Live vision is unavailable. This is a demo reply; your image was not analyzed successfully." }, { headers }); }
  } catch (error) {
    return NextResponse.json({ error: error instanceof SyntaxError ? "Invalid request format." : error instanceof Error ? error.message : "Invalid request." }, { status: 400, headers });
  }
}
