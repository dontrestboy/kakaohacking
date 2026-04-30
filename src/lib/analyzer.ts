import { ChatMessage } from './parser';

export interface AttachmentResult {
  style: '불안형' | '안정형';
  score: number;
  doubleTexts: number;
  longWaits: number;
}

export interface AffectionResult {
  messageCount: number;
  avgLength: number;
  questionCount: number;
  emojiCount: number;
  score: number;
}

export interface FirstMessageResult {
  count: number;
  percent: number;
}

export interface SleepResult {
  avgHour: number;
  avgMinute: number;
  label: string;
}

export interface KeywordResult {
  count: number;
  percent: number;
}

export interface ResponseTimeResult {
  avgMinutes: number;
  maxMinutes: number;
}

export interface AnalysisResult {
  participants: [string, string];
  totalMessages: number;
  totalDays: number;
  attachment: Record<string, AttachmentResult>;
  affection: Record<string, AffectionResult>;
  firstMessage: Record<string, FirstMessageResult>;
  sleep: Record<string, SleepResult>;
  hungry: Record<string, KeywordResult>;
  planner: Record<string, KeywordResult>;
  responseTime: Record<string, ResponseTimeResult>;
}

const CONVERSATION_GAP_MS = 4 * 60 * 60 * 1000; // 4 hours = new conversation

export function analyze(
  participants: string[],
  messages: ChatMessage[]
): AnalysisResult {
  const [a, b] = participants;
  const totalDays = calcTotalDays(messages);

  return {
    participants: [a, b],
    totalMessages: messages.length,
    totalDays,
    attachment: analyzeAttachment(a, b, messages),
    affection: analyzeAffection(a, b, messages),
    firstMessage: analyzeFirstMessage(a, b, messages),
    sleep: analyzeSleep(a, b, messages),
    hungry: analyzeKeyword(a, b, messages, [
      '배고', '밥', '먹고싶', '뭐먹', '치킨', '피자', '라면',
      '맛집', '배곺', '굶', '점심', '저녁', '아침밥', '야식',
      '배고파', '배고프', '먹자', '밥먹', '뭐먹을',
    ]),
    planner: analyzeKeyword(a, b, messages, [
      '계획', '약속', '예약', '스케줄', '일정', '내일', '이번주',
      '다음주', '할까', '갈까', '볼까', '만날까', '시에', '시까지',
      '언제', '몇시', '정하자', '잡자', '예정',
    ]),
    responseTime: analyzeResponseTime(a, b, messages),
  };
}

function calcTotalDays(messages: ChatMessage[]): number {
  if (messages.length === 0) return 0;
  const first = messages[0].timestamp.getTime();
  const last = messages[messages.length - 1].timestamp.getTime();
  return Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));
}

// 1. Attachment style analysis
function analyzeAttachment(
  a: string,
  b: string,
  msgs: ChatMessage[]
): Record<string, AttachmentResult> {
  const stats: Record<string, { doubleTexts: number; longWaits: number }> = {
    [a]: { doubleTexts: 0, longWaits: 0 },
    [b]: { doubleTexts: 0, longWaits: 0 },
  };

  let consecutiveCount = 0;
  let lastSender = '';

  for (let i = 0; i < msgs.length; i++) {
    const msg = msgs[i];
    if (msg.sender === lastSender) {
      consecutiveCount++;
      if (consecutiveCount >= 2) {
        stats[msg.sender].doubleTexts++;
      }
    } else {
      // Check if previous sender waited long for reply
      if (i > 0 && lastSender) {
        const waitMs =
          msg.timestamp.getTime() - msgs[i - 1].timestamp.getTime();
        const waitMin = waitMs / 60000;
        if (waitMin > 30 && waitMin < CONVERSATION_GAP_MS / 60000) {
          stats[lastSender].longWaits++;
        }
      }
      consecutiveCount = 1;
      lastSender = msg.sender;
    }
  }

  const result: Record<string, AttachmentResult> = {};
  for (const name of [a, b]) {
    const s = stats[name];
    const score = Math.min(
      100,
      Math.round(s.doubleTexts * 2 + s.longWaits * 3)
    );
    result[name] = {
      style: score >= 40 ? '불안형' : '안정형',
      score,
      doubleTexts: s.doubleTexts,
      longWaits: s.longWaits,
    };
  }
  return result;
}

// 2. Affection analysis
function analyzeAffection(
  a: string,
  b: string,
  msgs: ChatMessage[]
): Record<string, AffectionResult> {
  const stats: Record<
    string,
    {
      count: number;
      totalLen: number;
      questions: number;
      emojis: number;
    }
  > = {
    [a]: { count: 0, totalLen: 0, questions: 0, emojis: 0 },
    [b]: { count: 0, totalLen: 0, questions: 0, emojis: 0 },
  };

  const emojiPattern = /[ㅋㅎㅠㅜ❤️💕💗💖🥰😍😘♥️💜💛🤍]/g;

  for (const msg of msgs) {
    const s = stats[msg.sender];
    if (!s) continue;
    s.count++;
    s.totalLen += msg.content.length;
    if (msg.content.includes('?') || msg.content.includes('？')) {
      s.questions++;
    }
    const emojiMatches = msg.content.match(emojiPattern);
    if (emojiMatches) s.emojis += emojiMatches.length;
  }

  const result: Record<string, AffectionResult> = {};
  for (const name of [a, b]) {
    const s = stats[name];
    const avgLen = s.count > 0 ? s.totalLen / s.count : 0;
    result[name] = {
      messageCount: s.count,
      avgLength: Math.round(avgLen * 10) / 10,
      questionCount: s.questions,
      emojiCount: s.emojis,
      score: Math.round(s.count * 0.3 + avgLen * 0.2 + s.questions * 0.3 + s.emojis * 0.2),
    };
  }
  return result;
}

