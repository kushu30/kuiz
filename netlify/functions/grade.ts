// netlify/functions/grade.ts
import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

if (!supabaseUrl || !serviceKey) {
  // Fail fast with a clear message in logs
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE.");
}

const sb = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { attemptId, testId, selections } = JSON.parse(event.body || "{}");

    // 1) Ensure attempt exists for this test
    const { data: attempt, error: aErr } = await sb
      .from("attempts")
      .select("id")
      .eq("id", attemptId)
      .eq("test_id", testId)
      .single();

    if (aErr || !attempt) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Attempt not found" }),
      };
    }

    // 2) (…your grading logic here…)
    // Save answers in your 'answers' table, not 'responses'
    // Example skeleton:
    // await sb.from("answers").insert([...]);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
