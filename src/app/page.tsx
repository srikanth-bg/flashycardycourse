export default function Home() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-b from-slate-900 to-slate-950">
      <main className="flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Welcome to <span className="text-blue-500">Flashy Cardy Course</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Master any subject with our interactive flashcard learning system.
            <br />
            Create, study, and track your progress all in one place.
          </p>

          {/* Call to Action Card */}
          <div className="mt-16 bg-slate-800/50 border border-white/10 rounded-lg p-12 max-w-2xl mx-auto backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white mb-4">
              Get Started Today
            </h2>
            <p className="text-gray-300 mb-4">
              Sign up or sign in to start creating your<br />
              personalized flashcard decks.
            </p>
            <p className="text-gray-400 text-sm">
              Click the buttons in the header above to get started! 🔥
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
