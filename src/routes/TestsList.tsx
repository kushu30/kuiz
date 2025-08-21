import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type T = { id: string; title: string; description: string | null; code: string | null };

export default function TestsList() {
  const [tests, setTests] = useState<T[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tests")
        .select("id,title,description,code")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      setTests(data || []);
    })();
  }, []);
  return (
    <main className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">Available Tests</h1>
      <div className="grid gap-2">
        {tests.map(t => (
          <div key={t.id} className="rounded border p-3">
            <div className="font-medium">{t.title}</div>
            <div className="text-sm text-slate-600">{t.description}</div>
            <div className="text-xs text-slate-500">Code: {t.code ?? "-"}</div>
            <Link className="underline text-sm" to={`/join`}>Join with code</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
