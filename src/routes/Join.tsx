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
  const codeFromUrl = (searchParams.get("code") || "").toUpperCase();

  // Prefill ?code=ABC123 from URL parameters
  useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl);
  }, [codeFromUrl]);

  // Restore code if we stashed it before redirect
  useEffect(() => {
    if (!code) {
      const saved = localStorage.getItem("kuiz_join_code");
      if (saved) setCode(saved.toUpperCase());
    }
  }, []);

  async function signInGoogle() {
    // keep code so it persists through the OAuth redirect round-trip
    if (code) localStorage.setItem("kuiz_join_code", code);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/join?code=" + (code || codeFromUrl || "")
      }
    });
  }

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
        .select("id, title, show_score")
        .eq("code", codeUp)
        .single();
      
      if (tErr || !test) throw new Error("No quiz found for that code.");

      const displayName =
        (user?.user_metadata?.full_name as string) ||
        (user?.user_metadata?.name as string) ||
        (user?.email as string) ||
        null;

      const email = (user?.email as string) || null;

      // 2) Try to create attempt
      const { data: attempt, error: aErr, status } = await supabase
        .from("attempts")
        .insert({
          test_id: test.id,
          user_id: user?.id ?? null,
          started_at: new Date().toISOString(),
          name: displayName,
          email
        })
        .select("id")
        .single();

      if (aErr) {
        const isConflict = status === 409 || (aErr as any)?.code === "23505";
        if (!isConflict) throw aErr;

        // 3) On duplicate, fetch existing attempt for this user+test
        const { data: existing, error: sErr } = await supabase
          .from("attempts")
          .select("id, name, email")
          .eq("test_id", test.id)
          .eq("user_id", user?.id ?? null)
          .single();

        if (sErr || !existing) throw new Error("Could not resume your attempt.");

        // Backfill name/email if missing
        if (!existing.name || !existing.email) {
          await supabase
            .from("attempts")
            .update({ name: displayName, email })
            .eq("id", existing.id);
        }

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

  // Early return if not signed in
  if (!user) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardHeader title="Sign in to Join" subtitle="Use your Google account to continue" />
          <CardBody className="grid gap-3">
            <Button onClick={signInGoogle}>Continue with Google</Button>
            {code && <div className="text-xs text-neutral-500">Joining code detected: <b>{code}</b></div>}
          </CardBody>
        </Card>
      </div>
    );
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