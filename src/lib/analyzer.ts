import { ChatMessage } from './parser';

// ─── Types ───

export interface AttachmentResult {
  style: '불안형' | '안정형';
  score: number;
  doubleTexts: number;
  longWaits: number;
  lengthVariance: number; // high = anxious
  responseConsistency: number; // high = secure
  evidence: string[]; // actual chat messages as proof
}

export interface AffectionResult {
  messageCount: number;
  avgLength: number;
  questionCount: number;
  emojiCount: number;
  score: number;
  evidence: string[];
}

export interface FirstMessageResult {
  count: number;
  percent: number;
  evidence: string[];
}

export interface SleepResult {
  avgHour: number;
  avgMinute: number;
  label: string;
  evidence: string[];
}

export interface KeywordResult {
  count: number;
  percent: number;
  evidence: string[];
}

export interface ResponseTimeResult {
  avgMinutes: number;
  maxMinutes: number;
  evidence: string[];
}

export interface HourlyHeatmap {
  combined: number[]; // 24 hours
  perPerson: Record<string, number[]>;
  peakHour: number;
  deadHour: number;
  peakEvidence: string[];
}

export interface WeeklyTrend {
  weeks: { label: string; a: number; b: number }[];
}

export interface TemperatureTrend {
  perPerson: Record<
    string,
    {
      firstHalf: { msgCount: number; avgLength: number };
      secondHalf: { msgCount: number; avgLength: number };
      trend: 'heating' | 'cooling' | 'stable';
      changePercent: number;
      evidence: string[];
    }
  >;
}

export interface TopWordsResult {
  perPerson: Record<string, { word: string; count: number }[]>;
}

export interface LeftOnReadResult {
  perPerson: Record<
    string,
    { count: number; percent: number; evidence: string[] }
  >;
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
  heatmap: HourlyHeatmap;
  weeklyTrend: WeeklyTrend;
  temperature: TemperatureTrend;
  topWords: TopWordsResult;
  leftOnRead: LeftOnReadResult;
}

const CONVERSATION_GAP_MS = 4 * 60 * 60 * 1000;

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
    heatmap: analyzeHeatmap(a, b, messages),
    weeklyTrend: analyzeWeeklyTrend(a, b, messages),
    temperature: analyzeTemperature(a, b, messages),
    topWords: analyzeTopWords(a, b, messages),
    leftOnRead: analyzeLeftOnRead(a, b, messages),
  };
}

// ─── Comment Generator ───

