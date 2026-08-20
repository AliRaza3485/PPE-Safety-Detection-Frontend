import { NextRequest, NextResponse } from 'next/server';

// This route runs on the server (Vercel serverless function), never in the
// browser — so it can safely call the plain-HTTP EC2 backend without
// triggering mixed-content blocking, and without needing CORS at all
// (the browser only ever talks to this same-origin HTTPS route).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: 'BACKEND_URL is not configured.' }, { status: 500 });
  }

  try {
    const incoming = await request.formData();
    const file = incoming.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const forwardForm = new FormData();
    const filename = file instanceof File ? file.name : 'upload.jpg';
    forwardForm.append('file', file, filename);

    const backendResponse = await fetch(`${backendUrl}/predict`, {
      method: 'POST',
      body: forwardForm,
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (err) {
    console.error('Predict proxy error:', err);
    return NextResponse.json({ error: 'Backend is unreachable.' }, { status: 502 });
  }
}