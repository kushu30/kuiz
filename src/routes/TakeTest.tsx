import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { AnimatePresence, motion } from "framer-motion";

// Define ButtonProps to fix variant and onClick prop TypeScript errors
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string; // Allow any string or specify allowed variants like "primary" | "secondary"
  children: React.ReactNode; // Use ReactNode for flexibility
  className?: string;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

interface Option {
  id: string;
  question_id: string;
  label: string;
  text: string;
}

interface Question {
  id: string;
  body: string;
  media_url: string | null;
  type: "mcq" | "text";
  order_index: number;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  guidelines: string | null;
  show_score: boolean;
  duration_minutes: number;
}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const pad = (n: number) => String(n).padStart(2, "0");

function baseUrl() {
  if (typeof window === "undefined") return "https://yourdomain.com";
  return window.location.origin;
}

export function directStartLink(testId: string) {
  const url = new URL(`/test/${testId}`, baseUrl());
  url.searchParams.set("autostart", "1");
  return url.toString();
}

export default function TakeTest() {
  const { id: testId } = useParams<{ id: string }>();
  const query = useQuery();
  const navigate = useNavigate();
  const attemptId = query.get("attempt") || "";

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(true); // Start with guide shown
  const [done, setDone] = useState<{
    show: boolean;
    score?: number;
    willEmail?: boolean;
  }>({ show: false });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0); // Initialize with 0
  const timerRef = useRef<number | null>(null);
  const endKey = useMemo(() => (attemptId ? `kuiz_attempt_${attemptId}_end` : ""), [attemptId]);

  // Timer logic (start after Start Quiz)
  useEffect(() => {
    if (!showGuide && timeLeft > 0) {
      const t = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(t);
    }
  }, [showGuide, timeLeft]);

  useEffect(() => {
    if (!attemptId) {
      navigate("/join");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: attempt, error: attemptError } = await supabase
          .from("attempts")
          .select("id")
          .eq("id", attemptId)
          .single();
        if (attemptError || !attempt) {
          setError("Invalid attempt ID.");
          navigate("/join");
          return;
        }

        const { data: t, error: et } = await supabase
          .from("tests")
          .select("id,title,description,guidelines,show_score,duration_minutes")
          .eq("id", testId)
          .single();
        if (et || !t) {
          setError("Test not found.");
          navigate("/");
          return;
        }

        const { data: qs, error: eq } = await supabase
          .from("questions")
          .select("id,body,media_url,type,order_index")
          .eq("test_id", testId)
          .order("order_index");
        if (eq) {
          setError("Failed to load questions.");
          return;
        }

        const ids = (qs || []).map((x) => x.id);
        const { data: os, error: eo } = ids.length
          ? await supabase.from("options").select("id,question_id,label,text").in("question_id", ids)
          : { data: [] as Option[], error: null };
        if (eo) {
          setError("Failed to load options.");
          return;
        }

        setTest(t);
        setQuestions((qs || []) as Question[]);
        setOptions((os || []) as Option[]);
        
        // Show guide if there are guidelines, otherwise start immediately
        if (t?.guidelines) {
          setShowGuide(true);
        } else {
          setShowGuide(false);
          setTimeLeft(t.duration_minutes * 60); // Initialize timer
        }

      } catch (err) {
        setError("An unexpected error occurred while loading the test.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [testId, attemptId, endKey, navigate]);

  const timeLabel = useMemo(() => {
    if (timeLeft === null) return "—";
    return `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`;
  }, [timeLeft]);

  const answered = useMemo(() => {
    let n = 0;
    for (const q of questions) {
      const v = answers[q.id];
      if (q.type === "mcq" ? !!v : (v ?? "").trim().length > 0) n++;
    }
    return n;
  }, [answers, questions]);
  const total = questions.length;
  const pct = total ? Math.round((answered / total) * 100) : 0;

  async function endTestEarly() {
    if (!attemptId) return;
    try {
      await supabase
        .from("attempts")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", attemptId);
      navigate("/join");
    } catch {
      setError("Failed to end test early.");
    }
  }

  function selectionsFromState() {
    return questions.map((q) => {
      const v = answers[q.id] ?? "";
      if (q.type === "mcq") {
        return { questionId: q.id, optionId: v || null };
      } else {
        return { questionId: q.id, textInput: v };
      }
    });
  }

  async function submitInternal() {
    try {
      const selections = selectionsFromState();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/.netlify/functions/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, testId, selections }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Submit failed (${res.status}). ${text || "Please try again."}`);
      }

      const data = await res.json().catch(() => ({}));
      if (endKey) {
        try {
          localStorage.removeItem(endKey);
        } catch {
          console.warn("Failed to remove endKey from localStorage.");
        }
      }
      setDone({ show: true, score: data?.score, willEmail: data?.willEmail });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Failed to submit answers.");
    }
  }

  async function handleSubmit() {
    if (!confirm("Are you sure you want to submit your answers? You won't be able to change them afterward.")) {
      return;
    }
    try {
      setSubmitting(true);
      await submitInternal();
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <main className="max-w-xl mx-auto p-4">
        <div className="rounded-xl border bg-red-50 p-6 text-red-700">{error}</div>
      </main>
    );
  }

  if (loading || !test) {
    return <main className="max-w-xl mx-auto p-4">Loading...</main>;
  }

  if (done.show) {
    return (
      <main className="max-w-xl mx-auto p-4 space-y-4">
        <div className="rounded-xl border bg-white p-6 space-y-2">
          <h1 className="text-xl font-semibold">Submitted 🎉</h1>
          {done.willEmail ? (
            <p className="text-sm text-neutral-600">
              Thanks for completing the quiz. Your score will be emailed to you in about 10 minutes.
            </p>
          ) : (
            <p className="text-sm text-neutral-600">
              Thanks for completing! Your score: <span className="font-medium">{done.score ?? "N/A"}</span>
            </p>
          )}
          <div className="pt-2">
            <Button onClick={() => navigate("/join")}>Go back</Button>
          </div>
        </div>
      </main>
    );
  }

  // Render guide if showGuide is true
  if (showGuide) {
    return (
      <main className="max-w-xl mx-auto p-4">
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">{test.title}</h1>
          {test.description && <p className="text-sm text-neutral-700">{test.description}</p>}
          {test.guidelines && (
            <div className="rounded border p-3 bg-neutral-50 text-sm whitespace-pre-line">
              {test.guidelines}
            </div>
          )}
          <Button
            onClick={() => {
              setShowGuide(false);
              setTimeLeft(test.duration_minutes * 60); // start timer here
            }}
            className="shadow-lg"
          >
            Start Quiz
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{test.title}</h1>
          <div className="text-xs text-neutral-500">{test.description || "No description provided."}</div>
          <div className="text-xs text-neutral-500">
            {total} questions • {test.duration_minutes} min
          </div>
        </div>
        <div className="text-xs text-neutral-500">
          Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      </div>

      <div
        className="w-full rounded-full bg-neutral-200 h-2 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Quiz progress"
      >
        <div
          className="h-2 bg-neutral-900 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-neutral-500">{answered}/{total} answered</div>

      <AnimatePresence initial={false}>
        {questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardBody className="space-y-3">
                <div className="font-medium">{i + 1}. {q.body}</div>
                {q.media_url && (
                  <img
                    src={q.media_url}
                    className="w-full max-h-64 object-contain rounded-lg border"
                    alt={`Media for question ${i + 1}`}
                    loading="lazy"
                  />
                )}

                {q.type === "mcq" ? (
                  <div className="grid gap-2">
                    {options
                      .filter((o) => o.question_id === q.id)
                      .map((o) => (
                        <label
                          key={o.id}
                          className="flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-neutral-50"
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={o.id}
                            className="h-4 w-4"
                            checked={answers[q.id] === o.id}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                          />
                          <span className="text-sm">
                            <span className="font-mono text-xs mr-2">{o.label}.</span>
                            {o.text}
                          </span>
                        </label>
                      ))}
                    {options.filter((o) => o.question_id === q.id).length === 0 && (
                      <div className="text-xs text-neutral-500">No options available.</div>
                    )}
                  </div>
                ) : (
                  <input
                    name={q.id}
                    placeholder="Your answer"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    autoComplete="off"
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  />
                )}
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="sticky bottom-4 flex gap-2 justify-end">
        <Button
          onClick={endTestEarly}
          className="shadow"
          disabled={submitting}
        >
          End Test Early
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="shadow-lg"
        >
          {submitting ? "Submitting..." : "Submit Answers"}
        </Button>
      </div>
    </main>
  );
}