export function getComment(
  section: string,
  result: AnalysisResult
): string {
  const [a, b] = result.participants;

  switch (section) {
    case 'attachment': {
      const dA = result.attachment[a];
      const dB = result.attachment[b];
      if (dA.score > 60 && dB.score < 30)
        return `${a}은(는) 답장 안 오면 심장이 쪼그라드는 타입이고, ${b}은(는) 폰 던져놓고 사는 타입이네요.`;
      if (dB.score > 60 && dA.score < 30)
        return `${b}은(는) 답장 안 오면 심장이 쪼그라드는 타입이고, ${a}은(는) 폰 던져놓고 사는 타입이네요.`;
      if (dA.score > 50 && dB.score > 50)
        return `둘 다 불안불안... 답장 하나에 감정이 롤러코스터 타는 관계예요.`;
      return `둘 다 비교적 안정적이에요. 답장이 조금 늦어도 서로 기다려줄 수 있는 사이.`;
    }

    case 'affection': {
      const dA = result.affection[a];
      const dB = result.affection[b];
      const diff = Math.abs(dA.messageCount - dB.messageCount);
      const winner = dA.score >= dB.score ? a : b;
      const loser = winner === a ? b : a;
      if (diff > result.totalMessages * 0.15)
        return `${winner}가 보낸 메시지가 ${diff}개 더 많아요. ${loser}... 좀 더 노력해도 되지 않을까요? 😢`;
      return `메시지 수가 거의 비슷해요! 서로에 대한 관심이 균형 잡힌 건강한 관계 💚`;
    }

    case 'firstMessage': {
      const dA = result.firstMessage[a];
      const dB = result.firstMessage[b];
      const winner = dA.count >= dB.count ? a : b;
      const wp = Math.max(dA.percent, dB.percent);
      if (wp >= 75)
        return `전체 선톡의 ${wp}%가 ${winner}... 혹시 짝사랑 아니죠? 🤔`;
      if (wp >= 60)
        return `${winner}이(가) 좀 더 먼저 연락하는 편이지만, 아직 괜찮은 수준이에요.`;
      return `선톡 비율이 거의 반반! 서로 보고싶을 때 먼저 연락하는 건강한 관계 ✨`;
    }

    case 'sleep': {
      const dA = result.sleep[a];
      const dB = result.sleep[b];
      const aN = (dA.avgHour <= 6 ? dA.avgHour + 24 : dA.avgHour) + dA.avgMinute / 60;
      const bN = (dB.avgHour <= 6 ? dB.avgHour + 24 : dB.avgHour) + dB.avgMinute / 60;
      const diff = Math.abs(aN - bN) * 60;
      if (diff > 90) {
        const early = aN <= bN ? a : b;
        const late = early === a ? b : a;
        return `${early}는 일찍 잠들고 ${late}는 새벽까지 깨어있어요. 시간대가 다른 커플? ⏰`;
      }
      return `잠드는 시간이 비슷해요! 마지막 "잘자" 주고받는 타이밍이 딱 맞는 관계 🌙`;
    }

    case 'responseTime': {
      const dA = result.responseTime[a];
      const dB = result.responseTime[b];
      const slower = dA.avgMinutes >= dB.avgMinutes ? a : b;
      const faster = slower === a ? b : a;
      const slowerMin = Math.max(dA.avgMinutes, dB.avgMinutes);
      const fasterMin = Math.min(dA.avgMinutes, dB.avgMinutes);
      if (slowerMin > fasterMin * 3 && slowerMin > 10)
        return `${faster}는 평균 ${Math.round(fasterMin)}분만에 답하는데, ${slower}는 ${Math.round(slowerMin)}분... 이건 좀 아픈데요? 💔`;
      if (slowerMin < 5)
        return `둘 다 5분 안에 답장! 폰 손에서 안 놓는 커플이에요 📱`;
      return `답장 속도가 비슷해요. 서로의 페이스를 존중하는 관계 👍`;
    }

    case 'hungry': {
      const dA = result.hungry[a];
      const dB = result.hungry[b];
      const winner = dA.count >= dB.count ? a : b;
      const wp = Math.max(dA.percent, dB.percent);
      if (wp >= 70)
        return `대화의 ${wp}%가 ${winner}의 먹는 얘기... 위장이 대화를 이끕니다 🍕`;
      return `먹는 얘기를 비슷하게 하네요. 함께 밥 먹는 게 제일 좋은 관계 🍚`;
    }

    case 'planner': {
      const dA = result.planner[a];
      const dB = result.planner[b];
      const winner = dA.count >= dB.count ? a : b;
      const loser = winner === a ? b : a;
      const wp = Math.max(dA.percent, dB.percent);
      if (wp >= 70)
        return `${winner}이(가) 대부분의 약속을 잡아요. ${loser}는 그냥 따라가는 스타일? 📅`;
      return `약속 잡기가 반반이에요. 둘 다 적극적으로 만남을 만들어가는 관계 ✨`;
    }

    case 'heatmap': {
      const h = result.heatmap;
      const peakLabel = h.peakHour >= 12 ? `오후 ${h.peakHour === 12 ? 12 : h.peakHour - 12}시` : `오전 ${h.peakHour === 0 ? 12 : h.peakHour}시`;
      return `가장 불타오르는 시간은 ${peakLabel}! 이 시간에 답장 안 하면 서운해할 수도 있어요 🔥`;
    }

    case 'temperature': {
      const tA = result.temperature.perPerson[a];
      const tB = result.temperature.perPerson[b];
      if (tA.trend === 'cooling' && tB.trend === 'cooling')
        return `둘 다 대화가 줄어드는 추세예요. 살짝 매너리즘? 가끔 새로운 화제를 꺼내보세요 💡`;
      if (tA.trend === 'heating' && tB.trend === 'heating')
        return `시간이 지날수록 대화가 늘고 있어요! 점점 가까워지는 중 🔥`;
      const heater = tA.trend === 'heating' ? a : b;
      const cooler = heater === a ? b : a;
      if (tA.trend !== tB.trend && (tA.trend === 'heating' || tB.trend === 'heating'))
        return `${heater}는 점점 열정적인데 ${cooler}는 조금 식어가는 중... 온도차 주의! 🌡️`;
      return `대화 패턴이 안정적으로 유지되고 있어요. 꾸준한 관계의 증거 💚`;
    }

    case 'leftOnRead': {
      const lA = result.leftOnRead.perPerson[a];
      const lB = result.leftOnRead.perPerson[b];
      const more = lA.count >= lB.count ? a : b;
      const less = more === a ? b : a;
      const moreCount = Math.max(lA.count, lB.count);
      if (moreCount > 20)
        return `${more}가 ${less}의 메시지를 ${moreCount}번 읽씹... ${less} 멘탈 괜찮아요? 😰`;
      if (moreCount < 5)
        return `읽씹이 거의 없어요! 서로의 메시지를 소중히 여기는 관계 💕`;
      return `가끔 읽씹은 있지만 정상 범위예요. 바쁠 때도 있으니까요 🤷`;
    }

    default:
      return '';
  }
}

