"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, X } from "lucide-react";
import { MAX_IMAGE_BYTES } from "@/lib/contracts";

type CameraCaptureProps = { onCapture: (file: File) => void; onClose: () => void; disabled: boolean };
function stopTracks(stream: MediaStream | null) { stream?.getTracks().forEach((track) => track.stop()); }
function cameraError(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") return "Camera permission was denied. Allow camera access in your browser, or upload an image instead.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No camera was found. Connect a camera, or upload an image instead.";
  if (name === "NotReadableError" || name === "TrackStartError") return "Your camera is unavailable or in use by another app. Close that app and try again, or upload an image.";
  return "Unable to open the camera. Try again, or upload an image instead.";
}

export default function CameraCapture({ onCapture, onClose, disabled }: CameraCaptureProps) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const operation = useRef(0);
  const capturing = useRef(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const version = ++operation.current;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => { if (operation.current === version) setError("Camera access needs a supported browser on HTTPS or localhost. You can still upload an image."); });
    } else {
      void navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
        .then(async (opened) => {
          if (operation.current !== version) { stopTracks(opened); return; }
          stream.current = opened;
          const preview = video.current;
          if (!preview) { stopTracks(opened); stream.current = null; return; }
          preview.srcObject = opened;
          try { await preview.play(); }
          catch (playError) {
            if (operation.current === version) { stopTracks(opened); stream.current = null; setError(cameraError(playError)); }
          }
        })
        .catch((openError) => { if (operation.current === version) setError(cameraError(openError)); });
    }
    return () => { operation.current = version + 1; stopTracks(stream.current); stream.current = null; };
  }, []);

  function close() { operation.current++; stopTracks(stream.current); stream.current = null; onClose(); }
  async function capture() {
    const preview = video.current;
    if (disabled || capturing.current || !ready || !preview?.videoWidth || !preview.videoHeight || preview.readyState < 2) return;
    const version = operation.current;
    capturing.current = true; setSaving(true); setError("");
    try {
      const scale = Math.min(1, 1280 / Math.max(preview.videoWidth, preview.videoHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(preview.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(preview.videoHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to capture a photo. Close camera and try again, or upload an image instead.");
      context.drawImage(preview, 0, 0, canvas.width, canvas.height);
      const encode = (quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      let blob = await encode(0.85);
      if (blob && blob.size > MAX_IMAGE_BYTES) blob = await encode(0.6);
      if (operation.current !== version) return;
      if (!blob || blob.size > MAX_IMAGE_BYTES) throw new Error("The photo could not be saved under 2 MB. Close camera and try again, or upload a smaller image.");
      stopTracks(stream.current); stream.current = null;
      onCapture(new File([blob], "camera-photo.jpg", { type: "image/jpeg" }));
    } catch (captureError) {
      if (operation.current === version) setError(captureError instanceof Error ? captureError.message : "Unable to capture a photo.");
    } finally {
      capturing.current = false;
      if (operation.current === version) setSaving(false);
    }
  }

  return <section className="camera-panel" aria-label="Camera capture">
    <div className="camera-heading"><span><Camera size={16} />Camera preview</span><button type="button" className="icon-button" aria-label="Close camera" onClick={close}><X size={17} /></button></div>
    <video ref={video} className="camera-preview" aria-label="Live camera preview" autoPlay muted playsInline onLoadedData={() => { if (stream.current) setReady(true); }} />
    {error ? <p className="camera-error" role="alert">{error}</p> : <p className="camera-status" role="status">{ready ? "Frame your photo, then capture it." : "Waiting for camera permission and preview…"}</p>}
    <button type="button" className="upload-button camera-capture-button" disabled={disabled || !ready || saving || !!error} onClick={() => void capture()}>{saving ? <LoaderCircle className="spin" size={15} /> : <Camera size={15} />}{saving ? "Capturing…" : "Capture photo"}</button>
    <p className="camera-privacy">Preview stays on your device. Only the captured photo is sent when you press Ask Luma.</p>
  </section>;
}
