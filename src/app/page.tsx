'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { parseKakaoChat, ChatMessage } from '@/lib/parser';
import { analyze, AnalysisResult } from '@/lib/analyzer';

type Phase = 'upload' | 'analyzing' | 'result';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setPhase('analyzing');

    try {
      const text = await file.text();
      const parsed = parseKakaoChat(text);

      if (parsed.participants.length < 2) {
        setError('1:1 대화만 분석할 수 있어요. 두 명의 대화가 필요합니다.');
        setPhase('upload');
        return;
      }
      if (parsed.messages.length < 20) {
        setError('대화가 너무 짧아요. 최소 20개 이상의 메시지가 필요합니다.');
        setPhase('upload');
        return;
      }

      const twoParticipants = parsed.participants.slice(0, 2);
      const filtered = parsed.messages.filter((m) =>
        twoParticipants.includes(m.sender)
      );

      await new Promise((r) => setTimeout(r, 2000));
      const analysis = analyze(twoParticipants, filtered);
      setResult(analysis);
      setMessages(filtered);
      setPhase('result');
    } catch {
      setError('파일을 읽을 수 없어요. 카카오톡 대화 내보내기 파일(.txt)을 넣어주세요.');
      setPhase('upload');
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (phase === 'analyzing') return <AnalyzingScreen />;
  if (phase === 'result' && result) {
    return <ResultScreen result={result} messages={messages} scrollRef={scrollRef} />;
  }

  return <OnboardingScreen onFileChange={onFileChange} onDrop={onDrop} dragOver={dragOver} setDragOver={setDragOver} error={error} />;
}

// ─── Onboarding Screen ───

