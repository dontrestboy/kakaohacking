'use client';

import { useState } from 'react';

export default function Studio() {
  const [prompt, setPrompt] = useState('');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; size: string } | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ url: string; prompt: string }[]>([]);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/gen-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, filename: filename || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed');
        return;
      }

      setResult(data);
      setHistory((h) => [{ url: data.url, prompt }, ...h]);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Image Studio</h1>
        <p className="text-gray-500 text-sm mb-8">Gemini 이미지 생성기 (내부용)</p>

        {/* Prompt */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="프롬프트를 입력하세요..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-white placeholder-gray-600 resize-none h-32 focus:outline-none focus:border-gray-600 mb-3"
        />

        <div className="flex gap-3 mb-6">
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="파일명 (선택, 예: hero-v6)"
            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
          />
          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="bg-pink-500 hover:bg-pink-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? '생성 중...' : '생성'}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Result */}
        {result && (
          <div className="bg-gray-900 rounded-xl p-4 mb-8">
            <img
              src={result.url}
              alt="Generated"
              className="w-full rounded-lg mb-3"
            />
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">{result.url} ({result.size})</span>
              <button
                onClick={() => navigator.clipboard.writeText(result.url)}
                className="text-pink-400 hover:text-pink-300 text-xs"
              >
                경로 복사
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div>
            <p className="text-gray-500 text-xs mb-3">이전 생성</p>
            <div className="grid grid-cols-3 gap-2">
              {history.slice(1).map((h, i) => (
                <div key={i} className="bg-gray-900 rounded-lg overflow-hidden">
                  <img src={h.url} alt="" className="w-full aspect-square object-cover" />
                  <p className="text-[10px] text-gray-600 p-1.5 truncate">{h.prompt.slice(0, 40)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
