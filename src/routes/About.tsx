import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function About() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Card>
        <CardHeader title="About Kuiz" subtitle="Fast, simple, and delightful quizzes" />
        <CardBody className="space-y-3 text-sm text-neutral-700">
          <p>
            Kuiz is a lightweight quiz platform focused on speed and clarity. Create MCQ and text questions,
            add images, share via code/QR, and view detailed results. Built with React, Vite, TailwindCSS,
            Supabase, and Netlify.
          </p>
          <p>
            Source code:{" "}
            <a
              className="underline"
              href="https://github.com/kushu30/kuiz"
              target="_blank"
              rel="noreferrer"
            >
              github.com/kushu30/kuiz
            </a>
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="About the author" />
        <CardBody className="text-sm text-neutral-700 space-y-3">
          <p><span className="font-medium">Kushagra Shukla</span></p>
          <p>
            Computer Science student building tools that solve real problems. Currently working 
            on fintech and AI projects while exploring the intersection of data and user experience.
          </p>
          <div className="flex items-center gap-3 pt-1 text-xs">
            <a 
              href="https://github.com/kushu30" 
              target="_blank" 
              rel="noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity underline"
            >
              GitHub
            </a>
            <span className="opacity-30">•</span>
            <a 
              href="https://linkedin.com/in/kushu30" 
              target="_blank" 
              rel="noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity underline"
            >
              LinkedIn
            </a>
            <span className="opacity-30">•</span>
            <a 
              href="https://twitter.com/itskushu30" 
              target="_blank" 
              rel="noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity underline"
            >
              Twitter
            </a>
            <span className="opacity-30">•</span>
            <a 
              href="mailto:kushu123456789@gmail.com" 
              className="opacity-60 hover:opacity-100 transition-opacity underline"
            >
              Email
            </a>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
