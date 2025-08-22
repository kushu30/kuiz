import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

type Attempt = { 
  id: string; 
  user_id: string | null;
  name: string | null; 
  email: string | null; 
  score: number | null; 
  started_at: string;
  submitted_at: string | null;
};

type Question = { id: string; body: string; type: "mcq" | "text"; text_policy: { accepted: string[] } | null };
type Option = { id: string; question_id: string; label: string; text: string; is_correct: boolean };
type Row = {
  id: string;
  is_correct: boolean | null;
  question: { id: string; body: string; type: "mcq" | "text" };
  option?: { label: string; text: string } | null;
  text_input?: string | null;
  correct_option?: { label: string; text: string } | null;
  accepted?: string[] | null;
};

type AnswerRow = {
  id: string;
  question_id: string;
  option_id: string | null;
  text_input: string | null;
  is_correct: boolean | null;
  question: Question | null;
  option: Option | null;
};

// Type for raw answers that might have arrays
type RawAns = {
  id: string;
  question_id: string;
  option_id: string | null;
  text_input: string | null;
  is_correct: boolean | null;
  question?: Question | Question[] | null;
  option?: Option | Option[] | null;
};

export default function AdminResults() {
  const { id: testId } = useParams<{ id: string }>();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selected, setSelected] = useState<Attempt | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttempts();
  }, [testId]);

  async function loadAttempts() {
    if (!testId) return;
    
    const { data, error } = await supabase
      .from("attempts")
      .select("id, user_id, name, email, score, started_at, submitted_at")
      .eq("test_id", testId)
      .order("started_at", { ascending: false });
      
    if (error) {
      setError("Failed to load attempts: " + error.message);
      setAttempts([]);
      return;
    }
    setAttempts(data || []);
    setError(null);
  }

  async function openAttempt(a: Attempt) {
    setSelected(a);
    setRows([]);
    setError(null);

    // Fetch answers with related question and option data
    const { data: answers, error: ansError } = await supabase
      .from("answers")
      .select(`
        id,
        question_id,
        option_id,
        text_input,
        is_correct,
        question:questions(id, body, type, text_policy),
        option:options(id, label, text, is_correct)
      `)
      .eq("attempt_id", a.id);
      
    if (ansError) {
      setError("Failed to load answers: " + ansError.message);
      return;
    }

    if (!answers || answers.length === 0) {
      setRows([]);
      return;
    }

    // Answers may have question/option as arrays -> normalize to single object
    const norm: AnswerRow[] = (answers as RawAns[]).map((a) => {
      const q = Array.isArray(a.question) ? a.question[0] ?? null : (a.question ?? null);
      const o = Array.isArray(a.option) ? a.option[0] ?? null : (a.option ?? null);
      return {
        id: a.id,
        question_id: a.question_id,
        option_id: a.option_id,
        text_input: a.text_input,
        is_correct: a.is_correct,
        question: q,
        option: o,
      };
    });

    // Get correct options for all questions in this attempt
    const questionIds = norm.map((a) => a.question_id);
    const { data: correctOpts, error: correctError } = await supabase
      .from("options")
      .select("question_id, label, text, id")
      .eq("is_correct", true)
      .in("question_id", questionIds);
      
    if (correctError) {
      setError("Failed to load correct options: " + correctError.message);
      return;
    }

    // Create a map of correct options by question ID
    const correctByQuestionId = new Map();
    correctOpts?.forEach(opt => {
      correctByQuestionId.set(opt.question_id, {
        label: opt.label,
        text: opt.text,
        id: opt.id
      });
    });

    // Transform the data for display
    const full: Row[] = norm.map((answer) => {
      const question = answer.question;
      const correctOption = correctByQuestionId.get(answer.question_id) || null;

      let isCorrect = answer.is_correct;
      if (isCorrect === null && answer.option_id) {
        isCorrect =
          answer.option?.is_correct ??
          (correctOption ? answer.option_id === correctOption.id : false);
      }

      return {
        id: answer.id,
        is_correct: isCorrect,
        question: {
          id: question?.id || answer.question_id,
          body: question?.body || "Unknown question",
          type: (question?.type as "mcq" | "text") || "mcq",
        },
        option:
          answer.option_id && answer.option
            ? { label: answer.option.label, text: answer.option.text }
            : null,
        text_input: answer.text_input,
        correct_option: correctOption
          ? { label: correctOption.label, text: correctOption.text }
          : null,
        accepted: question?.text_policy?.accepted || null,
      };
    });

    setRows(full);
  }

  return (
    <main className="space-y-6">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Card>
        <CardHeader title="Attempts" subtitle="Click to view answers" />
        <CardBody className="space-y-2">
          {attempts.map((a) => (
            <button
              key={a.id}
              onClick={() => openAttempt(a)}
              className="w-full text-left rounded-lg border px-3 py-2 hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.name || a.email || "Anonymous"}</div>
                  <div className="text-xs text-neutral-500">{a.email}</div>
                </div>
                <div className="text-sm">{a.score ?? 0}</div>
              </div>
              <div className="text-xs text-neutral-500">
                Started: {new Date(a.started_at).toLocaleString()}
                {a.submitted_at && ` • Submitted: ${new Date(a.submitted_at).toLocaleString()}`}
              </div>
            </button>
          ))}
          {attempts.length === 0 && <div className="text-sm text-neutral-500">No attempts yet.</div>}
        </CardBody>
      </Card>

      {selected && (
        <Card>
          <CardHeader title={`Answers — ${selected.name || selected.email || "Anonymous"}`} />
          <CardBody className="space-y-3">
            {rows.map((r, i) => (
              <div key={r.id} className="rounded-lg border p-3">
                <div className="font-medium">
                  {i + 1}. {r.question.body}
                </div>
                {r.question.type === "mcq" ? (
                  <>
                    <div className="text-sm mt-1">
                      Chosen: {r.option ? `${r.option.label}. ${r.option.text}` : <em>—</em>}
                    </div>
                    <div className="text-sm">
                      Correct: {r.correct_option ? `${r.correct_option.label}. ${r.correct_option.text}` : <em>—</em>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm mt-1">Typed: {r.text_input || <em>—</em>}</div>
                    <div className="text-sm">
                      Accepted: {r.accepted?.length ? r.accepted.join(", ") : <em>(none set)</em>}
                    </div>
                  </>
                )}
                <div
                  className={`mt-1 inline-block rounded px-2 text-xs ${
                    r.is_correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.is_correct ? "Correct" : "Wrong"}
                </div>
              </div>
            ))}
            {rows.length === 0 && <div className="text-sm text-neutral-500">No answers.</div>}
          </CardBody>
        </Card>
      )}
    </main>
  );
}