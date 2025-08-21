import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function Home() {
  const { user, loading, signInGoogle, signOut } = useAuth();
  if (loading) return <main className="text-neutral-600 text-center py-10">Loading…</main>;

  return (
    <section className="grid gap-8 sm:grid-cols-2 items-center max-w-5xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Run quizzes that feel <span className="underline decoration-neutral-300">buttery-smooth</span> and engaging.
        </h1>
        <p className="mt-4 text-neutral-600 text-lg">
          Create seamless MCQ & text quizzes, add vibrant images, share a unique code, and get instant, actionable results. Perfect for educators, teams, and creators.
        </p>
        <div className="mt-6 flex gap-3 items-center">
          {!user ? (
            <Button onClick={signInGoogle} className="px-6 py-3 text-lg">
              Continue with Google
            </Button>
          ) : (
            <>
              <Link to="/admin/tests">
                <Button className="px-6 py-3 text-lg">Create a quiz</Button>
              </Link>
              <Link to="/join">
                <Button className="bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 px-6 py-3 text-lg">
                  Join with code
                </Button>
              </Link>
              <button onClick={signOut} className="text-sm underline text-neutral-500 hover:text-neutral-700 ml-3">
                Sign out
              </button>
            </>
          )}
        </div>
        <p className="mt-5 text-sm text-neutral-500">
          Join thousands of users crafting interactive quizzes with ease. No setup, no hassle—just results.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.45, ease: "easeOut" }} 
        className="order-first sm:order-last"
      >
        <div className="aspect-video w-full rounded-2xl border bg-gradient-to-br from-neutral-100 to-neutral-50 grid place-items-center text-neutral-500 text-lg font-medium shadow-sm">
          Interactive Quiz Preview
        </div>
      </motion.div>
    </section>
  );
}