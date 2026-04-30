'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { parseKakaoChat, ChatMessage } from '@/lib/parser';
import { analyze, AnalysisResult, getComment } from '@/lib/analyzer';

type Phase = 'onboarding' | 'funnel' | 'analyzing' | 'result';
// 한국어 조사 헬퍼 (받침 유무에 따라 이/가, 은/는, 을/를)
function getParticle(name: string, particles: [string, string]): string {
  const lastChar = name.charCodeAt(name.length - 1);
  const hasBatchim = (lastChar - 0xAC00) % 28 !== 0;
  return hasBatchim ? particles[0] : particles[1];
}


export default function Home() {
  const [phase, setPhase] = useState<Phase>('onboarding');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState('');
  const [userGender, setUserGender] = useState('');
  const [userQuestion, setUserQuestion] = useState('');

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setPhase('analyzing');
    try {
      const text = await file.text();
      const parsed = parseKakaoChat(text);
      if (parsed.participants.length < 2) {
        setError('1:1 대화만 분석할 수 있어요. 두 명의 대화가 필요합니다.');
        setPhase('funnel');
        return;
      }
      if (parsed.messages.length < 20) {
        setError('대화가 너무 짧아요. 최소 20개 이상의 메시지가 필요합니다.');
        setPhase('funnel');
        return;
      }
      const twoParticipants = parsed.participants.slice(0, 2);
      const filtered = parsed.messages.filter((m) => twoParticipants.includes(m.sender));
      await new Promise((r) => setTimeout(r, 2000));
      const analysis = analyze(twoParticipants, filtered);
      setResult(analysis);
      setMessages(filtered);
      setPhase('result');
    } catch {
      setError('파일을 읽을 수 없어요. 카카오톡 대화 내보내기 파일(.txt)을 넣어주세요.');
      setPhase('funnel');
    }
  }, []);

  if (phase === 'analyzing') return <AnalyzingScreen />;
  if (phase === 'result' && result) {
    return <ResultScreen result={result} messages={messages} scrollRef={scrollRef} userQuestion={userQuestion} />;
  }
  if (phase === 'funnel') {
    return (
      <FunnelScreen
        userName={userName} setUserName={setUserName}
        userGender={userGender} setUserGender={setUserGender}
        userQuestion={userQuestion} setUserQuestion={setUserQuestion}
        onFileChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
        error={error}
        onBack={() => setPhase('onboarding')}
      />
    );
  }
  return <OnboardingScreen onStart={() => setPhase('funnel')} />;
}

// ─── Onboarding Screen ───

function OnboardingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-md mx-auto px-5 py-12">

        {/* Hero */}
        <FadeIn>
          <div className="text-center mb-10">
            <div className="gentle-float mb-6">
              <img src="/hero-park.png" alt="" width={340} height={340} className="mx-auto rounded-2xl" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">누가 더 좋아할까?<br /><span className="text-xl font-bold text-gray-500">카톡 분석기</span></h1>
            <p className="text-base text-gray-500 leading-relaxed">
              둘 중 누가 더 좋아하는지,<br />
              카톡은 알고 있어요
            </p>
          </div>
        </FadeIn>

        {/* 미리보기 zip */}
        <FadeIn>
          <div className="mb-10">
            <span className="inline-block text-xs font-bold text-pink-500 bg-pink-50 px-3 py-1 rounded-full mb-4">미리보기 zip.</span>
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-xl font-bold text-gray-900 mb-4">✔ 이런 게 궁금하다면?</p>
              <ul className="space-y-2.5 text-[15px] text-gray-600 mb-6">
                <li className="flex items-start gap-2"><span className="text-gray-300 mt-0.5">•</span>둘 중 누가 더 좋아하고 있을까?</li>
                <li className="flex items-start gap-2"><span className="text-gray-300 mt-0.5">•</span>상대방은 나한테 마음이 있을까? 💕</li>
                <li className="flex items-start gap-2"><span className="text-gray-300 mt-0.5">•</span>나는 불안형일까, 안정형일까?</li>
                <li className="flex items-start gap-2"><span className="text-gray-300 mt-0.5">•</span>이 관계, 이어갈 수 있을까...? 🥺</li>
                <li className="flex items-start gap-2"><span className="text-gray-300 mt-0.5">•</span>AI가 직접 읽고 내린 관계 진단 🤖</li>
              </ul>
              <p className="text-[15px] text-gray-700 leading-relaxed">
                👍 이런 분들이 찔리면서도 도움 됐다고 말한 리포트,<br />
                <span className="font-bold">지금 바로 받아보실 수 있어요.</span>
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Section: 리포트 소개 */}
        <FadeIn>
          <div className="text-center mb-8">
            <p className="text-xs text-pink-400 font-semibold tracking-widest mb-2">REPORT</p>
            <h2 className="text-xl font-bold text-gray-900">아주 세세한 카톡 분석 리포트</h2>
          </div>
        </FadeIn>

        {/* 분석 항목 카드들 */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-10 space-y-3">
          <FadeIn delay={50}>
            <div className="bg-white rounded-xl p-4">
              <p className="text-lg font-bold text-gray-900 mb-3">🔍 둘 중 누가 더 좋아할까?</p>
              <div className="space-y-1.5 text-sm text-gray-500">
                <p>메시지 수, 평균 글자수, 질문 횟수 비교</p>
                <p>상대방은 지금 나한테 마음이 있을까? 🧐</p>
                <p>이모티콘 사용량으로 보는 애정 표현 📱</p>
                <p>호감도 점수 산출</p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="bg-white rounded-xl p-4">
              <p className="text-lg font-bold text-gray-900 mb-3">💕 애착 유형 분석</p>
              <div className="space-y-1.5 text-sm text-gray-500">
                <p>나는 불안형일까, 안정형일까?</p>
                <p>연속 문자 패턴으로 보는 집착 지수</p>
                <p>답장 기다리는 시간 분석 ⏰</p>
                <p>불안 지수 점수</p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="bg-white rounded-xl p-4">
              <p className="text-lg font-bold text-gray-900 mb-3">💬 누가 먼저 연락할까?</p>
              <div className="space-y-1.5 text-sm text-gray-500">
                <p>선톡 비율과 횟수 비교</p>
                <p>응답 속도 분석 — 잠수 챔피언은 누구?</p>
                <p>읽씹 횟수와 패턴 👻</p>
                <p>수면 패턴으로 보는 생활 리듬</p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="bg-white rounded-xl p-4">
              <p className="text-lg font-bold text-gray-900 mb-3">🔗 이 관계, 이어갈 수 있을까?</p>
              <div className="space-y-1.5 text-sm text-gray-500">
                <p>시간대별 대화 히트맵 🕐</p>
                <p>주간 트렌드 — 대화량은 늘었을까? 📈</p>
                <p>관계 온도 변화 🌡️</p>
                <p>이 관계를 오래 끌고 가려면?</p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={250}>
            <div className="bg-white rounded-xl p-4 border border-pink-100">
              <span className="inline-block text-xs font-bold text-pink-500 bg-pink-50 px-2.5 py-0.5 rounded mb-2">BONUS!</span>
              <p className="text-lg font-bold text-gray-900 mb-3">🤖 AI가 직접 읽고 내린 관계 진단</p>
              <div className="space-y-1.5 text-sm text-gray-500">
                <p>관계 요약, 주도권, 온도차 분석</p>
                <p>소통 스타일 진단</p>
                <p>위험 신호 감지 ⚠️</p>
              </div>
            </div>
          </FadeIn>
        </div>


        {/* 실제 후기 */}
        <FadeIn>
          <div className="text-center mb-6">
            <p className="text-xs text-pink-400 font-semibold tracking-widest mb-2">REVIEW</p>
            <h2 className="text-xl font-bold text-gray-900 mb-1">실제 사용 후기</h2>
            <p className="text-sm text-gray-400">숫자와 후기가 증명하는 분석의 정확도</p>
          </div>
        </FadeIn>

        <div className="bg-gray-50 rounded-2xl p-5 mb-10 space-y-3">
          {[
            {
              tag: '소름 돋았어요',
              tagColor: 'bg-pink-100 text-pink-500',
              text: '제가 더 좋아하고 있다는 거 알고 있었는데, 숫자로 딱 보니까 소름이었어요. 선톡 비율 78% 나왔는데 진짜 맞아요 ㅋㅋㅋ',
            },
            {
              tag: '결과대로 했더니',
              tagColor: 'bg-purple-100 text-purple-500',
              text: '남친이 불안형으로 나와서 좀 더 자주 연락해줬더니 사이가 진짜 좋아졌어요. 데이터가 말해주는 게 있더라고요.',
            },
            {
              tag: '같이 봤는데 난리남',
              tagColor: 'bg-blue-100 text-blue-500',
              text: '커플끼리 같이 봤는데 서로 잠수 챔피언이라고 싸움 날 뻔했어요 ㅋㅋㅋ 근데 진짜 재밌어서 친구들한테도 다 공유함',
            },
            {
              tag: '정확해서 무서움',
              tagColor: 'bg-orange-100 text-orange-500',
              text: '수면 패턴 분석에서 제가 항상 먼저 잠든다고 나왔는데... 맞아요. 새벽에 답장 안 하는 거 다 들켰네요.',
            },
            {
              tag: '썸남한테 들이밀었음',
              tagColor: 'bg-green-100 text-green-600',
              text: '호감도에서 상대방이 더 높게 나와서 용기 내서 고백했는데 사귀게 됐어요!! 카톡 분석기 감사합니다 진심으로',
            },
          ].map((review, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div className="bg-white rounded-xl p-4">
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2.5 ${review.tagColor}`}>
                  {review.tag}
                </span>
                <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* 타겟 체크리스트 */}
        <FadeIn>
          <div className="bg-gray-50 rounded-2xl p-5 mb-10">
            <p className="font-bold text-gray-900 mb-4">이런 사람에게 추천해요</p>
            <div className="space-y-2.5">
              {[
                '썸 타는 중인데 상대 마음이 궁금한 사람',
                '연인이랑 누가 더 좋아하는지 내기하고 싶은 사람',
                '요즘 답장이 느려진 게 신경 쓰이는 사람',
                '같이 보면서 깔깔거리고 싶은 커플',
              ].map((text) => (
                <div key={text} className="flex items-start gap-2">
                  <span className="text-pink-400 mt-0.5">&#10003;</span>
                  <span className="text-sm text-gray-600">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn>
          <p className="text-center text-gray-300 text-[11px]">
            모든 분석은 브라우저에서만 이루어져요. 서버 전송 없음.
          </p>
        </FadeIn>

      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 p-4 z-50">
        <div className="max-w-md mx-auto">
          <button
            onClick={onStart}
            className="w-full bg-pink-400 text-white font-bold py-3 rounded-xl text-base active:scale-[0.98] transition-transform"
          >
            무료로 분석 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Funnel Screen ───

function FunnelScreen({
  userName, setUserName,
  userGender, setUserGender,
  userQuestion, setUserQuestion,
  onFileChange, error, onBack,
}: {
  userName: string; setUserName: (v: string) => void;
  userGender: string; setUserGender: (v: string) => void;
  userQuestion: string; setUserQuestion: (v: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string; onBack: () => void;
}) {
  const [step, setStep] = useState<'name' | 'gender' | 'question' | 'upload'>('name');
  const steps = ['name', 'gender', 'question', 'upload'] as const;

  const goBack = () => {
    const idx = steps.indexOf(step);
    if (idx === 0) onBack();
    else setStep(steps[idx - 1]);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <button onClick={goBack} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 mb-8">
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
              steps.indexOf(step) >= i ? 'bg-pink-400' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 max-w-md mx-auto w-full">
        {step === 'name' && (
          <FadeIn>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">이름을 알려주세요</h2>
            <p className="text-gray-400 text-sm mb-8">분석 결과에 표시돼요</p>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="이름 또는 닉네임"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg text-gray-900 focus:border-pink-400 focus:outline-none transition-colors"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && userName.trim()) setStep('gender'); }}
            />
            <button
              onClick={() => userName.trim() && setStep('gender')}
              disabled={!userName.trim()}
              className="w-full mt-6 bg-pink-400 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-40 transition-opacity"
            >
              다음
            </button>
          </FadeIn>
        )}

        {step === 'gender' && (
          <FadeIn>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">성별이 뭐예요?</h2>
            <p className="text-gray-400 text-sm mb-8">분석 정확도를 높여줘요</p>
            <div className="grid grid-cols-2 gap-4">
              {['남자', '여자'].map((g) => (
                <button
                  key={g}
                  onClick={() => { setUserGender(g); setStep('question'); }}
                  className={`p-6 rounded-2xl text-center border-2 transition-all ${
                    userGender === g
                      ? 'border-pink-400 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{g === '남자' ? '👨' : '👩'}</div>
                  <p className="font-bold text-gray-900">{g}</p>
                </button>
              ))}
            </div>
          </FadeIn>
        )}

        {step === 'question' && (
          <FadeIn>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">가장 궁금한 게 뭐예요?</h2>
            <p className="text-gray-400 text-sm mb-8">AI가 대화를 읽고 직접 답변해줘요</p>
            <div className="space-y-3">
              {[
                { emoji: '❤️', text: '상대방도 나를 좋아할까?' },
                { emoji: '🔥', text: '이 관계, 발전 가능성 있을까?' },
                { emoji: '💔', text: '요즘 연락이 뜸해진 이유가 뭘까?' },
                { emoji: '😍', text: '그냥 재미로 해보고 싶어!' },
              ].map(({ emoji, text }) => (
                <button
                  key={text}
                  onClick={() => { setUserQuestion(text); setStep('upload'); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    userQuestion === text && !userQuestion.startsWith('__custom:')
                      ? 'border-pink-400 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <span className="mr-2">{emoji}</span>
                  <span className="text-gray-900 font-medium">{text}</span>
                </button>
              ))}

              {/* 기타 직접 입력 */}
              <div className={`rounded-xl border-2 transition-all overflow-hidden ${
                userQuestion.startsWith('__custom:') ? 'border-pink-400 bg-pink-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center p-4 gap-2">
                  <span>✏️</span>
                  <input
                    type="text"
                    placeholder="직접 입력하기..."
                    value={userQuestion.startsWith('__custom:') ? userQuestion.slice(9) : ''}
                    onChange={(e) => setUserQuestion(`__custom:${e.target.value}`)}
                    className="flex-1 bg-transparent text-gray-900 font-medium placeholder-gray-400 focus:outline-none"
                  />
                </div>
                {userQuestion.startsWith('__custom:') && userQuestion.length > 9 && (
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => setStep('upload')}
                      className="w-full bg-pink-400 text-white font-bold py-3 rounded-lg text-sm"
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        )}

        {step === 'upload' && (
          <FadeIn>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">카톡 대화 파일을 올려주세요</h2>
            <p className="text-gray-400 text-sm mb-8">카카오톡 대화 내보내기 파일 (.txt)</p>

            <div
              onClick={() => document.getElementById('funnel-file')?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 transition-all mb-4"
            >
              <div className="text-4xl mb-3">📁</div>
              <p className="text-gray-900 font-bold mb-1">파일 선택하기</p>
              <p className="text-gray-400 text-sm">.txt 또는 .csv 파일</p>
              <input id="funnel-file" type="file" accept=".txt,.csv" className="hidden" onChange={onFileChange} />
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <p className="text-gray-500 text-xs font-medium mb-3">카톡 대화 내보내기 방법</p>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 mb-4">
                <p className="text-xs font-bold text-pink-400 mb-2">📱 모바일</p>
                <div className="space-y-2 mb-4">
                  <div className="flex gap-3">
                    <span className="bg-pink-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                    <p>분석할 <b className="text-gray-700">1:1 대화방</b>을 열어요</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="bg-pink-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                    <p>우측 상단 <b className="text-gray-700">≡ → 설정(⚙️)</b>을 눌러요</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="bg-pink-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                    <p><b className="text-gray-700">대화 내보내기 → 텍스트만</b> 저장</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-purple-400 mb-2">💻 PC</p>
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <span className="bg-purple-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                    <p>분석할 <b className="text-gray-700">1:1 대화방</b>을 열어요</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="bg-purple-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                    <p>우측 상단 <b className="text-gray-700">≡ → 대화 내보내기</b></p>
                  </div>
                  <div className="flex gap-3">
                    <span className="bg-purple-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                    <p><b className="text-gray-700">.txt 파일</b>로 저장해요</p>
                  </div>
                </div>
              </div>

            <p className="text-center text-gray-300 text-[11px] mt-4">
              모든 분석은 브라우저에서만 이루어져요. 서버 전송 없음.
            </p>
          </FadeIn>
        )}
      </div>
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="gentle-float mb-8">
          <img src="/hero-park.png" alt="" width={180} height={180} className="mx-auto rounded-2xl" />
        </div>
        <div className="flex justify-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-pink-300 dot-1" />
          <div className="w-2 h-2 rounded-full bg-pink-300 dot-2" />
          <div className="w-2 h-2 rounded-full bg-pink-300 dot-3" />
        </div>
        <p className="text-base text-gray-400">{msgs[msgIdx]}</p>
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
  userQuestion = '',
}: {
  result: AnalysisResult;
  messages: ChatMessage[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  userQuestion?: string;
}) {
  const [a, b] = result.participants;
  const [unlocked, setUnlocked] = useState(false);
  const [aiSections, setAiSections] = useState<AISections | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    setAiLoading(true);
    setAiError(false);

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
            userQuestion: userQuestion.startsWith('__custom:') ? userQuestion.slice(9) : userQuestion,
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
  }, [unlocked]);

  return (
    <div ref={scrollRef} className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 py-12">
      {/* Intro */}
      <FadeIn>
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold text-pink-500 bg-pink-50 px-3 py-1 rounded-full mb-4">ANALYSIS COMPLETE</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            <span className="text-pink-500">{a}</span>
            <span className="text-gray-300 mx-2">vs</span>
            <span className="text-purple-500">{b}</span>
          </h2>
          <div className="flex gap-8 justify-center mt-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">{result.totalMessages.toLocaleString()}</p>
              <p className="text-xs text-gray-400">총 메시지</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{result.totalDays}</p>
              <p className="text-xs text-gray-400">일간</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 앞선 질문에 대한 답변 */}
      {userQuestion && (
        <Section gradient="">
          <FadeIn>
            <SectionIcon emoji="🎯" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">앞선 질문에 대한 답변</h2>
            <p className="text-gray-600 mb-6">&ldquo;{userQuestion.startsWith('__custom:') ? userQuestion.slice(9) : userQuestion}&rdquo;</p>
            {aiSections?.['맞춤답변'] ? (
              <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 text-left">
                <p className="text-sm text-gray-700 leading-relaxed">{aiSections['맞춤답변']}</p>
              </div>
            ) : aiLoading ? (
              <div className="space-y-4">
                <div className="flex justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-pink-400 dot-1" />
                  <div className="w-3 h-3 rounded-full bg-pink-400 dot-2" />
                  <div className="w-3 h-3 rounded-full bg-pink-400 dot-3" />
                </div>
                <p className="text-gray-500 text-sm">AI가 답변을 준비하고 있어요...</p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">잠금해제 후 AI가 답변해드려요</p>
            )}
          </FadeIn>
        </Section>
      )}

      {/* 1. 불안형 vs 안정형 */}
      <Section gradient="from-purple-950 to-pink-950">
        <FadeIn>
          <SectionIcon emoji="💕" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">애착 유형 분석</h2>
          <p className="text-gray-600 mb-6">둘 중 더 불안형인 사람은?</p>
          {(() => {
            const dA = result.attachment[a];
            const dB = result.attachment[b];
            const anxious = dA.score >= dB.score ? a : b;
            const secure = anxious === a ? b : a;
            const anxiousData = anxious === a ? dA : dB;
            const anxiousColor = anxious === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-3xl sm:text-5xl font-bold text-gray-900 mb-2">
                  <span className={anxiousColor}>{anxious}</span>
                </p>
                <p className="text-gray-600 text-sm mb-6">불안지수 {anxiousData.score}점 · 연속문자 {anxiousData.doubleTexts}회 · 읽씹 후 기다림 {anxiousData.longWaits}회</p>

                {/* 분석 근거 — 카톡 스타일 */}
                {anxiousData.evidence.length > 0 && (
                  <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden mb-4">
                    {/* 카톡 채팅방 헤더 */}
                    <div className="bg-[#B2C7D9] px-4 py-2.5 text-center">
                      <p className="text-xs text-white/80 font-medium">{anxious}의 실제 대화</p>
                    </div>
                    {/* 카톡 채팅방 */}
                    <div className="bg-[#B2C7D9]/30 px-4 py-4 space-y-1.5">
                      {anxiousData.evidence.map((msg, i) => (
                        <div key={i} className="flex justify-start">
                          <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-gray-900 max-w-[80%] shadow-sm">
                            {msg}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 판단 근거 상세 */}
                <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mb-4 text-left">
                  <p className="text-sm font-bold text-gray-900 mb-2">왜 {anxious}{getParticle(anxious, ['이', '가'])} 불안형일까?</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    위 대화를 보면, {anxious}는 상대방 답장이 오지 않아도 연속으로 메시지를 보내는 패턴이 뚜렷해요. 전체 대화에서 이런 연속 메시지가 <b>{anxiousData.doubleTexts}회</b>나 발견됐어요.
                    {anxiousData.longWaits > 0 && ` 읽씹을 당한 뒤에도 먼저 다시 연락한 횟수도 ${anxiousData.longWaits}회로, 상대의 반응을 기다리지 못하고 확인하려는 성향이 강하게 나타나요.`}
                    {' '}종합 불안 지수는 <b>{anxiousData.score}점</b>으로, {anxiousData.score >= 70 ? '상대 반응에 매우 민감하고 혼자 대화를 이끌어가려는 경향이 뚜렷해요. 답장이 조금만 늦어도 불안해하는 타입이에요.' : anxiousData.score >= 40 ? '평소에는 여유가 있지만, 가끔 상대 반응이 없으면 불안해하며 먼저 연락하는 편이에요.' : '비교적 안정적이지만, 특정 상황에서는 살짝 불안한 면이 보여요.'}
                  </p>
                </div>

                <div className="flex gap-4 justify-center text-sm text-gray-600 mb-2">
                  <span>{anxious}: <b className={anxiousColor}>불안형</b></span>
                  <span className="text-gray-300">|</span>
                  <span>{secure}: <b className="text-green-500">안정형</b></span>
                </div>

                <Comment text={getComment('attachment', result)} />
                <SectionShare text={`💕 애착 유형 분석 결과: ${anxious}${getParticle(anxious, ["이", "가"])} 더 불안형! (불안지수 ${anxiousData.score}점)`} />
              </>
            );
          })()}
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* Paywall Gate */}
      {!unlocked && (
        <Section gradient="from-[#0a0a1a] to-[#12071f]">
          <FadeIn>
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">나머지 11개 분석 보기</h2>
            <p className="text-gray-400 mb-2">호감도, 선톡, 수면패턴, 응답속도, 읽씹...</p>
            <p className="text-gray-500 text-sm mb-8">+ AI 관계 진단까지 전부 포함</p>
            <button
              onClick={() => setUnlocked(true)}
              className="bg-pink-400 text-white font-bold px-8 py-3 rounded-full text-base active:scale-[0.98] transition-transform"
            >
              전체 리포트 잠금해제
            </button>
            <p className="text-gray-400 text-xs mt-3">₩3,900</p>
            <button
              onClick={() => window.location.reload()}
              className="text-gray-400 hover:text-gray-600 text-sm mt-4 transition-colors"
            >
              다시 분석하기
            </button>
          </FadeIn>
        </Section>
      )}

      {unlocked && (<>
      {/* 2. 누가 더 좋아해 */}
      <Section gradient="from-red-950 to-pink-950">
        <FadeIn>
          <SectionIcon emoji="❤️" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">호감도 분석</h2>
          <p className="text-gray-600 mb-6">
            누가 더 좋아하는 마음이 강할까?
          </p>
          {(() => {
            const dA = result.affection[a];
            const dB = result.affection[b];
            const winner = dA.score >= dB.score ? a : b;
            const winColor = winner === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6">
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
                <Evidence messages={result.affection[dA.score >= dB.score ? a : b].evidence} label={`${winner}의 실제 대화`} />
                <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
                  <p className="text-sm font-bold text-gray-900 mb-2">왜 {winner}{getParticle(winner, ['이', '가'])} 더 좋아할까?</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {winner}는 메시지 수({winner === a ? dA.messageCount : dB.messageCount}개), 평균 글자수({winner === a ? dA.avgLength : dB.avgLength}자), 질문 횟수({winner === a ? dA.questionCount : dB.questionCount}회) 모두에서 상대보다 높은 수치를 보여요.
                    {' '}특히 질문을 많이 한다는 건 상대에 대한 관심이 크다는 증거예요. 이모티콘 사용량({winner === a ? dA.emojiCount : dB.emojiCount}회)도 감정 표현에 더 적극적이라는 걸 보여줘요.
                    {' '}종합적으로 {winner}{getParticle(winner, ['이', '가'])} 이 관계에서 더 많은 감정적 에너지를 쏟고 있어요.
                  </p>
                </div>
                <Comment text={getComment('affection', result)} />
                <SectionShare text={`❤️ 호감도 분석: ${winner}${getParticle(winner, ["이", "가"])} 더 좋아하고 있어!`} />
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">선톡 분석</h2>
          <p className="text-gray-600 mb-6">
            누가 먼저 대화를 시작할까?
          </p>
          {(() => {
            const dA = result.firstMessage[a];
            const dB = result.firstMessage[b];
            const winner = dA.count >= dB.count ? a : b;
            const winColor = winner === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-lg text-gray-600 mb-4">
                  먼저 연락하는 사람
                </p>
                <p className="text-3xl sm:text-5xl font-bold text-gray-900 mb-2">
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
                <Evidence messages={result.firstMessage[winner].evidence} label={`${winner}의 선톡 메시지`} />
                <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
                  <p className="text-sm font-bold text-gray-900 mb-2">선톡이 의미하는 것은?</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {winner}{getParticle(winner, ['은', '는'])} 전체 대화 시작의 {Math.max(dA.percent, dB.percent)}%를 차지해요.
                    {' '}먼저 연락한다는 건 상대가 생각나서 대화를 걸고 싶다는 뜻이에요. 위 메시지를 보면 {winner}{getParticle(winner, ['이', '가'])} 다양한 주제로 먼저 말을 거는 패턴이 보여요.
                    {Math.abs(dA.percent - dB.percent) > 30 ? ` ${Math.abs(dA.percent - dB.percent)}%p 차이는 꽤 큰 편이에요. 한쪽이 관계를 주도적으로 이끌어가고 있어요.` : ' 차이가 크지 않아서 서로 균형잡힌 관계라고 볼 수 있어요.'}
                  </p>
                </div>
                <Comment text={getComment('firstMessage', result)} />
                <SectionShare text={`💬 선톡 분석: ${winner}${getParticle(winner, ["이", "가"])} ${Math.max(result.firstMessage[a].percent, result.firstMessage[b].percent)}% 먼저 연락해!`} />
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">수면 패턴</h2>
          <p className="text-gray-600 mb-6">누가 더 빨리 잘까?</p>
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
                <p className="text-lg text-gray-600 mb-4">
                  먼저 잠드는 사람
                </p>
                <p className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6">
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
                <Evidence messages={[...result.sleep[a].evidence.slice(0, 2), ...result.sleep[b].evidence.slice(0, 2)]} label="잠들기 전 마지막 메시지" />
                <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
                  <p className="text-sm font-bold text-gray-900 mb-2">수면 패턴이 말해주는 것</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {a}{getParticle(a, ['은', '는'])} 평균 {dA.label}에, {b}{getParticle(b, ['은', '는'])} 평균 {dB.label}에 마지막 메시지를 보내요.
                    {' '}{earlyBird}{getParticle(earlyBird, ['이', '가'])} 먼저 잠드는데, 이는 상대보다 생활 리듬이 이르다는 뜻이에요.
                    {' '}잠들기 전 마지막 메시지의 내용을 보면 서로에 대한 마음을 엿볼 수 있어요. 잠자기 전 연락은 그 사람이 하루를 마무리하면서 떠올리는 상대라는 의미니까요.
                  </p>
                </div>
                <Comment text={getComment('sleep', result)} />
                <SectionShare text={`😴 수면 패턴: ${a} ${result.sleep[a].label} / ${b} ${result.sleep[b].label}`} />
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">배고픔 분석</h2>
          <p className="text-gray-600 mb-6">
            누가 더 배고프다고 많이 할까?
          </p>
          {(() => {
            const dA = result.hungry[a];
            const dB = result.hungry[b];
            const winner = dA.count >= dB.count ? a : b;
            const winColor = winner === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6">
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
                <Evidence messages={result.hungry[winner].evidence} label={`${winner}의 배고픔 메시지`} />
                <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
                  <p className="text-sm font-bold text-gray-900 mb-2">{winner}{getParticle(winner, ['이', '가'])} 배고프다고 하는 이유</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {winner}{getParticle(winner, ['은', '는'])} 배고프다는 언급을 {Math.max(dA.count, dB.count)}회 했어요.
                    {' '}상대에게 배고프다고 말하는 건 단순한 식사 얘기가 아니라, 함께 밥 먹고 싶다는 은근한 시그널일 수 있어요.
                    {' '}{Math.abs(dA.count - dB.count) > 5 ? `${Math.abs(dA.count - dB.count)}회 차이가 나는 건 ${winner}${getParticle(winner, ['이', '가'])} 만남을 더 자주 원한다는 뜻일 수도 있어요.` : '비슷한 횟수라 서로 밥 먹자는 얘기를 자주 하는 편이에요.'}
                  </p>
                </div>
                <Comment text={getComment('hungry', result)} />
                <SectionShare text={`🍔 배고픔 분석: ${winner}${getParticle(winner, ["이", "가"])} 더 배고파!`} />
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">계획성 분석</h2>
          <p className="text-gray-600 mb-6">누가 더 계획적일까?</p>
          {(() => {
            const dA = result.planner[a];
            const dB = result.planner[b];
            const winner = dA.count >= dB.count ? a : b;
            const winColor = winner === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6">
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
                <Evidence messages={result.planner[winner].evidence} label={`${winner}의 계획 메시지`} />
                <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
                  <p className="text-sm font-bold text-gray-900 mb-2">{winner}{getParticle(winner, ['이', '가'])} 계획적인 이유</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {winner}{getParticle(winner, ['은', '는'])} 약속이나 계획을 잡는 메시지를 {Math.max(dA.count, dB.count)}회 보냈어요.
                    {' '}&quot;언제 볼까&quot;, &quot;뭐 먹을까&quot; 같은 계획형 메시지는 만남을 주도하고 싶다는 의미예요.
                    {' '}관계에서 {winner}{getParticle(winner, ['이', '가'])} 데이트나 만남을 이끌어가는 역할을 하고 있어요.
                  </p>
                </div>
                <Comment text={getComment('planner', result)} />
                <SectionShare text={`📋 계획성 분석: ${winner}${getParticle(winner, ["이", "가"])} 더 계획적!`} />
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">응답 속도 분석</h2>
          <p className="text-gray-600 mb-6">
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
                <p className="text-lg text-gray-600 mb-4">잠수 챔피언</p>
                <p className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6">
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
                <Evidence messages={result.responseTime[slower].evidence} label={`${slower}${getParticle(slower, ["이", "가"])} 늦게 답한 메시지`} />
                <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
                  <p className="text-sm font-bold text-gray-900 mb-2">응답 속도가 말해주는 것</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {slower}{getParticle(slower, ['은', '는'])} 평균 {formatMinutes(Math.max(dA.avgMinutes, dB.avgMinutes))} 후에 답장해요.
                    {' '}최대 {formatMinutes(slower === a ? dA.maxMinutes : dB.maxMinutes)}까지 안 읽은 적도 있어요.
                    {' '}답장이 늦다는 건 바쁘거나, 대화의 우선순위가 낮을 수 있어요. 하지만 답장 속도만으로 마음을 판단하긴 어려워요 — 성격이 느긋한 사람도 있으니까요.
                  </p>
                </div>
                <Comment text={getComment('responseTime', result)} />
                <SectionShare text={`📱 응답속도: ${slower}${getParticle(slower, ["이", "가"])} 잠수 챔피언! (평균 ${formatMinutes(Math.max(result.responseTime[a].avgMinutes, result.responseTime[b].avgMinutes))})`} />
              </>
            );
          })()}
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 8. 시간대 히트맵 */}
      <Section gradient="from-amber-950 to-orange-950">
        <FadeIn>
          <SectionIcon emoji="🕐" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">시간대 분석</h2>
          <p className="text-gray-600 mb-6">언제 가장 불타오를까?</p>
          <div className="flex gap-4 sm:gap-8 justify-center mb-6">
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">피크 시간</p>
              <p className="text-2xl font-bold text-gray-900">{result.heatmap.peakHour}시</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">잠잠한 시간</p>
              <p className="text-2xl font-bold text-gray-900">{result.heatmap.deadHour}시</p>
            </div>
          </div>
          <HeatmapChart result={result} />
          <Evidence messages={result.heatmap.peakEvidence} label={`${result.heatmap.peakHour}시 대화 샘플`} />
          <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
            <p className="text-sm font-bold text-gray-900 mb-2">시간대가 말해주는 관계</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              가장 대화가 활발한 시간은 <b>{result.heatmap.peakHour}시</b>예요. 이 시간에 서로 가장 많이 생각하고 대화를 나누는 거예요.
              {' '}반면 {result.heatmap.deadHour}시에는 대화가 거의 없어요.
              {' '}피크 시간대의 대화 내용을 보면 그 시간에 어떤 감정으로 대화하는지 알 수 있어요.
            </p>
          </div>
          <Comment text={getComment('heatmap', result)} />
          <SectionShare text={`🕐 시간대 분석: 가장 활발한 시간 ${result.heatmap.peakHour}시!`} />
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 9. 주간 트렌드 */}
      <Section gradient="from-sky-950 to-cyan-950">
        <FadeIn>
          <SectionIcon emoji="📈" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">주간 트렌드</h2>
          <p className="text-gray-600 mb-6">매주 얼마나 대화했을까?</p>
          <TrendChart result={result} />
          <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
            <p className="text-sm font-bold text-gray-900 mb-2">대화량 변화가 의미하는 것</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              위 그래프는 주별 메시지 수 변화예요. 대화량이 늘어나는 구간은 서로에 대한 관심이 높아진 시기이고, 줄어드는 구간은 바쁘거나 관계에 변화가 있었을 수 있어요.
              {' '}전체적인 추세를 보면 이 관계가 어떤 방향으로 가고 있는지 알 수 있어요.
            </p>
          </div>
          <SectionShare text={`📈 주간 트렌드: ${a} vs ${b} 매주 대화량 변화!`} />
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 10. 온도 변화 */}
      <Section gradient="from-red-950 to-orange-950">
        <FadeIn>
          <SectionIcon emoji="🌡️" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">관계 온도 변화</h2>
          <p className="text-gray-600 mb-6">시간이 지나면서 어떻게 변했을까?</p>
          {(() => {
            const tA = result.temperature.perPerson[a];
            const tB = result.temperature.perPerson[b];
            const trendEmoji = (t: string) => t === 'heating' ? '🔥' : t === 'cooling' ? '🧊' : '➡️';
            const trendLabel = (t: string) => t === 'heating' ? '뜨거워지는 중' : t === 'cooling' ? '식어가는 중' : '유지 중';
            return (
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto">
                {[{ name: a, data: tA, color: 'pink' as const }, { name: b, data: tB, color: 'purple' as const }].map(({ name, data, color }) => (
                  <div key={name} className="bg-white rounded-2xl p-5 text-center">
                    <p className={`text-sm mb-2 ${color === 'pink' ? 'text-pink-400' : 'text-purple-400'}`}>{name}</p>
                    <p className="text-3xl mb-2">{trendEmoji(data.trend)}</p>
                    <p className="text-sm font-bold text-gray-900 mb-1">{trendLabel(data.trend)}</p>
                    <p className="text-xs text-gray-500">
                      {data.changePercent > 0 ? '+' : ''}{data.changePercent}% 변화
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
          <Evidence messages={[...result.temperature.perPerson[a].evidence.slice(0, 2), ...result.temperature.perPerson[b].evidence.slice(0, 2)]} label="초반 vs 후반 대화 비교" />
          <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
            <p className="text-sm font-bold text-gray-900 mb-2">관계 온도 변화 분석</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {a}{getParticle(a, ['은', '는'])} {result.temperature.perPerson[a].changePercent > 0 ? '대화량이 늘어나는 중' : result.temperature.perPerson[a].changePercent < 0 ? '대화량이 줄어드는 중' : '일정한 대화량 유지 중'}이고,
              {' '}{b}{getParticle(b, ['은', '는'])} {result.temperature.perPerson[b].changePercent > 0 ? '대화량이 늘어나는 중' : result.temperature.perPerson[b].changePercent < 0 ? '대화량이 줄어드는 중' : '일정한 대화량 유지 중'}이에요.
              {' '}초반과 후반 대화를 비교해보면 감정의 변화를 느낄 수 있어요. 대화 톤이나 길이가 달라졌다면 관계에 변화가 있었을 가능성이 높아요.
            </p>
          </div>
          <Comment text={getComment('temperature', result)} />
          <SectionShare text={`🌡️ 관계 온도: ${a} ${result.temperature.perPerson[a].trend === 'heating' ? '🔥뜨거워지는 중' : result.temperature.perPerson[a].trend === 'cooling' ? '🧊식어가는 중' : '➡️유지 중'} / ${b} ${result.temperature.perPerson[b].trend === 'heating' ? '🔥뜨거워지는 중' : result.temperature.perPerson[b].trend === 'cooling' ? '🧊식어가는 중' : '➡️유지 중'}`} />
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 11. 자주 쓰는 단어 */}
      <Section gradient="from-teal-950 to-emerald-950">
        <FadeIn>
          <SectionIcon emoji="🗣️" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">자주 쓰는 단어</h2>
          <p className="text-gray-600 mb-6">각자 가장 많이 쓴 단어 TOP 7</p>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto">
            {[a, b].map((name, idx) => {
              const words = result.topWords.perPerson[name] || [];
              const maxCount = words[0]?.count || 1;
              return (
                <div key={name} className="text-left">
                  <p className={`text-sm font-bold mb-3 ${idx === 0 ? 'text-pink-400' : 'text-purple-400'}`}>{name}</p>
                  <div className="space-y-1.5">
                    {words.map(({ word, count }) => (
                      <div key={word} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div
                            className={`h-5 rounded-r-full ${idx === 0 ? 'bg-pink-400/30' : 'bg-purple-400/30'} flex items-center px-2`}
                            style={{ width: `${Math.max((count / maxCount) * 100, 25)}%` }}
                          >
                            <span className="text-xs truncate">{word}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
            <p className="text-sm font-bold text-gray-900 mb-2">자주 쓰는 단어가 말해주는 것</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {a}{getParticle(a, ['이', '가'])} 가장 많이 쓴 단어는 &quot;{(result.topWords.perPerson[a]?.[0]?.word) || '?'}&quot;이고,
              {' '}{b}{getParticle(b, ['이', '가'])} 가장 많이 쓴 단어는 &quot;{(result.topWords.perPerson[b]?.[0]?.word) || '?'}&quot;예요.
              {' '}자주 쓰는 단어는 그 사람의 대화 스타일과 관심사를 보여줘요. 상대 이름이나 애칭이 자주 등장하면 애정도가 높다는 신호예요.
            </p>
          </div>
          <SectionShare text={`🗣️ 자주 쓰는 단어: ${a}의 1위 "${(result.topWords.perPerson[a]?.[0]?.word) || '?'}" / ${b}의 1위 "${(result.topWords.perPerson[b]?.[0]?.word) || '?'}"`} />
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 12. 읽씹 분석 */}
      <Section gradient="from-slate-950 to-zinc-950">
        <FadeIn>
          <SectionIcon emoji="👻" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">읽씹 분석</h2>
          <p className="text-gray-600 mb-6">30분 이상 답장 안 한 횟수</p>
          {(() => {
            const lA = result.leftOnRead.perPerson[a];
            const lB = result.leftOnRead.perPerson[b];
            const ghost = lA.count >= lB.count ? a : b;
            const ghostColor = ghost === a ? 'text-pink-400' : 'text-purple-400';
            return (
              <>
                <p className="text-lg text-gray-600 mb-4">읽씹 챔피언</p>
                <p className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6">
                  <span className={ghostColor}>{ghost}</span>
                </p>
                <div className="flex gap-4 sm:gap-8 justify-center flex-wrap">
                  <StatBox name={a} value={`${lA.count}회`} sub={`${lA.percent}%`} color="pink" />
                  <StatBox name={b} value={`${lB.count}회`} sub={`${lB.percent}%`} color="purple" />
                </div>
                <Evidence messages={result.leftOnRead.perPerson[ghost].evidence} label={`${ghost}${getParticle(ghost, ["이", "가"])} 읽씹한 메시지`} />
                <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 mt-4 mb-4 text-left">
                  <p className="text-sm font-bold text-gray-900 mb-2">읽씹이 의미하는 것</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {ghost}{getParticle(ghost, ['은', '는'])} 30분 이상 답장을 안 한 횟수가 {Math.max(lA.count, lB.count)}회예요.
                    {' '}읽씹은 바쁘거나, 답장할 내용이 없거나, 대화에 대한 우선순위가 낮을 때 발생해요.
                    {' '}{Math.abs(lA.count - lB.count) > 10 ? `${Math.abs(lA.count - lB.count)}회 차이는 꽤 크기 때문에, ${ghost}${getParticle(ghost, ['이', '가'])} 대화에 덜 적극적인 편이라고 볼 수 있어요.` : '차이가 크지 않아서 서로 비슷한 정도로 답장을 미루는 편이에요.'}
                  </p>
                </div>
                <Comment text={getComment('leftOnRead', result)} />
                <SectionShare text={`👻 읽씹 분석: ${ghost}${getParticle(ghost, ["이", "가"])} 읽씹 챔피언! (${Math.max(result.leftOnRead.perPerson[a].count, result.leftOnRead.perPerson[b].count)}회)`} />
              </>
            );
          })()}
          <ScrollHint />
        </FadeIn>
      </Section>

      {/* 13. AI 관계 분석 */}
      <Section gradient="from-rose-950 to-fuchsia-950">
        <FadeIn>
          <SectionIcon emoji="🤖" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">AI 관계 분석</h2>
          <p className="text-gray-600 mb-6">AI가 대화를 읽고 내린 진단</p>

          {aiLoading && (
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                <div className="w-3 h-3 rounded-full bg-fuchsia-400 dot-1" />
                <div className="w-3 h-3 rounded-full bg-fuchsia-400 dot-2" />
                <div className="w-3 h-3 rounded-full bg-fuchsia-400 dot-3" />
              </div>
              <p className="text-gray-500">AI가 관계를 읽고 있어요...</p>
            </div>
          )}

          {aiError && !aiLoading && !aiSections && (
            <div className="bg-white rounded-2xl p-6">
              <p className="text-gray-500">AI 분석을 불러올 수 없었어요</p>
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
                    className={`bg-white border-l-2 ${color} rounded-xl p-4`}
                  >
                    <p className="text-xs text-gray-500 mb-1">
                      {icon} {key}
                    </p>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
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

      {/* 하단 버튼 */}
      <div className="flex flex-col gap-3 items-center mt-4 mb-8">
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
          className="bg-pink-400 text-white font-bold px-8 py-3 rounded-full text-base active:scale-[0.98] transition-transform"
        >
          공유하기
        </button>
        <button
          onClick={() => window.location.reload()}
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
        >
          다시 분석하기
        </button>
      </div>

      {/* 맞춤 답변 (제일 밑) */}
      {userQuestion && aiSections?.['맞춤답변'] && (
        <Section gradient="">
          <FadeIn>
            <SectionIcon emoji="🎯" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">내 질문에 대한 답변</h2>
            <p className="text-gray-600 mb-6">&ldquo;{userQuestion.startsWith('__custom:') ? userQuestion.slice(9) : userQuestion}&rdquo;</p>
            <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4 text-left">
              <p className="text-sm text-gray-700 leading-relaxed">{aiSections['맞춤답변']}</p>
            </div>
          </FadeIn>
        </Section>
      )}

      </>)}
      </div>
    </div>
  );
}

// ─── Shared Components ───

function Section({
  children,
}: {
  children: React.ReactNode;
  gradient?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 mb-6">
      <div className="text-center">{children}</div>
    </div>
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
  return null;
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
    <div className="bg-white rounded-xl p-4 sm:p-5 min-w-[130px] flex-1 max-w-[200px]">
      <p className={`text-sm font-medium mb-1 ${nameColor}`}>{name}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
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
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-500">
          {winner === nameA ? `${nameA} ${pA}%` : `${nameB} ${pB}%`}
        </span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
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

function Comment({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className="text-gray-600 text-sm mt-6 px-2 leading-relaxed italic">
      &ldquo;{text}&rdquo;
    </p>
  );
}

function Evidence({ messages, label }: { messages: string[]; label?: string }) {
  if (!messages || messages.length === 0) return null;
  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden mt-4">
      <div className="bg-[#B2C7D9] px-4 py-2.5 text-center">
        <p className="text-xs text-white/80 font-medium">{label || '실제 대화 근거'}</p>
      </div>
      <div className="bg-[#B2C7D9]/30 px-4 py-4 space-y-1.5">
        {messages.map((msg, i) => (
          <div key={i} className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-gray-900 max-w-[80%] shadow-sm">
              {msg}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionShare({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleShare = () => {
    const full = `${text}\n\n카톡 분석해보기 → kakaohacking.vercel.app`;
    if (navigator.share) {
      navigator.share({ title: '카톡해킹', text: full });
    } else {
      navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      onClick={handleShare}
      className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {copied ? '복사됨!' : '공유하기'}
    </button>
  );
}

function HeatmapChart({ result }: { result: AnalysisResult }) {
  const [a, b] = result.participants;
  const { combined, perPerson } = result.heatmap;
  const max = Math.max(...combined, 1);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-end gap-[2px] h-28">
        {combined.map((_, hour) => {
          const aCount = perPerson[a]?.[hour] || 0;
          const bCount = perPerson[b]?.[hour] || 0;
          const total = aCount + bCount;
          const heightPct = (total / max) * 100;
          const aPct = total > 0 ? (aCount / total) * 100 : 50;
          return (
            <div key={hour} className="flex-1 flex flex-col justify-end h-full">
              <div
                style={{ height: `${Math.max(heightPct, 2)}%` }}
                className="flex flex-col rounded-t-sm overflow-hidden min-h-[1px]"
              >
                <div className="bg-pink-400/80 flex-shrink-0" style={{ height: `${aPct}%` }} />
                <div className="bg-purple-400/80 flex-shrink-0" style={{ height: `${100 - aPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-[2px] mt-1">
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="flex-1 text-center text-[8px] text-gray-600">
            {i % 3 === 0 ? `${i}시` : ''}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-pink-400/80 inline-block" />
          <span className="text-pink-400">{a}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-purple-400/80 inline-block" />
          <span className="text-purple-400">{b}</span>
        </span>
      </div>
    </div>
  );
}

function TrendChart({ result }: { result: AnalysisResult }) {
  const [a, b] = result.participants;
  const { weeks } = result.weeklyTrend;

  if (weeks.length < 2) {
    return <p className="text-gray-500 text-sm">주간 데이터가 부족해요</p>;
  }

  const maxVal = Math.max(...weeks.flatMap((w) => [w.a, w.b]), 1);
  const W = 320, H = 120;
  const pad = { t: 10, r: 10, b: 20, l: 10 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  const pts = (key: 'a' | 'b') =>
    weeks.map((w, i) => {
      const x = pad.l + (i / (weeks.length - 1)) * cW;
      const y = pad.t + cH - (w[key] / maxVal) * cH;
      return { x, y };
    });

  const polyline = (points: { x: number; y: number }[]) =>
    points.map((p) => `${p.x},${p.y}`).join(' ');

  const area = (points: { x: number; y: number }[]) => {
    const top = points.map((p) => `${p.x},${p.y}`).join(' ');
    return `${top} ${points[points.length - 1].x},${pad.t + cH} ${points[0].x},${pad.t + cH}`;
  };

  const ptsA = pts('a');
  const ptsB = pts('b');

  return (
    <div className="w-full max-w-sm mx-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <polygon points={area(ptsA)} fill="rgba(236,72,153,0.15)" />
        <polygon points={area(ptsB)} fill="rgba(168,85,247,0.15)" />
        <polyline points={polyline(ptsA)} fill="none" stroke="#EC4899" strokeWidth="2" />
        <polyline points={polyline(ptsB)} fill="none" stroke="#A855F7" strokeWidth="2" />
        {weeks.map((w, i) => {
          const step = weeks.length > 10 ? 3 : weeks.length > 6 ? 2 : 1;
          if (i % step !== 0 && i !== weeks.length - 1) return null;
          const x = pad.l + (i / (weeks.length - 1)) * cW;
          return (
            <text key={i} x={x} y={H - 2} textAnchor="middle" fill="#666" fontSize="7">
              {w.label}
            </text>
          );
        })}
      </svg>
      <div className="flex justify-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-[2px] bg-pink-400 inline-block" />
          <span className="text-pink-400">{a}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-[2px] bg-purple-400 inline-block" />
          <span className="text-purple-400">{b}</span>
        </span>
      </div>
    </div>
  );
}
