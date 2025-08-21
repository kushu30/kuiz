import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function Join(){
  const nav = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleJoin(e: React.FormEvent){
    e.preventDefault();
    setErr("");
    if (!user) { setErr("Please sign in first."); return; }
    setBusy(true);

    const c = code.trim().toUpperCase();
    const { data: test, error } = await supabase.from("tests").select("id").eq("code", c).single();
    if (error || !test) { setErr("Invalid code."); setBusy(false); return; }

    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
    const { data: attempt, error: e2 } = await supabase.from("attempts")
      .insert({ test_id: test.id, user_id: user.id, name: displayName, email: user.email })
      .select("id").single();
    setBusy(false);

    if (e2) { setErr(e2.message); return; }
    nav(`/test/${test.id}?attempt=${attempt.id}`);
  }

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader title="Join a Quiz" subtitle="Enter the 6-character code shared by your host" />
        <CardBody>
          <form onSubmit={handleJoin} className="grid gap-3">
            <Input value={code} onChange={e=>setCode(e.target.value)} placeholder="ABC123" className="uppercase tracking-widest" required />
            <Button disabled={busy}>{busy ? "Joining…" : "Join"}</Button>
            {err && <div className="text-sm text-red-600">{err}</div>}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
