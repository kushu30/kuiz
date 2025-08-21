import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function Join(){
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Prefill ?code=ABC123
  useEffect(() => {
    const c = (searchParams.get("code") || "").toUpperCase();
    if (c) setCode(c);
  }, [searchParams]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    
    const { data: test } = await supabase
      .from("tests")
      .select("id")
      .eq("code", code.toUpperCase())
      .single();

    if (!test) {
      setErr("No quiz found for that code.");
      setBusy(false);
      return;
    }

    // create attempt
    const { data: attempt, error } = await supabase
      .from("attempts")
      .insert({
        test_id: test.id,
        user_id: user?.id ?? null, // if you're storing auth users
        started_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error || !attempt) {
      setErr("Could not start attempt. Try again.");
      setBusy(false);
      return;
    }

    nav(`/take/${test.id}?attempt=${attempt.id}`);
  }

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader title="Join a Quiz" subtitle="Enter the 6-character code shared by your host" />
        <CardBody>
          <form onSubmit={handleJoin} className="grid gap-3">
            <Input
              value={code}
              onChange={e=>setCode(e.target.value)}
              placeholder="ABC123"
              className="uppercase tracking-widest"
              required
            />
            <Button disabled={busy}>{busy ? "Joining…" : "Join"}</Button>
            {err && <div className="text-sm text-red-600">{err}</div>}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}