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
    const { participants, stats, sampleMessages } = await req.json();
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

## 분석 요청
위 데이터를 바탕으로 다음 항목을 분석해줘. 재미있고 친근한 톤으로, 하지만 통찰력 있게 작성해. 각 섹션은 2-3문장으로 간결하게.

**반드시 아래 정확한 형식으로 작성해:**

[관계요약]
이 두 사람의 전반적인 관계 역학을 한 문단으로 요약.

[주도권]
대화에서 누가 주도권을 쥐고 있는지, 그 근거는?

[온도차]
두 사람 사이에 감정 온도 차이가 있는지, 누가 더 뜨거운지.

[소통스타일]
각자의 소통 스타일 특징. (예: 한쪽은 수다쟁이, 한쪽은 리액션 장인 등)

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
