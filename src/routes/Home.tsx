import { useAuth } from "../lib/auth";        // from src/routes/Home.tsx
import { Link } from "react-router-dom";

export default function Home(){
  const { user, loading, signInGoogle, signOut } = useAuth();
  if (loading) return <main className="p-6">Loading…</main>;

  if (!user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Kuiz</h1>
        <button onClick={signInGoogle} className="rounded bg-black text-white px-4 py-2">
          Continue with Google
        </button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div>Hi, {user.user_metadata?.name || user.email}</div>
        <button onClick={signOut} className="text-sm underline">Sign out</button>
      </div>
      <div className="grid gap-3">
        <Link to="/admin/tests" className="rounded border p-4 hover:shadow">
          Create a quiz
        </Link>
        <Link to="/join" className="rounded border p-4 hover:shadow">
          Join a quiz with code
        </Link>
      </div>
    </main>
  );
}
