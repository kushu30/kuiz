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

  async function handleJoin(e: React.FormEvent){
    e.preventDefault();
    setErr("");
    if (!user) { setErr("Please sign in first."); return; }
    setBusy(true);

    try {
      const c = code.trim().toUpperCase();
      // 1) Find test by code
      const { data: test, error: tErr } = await supabase
        .from("tests")
        .select("id")
        .eq("code", c)
        .single();
      if (tErr || !test) throw new Error("Invalid code.");

      // 2) Try to create attempt
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
      const { data: attempt, error: aErr, status } = await supabase
        .from("attempts")
        .insert({ test_id: test.id, user_id: user.id, name: displayName, email: user.email })
        .select("id")
        .single();

      if (aErr) {
        // 409 conflict -> attempt already exists: fetch it
        const isConflict = (status === 409) || (aErr as any)?.code === "23505" || /duplicate|unique/i.test(aErr.message);
        if (!isConflict) throw aErr;

        const { data: existing, error: sErr } = await supabase
          .from("attempts")
          .select("id")
          .eq("test_id", test.id)
          .eq("user_id", user.id)
          .single();
        if (sErr || !existing) throw new Error("Could not resume your attempt.");
        nav(`/test/${test.id}?attempt=${existing.id}`);
        return;
      }

      // 3) New attempt path
      nav(`/test/${test.id}?attempt=${attempt!.id}`);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
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
