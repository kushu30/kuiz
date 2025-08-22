import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function Join() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Prefill ?code=ABC123 from URL parameters
  useEffect(() => {
    const c = (searchParams.get("code") || "").toUpperCase();
    if (c) setCode(c);
  }, [searchParams]);

  async function handleJoin(e: React.FormEvent) {
  e.preventDefault();
  setBusy(true);
  setError("");

  if (code.trim().length !== 6) {
    setError("Please enter a 6-character code");
    setBusy(false);
    return;
  }

  try {
    const codeUp = code.trim().toUpperCase();

    // 1) Find test by code
    const { data: test, error: tErr } = await supabase
      .from("tests")
      .select("id, title")
      .eq("code", codeUp)
      .single();
    if (tErr || !test) throw new Error("No quiz found for that code.");

    // 2) Try to create attempt
    const displayName =
      (user?.user_metadata?.full_name as string) ||
      (user?.user_metadata?.name as string) ||
      (user?.email as string) ||
      null;

    const { data: attempt, error: aErr, status } = await supabase
      .from("attempts")
      .insert({
        test_id: test.id,
        user_id: user?.id ?? null,
        started_at: new Date().toISOString(),
        // uncomment these if your attempts table has these columns:
        // name: displayName,
        // email: user?.email ?? null,
      })
      .select("id")
      .single();

    if (aErr) {
      const isConflict = status === 409 || (aErr as any)?.code === "23505";
      if (!isConflict) throw aErr;

      // 3) On duplicate, fetch existing attempt for this user+test
      const { data: existing, error: sErr } = await supabase
        .from("attempts")
        .select("id")
        .eq("test_id", test.id)
        .eq("user_id", user?.id ?? null)
        .single();

      if (sErr || !existing) throw new Error("Could not resume your attempt.");
      navigate(`/take/${test.id}?attempt=${existing.id}`);
      return;
    }

    // 4) New attempt path
    navigate(`/take/${test.id}?attempt=${attempt!.id}`);
  } catch (err: any) {
    console.error(err);
    setError(err?.message || "Could not join test. Please try again.");
  } finally {
    setBusy(false);
  }
}


  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader 
          title="Join a Quiz" 
          subtitle="Enter the 6-character code shared by your host" 
        />
        <CardBody>
          <form onSubmit={handleJoin} className="grid gap-3">
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="uppercase tracking-widest text-center font-mono"
              maxLength={6}
              pattern="[A-Z0-9]{6}"
              title="6-character code (letters and numbers only)"
              required
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Joining…" : "Join Quiz"}
            </Button>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                {error}
              </div>
            )}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}