// ─── Core Helpers ───

function calcTotalDays(messages: ChatMessage[]): number {
  if (messages.length === 0) return 0;
  const first = messages[0].timestamp.getTime();
  const last = messages[messages.length - 1].timestamp.getTime();
  return Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));
}

// ─── 1. Attachment (improved) ───

function analyzeAttachment(
  a: string,
  b: string,
  msgs: ChatMessage[]
): Record<string, AttachmentResult> {
  const stats: Record<
    string,
    { doubleTexts: number; longWaits: number; lengths: number[]; responseTimes: number[]; evidenceMsgs: string[] }
  > = {
    [a]: { doubleTexts: 0, longWaits: 0, lengths: [], responseTimes: [], evidenceMsgs: [] },
    [b]: { doubleTexts: 0, longWaits: 0, lengths: [], responseTimes: [], evidenceMsgs: [] },
  };

  let consecutiveCount = 0;
  let lastSender = '';

  for (let i = 0; i < msgs.length; i++) {
    const msg = msgs[i];
    if (!stats[msg.sender]) continue;
    stats[msg.sender].lengths.push(msg.content.length);

    if (msg.sender === lastSender) {
      consecutiveCount++;
      if (consecutiveCount >= 2) {
        stats[msg.sender].doubleTexts++;
        // Collect double-text evidence (consecutive msgs)
        if (stats[msg.sender].evidenceMsgs.length < 12) {
          const prev = msgs[i - 1];
          const gap = (msg.timestamp.getTime() - prev.timestamp.getTime()) / 60000;
          if (gap < 3 && msg.content.length > 1 && msg.content.length < 60) {
            stats[msg.sender].evidenceMsgs.push(msg.content);
          }
        }
      }
    } else {
      if (i > 0 && lastSender && stats[lastSender]) {
        const waitMin = (msg.timestamp.getTime() - msgs[i - 1].timestamp.getTime()) / 60000;
        if (waitMin > 30 && waitMin < CONVERSATION_GAP_MS / 60000) {
          stats[lastSender].longWaits++;
          // Collect "after long wait" evidence — the anxious person's msgs before the gap
          if (stats[lastSender].evidenceMsgs.length < 12 && msgs[i - 1].content.length < 60) {
            stats[lastSender].evidenceMsgs.push(msgs[i - 1].content);
          }
        }
        stats[msg.sender].responseTimes.push(waitMin);
      }
      consecutiveCount = 1;
      lastSender = msg.sender;
    }
  }

  const result: Record<string, AttachmentResult> = {};
  for (const name of [a, b]) {
    const s = stats[name];
    const avgLen = s.lengths.reduce((a, b) => a + b, 0) / (s.lengths.length || 1);
    const variance = s.lengths.reduce((sum, l) => sum + (l - avgLen) ** 2, 0) / (s.lengths.length || 1);
    const lengthVariance = Math.round(Math.sqrt(variance) * 10) / 10;

    const avgResp = s.responseTimes.reduce((a, b) => a + b, 0) / (s.responseTimes.length || 1);
    const respVar = s.responseTimes.reduce((sum, t) => sum + (t - avgResp) ** 2, 0) / (s.responseTimes.length || 1);
    const responseConsistency = Math.round(100 - Math.min(100, Math.sqrt(respVar)));

    const score = Math.min(
      100,
      Math.round(
        s.doubleTexts * 1.5 +
        s.longWaits * 2 +
        (lengthVariance > 15 ? 15 : 0) +
        (responseConsistency < 40 ? 10 : 0)
      )
    );

    // Deduplicate and pick top evidence
    const unique = [...new Set(s.evidenceMsgs)];
    result[name] = {
      style: score >= 35 ? '불안형' : '안정형',
      score,
      doubleTexts: s.doubleTexts,
      longWaits: s.longWaits,
      lengthVariance,
      responseConsistency,
      evidence: unique.slice(0, 5),
    };
  }
  return result;
}

