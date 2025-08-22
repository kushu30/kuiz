import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function Shell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();

  const displayName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    (user?.email as string) ||
    "";

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    "";

  return (
    <div className="relative min-h-dvh text-gray-900">
      {/* Global background gradient (behind everything) */}
<div className="pointer-events-none fixed inset-0 -z-10 h-full w-full">
  <div className="absolute inset-0 bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
    <div className="absolute inset-0 rotate-180 [background:radial-gradient(60%_120%_at_50%_50%,hsla(0,0%,100%,0)_0,rgba(0,0,0,0.20)_100%)]" />

</div><header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight text-xl">Kuiz</Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link to="/join" className={linkCls(pathname === "/join")}>Join</Link>
            <Link to="/admin/tests" className={linkCls(pathname.startsWith("/admin"))}>Create</Link>

            {user ? (
              <div className="flex items-center gap-2">
                <UserBadge name={displayName} avatarUrl={avatarUrl} />
                <button
                  onClick={signOut}
                  className="rounded-md border px-3 py-1.5 hover:bg-gray-100"
                  title="Sign out"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-gray-500">
        © {new Date().getFullYear()} Kuiz
      </footer>
    </div>
  );
}

function linkCls(active: boolean) {
  return [
    "rounded-md px-3 py-1.5",
    active ? "bg-gray-900 text-white" : "hover:bg-gray-100"
  ].join(" ");
}

function UserBadge({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name
    ? name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("")
    : "?";

  return (
    <span className="inline-flex items-center gap-2 rounded-md border bg-white px-2.5 py-1.5">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || "User"}
          className="h-6 w-6 rounded-full object-cover grayscale"
          referrerPolicy="no-referrer"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <span className="grid h-6 w-6 place-items-center rounded-full border text-[10px] font-medium">
          {initials}
        </span>
      )}
      <span className="max-w-[12rem] truncate">{name}</span>
    </span>
  );
}