// 3. First message analysis
function analyzeFirstMessage(
  a: string,
  b: string,
  msgs: ChatMessage[]
): Record<string, FirstMessageResult> {
  const counts: Record<string, number> = { [a]: 0, [b]: 0 };
  let totalConversations = 0;

  for (let i = 0; i < msgs.length; i++) {
    if (
      i === 0 ||
      msgs[i].timestamp.getTime() - msgs[i - 1].timestamp.getTime() >
        CONVERSATION_GAP_MS
    ) {
      totalConversations++;
      if (counts[msgs[i].sender] !== undefined) {
        counts[msgs[i].sender]++;
      }
    }
  }

  const result: Record<string, FirstMessageResult> = {};
  for (const name of [a, b]) {
    result[name] = {
      count: counts[name],
      percent:
        totalConversations > 0
          ? Math.round((counts[name] / totalConversations) * 100)
          : 0,
    };
  }
  return result;
}

// 4. Sleep pattern analysis
function analyzeSleep(
  a: string,
  b: string,
  msgs: ChatMessage[]
): Record<string, SleepResult> {
  // Group messages by date and person, find last message per day
  const lastMsgPerDay: Record<string, Record<string, Date>> = {};

  for (const msg of msgs) {
    const dateKey = msg.timestamp.toDateString();
    if (!lastMsgPerDay[dateKey]) lastMsgPerDay[dateKey] = {};

    const existing = lastMsgPerDay[dateKey][msg.sender];
    if (!existing || msg.timestamp > existing) {
      lastMsgPerDay[dateKey][msg.sender] = msg.timestamp;
    }
  }

  const nightHours: Record<string, number[]> = { [a]: [], [b]: [] };

  for (const dateKey of Object.keys(lastMsgPerDay)) {
    for (const name of [a, b]) {
      const lastMsg = lastMsgPerDay[dateKey][name];
      if (lastMsg) {
        const hour = lastMsg.getHours();
        const minute = lastMsg.getMinutes();
        // Only count messages after 8PM or before 4AM as "sleep time"
        if (hour >= 20 || hour <= 4) {
          // Normalize: treat 0-4AM as 24-28 for averaging
          const normalizedHour = hour <= 4 ? hour + 24 : hour;
          nightHours[name].push(normalizedHour + minute / 60);
        }
      }
    }
  }

  const result: Record<string, SleepResult> = {};
  for (const name of [a, b]) {
    const hours = nightHours[name];
    if (hours.length > 0) {
      const avg = hours.reduce((s, h) => s + h, 0) / hours.length;
      const displayHour = Math.floor(avg >= 24 ? avg - 24 : avg);
      const displayMinute = Math.round((avg % 1) * 60);
      result[name] = {
        avgHour: displayHour,
        avgMinute: displayMinute,
        label: formatTime(displayHour, displayMinute),
      };
    } else {
      result[name] = { avgHour: 23, avgMinute: 0, label: '데이터 부족' };
    }
  }
  return result;
}

function formatTime(h: number, m: number): string {
  const ampm = h < 12 ? '오전' : '오후';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${ampm} ${displayH}시 ${m.toString().padStart(2, '0')}분`;
}

// 5 & 6. Keyword analysis (hungry + planner)
function analyzeKeyword(
  a: string,
  b: string,
  msgs: ChatMessage[],
  keywords: string[]
): Record<string, KeywordResult> {
  const counts: Record<string, number> = { [a]: 0, [b]: 0 };

  for (const msg of msgs) {
    if (counts[msg.sender] === undefined) continue;
    for (const kw of keywords) {
      if (msg.content.includes(kw)) {
        counts[msg.sender]++;
        break; // Count once per message
      }
    }
  }

  const total = counts[a] + counts[b];
  return {
    [a]: {
      count: counts[a],
      percent: total > 0 ? Math.round((counts[a] / total) * 100) : 50,
    },
    [b]: {
      count: counts[b],
      percent: total > 0 ? Math.round((counts[b] / total) * 100) : 50,
    },
  };
}

// 7. Response time analysis
function analyzeResponseTime(
  a: string,
  b: string,
  msgs: ChatMessage[]
): Record<string, ResponseTimeResult> {
  const responseTimes: Record<string, number[]> = { [a]: [], [b]: [] };

  for (let i = 1; i < msgs.length; i++) {
    if (msgs[i].sender !== msgs[i - 1].sender) {
      const diff =
        (msgs[i].timestamp.getTime() - msgs[i - 1].timestamp.getTime()) / 60000;
      // Only count reasonable response times (< 4 hours)
      if (diff > 0 && diff < CONVERSATION_GAP_MS / 60000) {
        responseTimes[msgs[i].sender].push(diff);
      }
    }
  }

  const result: Record<string, ResponseTimeResult> = {};
  for (const name of [a, b]) {
    const times = responseTimes[name];
    if (times.length > 0) {
      const avg = times.reduce((s, t) => s + t, 0) / times.length;
      const max = Math.max(...times);
      result[name] = {
        avgMinutes: Math.round(avg * 10) / 10,
        maxMinutes: Math.round(max),
      };
    } else {
      result[name] = { avgMinutes: 0, maxMinutes: 0 };
    }
  }
  return result;
}
