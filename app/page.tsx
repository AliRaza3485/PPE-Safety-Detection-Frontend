// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ImageUploadPanel from '@/components/ImageUploadPanel';
import LiveCameraPanel from '@/components/LiveCameraPanel';

type Mode = 'upload' | 'camera';
type BackendStatus = 'checking' | 'online' | 'offline';

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('upload');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setBackendStatus(data.model_loaded ? 'online' : 'offline');
      })
      .catch(() => {
        if (!cancelled) setBackendStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold text-slate-100">🦺 PPE Safety Detection</h1>
        <p className="text-slate-400">
          Upload a worksite photo or use your camera to check helmet compliance in real time.
        </p>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              backendStatus === 'online'
                ? 'bg-green-400'
                : backendStatus === 'offline'
                ? 'bg-red-400'
                : 'bg-yellow-400'
            }`}
          />
          <span className="text-slate-500">
            Backend: {backendStatus === 'checking' ? 'checking…' : backendStatus === 'online' ? 'online' : 'unreachable'}
          </span>
        </div>
      </header>

      <div className="mx-auto flex gap-2 rounded-lg bg-slate-900 p-1">
        <button
          onClick={() => setMode('upload')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            mode === 'upload' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Upload Image
        </button>
        <button
          onClick={() => setMode('camera')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            mode === 'camera' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Camera
        </button>
      </div>

      {mode === 'upload' ? <ImageUploadPanel /> : <LiveCameraPanel />}
    </main>
  );
}