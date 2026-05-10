# Branch Chat

대화의 분기·비교·회귀를 지원하는 채팅형 LLM 인터페이스. Next.js 14 + Tailwind + Anthropic API.

## 핵심 인터랙션

- **가지치기** — AI 메시지 하단의 `GitBranch` 아이콘을 누르면 그 시점에서 새 분기를 시작합니다.
- **트리 시각화** — 우측 패널에 분기가 점-선으로 그려집니다. 점에 호버하면 LLM이 자동 생성한 2-3 단어 라벨이 툴팁으로 뜹니다.
- **점 클릭** — 해당 메시지로 스크롤되며 그 분기는 밝게, 나머지는 어둡게 표시됩니다.
- **좌·우 전환** — 분기점이 있는 메시지에서 사이드 화살표로 이전 갈래로 돌아갈 수 있습니다.
- **분할 비교** — 우측 상단 토글을 켜고 점 두 개를 클릭하면 두 갈래가 좌우로 나란히 펼쳐집니다.

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local  # 그리고 실제 키를 적어 넣으세요
npm run dev
```

`http://localhost:3000` 에서 확인.

## Vercel 배포

1. 이 프로젝트를 GitHub 리포지토리로 푸시합니다.
2. [vercel.com/new](https://vercel.com/new) 에서 해당 리포지토리를 import 합니다.
3. **Environment Variables** 항목에 다음을 추가:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (Anthropic 콘솔에서 발급)
4. Deploy 클릭. 빌드가 끝나면 곧바로 사용할 수 있는 URL이 발급됩니다.

> ⚠️ API 키는 서버 측 라우트(`app/api/chat/route.js`, `app/api/branch-label/route.js`) 에서만 사용됩니다. 브라우저 번들에는 절대 포함되지 않습니다.

## 구조

```
app/
  layout.jsx              루트 레이아웃 / 글로벌 폰트
  page.jsx                메인 화면 (사이드바 / 대화 / 트리 / 비교)
  globals.css             Tailwind + 기본 스타일
  api/
    chat/route.js         Anthropic Messages API 프록시 (대화)
    branch-label/route.js Anthropic Messages API 프록시 (라벨 생성)
```

## 모델

기본값은 `claude-sonnet-4-20250514`. 더 빠른 응답을 원하면 `app/api/chat/route.js` 와 `app/api/branch-label/route.js` 의 `model` 값을 다른 모델로 바꾸세요.

## 라이선스

MIT
