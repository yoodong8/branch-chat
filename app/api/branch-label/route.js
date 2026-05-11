export const runtime = "edge";

const LABEL_PROMPT = `다음은 새로 분기된 대화의 첫 번째 사용자 메시지입니다. 이 분기의 핵심 방향을 2~3개의 한국어 단어로 짧게 라벨링해주세요. 따옴표나 마침표 없이 단어들만 답하세요.`;

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ label: "새 갈래" }), { status: 200 });
  const body = await req.json().catch(() => ({}));
  const userMsg = (body?.message || "").toString().slice(0, 500);
  if (!userMsg.trim()) return new Response(JSON.stringify({ label: "..." }), { status: 200 });

  try {
    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: LABEL_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userMsg }] }],
          generationConfig: { maxOutputTokens: 30 },
        }),
      }
    );
    if (!upstream.ok) return new Response(JSON.stringify({ label: "새 갈래" }), { status: 200 });
    const data = await upstream.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = raw.replace(/["'`.,!?]/g, "").trim().split(/\s+/).slice(0, 3).join(" ");
    return new Response(JSON.stringify({ label: cleaned || "새 갈래" }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ label: "새 갈래" }), { status: 200 });
  }
}
