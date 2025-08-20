// netlify/functions/grade.js
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  const { testId, userId, selections } = JSON.parse(event.body || "{}");

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

  // get scoring policy
  const { data: test, error: e1 } = await supabase
    .from("tests").select("id, scoring_policy, show_score").eq("id", testId).single();
  if (e1 || !test) return { statusCode: 404, body: "Test not found" };

  // create attempt
  const { data: attempt, error: e2 } = await supabase
    .from("attempts").insert({ test_id: testId, user_id: userId }).select("*").single();
  if (e2) return { statusCode: 400, body: e2.message };

  // fetch correct options
  const qIds = (selections || []).map(s => s.questionId);
  const { data: optRows } = await supabase
    .from("options").select("id, question_id, is_correct").in("question_id", qIds);

  const correctByQ = new Map();
  (optRows || []).forEach(o => { if (o.is_correct) correctByQ.set(o.question_id, o.id); });

  let score = 0;
  const rows = (selections || []).map(s => {
    let is_correct = false;
    if (s.optionId) {
      is_correct = s.optionId === correctByQ.get(s.questionId);
      score += is_correct ? (test.scoring_policy.mcq?.correct ?? 1)
                          : (test.scoring_policy.mcq?.negative ?? 0);
    } else if (typeof s.textInput === "string") {
      // simple lowercase compare for now (you can mirror scoring.ts here if needed)
      const input = (s.textInput || "").trim().toLowerCase();
      const acc = (test.scoring_policy.text?.accepted || []).map(a => a.trim().toLowerCase());
      is_correct = acc.includes(input);
      score += is_correct ? (test.scoring_policy.text?.correct ?? 1)
                          : (test.scoring_policy.text?.negative ?? 0);
    }
    return {
      attempt_id: attempt.id,
      question_id: s.questionId,
      option_id: s.optionId || null,
      text_input: s.textInput || null,
      is_correct
    };
  });

  await supabase.from("answers").insert(rows);
  await supabase.from("attempts").update({ submitted_at: new Date().toISOString(), score }).eq("id", attempt.id);

  return {
    statusCode: 200,
    body: JSON.stringify({ attemptId: attempt.id, score, showScore: !!test.show_score })
  };
};
