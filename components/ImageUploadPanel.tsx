// components/ImageUploadPanel.tsx
'use client';

import { useRef, useState } from 'react';
import DetectionOverlay from './DetectionOverlay';
import SummaryPanel from './SummaryPanel';
import { PredictResponse } from '@/lib/types';

export default function ImageUploadPanel() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setLoading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/predict', { method: 'POST', body: formData });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${response.status})`);
      }

      setResult((await response.json()) as PredictResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-white transition hover:bg-sky-400"
        >
          Choose Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {loading && <span className="text-sm text-slate-400">Analyzing image…</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>

      {previewUrl && (
        <div
          ref={wrapperRef}
          className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Uploaded preview"
            className="block w-full"
            onLoad={(e) => {
              const img = e.currentTarget;
              setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            }}
          />
          {result && (
            <DetectionOverlay
              detections={result.detections}
              sourceWidth={naturalSize.width}
              sourceHeight={naturalSize.height}
              containerRef={wrapperRef}
            />
          )}
        </div>
      )}

      {result && <SummaryPanel summary={result.summary} />}
    </div>
  );
}