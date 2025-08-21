import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { AnimatePresence, motion } from "framer-motion";

type Opt = { id: string; question_id: string; label: string; text: string };
type Q   = { id: string; body: string; media_url: string | null; type: "mcq"|"text"; order_index: number };

function useQuery(){ return new URLSearchParams(useLocation().search); }
const pad = (n:number)=>String(n).padStart(2,"0");

// Add baseUrl function
function baseUrl() {
  if (typeof window === 'undefined') return 'https://yourdomain.com';
  return window.location.origin;
}

// Add directStartLink function
export function directStartLink(testId: string) {
  const url = new URL(`/test/${testId}`, baseUrl());
  url.searchParams.set("autostart", "1");
  return url.toString();
}

export default function TakeTest() {
  const { id: testId } = useParams();
  const q = useQuery();
  const nav = useNavigate();
  const attemptId = q.get("attempt") || "";

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [options, setOptions] = useState<Opt[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [done, setDone] = useState<{show:boolean; score?:number; willEmail?:boolean}>({show:false});

  // answer state: questionId -> optionId | text
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const endKey = useMemo(() => attemptId ? `kuiz_attempt_${attemptId}_end` : "", [attemptId]);

  // load data
  useEffect(() => {
    if (!attemptId) { nav("/join"); return; }
    (async () => {
      const { data: t, error: et } = await supabase
        .from("tests")
        .select("id,title,show_score,duration_minutes,guidelines")
        .eq("id", testId).single();
      if (et || !t) { nav("/"); return; }

      const { data: qs } = await supabase
        .from("questions")
        .select("id,body,media_url,type,order_index")
        .eq("test_id", testId)
        .order("order_index");
      const ids = (qs || []).map(x => x.id);
      const { data: os } = ids.length
        ? await supabase.from("options").select("id,question_id,label,text").in("question_id", ids)
        : { data: [] as Opt[] };

      setTest(t); setQuestions((qs || []) as Q[]); setOptions((os || []) as Opt[]);
      setShowGuide(!!t.guidelines);

      // init timer
      if (t?.duration_minutes && endKey) {
        const now = Date.now();
        const existing = localStorage.getItem(endKey);
        let end = existing ? parseInt(existing, 10) : NaN;
        if (!existing || Number.isNaN(end) || end < now) {
          end = now + t.duration_minutes * 60_000;
          localStorage.setItem(endKey, String(end));
        }
        startTicker(end);
      }
    })();
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [testId, attemptId, endKey, nav]);

  function startTicker(end: number) {
    if (timerRef.current) window.clearInterval(timerRef.current);
    const tick = () => {
      const ms = end - Date.now();
      setTimeLeft(Math.max(0, ms));
      if (ms <= 0) {
        window.clearInterval(timerRef.current!);
        autoSubmit();
      }
    };
    tick();
    timerRef.current = window.setInterval(tick, 250) as unknown as number;
  }

  const timeLabel = useMemo(() => {
    if (timeLeft == null) return "—";
    const total = Math.ceil(timeLeft / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }, [timeLeft]);

  // progress
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

  if (!test) return <main>Loading…</main>;

  function selectionsFromState() {
    return questions.map(q => {
      const v = answers[q.id] ?? "";
      if (q.type === "mcq") {
        return { questionId: q.id, optionId: v || null };
      } else {
        return { questionId: q.id, textInput: v };
      }
    });
  }

  async function submitInternal() {
    const selections = selectionsFromState();
    const res = await fetch("/.netlify/functions/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, testId, selections })
    });

    if (!res.ok) {
      const text = await res.text().catch(()=> "");
      setSubmitting(false);
      alert(`Submit failed (${res.status}). ${text || "Please try again."}`);
      return;
    }
    const data = await res.json().catch(()=> ({}));

    if (endKey) localStorage.removeItem(endKey);
    setDone({ show: true, score: data?.score, willEmail: data?.willEmail });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    try { setSubmitting(true); await submitInternal(); }
    finally { setSubmitting(false); }
  }

  async function autoSubmit() {
    if (submitting) return;
    try { setSubmitting(true); await submitInternal(); }
    finally { setSubmitting(false); }
  }

  if (done.show) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="rounded-xl border bg-white p-6 space-y-2">
          <h1 className="text-xl font-semibold">Submitted 🎉</h1>
          {done.willEmail ? (
            <p className="text-sm text-neutral-600">
              Thanks for completing the quiz. Your score will be emailed to you in about 10 minutes.
            </p>
          ) : (
            <p className="text-sm text-neutral-600">
              Thanks for completing! Your score: <span className="font-medium">{done.score}</span>
            </p>
          )}
          <div className="pt-2">
            <Button onClick={()=> nav("/")}>Go home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{test.title}</h1>
          <div className="text-xs text-neutral-500">
            {total} questions • {test.duration_minutes} min
          </div>
        </div>
        <div className="text-xs">
          <span className="rounded-md border px-2 py-1 bg-white">
            Time left:{" "}
            <span className={timeLeft !== null && timeLeft <= 15_000 ? "text-red-600" : "text-neutral-600"}>
              {timeLabel}
            </span>
          </span>
        </div>
      </div>

      {/* Guidelines */}
      {showGuide ? (
        <Card>
          <CardBody className="space-y-3">
            <div className="font-semibold">Guidelines</div>
            <div className="whitespace-pre-wrap text-sm text-neutral-700">{test.guidelines}</div>
            <div className="flex justify-end">
              <Button onClick={()=>setShowGuide(false)}>Start quiz</Button>
          </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Progress bar */}
          <div className="w-full rounded-full bg-neutral-200 h-2 overflow-hidden">
            <div
              className="h-2 bg-neutral-900 transition-[width] duration-300"
              style={{ width: `${pct}%` }}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            />
          </div>
          <div className="text-xs text-neutral-500">{answered}/{total} answered</div>

          {/* Questions */}
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
                        alt=""
                        loading="lazy"
                      />
                    )}

                    {q.type === "mcq" ? (
                      <div className="grid gap-2">
                        {options.filter(o => o.question_id === q.id).map(o => (
                          <label key={o.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-neutral-50">
                            <input
                              type="radio"
                              name={q.id}
                              value={o.id}
                              className="h-4 w-4"
                              checked={answers[q.id] === o.id}
                              onChange={() => setAnswers(a => ({ ...a, [q.id]: o.id }))}
                            />
                            <span className="text-sm">
                              <span className="font-mono text-xs mr-2">{o.label}.</span>{o.text}
                            </span>
                          </label>
                        ))}
                        {options.filter(o => o.question_id === q.id).length === 0 && (
                          <div className="text-xs text-neutral-500">No options added yet.</div>
                        )}
                      </div>
                    ) : (
                      <input
                        name={q.id}
                        placeholder="Your answer"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        autoComplete="off"
                        value={answers[q.id] ?? ""}
                        onChange={(e) => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                      />
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Actions */}
          <div className="sticky bottom-4 flex gap-2 justify-end">
            <Button
              onClick={() => {
                if (confirm("End test now? You won't be able to change answers.")) handleSubmit();
              }}
              disabled={submitting}
              className="bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50"
            >
              End test
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="shadow-lg">
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}