import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function Home() {
  const { user, loading, signInGoogle, signOut } = useAuth();
  if (loading) return <main className="text-neutral-600 text-center py-10">Loading…</main>;

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 z-[-2] rotate-180 transform bg-white bg-[radial-gradient(60%_120%_at_50%_50%,hsla(0,0%,100%,0)_0,rgba(252,205,238,.5)_100%)]"></div>
      
      {/* Hero Section */}
      <section className="grid gap-8 sm:grid-cols-2 items-center max-w-5xl mx-auto py-12 px-4 relative z-10">
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

      {/* Features Section */}
      <section className="max-w-5xl mx-auto py-16 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need to create amazing quizzes
          </h2>
          <p className="mt-4 text-neutral-600 text-lg max-w-2xl mx-auto">
            From AI-powered question generation to real-time analytics, we've got every aspect of quiz creation covered.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 grid place-items-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Question Generation</h3>
            <p className="text-neutral-600">Let AI create engaging questions for you. Just provide a topic and get well-crafted MCQs and text questions instantly.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm"
          >
            <div className="w-12 h-12 rounded-lg bg-green-100 grid place-items-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Sharing</h3>
            <p className="text-neutral-600">Share your quiz with a simple code. No complex links or accounts needed—participants join instantly with just a code.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="p-6 rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm"
          >
            <div className="w-12 h-12 rounded-lg bg-purple-100 grid place-items-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
            <p className="text-neutral-600">Get instant insights with detailed stats. Track performance, see response patterns, and understand your audience better.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-6 rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm"
          >
            <div className="w-12 h-12 rounded-lg bg-orange-100 grid place-items-center mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Rich Media Support</h3>
            <p className="text-neutral-600">Add vibrant images to make your quizzes more engaging. Visual questions capture attention and improve retention.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="p-6 rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm"
          >
            <div className="w-12 h-12 rounded-lg bg-red-100 grid place-items-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-neutral-600">Buttery-smooth performance ensures your quizzes load instantly and run seamlessly on any device, anywhere.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="p-6 rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm"
          >
            <div className="w-12 h-12 rounded-lg bg-indigo-100 grid place-items-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Google Authentication</h3>
            <p className="text-neutral-600">Secure, one-click sign-in with Google. No passwords to remember, no complex registration—just seamless access.</p>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-5xl mx-auto py-16 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Create your first quiz in minutes
          </h2>
          <p className="mt-4 text-neutral-600 text-lg max-w-2xl mx-auto">
            Our streamlined process gets you from idea to live quiz faster than ever before.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 grid place-items-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Sign in & Create</h3>
            <p className="text-neutral-600">Sign in with Google and start creating your quiz. Add questions manually or let AI generate them for you.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 grid place-items-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Share the Code</h3>
            <p className="text-neutral-600">Get a unique quiz code and share it with your participants. They can join instantly without any accounts.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-purple-100 grid place-items-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">View Results</h3>
            <p className="text-neutral-600">Watch responses come in real-time and get detailed analytics to understand performance and engagement.</p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-3xl mx-auto py-16 px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.3 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to create engaging quizzes?
          </h2>
          <p className="text-neutral-600 text-lg mb-8">
            Join thousands of educators, trainers, and creators who trust our platform for their interactive content.
          </p>
          {!user && (
            <Button onClick={signInGoogle} className="px-8 py-4 text-lg">
              Get Started with Google
            </Button>
          )}
        </motion.div>
      </section>
    </div>
  );
}