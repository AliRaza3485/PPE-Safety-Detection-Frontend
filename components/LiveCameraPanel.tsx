// components/LiveCameraPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import DetectionOverlay from './DetectionOverlay';
import SummaryPanel from './SummaryPanel';
import { PredictResponse } from '@/lib/types';

const CAPTURE_JPEG_QUALITY = 0.8;
// Gap between one backend response and the next capture. The EC2 backend is
// CPU-only on 1GB RAM, so we deliberately wait for each response before
// firing the next request rather than streaming continuously.
const LOOP_DELAY_MS = 300;

export default function LiveCameraPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setVideoSize({ width: videoRef.current.videoWidth, height: videoRef.current.videoHeight });
      }
      runningRef.current = true;
      setIsRunning(true);
      loop();
    } catch (err) {
      setError(err instanceof Error ? `Could not access camera: ${err.message}` : 'Could not access camera.');
    }
  }

  function stopCamera() {
    runningRef.current = false;
    setIsRunning(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setResult(null);
  }

  function captureFrame(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = captureCanvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) {
        resolve(null);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', CAPTURE_JPEG_QUALITY);
    });
  }

  async function loop() {
    if (!runningRef.current) return;

    try {
      const blob = await captureFrame();
      if (blob) {
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        const response = await fetch('/api/predict', { method: 'POST', body: formData });
        if (response.ok) {
          const data: PredictResponse = await response.json();
          if (runningRef.current) setResult(data);
        }
      }
    } catch {
      // A single dropped frame shouldn't kill the live loop — just try again.
    }

    if (runningRef.current) {
      timeoutRef.current = setTimeout(loop, LOOP_DELAY_MS);
    }
  }

  function toggleFacingMode() {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (isRunning) {
      stopCamera();
      setTimeout(() => startCamera(), 200);
    }
  }

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {!isRunning ? (
          <button
            onClick={startCamera}
            className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-white transition hover:bg-sky-400"
          >
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="rounded-lg bg-slate-700 px-4 py-2 font-medium text-white transition hover:bg-slate-600"
          >
            Stop Camera
          </button>
        )}
        <button
          onClick={toggleFacingMode}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          Switch to {facingMode === 'environment' ? 'Front' : 'Back'} Camera
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>

      <div
        ref={wrapperRef}
        className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900"
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className="block w-full"
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setVideoSize({ width: videoRef.current.videoWidth, height: videoRef.current.videoHeight });
            }
          }}
        />
        {!isRunning && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-sm text-slate-400">
            Camera is off
          </div>
        )}
        {isRunning && result && (
          <DetectionOverlay
            detections={result.detections}
            sourceWidth={videoSize.width}
            sourceHeight={videoSize.height}
            containerRef={wrapperRef}
          />
        )}
      </div>

      {/* Hidden canvas used only to grab frames for the backend — never rendered */}
      <canvas ref={captureCanvasRef} className="hidden" />

      {result && <SummaryPanel summary={result.summary} />}
    </div>
  );
}