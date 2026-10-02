# V2.1 visual modes validation

Validated in an isolated, allowlisted copy of the existing camera V2 project with Node.js 24.15.0, Next.js 16.3.8, and Google Chrome. The copy excluded all environment files and the Git repository. The Visual Modes update has not been applied to the main D-drive project by these checks; transferring the verified files is a separate step.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed with no warnings or errors. |
| `npm run typecheck` | Passed. An independent reviewer also ran TypeScript successfully. |
| `npm test` | 11 tests passed: prior image/question/demo validation plus five-mode metadata, server preset/custom composition, no-mode compatibility, unknown/malformed mode rejection, exact/+1 prompt boundaries, and translation/study behavior. |
| `npm run build` | Passed after final source edits; homepage generated and `/api/vision` built as a server route. |
| `PLAYWRIGHT_CHANNEL=chrome npx playwright test` | 34 tests passed across desktop (1440×1000) and mobile (390×844); process exited with code 0. |
| Visual layout | Active-camera and selected-mode screenshots captured; desktop and mobile mode screenshots inspected. Tests verified no horizontal overflow. |
| Independent code review | No blocking mode validation, prompt composition, custom-question preservation, accessibility, or camera findings. Independent TypeScript check also passed. |

Visual-mode automation verifies all five mode-only requests with an uploaded image, raw custom questions preserved while switching, aria-pressed selection/reset state, retaining oversized drafts while blocking submission, disabling controls during a pending request, and responsive layout. Unit tests verify the server-side composed question and exact character limits independently of the mocked browser responses.

Camera automation replaces `getUserMedia` with synthetic canvas video and intercepts browser vision requests. It verifies explicit opening, video-only constraints, ready-frame capture, JPEG signature/content/dimensions (1,280×720 from a 1,920×1,080 synthetic source) with Study Mode preserved in the request, the 2 MB limit, track stopping, denied permission/upload fallback, late permission cleanup after close, reset during encoding, and blocking a previous image submission during an active preview. No physical webcam, microphone, API key, authenticated provider, or AI quota was used by these checks.

The existing upload/reply/reset/speech-state flows also passed. Speech synthesis is stubbed; actual audible playback and installed voices require a manual device check. Automated image replies are mocked, so these checks do not evaluate live Gemini quality. No GitHub push or Vercel deployment was performed.

In this runner, Next.js's test-server shutdown left its own Node process alive after completed assertions. Only the known test server process was stopped to let Playwright exit with code 0. The user's development server was not stopped.

Before presenting the deployed V2.1, manually test **upload/capture → choose a mode → optional custom question → Ask Luma → Listen** on the intended device. Try all five modes with relevant real images, including a translation language such as Urdu. Test **Close camera**, **New session**, and denied permission too. Use localhost locally or HTTPS on a deployed site; an HTTP network IP is not a suitable camera test origin. Automated checks do not measure real model correctness.

Start learning with [README.md](README.md). Use `npm run dev` while editing and open the exact localhost URL printed in the terminal.
