import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthState = {
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  init: async () => {
    try {
      // 1) Try to get existing session
      const { data, error } = await supabase.auth.getSession();
      if (!error) set({ user: data.session?.user ?? null });

      // 2) Subscribe to future changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null, loading: false });
      });

      // 3) Always end loading, even if there was an error
      set({ loading: false });
    } catch {
      set({ loading: false });
    }
  },

  signInGoogle: async () => {
    // redirect to Supabase’s hosted callback
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/" },
    });
    if (error) console.error(error);
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
    set({ user: null });
  },
}));
