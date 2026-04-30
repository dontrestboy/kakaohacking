#!/bin/bash
# 카톡해킹 이미지 생성 스크립트
# Usage: ./scripts/gen-image.sh "프롬프트" [출력파일명]
# Example: ./scripts/gen-image.sh "웹툰 스타일 커플" hero-v6

set -e

API_KEY="AIzaSyDIUlZp1hwfrs6QbG2J2DoljjbKHE39r20"
MODEL="gemini-2.5-flash-image"
PROMPT="$1"
OUTPUT="${2:-hero-$(date +%s)}"

if [ -z "$PROMPT" ]; then
  echo "Usage: $0 \"prompt\" [output-name]"
  echo ""
  echo "Examples:"
  echo "  $0 \"Korean webtoon couple looking at phones\" hero-v6"
  echo "  $0 \"cute anime girl holding phone, pink background\" girl-phone"
  exit 1
fi

echo "Generating image..."
echo "Prompt: $PROMPT"
echo "Output: public/${OUTPUT}.png"
echo ""

curl -s "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"contents\": [{
      \"parts\": [{
        \"text\": \"Generate an image: ${PROMPT}\"
      }]
    }],
    \"generationConfig\": {
      \"responseModalities\": [\"TEXT\", \"IMAGE\"]
    }
  }" | python3 -c "
import sys, json, base64
data = json.load(sys.stdin)
for part in data.get('candidates', [{}])[0].get('content', {}).get('parts', []):
    if 'inlineData' in part:
        img_data = base64.b64decode(part['inlineData']['data'])
        with open('public/${OUTPUT}.png', 'wb') as f:
            f.write(img_data)
        size_kb = len(img_data) // 1024
        print(f'Done! public/${OUTPUT}.png ({size_kb}KB)')
        break
else:
    print('Failed - no image in response')
    print(json.dumps(data, indent=2)[:1000])
"