// ─── 2. Affection ───

function analyzeAffection(
  a: string, b: string, msgs: ChatMessage[]
): Record<string, AffectionResult> {
  const stats: Record<string, { count: number; totalLen: number; questions: number; emojis: number; longMsgs: string[]; questionMsgs: string[] }> = {
    [a]: { count: 0, totalLen: 0, questions: 0, emojis: 0, longMsgs: [], questionMsgs: [] },
    [b]: { count: 0, totalLen: 0, questions: 0, emojis: 0, longMsgs: [], questionMsgs: [] },
  };
  const emojiPattern = /[ㅋㅎㅠㅜ❤️💕💗💖🥰😍😘♥️💜💛🤍🥺😊💓💘💝💞]/g;

  for (const msg of msgs) {
    const s = stats[msg.sender];
    if (!s) continue;
    s.count++;
    s.totalLen += msg.content.length;
    if (msg.content.includes('?') || msg.content.includes('？')) {
      s.questions++;
      if (s.questionMsgs.length < 8 && msg.content.length > 3 && msg.content.length < 80)
        s.questionMsgs.push(msg.content);
    }
    if (msg.content.length > 20 && s.longMsgs.length < 8 && msg.content.length < 100)
      s.longMsgs.push(msg.content);
    const m = msg.content.match(emojiPattern);
    if (m) s.emojis += m.length;
  }

  const result: Record<string, AffectionResult> = {};
  for (const name of [a, b]) {
    const s = stats[name];
    const avgLen = s.count > 0 ? s.totalLen / s.count : 0;
    const evidence = [...s.questionMsgs.slice(0, 3), ...s.longMsgs.slice(0, 2)];
    result[name] = {
      messageCount: s.count,
      avgLength: Math.round(avgLen * 10) / 10,
      questionCount: s.questions,
      emojiCount: s.emojis,
      score: Math.round(s.count * 0.3 + avgLen * 0.2 + s.questions * 0.3 + s.emojis * 0.2),
      evidence: [...new Set(evidence)].slice(0, 5),
    };
  }
  return result;
}

// ─── 3. First Message ───

function analyzeFirstMessage(
  a: string, b: string, msgs: ChatMessage[]
): Record<string, FirstMessageResult> {
  const counts: Record<string, number> = { [a]: 0, [b]: 0 };
  const evidenceMsgs: Record<string, string[]> = { [a]: [], [b]: [] };
  let total = 0;
  for (let i = 0; i < msgs.length; i++) {
    if (i === 0 || msgs[i].timestamp.getTime() - msgs[i - 1].timestamp.getTime() > CONVERSATION_GAP_MS) {
      total++;
      if (counts[msgs[i].sender] !== undefined) {
        counts[msgs[i].sender]++;
        if (evidenceMsgs[msgs[i].sender].length < 8 && msgs[i].content.length > 1 && msgs[i].content.length < 80)
          evidenceMsgs[msgs[i].sender].push(msgs[i].content);
      }
    }
  }
  const result: Record<string, FirstMessageResult> = {};
  for (const name of [a, b]) {
    result[name] = {
      count: counts[name],
      percent: total > 0 ? Math.round((counts[name] / total) * 100) : 0,
      evidence: [...new Set(evidenceMsgs[name])].slice(0, 5),
    };
  }
  return result;
}

