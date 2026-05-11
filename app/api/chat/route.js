// Proxies a chat request to Anthropic's Messages API.
// Keeps ANTHROPIC_API_KEY on the server so it never reaches the browser.

export const runtime = "edge";

const SYSTEM_PROMPT = `당신은 브랜딩과 아이디어 발전을 함께 고민해주는 친근한 어시스턴트입니다.
- 한국어로 자연스럽고 따뜻한 톤을 유지합니다.
- 답변은 간결하게, 보통 2~4문장으로 정리합니다.
- 단정짓기보다 사용자의 사고를 확장시킬 수 있는 방향을 제시합니다.
- 마크다운(#, **) 보다는 평문 위주로, 가끔 짧은 강조만 사용합니다.`;

export async function POST(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing ANTHROPIC_API_KEY env var" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (!messages.length) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${errText}` }),
        { status: upstream.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await upstream.json();
    const text =
      Array.isArray(data?.content) && data.content[0]?.type === "text"
        ? data.content[0].text
        : "";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e?.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
