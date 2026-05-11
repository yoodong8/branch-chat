// Generates a short 2-3 word Korean label for a conversation branch.

export const runtime = "edge";

const LABEL_PROMPT = `다음은 새로 분기된 대화의 첫 번째 사용자 메시지입니다. 이 분기의 핵심 방향을 2~3개의 한국어 단어로 짧게 라벨링해주세요. 따옴표나 마침표 없이 단어들만 답하세요.`;

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

  const userMsg = (body?.message || "").toString().slice(0, 500);
  if (!userMsg.trim()) {
    return new Response(JSON.stringify({ label: "..." }), {
      status: 200,
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
        max_tokens: 30,
        system: LABEL_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ label: "새 갈래" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json();
    const raw =
      Array.isArray(data?.content) && data.content[0]?.type === "text"
        ? data.content[0].text
        : "";
    // strip punctuation/quotes, take first ~3 words
    const cleaned = raw
      .replace(/["'`.,!?]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(" ");
    return new Response(JSON.stringify({ label: cleaned || "새 갈래" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ label: "새 갈래" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