function OnboardingScreen({
  onFileChange,
  onDrop,
  dragOver,
  setDragOver,
  error,
}: {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  error: string;
}) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="snap-container">
      {/* Section 1: Hero */}
      <section className="snap-section bg-[#0C0C1E] px-6">
        <div className="max-w-sm w-full text-center">
          <FadeIn>
            <div className="gentle-float mb-8">
              <img
                src="/hero-illust-v2.png"
                alt="커플 일러스트"
                width={300}
                height={300}
                className="mx-auto"
              />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">
              카톡해킹
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              둘 중 누가 더 좋아하는지,<br />
              카톡은 알고 있어요
            </p>
            <div className="mt-14 scroll-indicator">
              <svg className="w-5 h-5 mx-auto text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section 2: Upload + 분석 항목 */}
      <section className="snap-section bg-[#0C0C1E] px-6">
        <div className="max-w-sm w-full">
          <FadeIn>
            {/* 분석 항목 한 줄씩 */}
            <div className="space-y-3 mb-10">
              {['호감도', '애착유형', '선톡비율', '잠수력', '수면패턴', '배고픔', '계획성'].map((item, i) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="text-[11px] tabular-nums text-gray-600 w-5 text-right">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm text-gray-400">{item}</span>
                </div>
              ))}
              <p className="text-xs text-gray-700 pt-2 pl-8">7가지 항목을 분석해요</p>
            </div>

            {/* Upload */}
            <div
              className={`border border-dashed rounded-xl p-8 transition-all cursor-pointer ${
                dragOver
                  ? 'border-gray-500 bg-white/[0.03]'
                  : 'border-gray-800 hover:border-gray-600'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <p className="text-white font-semibold mb-1">대화 파일 올리기</p>
              <p className="text-gray-600 text-sm">카카오톡 대화 내보내기 (.txt)</p>
              <input id="file-input" type="file" accept=".txt,.csv" className="hidden" onChange={onFileChange} />
            </div>

            {error && (
              <p className="mt-4 text-red-400/80 text-sm">{error}</p>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); setShowGuide(!showGuide); }}
              className="mt-4 text-gray-700 hover:text-gray-500 text-xs transition-colors"
            >
              내보내기 방법 {showGuide ? '접기' : '보기'}
            </button>

            {showGuide && (
              <div className="mt-2 text-xs text-gray-600 space-y-1.5 pl-1">
                <p>1. 카카오톡 대화방 열기</p>
                <p>2. 우측 상단 ≡ → 설정</p>
                <p>3. 대화 내보내기 → .txt 저장</p>
                <p>4. 여기에 올리기</p>
              </div>
            )}

            <p className="mt-6 text-gray-800 text-[11px]">
              모든 분석은 브라우저에서만. 서버 전송 없음.
            </p>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}

function AnalyzingScreen() {
  const msgs = [
    '대화 읽는 중...',
    '몰래 분석하는 중...',
    '관계 해킹하는 중...',
    '거의 다 됐어요...',
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => Math.min(i + 1, msgs.length - 1));
    }, 500);
    return () => clearInterval(interval);
  }, [msgs.length]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C0C1E]">
      <div className="text-center">
        <div className="gentle-float mb-10">
          <img
            src="/hero-illust-v2.png"
            alt=""
            width={200}
            height={200}
            className="mx-auto rounded-2xl opacity-80"
          />
        </div>
        <div className="flex justify-center gap-2.5 mb-5">
          <div className="w-2 h-2 rounded-full bg-gray-500 dot-1" />
          <div className="w-2 h-2 rounded-full bg-gray-500 dot-2" />
          <div className="w-2 h-2 rounded-full bg-gray-500 dot-3" />
        </div>
        <p className="text-lg text-gray-400">{msgs[msgIdx]}</p>
      </div>
    </div>
  );
}

// ─── Result Screen ───

interface AISections {
  [key: string]: string;
}

function ResultScreen({
  result,
  messages: chatMessages,
  scrollRef,
}: {
  result: AnalysisResult;
  messages: ChatMessage[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [a, b] = result.participants;
  const [aiSections, setAiSections] = useState<AISections | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    const fetchAI = async () => {
      try {
        // Build sample messages (evenly spaced, max 60)
        const step = Math.max(1, Math.floor(chatMessages.length / 60));
        const sampled = chatMessages.filter((_, i) => i % step === 0).slice(0, 60);
        const sampleText = sampled
          .map((m) => `${m.sender}: ${m.content}`)
          .join('\n');

        const stats = {
          totalMessages: result.totalMessages,
          totalDays: result.totalDays,
          affection: {
            a: result.affection[a],
            b: result.affection[b],
          },
          firstMessage: {
            a: result.firstMessage[a],
            b: result.firstMessage[b],
          },
          attachment: {
            a: result.attachment[a],
            b: result.attachment[b],
          },
          responseTime: {
            a: result.responseTime[a],
            b: result.responseTime[b],
          },
          sleep: {
            a: result.sleep[a],
            b: result.sleep[b],
          },
          hungry: {
            a: result.hungry[a],
            b: result.hungry[b],
          },
          planner: {
            a: result.planner[a],
            b: result.planner[b],
          },
        };

        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participants: [a, b],
            stats,
            sampleMessages: sampleText,
          }),
        });

        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.sections && Object.keys(data.sections).length > 0) {
          setAiSections(data.sections);
        } else {
          setAiError(true);
        }
      } catch {
        setAiError(true);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAI();
  }, [a, b, chatMessages, result]);

  return (
    <div ref={scrollRef} className="snap-container">
      {/* Intro */}
      <Section gradient="from-[#0a0a1a] to-[#12071f]">
        <FadeIn>
          <p className="text-pink-400 text-sm font-bold tracking-widest mb-4">
            ANALYSIS COMPLETE
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-pink-400">{a}</span>
            <span className="text-gray-500 mx-2 sm:mx-3">vs</span>
            <span className="text-purple-400">{b}</span>
          </h2>
          <div className="flex gap-6 sm:gap-8 justify-center text-gray-400 mt-6">
            <div>
              <p className="text-3xl font-bold text-white">
                {result.totalMessages.toLocaleString()}
              </p>
              <p className="text-sm">총 메시지</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {result.totalDays}
              </p>
              <p className="text-sm">일간</p>
            </div>
          </div>
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 1. 불안형 vs 안정형 */}
      <Section gradient="from-purple-950 to-pink-950">
        <FadeIn>
          <SectionIcon emoji="💕" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">애착 유형 분석</h2>
          <p className="text-gray-400 mb-8">누가 불안형이고 누가 안정형일까?</p>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-sm mx-auto">
            {[a, b].map((name, i) => {
              const d = result.attachment[name];
              return (
                <div
                  key={name}
                  className="bg-white/5 rounded-2xl p-6 text-center"
                >
                  <p className={`text-sm mb-1 ${i === 0 ? 'text-pink-400' : 'text-purple-400'}`}>
                    {name}
                  </p>
                  <p className="text-3xl font-bold mb-2">{d.style}</p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>연속문자 {d.doubleTexts}회</p>
                    <p>불안지수 {d.score}점</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-gray-500 text-sm mt-6">
            연속으로 메시지를 보내고 답을 기다린 횟수로 판단해요
          </p>
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 2. 누가 더 좋아해 */}
      <Section gradient="from-red-950 to-pink-950">
        <FadeIn>
          <SectionIcon emoji="❤️" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">호감도 분석</h2>
          <p className="text-gray-400 mb-8">
            누가 더 좋아하는 마음이 강할까?
          </p>
          {(() => {
            const dA = result.affection[a];
            const dB = result.affection[b];
            const winner = dA.score >= dB.score ? a : b;
            const winColor = winner === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-3xl sm:text-5xl font-bold mb-6">
                  <span className={winColor}>{winner}</span>
                </p>
                <div className="w-full max-w-sm mx-auto space-y-4">
                  <CompareBar
                    label="메시지 수"
                    vA={dA.messageCount}
                    vB={dB.messageCount}
                    nameA={a}
                    nameB={b}
                  />
                  <CompareBar
                    label="평균 글자수"
                    vA={dA.avgLength}
                    vB={dB.avgLength}
                    nameA={a}
                    nameB={b}
                  />
                  <CompareBar
                    label="질문 횟수"
                    vA={dA.questionCount}
                    vB={dB.questionCount}
                    nameA={a}
                    nameB={b}
                  />
                  <CompareBar
                    label="이모티콘"
                    vA={dA.emojiCount}
                    vB={dB.emojiCount}
                    nameA={a}
                    nameB={b}
                  />
                </div>
              </>
            );
          })()}
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 3. 선톡 */}
      <Section gradient="from-cyan-950 to-blue-950">
        <FadeIn>
          <SectionIcon emoji="💬" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">선톡 분석</h2>
          <p className="text-gray-400 mb-8">
            누가 먼저 대화를 시작할까?
          </p>
          {(() => {
            const dA = result.firstMessage[a];
            const dB = result.firstMessage[b];
            const winner = dA.count >= dB.count ? a : b;
            const winColor = winner === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-lg text-gray-400 mb-4">
                  먼저 연락하는 사람
                </p>
                <p className="text-3xl sm:text-5xl font-bold mb-2">
                  <span className={winColor}>{winner}</span>
                </p>
                <div className="flex gap-4 sm:gap-8 mt-6 justify-center flex-wrap">
                  <StatBox
                    name={a}
                    value={`${dA.count}회`}
                    sub={`${dA.percent}%`}
                    color="pink"
                  />
                  <StatBox
                    name={b}
                    value={`${dB.count}회`}
                    sub={`${dB.percent}%`}
                    color="purple"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-6">
                  4시간 이상 공백 후 먼저 보낸 메시지 기준
                </p>
              </>
            );
          })()}
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 4. 수면 패턴 */}
      <Section gradient="from-indigo-950 to-slate-950">
        <FadeIn>
          <SectionIcon emoji="😴" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">수면 패턴</h2>
          <p className="text-gray-400 mb-8">누가 더 빨리 잘까?</p>
          {(() => {
            const dA = result.sleep[a];
            const dB = result.sleep[b];
            const aTime = dA.avgHour + dA.avgMinute / 60;
            const bTime = dB.avgHour + dB.avgMinute / 60;
            const aNorm = aTime <= 6 ? aTime + 24 : aTime;
            const bNorm = bTime <= 6 ? bTime + 24 : bTime;
            const earlyBird = aNorm <= bNorm ? a : b;
            const earlyColor =
              earlyBird === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-lg text-gray-400 mb-4">
                  먼저 잠드는 사람
                </p>
                <p className="text-3xl sm:text-5xl font-bold mb-6">
                  <span className={earlyColor}>{earlyBird}</span>
                </p>
                <div className="flex gap-4 sm:gap-8 justify-center flex-wrap">
                  <StatBox
                    name={a}
                    value={dA.label}
                    sub="평균 마지막 메시지"
                    color="pink"
                  />
                  <StatBox
                    name={b}
                    value={dB.label}
                    sub="평균 마지막 메시지"
                    color="purple"
                  />
                </div>
              </>
            );
          })()}
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 5. 배고픔 */}
      <Section gradient="from-orange-950 to-amber-950">
        <FadeIn>
          <SectionIcon emoji="🍔" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">배고픔 분석</h2>
          <p className="text-gray-400 mb-8">
            누가 더 배고프다고 많이 할까?
          </p>
          {(() => {
            const dA = result.hungry[a];
            const dB = result.hungry[b];
            const winner = dA.count >= dB.count ? a : b;
            const winColor = winner === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-3xl sm:text-5xl font-bold mb-6">
                  <span className={winColor}>{winner}</span>
                </p>
                <div className="flex gap-4 sm:gap-8 justify-center flex-wrap">
                  <StatBox
                    name={a}
                    value={`${dA.count}회`}
                    sub={`${dA.percent}%`}
                    color="pink"
                  />
                  <StatBox
                    name={b}
                    value={`${dB.count}회`}
                    sub={`${dB.percent}%`}
                    color="purple"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-6">
                  배고파, 밥, 먹자, 치킨, 야식 등 키워드 기준
                </p>
              </>
            );
          })()}
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 6. 계획성 */}
      <Section gradient="from-emerald-950 to-teal-950">
        <FadeIn>
          <SectionIcon emoji="📋" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">계획성 분석</h2>
          <p className="text-gray-400 mb-8">누가 더 계획적일까?</p>
          {(() => {
            const dA = result.planner[a];
            const dB = result.planner[b];
            const winner = dA.count >= dB.count ? a : b;
            const winColor = winner === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-3xl sm:text-5xl font-bold mb-6">
                  <span className={winColor}>{winner}</span>
                </p>
                <div className="flex gap-4 sm:gap-8 justify-center flex-wrap">
                  <StatBox
                    name={a}
                    value={`${dA.count}회`}
                    sub={`${dA.percent}%`}
                    color="pink"
                  />
                  <StatBox
                    name={b}
                    value={`${dB.count}회`}
                    sub={`${dB.percent}%`}
                    color="purple"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-6">
                  약속, 일정, 예약, 계획 등 키워드 기준
                </p>
              </>
            );
          })()}
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 7. 응답 속도 */}
      <Section gradient="from-violet-950 to-purple-950">
        <FadeIn>
          <SectionIcon emoji="📱" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">응답 속도 분석</h2>
          <p className="text-gray-400 mb-8">
            누가 더 연락이 잘 안될까?
          </p>
          {(() => {
            const dA = result.responseTime[a];
            const dB = result.responseTime[b];
            const slower =
              dA.avgMinutes >= dB.avgMinutes ? a : b;
            const slowerColor =
              slower === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-lg text-gray-400 mb-4">잠수 챔피언</p>
                <p className="text-3xl sm:text-5xl font-bold mb-6">
                  <span className={slowerColor}>{slower}</span>
                </p>
                <div className="flex gap-4 sm:gap-8 justify-center flex-wrap">
                  <StatBox
                    name={a}
                    value={formatMinutes(dA.avgMinutes)}
                    sub={`최대 ${formatMinutes(dA.maxMinutes)}`}
                    color="pink"
                  />
                  <StatBox
                    name={b}
                    value={formatMinutes(dB.avgMinutes)}
                    sub={`최대 ${formatMinutes(dB.maxMinutes)}`}
                    color="purple"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-6">
                  평균 답장 속도 기준 (4시간 이상 공백은 제외)
                </p>
              </>
            );
          })()}
        </FadeIn>
      </Section>

      {/* 8. AI 관계 분석 */}
      <Section gradient="from-rose-950 to-fuchsia-950">
        <FadeIn>
          <SectionIcon emoji="🤖" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">AI 관계 분석</h2>
          <p className="text-gray-400 mb-8">AI가 대화를 읽고 내린 진단</p>

          {aiLoading && (
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                <div className="w-3 h-3 rounded-full bg-fuchsia-400 dot-1" />
                <div className="w-3 h-3 rounded-full bg-fuchsia-400 dot-2" />
                <div className="w-3 h-3 rounded-full bg-fuchsia-400 dot-3" />
              </div>
              <p className="text-gray-400">AI가 관계를 읽고 있어요...</p>
            </div>
          )}

          {aiError && !aiLoading && (
            <div className="bg-white/5 rounded-2xl p-6">
              <p className="text-gray-400">AI 분석을 불러올 수 없었어요</p>
              <p className="text-gray-600 text-sm mt-2">통계 기반 분석은 정상적으로 완료됐어요</p>
            </div>
          )}

          {aiSections && !aiLoading && (
            <div className="space-y-4 text-left">
              {[
                { key: '관계요약', icon: '💫', color: 'border-fuchsia-500/30' },
                { key: '주도권', icon: '👑', color: 'border-yellow-500/30' },
                { key: '온도차', icon: '🌡️', color: 'border-red-500/30' },
                { key: '소통스타일', icon: '💬', color: 'border-blue-500/30' },
                { key: '위험신호', icon: '⚠️', color: 'border-orange-500/30' },
                { key: '한줄평', icon: '✨', color: 'border-purple-500/30' },
              ].map(({ key, icon, color }) =>
                aiSections[key] ? (
                  <div
                    key={key}
                    className={`bg-white/5 border-l-2 ${color} rounded-xl p-4`}
                  >
                    <p className="text-xs text-gray-500 mb-1">
                      {icon} {key}
                    </p>
                    <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                      {aiSections[key]}
                    </p>
                  </div>
                ) : null
              )}
            </div>
          )}
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* Ending */}
      <Section gradient="from-[#12071f] to-[#0a0a1a]">
        <FadeIn>
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">분석 완료!</h2>
          <p className="text-gray-400 mb-8">
            친구한테도 공유해보세요
          </p>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: '카톡해킹 - 카카오톡 대화 분석',
                  text: '카톡 대화를 넣으면 관계를 분석해줘요!',
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('링크가 복사됐어요!');
              }
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold px-8 py-4 rounded-full text-lg hover:from-pink-400 hover:to-purple-400 transition-all shadow-lg shadow-pink-500/25"
          >
            공유하기
          </button>
          <button
            onClick={() => window.location.reload()}
            className="block mx-auto mt-4 text-gray-500 hover:text-gray-300 transition-colors"
          >
            다시 분석하기
          </button>
        </FadeIn>
      </Section>
    </div>
  );
}

// ─── Shared Components ───

function Section({
  children,
  gradient,
}: {
  children: React.ReactNode;
  gradient: string;
}) {
  return (
    <section
      className={`snap-section bg-gradient-to-b ${gradient} px-6`}
    >
      <div className="w-full max-w-md mx-auto text-center px-2">{children}</div>
    </section>
  );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`fade-up ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

function SectionIcon({ emoji }: { emoji: string }) {
  return <div className="text-5xl mb-4">{emoji}</div>;
}

function ScrollHint() {
  return (
    <div className="mt-10 text-gray-600 scroll-indicator">
      <svg
        className="w-6 h-6 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </div>
  );
}

function StatBox({
  name,
  value,
  sub,
  color,
}: {
  name: string;
  value: string;
  sub: string;
  color: 'pink' | 'purple';
}) {
  const nameColor =
    color === 'pink' ? 'text-pink-400' : 'text-purple-400';
  return (
    <div className="bg-white/5 rounded-xl p-4 sm:p-5 min-w-[130px] flex-1 max-w-[200px]">
      <p className={`text-sm font-medium mb-1 ${nameColor}`}>{name}</p>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
      <p className="text-gray-500 text-xs mt-1">{sub}</p>
    </div>
  );
}

function CompareBar({
  label,
  vA,
  vB,
  nameA,
  nameB,
}: {
  label: string;
  vA: number;
  vB: number;
  nameA: string;
  nameB: string;
}) {
  const total = vA + vB || 1;
  const pA = Math.round((vA / total) * 100);
  const pB = 100 - pA;
  const winner = vA >= vB ? nameA : nameB;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-500">
          {winner === nameA ? `${nameA} ${pA}%` : `${nameB} ${pB}%`}
        </span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
        <div
          className="bg-pink-400/80 transition-all duration-1000"
          style={{ width: `${pA}%` }}
        />
        <div
          className="bg-purple-400/80 transition-all duration-1000"
          style={{ width: `${pB}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>
          {nameA}: {typeof vA === 'number' && vA % 1 !== 0 ? vA.toFixed(1) : vA}
        </span>
        <span>
          {nameB}: {typeof vB === 'number' && vB % 1 !== 0 ? vB.toFixed(1) : vB}
        </span>
      </div>
    </div>
  );
}

function formatMinutes(min: number): string {
  if (min < 1) return '1분 미만';
  if (min < 60) return `${Math.round(min)}분`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}
