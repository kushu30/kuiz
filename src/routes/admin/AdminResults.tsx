import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

type Attempt = { id: string; name: string | null; email: string | null; score: number | null; submitted_at: string | null };
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

export default function AdminResults() {
  const { id: testId } = useParams<{ id: string }>();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selected, setSelected] = useState<Attempt | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("id,name,email,score,submitted_at")
        .eq("test_id", testId)
        .order("submitted_at", { ascending: false });
      if (error) {
        setError("Failed to load attempts: " + error.message);
        setAttempts([]);
        return;
      }
      setAttempts(data || []);
      setError(null);
    })();
  }, [testId]);

  async function openAttempt(a: Attempt) {
    setSelected(a);
    setRows([]);
    setError(null);

    const { data: ans, error: ansError } = await supabase
      .from("answers")
      .select("id,is_correct,text_input,question_id,option_id")
      .eq("attempt_id", a.id);
    if (ansError) {
      setError("Failed to load answers: " + ansError.message);
      return;
    }

    if (!ans || ans.length === 0) {
      setRows([]);
      return;
    }

    const qIds = [...new Set(ans.map((r) => r.question_id))];
    const { data: qs, error: qError } = await supabase
      .from("questions")
      .select("id,body,type,text_policy")
      .in("id", qIds);
    if (qError) {
      setError("Failed to load questions: " + qError.message);
      return;
    }

    const { data: opts, error: optError } = await supabase
      .from("options")
      .select("id,question_id,label,text,is_correct")
      .in("question_id", qIds);
    if (optError) {
      setError("Failed to load options: " + optError.message);
      return;
    }

    const qById = new Map<string, Question>((qs || []).map((q) => [q.id, q]));
    const correctByQ = new Map<string, Option>((opts || []).filter((o) => o.is_correct).map((o) => [o.question_id, o]));
    const optById = new Map<string, Option>((opts || []).map((o) => [o.id, o]));

    const full: Row[] = ans.map((r) => {
      const q = qById.get(r.question_id);
      if (!q) {
        return {
          id: r.id,
          is_correct: r.is_correct,
          question: { id: r.question_id, body: "Unknown question", type: "mcq" },
          option: null,
          text_input: r.text_input,
          correct_option: null,
          accepted: null,
        };
      }
      return {
        id: r.id,
        is_correct: r.is_correct,
        question: { id: q.id, body: q.body, type: q.type },
        option: r.option_id && optById.get(r.option_id) ? { label: optById.get(r.option_id)!.label, text: optById.get(r.option_id)!.text } : null,
        text_input: r.text_input,
        correct_option: correctByQ.get(r.question_id) ? { label: correctByQ.get(r.question_id)!.label, text: correctByQ.get(r.question_id)!.text } : null,
        accepted: q.text_policy?.accepted ?? null,
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
                  <div className="font-medium">{a.name || a.email}</div>
                  <div className="text-xs text-neutral-500">{a.email}</div>
                </div>
                <div className="text-sm">{a.score ?? 0}</div>
              </div>
              <div className="text-xs text-neutral-500">
                {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "in progress"}
              </div>
            </button>
          ))}
          {attempts.length === 0 && <div className="text-sm text-neutral-500">No attempts yet.</div>}
        </CardBody>
      </Card>

      {selected && (
        <Card>
          <CardHeader title={`Answers — ${selected.name || selected.email}`} />
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