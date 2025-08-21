import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function Home(){
  const { user, loading, signInGoogle, signOut } = useAuth();
  if (loading) return <main>Loading…</main>;

  return (
    <section className="grid gap-6 sm:grid-cols-2 items-center">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Run quizzes that feel <span className="underline decoration-neutral-300">buttery-smooth</span>.</h1>
        <p className="mt-3 text-neutral-600">Create MCQ & text quizzes, add images, share a code, and get instant results.</p>
        <div className="mt-5 flex gap-2">
          {!user ? (
            <Button onClick={signInGoogle}>Continue with Google</Button>
          ) : (
            <>
              <Link to="/admin/tests"><Button>Create a quiz</Button></Link>
              <Link to="/join"><Button className="bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50">Join with code</Button></Link>
              <button onClick={signOut} className="text-sm underline ml-2">Sign out</button>
            </>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .35 }} className="order-first sm:order-last">
        <div className="aspect-video w-full rounded-2xl border bg-gradient-to-br from-neutral-100 to-neutral-50 grid place-items-center text-neutral-500">
          Preview
        </div>
      </motion.div>
    </section>
  );
}
