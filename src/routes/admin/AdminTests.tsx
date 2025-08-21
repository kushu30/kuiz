import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { AnimatePresence, motion } from "framer-motion";

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function AdminTests() {
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [showScore, setShowScore] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [guidelines, setGuidelines] = useState("");

  async function load() {
    setErrorMsg("");
    const { data, error } = await supabase
      .from("tests")
      .select("id,title,code,created_at")
      .eq("created_by", user?.id)
      .order("created_at", { ascending: false });
    if (error) setErrorMsg(error.message);
    setItems(data || []);
  }

  useEffect(() => { if (user && !loading) load(); }, [user?.id, loading]);

  async function createTest(e: React.FormEvent){
    e.preventDefault();
    if (!user) return;
    setSubmitting(true); setErrorMsg("");
    const dur = Math.max(1, Math.min(300, duration));

    let tries = 0, lastErr = "";
    while (tries < 5) {
      tries++;
      const code = genCode();
      const { error } = await supabase.from("tests").insert({
        title: title.trim(),
        description: description.trim() || null,
        duration_minutes: dur,
        show_score: showScore,
        is_public: isPublic,
        code,
        created_by: user.id,
        guidelines: guidelines.trim() || null,
      });
      if (!error) {
        setTitle(""); setDescription(""); setDuration(30); setShowScore(true); setIsPublic(true); setGuidelines("");
        await load(); setSubmitting(false); return;
      }
      if ((error as any)?.code === "23505" || /duplicate|unique/i.test(error.message)) { lastErr = "Code collision; retrying…"; continue; }
      lastErr = error.message; break;
    }
    setSubmitting(false);
    setErrorMsg(lastErr || "Failed to create quiz.");
  }

  if (loading) return <main>Loading…</main>;
  if (!user) return <main>Please sign in.</main>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader title="Create New Quiz" subtitle="Title, duration and options" />
        <CardBody>
          <form onSubmit={createTest} className="grid gap-3">
            <Input placeholder="Quiz title" value={title} onChange={e=>setTitle(e.target.value)} required />
            <Textarea placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} rows={2} />
            <Textarea placeholder="Guidelines (optional, shown before quiz starts)" value={guidelines} onChange={e=>setGuidelines(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Input type="number" min={1} max={300} value={duration} onChange={e=>setDuration(parseInt(e.target.value||"0"))} placeholder="Duration (min)" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showScore} onChange={e=>setShowScore(e.target.checked)} />
                Show score
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} />
                Public
              </label>
            </div>
            <Button disabled={submitting}>{submitting ? "Creating…" : "Create quiz"}</Button>
            {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
          </form>
        </CardBody>
      </Card>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map(it => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <Card>
                <CardBody className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{it.title}</div>
                    <div className="text-xs text-neutral-500">Code: {it.code}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50" to={`/admin/tests/${it.id}`}>Add Questions</Link>
                    <Link className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50" to={`/admin/results/${it.id}`}>Results</Link>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}