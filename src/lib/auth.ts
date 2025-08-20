import { create } from "zustand";
import { supabase } from "../lib/supabase";

type AuthState = { user: any | null; loading: boolean };
type AuthActions = {
  init: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState & AuthActions>((set) => ({
  user: null, loading: true,
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });
    supabase.auth.onAuthStateChange((_e, s) => set({ user: s?.user ?? null }));
  },
  signInGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  },
  signOut: async () => { await supabase.auth.signOut(); },
}));
