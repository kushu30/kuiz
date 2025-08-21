// Netlify Function: Generate draft questions with Gemini
// Needs: GEMINI_API_KEY in env

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { topic, audience, numQuestions = 5, mix = "mcq_text" } = JSON.parse(event.body || "{}");

  if (!process.env.GEMINI_API_KEY) {
    return { statusCode: 500, body: "Missing GEMINI_API_KEY in environment" };
  }

  const model = "gemini-2.0-flash"; // default

  const sys = `You generate exam questions. Output STRICT JSON only, matching this schema:
{
  "questions": [
    {
      "type": "mcq" | "text",
      "body": "string (one clear question, no numbering)",
      "options": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}] | null,
      "correct_label": "A"|"B"|"C"|"D" | null,
      "points": 1
    }
  ]
}
Rules:
- If type="mcq": exactly 4 options with concise, distinct distractors; set correct_label.
- If type="text": options=null and correct_label=null.
- Use simple English, avoid explanations. No markdown.
`;

  const user = `
Topic: ${topic}
Audience: ${audience}
Question count: ${numQuestions}
Types: ${mix === "mcq_only" ? "MCQ only" : mix === "text_only" ? "Text only" : "Mixed"}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: sys + "\n" + user }] }],
    generationConfig: { responseMimeType: "application/json" },
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text();
      return { statusCode: r.status, body: text };
    }

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const stripped = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(stripped);
    }

    if (!parsed?.questions || !Array.isArray(parsed.questions)) {
      return { statusCode: 502, body: "Bad AI response" };
    }

    const cleaned = parsed.questions.slice(0, numQuestions).map((q) => ({
      type: q.type === "text" ? "text" : "mcq",
      body: String(q.body || "").trim(),
      options: Array.isArray(q.options)
        ? q.options.map((o) => ({
            label: String(o.label || "").slice(0, 1).toUpperCase(),
            text: String(o.text || "").trim(),
          }))
        : null,
      correct_label: q.correct_label ? String(q.correct_label).slice(0, 1).toUpperCase() : null,
      points: Number.isFinite(q.points) ? q.points : 1,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: cleaned }),
    };
  } catch (e) {
    return { statusCode: 500, body: String(e?.message || e) };
  }
};
