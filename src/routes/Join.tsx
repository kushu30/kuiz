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
    
    // Validate code format (optional)
    if (code.length !== 6) {
      setError("Please enter a 6-character code");
      setBusy(false);
      return;
    }

    try {
      // Find test by code
      const { data: test, error: testError } = await supabase
        .from("tests")
        .select("id, title")
        .eq("code", code.toUpperCase())
        .single();

      if (testError || !test) {
        setError("No quiz found for that code.");
        setBusy(false);
        return;
      }

      // Create attempt
      const { data: attempt, error: attemptError } = await supabase
        .from("attempts")
        .insert({
          test_id: test.id,
          user_id: user?.id ?? null, // Store user ID if authenticated
          started_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (attemptError || !attempt) {
        console.error(attemptError);
        setError("Could not join test. Please try again.");
        setBusy(false);
        return;
      }

      // Redirect with attempt id
      navigate(`/take/${test.id}?attempt=${attempt.id}`);
      
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
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