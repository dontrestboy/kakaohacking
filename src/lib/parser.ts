export interface ChatMessage {
  sender: string;
  timestamp: Date;
  content: string;
}

export interface ParseResult {
  participants: string[];
  messages: ChatMessage[];
}

export function parseKakaoChat(text: string): ParseResult {
  const messages: ChatMessage[] = [];
  const participantSet = new Set<string>();
  const lines = text.split('\n');
  let currentDate = '';

  for (const line of lines) {
    if (!line.trim()) continue;

    // Android date header: --------------- 2024년 1월 1일 월요일 ---------------
    const dateHeader1 = line.match(
      /^-+\s*(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)\s*\S+\s*-+$/
    );
    if (dateHeader1) {
      currentDate = dateHeader1[1];
      continue;
    }

    // Simple date header: 2024년 1월 1일 월요일
    const dateHeader2 = line.match(
      /^(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)\s*\S+일?\s*$/
    );
    if (dateHeader2) {
      currentDate = dateHeader2[1];
      continue;
    }

    // Android message: [Name] [오전/오후 H:MM] message
    const android = line.match(
      /^\[(.+?)\]\s*\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s*(.+)$/
    );
    if (android && currentDate) {
      const [, sender, ampm, h, m, content] = android;
      const ts = buildDate(currentDate, ampm, +h, +m);
      if (ts && !isSystemMessage(content)) {
        participantSet.add(sender);
        messages.push({ sender, timestamp: ts, content });
      }
      continue;
    }

    // iOS format: 2024년 1월 1일 오전/오후 H:MM, Name : message
    const ios1 = line.match(
      /^(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)\s*(오전|오후)\s*(\d{1,2}):(\d{2}),\s*(.+?)\s*:\s*(.+)$/
    );
    if (ios1) {
      const [, date, ampm, h, m, sender, content] = ios1;
      const ts = buildDate(date, ampm, +h, +m);
      if (ts && !isSystemMessage(content)) {
        participantSet.add(sender);
        messages.push({ sender, timestamp: ts, content });
      }
      continue;
    }

    // iOS alt: Name, [오전/오후 H:MM] message
    const ios2 = line.match(
      /^(.+?),\s*\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s*(.+)$/
    );
    if (ios2 && currentDate) {
      const [, sender, ampm, h, m, content] = ios2;
      const ts = buildDate(currentDate, ampm, +h, +m);
      if (ts && !isSystemMessage(content)) {
        participantSet.add(sender);
        messages.push({ sender, timestamp: ts, content });
      }
      continue;
    }

    // Period date format: 2024. 1. 1. 오후 1:00, Name : message
    const dotFmt = line.match(
      /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}),\s*(.+?)\s*:\s*(.+)$/
    );
    if (dotFmt) {
      const [, y, mo, d, ampm, h, m, sender, content] = dotFmt;
      const dateStr = `${y}년 ${mo}월 ${d}일`;
      const ts = buildDate(dateStr, ampm, +h, +m);
      if (ts && !isSystemMessage(content)) {
        participantSet.add(sender);
        messages.push({ sender, timestamp: ts, content });
      }
      continue;
    }
  }

  return {
    participants: Array.from(participantSet),
    messages,
  };
}

function buildDate(
  dateStr: string,
  ampm: string,
  hour: number,
  minute: number
): Date | null {
  const m = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (!m) return null;
  let h = hour;
  if (ampm === '오후' && h !== 12) h += 12;
  if (ampm === '오전' && h === 12) h = 0;
  return new Date(+m[1], +m[2] - 1, +m[3], h, minute);
}

function isSystemMessage(content: string): boolean {
  const systemPatterns = [
    /님이 나갔습니다/,
    /님이 들어왔습니다/,
    /님을 초대했습니다/,
    /채팅방 관리자/,
    /^사진$/,
    /^동영상$/,
    /^파일:/,
  ];
  return systemPatterns.some((p) => p.test(content.trim()));
}
