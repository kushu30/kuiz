import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

type Direction = "up" | "left" | "right";

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
}

function AnimatedSection({ children, delay = 0, direction = "up" }: AnimatedSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const directionVariants: Record<Direction, { opacity: number; y?: number; x?: number }> = {
    up: { opacity: 0, y: 60 },
    left: { opacity: 0, x: -60 },
    right: { opacity: 0, x: 60 },
  };
  
  return (
    <motion.div
      ref={ref}
      initial={directionVariants[direction]}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { user, loading, signInGoogle } = useAuth();
  
  if (loading) return <main className="text-gray-600 text-center py-10">Loading…</main>;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Floating Elements */}
      <motion.div
        className="fixed top-20 left-10 w-2 h-2 bg-gray-400/30 rounded-full"
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed top-40 right-20 w-1 h-1 bg-gray-500/40 rounded-full"
        animate={{ y: [0, 15, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="fixed bottom-40 left-1/4 w-1.5 h-1.5 bg-gray-600/30 rounded-full"
        animate={{ y: [0, -10, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.h1 
              className="text-5xl sm:text-7xl font-bold tracking-tight leading-tight bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              Run quizzes that feel{" "}
              <motion.span 
                className="relative inline-block text-gray-900"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="underline decoration-gray-300 decoration-4 underline-offset-4">
                  buttery-smooth
                </span>
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-gray-200/20 to-gray-300/20 rounded-lg -z-10"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                />
              </motion.span>{" "}
              and engaging.
            </motion.h1>
          </motion.div>
          
          <motion.p 
            className="mt-8 text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Create seamless MCQ & text quizzes, add vibrant images, share a unique code, 
            and get instant, actionable results. Perfect for educators, teams, and creators.
          </motion.p>
          
          <motion.div 
            className="mt-10 flex gap-4 items-center justify-center flex-wrap"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {!user ? (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
  onClick={signInGoogle} 
  className="flex items-center justify-center px-8 py-4 text-lg bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black shadow-lg hover:shadow-xl transition-all duration-300 text-white"
>
  <svg 
    className="w-5 h-5 mr-3" 
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" 
      fill="#fff" 
    />
    <path 
      d="M3.153 7.3455L6.4385 9.755C7.3275 7.554 9.4805 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.159 2 4.828 4.1685 3.153 7.3455Z" 
      fill="#fff" 
    />
    <path 
      d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.6055 17.5455 13.3575 18 12 18C9.399 18 7.1905 16.3415 6.3585 14.027L3.0975 16.5395C4.7525 19.778 8.1135 22 12 22Z" 
      fill="#fff" 
    />
    <path 
      d="M21.8055 10.0415H21V10H12V14H17.6515C17.2555 15.1185 16.536 16.083 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" 
      fill="#fff" 
    />
  </svg>
  Continue with Google
</Button>
              </motion.div>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to="/admin/tests">
                    <Button className="px-8 py-4 text-lg bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black shadow-lg hover:shadow-xl transition-all duration-300 text-white">
                      Create a quiz
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to="/join">
                    <Button className="px-8 py-4 text-lg bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black shadow-lg hover:shadow-xl transition-all duration-300 text-white">
                      Join with code
                    </Button>
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
          
          <motion.p 
            className="mt-8 text-sm text-gray-500 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Craft quizzes with ease. 
            No setup, no hassle, just results.
          </motion.p>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2 bg-gray-400 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto py-20 px-4 relative z-10">
        <AnimatedSection delay={0.2}>
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Everything you need to create amazing quizzes
            </h2>
            <p className="mt-6 text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
              From AI-powered question generation to real-time analytics, we've got every aspect of quiz creation covered.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-3">
  {[
    {
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      title: "AI Question Generation",
      description: "AI creates engaging questions instantly from any topic.",
      delay: 0.1
    },
    {
      icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z",
      title: "Easy Sharing", 
      description: "Share with a simple code—no accounts needed to join.",
      delay: 0.2
    },
    {
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      title: "Real-time Analytics",
      description: "Instant insights with detailed performance tracking.",
      delay: 0.3
    }
  ].map((feature, index) => (
    <AnimatedSection key={index} delay={feature.delay}>
      <div className="group p-6 rounded-xl bg-white border border-gray-200 transition-all duration-300 h-56 flex flex-col hover:shadow-md">
        <div className="w-12 h-12 rounded-lg bg-gray-100 grid place-items-center mb-4 group-hover:bg-gray-200 transition-colors">
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-3 text-gray-900">{feature.title}</h3>
        <p className="text-gray-600 leading-relaxed flex-grow">{feature.description}</p>
      </div>
    </AnimatedSection>
  ))}
</div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-6xl mx-auto py-20 px-4 relative z-10">
        <AnimatedSection delay={0.1}>
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Create your first quiz in minutes
            </h2>
            <p className="mt-6 text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
              Our streamlined process gets you from idea to live quiz faster than ever before.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid gap-12 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Sign in & Create",
              description: "Sign in with Google and start creating your quiz. Add questions manually or let AI generate them for you.",
              bgColor: "bg-gradient-to-br from-gray-700 to-gray-800"
            },
            {
              step: "2", 
              title: "Share the Code",
              description: "Get a unique quiz code and share it with your participants. They can join instantly without any accounts.",
              bgColor: "bg-gradient-to-br from-gray-700 to-gray-800"
            },
            {
              step: "3",
              title: "View Results", 
              description: "Watch responses come in real-time and get detailed analytics to understand performance and engagement.",
              bgColor: "bg-gradient-to-br from-gray-700 to-gray-800"
            }
          ].map((step, index) => (
            <AnimatedSection key={index} delay={index * 0.2} direction="up">
              <motion.div 
                className="text-center group"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className={`w-20 h-20 rounded-full ${step.bgColor} grid place-items-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-2xl font-bold text-white">{step.step}</span>
                </motion.div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{step.description}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      
    </div>
  );
}