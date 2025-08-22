import { createClient } from "@supabase/supabase-js";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload = {};
  try { payload = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, body: "Invalid JSON" }; }

  const { attemptId, testId, selections = [] } = payload;
  if (!attemptId || !testId) {
    return { statusCode: 400, body: "Missing attemptId/testId" };
  }

  // ✅ Use server env names; fallback to VITE_ only if present
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 500, body: "Server misconfigured: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE" };
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // … the rest of your code unchanged …
  // (kept exactly as you pasted)
  // ----------------------------------
  const { data: attempt, error: aErr } = await supabase
    .from("attempts")
    .select("id, submitted_at, email, name")
    .eq("id", attemptId)
    .eq("test_id", testId)
    .single();
  if (aErr || !attempt) return { statusCode: 404, body: "Attempt not found" };
  if (attempt.submitted_at) return { statusCode: 400, body: "Already submitted" };

  const { data: test, error: tErr } = await supabase
    .from("tests")
    .select("id, scoring_policy, show_score, title")
    .eq("id", testId)
    .single();
  if (tErr || !test) return { statusCode: 404, body: "Test not found" };

  const qIds = selections.map((s) => s.questionId);

  const { data: qRows } = await supabase
    .from("questions")
    .select("id, type, text_policy, points")
    .in("id", qIds);

  const textPolicyByQ = new Map();
  (qRows || []).forEach(q => textPolicyByQ.set(q.id, q.text_policy || null));
  const pointsByQ = new Map();
  (qRows || []).forEach(q => pointsByQ.set(q.id, q.points ?? 1));

  const { data: optRows, error: oErr } = await supabase
    .from("options")
    .select("id, question_id, is_correct")
    .in("question_id", qIds);
  if (oErr) return { statusCode: 500, body: oErr.message };

  const correctByQ = new Map();
  (optRows || []).forEach(o => { if (o.is_correct) correctByQ.set(o.question_id, o.id); });

  let score = 0;
  const rows = selections.map((s) => {
    let is_correct = false;
    const qPts = pointsByQ.get(s.questionId) ?? 1;

    if (s.optionId) {
      is_correct = s.optionId === correctByQ.get(s.questionId);
      score += is_correct
        ? (test.scoring_policy?.mcq?.correct ?? qPts)
        : (test.scoring_policy?.mcq?.negative ?? 0);
    } else if (typeof s.textInput === "string") {
      const input = s.textInput.trim().toLowerCase();
      const perQ = textPolicyByQ.get(s.questionId);
      const accepted = (perQ?.accepted ?? test.scoring_policy?.text?.accepted ?? [])
        .map((a) => String(a).trim().toLowerCase());
      is_correct = accepted.includes(input);
      score += is_correct
        ? (test.scoring_policy?.text?.correct ?? qPts)
        : (test.scoring_policy?.text?.negative ?? 0);
    }

    return {
      attempt_id: attemptId,
      question_id: s.questionId,
      option_id: s.optionId ?? null,
      text_input: s.textInput ?? null,
      is_correct,
    };
  });

  if (rows.length) {
    const { error: insErr } = await supabase.from("answers").insert(rows);
    if (insErr) return { statusCode: 500, body: insErr.message };
  }

  const { error: upErr } = await supabase
    .from("attempts")
    .update({ submitted_at: new Date().toISOString(), score })
    .eq("id", attemptId);
  if (upErr) return { statusCode: 500, body: upErr.message };

  let willEmail = false;
  if (!test.show_score && attempt?.email) {
    willEmail = true;
    const sendAfter = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const subject = `Your ${test.title} score`;
    const html = `
      <div style="font-family:system-ui,Segoe UI,Arial">
        <h2>Hi ${attempt.name || attempt.email},</h2>
        <p>Thanks for completing <b>${test.title}</b>.</p>
        <p>Your score: <b>${score}</b></p>
        <p>— Kuiz</p>
      </div>
    `;
    await supabase.from("score_emails").insert({
      attempt_id: attemptId,
      email: attempt.email,
      subject,
      html,
      send_after: sendAfter,
    });
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score, showScore: !!test.show_score, willEmail }),
  };
};
