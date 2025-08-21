const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  // Validate HTTP method
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Parse and validate JSON payload
  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { attemptId, testId, selections = [] } = payload;
  if (!attemptId || !testId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing attemptId/testId" }) };
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );

  // Check if attempt exists
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select("id")
    .eq("id", attemptId)
    .eq("test_id", testId)
    .single();

  if (attemptError || !attempt) {
    return { statusCode: 404, body: JSON.stringify({ error: "Attempt not found" }) };
  }

  // Fetch full attempt details
  const { data: attemptFull, error: aErr } = await supabase
    .from("attempts")
    .select("id, submitted_at, email, name")
    .eq("id", attemptId)
    .eq("test_id", testId)
    .single();
  if (aErr || !attemptFull) {
    return { statusCode: 404, body: JSON.stringify({ error: "Attempt not found" }) };
  }
  if (attemptFull.submitted_at) {
    return { statusCode: 400, body: JSON.stringify({ error: "Already submitted" }) };
  }

  // Fetch test details
  const { data: test, error: tErr } = await supabase
    .from("tests")
    .select("id, scoring_policy, show_score, title")
    .eq("id", testId)
    .single();
  if (tErr || !test) {
    return { statusCode: 404, body: JSON.stringify({ error: "Test not found" }) };
  }

  // Fetch questions
  const qIds = selections.map((s) => s.questionId);
  const { data: qRows } = await supabase
    .from("questions")
    .select("id, type, text_policy, points")
    .in("id", qIds);

  const textPolicyByQ = new Map();
  (qRows || []).forEach(q => textPolicyByQ.set(q.id, q.text_policy || null));
  const pointsByQ = new Map();
  (qRows || []).forEach(q => pointsByQ.set(q.id, q.points ?? 1));

  // Fetch options
  const { data: optRows, error: oErr } = await supabase
    .from("options")
    .select("id, question_id, is_correct")
    .in("question_id", qIds);
  if (oErr) {
    return { statusCode: 500, body: JSON.stringify({ error: oErr.message }) };
  }

  const correctByQ = new Map();
  (optRows || []).forEach(o => { if (o.is_correct) correctByQ.set(o.question_id, o.id); });

  // Calculate score
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

  // Insert answers
  if (rows.length) {
    const { error: insErr } = await supabase.from("answers").insert(rows);
    if (insErr) {
      return { statusCode: 500, body: JSON.stringify({ error: insErr.message }) };
    }
  }

  // Update attempt with score and submission time
  const { error: upErr } = await supabase
    .from("attempts")
    .update({ submitted_at: new Date().toISOString(), score })
    .eq("id", attemptId);
  if (upErr) {
    return { statusCode: 500, body: JSON.stringify({ error: upErr.message }) };
  }

  // Schedule email if score is not shown
  let willEmail = false;
  if (!test.show_score && attemptFull?.email) {
    willEmail = true;
    const sendAfter = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const subject = `Your ${test.title} score`;
    const html = `
      <div style="font-family:system-ui,Segoe UI,Arial">
        <h2>Hi ${attemptFull.name || attemptFull.email},</h2>
        <p>Thanks for completing <b>${test.title}</b>.</p>
        <p>Your score: <b>${score}</b></p>
        <p>— Kuiz</p>
      </div>
    `;
    await supabase.from("score_emails").insert({
      attempt_id: attemptId,
      email: attemptFull.email,
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