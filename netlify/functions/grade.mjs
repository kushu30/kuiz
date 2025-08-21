import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // important: service role, not anon
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { attemptId, testId, selections } = JSON.parse(event.body || "{}");

    // Check attempt exists
    const { data: attempt } = await supabase
      .from("attempts")
      .select("id")
      .eq("id", attemptId)
      .eq("test_id", testId)
      .single();

    if (!attempt) {
      return { statusCode: 404, body: JSON.stringify({ error: "Attempt not found" }) };
    }

    // Save responses
    for (const sel of selections) {
      await supabase.from("responses").insert({
        attempt_id: attemptId,
        question_id: sel.questionId,
        option_id: sel.optionId || null,
        text_input: sel.textInput || null,
      });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
