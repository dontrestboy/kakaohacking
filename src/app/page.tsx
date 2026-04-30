'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { parseKakaoChat } from '@/lib/parser';
import { analyze, AnalysisResult } from '@/lib/analyzer';

type Phase = 'upload' | 'analyzing' | 'result';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [result, setResult] = useState<AnalysisResult | null>(null);
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
    return <ResultScreen result={result} scrollRef={scrollRef} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-5xl font-bold mb-3">
          <span className="text-yellow-400">카톡</span>해킹
        </h1>
        <p className="text-gray-400 mb-10 text-lg">
          카카오톡 대화를 넣으면 관계를 분석해드려요
        </p>

        <div
          className={`border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${
            dragOver
              ? 'border-yellow-400 bg-yellow-400/10'
              : 'border-gray-600 hover:border-gray-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="text-5xl mb-4">💬</div>
          <p className="text-gray-300 text-lg mb-2">
            카톡 대화 파일을 드래그하거나 클릭하세요
          </p>
          <p className="text-gray-500 text-sm">
            카카오톡 &gt; 대화방 &gt; 메뉴 &gt; 대화 내보내기 (.txt)
          </p>
          <input
            id="file-input"
            type="file"
            accept=".txt,.csv"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {error && (
          <p className="mt-6 text-red-400 bg-red-400/10 rounded-xl p-4">
            {error}
          </p>
        )}

        <p className="mt-8 text-gray-600 text-xs">
          모든 분석은 브라우저에서만 이루어져요. 서버에 데이터가 전송되지 않습니다.
        </p>
      </div>
    </div>
  );
}

function AnalyzingScreen() {
  const messages = [
    '대화 읽는 중...',
    '몰래 분석하는 중...',
    '관계 해킹하는 중...',
    '거의 다 됐어요...',
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => Math.min(i + 1, messages.length - 1));
    }, 500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center gap-3 mb-6">
          <div className="w-4 h-4 rounded-full bg-yellow-400 dot-1" />
          <div className="w-4 h-4 rounded-full bg-yellow-400 dot-2" />
          <div className="w-4 h-4 rounded-full bg-yellow-400 dot-3" />
        </div>
        <p className="text-xl text-gray-300">{messages[msgIdx]}</p>
      </div>
    </div>
  );
}

// ─── Result Screen ───

function ResultScreen({
  result,
  scrollRef,
}: {
  result: AnalysisResult;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [a, b] = result.participants;

  return (
    <div ref={scrollRef} className="snap-container">
      {/* Intro */}
      <Section gradient="from-gray-900 to-gray-800">
        <FadeIn>
          <p className="text-yellow-400 text-sm font-bold tracking-widest mb-4">
            ANALYSIS COMPLETE
          </p>
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-yellow-400">{a}</span>
            <span className="text-gray-500 mx-3">vs</span>
            <span className="text-blue-400">{b}</span>
          </h2>
          <div className="flex gap-8 justify-center text-gray-400 mt-6">
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
          <h2 className="text-3xl font-bold mb-2">애착 유형 분석</h2>
          <p className="text-gray-400 mb-8">누가 불안형이고 누가 안정형일까?</p>
          <div className="grid grid-cols-2 gap-6 w-full max-w-md">
            {[a, b].map((name, i) => {
              const d = result.attachment[name];
              return (
                <div
                  key={name}
                  className="bg-white/5 rounded-2xl p-6 text-center"
                >
                  <p className={`text-sm mb-1 ${i === 0 ? 'text-yellow-400' : 'text-blue-400'}`}>
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
          <h2 className="text-3xl font-bold mb-2">호감도 분석</h2>
          <p className="text-gray-400 mb-8">
            누가 더 좋아하는 마음이 강할까?
          </p>
          {(() => {
            const dA = result.affection[a];
            const dB = result.affection[b];
            const winner = dA.score >= dB.score ? a : b;
            const winColor = winner === a ? 'text-yellow-400' : 'text-blue-400';
            return (
              <>
                <p className="text-5xl font-bold mb-6">
                  <span className={winColor}>{winner}</span>
                </p>
                <div className="w-full max-w-md space-y-4">
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
          <h2 className="text-3xl font-bold mb-2">선톡 분석</h2>
          <p className="text-gray-400 mb-8">
            누가 먼저 대화를 시작할까?
          </p>
          {(() => {
            const dA = result.firstMessage[a];
            const dB = result.firstMessage[b];
            const winner = dA.count >= dB.count ? a : b;
            const winColor = winner === a ? 'text-yellow-400' : 'text-blue-400';
            return (
              <>
                <p className="text-lg text-gray-400 mb-4">
                  먼저 연락하는 사람
                </p>
                <p className="text-5xl font-bold mb-2">
                  <span className={winColor}>{winner}</span>
                </p>
                <div className="flex gap-8 mt-6">
                  <StatBox
                    name={a}
                    value={`${dA.count}회`}
                    sub={`${dA.percent}%`}
                    color="yellow"
                  />
                  <StatBox
                    name={b}
                    value={`${dB.count}회`}
                    sub={`${dB.percent}%`}
                    color="blue"
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
          <h2 className="text-3xl font-bold mb-2">수면 패턴</h2>
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
              earlyBird === a ? 'text-yellow-400' : 'text-blue-400';
            return (
              <>
                <p className="text-lg text-gray-400 mb-4">
                  먼저 잠드는 사람
                </p>
                <p className="text-5xl font-bold mb-6">
                  <span className={earlyColor}>{earlyBird}</span>
                </p>
                <div className="flex gap-8">
                  <StatBox
                    name={a}
                    value={dA.label}
                    sub="평균 마지막 메시지"
                    color="yellow"
                  />
                  <StatBox
                    name={b}
                    value={dB.label}
                    sub="평균 마지막 메시지"
                    color="blue"
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
          <h2 className="text-3xl font-bold mb-2">배고픔 분석</h2>
          <p className="text-gray-400 mb-8">
            누가 더 배고프다고 많이 할까?
          </p>
          {(() => {
            const dA = result.hungry[a];
            const dB = result.hungry[b];
            const winner = dA.count >= dB.count ? a : b;
            const winColor = winner === a ? 'text-yellow-400' : 'text-blue-400';
            return (
              <>
                <p className="text-5xl font-bold mb-6">
                  <span className={winColor}>{winner}</span>
                </p>
                <div className="flex gap-8">
                  <StatBox
                    name={a}
                    value={`${dA.count}회`}
                    sub={`${dA.percent}%`}
                    color="yellow"
                  />
                  <StatBox
                    name={b}
                    value={`${dB.count}회`}
                    sub={`${dB.percent}%`}
                    color="blue"
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
          <h2 className="text-3xl font-bold mb-2">계획성 분석</h2>
          <p className="text-gray-400 mb-8">누가 더 계획적일까?</p>
          {(() => {
            const dA = result.planner[a];
            const dB = result.planner[b];
            const winner = dA.count >= dB.count ? a : b;
            const winColor = winner === a ? 'text-yellow-400' : 'text-blue-400';
            return (
              <>
                <p className="text-5xl font-bold mb-6">
                  <span className={winColor}>{winner}</span>
                </p>
                <div className="flex gap-8">
                  <StatBox
                    name={a}
                    value={`${dA.count}회`}
                    sub={`${dA.percent}%`}
                    color="yellow"
                  />
                  <StatBox
                    name={b}
                    value={`${dB.count}회`}
                    sub={`${dB.percent}%`}
                    color="blue"
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
          <h2 className="text-3xl font-bold mb-2">응답 속도 분석</h2>
          <p className="text-gray-400 mb-8">
            누가 더 연락이 잘 안될까?
          </p>
          {(() => {
            const dA = result.responseTime[a];
            const dB = result.responseTime[b];
            const slower =
              dA.avgMinutes >= dB.avgMinutes ? a : b;
            const slowerColor =
              slower === a ? 'text-yellow-400' : 'text-blue-400';
            return (
              <>
                <p className="text-lg text-gray-400 mb-4">잠수 챔피언</p>
                <p className="text-5xl font-bold mb-6">
                  <span className={slowerColor}>{slower}</span>
                </p>
                <div className="flex gap-8">
                  <StatBox
                    name={a}
                    value={formatMinutes(dA.avgMinutes)}
                    sub={`최대 ${formatMinutes(dA.maxMinutes)}`}
                    color="yellow"
                  />
                  <StatBox
                    name={b}
                    value={formatMinutes(dB.avgMinutes)}
                    sub={`최대 ${formatMinutes(dB.maxMinutes)}`}
                    color="blue"
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

      {/* Ending */}
      <Section gradient="from-gray-900 to-gray-800">
        <FadeIn>
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="text-3xl font-bold mb-4">분석 완료!</h2>
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
            className="bg-yellow-400 text-black font-bold px-8 py-4 rounded-full text-lg hover:bg-yellow-300 transition-colors"
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
      <div className="max-w-lg w-full text-center">{children}</div>
    </section>
  );
}

function FadeIn({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`fade-up ${visible ? 'visible' : ''}`}>
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
  color: 'yellow' | 'blue';
}) {
  const nameColor =
    color === 'yellow' ? 'text-yellow-400' : 'text-blue-400';
  return (
    <div className="bg-white/5 rounded-xl p-5 min-w-[140px]">
      <p className={`text-sm font-medium mb-1 ${nameColor}`}>{name}</p>
      <p className="text-2xl font-bold">{value}</p>
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
          className="bg-yellow-400/80 transition-all duration-1000"
          style={{ width: `${pA}%` }}
        />
        <div
          className="bg-blue-400/80 transition-all duration-1000"
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
