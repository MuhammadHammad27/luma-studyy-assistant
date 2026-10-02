"use client";
/* eslint-disable @next/next/no-img-element -- Local uploaded data URLs need no remote image optimization. */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, AudioLines, Camera, Check, ChevronRight, CircleHelp, ImagePlus, Layers3, LoaderCircle, Plus, ScanEye, ShieldCheck, Sparkles, Square, Upload, Volume2, X } from "lucide-react";
import CameraCapture from "./camera-capture";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_QUESTION_LENGTH, type VisionAnswer } from "@/lib/contracts";
import { VISUAL_MODES, getVisualMode, visualQuestionLimit, type VisualModeId } from "@/lib/visual-modes";

type SelectedImage = { name: string; url: string; data: string; mimeType: string };
const subscribeSpeech = () => () => {};
const getSpeechSupport = () => "speechSynthesis" in window;
const getServerSpeechSupport = () => false;

export default function Assistant({ live }: { live: boolean }) {
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [question, setQuestion] = useState("");
  const [visualMode, setVisualMode] = useState<VisualModeId | null>(null);
  const [answer, setAnswer] = useState<VisionAnswer | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const speechSupported = useSyncExternalStore(subscribeSpeech, getSpeechSupport, getServerSpeechSupport);
  const [showHelp, setShowHelp] = useState(false);
  const [cameraOpen, setCameraOpen] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const imageVersion = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const cameraSession = useRef(0);
  const activeMode = getVisualMode(visualMode);
  const questionLimit = visualQuestionLimit(visualMode, MAX_QUESTION_LENGTH);
  const questionTooLong = question.length > questionLimit;
  const hasQuestion = Boolean(visualMode || question.trim());

  useEffect(() => {
    const session = cameraSession;
    return () => { session.current++; request.current?.abort(); window.speechSynthesis?.cancel(); };
  }, []);

  function stopSpeech() { window.speechSynthesis?.cancel(); setSpeaking(false); }
  function chooseMode(mode: VisualModeId) { stopSpeech(); setVisualMode(visualMode === mode ? null : mode); setAnswer(null); setError(""); }
  function closeCamera() { cameraSession.current++; setCameraOpen(null); }
  function openCamera() { imageVersion.current++; setLoadingImage(false); setError(""); setCameraOpen(++cameraSession.current); }
  function reset() {
    closeCamera();
    imageVersion.current++;
    request.current?.abort();
    request.current = null;
    stopSpeech(); setSelected(null); setQuestion(""); setVisualMode(null); setAnswer(null); setError(""); setBusy(false); setLoadingImage(false);
    if (fileInput.current) fileInput.current.value = "";
  }
  async function selectFile(file?: File) {
    if (!file || busy) return;
    closeCamera();
    setError("");
    if (!IMAGE_TYPES.includes(file.type)) { setError("Choose a JPG, PNG, or WebP image."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError("That image is too large. Choose a file under 2 MB."); return; }
    const version = ++imageVersion.current;
    setLoadingImage(true);
    try {
      const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Unable to open this file.")); reader.readAsDataURL(file); });
      await new Promise<void>((resolve, reject) => { const img = new window.Image(); img.onload = () => resolve(); img.onerror = () => reject(new Error("This file could not be opened as an image.")); img.src = url; });
      if (version !== imageVersion.current) return;
      stopSpeech(); setSelected({ name: file.name, url, data: url.split(",")[1], mimeType: file.type }); setAnswer(null);
    } catch (e) { if (version === imageVersion.current) setError(e instanceof Error ? e.message : "Unable to load image."); }
    finally { if (version === imageVersion.current) setLoadingImage(false); }
  }
  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !hasQuestion || questionTooLong || busy || cameraOpen !== null) return;
    stopSpeech(); setBusy(true); setError(""); setAnswer(null);
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 28_000);
    try {
      const response = await fetch("/api/vision", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ question, mode: visualMode || undefined, image: { data: selected.data, name: selected.name, mimeType: selected.mimeType } }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to answer. Please try again.");
      if (request.current === controller) setAnswer(result);
    } catch (e) { if (request.current === controller) setError(controller.signal.aborted ? "The request took too long. Please try again." : e instanceof Error ? e.message : "Connection failed. Please try again."); }
    finally { window.clearTimeout(timeout); if (request.current === controller) { setBusy(false); request.current = null; } }
  }
  function listen() {
    if (!answer || !speechSupported) return;
    if (speaking) { stopSpeech(); return; }
    const speech = new SpeechSynthesisUtterance(answer.answer);
    speech.lang = "en-US"; speech.rate = 0.95;
    speech.onend = () => setSpeaking(false);
    speech.onerror = (event) => { setSpeaking(false); if (event.error !== "interrupted" && event.error !== "canceled") setError("Speech playback is unavailable in this browser. You can still read the reply."); };
    utterance.current = speech;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(speech); setSpeaking(true);
  }

  return <div className="shell">
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="Luma home"><span className="brand-icon"><AudioLines size={23} /></span>luma<span className="brand-dot">.</span></Link>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <div className="nav-active"><ScanEye size={18} /> Study & visual assistant <span className="tiny-dot" /></div>
      <button className="new-session" onClick={reset}><Plus size={17} /> New session</button>
      <div className="sidebar-bottom"><div className="mini-orb"><AudioLines size={24} /></div><h3>A little clarity.<br />A whole new perspective.</h3><p>See it. Ask it. Hear it.</p><div className="version"><span className="tiny-dot" /> PERSONAL ASSISTANT <span>V2.1</span></div></div>
    </aside>

    <main>
      <header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={14} /><span>Study & visual</span></div><div className="topbar-right"><button className="mobile-reset icon-button" aria-label="New session" onClick={reset}><Plus size={18} /></button><span className={`mode-pill ${live ? "live" : ""}`}><span className="tiny-dot" />{live ? "Live vision" : "Demo mode"}</span><button className="icon-button" aria-label="How it works" aria-expanded={showHelp} onClick={() => setShowHelp(!showHelp)}><CircleHelp size={19} /></button></div></header>
      <div className="content">
        <div className="intro"><div><div className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL STUDY & VISUAL ASSISTANT</div><h1>See it. <span>Understand it.</span></h1><p>Read, explain, study, translate, and find the details that matter.</p></div><div className="intro-art" aria-hidden="true"><AudioLines size={38} /></div></div>
        {showHelp && <div className="help-panel"><strong>Three small steps</strong><p>1. Upload an image or open your camera and capture a photo. 2. Choose a visual mode or type your own question. 3. Read the reply or press Listen. Start a new session to clear your work.</p><p>{live ? "Images and questions are sent to the configured vision provider. Replies may be inaccurate." : "Demo mode uses a scripted response. It does not analyze your image and needs no API key."} Browser speech voices and availability depend on your device.</p></div>}
        <div className="workspace-grid">
          <section className="input-panel" aria-labelledby="image-heading">
            <div className="section-header"><h2 id="image-heading"><span className="step">01</span> Your perspective</h2><span className="small-label">IMAGE INPUT</span></div>
            <input ref={fileInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload image" disabled={busy} onChange={(e) => { void selectFile(e.target.files?.[0]); e.target.value = ""; }} />
            <div className={`image-drop ${dragging ? "dragging" : ""} ${selected ? "has-image" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); void selectFile(e.dataTransfer.files[0]); }}>
              {selected ? <><div className="preview-wrap"><img src={selected.url} alt="Your uploaded image" /></div><div className="image-caption"><span><Check size={14} />{selected.name}</span><button className="icon-button" disabled={busy || loadingImage} aria-label="Remove image" onClick={() => { imageVersion.current++; stopSpeech(); setSelected(null); setAnswer(null); }}><X size={16} /></button></div></> : <div className="upload-empty"><div className="upload-art"><ImagePlus size={29} strokeWidth={1.4} /></div><h3>What are we looking at?</h3><p>Drop an image here to get started</p><button type="button" className="upload-button" disabled={busy || loadingImage} onClick={() => fileInput.current?.click()}><Upload size={15} />{loadingImage ? "Opening image…" : "Choose an image"}</button><span>JPG, PNG, or WebP · Up to 2 MB</span></div>}
            </div>
            {selected && <button className="replace-image" disabled={busy || loadingImage} onClick={() => fileInput.current?.click()}>{loadingImage ? "Opening image…" : "Choose a different image"}</button>}
            <div className="image-tools"><button type="button" className="upload-button" disabled={busy || loadingImage || cameraOpen !== null} onClick={openCamera}><Camera size={15} />Open camera</button><span>Or capture a photo from your device.</span></div>
            {cameraOpen !== null && <CameraCapture disabled={busy} onClose={closeCamera} onCapture={(file) => { if (cameraSession.current !== cameraOpen) return; closeCamera(); void selectFile(file); }} />}
            <form onSubmit={ask}><div className="question-label"><span className="step">02</span> Choose a visual mode</div><div className="visual-modes" role="group" aria-label="Visual modes">{VISUAL_MODES.map((mode) => <button type="button" key={mode.id} aria-pressed={visualMode === mode.id} disabled={busy} onClick={() => chooseMode(mode.id)}>{mode.label}</button>)}</div><p id="mode-guidance" className="mode-guidance">{activeMode ? activeMode.description + " Add a question below if you like. Click the selected mode again to use only your question." : "Choose a mode, or ask your own question. Your text stays when you switch modes."}</p><label className="question-label custom-question-label" htmlFor="question">Your question {activeMode ? "(optional)" : ""}</label><div className="textarea-wrap"><textarea id="question" placeholder={visualMode === "translate" ? "For example: Translate into Urdu and explain unfamiliar words…" : "Add your own question, instructions, or a detail to focus on…"} aria-describedby="mode-guidance question-budget" maxLength={questionLimit} value={question} disabled={busy} onChange={(e) => setQuestion(e.target.value)} /><span id="question-budget">{question.length} / {questionLimit}</span></div>{questionTooLong && <p className="mode-limit-warning" role="alert">Your question was kept. Shorten it to {questionLimit} characters for this mode, or deselect the mode.</p>}<button className="ask-button mode-ask-button" type="submit" disabled={!selected || !hasQuestion || questionTooLong || busy || loadingImage || cameraOpen !== null}>{busy ? <><LoaderCircle className="spin" size={18} />Finding some clarity…</> : <><Sparkles size={17} />Ask Luma<ArrowRight size={17} /></>}</button></form>
            <p className="privacy"><ShieldCheck size={13} />No image storage. Just this session.</p>
          </section>
          <section className="answer-panel" aria-labelledby="answer-heading" aria-busy={busy}>
            <div className="section-header"><h2 id="answer-heading"><span className="answer-icon"><AudioLines size={17} /></span> Your visual guide</h2><span className="small-label">LUMA</span></div>
            <div className="answer-content" aria-live="polite">{busy ? <div className="answer-empty"><div className="answer-orb pulse"><ScanEye size={34} /></div><h3>Making room for clarity.</h3><p>Your reply will appear here in a moment.</p></div> : answer ? <div className="answer-result"><div className={`result-label ${answer.mode === "demo" ? "is-demo" : ""}`}><span className="tiny-dot" />{answer.mode === "demo" ? "DEMO RESPONSE" : "LUMA’S RESPONSE"}</div><p className="answer-text">{answer.answer}</p>{answer.notice && <p className="answer-notice">{answer.notice}</p>}</div> : <div className="answer-empty"><div className="answer-orb"><AudioLines size={37} strokeWidth={1.4} /></div><h3>Every image has a story.</h3><p>Add an image and choose a mode or ask a question.<br />Let’s discover a little more, together.</p><div className="empty-divider" /><span>YOUR ANSWER WILL APPEAR HERE</span></div>}</div>
            <div className="speech-bar"><div><Volume2 size={17} /><span>{speaking ? "Reading your reply…" : "Clarity you can listen to"}</span></div><button onClick={listen} disabled={!answer || !speechSupported} aria-label={speaking ? "Stop reading" : "Listen to answer"}>{speaking ? <Square size={13} /> : <Volume2 size={14} />}{speaking ? "Stop" : "Listen"}</button></div>
            {!speechSupported && <p className="speech-fallback">Read-aloud requires a browser with speech support.</p>}
          </section>
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="demo-banner"><div className="banner-icon"><Layers3 size={20} /></div><div><strong>{live ? "A moment of understanding, powered by vision." : "A preview of what’s possible."}</strong><p>{live ? "Your image and question are sent to the configured AI provider. Check important details." : "You’re in demo mode. Try the full flow with a sample reply — no API key needed."}</p></div><span className="banner-tag">{live ? "VISION CONNECTED" : "FREE TO EXPLORE"}</span></div>
        <footer><span>Made for the curious.</span><span>Image + question <span className="footer-arrow">→</span> A little more understanding</span></footer>
      </div>
    </main>
  </div>;
}
