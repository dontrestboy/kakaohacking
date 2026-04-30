import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAuth } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';

async function getGeminiClient() {
  // Option 1: Simple API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
  }

  // Option 2: Service account credentials (JSON string in env var)
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (saJson) {
    const credentials = JSON.parse(saJson);
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/generative-language'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) throw new Error('Failed to get access token');

    // Use API key-style client with access token via custom fetch
    const genAI = new GoogleGenerativeAI('placeholder');
    // Override with access token auth
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
    // Patch: use direct REST call instead
    return { generateWithToken: token.token, model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' };
  }

  throw new Error('No GEMINI_API_KEY or GOOGLE_SERVICE_ACCOUNT_JSON configured');
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  if (saJson) {
    const credentials = JSON.parse(saJson);
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/generative-language'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.token}`,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  throw new Error('No Gemini credentials configured');
}

export async function POST(req: NextRequest) {
  try {
    const { participants, stats, sampleMessages, userQuestion } = await req.json();
    const [a, b] = participants;

    const prompt = `너는 카카오톡 대화 분석 전문가야. 두 사람의 대화 데이터를 기반으로 관계를 분석해줘.

## 참여자
- ${a} (A)
- ${b} (B)

## 통계 요약
- 총 메시지: ${stats.totalMessages}개 (${stats.totalDays}일간)
- 메시지 수: ${a} ${stats.affection.a.messageCount}개 / ${b} ${stats.affection.b.messageCount}개
- 평균 글자수: ${a} ${stats.affection.a.avgLength}자 / ${b} ${stats.affection.b.avgLength}자
- 질문 횟수: ${a} ${stats.affection.a.questionCount}회 / ${b} ${stats.affection.b.questionCount}회
- 선톡: ${a} ${stats.firstMessage.a.count}회(${stats.firstMessage.a.percent}%) / ${b} ${stats.firstMessage.b.count}회(${stats.firstMessage.b.percent}%)
- 애착유형: ${a} ${stats.attachment.a.style}(점수 ${stats.attachment.a.score}) / ${b} ${stats.attachment.b.style}(점수 ${stats.attachment.b.score})
- 평균 답장속도: ${a} ${stats.responseTime.a.avgMinutes}분 / ${b} ${stats.responseTime.b.avgMinutes}분
- 수면시간: ${a} ${stats.sleep.a.label} / ${b} ${stats.sleep.b.label}
- 배고픔 언급: ${a} ${stats.hungry.a.count}회 / ${b} ${stats.hungry.b.count}회
- 계획 키워드: ${a} ${stats.planner.a.count}회 / ${b} ${stats.planner.b.count}회

## 대화 샘플 (최근 메시지 중 일부)
${sampleMessages}

## 사용자의 질문
${userQuestion ? `"${userQuestion}"` : '(질문 없음)'}

## 분석 요청
위 통계와 실제 대화 내용을 **종합적으로** 분석해줘. 재미있고 친근한 톤으로, 하지만 통찰력 있게 작성해. 각 섹션은 2-3문장으로 간결하게.

**중요 규칙:**
- 이름은 풀네임 대신 이름 부분만 + "님"으로 불러. 예: "이재헌" → "재헌님", "이아진" → "아진님", "김민수" → "민수님". 성을 빼고 이름만 써.
- 애착유형(불안형/안정형)에만 의존하지 마. 메시지 수, 선톡, 답장속도, 대화 내용, 질문 횟수, 글자수, 대화 톤 등 모든 지표를 종합해서 판단해.
- 실제 대화 샘플의 맥락과 분위기를 반드시 반영해. 대화에서 느껴지는 감정, 농담, 애칭, 관심사 등을 포착해.
- 숫자만 나열하지 말고, 대화 내용에서 드러나는 관계의 느낌을 중심으로 서술해.

**반드시 아래 정확한 형식으로 작성해:**

${userQuestion ? `[맞춤답변]\n사용자가 "${userQuestion}"이라고 물었어. 통계뿐 아니라 실제 대화의 맥락과 분위기까지 종합해서 구체적이고 솔직하게 답해줘. 3-4문장으로.\n\n` : ''}[관계요약]
이 두 사람의 전반적인 관계 역학을 한 문단으로 요약. 대화 내용에서 느껴지는 관계의 분위기를 중심으로.

[주도권]
대화에서 누가 주도권을 쥐고 있는지. 선톡, 질문, 계획, 대화 흐름 등을 종합해서 판단.

[온도차]
두 사람 사이에 감정 온도 차이가 있는지. 메시지 양, 글자수, 대화 톤, 이모티콘 등으로 판단.

[소통스타일]
각자의 소통 스타일 특징. 실제 대화에서 드러나는 말투, 반응 패턴, 화제 전환 방식 등.

[위험신호]
관계에서 주의할 점이 있다면? (없으면 긍정적인 신호를 언급)

[한줄평]
이 관계를 한 줄로 요약하면?`;

    const text = await callGemini(prompt);

    // Parse sections
    const sections: Record<string, string> = {};
    const sectionPattern = /\[(.+?)\]\s*\n([\s\S]*?)(?=\[|$)/g;
    let match;
    while ((match = sectionPattern.exec(text)) !== null) {
      sections[match[1].trim()] = match[2].trim();
    }

    return NextResponse.json({ sections, raw: text });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'AI 분석에 실패했어요' },
      { status: 500 }
    );
  }
}
