import type { ReactNode } from "react";           // 👈 type-only import
import { useAuth } from "../lib/auth";        // from src/routes/Home.tsx
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="p-6">Loading…</main>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
