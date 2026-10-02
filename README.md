# Luma — Personal Multimodal Study & Visual Assistant

A free-first V2.1: upload an image or capture a photo, choose a focused visual mode, and read or listen to the reply. Read text, explain a scene, study visible material, translate words, or find key details. Your own question stays editable alongside the mode. Built with Next.js App Router, TypeScript, React, and custom responsive CSS. No account or API key is needed to explore the demo.

## Start here (beginner-friendly)

1. Open a terminal in this `luma-vision-assistant` folder. Node.js 20.9+ and npm are required; use a supported Node.js LTS release.
2. Install packages once:
   ```sh
   npm ci
   ```
3. Start the local app:
   ```sh
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000). Keep the terminal open. Press Ctrl+C in that terminal to stop.
5. Choose a JPG, PNG, or WebP under 2 MB, or choose **Open camera**, allow camera access, and press **Capture photo**. Choose a visual mode or type your own question, then press **Ask Luma**. A question is optional when a mode is selected. Press **Listen** to hear the reply; **Stop** cancels playback. **New session** clears the image, mode, question, and reply and closes the camera.

You do not need an `.env.local` file. Demo mode is fully usable without one. It returns a clearly labeled scripted reply; it does **not** claim to understand your image. V2.1 accepts images and optional typed questions with visual modes and speaks answers. Microphone voice input and image generation are future features; image understanding describes an existing image.

### Visual modes

| Mode | Focus |
| --- | --- |
| **Read Text** | Extract legible text, keep headings/numbers/line breaks, and mark unclear words. |
| **Explain Simply** | Explain visible details in beginner-friendly language and separate observation from inference. |
| **Study Mode** | Build a short study guide with key concepts, step-by-step reasoning, and three self-test questions with answers. |
| **Translate** | Translate visible text into the language you request. English is the default; type “Translate into Urdu” to change it. |
| **Find Key Details** | Pick out up to five useful facts, objects, words, numbers, or relationships without guessing hidden information. |

Choosing a mode selects a focused instruction. It does not send an AI request. Your custom question is never overwritten when changing modes. Add it to focus the answer or name the translation language. Click the selected mode again to return to a custom question only.

The browser sends a validated mode ID and your raw custom question. The server selects the known preset and composes it with your question before calling the provider. Requests without a mode keep the original custom-question behavior. The combined prompt still fits the existing 1,000-character limit; the displayed custom-question allowance adjusts to the selected preset. An oversized existing draft is preserved and blocked until you shorten it or deselect the mode.

Modes guide a vision model; they are not separate trained models or a guarantee of perfect text reading, translation, or educational correctness. Unclear text and important facts should be checked. Both uploads and captured camera photos use these same modes.

**Simple Roman Urdu:** Tasveer upload karein ya camera se photo lein. Phir mode chun lein. Agar apna sawal likhna ho toh neeche likhein; mode badalne se woh sawal nahi mitega. **Ask Luma** par jawab milega, aur **Listen** se sun sakte hain.

### Use the camera

1. Open the app at the localhost link printed in the terminal, or at an HTTPS deployment. A plain HTTP network address on your phone usually cannot request camera access; use HTTPS for phone testing.
2. Press **Open camera**. The app requests video access only; it does not request microphone access. Allow the browser permission and wait for the preview. **Capture photo** stays disabled until a frame is ready.
3. Press **Capture photo**. The app makes a JPEG, limits its longest edge to 1,280 pixels, checks the existing 2 MB limit, closes the camera, and puts the photo into the usual image preview.
4. Choose a visual mode or type a question and press **Ask Luma**. Only this captured still image and your question are sent to the configured vision provider. Opening the camera does not transmit the preview or submit an AI request.
5. **Close camera**, **New session**, selecting an upload, and leaving the page release the camera tracks. If permission finishes after you closed the preview, that late stream is released too. Camera permission/device errors leave image upload available.

While the camera preview is open, **Ask Luma** is disabled so a previously selected image cannot be submitted accidentally. Capture the new photo or close the preview first. No camera frames are stored in a database, and no live video streaming is included.

### Open and run in VS Code on Windows

1. Open VS Code, choose **File → Open Folder**, and select this project's `luma-vision-assistant` folder. You should see `package.json` directly in Explorer.
2. Choose **Terminal → New Terminal**. Check your tools with `node --version` and `npm --version`. If either is missing, install a supported Node.js LTS release, then restart VS Code.
3. Run `npm ci` once, then `npm run dev`. If PowerShell says `npm.ps1` is blocked, use `npm.cmd ci` and `npm.cmd run dev`; you do not need to change your system execution policy.
4. Ctrl+click the localhost URL printed by Next.js. If port 3000 is already occupied, use the port shown in the terminal. To stop another preview, press Ctrl+C in its terminal first.
5. Open `src/components/assistant.tsx`, change a visible sentence, and save. Next.js refreshes the page automatically during development.

`npm run dev` is for editing. `npm run build` creates an optimized production build, and `npm run start` serves that build. Changes made while running `start` require rebuilding; use `dev` while learning.

## The five files to learn first

| File | What it does |
| --- | --- |
| `src/app/page.tsx` | The home page; passes a safe live/demo flag to the interface. |
| `src/components/assistant.tsx` | The interactive UI: image selection, camera session, visual mode, custom question, request, reply, and speech. React state remembers these during the current session. |
| `src/app/globals.css` | Colors, spacing, components, and mobile layouts. Start here to customize the look. |
| `src/app/api/vision/route.ts` | A server-only POST endpoint. Validates uploads, calls the provider, and returns JSON. |
| `src/lib/vision-provider.ts` | The optional live AI adapter. Its `VisionProvider` interface is the boundary for future providers. |

Other useful files: `visual-modes.ts` defines the five presets and question budget; `camera-capture.tsx` manages camera permission, local video preview, JPEG capture, and track cleanup; `contracts.ts` validates the mode ID and composes the server-side question; `demo.ts` holds the honest demo response; `layout.tsx` sets the page title; `.env.example` describes optional configuration; `vercel.json` sets deployment defaults.

### Folder overview

```text
luma-vision-assistant/
├── src/
│   ├── app/
│   │   ├── api/vision/route.ts     # Server endpoint
│   │   ├── globals.css            # Responsive styling
│   │   ├── layout.tsx             # HTML shell and metadata
│   │   └── page.tsx               # Homepage
│   ├── components/
│   │   ├── assistant.tsx         # Browser interface and interactions
│   │   └── camera-capture.tsx    # Local camera lifecycle and still capture
│   └── lib/
│       ├── contracts.ts          # Types, limits, validation
│       ├── visual-modes.ts        # Presets, mode IDs, combined-question budget
│       ├── demo.ts               # Scripted, labeled fallback
│       └── vision-provider.ts    # Optional server-only AI adapter
├── tests/
│   ├── validation.test.ts        # Input-validation unit tests
│   ├── visual-modes.test.ts      # Mode contracts and prompt boundaries
│   └── browser/
│       ├── assistant.spec.ts     # Desktop/mobile interaction tests
│       ├── camera.spec.ts        # Fake-media camera lifecycle and payload tests
│       └── visual-modes.spec.ts  # Mode choice, drafts, reset, request, layout
├── .env.example                  # Optional variable names, no real key
├── package.json                  # Dependencies and commands
├── package-lock.json             # Reproducible dependency versions
├── next.config.ts                # Next.js configuration
├── playwright.config.ts          # Browser test configuration
├── vercel.json                   # Deployment settings
└── README.md                     # Setup, architecture, interview prep
```

`node_modules` is installed dependency code and `.next` is generated build output. You generally do not edit either folder.

### Three small learning steps

1. Run the app and complete the upload → question → Listen flow.
2. Change the title in `assistant.tsx` and the accent color in `globals.css`. Save and watch the browser update.
3. Read `ask()` in `assistant.tsx`, then `POST()` in `route.ts` to follow a request from the browser to the server and back.

## V2.1 scope

- Responsive dark interface with desktop navigation and mobile reset controls.
- File picker and drag-and-drop, local preview, replacement, and removal.
- Explicit video-only camera permission, local preview, still JPEG capture, and stream cleanup on close/reset/upload/unmount.
- Camera permission, unavailable device, and unsupported-browser errors with upload fallback.
- Five accessible visual modes, server-validated mode IDs, and preserved custom questions.
- Mode-only requests or custom-question requests, with a combined instruction/question length cap.
- JPG/PNG/WebP validation, 2 MB image cap, 1,000-character question cap.
- Loading, error, empty, live, and clearly labeled demo response states.
- Explicit browser speech playback, stop, and unavailable-browser messaging.
- Server-side provider boundary; no secrets sent to the browser.
- Request timeouts, bounded request-body reading, file signature validation, and no response caching.
- No image or conversation database, filesystem persistence, or analytics in app code.

Intentionally excluded: login/accounts, long-term memory, cloud image storage, image generation, phone calling, paid telephony, microphone input, and continuous video analysis.

## Optional live AI vision

The demo is free and needs no external service. A Gemini REST adapter is included as an optional integration. Provider model availability, free-tier eligibility, regional access, quotas, and data terms can change. Check the [Gemini model catalog](https://ai.google.dev/gemini-api/docs/models), [pricing and free-tier details](https://ai.google.dev/gemini-api/docs/pricing), and [API-key setup](https://ai.google.dev/gemini-api/docs/api-key) before enabling it. Do not enable billing just to explore the demo.

1. Create your own key in Google AI Studio if an appropriate free tier is available to your account.
2. Copy `.env.example` to `.env.local` in the project root.
3. Set both values:
   ```dotenv
   GEMINI_API_KEY=your_private_key
   GEMINI_MODEL=your_current_supported_vision_model_id
   ```
   Use the actual model ID from the provider's model catalog, without a `models/` prefix. No hard-coded model is chosen to avoid depending on a retired model.
4. Restart `npm run dev`. The status changes to **Live vision** when both values are present. This indicates configuration, not a successful provider health check.
5. Submit an image and verify that the reply says **LUMA’S RESPONSE**. If the provider times out, rejects the key, hits quota, or returns no answer, the app shows an explicitly labeled demo fallback.

Never prefix secrets with `NEXT_PUBLIC_`, commit `.env.local`, or paste a key into the app UI. The key is sent only from the server to Google's API in a header. The app does not log images, questions, or keys. Live submissions transmit the image and question to the provider; its retention and usage policies apply. In demo mode the image is sent only to this app's server, processed transiently, and not analyzed by an AI provider. Browser speech may use device or vendor services depending on the browser/voice; offline speech is not guaranteed.

To add another provider, implement `VisionProvider.answer(input)` and select it in `createVisionProvider()`. Keep secrets and external calls in this server-only module. The frontend and API response shape can stay the same.

## Deploy to Vercel (when ready)

No deployment was performed as part of the local build.

1. Commit the contents of `luma-vision-assistant` to your own Git repository (not its `node_modules` or `.next` folders).
2. Import it into Vercel. Choose the **Next.js** framework preset. If you committed a parent folder, set Root Directory to the folder containing this `package.json`.
3. Use the default install/build commands (`npm ci`, `npm run build`) and a supported Node.js version matching local development.
4. Deploy with no environment variables for demo mode. To enable live vision later, add the two server environment variables in Vercel project settings and redeploy.
5. Test upload, demo/live labeling, camera permission/capture/close, and speech in the deployed HTTPS browser.

The 2 MB file limit keeps base64 JSON requests comfortably below Vercel's function payload ceiling. `vercel.json` and the route set a 30-second maximum duration; the provider request aborts after 20 seconds. Verify current limits on your chosen Vercel plan. Hosting is free-first, subject to [Vercel plan eligibility and limits](https://vercel.com/docs/plans/hobby), and no paid services are required for demo mode.

Before exposing a live provider key on a public site, set provider quotas and add durable abuse/rate limiting or deployment access protection. This focused V2.1 has no distributed rate limiter or authentication; a public live endpoint can consume your provider quota. Demo deployments have no AI-provider cost.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Browser tests (after a production build):

```sh
npx playwright install chromium
npx playwright test
```

Alternatively, on a machine with Google Chrome installed:

```powershell
$env:PLAYWRIGHT_CHANNEL = "chrome"
npx playwright test
```

The browser tests use a dedicated localhost port (3100 by default; override with `PLAYWRIGHT_PORT`) and mock the browser's vision requests so a live key is never consumed by these flows. Visual-mode tests cover each mode-only request, preserving custom drafts while switching, selected/reset state, long-draft warnings, disabled controls during requests, and responsive layout. Camera tests supply synthetic canvas video through a mocked media API; they never activate a physical camera. They check video-only permission, real encoded JPEG bytes/dimensions/pixels plus selected mode sent on Ask, denied permission fallback, late permission cleanup, reset during encoding, and preventing an old photo submission during preview on desktop/mobile. Speech is stubbed in automation; actual audio, camera hardware/permissions, and voice availability need a manual check on the target device. Unit tests cover request limits, file format spoofing, honest demo labeling, invalid mode IDs, preset/custom composition, and exact combined-prompt boundaries. A production build checks Next.js compilation and server/client boundaries. Automated checks do not evaluate live Gemini answer quality.

## Architecture and limits

Upload or local camera still + optional mode/custom question → `POST /api/vision` → mode/image validation + focused prompt composition → demo or `VisionProvider` → reply → browser speech.

The app keeps one image and answer in browser memory. Refreshing clears them. No chat history, streaming, OCR-specific guarantees, or persistence is included. AI may misread images; check important details. The UI requires a decodable image; server-side signature checks are lightweight format checks, not a complete image-security scanner. Text-to-speech availability depends on the browser, operating system, and installed voices. Long replies may be interrupted by device/browser speech limits.

## Planned versions

- **V1 (completed):** image upload, typed question, optional vision adapter, honest demo mode, and spoken replies.
- **V2 (completed):** explicit local camera preview and still capture with permission errors and lifecycle tests.
- **V2.1 (current):** focused visual modes for reading, explanation, study, translation, and key details, with custom questions preserved.
- **Next improvements:** evaluate a selected live vision model, add durable rate limiting, and consider microphone input or speech voice/rate selection as separate features.
- **V3 (only if needed):** opt-in saved history and accounts with clear privacy controls. Calling, telephony, image generation, and long-term memory remain separate product decisions.

## Interview preparation

### A 30-second introduction

“Luma is a personal multimodal study and visual assistant built with Next.js and TypeScript. A user uploads an image or captures a photo, chooses a mode such as Read Text or Study Mode, and can add a custom question. The server validates the mode and composes a focused prompt for the vision provider. The reply can be read or heard through browser speech. Camera preview stays local and becomes a single JPEG on capture; cleanup releases the tracks. Automated tests use synthetic camera frames and mocked replies.”

Be precise when presenting the project: the default demo does not analyze images; browser speech controls were automated with a stub, and actual audio requires a manual device check. The optional live adapter needs your credentials and a supported model. Do not claim a model was trained or that live AI quality was evaluated here.

### Likely questions and simple answers

| Question | Answer |
| --- | --- |
| What problem does it solve? | It makes asking about an image approachable: one image, one question, and a readable or spoken reply. It can support visual explanation and reading assistance once live vision is connected. |
| Why Next.js? | It gives me the React interface and a server API route in one TypeScript project, with a straightforward Vercel deployment path. |
| What makes it multimodal? | Live requests combine an uploaded or captured image and a focused mode/custom question. The output can be text or spoken audio. V2.1 does not accept microphone input. |
| Explain the request flow. | The browser previews a selected image, sends its base64 data with the question to `/api/vision`, and displays the JSON reply. The server validates input and chooses demo mode or the provider adapter. Listen passes reply text to browser speech synthesis. |
| What runs in the browser versus the server? | The client component manages interaction, image preview, and speech. The API route validates requests and calls AI. Environment variables and API keys remain on the server. |
| How do you prevent exposing the API key? | The provider module imports `server-only`. The key is read from a server environment variable and never placed in a `NEXT_PUBLIC_` variable, browser request, or response. |
| Why use an interface for the provider? | `VisionProvider.answer()` defines one consistent input/output contract. A new provider can implement it without changing the upload or reply UI. |
| How does demo mode work? | When either configuration value is missing, the route returns a scripted response that says no image analysis occurred. Provider failure also returns a visibly labeled fallback. |
| Where is state stored? | React state holds one selected image, question, answer, loading status, and errors in browser memory. There is no database or persistent history. Refresh clears it. |
| Why use base64? | It lets a small image and question travel in one JSON request with no storage service. Its roughly one-third size overhead is a tradeoff, so uploads are capped at 2 MB. |
| How do you validate uploads? | The client checks type, size, and whether an image can decode. The server checks body size, allowed MIME types, base64 format, decoded size, file signature, and question length. Server validation matters because client checks can be bypassed. |
| How do you handle slow requests and reset? | Provider and browser timeouts bound waiting. An AbortController cancels the request when resetting. A request identity check keeps an older response from overwriting a new session. |
| How is speech implemented? | `SpeechSynthesisUtterance` and `window.speechSynthesis` read the answer on a user click. Stop and cleanup cancel playback; unsupported browsers still show the text. No paid speech API is required. |
| How is the camera implemented? | Explicit Open camera calls video-only `getUserMedia`. A local video preview is drawn to canvas on Capture, encoded as a JPEG, and sent through the existing upload validation. Session identities reject stale permission/encoding callbacks; cleanup stops tracks. Ask sends a still image, not the preview stream. |
| How do the visual modes work? | The client selects a known mode ID and keeps the custom question separate. Server validation rejects unknown IDs, looks up the preset, and combines it with the custom text. No-mode requests remain compatible. Both client and server enforce the combined question budget without truncating a user's draft. |
| What did you test? | Unit tests validate input limits and demo honesty. Browser tests exercise upload, suggested questions, reply, speech-control state, reset, invalid files, and API errors at desktop/mobile widths. Camera tests use synthetic video frames to check real JPEG output, denied permission, stale permission/encoding cleanup, reset, and preventing submission during preview. Lint, TypeScript, and the production build cover code and integration checks. |
| Is it ready for a large public launch? | The demo is deployable. Before publicly enabling live AI, I would add durable rate limiting or access protection, provider quotas, and live quality evaluation. There is no distributed abuse protection in this focused V2.1. |
| What are the main limitations? | No actual analysis in demo mode, no microphone input, no saved conversations, variable browser voices, and untested live-provider behavior without credentials. AI can also misread visual details. |
| What would you improve next? | Evaluate a current vision model against a small image/question dataset, add durable rate limiting before public live access, and test the camera on real target devices. Microphone conversation and persistent memory remain separate features. |

### A two-minute demo sequence

1. Point to the **Demo mode** badge and explain that no key is required.
2. Upload a real image, choose a visual mode or add your own question, and press **Ask Luma**.
3. Highlight the explicit demo disclosure, then demonstrate Listen and Stop on a supported browser.
4. Resize to mobile and use New session to show clean state reset.
5. Open `route.ts` and `vision-provider.ts` to explain the server boundary and how live integration is configured.

For a technical interview, practice tracing one request through the code rather than memorizing buzzwords. Be open about using AI assistance during development, and explain which decisions and code you understand and can change yourself.

## References

- [Next.js installation and requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Gemini generateContent API](https://ai.google.dev/api/generate-content)
- [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Vercel Next.js deployment](https://vercel.com/docs/frameworks/full-stack/nextjs)

The app uses system fonts and Lucide icons; no remote image or font download is needed to render the interface.