// ─── 4. Sleep ───

function analyzeSleep(
  a: string, b: string, msgs: ChatMessage[]
): Record<string, SleepResult> {
  const lastMsgPerDay: Record<string, Record<string, { date: Date; content: string }>> = {};
  for (const msg of msgs) {
    const dk = msg.timestamp.toDateString();
    if (!lastMsgPerDay[dk]) lastMsgPerDay[dk] = {};
    const ex = lastMsgPerDay[dk][msg.sender];
    if (!ex || msg.timestamp > ex.date) lastMsgPerDay[dk][msg.sender] = { date: msg.timestamp, content: msg.content };
  }

  const nightHours: Record<string, number[]> = { [a]: [], [b]: [] };
  const evidenceMsgs: Record<string, string[]> = { [a]: [], [b]: [] };
  for (const dk of Object.keys(lastMsgPerDay)) {
    for (const name of [a, b]) {
      const last = lastMsgPerDay[dk][name];
      if (last) {
        const h = last.date.getHours(), m = last.date.getMinutes();
        if (h >= 20 || h <= 4) {
          nightHours[name].push((h <= 4 ? h + 24 : h) + m / 60);
          if (evidenceMsgs[name].length < 8 && last.content.length > 0 && last.content.length < 60)
            evidenceMsgs[name].push(`[${formatTime(h, m)}] ${last.content}`);
        }
      }
    }
  }

  const result: Record<string, SleepResult> = {};
  for (const name of [a, b]) {
    const hrs = nightHours[name];
    if (hrs.length > 0) {
      const avg = hrs.reduce((s, h) => s + h, 0) / hrs.length;
      const dh = Math.floor(avg >= 24 ? avg - 24 : avg);
      const dm = Math.round((avg % 1) * 60);
      result[name] = { avgHour: dh, avgMinute: dm, label: formatTime(dh, dm), evidence: [...new Set(evidenceMsgs[name])].slice(0, 4) };
    } else {
      result[name] = { avgHour: 23, avgMinute: 0, label: '데이터 부족', evidence: [] };
    }
  }
  return result;
}

