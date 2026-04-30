import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const API_KEY = 'AIzaSyDIUlZp1hwfrs6QbG2J2DoljjbKHE39r20';
const MODEL = 'gemini-2.5-flash-image';

export async function POST(req: NextRequest) {
  const { prompt, filename } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: 'prompt required' }, { status: 400 });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  );

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: { inlineData?: unknown }) => p.inlineData);

  if (!imagePart) {
    return NextResponse.json({ error: 'No image generated', detail: data }, { status: 500 });
  }

  const imgBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const name = filename || `gen-${Date.now()}`;
  const filePath = join(process.cwd(), 'public', `${name}.png`);

  await writeFile(filePath, imgBuffer);

  return NextResponse.json({
    url: `/${name}.png`,
    size: `${Math.round(imgBuffer.length / 1024)}KB`,
  });
}
