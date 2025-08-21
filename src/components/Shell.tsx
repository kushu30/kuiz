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
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight text-xl">Kuiz</Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link to="/join" className={linkCls(pathname === "/join")}>Join</Link>
            <Link to="/admin/tests" className={linkCls(pathname.startsWith("/admin"))}>Admin</Link>

            {user ? (
              <div className="flex items-center gap-2">
                <UserBadge name={displayName} avatarUrl={avatarUrl} />
                <button
                  onClick={signOut}
                  className="rounded-md border px-3 py-1.5 hover:bg-neutral-100"
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

      <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-neutral-500">
        © {new Date().getFullYear()} Kuiz
      </footer>
    </div>
  );
}

function linkCls(active: boolean) {
  return [
    "rounded-md px-3 py-1.5",
    active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
  ].join(" ");
}

/** Monochrome user pill with avatar + name */
function UserBadge({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name
    ? name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase())
        .join("")
    : "?";

  return (
    <span className="inline-flex items-center gap-2 rounded-md border bg-white px-2.5 py-1.5">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || "User"}
          className="h-6 w-6 rounded-full object-cover grayscale"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // fallback to initials if image fails
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : null}
      {/* If image failed/absent, show initials bubble */}
      {!avatarUrl && (
        <span className="grid h-6 w-6 place-items-center rounded-full border text-[10px] font-medium">
          {initials}
        </span>
      )}
      <span className="max-w-[12rem] truncate">{name}</span>
    </span>
  );
}