function formatTime(h: number, m: number): string {
  const ampm = h < 12 ? '오전' : '오후';
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${ampm} ${dh}시 ${m.toString().padStart(2, '0')}분`;
}

// ─── 5 & 6. Keyword ───

function analyzeKeyword(
  a: string, b: string, msgs: ChatMessage[], keywords: string[]
): Record<string, KeywordResult> {
  const counts: Record<string, number> = { [a]: 0, [b]: 0 };
  const evidenceMsgs: Record<string, string[]> = { [a]: [], [b]: [] };
  for (const msg of msgs) {
    if (counts[msg.sender] === undefined) continue;
    for (const kw of keywords) {
      if (msg.content.includes(kw)) {
        counts[msg.sender]++;
        if (evidenceMsgs[msg.sender].length < 8 && msg.content.length > 2 && msg.content.length < 80)
          evidenceMsgs[msg.sender].push(msg.content);
        break;
      }
    }
  }
  const total = counts[a] + counts[b];
  return {
    [a]: { count: counts[a], percent: total > 0 ? Math.round((counts[a] / total) * 100) : 50, evidence: [...new Set(evidenceMsgs[a])].slice(0, 5) },
    [b]: { count: counts[b], percent: total > 0 ? Math.round((counts[b] / total) * 100) : 50, evidence: [...new Set(evidenceMsgs[b])].slice(0, 5) },
  };
}

// ─── 7. Response Time ───

function analyzeResponseTime(
  a: string, b: string, msgs: ChatMessage[]
): Record<string, ResponseTimeResult> {
  const times: Record<string, number[]> = { [a]: [], [b]: [] };
  const slowReplies: Record<string, { delay: number; msg: string }[]> = { [a]: [], [b]: [] };
  for (let i = 1; i < msgs.length; i++) {
    if (msgs[i].sender !== msgs[i - 1].sender) {
      const diff = (msgs[i].timestamp.getTime() - msgs[i - 1].timestamp.getTime()) / 60000;
      if (diff > 0 && diff < CONVERSATION_GAP_MS / 60000) {
        times[msgs[i].sender].push(diff);
        // Collect slow replies (the message that was waiting)
        if (diff > 10 && slowReplies[msgs[i].sender].length < 8 && msgs[i - 1].content.length < 80 && msgs[i - 1].content.length > 1)
          slowReplies[msgs[i].sender].push({ delay: diff, msg: msgs[i - 1].content });
      }
    }
  }
  const result: Record<string, ResponseTimeResult> = {};
  for (const name of [a, b]) {
    const t = times[name];
    const sorted = slowReplies[name].sort((x, y) => y.delay - x.delay);
    const evidence = sorted.slice(0, 5).map((r) => `(${Math.round(r.delay)}분 뒤 답장) ${r.msg}`);
    if (t.length > 0) {
      result[name] = {
        avgMinutes: Math.round((t.reduce((s, v) => s + v, 0) / t.length) * 10) / 10,
        maxMinutes: Math.round(Math.max(...t)),
        evidence,
      };
    } else {
      result[name] = { avgMinutes: 0, maxMinutes: 0, evidence: [] };
    }
  }
  return result;
}

// ─── 8. Hourly Heatmap (NEW) ───

function analyzeHeatmap(
  a: string, b: string, msgs: ChatMessage[]
): HourlyHeatmap {
  const combined = new Array(24).fill(0);
  const perPerson: Record<string, number[]> = {
    [a]: new Array(24).fill(0),
    [b]: new Array(24).fill(0),
  };

  for (const msg of msgs) {
    const h = msg.timestamp.getHours();
    combined[h]++;
    if (perPerson[msg.sender]) perPerson[msg.sender][h]++;
  }

  let peakHour = 0, deadHour = 0;
  for (let i = 0; i < 24; i++) {
    if (combined[i] > combined[peakHour]) peakHour = i;
    if (combined[i] < combined[deadHour]) deadHour = i;
  }

  // Collect peak hour evidence
  const peakEvidence: string[] = [];
  for (const msg of msgs) {
    if (msg.timestamp.getHours() === peakHour && peakEvidence.length < 8 && msg.content.length > 1 && msg.content.length < 60)
      peakEvidence.push(`${msg.sender}: ${msg.content}`);
  }

  return { combined, perPerson, peakHour, deadHour, peakEvidence: [...new Set(peakEvidence)].slice(0, 5) };
}

// ─── 9. Weekly Trend (NEW) ───

function analyzeWeeklyTrend(
  a: string, b: string, msgs: ChatMessage[]
): WeeklyTrend {
  if (msgs.length === 0) return { weeks: [] };

  const weekMap = new Map<string, { a: number; b: number }>();
  for (const msg of msgs) {
    const d = msg.timestamp;
    // Get Monday of the week
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const key = `${monday.getMonth() + 1}/${monday.getDate()}`;

    if (!weekMap.has(key)) weekMap.set(key, { a: 0, b: 0 });
    const w = weekMap.get(key)!;
    if (msg.sender === a) w.a++;
    else if (msg.sender === b) w.b++;
  }

  const weeks = Array.from(weekMap.entries()).map(([label, counts]) => ({
    label,
    a: counts.a,
    b: counts.b,
  }));

  return { weeks };
}

// ─── 10. Temperature Trend (NEW) ───

function analyzeTemperature(
  a: string, b: string, msgs: ChatMessage[]
): TemperatureTrend {
  const mid = Math.floor(msgs.length / 2);
  const firstHalf = msgs.slice(0, mid);
  const secondHalf = msgs.slice(mid);

  const calcStats = (subset: ChatMessage[], name: string) => {
    const mine = subset.filter((m) => m.sender === name);
    return {
      msgCount: mine.length,
      avgLength: mine.length > 0
        ? Math.round((mine.reduce((s, m) => s + m.content.length, 0) / mine.length) * 10) / 10
        : 0,
    };
  };

  const perPerson: TemperatureTrend['perPerson'] = {};
  for (const name of [a, b]) {
    const fh = calcStats(firstHalf, name);
    const sh = calcStats(secondHalf, name);
    const change = fh.msgCount > 0 ? ((sh.msgCount - fh.msgCount) / fh.msgCount) * 100 : 0;
    // Collect evidence: sample from second half
    const secondMsgs = secondHalf.filter((m) => m.sender === name && m.content.length > 3 && m.content.length < 60);
    const firstMsgs = firstHalf.filter((m) => m.sender === name && m.content.length > 3 && m.content.length < 60);
    const evidence = [
      ...firstMsgs.slice(0, 2).map((m) => `[초반] ${m.content}`),
      ...secondMsgs.slice(-2).map((m) => `[후반] ${m.content}`),
    ];
    perPerson[name] = {
      firstHalf: fh,
      secondHalf: sh,
      trend: change > 15 ? 'heating' : change < -15 ? 'cooling' : 'stable',
      changePercent: Math.round(change),
      evidence,
    };
  }

  return { perPerson };
}

// ─── 11. Top Words (NEW) ───

const STOP_WORDS = new Set([
  '은', '는', '이', '가', '을', '를', '에', '의', '로', '와', '과', '도',
  '만', '까지', '부터', '에서', '으로', '하고', '이나', '나', '라고', '고',
  '게', '지', '요', '죠', '거', '좀', '그', '뭐', '그냥', '근데', '아',
  '어', '음', '네', '예', '아니', '안', '못', '더', '다', '잘', '많이',
  '그래', '그럼', '그런', '이런', '저런', '한', '수', '것', '등', '중',
  '때', '및', '또', '각', '새', '로서', '대', '위', '간', '및',
  '해', '하', '되', '있', '없', '같', '이모티콘', '사진', '동영상',
]);

function analyzeTopWords(
  a: string, b: string, msgs: ChatMessage[]
): TopWordsResult {
  const wordCounts: Record<string, Record<string, number>> = { [a]: {}, [b]: {} };

  for (const msg of msgs) {
    if (!wordCounts[msg.sender]) continue;
    // Split by spaces and filter
    const words = msg.content
      .replace(/[^\uAC00-\uD7A3a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

    for (const w of words) {
      wordCounts[msg.sender][w] = (wordCounts[msg.sender][w] || 0) + 1;
    }
  }

  const perPerson: Record<string, { word: string; count: number }[]> = {};
  for (const name of [a, b]) {
    perPerson[name] = Object.entries(wordCounts[name])
      .sort((x, y) => y[1] - x[1])
      .slice(0, 7)
      .map(([word, count]) => ({ word, count }));
  }

  return { perPerson };
}

// ─── 12. Left on Read (NEW) ───

function analyzeLeftOnRead(
  a: string, b: string, msgs: ChatMessage[]
): LeftOnReadResult {
  // "Left on read" = Person A sends msg, 30min+ passes, Person B finally replies
  // Count how many times each person made the other wait > 30min
  const counts: Record<string, number> = { [a]: 0, [b]: 0 };
  const evidenceMsgs: Record<string, string[]> = { [a]: [], [b]: [] };
  let totalExchanges = 0;

  for (let i = 1; i < msgs.length; i++) {
    if (msgs[i].sender !== msgs[i - 1].sender) {
      const diff = (msgs[i].timestamp.getTime() - msgs[i - 1].timestamp.getTime()) / 60000;
      if (diff >= 30 && diff < CONVERSATION_GAP_MS / 60000) {
        counts[msgs[i].sender]++;
        // The message that was left on read (the other person's msg)
        if (evidenceMsgs[msgs[i].sender].length < 8 && msgs[i - 1].content.length > 1 && msgs[i - 1].content.length < 80)
          evidenceMsgs[msgs[i].sender].push(`"${msgs[i - 1].content}" → ${Math.round(diff)}분 뒤 답장`);
      }
      totalExchanges++;
    }
  }

  const result: LeftOnReadResult = { perPerson: {} };
  for (const name of [a, b]) {
    result.perPerson[name] = {
      count: counts[name],
      percent: totalExchanges > 0 ? Math.round((counts[name] / totalExchanges) * 100) : 0,
      evidence: [...new Set(evidenceMsgs[name])].slice(0, 5),
    };
  }
  return result;
}
