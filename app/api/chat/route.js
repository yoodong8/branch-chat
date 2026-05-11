export const runtime = "edge";

const SYSTEM_PROMPT = `당신은 브랜딩과 아이디어 발전을 함께 고민해주는 친근한 어시스턴트입니다.
- 한국어로 자연스럽고 따뜻한 톤을 유지합니다.
- 답변은 간결하게, 보통 2~4문장으로 정리합니다.
- 단정짓기보다 사용자의 사고를 확장시킬 수 있는 방향을 제시합니다.
- 마크다운(#, **) 보다는 평문 위주로, 가끔 짧은 강조만 사용합니다.`;

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const messages = body?.messages;
  if (!Array.isArray(messages) || !messages.length) {
    return new Response(JSON.stringify({ error: "messages required" }), { status: 400 });
  }

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 800 },
        }),
      }
    );
    if (!upstream.ok) {
      const t = await upstream.text();
      return new Response(JSON.stringify({ error: `Gemini error: ${t}` }), { status: upstream.status });
    }
    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "error" }), { status: 500 });
  }
}
